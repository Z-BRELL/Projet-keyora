import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    JwtModule.register({}),
    PrismaModule
  ],
  providers: [ChatGateway],
  exports: [ChatGateway]
})
export class ChatModule {}
