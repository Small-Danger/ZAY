import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { passwordResetEmail } from '../mail/templates/password-reset';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  ChangePasswordDto,
  UpdateProfileDto,
} from './dto/update-profile.dto';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export type PublicUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: Role;
};

export type AuthResponse = {
  accessToken: string;
  user: PublicUser;
};

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async onModuleInit() {
    await this.ensureAdminUser();
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: dto.firstName?.trim() || null,
        lastName: dto.lastName?.trim() || null,
        role: Role.CUSTOMER,
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return this.toPublicUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<PublicUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName:
          dto.firstName === undefined
            ? undefined
            : dto.firstName?.trim() || null,
        lastName:
          dto.lastName === undefined
            ? undefined
            : dto.lastName?.trim() || null,
        phone:
          dto.phone === undefined ? undefined : dto.phone?.trim() || null,
      },
    });
    return this.toPublicUser(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { ok: true };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ ok: true }> {
    const email = dto.email.trim().toLowerCase();
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        return { ok: true };
      }

      const token = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      await this.prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: new Date() },
        });
        await tx.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt,
          },
        });
      });

      const frontendUrl = this.config.get<string>('app.frontendUrl') ?? '';
      const resetUrl = `${frontendUrl}/reinitialiser-mot-de-passe?token=${encodeURIComponent(token)}`;
      const tpl = passwordResetEmail({
        firstName: user.firstName,
        resetUrl,
      });
      await this.mail.send({
        to: user.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });
    } catch (err) {
      this.logger.error(
        `forgot-password: ${err instanceof Error ? err.message : 'erreur'}`,
      );
    }
    return { ok: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ ok: true }> {
    const tokenHash = createHash('sha256')
      .update(dto.token.trim())
      .digest('hex');
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (
      !record ||
      record.usedAt != null ||
      record.expiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException('Lien invalide ou expiré');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException('Lien invalide ou expiré');
      }
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      });
    });

    return { ok: true };
  }

  private buildAuthResponse(user: User): AuthResponse {
    const accessToken = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: this.toPublicUser(user),
    };
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
    };
  }

  private async ensureAdminUser() {
    const email = this.config
      .getOrThrow<string>('app.adminEmail')
      .trim()
      .toLowerCase();
    const password = this.config.getOrThrow<string>('app.adminPassword');
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.upsert({
      where: { email },
      update: {
        role: Role.ADMIN,
      },
      create: {
        email,
        passwordHash,
        firstName: 'Admin',
        lastName: 'ZAY',
        role: Role.ADMIN,
      },
    });

    this.logger.log(`ADMIN ready: ${user.email}`);
  }
}
