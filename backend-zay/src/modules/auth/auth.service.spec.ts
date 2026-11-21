import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

describe('AuthService — mot de passe oublié', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    passwordResetToken: {
      findUnique: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let mail: { send: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      passwordResetToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn(async (fn: (tx: typeof prisma) => unknown) =>
        fn(prisma),
      ),
    };
    mail = { send: jest.fn().mockResolvedValue(true) };

    service = new AuthService(
      prisma as unknown as PrismaService,
      { sign: jest.fn().mockReturnValue('jwt') } as unknown as JwtService,
      {
        get: (key: string) =>
          key === 'app.frontendUrl' ? 'http://localhost:9002' : '',
        getOrThrow: (key: string) =>
          key === 'app.adminEmail'
            ? 'admin@zay.local'
            : key === 'app.adminPassword'
              ? 'Admin123!'
              : '',
      } as unknown as ConfigService,
      mail as unknown as MailService,
    );
  });

  it('forgot-password e-mail inconnu → { ok: true } sans envoi', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.forgotPassword({ email: 'inconnu@example.com' }),
    ).resolves.toEqual({ ok: true });

    expect(mail.send).not.toHaveBeenCalled();
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it('jeton expiré → refus', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'tok-1',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() - 60_000),
    });

    await expect(
      service.resetPassword({ token: 'raw-token', newPassword: 'Nouveau123' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('jeton déjà utilisé → refus', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'tok-1',
      userId: 'user-1',
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      service.resetPassword({ token: 'raw-token', newPassword: 'Nouveau123' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reset réussi → ancien mot de passe invalide et jeton non réutilisable', async () => {
    const oldHash = await bcrypt.hash('Ancien123', 10);
    const rawToken = 'a'.repeat(64);
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'tok-1',
      userId: 'user-1',
      tokenHash,
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    prisma.user.update.mockImplementation(
      async ({ data }: { data: { passwordHash: string } }) => ({
        id: 'user-1',
        passwordHash: data.passwordHash,
      }),
    );

    await expect(
      service.resetPassword({ token: rawToken, newPassword: 'Nouveau456!' }),
    ).resolves.toEqual({ ok: true });

    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: { id: 'tok-1', usedAt: null },
      data: { usedAt: expect.any(Date) },
    });

    const newHash = prisma.user.update.mock.calls[0][0].data.passwordHash as string;
    expect(await bcrypt.compare('Ancien123', newHash)).toBe(false);
    expect(await bcrypt.compare('Nouveau456!', newHash)).toBe(true);
    expect(await bcrypt.compare('Ancien123', oldHash)).toBe(true);

    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'tok-1',
      userId: 'user-1',
      tokenHash,
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      service.resetPassword({ token: rawToken, newPassword: 'Encore789!' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
