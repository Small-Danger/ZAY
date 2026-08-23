import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateStoreSettingsDto } from './dto/store-settings.dto';

const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStoreSettings() {
    const existing = await this.prisma.storeSettings.findUnique({
      where: { id: 1 },
    });
    if (existing) return existing;
    return this.prisma.storeSettings.create({
      data: { id: 1, storeName: 'ZAY', shippingCost: 0 },
    });
  }

  async updateStoreSettings(dto: UpdateStoreSettingsDto) {
    await this.getStoreSettings();
    return this.prisma.storeSettings.update({
      where: { id: 1 },
      data: {
        storeName: dto.storeName?.trim(),
        contactEmail:
          dto.contactEmail === undefined
            ? undefined
            : dto.contactEmail?.trim() || null,
        shippingCost: dto.shippingCost,
        freeShippingThreshold:
          dto.freeShippingThreshold === undefined
            ? undefined
            : dto.freeShippingThreshold,
      },
    });
  }

  async getStats() {
    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const startYesterday = new Date(startToday);
    startYesterday.setDate(startYesterday.getDate() - 1);
    const start30 = new Date(startToday);
    start30.setDate(start30.getDate() - 29);

    const paidStatuses: OrderStatus[] = [
      OrderStatus.PAID,
      OrderStatus.PREPARING,
      OrderStatus.SHIPPED,
      OrderStatus.IN_TRANSIT,
      OrderStatus.DELIVERED,
    ];

    const [
      ordersToday,
      ordersYesterday,
      revenueTodayAgg,
      revenueYesterdayAgg,
      newUsersToday,
      newUsersYesterday,
      lowStockCount,
      recentOrders,
      seriesOrders,
    ] = await Promise.all([
      this.prisma.order.count({
        where: { createdAt: { gte: startToday } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: startYesterday, lt: startToday } },
      }),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: startToday },
          status: { in: paidStatuses },
        },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: startYesterday, lt: startToday },
          status: { in: paidStatuses },
        },
        _sum: { total: true },
      }),
      this.prisma.user.count({
        where: {
          role: Role.CUSTOMER,
          createdAt: { gte: startToday },
        },
      }),
      this.prisma.user.count({
        where: {
          role: Role.CUSTOMER,
          createdAt: { gte: startYesterday, lt: startToday },
        },
      }),
      this.prisma.product.count({
        where: {
          OR: [
            { stock: { lte: LOW_STOCK_THRESHOLD } },
            { status: { in: ['Stock faible', 'Rupture'] } },
          ],
        },
      }),
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          number: true,
          customerName: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.order.findMany({
        where: {
          createdAt: { gte: start30 },
          status: { in: paidStatuses },
        },
        select: { total: true, createdAt: true },
      }),
    ]);

    const revenueToday = Number(revenueTodayAgg._sum.total ?? 0);
    const revenueYesterday = Number(revenueYesterdayAgg._sum.total ?? 0);

    const byDay = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(start30);
      d.setDate(start30.getDate() + i);
      byDay.set(this.dayKey(d), 0);
    }
    for (const order of seriesOrders) {
      const key = this.dayKey(order.createdAt);
      byDay.set(key, (byDay.get(key) ?? 0) + Number(order.total));
    }

    const revenueSeries = Array.from(byDay.entries()).map(([day, ca]) => ({
      day: day.slice(5).replace('-', '/'),
      ca: Math.round(ca * 100) / 100,
    }));

    return {
      ordersToday,
      ordersTodayDeltaPct: this.deltaPct(ordersToday, ordersYesterday),
      revenueToday,
      revenueTodayDeltaPct: this.deltaPct(revenueToday, revenueYesterday),
      newUsersToday,
      newUsersTodayDeltaPct: this.deltaPct(newUsersToday, newUsersYesterday),
      lowStockCount,
      revenueSeries,
      recentOrders,
    };
  }

  async listUsers(search?: string) {
    const where: Prisma.UserWhereInput = { role: Role.CUSTOMER };
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            number: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      role: u.role,
      createdAt: u.createdAt,
      ordersCount: u._count.orders,
      lastOrder: u.orders[0] ?? null,
    }));
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: Role.CUSTOMER },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            name: true,
            street: true,
            city: true,
            zip: true,
            country: true,
            isDefault: true,
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            number: true,
            total: true,
            status: true,
            itemsCount: true,
            createdAt: true,
          },
        },
        _count: { select: { orders: true, addresses: true } },
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      ordersCount: user._count.orders,
      addressesCount: user._count.addresses,
      addresses: user.addresses,
      orders: user.orders,
    };
  }

  private dayKey(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private deltaPct(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }
}
