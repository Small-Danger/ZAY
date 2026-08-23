import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { AdminOnly } from '../auth/decorators/admin-only.decorator';
import { AdminService } from './admin.service';
import { UpdateStoreSettingsDto } from './dto/store-settings.dto';

@Controller('admin')
@AdminOnly()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('store-settings')
  getStoreSettings() {
    return this.adminService.getStoreSettings();
  }

  @Patch('store-settings')
  updateStoreSettings(@Body() dto: UpdateStoreSettingsDto) {
    return this.adminService.updateStoreSettings(dto);
  }

  @Get('users')
  listUsers(@Query('search') search?: string) {
    return this.adminService.listUsers(search);
  }

  @Get('users/:id')
  getUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUser(id);
  }
}
