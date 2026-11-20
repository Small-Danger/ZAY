import { BadRequestException } from '@nestjs/common';
import { OrderStatus, PaymentMethod, Prisma } from '@prisma/client';
import { OrdersService } from './orders.service';
import { StripeService } from '../payments/stripe.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { PromosService } from '../promos/promos.service';

type OrderRow = {
  id: string;
  number: string;
  userId: string;
  status: OrderStatus;
  total: Prisma.Decimal;
  promoCode: string | null;
  stripeSessionId: string | null;
  paymentMethod: PaymentMethod | null;
  items: Array<{
    productId: string;
    variantId: string | null;
    name: string;
    size: string;
    color: string;
    quantity: number;
  }>;
  user?: { id: string; email: string; firstName: string | null; lastName: string | null };
};

describe('OrdersService — paiement Stripe', () => {
  let service: OrdersService;
  let prisma: {
    order: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    product: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    productVariant: {
      update: jest.Mock;
      findMany: jest.Mock;
    };
    promoCode: {
      findFirst: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let stripe: {
    retrievePaidSession: jest.Mock;
    refundPayment: jest.Mock;
    expireSession: jest.Mock;
  };
  let redis: { invalidateCatalog: jest.Mock };

  const baseOrder = (overrides: Partial<OrderRow> = {}): OrderRow => ({
    id: 'order-1',
    number: 'ZAY-10001',
    userId: 'user-1',
    status: OrderStatus.PENDING,
    total: new Prisma.Decimal('49.90'),
    promoCode: null,
    stripeSessionId: 'cs_test_1',
    paymentMethod: PaymentMethod.CARD,
    items: [
      {
        productId: 'prod-1',
        variantId: 'var-1',
        name: 'Robe',
        size: 'M',
        color: 'Noir',
        quantity: 1,
      },
    ],
    user: {
      id: 'user-1',
      email: 'a@b.c',
      firstName: 'A',
      lastName: 'B',
    },
    ...overrides,
  });

  const paidSession = (overrides: Record<string, unknown> = {}) => ({
    paid: true,
    orderId: 'order-1',
    amountTotal: 4990,
    currency: 'eur',
    paymentIntentId: 'pi_test_1',
    paymentMethodType: 'card',
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      order: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      productVariant: {
        update: jest.fn(),
        findMany: jest.fn(),
      },
      promoCode: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(async (fn: (tx: typeof prisma) => unknown) =>
        fn(prisma),
      ),
    };

    stripe = {
      retrievePaidSession: jest.fn(),
      refundPayment: jest.fn().mockResolvedValue(undefined),
      expireSession: jest.fn().mockResolvedValue(undefined),
    };

    redis = { invalidateCatalog: jest.fn().mockResolvedValue(undefined) };

    service = new OrdersService(
      prisma as unknown as PrismaService,
      {} as PromosService,
      stripe as unknown as StripeService,
      redis as unknown as RedisService,
    );
  });

  it('session payée + commande PENDING → PAID', async () => {
    const order = baseOrder();
    stripe.retrievePaidSession.mockResolvedValue(paidSession());
    prisma.order.findFirst.mockResolvedValue(order);
    prisma.order.update.mockResolvedValue({
      ...order,
      status: OrderStatus.PAID,
    });

    const result = await service.markPaidFromStripeSession('cs_test_1');

    expect(result.status).toBe(OrderStatus.PAID);
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: OrderStatus.PAID,
          paymentMethod: PaymentMethod.CARD,
        }),
      }),
    );
  });

  it("session complete mais payment_status unpaid → reste PENDING (refus)", async () => {
    stripe.retrievePaidSession.mockResolvedValue(
      paidSession({ paid: false }),
    );

    await expect(
      service.markPaidFromStripeSession('cs_test_1'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it('montant Stripe différent du total → refus', async () => {
    const order = baseOrder();
    stripe.retrievePaidSession.mockResolvedValue(
      paidSession({ amountTotal: 1000 }),
    );
    prisma.order.findFirst.mockResolvedValue(order);

    await expect(
      service.markPaidFromStripeSession('cs_test_1'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it('session payée + commande CANCELLED + stock dispo → PAID et stock re-décrémenté', async () => {
    const order = baseOrder({ status: OrderStatus.CANCELLED });
    stripe.retrievePaidSession.mockResolvedValue(paidSession());
    prisma.order.findFirst.mockResolvedValue(order);
    prisma.product.findUnique.mockResolvedValue({
      id: 'prod-1',
      name: 'Robe',
      stock: 5,
      variants: [{ id: 'var-1', stock: 5 }],
    });
    prisma.productVariant.update.mockResolvedValue({
      id: 'var-1',
      stock: 4,
    });
    prisma.productVariant.findMany.mockResolvedValue([
      { id: 'var-1', stock: 4 },
    ]);
    prisma.product.update.mockResolvedValue({});
    prisma.order.update.mockResolvedValue({
      ...order,
      status: OrderStatus.PAID,
    });

    const result = await service.markPaidFromStripeSession('cs_test_1');

    expect(result.status).toBe(OrderStatus.PAID);
    expect(prisma.productVariant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'var-1' },
        data: { stock: { decrement: 1 } },
      }),
    );
    expect(stripe.refundPayment).not.toHaveBeenCalled();
    expect(redis.invalidateCatalog).toHaveBeenCalled();
  });

  it('session payée + commande CANCELLED + stock épuisé → refunds.create et REFUNDED', async () => {
    const order = baseOrder({ status: OrderStatus.CANCELLED });
    stripe.retrievePaidSession.mockResolvedValue(paidSession());
    prisma.order.findFirst.mockResolvedValue(order);
    prisma.product.findUnique.mockResolvedValue({
      id: 'prod-1',
      name: 'Robe',
      stock: 0,
      variants: [{ id: 'var-1', stock: 0 }],
    });
    prisma.productVariant.update.mockResolvedValue({
      id: 'var-1',
      stock: -1,
    });
    prisma.order.update.mockResolvedValue({
      ...order,
      status: OrderStatus.REFUNDED,
    });

    const result = await service.markPaidFromStripeSession('cs_test_1');

    expect(result.status).toBe(OrderStatus.REFUNDED);
    expect(stripe.refundPayment).toHaveBeenCalledWith('pi_test_1');
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: OrderStatus.REFUNDED }),
      }),
    );
  });

  it('annulation d’une commande dont la session est payée → PAID, pas CANCELLED', async () => {
    const order = baseOrder({ status: OrderStatus.PENDING });
    prisma.order.findUnique
      .mockResolvedValueOnce(order)
      .mockResolvedValueOnce(order);
    stripe.retrievePaidSession.mockResolvedValue(paidSession());
    prisma.order.findFirst.mockResolvedValue(order);
    prisma.order.update.mockResolvedValue({
      ...order,
      status: OrderStatus.PAID,
    });

    const result = await (service as unknown as {
      cancelUnpaidOrderById: (id: string) => Promise<OrderRow>;
    }).cancelUnpaidOrderById('order-1');

    expect(result.status).toBe(OrderStatus.PAID);
    expect(stripe.expireSession).not.toHaveBeenCalled();
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: OrderStatus.PAID }),
      }),
    );
  });
});
