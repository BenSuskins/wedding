import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export function createPrismaClient(connectionString: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

declare global {
  var __prisma: PrismaClient | undefined;
}

export function getPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  if (process.env.NODE_ENV === "production") {
    return createPrismaClient(connectionString);
  }
  if (!globalThis.__prisma) {
    globalThis.__prisma = createPrismaClient(connectionString);
  }
  return globalThis.__prisma;
}
