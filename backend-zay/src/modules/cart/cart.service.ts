import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveProductVariant } from '../orders/variant-match';
import type { CartLineDto, MergeCartDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: string) {
    const rows = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: { include: { variants: true } },
        variant: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const live: typeof rows = [];
    for (const row of rows) {
      const stock = this.stockFor(row);
      if (stock <= 0) {
        await this.prisma.cartItem.delete({ where: { id: row.id } });
        continue;
      }
      if (row.quantity > stock) {
        await this.prisma.cartItem.update({
          where: { id: row.id },
          data: { quantity: stock },
        });
        live.push({ ...row, quantity: stock });
        continue;
      }
      live.push(row);
    }

    return live.map((row) => this.toClient(row));
  }

  async merge(userId: string, dto: MergeCartDto) {
    for (const line of dto.items) {
      await this.upsertLine(userId, line, { skipMissing: true, add: true });
    }
    return this.findMine(userId);
  }

  async upsert(userId: string, dto: CartLineDto) {
    await this.upsertLine(userId, dto, { skipMissing: false, add: false });
    return this.findMine(userId);
  }

  async clear(userId: string) {
    await this.prisma.cartItem.deleteMany({ where: { userId } });
  }

  private async upsertLine(
    userId: string,
    dto: CartLineDto,
    opts: { skipMissing: boolean; add: boolean },
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { variants: true },
    });
    if (!product) {
      if (opts.skipMissing) return;
      throw new NotFoundException('Produit introuvable');
    }

    const variant =
      product.variants.length > 0
        ? resolveProductVariant(product.variants, dto.size, dto.color)
        : null;

    const size = variant?.size ?? dto.size.trim().toUpperCase();
    const color = variant?.colorName ?? dto.color.trim();
    const stock =
      product.variants.length > 0
        ? (variant?.stock ?? 0)
        : Math.max(0, product.stock);

    const existing = await this.prisma.cartItem.findUnique({
      where: {
        userId_productId_size_color: {
          userId,
          productId: product.id,
          size,
          color,
        },
      },
    });

    const requested = opts.add
      ? (existing?.quantity ?? 0) + dto.quantity
      : dto.quantity;

    if (requested <= 0 || stock <= 0) {
      if (existing) {
        await this.prisma.cartItem.delete({ where: { id: existing.id } });
      }
      return;
    }

    const quantity = Math.min(requested, stock, 99);

    await this.prisma.cartItem.upsert({
      where: {
        userId_productId_size_color: {
          userId,
          productId: product.id,
          size,
          color,
        },
      },
      create: {
        userId,
        productId: product.id,
        variantId: variant?.id ?? null,
        size,
        color,
        quantity,
      },
      update: {
        variantId: variant?.id ?? null,
        quantity,
      },
    });
  }

  private stockFor(row: {
    quantity: number;
    product: { stock: number; variants: { id: string; stock: number }[] };
    variant: { stock: number } | null;
    variantId: string | null;
  }) {
    if (row.product.variants.length === 0) {
      return Math.max(0, row.product.stock);
    }
    if (row.variant) return Math.max(0, row.variant.stock);
    const v = row.product.variants.find((x) => x.id === row.variantId);
    return v ? Math.max(0, v.stock) : 0;
  }

  private toClient(row: {
    productId: string;
    size: string;
    color: string;
    quantity: number;
    product: {
      name: string;
      price: { toString(): string } | number;
      image: string;
      stock: number;
      variants: { id: string; stock: number }[];
    };
    variant: { stock: number } | null;
    variantId: string | null;
  }) {
    return {
      productId: row.productId,
      name: row.product.name,
      price: Number(row.product.price),
      image: row.product.image,
      size: row.size,
      color: row.color,
      quantity: row.quantity,
      maxStock: this.stockFor(row),
    };
  }
}
