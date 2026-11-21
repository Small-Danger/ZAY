import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentMethod, Prisma } from '@prisma/client';
import { OrdersService } from './orders.service';
import { StripeService } from '../payments/stripe.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { PromosService } from '../promos/promos.service';
import { MailService } from '../mail/mail.service';

type OrderRow = {
  id: string;
  number: string;
  userId: string;
  status: OrderStatus;
  total: Prisma.Decimal;
  subtotal?: Prisma.Decimal;
  shippingCost?: Prisma.Decimal;
  discountAmount?: Prisma.Decimal;
  firstName?: string;
  lastName?: string;
  addressLine?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  promoCode: string | null;
  stripeSessionId: string | null;
  paymentMethod: PaymentMethod | null;
  confirmationEmailSentAt?: Date | null;
  items: Array<{
    productId: string;
    variantId: string | null;
    name: string;
    size: string;
    color: string;
    quantity: number;
    unitPrice?: Prisma.Decimal;
    lineTotal?: Prisma.Decimal;
  }>;
  user?: { id: string; email: string; firstName: string | null; lastName: string | null };
};

describe('OrdersService — paiement Stripe', () => {
  let service: OrdersService;
  let prisma: {
    order: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    product: {
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    productVariant: {
      update: jest.Mock;
      updateMany: jest.Mock;
      findMany: jest.Mock;
    };
    promoCode: {
      findFirst: jest.Mock;
      updateMany: jest.Mock;
    };
    storeSettings: {
      findUnique: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let stripe: {
    retrievePaidSession: jest.Mock;
    refundPayment: jest.Mock;
    expireSession: jest.Mock;
  };
  let redis: { invalidateCatalog: jest.Mock };
  let mail: { send: jest.Mock };

  const baseOrder = (overrides: Partial<OrderRow> = {}): OrderRow => ({
    id: 'order-1',
    number: 'ZAY-10001',
    userId: 'user-1',
    status: OrderStatus.PENDING,
    total: new Prisma.Decimal('49.90'),
    subtotal: new Prisma.Decimal('49.90'),
    shippingCost: new Prisma.Decimal('0'),
    discountAmount: new Prisma.Decimal('0'),
    firstName: 'A',
    lastName: 'B',
    addressLine: '1 rue Test',
    city: 'Paris',
    postalCode: '75001',
    country: 'France',
    promoCode: null,
    stripeSessionId: 'cs_test_1',
    paymentMethod: PaymentMethod.CARD,
    confirmationEmailSentAt: null,
    items: [
      {
        productId: 'prod-1',
        variantId: 'var-1',
        name: 'Robe',
        size: 'M',
        color: 'Noir',
        quantity: 1,
        unitPrice: new Prisma.Decimal('49.90'),
        lineTotal: new Prisma.Decimal('49.90'),
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

  const mockStockOk = () => {
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
  };

  beforeEach(() => {
    prisma = {
      order: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      product: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      productVariant: {
        update: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
      },
      promoCode: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
      storeSettings: {
        findUnique: jest.fn().mockResolvedValue(null),
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
    mail = { send: jest.fn().mockResolvedValue(true) };

    service = new OrdersService(
      prisma as unknown as PrismaService,
      {} as PromosService,
      stripe as unknown as StripeService,
      redis as unknown as RedisService,
      mail as unknown as MailService,
      {
        get: (key: string) =>
          key === 'app.frontendUrl'
            ? 'http://localhost:9002'
            : key === 'app.adminNotifyEmail'
              ? ''
              : '',
      } as unknown as ConfigService,
    );
  });

  it('session payée + commande PENDING → PAID', async () => {
    const order = baseOrder();
    const paid = { ...order, status: OrderStatus.PAID };
    stripe.retrievePaidSession.mockResolvedValue(paidSession());
    prisma.order.findFirst.mockResolvedValue(order);
    prisma.order.update.mockResolvedValue(paid);
    prisma.order.findUnique.mockResolvedValue(paid);

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

  it('deux appels markPaidFromStripeSession → un seul e-mail de confirmation', async () => {
    const order = baseOrder();
    const paid = { ...order, status: OrderStatus.PAID };
    stripe.retrievePaidSession.mockResolvedValue(paidSession());
    prisma.order.findFirst.mockResolvedValue(order);
    prisma.order.update.mockResolvedValue(paid);
    prisma.order.findUnique.mockResolvedValue(paid);

    let confirmationClaimed = false;
    prisma.order.updateMany.mockImplementation(
      async (args: { where?: { confirmationEmailSentAt?: null } }) => {
        if (args.where && 'confirmationEmailSentAt' in args.where) {
          if (!confirmationClaimed) {
            confirmationClaimed = true;
            return { count: 1 };
          }
          return { count: 0 };
        }
        return { count: 1 };
      },
    );

    await Promise.all([
      service.markPaidFromStripeSession('cs_test_1'),
      service.markPaidFromStripeSession('cs_test_1'),
    ]);

    expect(mail.send).toHaveBeenCalledTimes(1);
    expect(mail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@b.c',
        subject: expect.stringContaining('Confirmation'),
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
    mockStockOk();
    prisma.order.update.mockResolvedValue({
      ...order,
      status: OrderStatus.PAID,
    });

    const result = await service.markPaidFromStripeSession('cs_test_1');

    expect(result.status).toBe(OrderStatus.PAID);
    expect(prisma.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order-1', status: OrderStatus.CANCELLED },
      data: { status: OrderStatus.PENDING },
    });
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
    expect(stripe.refundPayment).toHaveBeenCalledWith('pi_test_1', 'order-1');
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

  it('deux appels simultanés sur CANCELLED ne décrémentent le stock qu’une fois', async () => {
    const order = baseOrder({ status: OrderStatus.CANCELLED });
    stripe.retrievePaidSession.mockResolvedValue(paidSession());
    prisma.order.findFirst.mockResolvedValue(order);
    mockStockOk();

    let lockTaken = false;
    prisma.order.updateMany.mockImplementation(async () => {
      if (!lockTaken) {
        lockTaken = true;
        return { count: 1 };
      }
      return { count: 0 };
    });

    prisma.order.update.mockResolvedValue({
      ...order,
      status: OrderStatus.PAID,
    });
    prisma.order.findUnique.mockResolvedValue({
      ...order,
      status: OrderStatus.PAID,
    });

    const [first, second] = await Promise.all([
      service.markPaidFromStripeSession('cs_test_1'),
      service.markPaidFromStripeSession('cs_test_1'),
    ]);

    expect(first.status).toBe(OrderStatus.PAID);
    expect(second.status).toBe(OrderStatus.PAID);
    expect(prisma.productVariant.update).toHaveBeenCalledTimes(1);
    expect(stripe.refundPayment).not.toHaveBeenCalled();
  });

  it('refundPayment transmet la clé d’idempotence à refunds.create', async () => {
    const create = jest.fn().mockResolvedValue({});
    const stripeService = new StripeService({
      get: (key: string) =>
        key === 'app.stripeSecretKey' ? 'sk_test_dummy_key_for_unit' : '',
    } as unknown as ConfigService);
    (stripeService as unknown as { client: unknown }).client = {
      refunds: { create },
    };

    await stripeService.refundPayment('pi_test_1', 'order-1');

    expect(create).toHaveBeenCalledWith(
      { payment_intent: 'pi_test_1' },
      { idempotencyKey: 'refund-order-order-1' },
    );
  });

  it('deux annulations concurrentes (webhook + release user) ne restockent qu’une fois', async () => {
    const order = baseOrder({ status: OrderStatus.PENDING });
    prisma.order.findFirst.mockResolvedValue(order);
    prisma.order.findMany.mockResolvedValue([{ id: order.id }]);
    prisma.order.findUnique.mockResolvedValue(order);
    stripe.retrievePaidSession.mockResolvedValue(
      paidSession({ paid: false }),
    );
    prisma.productVariant.updateMany.mockResolvedValue({ count: 1 });

    let claimTaken = false;
    prisma.order.updateMany.mockImplementation(async () => {
      if (!claimTaken) {
        claimTaken = true;
        return { count: 1 };
      }
      return { count: 0 };
    });

    const privateApi = service as unknown as {
      releaseUnpaidPendingForUser: (userId: string) => Promise<void>;
    };

    await Promise.all([
      service.cancelUnpaidFromStripeSession('cs_test_1'),
      privateApi.releaseUnpaidPendingForUser('user-1'),
    ]);

    expect(prisma.productVariant.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.productVariant.updateMany).toHaveBeenCalledWith({
      where: { id: 'var-1' },
      data: { stock: { increment: 1 } },
    });
  });

  it('updateStatus vers CANCELLED si statut changé → ConflictException, pas de restock', async () => {
    const order = baseOrder({ status: OrderStatus.PAID });
    prisma.order.findUnique.mockResolvedValue(order);
    prisma.order.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.updateStatus('order-1', { status: OrderStatus.CANCELLED }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.productVariant.updateMany).not.toHaveBeenCalled();
    expect(prisma.product.updateMany).not.toHaveBeenCalled();
    expect(redis.invalidateCatalog).not.toHaveBeenCalled();
  });
});
