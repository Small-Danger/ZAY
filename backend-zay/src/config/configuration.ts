import { registerAs } from '@nestjs/config';

const isProd = (process.env.NODE_ENV ?? 'development') === 'production';

function requireProdSecret(
  name: string,
  value: string | undefined,
  forbidden?: string,
) {
  const trimmed = value?.trim() ?? '';
  if (isProd && (!trimmed || (forbidden && trimmed === forbidden))) {
    throw new Error(
      `${name} doit être défini avec une valeur unique en production (Railway Variables).`,
    );
  }
  return trimmed;
}

export default registerAs('app', () => {
  const jwtSecret = requireProdSecret(
    'JWT_SECRET',
    process.env.JWT_SECRET,
    'change-me-zay-dev-secret-min-32-chars!!',
  );
  const adminPassword = requireProdSecret(
    'ADMIN_PASSWORD',
    process.env.ADMIN_PASSWORD,
    'Admin123!',
  );

  let frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '') || '';
  if (isProd) {
    if (!frontendUrl || /localhost|127\.0\.0\.1/.test(frontendUrl)) {
      throw new Error(
        'FRONTEND_URL doit être l’URL HTTPS publique du frontend en production (Railway Variables).',
      );
    }
  } else if (!frontendUrl) {
    frontendUrl = 'http://localhost:9002';
  }

  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:9002')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (frontendUrl && !corsOrigins.includes(frontendUrl)) {
    corsOrigins.push(frontendUrl);
  }

  return {
    port: Number(process.env.PORT ?? 4000),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    databaseUrl: process.env.DATABASE_URL,
    corsOrigins,
    jwtSecret: jwtSecret || 'change-me-zay-dev-secret-min-32-chars!!',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    adminEmail: process.env.ADMIN_EMAIL ?? 'admin@zay.local',
    adminPassword: adminPassword || 'Admin123!',
    frontendUrl,
    stripeSecretKey: (process.env.STRIPE_SECRET_KEY ?? '')
      .trim()
      .replace(/[\r\n]/g, '')
      .replace(/^["']|["']$/g, ''),
    stripeWebhookSecret: (process.env.STRIPE_WEBHOOK_SECRET ?? '')
      .trim()
      .replace(/[\r\n]/g, ''),
    redisUrl: (() => {
      const url = process.env.REDIS_URL?.trim() || '';
      if (isProd && !url) {
        throw new Error(
          'REDIS_URL doit être défini en production (plugin Railway Redis).',
        );
      }
      return url || 'redis://127.0.0.1:56379';
    })(),
  };
});
