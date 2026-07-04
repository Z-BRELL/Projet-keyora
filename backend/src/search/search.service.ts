import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface PolygonSearchDto {
  polygon: number[][];   // [[lng,lat], [lng,lat], ...]
  type?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  page?: number;
  limit?: number;
}

export interface RadiusSearchDto {
  lat: number;
  lng: number;
  radiusKm: number;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  // ─── Recherche par polygone dessiné sur la carte ──────────────────────────
  // FIX #5: Use parameterized queries to prevent SQL injection
  async searchByPolygon(dto: PolygonSearchDto) {
    const { polygon, type, propertyType, minPrice, maxPrice, minArea, maxArea } = dto;
    const page = dto.page || 1;
    const limit = Math.min(dto.limit || 12, 50); // Prevent abuse
    const offset = (page - 1) * limit;

    // Validate polygon
    if (!polygon || polygon.length < 3) {
      throw new BadRequestException('Polygon must have at least 3 points');
    }

    // Validate enum values
    const allowedTypes = ['SALE', 'RENT'];
    const allowedProps = ['APARTMENT', 'HOUSE', 'LAND', 'COMMERCIAL'];
    
    if (type && !allowedTypes.includes(type)) {
      throw new BadRequestException('Invalid listing type');
    }
    if (propertyType && !allowedProps.includes(propertyType)) {
      throw new BadRequestException('Invalid property type');
    }

    // Construct polygon WKT from coordinates
    const coords = polygon.map(([lng, lat]) => `${lng} ${lat}`).join(', ');
    const firstPoint = `${polygon[0][0]} ${polygon[0][1]}`;
    const wktPolygon = `POLYGON((${coords}, ${firstPoint}))`;

    // Build conditions with parameterized queries
    const conditions: Prisma.Sql[] = [
      Prisma.sql`l.status = 'PUBLISHED'`,
      Prisma.sql`ST_Within(
        ST_SetSRID(ST_MakePoint(l.longitude, l.latitude), 4326),
        ST_GeomFromText(${wktPolygon}, 4326)
      )`,
    ];

    if (type) conditions.push(Prisma.sql`l.type = ${type}`);
    if (propertyType) conditions.push(Prisma.sql`l."propertyType" = ${propertyType}`);
    if (minPrice !== undefined) conditions.push(Prisma.sql`l.price >= ${minPrice}`);
    if (maxPrice !== undefined) conditions.push(Prisma.sql`l.price <= ${maxPrice}`);
    if (minArea !== undefined) conditions.push(Prisma.sql`l.area >= ${minArea}`);
    if (maxArea !== undefined) conditions.push(Prisma.sql`l.area <= ${maxArea}`);

    const where = Prisma.join(conditions, ' AND ');

    const [rows, countResult] = await Promise.all([
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT
          l.id, l.title, l.price, l.area, l.city, l.address,
          l.latitude, l.longitude, l.type, l."propertyType",
          l."viewCount", l."publishedAt",
          u."fullName" as owner_name, u."avatarUrl" as owner_avatar,
          (
            SELECT json_agg(json_build_object('url', p.url, 'position', p.position))
            FROM "ListingPhoto" p
            WHERE p."listingId" = l.id
            ORDER BY p.position
            LIMIT 1
          ) as photos
        FROM "Listing" l
        JOIN "User" u ON u.id = l."ownerId"
        WHERE ${where}
        ORDER BY l."publishedAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `),
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT COUNT(*)::int as total
        FROM "Listing" l
        WHERE ${where}
      `),
    ]);

    const total = countResult[0]?.total || 0;

    return {
      data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Recherche par rayon autour d'un point ────────────────────────────────
  // FIX #5: Validate parameters to prevent injection
  async searchByRadius(dto: RadiusSearchDto) {
    const { lat, lng, radiusKm, type, minPrice, maxPrice } = dto;
    const page = dto.page || 1;
    const limit = Math.min(dto.limit || 12, 50); // Prevent abuse
    const offset = (page - 1) * limit;
    
    // Validate parameters
    if (typeof lat !== 'number' || typeof lng !== 'number' || typeof radiusKm !== 'number') {
      throw new BadRequestException('Invalid coordinates or radius');
    }
    if (radiusKm <= 0 || radiusKm > 100) {
      throw new BadRequestException('Radius must be between 0 and 100 km');
    }

    const radiusMeters = radiusKm * 1000;
    
    // Validate enum values
    const allowedTypes = ['SALE', 'RENT'];
    if (type && !allowedTypes.includes(type)) {
      throw new BadRequestException('Invalid listing type');
    }

    const conditions: Prisma.Sql[] = [
      Prisma.sql`l.status = 'PUBLISHED'`,
      Prisma.sql`ST_DWithin(
        ST_SetSRID(ST_MakePoint(l.longitude, l.latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusMeters}
      )`,
    ];
    
    if (type) conditions.push(Prisma.sql`l.type = ${type}`);
    if (minPrice !== undefined) conditions.push(Prisma.sql`l.price >= ${minPrice}`);
    if (maxPrice !== undefined) conditions.push(Prisma.sql`l.price <= ${maxPrice}`);

    const where = Prisma.join(conditions, ' AND ');

    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        l.id, l.title, l.price, l.area, l.city, l.address,
        l.latitude, l.longitude, l.type, l."propertyType",
        ROUND(
          ST_Distance(
            ST_SetSRID(ST_MakePoint(l.longitude, l.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
          ) / 1000.0
        , 2) as distance_km,
        (
          SELECT p.url FROM "ListingPhoto" p
          WHERE p."listingId" = l.id ORDER BY p.position LIMIT 1
        ) as cover_url
      FROM "Listing" l
      WHERE ${where}
      ORDER BY distance_km ASC
      LIMIT ${limit} OFFSET ${offset}
    `);

    return { data: rows, meta: { lat, lng, radiusKm, count: rows.length } };
  }

  // ─── Autocomplétion des villes ────────────────────────────────────────────
  async getCitySuggestions(query: string) {
    // FIX #5: Validate query input
    if (!query || query.length < 1 || query.length > 100) {
      throw new BadRequestException('Query must be between 1 and 100 characters');
    }

    const rows = await this.prisma.$queryRaw<{ city: string; count: number }[]>`
      SELECT city, COUNT(*)::int as count
      FROM "Listing"
      WHERE status = 'PUBLISHED'
        AND city ILIKE ${`${query}%`}
      GROUP BY city
      ORDER BY count DESC
      LIMIT 8
    `;
    return rows;
  }
}
