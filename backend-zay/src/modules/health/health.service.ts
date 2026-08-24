import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  getRoot(): string {
    return 'ZAY API is running';
  }

  async getHealth() {
    let database: 'up' | 'down' = 'down';
    let redis: 'up' | 'down' = 'down';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }

    redis = (await this.redis.ping()) ? 'up' : 'down';

    return {
      status: database === 'up' && redis === 'up' ? 'ok' : 'degraded',
      service: 'backend-zay',
      database,
      redis,
      uploads: (process.env.CLOUDINARY_URL ?? '').startsWith('cloudinary://')
        ? 'cloudinary'
        : 'disk',
      timestamp: new Date().toISOString(),
    };
  }
}
