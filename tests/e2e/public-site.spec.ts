import { expect, test } from "@playwright/test";

test.describe("public site", () => {
  test("home page exposes security headers", async ({ request }) => {
    const response = await request.get("/");
    expect(response.status()).toBe(200);
    expect(response.headers()["x-frame-options"]).toBe("DENY");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(response.headers()["x-powered-by"]).toBeUndefined();
  });

  for (const path of ["/schedule", "/travel", "/faq", "/gifts"]) {
    test(`${path} renders without error`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status(), `${path} responded ${response?.status()}`).toBeLessThan(500);
    });
  }

  test("unknown invite token returns 4xx", async ({ request }) => {
    const response = await request.get("/rsvp/not-a-valid-token");
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test("admin area redirects unauthenticated visitors", async ({ page }) => {
    const response = await page.goto("/admin", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(500);
    await expect(page).not.toHaveURL(/\/admin$/);
  });

  test("admin CSV export rejects unauthenticated requests", async ({ request }) => {
    const response = await request.get("/api/admin/export");
    expect([401, 403, 302, 307]).toContain(response.status());
  });

  test("healthz reports ok", async ({ request }) => {
    const response = await request.get("/api/healthz");
    expect(response.status()).toBe(200);
  });
});
