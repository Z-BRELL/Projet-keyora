import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email/email.service';
import { ReportStatus, Role } from '@prisma/client';

export interface CreateReportDto {
  listingId: string;
  reason: string;
  description: string;
}

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async createReport(userId: string, dto: CreateReportDto) {
    // Check if listing exists
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      include: { owner: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Prevent self-reporting
    if (listing.ownerId === userId) {
      throw new ForbiddenException('Cannot report your own listing');
    }

    // Check if already reported by this user
    const existingReport = await this.prisma.report.findFirst({
      where: {
        reporterId: userId,
        listingId: dto.listingId,
        status: ReportStatus.PENDING,
      },
    });

    if (existingReport) {
      throw new ForbiddenException('You have already reported this listing');
    }

    // Create report
    await this.prisma.report.create({
      data: {
        listingId: dto.listingId,
        reporterId: userId,
        reason: dto.reason,
        description: dto.description,
        status: ReportStatus.PENDING,
      },
    });

    // Notify moderators
    const moderators = await this.prisma.user.findMany({
      where: { role: { in: [Role.MODERATOR, Role.SUPERADMIN] } },
    });

    for (const mod of moderators) {
      await this.emailService.sendReportNotification(
        mod.email,
        listing.title,
        dto.reason,
      );
    }

    return { success: true, message: 'Report submitted successfully' };
  }

  async getReports(userId: string, role: string) {
    if (role !== Role.MODERATOR && role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only moderators can view reports');
    }

    const reports = await this.prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        listing: { select: { id: true, title: true, price: true, address: true } },
        reporter: { select: { id: true, fullName: true, email: true } },
      },
    });

    return reports;
  }

  async approveReport(reportId: string, action: 'APPROVED' | 'REJECTED', moderatorId?: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        listing: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: action === 'APPROVED' ? ReportStatus.APPROVED : ReportStatus.REJECTED,
        resolvedAt: new Date(),
        resolvedBy: moderatorId,
        resolutionNotes: action === 'APPROVED' ? 'Listing reviewed and rejected' : 'Report rejected',
      },
    });

    // If approved, reject the listing
    if (action === 'APPROVED') {
      await this.prisma.listing.update({
        where: { id: report.listingId },
        data: {
          status: 'REJECTED',
          rejectionNote: 'Listing was reported and reviewed by moderators',
        },
      });

      // Notify listing owner
      const owner = await this.prisma.user.findUnique({
        where: { id: report.listing.ownerId },
      });

      if (owner) {
        await this.emailService.sendListingRejectedEmail(
          owner.email,
          report.listing.title,
          'Your listing was reported by users for policy violations',
        );
      }
    }

    return { success: true, message: `Report ${action}` };
  }

  async getMyReports(userId: string) {
    const reports = await this.prisma.report.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: { select: { id: true, title: true } },
      },
    });

    return reports;
  }
}
