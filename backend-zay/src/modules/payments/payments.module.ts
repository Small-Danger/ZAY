import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsController } from './payments.controller';
import { StripeModule } from './stripe.module';

@Module({
  imports: [StripeModule, OrdersModule],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
