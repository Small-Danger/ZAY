import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const CATALOG_PREFIX = 'zay:catalog:';
const CATALOG_TTL_SECONDS = 60;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    const url = this.config.getOrThrow<string>('app.redisUrl');
    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
    this.client.on('error', (err) => {
      this.logger.error(`Redis: ${err.message}`);
    });
  }

  async onModuleInit() {
    await this.client.ping();
    this.logger.log('Redis connected');
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async ping(): Promise<boolean> {
    try {
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async getJson<T>(key: string): Promise<T | undefined> {
    const raw = await this.client.get(key);
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds = CATALOG_TTL_SECONDS) {
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  catalogProductsKey(query: {
    categoryId?: string;
    subcategoryId?: string;
    isNew?: boolean;
    isPromo?: boolean;
    search?: string;
  }) {
    return `${CATALOG_PREFIX}products:${JSON.stringify({
      categoryId: query.categoryId ?? '',
      subcategoryId: query.subcategoryId ?? '',
      isNew: query.isNew ?? '',
      isPromo: query.isPromo ?? '',
      search: query.search?.trim().toLowerCase() ?? '',
    })}`;
  }

  catalogProductKey(idOrSlug: string) {
    return `${CATALOG_PREFIX}product:${idOrSlug.trim().toLowerCase()}`;
  }

  catalogCategoriesKey() {
    return `${CATALOG_PREFIX}categories`;
  }

  catalogSubcategoriesKey(categoryId: string) {
    return `${CATALOG_PREFIX}subcategories:${categoryId}`;
  }

  async invalidateCatalog() {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [next, batch] = await this.client.scan(
        cursor,
        'MATCH',
        `${CATALOG_PREFIX}*`,
        'COUNT',
        100,
      );
      cursor = next;
      keys.push(...batch);
    } while (cursor !== '0');

    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }
}
