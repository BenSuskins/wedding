import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("contract smoke: real postgres via testcontainers", () => {
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:16-alpine").start();
  }, 120_000);

  afterAll(async () => {
    await container?.stop();
  });

  it("can connect and run SELECT 1", async () => {
    const client = new Client({ connectionString: container.getConnectionUri() });
    await client.connect();
    try {
      const result = await client.query<{ value: number }>("SELECT 1::int AS value");
      expect(result.rows[0]?.value).toBe(1);
    } finally {
      await client.end();
    }
  });
});
