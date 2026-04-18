import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/healthz/route";

describe("GET /api/healthz", () => {
  it("returns 200 with status ok", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe("ok");
  });
});
