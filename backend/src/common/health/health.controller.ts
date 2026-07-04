import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async checkHealth() {
    const now = new Date();
    
    try {
      // Check database
      await this.prisma.$queryRaw`SELECT 1`;
      const dbStatus = 'up';
    } catch (error) {
      return { status: 'error', timestamp: now, database: 'down', message: error.message };
    }

    try {
      // Check Redis
      await this.redis.ping();
      const redisStatus = 'up';
    } catch (error) {
      return { status: 'degraded', timestamp: now, database: 'up', redis: 'down' };
    }

    return {
      status: 'ok',
      timestamp: now,
      database: 'up',
      redis: 'up',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      await this.redis.ping();
      return { ready: true };
    } catch (error) {
      return { ready: false, error: error.message };
    }
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  async liveness() {
    return { alive: true };
  }
}
