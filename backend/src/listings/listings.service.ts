import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import {
  CreateListingDto,
  UpdateListingDto,
  ListingQueryDto,
} from './dto/listing.dto';
import { ListingStatus, Role } from '@prisma/client';

// Préfixe de toutes les clés de cache liées aux listings
const CACHE_PREFIX = 'listings';
// TTL : 60 secondes pour les listes publiques
const CACHE_TTL = 60;

@Injectable()
export class ListingsService {
  constructor(
    private prisma: PrismaService,
    private events: EventEmitter2,
    private redis: RedisService,
  ) {}

  // ─── GEOCODING ───────────────────────────────────────────────────────────
  private async geocodeAddress(address?: string | null, city?: string | null): Promise<{ latitude: number; longitude: number } | null> {
    const queryParts = [];
    if (address) queryParts.push(address);
    if (city) queryParts.push(city);
    if (queryParts.length === 0) return null;

    const q = encodeURIComponent(queryParts.join(', '));
    try {
      // Nominatim requires a valid User-Agent
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
        headers: { 'User-Agent': 'KeyoraPlatform/1.0' }
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      }
    } catch (e) {
      console.error('Erreur de géocodage:', e);
    }
    return null;
  }

  async create(dto: CreateListingDto, ownerId: string) {
    let lat = dto.latitude;
    let lng = dto.longitude;

    if (!lat || !lng) {
      const coords = await this.geocodeAddress(dto.address, dto.city);
      if (coords) {
        lat = coords.latitude;
        lng = coords.longitude;
      }
    }

    const listing = await this.prisma.listing.create({
      data: { ...dto, latitude: lat, longitude: lng, ownerId, status: ListingStatus.DRAFT },
      include: { photos: true, owner: { select: { id: true, fullName: true, email: true } } },
    });
    // Invalide toutes les listes en cache (une nouvelle annonce peut affecter les filtres)
    await this.redis.invalidatePattern(`${CACHE_PREFIX}:*`);
    return listing;
  }

  async submit(id: string, userId: string) {
    const listing = await this.findOwned(id, userId);
    if (listing.status !== ListingStatus.DRAFT && listing.status !== ListingStatus.REJECTED) {
      throw new ForbiddenException('Seules les annonces en brouillon ou rejetées peuvent être soumises');
    }
    const updated = await this.prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.PENDING },
    });
    // Une annonce qui passe en PENDING peut disparaître des listes publiques
    await this.redis.invalidatePattern(`${CACHE_PREFIX}:*`);
    return updated;
  }

  async findAll(query: ListingQueryDto) {
    // ─── Clé de cache basée sur tous les paramètres de la requête ───────────
    const cacheKey = `${CACHE_PREFIX}:list:${JSON.stringify(query)}`;
    const cached = await this.redis.get<ReturnType<typeof this.prisma.listing.findMany>>(cacheKey);
    if (cached) return cached;

    // ─── Requête DB ──────────────────────────────────────────────────────────
    const { city, type, propertyType, minPrice, maxPrice, minArea, search, ownerId, page = 1, limit = 12 } = query;
    const skip = (page - 1) * limit;

    const where: any = { status: ListingStatus.PUBLISHED };
    if (ownerId) where.ownerId = ownerId;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (type) where.type = type;
    if (propertyType) where.propertyType = propertyType;
    if (minPrice || maxPrice) where.price = {};
    if (minPrice) where.price.gte = minPrice;
    if (maxPrice) where.price.lte = maxPrice;
    if (minArea) where.area = { gte: minArea };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          photos: { orderBy: { position: 'asc' }, take: 1 },
          owner: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    const result = {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };

    // ─── Mise en cache ───────────────────────────────────────────────────────
    await this.redis.set(cacheKey, result, CACHE_TTL);

    return result;
  }

  async findOne(id: string, userId?: string) {
    // Cache individuel par annonce
    const cacheKey = `${CACHE_PREFIX}:one:${id}`;
    let listing = await this.redis.get<any>(cacheKey);
    
    if (!listing) {
      listing = await this.prisma.listing.findUnique({
        where: { id },
        include: {
          photos: { orderBy: { position: 'asc' } },
          owner: { select: { id: true, fullName: true, avatarUrl: true, phone: true, email: true } },
          _count: { select: { favorites: true } },
        },
      });
      if (!listing) throw new NotFoundException('Annonce introuvable');

      // Cache 5 minutes pour le détail (rarement modifié)
      await this.redis.set(cacheKey, listing, 300);
    }

    // Incrémenter les vues même sur hit cache (en arrière-plan, sans bloquer)
    this.prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    // Ajouter le champ dynamique isFavorited
    let isFavorited = false;
    if (userId) {
      const fav = await this.prisma.favorite.findUnique({
        where: { userId_listingId: { userId, listingId: id } },
      });
      isFavorited = !!fav;
    }

    return {
      ...listing,
      isFavorited,
    };
  }

  async update(id: string, dto: UpdateListingDto, userId: string, role: Role) {
    const listing = await this.findOwned(id, userId, role);
    
    let lat = dto.latitude ?? listing.latitude;
    let lng = dto.longitude ?? listing.longitude;

    if ((dto.address || dto.city) && (!dto.latitude || !dto.longitude)) {
      const coords = await this.geocodeAddress(
        dto.address !== undefined ? dto.address : listing.address,
        dto.city !== undefined ? dto.city : listing.city
      );
      if (coords) {
        lat = coords.latitude;
        lng = coords.longitude;
      }
    }

    const newOwnerId = (role === Role.SUPERADMIN && dto.ownerId) ? dto.ownerId : undefined;

    const updateData: any = { ...dto, latitude: lat, longitude: lng };
    if (newOwnerId) {
      updateData.ownerId = newOwnerId;
    }

    let updated;
    if (listing.status === ListingStatus.PUBLISHED && role !== Role.SUPERADMIN && role !== Role.MODERATOR) {
      updated = await this.prisma.listing.update({
        where: { id },
        data: { ...updateData, status: ListingStatus.PENDING },
      });
    } else {
      updated = await this.prisma.listing.update({ where: { id }, data: updateData });
    }
    // Invalide le cache de cette annonce + toutes les listes
    await Promise.all([
      this.redis.del(`${CACHE_PREFIX}:one:${id}`),
      this.redis.invalidatePattern(`${CACHE_PREFIX}:list:*`),
    ]);
    return updated;
  }

  async remove(id: string, userId: string, role: Role) {
    await this.findOwned(id, userId, role);
    await this.prisma.listing.delete({ where: { id } });
    await Promise.all([
      this.redis.del(`${CACHE_PREFIX}:one:${id}`),
      this.redis.invalidatePattern(`${CACHE_PREFIX}:list:*`),
    ]);
    return { message: 'Annonce supprimée' };
  }

  async findPending() {
    return this.prisma.listing.findMany({
      where: { status: ListingStatus.PENDING },
      orderBy: { updatedAt: 'asc' },
      include: {
        photos: { take: 1 },
        owner: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async findOwned(id: string, userId: string, role?: Role) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Annonce introuvable');
    if (role === Role.SUPERADMIN || role === Role.MODERATOR) return listing;
    if (listing.ownerId !== userId) {
      throw new ForbiddenException("Vous n'êtes pas propriétaire de cette annonce");
    }
    return listing;
  }

  async toggleFavorite(listingId: string, userId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (existing) {
      await this.prisma.favorite.delete({
        where: { userId_listingId: { userId, listingId } },
      });
      return { favorited: false };
    }
    await this.prisma.favorite.create({ data: { userId, listingId } });
    return { favorited: true };
  }

  async getUserFavorites(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            photos: { take: 1 },
            owner: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: { savedAt: 'desc' },
    });
  }

  async getMyListings(userId: string) {
    return this.prisma.listing.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { photos: { take: 1 }, _count: { select: { favorites: true } } },
    });
  }

  /** Appelé par ModerationService après approbation — invalide le cache */
  async invalidateListingCache(listingId: string) {
    await Promise.all([
      this.redis.del(`${CACHE_PREFIX}:one:${listingId}`),
      this.redis.invalidatePattern(`${CACHE_PREFIX}:list:*`),
    ]);
  }

  async getAllListingsForAdmin(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {
      status: {
        in: [ListingStatus.PUBLISHED, ListingStatus.REJECTED],
      },
    };
    
    if (status === 'PUBLISHED' || status === 'REJECTED') {
      where.status = status;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          photos: { take: 1, orderBy: { position: 'asc' } },
          owner: { select: { id: true, fullName: true, email: true, phone: true } },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async bulkDeleteUserListings(userId: string) {
    const result = await this.prisma.listing.deleteMany({
      where: { ownerId: userId },
    });
    
    await Promise.all([
      this.redis.invalidatePattern(`${CACHE_PREFIX}:one:*`),
      this.redis.invalidatePattern(`${CACHE_PREFIX}:list:*`),
    ]);
    
    return { message: `${result.count} annonces supprimées` };
  }
}
