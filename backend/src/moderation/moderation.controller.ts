import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { Role } from '../common/enums';

class RejectDto {
  @ApiProperty({ example: 'Photos insuffisantes ou description incomplète' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

@ApiTags('moderation')
@Controller('moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MODERATOR, Role.SUPERADMIN)
@ApiBearerAuth()
export class ModerationController {
  constructor(private moderationService: ModerationService) {}

  @Get('queue')
  @ApiOperation({ summary: 'File d\'attente des annonces PENDING' })
  getPendingQueue() {
    return this.moderationService.getPendingQueue();
  }

  @Post('listings/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approuver une annonce (PENDING → PUBLISHED)' })
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.moderationService.approve(id, user.id);
  }

  @Post('listings/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rejeter une annonce (PENDING → REJECTED)' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectDto,
    @CurrentUser() user: any,
  ) {
    return this.moderationService.reject(id, user.id, dto.reason);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Journal des décisions de modération' })
  getLogs(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.moderationService.getLogs(+page, +limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques de modération' })
  getStats() {
    return this.moderationService.getStats();
  }
}
