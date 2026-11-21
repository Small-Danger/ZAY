import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PromosService } from './promos.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PromosService', () => {
  let service: PromosService;
  let prisma: {
    promoCode: { findUnique: jest.Mock };
    order: { count: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      promoCode: { findUnique: jest.fn() },
      order: { count: jest.fn() },
    };
    service = new PromosService(prisma as unknown as PrismaService);
  });

  it('refuse firstOrderOnly si la cliente a déjà une commande PAID', async () => {
    prisma.promoCode.findUnique.mockResolvedValue({
      code: 'FIRST',
      active: true,
      expiresAt: null,
      usageLimit: null,
      usageCount: 0,
      firstOrderOnly: true,
      perUserLimit: null,
      type: 'PERCENTAGE',
      value: 10,
    });
    prisma.order.count.mockResolvedValue(1);

    await expect(
      service.getValidPromo('FIRST', 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.order.count).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        status: {
          notIn: [OrderStatus.CANCELLED, OrderStatus.PENDING],
        },
      },
    });
  });
});
