import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

export interface NewNotificationEvent {
  id: string;
  title: string;
  content: string;
  type: string;
  link?: string | null;
  read: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private events: EventEmitter2,
  ) {}

  async create(userId: string, title: string, content: string, type: string, link?: string) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        content,
        type,
        link,
      },
    });

    const event: NewNotificationEvent = {
      id: notification.id,
      title: notification.title,
      content: notification.content,
      type: notification.type,
      link: notification.link,
      read: notification.read,
      createdAt: notification.createdAt,
    };

    this.events.emit(`notification.new.${userId}`, event);
    return notification;
  }

  async getAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification non trouvée');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Non autorisé');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async delete(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification non trouvée');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Non autorisé');
    }

    await this.prisma.notification.delete({
      where: { id },
    });

    return { success: true, deletedId: id };
  }
}
