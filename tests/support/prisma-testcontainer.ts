import { execFileSync } from "node:child_process";
import path from "node:path";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { type PrismaClient } from "@prisma/client";

import { createPrismaClient } from "@/server/db";

export interface PrismaTestHarness {
  container: StartedPostgreSqlContainer;
  prisma: PrismaClient;
  connectionString: string;
  dispose: () => Promise<void>;
}

const repoRoot = path.resolve(__dirname, "..", "..");

export async function startPrismaTestHarness(): Promise<PrismaTestHarness> {
  const container = await new PostgreSqlContainer("postgres:16-alpine").start();
  const connectionString = container.getConnectionUri();

  execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
    cwd: repoRoot,
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: "pipe",
  });

  const prisma = createPrismaClient(connectionString);

  return {
    container,
    prisma,
    connectionString,
    dispose: async () => {
      await prisma.$disconnect();
      await container.stop();
    },
  };
}
