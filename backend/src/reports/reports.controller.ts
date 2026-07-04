import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report a listing' })
  async createReport(
    @CurrentUser() user: any,
    @Body() dto: { listingId: string; reason: string; description: string },
  ) {
    return this.reportsService.createReport(user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get reports (moderator only)' })
  async getReports(@CurrentUser() user: any) {
    return this.reportsService.getReports(user.id, user.role);
  }

  @Get('my-reports')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my submitted reports' })
  async getMyReports(@CurrentUser() user: any) {
    return this.reportsService.getMyReports(user.id);
  }

  @Patch(':reportId/:action')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject report (moderator only)' })
  async approveReport(
    @CurrentUser() user: any,
    @Param('reportId') reportId: string,
    @Param('action') action: 'APPROVED' | 'REJECTED',
  ) {
    return this.reportsService.approveReport(reportId, action, user.id);
  }
}
