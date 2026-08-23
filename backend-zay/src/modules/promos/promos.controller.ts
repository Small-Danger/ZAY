import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { AdminOnly } from '../auth/decorators/admin-only.decorator';
import { Throttle } from '@nestjs/throttler';
import {
  CreatePromoDto,
  UpdatePromoDto,
  ValidatePromoDto,
} from './dto/promo.dto';
import { PromosService } from './promos.service';

@Controller('promos')
export class PromosController {
  constructor(private readonly promosService: PromosService) {}

  /** Public — validation panier */
  @Post('validate')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  validate(@Body() dto: ValidatePromoDto) {
    return this.promosService.validate(dto);
  }

  @Get()
  @AdminOnly()
  findAll() {
    return this.promosService.findAll();
  }

  @Post()
  @AdminOnly()
  create(@Body() dto: CreatePromoDto) {
    return this.promosService.create(dto);
  }

  @Patch(':id')
  @AdminOnly()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePromoDto,
  ) {
    return this.promosService.update(id, dto);
  }

  @Delete(':id')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.promosService.remove(id);
  }
}
