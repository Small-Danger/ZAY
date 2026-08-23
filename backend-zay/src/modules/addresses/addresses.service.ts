import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  findMine(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(userId: string, dto: CreateAddressDto) {
    const count = await this.prisma.address.count({ where: { userId } });
    const isDefault = dto.isDefault ?? count === 0;

    if (isDefault) {
      await this.clearDefault(userId);
    }

    return this.prisma.address.create({
      data: {
        userId,
        name: dto.name.trim(),
        street: dto.street.trim(),
        city: dto.city.trim(),
        zip: dto.zip.trim(),
        country: (dto.country ?? 'France').trim(),
        isDefault,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    const existing = await this.requireOwned(userId, id);

    if (dto.isDefault === true) {
      await this.clearDefault(userId);
    }

    return this.prisma.address.update({
      where: { id: existing.id },
      data: {
        name: dto.name?.trim(),
        street: dto.street?.trim(),
        city: dto.city?.trim(),
        zip: dto.zip?.trim(),
        country: dto.country?.trim(),
        isDefault: dto.isDefault,
      },
    });
  }

  async setDefault(userId: string, id: string) {
    const existing = await this.requireOwned(userId, id);
    await this.clearDefault(userId);
    return this.prisma.address.update({
      where: { id: existing.id },
      data: { isDefault: true },
    });
  }

  async remove(userId: string, id: string) {
    const existing = await this.requireOwned(userId, id);
    await this.prisma.address.delete({ where: { id: existing.id } });

    if (existing.isDefault) {
      const next = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (next) {
        await this.prisma.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
  }

  private async clearDefault(userId: string) {
    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  private async requireOwned(userId: string, id: string) {
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!address) {
      throw new NotFoundException(`Address ${id} not found`);
    }
    return address;
  }
}
