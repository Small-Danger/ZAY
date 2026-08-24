import type { ThrottlerStorage } from '@nestjs/throttler';
import type { RedisService } from './redis.service';

export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ) {
    const hitsKey = `zay:throttle:${throttlerName}:${key}:hits`;
    const blockKey = `zay:throttle:${throttlerName}:${key}:block`;
    const client = this.redis.client;

    const hits = await client.incr(hitsKey);
    if (hits === 1) {
      await client.pexpire(hitsKey, ttl);
    }

    const hitsTtl = await client.pttl(hitsKey);
    const timeToExpire = Math.max(1, Math.ceil(hitsTtl / 1000));

    const isBlocked = hits > limit;
    let timeToBlockExpire = 0;

    if (isBlocked) {
      const blockTtl = await client.pttl(blockKey);
      if (blockTtl > 0) {
        timeToBlockExpire = Math.ceil(blockTtl / 1000);
      } else {
        const duration = blockDuration > 0 ? blockDuration : ttl;
        await client.set(blockKey, '1', 'PX', duration);
        timeToBlockExpire = Math.max(1, Math.ceil(duration / 1000));
      }
    }

    return {
      totalHits: hits,
      timeToExpire,
      isBlocked,
      timeToBlockExpire,
    };
  }
}
