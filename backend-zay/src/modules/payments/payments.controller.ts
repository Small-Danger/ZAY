import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { OrdersService } from '../orders/orders.service';
import { StripeService } from './stripe.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly stripe: StripeService,
    private readonly orders: OrdersService,
  ) {}

  @Post('webhook')
  @SkipThrottle()
  @HttpCode(200)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    if (!signature) {
      throw new BadRequestException('Signature Stripe manquante');
    }
    const raw = req.rawBody;
    if (!raw) {
      throw new BadRequestException('Corps webhook vide');
    }

    const event = this.stripe.constructWebhookEvent(raw, signature);

    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = event.data.object as { id: string };
      await this.orders.markPaidFromStripeSession(session.id);
    }

    if (
      event.type === 'checkout.session.expired' ||
      event.type === 'checkout.session.async_payment_failed'
    ) {
      const session = event.data.object as { id: string };
      await this.orders.cancelUnpaidFromStripeSession(session.id);
    }

    return { received: true };
  }
}
