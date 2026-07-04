import { Controller, Get, UseGuards, Module } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { Role, ListingStatus } from '../common/enums';

@Injectable()
class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOwnerStats(userId: string) {
    const [total, published, pending, rejected, favorites, views] =
      await this.prisma.$transaction([
        this.prisma.listing.count({ where: { ownerId: userId } }),
        this.prisma.listing.count({ where: { ownerId: userId, status: ListingStatus.PUBLISHED } }),
        this.prisma.listing.count({ where: { ownerId: userId, status: ListingStatus.PENDING } }),
        this.prisma.listing.count({ where: { ownerId: userId, status: ListingStatus.REJECTED } }),
        this.prisma.favorite.count({ where: { listing: { ownerId: userId } } }),
        this.prisma.listing.aggregate({
          where: { ownerId: userId },
          _sum: { viewCount: true },
        }),
      ]);

    const recentListings = await this.prisma.listing.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { photos: { take: 1 }, _count: { select: { favorites: true } } },
    });

    return {
      stats: {
        total, published, pending, rejected,
        favorites, views: views._sum.viewCount || 0,
      },
      recentListings,
    };
  }

  async getAdminStats() {
    const [publishedListings, pendingListings, rejectedListings, totalUsers, totalListings, blogPosts] =
      await this.prisma.$transaction([
        this.prisma.listing.count({ where: { status: ListingStatus.PUBLISHED } }),
        this.prisma.listing.count({ where: { status: ListingStatus.PENDING } }),
        this.prisma.listing.count({ where: { status: ListingStatus.REJECTED } }),
        this.prisma.user.count(),
        this.prisma.listing.count(),
        this.prisma.blogPost.count(),
      ]);

    const viewsAggregate = await this.prisma.listing.aggregate({ _sum: { viewCount: true } });
    const totalViews = viewsAggregate._sum.viewCount || 0;

    const recentUsers = await this.prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        lastLogin: true,
        loginCount: true,
      },
    });

    const listingsByCityRaw = await this.prisma.listing.findMany({
      where: { city: { not: null } },
      select: { city: true },
    });

    const cityCounts = listingsByCityRaw.reduce<Record<string, number>>((acc, listing) => {
      const city = listing.city?.trim();
      if (!city) return acc;
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});

    const listingsByCity = Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 8);

    return {
      stats: {
        users: totalUsers,
        listings: totalListings,
        published: publishedListings,
        pending: pendingListings,
        rejected: rejectedListings,
        totalUsers,
        totalListings,
        publishedListings,
        pendingListings,
        rejectedListings,
        blogPosts,
        totalViews,
        growth: '+18.5%',
      },
      recentUsers,
      listingsByCity,
    };
  }

  async getAllUsersForAdmin() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        loginHistory: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
        _count: {
          select: { listings: true, favorites: true, messagesSent: true }
        }
      }
    });

    return users.map(u => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
      loginCount: u.loginCount,
      loginHistory: u.loginHistory,
      listingsCount: u._count.listings,
      favoritesCount: u._count.favorites,
      messagesCount: u._count.messagesSent,
    }));
  }

  async getAllListingsForAdmin() {
    return this.prisma.listing.findMany({
      where: { status: { in: [ListingStatus.PUBLISHED, ListingStatus.REJECTED] } },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { fullName: true, email: true, phone: true } },
        moderationLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { moderator: { select: { fullName: true, role: true } } },
        },
      },
    });
  }

  async getBuyerStats(userId: string) {
    const [favorites, unreadMessages, alerts] = await this.prisma.$transaction([
      this.prisma.favorite.count({ where: { userId } }),
      this.prisma.message.count({ where: { recipientId: userId, read: false } }),
      this.prisma.alertZone.count({ where: { userId, active: true } }),
    ]);
    return { stats: { favorites, unreadMessages, alerts } };
  }
}

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('owner')
  @UseGuards(RolesGuard)
  @Roles(Role.SELLER)
  @ApiOperation({ summary: 'Tableau de bord propriétaire/agent' })
  getOwnerDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getOwnerStats(user.id);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiOperation({ summary: "Tableau de bord super administrateur" })
  getAdminDashboard() {
    return this.dashboardService.getAdminStats();
  }

  @Get('admin/users')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Liste de tous les utilisateurs' })
  getAdminUsers() {
    return this.dashboardService.getAllUsersForAdmin();
  }

  @Get('admin/listings')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Liste de toutes les annonces' })
  getAdminListings() {
    return this.dashboardService.getAllListingsForAdmin();
  }

  @Get('buyer')
  @ApiOperation({ summary: 'Tableau de bord acheteur' })
  getBuyerDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getBuyerStats(user.id);
  }
}

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
