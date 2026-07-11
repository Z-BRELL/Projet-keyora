import { Controller, Get, Post, Patch, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupportRequestsService } from './support-requests.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

@ApiTags('support-requests')
@Controller('support-requests')
export class SupportRequestsController {
  constructor(private supportRequestsService: SupportRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Soumettre une demande de support publique (Problème de connexion)' })
  create(@Body() dto: CreateSupportRequestDto) {
    return this.supportRequestsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister toutes les demandes de support (SuperAdmin uniquement)' })
  findAll(@CurrentUser() user: any) {
    if (user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Only super admins can view support requests');
    }
    return this.supportRequestsService.findAll();
  }

  @Patch(':id/resolve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marquer une demande de support comme résolue (SuperAdmin uniquement)' })
  resolve(@Param('id') id: string, @CurrentUser() user: any) {
    if (user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Only super admins can resolve support requests');
    }
    return this.supportRequestsService.resolve(id);
  }
}
