import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export const createRedisConfig = (
  configService: ConfigService
): RedisOptions => {
  const tlsEnabled = configService.get<boolean>('REDIS_TLS', false);

  return {
    host: configService.get<string>('REDIS_HOST', '127.0.0.1'),
    port: configService.get<number>('REDIS_PORT', 6379),
    db: configService.get<number>('REDIS_DB', 0),
    username: configService.get<string | undefined>('REDIS_USERNAME'),
    password: configService.get<string | undefined>('REDIS_PASSWORD'),
    tls: tlsEnabled
      ? {
          rejectUnauthorized: !configService.get<boolean>(
            'REDIS_TLS_INSECURE',
            true
          ),
        }
      : undefined,
  };
};
