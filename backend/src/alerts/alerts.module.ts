import {
  Controller, Get, Post, Delete, Patch,
  Body, Param, UseGuards, Module,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { NotificationsModule } from '../notifications/notifications.module';

class CreateAlertZoneDto {
  @ApiProperty({ example: 'Bastos - Yaoundé' })
  @IsString() @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'GeoJSON Feature ou Polygon du polygone dessiné sur la carte' })
  @IsObject()
  geoJson: any;

  @ApiProperty({ required: false, description: 'Filtres optionnels : type, minPrice, maxPrice...' })
  @IsObject() @IsOptional()
  filters?: any;
}

class UpdateAlertZoneDto {
  @ApiProperty({ example: 'Bastos - Yaoundé', required: false })
  @IsString() @IsOptional()
  label?: string;

  @ApiProperty({ description: 'GeoJSON Feature ou Polygon', required: false })
  @IsObject() @IsOptional()
  geoJson?: any;

  @ApiProperty({ required: false, description: 'Filtres optionnels : type, minPrice, maxPrice...' })
  @IsObject() @IsOptional()
  filters?: any;
}

@ApiTags('alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Post('zones')
  @ApiOperation({ summary: 'Créer une zone d\'alerte géographique' })
  create(@Body() dto: CreateAlertZoneDto, @CurrentUser() user: any) {
    return this.alertsService.createZone(user.id, dto.label, dto.geoJson, dto.filters);
  }

  @Get('zones')
  @ApiOperation({ summary: 'Mes zones d\'alerte' })
  getMyZones(@CurrentUser() user: any) {
    return this.alertsService.getUserZones(user.id);
  }

  @Patch('zones/:id/toggle')
  @ApiOperation({ summary: 'Activer / désactiver une zone d\'alerte' })
  toggle(@Param('id') id: string, @CurrentUser() user: any) {
    return this.alertsService.toggleZone(id, user.id);
  }

  @Patch('zones/:id')
  @ApiOperation({ summary: 'Éditer une zone d\'alerte' })
  update(@Param('id') id: string, @Body() dto: UpdateAlertZoneDto, @CurrentUser() user: any) {
    return this.alertsService.updateZone(id, user.id, dto);
  }

  @Delete('zones/:id')
  @ApiOperation({ summary: 'Supprimer une zone d\'alerte' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.alertsService.deleteZone(id, user.id);
  }
}

@Module({
  imports: [NotificationsModule],
  controllers: [AlertsController],
  providers: [AlertsService],
})
export class AlertsModule {}
