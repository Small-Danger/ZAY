import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PromoType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePromoDto,
  UpdatePromoDto,
  ValidatePromoDto,
} from './dto/promo.dto';

@Injectable()
export class PromosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreatePromoDto) {
    const code = dto.code.trim().toUpperCase();
    try {
      return await this.prisma.promoCode.create({
        data: {
          code,
          type: dto.type,
          value: new Prisma.Decimal(dto.value),
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          usageLimit: dto.usageLimit ?? null,
          active: dto.active ?? true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`Promo code ${code} already exists`);
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdatePromoDto) {
    await this.findOne(id);
    try {
      return await this.prisma.promoCode.update({
        where: { id },
        data: {
          code: dto.code?.trim().toUpperCase(),
          type: dto.type,
          value:
            dto.value === undefined
              ? undefined
              : new Prisma.Decimal(dto.value),
          expiresAt:
            dto.expiresAt === undefined
              ? undefined
              : dto.expiresAt === null
                ? null
                : new Date(dto.expiresAt),
          usageLimit:
            dto.usageLimit === undefined ? undefined : dto.usageLimit,
          active: dto.active,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Promo code already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.promoCode.delete({ where: { id } });
  }

  async validate(dto: ValidatePromoDto) {
    const promo = await this.getValidPromo(dto.code);
    const discountAmount = this.computeDiscount(promo.type, Number(promo.value), dto.subtotal);
    return {
      valid: true,
      code: promo.code,
      type: promo.type,
      value: Number(promo.value),
      discountAmount,
    };
  }

  async getValidPromo(code: string) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!promo || !promo.active) {
      throw new BadRequestException('Code promo invalide ou inactif');
    }
    if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Code promo expiré');
    }
    if (promo.usageLimit != null && promo.usageCount >= promo.usageLimit) {
      throw new BadRequestException(
        'Ce code promo a atteint sa limite d’utilisation',
      );
    }
    return promo;
  }

  computeDiscount(type: PromoType, value: number, subtotal: number): number {
    const raw =
      type === PromoType.PERCENTAGE
        ? (subtotal * value) / 100
        : value;
    return Math.min(Math.max(0, Number(raw.toFixed(2))), subtotal);
  }

  private async findOne(id: string) {
    const promo = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException(`Promo ${id} not found`);
    return promo;
  }
}
