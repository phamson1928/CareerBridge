import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

function isTransientConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  const code = (error as { code?: string }).code;
  return (
    message.includes('connection terminated') ||
    message.includes('client has encountered a connection error') ||
    message.includes('socket hang up') ||
    message.includes('econnreset') ||
    code === 'ECONNRESET' ||
    code === '57P01' ||
    code === '08006' ||
    code === '08003'
  );
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL must be set before creating PrismaService');
    }

    const pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    const rawQuery = pool.query.bind(pool) as (...args: unknown[]) => Promise<unknown>;
    pool.query = (async (...args: unknown[]) => {
      try {
        return await rawQuery(...args);
      } catch (error) {
        if (isTransientConnectionError(error)) {
          return await rawQuery(...args);
        }
        throw error;
      }
    }) as typeof pool.query;

    super({
      adapter: new PrismaPg(pool, {
        disposeExternalPool: true,
        onPoolError: (err) => {
          this.logger.warn(`Idle PostgreSQL pool client error: ${err.message}`);
        },
      }),
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
