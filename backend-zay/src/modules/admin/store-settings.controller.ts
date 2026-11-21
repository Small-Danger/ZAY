import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('store-settings')
export class StoreSettingsController {
  constructor(private readonly adminService: AdminService) {}

  @Get('public')
  getPublic() {
    return this.adminService.getPublicStoreSettings();
  }
}
