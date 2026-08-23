import { Controller, Get } from '@nestjs/common';
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
  getHealth() {
    return this.healthService.getHealth();
  }
}
