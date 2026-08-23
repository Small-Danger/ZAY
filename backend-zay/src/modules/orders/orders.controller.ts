import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AdminOnly } from '../auth/decorators/admin-only.decorator';
import { AuthRequired } from '../auth/decorators/auth-required.decorator';
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  type AuthUser,
} from '../auth/decorators/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** Checkout — JWT cliente/admin */
  @Post()
  @AuthRequired()
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  checkout(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.checkout(user, dto);
  }

  /** Confirme un paiement Stripe (retour success_url) */
  @Post('confirm-payment')
  @AuthRequired()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  confirmPayment(
    @CurrentUser() user: AuthUser,
    @Body() dto: ConfirmPaymentDto,
  ) {
    return this.ordersService.confirmCheckoutSession(dto.sessionId, user);
  }

  /** Mes commandes */
  @Get('me')
  @AuthRequired()
  findMine(@CurrentUser() user: AuthUser) {
    return this.ordersService.findMine(user.id);
  }

  /** Export CSV admin (avant :idOrNumber) */
  @Get('export')
  @AdminOnly()
  async exportCsv(@Query() query: OrderQueryDto, @Res() res: Response) {
    const csv = await this.ordersService.exportCsv(query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="commandes-zay.csv"',
    );
    res.send(csv);
  }

  /** Liste admin */
  @Get()
  @AdminOnly()
  findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':idOrNumber')
  @AuthRequired()
  findOne(
    @Param('idOrNumber') idOrNumber: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.findOne(idOrNumber, user);
  }

  @Patch(':id/status')
  @AdminOnly()
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}
