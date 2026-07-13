import { Controller, Get, Patch, Delete, Body, Param, UseGuards, ForbiddenException, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsEmail } from 'class-validator';
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

class VerifyByEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
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

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search users by name to start a conversation' })
  searchUsers(@Query('q') q: string, @CurrentUser() user: any) {
    return this.usersService.searchUsers(q, user.id);
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
  async deleteAccount(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.usersService.deleteAccount(user.id);
    
    // Efface les cookies de session
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
    });
    
    return result;
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

  @Patch('admin/profile/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile (superadmin only)' })
  adminUpdateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: any,
  ) {
    if (user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Only super admins can update other user profiles');
    }
    return this.usersService.adminUpdateProfile(id, dto);
  }

  @Patch('admin/reset-password/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset user password (superadmin only)' })
  adminResetPassword(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    if (user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Only super admins can reset user passwords');
    }
    return this.usersService.adminResetPassword(id);
  }

  @Patch('admin/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Vérifier un compte utilisateur via son email (superadmin only)" })
  verifyByEmail(@Body() dto: VerifyByEmailDto, @CurrentUser() user: any) {
    if (user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Only super admins can verify users');
    }
    return this.usersService.verifyUserByEmail(dto.email);
  }
}
