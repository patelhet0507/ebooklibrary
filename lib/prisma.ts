import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  adapter: PrismaPg | undefined;
};

function createAdapter() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 1,
    idleTimeoutMillis: 3000,
  });
  return new PrismaPg(pool);
}

if (!globalForPrisma.adapter) {
  globalForPrisma.adapter = createAdapter();
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: globalForPrisma.adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
