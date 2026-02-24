import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createRedisConfig } from './redis.config';

@Injectable()
export class RedisService implements OnModuleDestroy, OnModuleInit {
  private redis: Redis;
  private subscriber: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.createConnection();
  }

  async onModuleDestroy() {
    await Promise.all([this.redis.quit(), this.subscriber.quit()]);
  }

  private createConnection() {
    const redisConfig = createRedisConfig(this.configService);
    this.redis = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);
    this.setupKeySpaceNotifications();
  }

  getClient(): Redis {
    return this.redis;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  async ping(): Promise<string> {
    return this.redis.ping();
  }

   
  private async setupKeySpaceNotifications() {
    // Enable notifications for expired keys
    // 'KEx' means: 
    //   K = keyspace events (publishes to __keyspace@<db>__:<key>)
    //   E = keyevent events (publishes to __keyevent@<db>__:<event>)
    //   x = expired events
    await this.redis.config('SET', 'notify-keyspace-events', 'KEx');
  }
  
}
