import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/profile.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            messagesSent: true,
            favorites: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    if (user.role === Role.SELLER || user.role === Role.SUPERADMIN) {
      const listings = await this.prisma.listing.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          status: true,
          _count: { select: { favorites: true } },
        },
      });

      return {
        ...user,
        sellerStats: {
          publishedListings: listings.filter(l => l.status === 'PUBLISHED').length,
          totalListings: listings.length,
          totalFavorites: listings.reduce((sum, l) => sum + l._count.favorites, 0),
        },
      };
    }

    return user;
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        listings: {
          where: { status: 'PUBLISHED' },
          select: { id: true, title: true, price: true },
          take: 6,
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) throw new ForbiddenException('Email already in use');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName || undefined,
        phone: dto.phone || undefined,
        email: dto.email || undefined,
        avatarUrl: dto.avatarUrl || undefined,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
      },
    });
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    // Dépublier toutes les annonces de l'utilisateur
    await this.prisma.listing.updateMany({
      where: { ownerId: userId },
      data: { status: 'DRAFT' },
    });

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@keyora.local`,
        passwordHash: '',
        fullName: 'Deleted User',
        phone: null,
        avatarUrl: null,
        isActive: false,      // Désactive le compte
        refreshToken: null,   // Déconnecte toutes les sessions
      },
    });
  }

  async getSellerStats(sellerId: string) {
    const listings = await this.prisma.listing.findMany({
      where: { ownerId: sellerId },
      select: {
        id: true,
        status: true,
        viewCount: true,
        createdAt: true,
        _count: { select: { favorites: true } },
      },
    });

    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: sellerId },
          { recipientId: sellerId },
        ],
      },
      select: { id: true, sentAt: true },
    });

    const favorites = await this.prisma.favorite.findMany({
      where: {
        listing: { ownerId: sellerId },
      },
    });

    return {
      totalListings: listings.length,
      publishedListings: listings.filter(l => l.status === 'PUBLISHED').length,
      pendingListings: listings.filter(l => l.status === 'PENDING').length,
      rejectedListings: listings.filter(l => l.status === 'REJECTED').length,
      totalViews: listings.reduce((sum, l) => sum + l.viewCount, 0),
      totalFavorites: favorites.length,
      totalMessages: messages.length,
      avgResponseTime: this.calculateAvgResponseTime(messages),
      listingsByMonth: this.groupByMonth(listings),
    };
  }

  private calculateAvgResponseTime(messages: any[]): number {
    if (messages.length < 2) return 0;
    const times = messages
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
      .slice(0, -1);
    
    let totalTime = 0;
    for (let i = 0; i < times.length - 1; i++) {
      totalTime += new Date(times[i + 1].sentAt).getTime() - new Date(times[i].sentAt).getTime();
    }
    return Math.round(totalTime / (times.length * 1000 * 60));
  }

  private groupByMonth(listings: any[]) {
    const grouped: Record<string, number> = {};
    listings.forEach(l => {
      const month = new Date(l.createdAt).toISOString().slice(0, 7);
      grouped[month] = (grouped[month] || 0) + 1;
    });
    return grouped;
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            favorites: true,
            messagesSent: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRole(userId: string, role: Role) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === Role.SUPERADMIN) {
      throw new ForbiddenException('Cannot change superadmin role');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, fullName: true, email: true, role: true },
    });
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === Role.SUPERADMIN) {
      throw new ForbiddenException('Cannot delete superadmin');
    }
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'User deleted successfully' };
  }

  async adminResetPassword(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    // Generate temporary password
    const tempPassword = 'Keyora-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        passwordHash: hashedPassword,
        verifyToken: null,
        refreshToken: null, // logout user sessions
      },
    });

    return { temporaryPassword: tempPassword };
  }

  async adminUpdateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new ForbiddenException('Email already in use');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName || undefined,
        phone: dto.phone !== undefined ? dto.phone : undefined,
        email: dto.email || undefined,
        avatarUrl: dto.avatarUrl || undefined,
        isVerified: dto.isVerified !== undefined ? dto.isVerified : undefined,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
      },
    });
  }

  async verifyUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { email },
      data: { isVerified: true, verifyToken: null },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isVerified: true,
      },
    });
  }

  async searchUsers(query: string, currentUserId: string) {
    if (!query || query.trim().length < 2) return [];
    return this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        fullName: { contains: query, mode: 'insensitive' },
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        role: true,
      },
      take: 10,
    });
  }
}
