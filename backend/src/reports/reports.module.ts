import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email/email.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, PrismaService, EmailService],
  exports: [ReportsService],
})
export class ReportsModule {}
