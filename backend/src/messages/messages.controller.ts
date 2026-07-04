import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Sse,
  MessageEvent,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Observable, fromEvent, map } from 'rxjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { MessagesService, NewMessageEvent } from './messages.service';
import type { Request } from 'express';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(
    private messagesService: MessagesService,
    private events: EventEmitter2,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Envoyer un message' })
  send(@Body() dto: { recipientId: string; content: string; listingId?: string }, @CurrentUser() user: any) {
    return this.messagesService.send(user.id, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Liste de mes conversations' })
  getConversations(@CurrentUser() user: any) {
    return this.messagesService.getConversations(user.id);
  }

  @Get('thread/:contactId')
  @ApiOperation({ summary: 'Fil de discussion avec un contact' })
  getThread(@Param('contactId') contactId: string, @CurrentUser() user: any) {
    return this.messagesService.getThread(user.id, contactId);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Nombre de messages non lus' })
  getUnreadCount(@CurrentUser() user: any) {
    return this.messagesService.getUnreadCount(user.id);
  }

  @Get('or-create/:sellerId')
  @ApiOperation({ summary: 'Obtenir ou créer une conversation avec un vendeur' })
  getOrCreateConversation(
    @Param('sellerId') sellerId: string,
    @Query('listingId') listingId: string,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.getOrCreateConversation(user.id, sellerId, listingId);
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'Supprimer un message' })
  deleteMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.deleteMessage(user.id, messageId);
  }

  @Post(':messageId/delete-for-me')
  @ApiOperation({ summary: 'Supprimer un message pour moi' })
  deleteForMe(
    @Param('messageId') messageId: string,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.deleteMessageForMe(user.id, messageId);
  }

  @Post(':messageId/delete-for-everyone')
  @ApiOperation({ summary: 'Supprimer un message pour tout le monde' })
  deleteForEveryone(
    @Param('messageId') messageId: string,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.deleteMessageForEveryone(user.id, messageId);
  }

  @Post(':contactId/clear')
  @ApiOperation({ summary: 'Effacer toute la conversation avec un contact' })
  clearConversation(
    @Param('contactId') contactId: string,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.clearConversation(user.id, contactId);
  }

  @Sse('stream')
  @ApiOperation({ summary: 'Stream SSE des messages entrants (temps réel)' })
  stream(@CurrentUser() user: any, @Req() req: Request): Observable<MessageEvent> {
    const eventName = `message.new.${user.id}`;

    return new Observable<MessageEvent>((subscriber) => {
      const handler = (event: NewMessageEvent) => {
        subscriber.next({ data: JSON.stringify(event) });
      };

      this.events.on(eventName, handler);

      subscriber.next({ data: JSON.stringify({ type: 'connected', userId: user.id }) });

      req.on('close', () => {
        this.events.off(eventName, handler);
        subscriber.complete();
      });
    });
  }
}
