import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { AdminOnly } from '../auth/decorators/admin-only.decorator';
import { Throttle } from '@nestjs/throttler';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactStatusDto } from './dto/update-contact-status.dto';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto);
  }

  @Get('unread-count')
  @AdminOnly()
  async unreadCount() {
    const count = await this.contactService.countNew();
    return { count };
  }

  @Get()
  @AdminOnly()
  findAll() {
    return this.contactService.findAll();
  }

  @Patch(':id/status')
  @AdminOnly()
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactStatusDto,
  ) {
    return this.contactService.updateStatus(id, dto.status);
  }
}
