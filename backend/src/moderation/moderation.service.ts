import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { ListingStatus, ModerationAction } from '../common/enums';

@Injectable()
export class ModerationService {
  constructor(
    private prisma: PrismaService,
    private events: EventEmitter2,
    private mail: MailService,
  ) {}

  // ─── File d'attente ───────────────────────────────────────────────────────
  async getPendingQueue() {
    return this.prisma.listing.findMany({
      where: { status: ListingStatus.PENDING },
      orderBy: { updatedAt: 'asc' },
      include: {
        photos: { orderBy: { position: 'asc' }, take: 5 },
        owner: { select: { id: true, fullName: true, email: true, phone: true } },
        _count: { select: { photos: true } },
      },
    });
  }

  // ─── Approuver une annonce (PENDING → PUBLISHED) ──────────────────────────
  async approve(listingId: string, moderatorId: string) {
    const listing = await this.getPendingListing(listingId);

    const [updated] = await this.prisma.$transaction([
      this.prisma.listing.update({
        where: { id: listingId },
        data: {
          status: ListingStatus.PUBLISHED,
          publishedAt: new Date(),
          rejectionNote: null,
        },
        include: { owner: true },
      }),
      this.prisma.moderationLog.create({
        data: {
          listingId,
          moderatorId,
          action: ModerationAction.APPROVED,
        },
      }),
    ]);

    // Notifier le propriétaire
    await this.mail.sendModerationEmail(
      updated.owner.email,
      updated.owner.fullName,
      updated.title,
      'approved',
    );

    // Émettre l'événement pour les alertes de zone
    this.events.emit('listing.published', updated);

    return { message: 'Annonce approuvée et publiée', listing: updated };
  }

  // ─── Rejeter une annonce (PENDING → REJECTED) ─────────────────────────────
  async reject(listingId: string, moderatorId: string, reason: string) {
    const listing = await this.getPendingListing(listingId);

    const [updated] = await this.prisma.$transaction([
      this.prisma.listing.update({
        where: { id: listingId },
        data: {
          status: ListingStatus.REJECTED,
          rejectionNote: reason,
        },
        include: { owner: true },
      }),
      this.prisma.moderationLog.create({
        data: {
          listingId,
          moderatorId,
          action: ModerationAction.REJECTED,
          reason,
        },
      }),
    ]);

    // Notifier le propriétaire
    await this.mail.sendModerationEmail(
      updated.owner.email,
      updated.owner.fullName,
      updated.title,
      'rejected',
      reason,
    );

    return { message: 'Annonce rejetée', listing: updated };
  }

  // ─── Journal de modération ────────────────────────────────────────────────
  async getLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.moderationLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: { select: { id: true, title: true } },
          moderator: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.moderationLog.count(),
    ]);
    return { data, meta: { total, page, limit } };
  }

  // ─── Stats modération ─────────────────────────────────────────────────────
  async getStats() {
    const [pending, approved, rejected, total] = await this.prisma.$transaction([
      this.prisma.listing.count({ where: { status: ListingStatus.PENDING } }),
      this.prisma.listing.count({ where: { status: ListingStatus.PUBLISHED } }),
      this.prisma.listing.count({ where: { status: ListingStatus.REJECTED } }),
      this.prisma.listing.count(),
    ]);
    return { pending, approved, rejected, total };
  }

  private async getPendingListing(id: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Annonce introuvable');
    if (listing.status !== ListingStatus.PENDING) {
      throw new BadRequestException('Seules les annonces en attente peuvent être modérées');
    }
    return listing;
  }
}
