import { Module } from '@nestjs/common';
import { HealthModule } from '../health/health.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { StoreSettingsController } from './store-settings.controller';

@Module({
  imports: [HealthModule],
  controllers: [AdminController, StoreSettingsController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
