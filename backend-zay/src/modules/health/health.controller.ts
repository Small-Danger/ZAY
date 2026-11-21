import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService } from './health.service';

@SkipThrottle()
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getRoot() {
    return this.healthService.getRoot();
  }

  @Get('health')
  async getHealth() {
    const health = await this.healthService.getPublicHealth();
    if (health.status !== 'ok') {
      throw new ServiceUnavailableException(health);
    }
    return health;
  }
}
