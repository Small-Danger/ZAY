import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { PromosService } from '../promos/promos.service';
import { computeProductStatus } from '../products/product.helpers';
import { StripeService } from '../payments/stripe.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import {
  formatAvailableVariants,
  resolveProductVariant,
} from './variant-match';

const orderInclude = {
  items: true,
  user: {
    select: { id: true, email: true, firstName: true, lastName: true },
  },
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly promosService: PromosService,
    private readonly stripe: StripeService,
    private readonly redis: RedisService,
  ) {}

  async checkout(user: AuthUser, dto: CreateOrderDto) {
    await this.releaseStaleUnpaidPending();
    await this.releaseUnpaidPendingForUser(user.id);

    const lineData: {
      productId: string;
      variantId: string | null;
      name: string;
      image: string;
      size: string;
      color: string;
      unitPrice: Prisma.Decimal;
      quantity: number;
      lineTotal: Prisma.Decimal;
    }[] = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });

      if (!product) {
        throw new NotFoundException(`Produit introuvable`);
      }

      const variant =
        product.variants.length > 0
          ? resolveProductVariant(
              product.variants,
              item.size,
              item.color,
            )
          : null;

      if (product.variants.length > 0 && !variant) {
        const available = formatAvailableVariants(product.variants);
        throw new BadRequestException(
          `Taille ${item.size.trim()} / couleur ${item.color.trim()} indisponible pour ${product.name}.${available ? ` Disponibles : ${available}.` : ''}`,
        );
      }

      const unit = Number(product.price);
      const quantity = item.quantity;
      lineData.push({
        productId: product.id,
        variantId: variant?.id ?? null,
        name: product.name,
        image: product.image,
        size: variant?.size ?? item.size.trim().toUpperCase(),
        color: variant?.colorName ?? item.color.trim(),
        unitPrice: new Prisma.Decimal(unit.toFixed(2)),
        quantity,
        lineTotal: new Prisma.Decimal((unit * quantity).toFixed(2)),
      });
    }

    const lines = mergeCheckoutLines(lineData);
    let subtotal = 0;

    for (const line of lines) {
      if (line.variantId) {
        const variant = await this.prisma.productVariant.findUnique({
          where: { id: line.variantId },
        });
        if (!variant || variant.stock < line.quantity) {
          throw new BadRequestException(
            `Stock insuffisant pour ${line.name} (${line.size}/${line.color})`,
          );
        }
      } else {
        const product = await this.prisma.product.findUnique({
          where: { id: line.productId },
        });
        if (!product || product.stock < line.quantity) {
          throw new BadRequestException(
            `Stock insuffisant pour ${line.name}`,
          );
        }
      }
      subtotal += Number(line.lineTotal);
    }

    const store = await this.prisma.storeSettings.findUnique({
      where: { id: 1 },
    });
    const baseShipping = store ? Number(store.shippingCost) : 0;
    const freeFrom =
      store?.freeShippingThreshold != null
        ? Number(store.freeShippingThreshold)
        : null;
    const shippingCost =
      freeFrom != null && subtotal >= freeFrom ? 0 : baseShipping;

    let discountAmount = 0;
    let appliedPromoCode: string | null = null;
    let promoUsageLimit: number | null = null;

    if (dto.promoCode?.trim()) {
      const promo = await this.promosService.getValidPromo(dto.promoCode);
      discountAmount = this.promosService.computeDiscount(
        promo.type,
        Number(promo.value),
        subtotal,
      );
      appliedPromoCode = promo.code;
      promoUsageLimit = promo.usageLimit;
    }

    const total = Math.max(0, subtotal + shippingCost - discountAmount);
    const shipping = dto.shipping;
    const customerName = `${shipping.firstName.trim()} ${shipping.lastName.trim()}`;
    const number = await this.nextOrderNumber();

    const order = await this.prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const product = await tx.product.findUnique({
          where: { id: line.productId },
          include: { variants: true },
        });
        if (!product) {
          throw new BadRequestException(
            `Ce produit n’est plus disponible`,
          );
        }

        if (product.variants.length > 0) {
          if (!line.variantId) {
            throw new BadRequestException(
              `Variante indisponible pour ${product.name}`,
            );
          }

          const updated = await tx.productVariant.update({
            where: { id: line.variantId },
            data: { stock: { decrement: line.quantity } },
          });
          if (updated.stock < 0) {
            throw new BadRequestException(
              `Stock insuffisant pour ${product.name} (${line.size}/${line.color})`,
            );
          }

          const variants = await tx.productVariant.findMany({
            where: { productId: product.id },
          });
          const stock = variants.reduce((s, v) => s + v.stock, 0);
          await tx.product.update({
            where: { id: product.id },
            data: { stock, status: computeProductStatus(stock) },
          });
        } else {
          const updated = await tx.product.update({
            where: { id: product.id },
            data: {
              stock: { decrement: line.quantity },
            },
          });
          if (updated.stock < 0) {
            throw new BadRequestException(
              `Stock insuffisant pour ${product.name}`,
            );
          }
          await tx.product.update({
            where: { id: product.id },
            data: { status: computeProductStatus(updated.stock) },
          });
        }
      }

      if (appliedPromoCode) {
        const consumed = await tx.promoCode.updateMany({
          where: {
            code: appliedPromoCode,
            active: true,
            ...(promoUsageLimit != null
              ? { usageCount: { lt: promoUsageLimit } }
              : {}),
          },
          data: { usageCount: { increment: 1 } },
        });
        if (consumed.count !== 1) {
          throw new BadRequestException(
            'Ce code promo a atteint sa limite d’utilisation',
          );
        }
      }

      return tx.order.create({
        data: {
          number,
          userId: user.id,
          status: OrderStatus.PENDING,
          paymentMethod: dto.paymentMethod,
          firstName: shipping.firstName.trim(),
          lastName: shipping.lastName.trim(),
          phone: shipping.phone?.trim() || null,
          addressLine: shipping.addressLine.trim(),
          city: shipping.city.trim(),
          postalCode: shipping.postalCode.trim(),
          country: shipping.country?.trim() || 'France',
          subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
          shippingCost: new Prisma.Decimal(shippingCost.toFixed(2)),
          discountAmount: new Prisma.Decimal(discountAmount.toFixed(2)),
          total: new Prisma.Decimal(total.toFixed(2)),
          promoCode: appliedPromoCode,
          itemsCount: lines.reduce((s, l) => s + l.quantity, 0),
          thumbnailUrl: lines[0]?.image ?? null,
          customerName,
          items: {
            create: lines,
          },
        },
        include: orderInclude,
      });
    });

    await this.redis.invalidateCatalog();

    let session: { id: string; url: string };
    try {
      session = await this.stripe.createCheckoutSession({
        orderId: order.id,
        orderNumber: order.number,
        amountEur: Number(order.total),
        customerEmail: user.email,
        paymentMethod: dto.paymentMethod,
        customerName,
        addressLine: order.addressLine,
        city: order.city,
        postalCode: order.postalCode,
        country: order.country,
        phone: order.phone,
      });
    } catch (err) {
      await this.cancelUnpaidOrderById(order.id);
      throw err;
    }

    const paidReady = await this.prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
      include: orderInclude,
    });

    return { ...paidReady, checkoutUrl: session.url };
  }

  async confirmCheckoutSession(sessionId: string, user: AuthUser) {
    const order = await this.markPaidFromStripeSession(sessionId);
    if (user.role !== Role.ADMIN && order.userId !== user.id) {
      throw new ForbiddenException('Not your order');
    }
    return order;
  }

  async markPaidFromStripeSession(sessionId: string) {
    const { paid, orderId } = await this.stripe.retrievePaidSession(sessionId);
    if (!paid) {
      throw new BadRequestException('Session Stripe non payée');
    }

    const order = await this.prisma.order.findFirst({
      where: {
        OR: [
          { stripeSessionId: sessionId },
          ...(orderId ? [{ id: orderId }] : []),
        ],
      },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable pour cette session Stripe');
    }

    if (order.status !== OrderStatus.PENDING) {
      return order;
    }

    return this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        stripeSessionId: sessionId,
      },
      include: orderInclude,
    });
  }

  async findMine(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  private buildWhere(query: OrderQueryDto): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { number: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) {
        where.createdAt.gte = new Date(query.from);
      }
      if (query.to) {
        const end = new Date(query.to);
        if (query.to.length <= 10) {
          end.setHours(23, 59, 59, 999);
        }
        where.createdAt.lte = end;
      }
    }
    return where;
  }

  async findAll(query: OrderQueryDto) {
    return this.prisma.order.findMany({
      where: this.buildWhere(query),
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** CSV UTF-8 (BOM) pour Excel — export admin */
  async exportCsv(query: OrderQueryDto): Promise<string> {
    const orders = await this.findAll(query);
    const header = [
      'number',
      'createdAt',
      'customerName',
      'email',
      'status',
      'itemsCount',
      'subtotal',
      'shippingCost',
      'discountAmount',
      'total',
      'promoCode',
      'carrier',
      'trackingCode',
      'city',
      'postalCode',
      'country',
    ];
    const escape = (v: string | number | null | undefined) => {
      const s = v == null ? '' : String(v);
      if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const lines = orders.map((o) =>
      [
        o.number,
        o.createdAt.toISOString(),
        o.customerName,
        o.user?.email ?? '',
        o.status,
        o.itemsCount,
        Number(o.subtotal).toFixed(2),
        Number(o.shippingCost).toFixed(2),
        Number(o.discountAmount).toFixed(2),
        Number(o.total).toFixed(2),
        o.promoCode ?? '',
        o.carrier ?? '',
        o.trackingCode ?? '',
        o.city,
        o.postalCode,
        o.country,
      ]
        .map(escape)
        .join(';'),
    );
    return `\uFEFF${header.join(';')}\n${lines.join('\n')}\n`;
  }

  async findOne(idOrNumber: string, user: AuthUser) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrNumber,
      );

    const order = await this.prisma.order.findFirst({
      where: isUuid
        ? { OR: [{ id: idOrNumber }, { number: idOrNumber }] }
        : { number: idOrNumber },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException(`Order ${idOrNumber} not found`);
    }

    if (user.role !== Role.ADMIN && order.userId !== user.id) {
      throw new ForbiddenException('Not your order');
    }

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const existing = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) throw new NotFoundException(`Order ${id} not found`);

    const restock = this.shouldRestock(existing.status, dto.status);
    const releasePromo =
      restock && this.shouldReleasePromo(existing.status);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (restock) {
        await this.restockItems(tx, existing.items);
      }
      if (releasePromo && existing.promoCode) {
        await tx.promoCode.updateMany({
          where: { code: existing.promoCode, usageCount: { gt: 0 } },
          data: { usageCount: { decrement: 1 } },
        });
      }

      return tx.order.update({
        where: { id },
        data: {
          status: dto.status,
          carrier: dto.carrier?.trim(),
          trackingCode: dto.trackingCode?.trim(),
          trackingUrl: dto.trackingUrl?.trim(),
        },
        include: orderInclude,
      });
    });

    if (restock) {
      await this.redis.invalidateCatalog();
    }

    return updated;
  }

  async cancelUnpaidFromStripeSession(sessionId: string) {
    const order = await this.prisma.order.findFirst({
      where: { stripeSessionId: sessionId },
    });
    if (!order || order.status !== OrderStatus.PENDING) {
      return order;
    }
    return this.cancelUnpaidOrderById(order.id);
  }

  private shouldRestock(from: OrderStatus, to: OrderStatus): boolean {
    if (
      from === OrderStatus.CANCELLED ||
      from === OrderStatus.REFUNDED
    ) {
      return false;
    }
    return to === OrderStatus.CANCELLED || to === OrderStatus.REFUNDED;
  }

  private shouldReleasePromo(from: OrderStatus): boolean {
    return from === OrderStatus.PENDING;
  }

  private async releaseStaleUnpaidPending() {
    const cutoff = new Date(Date.now() - 45 * 60 * 1000);
    const stale = await this.prisma.order.findMany({
      where: { status: OrderStatus.PENDING, createdAt: { lt: cutoff } },
      select: { id: true },
    });
    for (const order of stale) {
      await this.cancelUnpaidOrderById(order.id);
    }
  }

  private async releaseUnpaidPendingForUser(userId: string) {
    const pending = await this.prisma.order.findMany({
      where: { userId, status: OrderStatus.PENDING },
      select: { id: true },
    });
    for (const order of pending) {
      await this.cancelUnpaidOrderById(order.id);
    }
  }

  private async cancelUnpaidOrderById(orderId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!current || current.status !== OrderStatus.PENDING) {
        return { order: current, restocked: false };
      }

      await this.restockItems(tx, current.items);
      if (current.promoCode) {
        await tx.promoCode.updateMany({
          where: { code: current.promoCode, usageCount: { gt: 0 } },
          data: { usageCount: { decrement: 1 } },
        });
      }

      const order = await tx.order.update({
        where: { id: current.id },
        data: { status: OrderStatus.CANCELLED },
        include: orderInclude,
      });
      return { order, restocked: true };
    });

    if (result.restocked) {
      await this.redis.invalidateCatalog();
    }

    return result.order;
  }

  private async restockItems(
    tx: Prisma.TransactionClient,
    items: { productId: string; variantId: string | null; quantity: number }[],
  ) {
    const productIds = new Set<string>();

    for (const item of items) {
      if (item.variantId) {
        await tx.productVariant.updateMany({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      } else {
        await tx.product.updateMany({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      productIds.add(item.productId);
    }

    for (const productId of productIds) {
      await this.syncProductStock(tx, productId);
    }
  }

  private async syncProductStock(
    tx: Prisma.TransactionClient,
    productId: string,
  ) {
    const product = await tx.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });
    if (!product) return;
    const stock =
      product.variants.length > 0
        ? product.variants.reduce((s, v) => s + v.stock, 0)
        : product.stock;
    await tx.product.update({
      where: { id: productId },
      data: { stock, status: computeProductStatus(stock) },
    });
  }

  private async nextOrderNumber(): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const n = `ZAY-${Math.floor(10000 + Math.random() * 90000)}`;
      const exists = await this.prisma.order.findUnique({
        where: { number: n },
      });
      if (!exists) return n;
    }
    return `ZAY-${Date.now().toString().slice(-5)}`;
  }
}

type CheckoutLine = {
  productId: string;
  variantId: string | null;
  name: string;
  image: string;
  size: string;
  color: string;
  unitPrice: Prisma.Decimal;
  quantity: number;
  lineTotal: Prisma.Decimal;
};

/** Fusionne les lignes identiques (même variante) pour un décrément de stock unique. */
function mergeCheckoutLines(lines: CheckoutLine[]): CheckoutLine[] {
  const merged: CheckoutLine[] = [];
  const indexByKey = new Map<string, number>();

  for (const line of lines) {
    const key = line.variantId ?? `p:${line.productId}`;
    const idx = indexByKey.get(key);
    if (idx == null) {
      indexByKey.set(key, merged.length);
      merged.push({ ...line });
      continue;
    }
    const current = merged[idx];
    const quantity = current.quantity + line.quantity;
    merged[idx] = {
      ...current,
      quantity,
      lineTotal: new Prisma.Decimal(
        (Number(current.unitPrice) * quantity).toFixed(2),
      ),
    };
  }

  return merged;
}
