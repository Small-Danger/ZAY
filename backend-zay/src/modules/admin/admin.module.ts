import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { StoreSettingsController } from './store-settings.controller';

@Module({
  controllers: [AdminController, StoreSettingsController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
