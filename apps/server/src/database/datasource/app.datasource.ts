import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { config } from 'dotenv';
import * as entities from '../entities';

config();

// Base database config shared between NestJS and CLI
const getBaseConfig = () => ({
  type: 'postgres' as const,
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'user',
  password: process.env.POSTGRES_PASSWORD || 'password',
  database: process.env.POSTGRES_NAME || 'postgres',
  migrationsTableName: '__migrations__',
  migrationsRun: false,
  ssl: process.env.NODE_ENV === 'production' ? true : false,
  extra: {
    options: '-c search_path=public,core',
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : undefined,
  },
  synchronize: false,
});

// For NestJS runtime - use explicit entity imports (webpack compatible)
export const createTypeOrmOptions = (): TypeOrmModuleOptions => ({
  ...getBaseConfig(),
  entities: Object.values(entities),
});

// For TypeORM CLI - use glob patterns (works with ts-node)
const getDatabaseRoot = (): string => {
  const cwd = process.cwd();
  return join(cwd, 'src', 'database');
};

export const createCliDataSourceOptions = (): DataSourceOptions => {
  const databaseRoot = getDatabaseRoot();
  return {
    ...getBaseConfig(),
    entities: [join(databaseRoot, 'entities', '**', '*.entity.{ts,js}')],
    migrations: [join(databaseRoot, 'migrations', '**', '*.{ts,js}')],
  };
};

// DataSource for TypeORM CLI (migrations)
export const AppDataSource = new DataSource(createCliDataSourceOptions());
