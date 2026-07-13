import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Logger, UseGuards } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // En production, restreindre à l'URL du frontend
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  
  // Map userId -> socketId pour cibler les envois
  private userSockets = new Map<string, string>();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      const userId = decoded.sub;
      this.userSockets.set(userId, client.id);
      client.data.userId = userId;
      
      this.logger.log(`Client connecté: ${client.id} (User: ${userId})`);
      
      // Optionnel: Notifier les autres utilisateurs du statut "en ligne"
      this.server.emit('userStatus', { userId, status: 'online' });
    } catch (error) {
      this.logger.error(`Erreur de connexion Socket: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.userSockets.delete(userId);
      this.logger.log(`Client déconnecté: ${client.id} (User: ${userId})`);
      this.server.emit('userStatus', { userId, status: 'offline' });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { recipientId: string; content: string; listingId?: string }
  ) {
    const senderId = client.data.userId;

    if (!senderId) return;

    try {
      // Sauvegarder le message en DB
      const message = await this.prisma.message.create({
        data: {
          content: payload.content,
          senderId,
          recipientId: payload.recipientId,
          listingId: payload.listingId,
        },
        include: {
          sender: { select: { id: true, fullName: true, avatarUrl: true } },
        }
      });

      // Envoyer au destinataire s'il est connecté
      const recipientSocketId = this.userSockets.get(payload.recipientId);
      if (recipientSocketId) {
        this.server.to(recipientSocketId).emit('newMessage', message);
      }

      // Renvoyer l'accusé de réception à l'expéditeur
      client.emit('messageSent', message);
    } catch (error) {
      this.logger.error(`Erreur d'envoi de message: ${error.message}`);
      client.emit('messageError', { message: 'Impossible d\'envoyer le message. Le destinataire n\'existe peut-être plus.' });
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageIds: string[] }
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    await this.prisma.message.updateMany({
      where: {
        id: { in: payload.messageIds },
        recipientId: userId,
      },
      data: { read: true },
    });

    // Informer les expéditeurs originaux que leurs messages ont été lus
    // Note: Pour une implémentation avancée, on grouperait par expéditeur.
  }
}
