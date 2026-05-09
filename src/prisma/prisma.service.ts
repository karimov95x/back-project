import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;
  private readonly databaseUrl?: string;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    const shouldUseSsl =
      process.env.DATABASE_SSL === "true" ||
      process.env.PGSSLMODE === "require";

    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
    });

    const adapter = new PrismaPg(pool);

    super({ adapter });

    this.pool = pool;
    this.databaseUrl = databaseUrl;
  }

  async onModuleInit() {
    if (!this.databaseUrl) {
      throw new ServiceUnavailableException(
        "DATABASE_URL is not set. Add it to back-project/.env before starting the backend.",
      );
    }

    try {
      await this.$connect();
      await this.$queryRaw`SELECT 1`;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (
        message.includes("password authentication failed") ||
        message.includes("Authentication failed against the database server") ||
        message.includes("P1000")
      ) {
        throw new ServiceUnavailableException(
          "Database authentication failed. Update DATABASE_URL in back-project/.env with valid PostgreSQL credentials.",
        );
      }

      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
