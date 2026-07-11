import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  Sse,
  MessageEvent,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { NotificationsService, NewNotificationEvent } from './notifications.service';
import type { Request } from 'express';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private events: EventEmitter2,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liste de mes notifications' })
  getAll(@CurrentUser() user: any) {
    return this.notificationsService.getAll(user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une notification' })
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.delete(user.id, id);
  }

  @Sse('stream')
  @ApiOperation({ summary: 'Stream SSE des notifications entrantes (temps réel)' })
  stream(@CurrentUser() user: any, @Req() req: Request): Observable<MessageEvent> {
    const eventName = `notification.new.${user.id}`;

    return new Observable<MessageEvent>((subscriber) => {
      const handler = (event: NewNotificationEvent) => {
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
