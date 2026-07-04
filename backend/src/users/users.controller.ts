import { Controller, Get, Patch, Delete, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/profile.dto';
import { Role } from '@prisma/client';

class UpdateRoleDto {
  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role: Role;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Get('profile/:userId')
  @ApiOperation({ summary: 'Get public user profile' })
  getPublicProfile(@Param('userId') userId: string) {
    return this.usersService.getPublicProfile(userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Delete('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete account' })
  deleteAccount(@CurrentUser() user: any) {
    return this.usersService.deleteAccount(user.id);
  }

  @Get('stats/seller/:sellerId')
  @ApiOperation({ summary: 'Get seller statistics' })
  getSellerStats(@Param('sellerId') sellerId: string) {
    return this.usersService.getSellerStats(sellerId);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (admin only)' })
  getAllUsers(@CurrentUser() user: any) {
    if (user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Only super admins can view all users');
    }
    return this.usersService.getAllUsers();
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user role (superadmin only)' })
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: any,
  ) {
    if (user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Only super admins can change roles');
    }
    return this.usersService.updateRole(id, dto.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user (superadmin only)' })
  deleteUser(@Param('id') id: string, @CurrentUser() user: any) {
    if (user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Only super admins can delete users');
    }
    return this.usersService.deleteUser(id);
  }
}
