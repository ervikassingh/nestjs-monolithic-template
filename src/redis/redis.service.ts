import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async setValue(key: string, value: string) {
    await this.redis.set(key, value);
  }

  async setValueWithExpiration(key: string, value: string, expiration: number) {
    await this.redis.set(key, value, 'EX', expiration);
  }

  async getValue(key: string) {
    return this.redis.get(key);
  }
}
