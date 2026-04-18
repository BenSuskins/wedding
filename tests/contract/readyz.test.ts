import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  startPrismaTestHarness,
  type PrismaTestHarness,
} from "../support/prisma-testcontainer";

describe("GET /api/readyz", () => {
  let harness: PrismaTestHarness;
  let originalDatabaseUrl: string | undefined;

  beforeAll(async () => {
    harness = await startPrismaTestHarness();
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = harness.connectionString;
    delete (globalThis as { __prisma?: unknown }).__prisma;
  }, 180_000);

  afterAll(async () => {
    delete (globalThis as { __prisma?: unknown }).__prisma;
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
    await harness?.dispose();
  });

  it("returns 200 ready when the DB responds", async () => {
    const { GET } = await import("@/app/api/readyz/route");
    const response = await GET();
    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe("ready");
  });

  it("returns 503 unready when the DB is unreachable", async () => {
    process.env.DATABASE_URL =
      "postgresql://postgres:wrong@127.0.0.1:1/nonexistent?connect_timeout=1";
    delete (globalThis as { __prisma?: unknown }).__prisma;

    const { GET } = await import("@/app/api/readyz/route");
    const response = await GET();
    expect(response.status).toBe(503);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe("unready");

    process.env.DATABASE_URL = harness.connectionString;
    delete (globalThis as { __prisma?: unknown }).__prisma;
  });
});
