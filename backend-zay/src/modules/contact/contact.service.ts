import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateContactDto) {
    return this.prisma.contactMessage.create({
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email: dto.email.trim().toLowerCase(),
        subject: dto.subject,
        message: dto.message.trim(),
      },
    });
  }

  findAll() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  countNew() {
    return this.prisma.contactMessage.count({
      where: { status: ContactStatus.NEW },
    });
  }

  async updateStatus(id: string, status: ContactStatus) {
    const existing = await this.prisma.contactMessage.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException(`Message ${id} not found`);
    return this.prisma.contactMessage.update({
      where: { id },
      data: { status },
    });
  }
}
