import { Injectable, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

export interface NewMessageEvent {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  recipientId: string;
  listingId?: string | null;
  listingTitle?: string | null;
  sentAt: Date;
}

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private events: EventEmitter2,
  ) {}

  async send(senderId: string, dto: { recipientId: string; content?: string; listingId?: string; photoUrl?: string; photoCaption?: string }) {
    const message = await this.prisma.message.create({
      data: {
        senderId,
        recipientId: dto.recipientId,
        listingId: dto.listingId,
        content: dto.content,
      },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
        recipient: { select: { id: true, fullName: true, avatarUrl: true } },
        listing: { select: { id: true, title: true } },
      },
    });

    const event: NewMessageEvent = {
      id: message.id,
      content: message.content || dto.photoCaption || 'Photo',
      senderId: message.senderId,
      senderName: message.sender.fullName,
      senderAvatar: message.sender.avatarUrl,
      recipientId: message.recipientId,
      listingId: message.listingId,
      listingTitle: message.listing?.title ?? null,
      sentAt: message.sentAt,
    };
    this.events.emit(`message.new.${dto.recipientId}`, event);

    return message;
  }

  async getConversations(userId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: userId, deletedBySender: false },
          { senderId: userId, recipientId: { not: userId }, deletedBySender: false },
          { senderId: { not: userId }, recipientId: userId, deletedByRecipient: false },
        ],
        deletedForEveryone: false,
      },
      orderBy: { sentAt: 'desc' },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
        recipient: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    const contactMap = new Map<string, {
      contactId: string;
      contactName: string;
      avatarUrl: string | null;
      lastMessage: string;
      lastMessageDate: Date;
      unread: boolean;
    }>();

    messages.forEach((msg) => {
      const contactId = msg.senderId === userId ? msg.recipientId : msg.senderId;
      const contact = msg.senderId === userId ? msg.recipient : msg.sender;

      if (!contactMap.has(contactId)) {
        contactMap.set(contactId, {
          contactId,
          contactName: contact.fullName,
          avatarUrl: contact.avatarUrl,
          lastMessage: msg.content || 'Photo',
          lastMessageDate: msg.sentAt,
          unread: msg.recipientId === userId && !msg.read,
        });
      }
    });

    return Array.from(contactMap.values());
  }

  async getThread(userId: string, contactId: string) {
    if (userId === contactId) {
      throw new ForbiddenException('Cannot retrieve messages with yourself');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: contactId, deletedBySender: false },
          { senderId: contactId, recipientId: userId, deletedByRecipient: false },
        ],
        deletedForEveryone: false,
      },
      orderBy: { sentAt: 'asc' },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
        listing: { select: { id: true, title: true } },
      },
    });

    const hasAccess = messages.length === 0 || messages.some(msg => msg.senderId === userId || msg.recipientId === userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    // Mark incoming messages as read
    await this.prisma.message.updateMany({
      where: {
        senderId: contactId,
        recipientId: userId,
        read: false,
      },
      data: { read: true },
    });

    return messages;
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: {
        recipientId: userId,
        read: false,
      },
    });
    return { unread: count };
  }

  async getOrCreateConversation(userId: string, sellerId: string, listingId?: string) {
    const existingMessage = await this.prisma.message.findFirst({
      where: {
        OR: [
          { senderId: userId, recipientId: sellerId },
          { senderId: sellerId, recipientId: userId },
        ],
      },
    });

    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: { id: true, fullName: true, avatarUrl: true, email: true },
    });

    if (!seller) {
      throw new Error('Seller not found');
    }

    return {
      conversationExists: !!existingMessage,
      seller,
    };
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Unauthorized: Can only delete your own messages');
    }

    await this.prisma.message.delete({
      where: { id: messageId },
    });

    return { success: true, deletedMessageId: messageId };
  }

  async deleteMessageForMe(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId && message.recipientId !== userId) {
      throw new ForbiddenException('Unauthorized');
    }

    if (message.senderId === userId) {
      await this.prisma.message.update({
        where: { id: messageId },
        data: { deletedBySender: true },
      });
    } else {
      await this.prisma.message.update({
        where: { id: messageId },
        data: { deletedByRecipient: true },
      });
    }

    return { success: true, messageId };
  }

  async deleteMessageForEveryone(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Unauthorized: Can only delete your own messages');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: {
        deletedForEveryone: true,
        deletedAt: new Date(),
        deletionReason: 'Deleted by sender',
      },
    });

    return { success: true, messageId };
  }

  async clearConversation(userId: string, contactId: string) {
    // 1. Pour les messages envoyés par l'utilisateur demandeur, on marque comme supprimé par l'expéditeur
    await this.prisma.message.updateMany({
      where: { senderId: userId, recipientId: contactId },
      data: { deletedBySender: true },
    });

    // 2. Pour les messages reçus par l'utilisateur demandeur, on marque comme supprimé par le destinataire
    await this.prisma.message.updateMany({
      where: { senderId: contactId, recipientId: userId },
      data: { deletedByRecipient: true },
    });

    return { success: true, message: 'Conversation cleared' };
  }
}
