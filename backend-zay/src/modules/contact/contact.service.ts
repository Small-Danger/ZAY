import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContactStatus, ContactSubject } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { contactNotifyEmail } from '../mail/templates/contact-notify';
import { CreateContactDto } from './dto/create-contact.dto';

const SUBJECT_LABEL: Record<ContactSubject, string> = {
  ORDER_TRACKING: 'Suivi de commande',
  STYLING_ADVICE: 'Conseil style',
  RETURNS_EXCHANGES: 'Retours & échanges',
  MEDIA_PARTNERSHIP: 'Partenariat / presse',
  OTHER: 'Autre',
};

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateContactDto) {
    const created = await this.prisma.contactMessage.create({
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email: dto.email.trim().toLowerCase(),
        subject: dto.subject,
        message: dto.message.trim(),
      },
    });

    try {
      const adminTo = await this.resolveAdminNotifyEmail();
      if (adminTo) {
        const tpl = contactNotifyEmail({
          firstName: created.firstName,
          lastName: created.lastName,
          email: created.email,
          subjectLabel: SUBJECT_LABEL[created.subject] ?? created.subject,
          message: created.message,
        });
        await this.mail.send({
          to: adminTo,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
          replyTo: created.email,
        });
      }
    } catch (err) {
      this.logger.error(
        `E-mail contact ${created.id}: ${
          err instanceof Error ? err.message : 'erreur'
        }`,
      );
    }

    return created;
  }

  private async resolveAdminNotifyEmail(): Promise<string | null> {
    const configured =
      this.config.get<string>('app.adminNotifyEmail')?.trim() || '';
    if (configured) return configured;
    const settings = await this.prisma.storeSettings.findUnique({
      where: { id: 1 },
    });
    return settings?.contactEmail?.trim() || null;
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
