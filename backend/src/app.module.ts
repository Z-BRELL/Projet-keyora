import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { HealthModule } from './common/health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ListingsModule } from './listings/listings.module';
import { ModerationModule } from './moderation/moderation.module';
import { SearchModule } from './search/search.module';
import { AlertsModule } from './alerts/alerts.module';
import { MediaModule } from './media/media.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BlogModule } from './blog/blog.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { SupportRequestsModule } from './support-requests/support-requests.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { ttl: 60000, limit: 100 }, // Default: 100 requests per minute
      { ttl: 60000, limit: 10 }, // Login: 10 attempts per minute
    ]),
    EventEmitterModule.forRoot(),
    RedisModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    ModerationModule,
    SearchModule,
    AlertsModule,
    MediaModule,
    MessagesModule,
    NotificationsModule,
    BlogModule,
    DashboardModule,
    ReportsModule,
    SupportRequestsModule,
    ChatModule,
  ],
})
export class AppModule {}
