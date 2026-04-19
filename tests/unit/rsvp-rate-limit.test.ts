import { describe, expect, it } from "vitest";

import { createFakeClock } from "@/lib/clock";
import { createInMemoryRateLimiter } from "@/lib/rsvp/rate-limit";

describe("in-memory rate limiter", () => {
  it("allows requests up to capacity then rejects until refill", () => {
    const clock = createFakeClock(new Date("2026-05-01T00:00:00Z"));
    const limiter = createInMemoryRateLimiter(clock, {
      capacity: 3,
      refillTokens: 1,
      refillIntervalMs: 1_000,
    });

    expect(limiter.consume("token").kind).toBe("allowed");
    expect(limiter.consume("token").kind).toBe("allowed");
    expect(limiter.consume("token").kind).toBe("allowed");
    const limited = limiter.consume("token");
    expect(limited.kind).toBe("limited");
    if (limited.kind === "limited") {
      expect(limited.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it("refills tokens over time at the configured rate", () => {
    const clock = createFakeClock(new Date("2026-05-01T00:00:00Z"));
    const limiter = createInMemoryRateLimiter(clock, {
      capacity: 2,
      refillTokens: 1,
      refillIntervalMs: 1_000,
    });

    limiter.consume("token");
    limiter.consume("token");
    expect(limiter.consume("token").kind).toBe("limited");

    clock.advance(1_000);
    expect(limiter.consume("token").kind).toBe("allowed");
    expect(limiter.consume("token").kind).toBe("limited");
  });

  it("keys are independent", () => {
    const clock = createFakeClock(new Date("2026-05-01T00:00:00Z"));
    const limiter = createInMemoryRateLimiter(clock, {
      capacity: 1,
      refillTokens: 1,
      refillIntervalMs: 60_000,
    });

    expect(limiter.consume("a").kind).toBe("allowed");
    expect(limiter.consume("a").kind).toBe("limited");
    expect(limiter.consume("b").kind).toBe("allowed");
  });

  it("reports a monotonic retry-after when the bucket is empty", () => {
    const clock = createFakeClock(new Date("2026-05-01T00:00:00Z"));
    const limiter = createInMemoryRateLimiter(clock, {
      capacity: 1,
      refillTokens: 1,
      refillIntervalMs: 5_000,
    });

    limiter.consume("token");
    const firstDenial = limiter.consume("token");
    expect(firstDenial.kind).toBe("limited");
    if (firstDenial.kind === "limited") {
      expect(firstDenial.retryAfterMs).toBeLessThanOrEqual(5_000);
    }

    clock.advance(1_000);
    const secondDenial = limiter.consume("token");
    expect(secondDenial.kind).toBe("limited");
    if (secondDenial.kind === "limited" && firstDenial.kind === "limited") {
      expect(secondDenial.retryAfterMs).toBeLessThan(firstDenial.retryAfterMs);
    }
  });

  it("rejects invalid configuration at construction time", () => {
    const clock = createFakeClock(new Date());
    expect(() =>
      createInMemoryRateLimiter(clock, { capacity: 0, refillTokens: 1, refillIntervalMs: 1 }),
    ).toThrow();
    expect(() =>
      createInMemoryRateLimiter(clock, { capacity: 1, refillTokens: 0, refillIntervalMs: 1 }),
    ).toThrow();
    expect(() =>
      createInMemoryRateLimiter(clock, { capacity: 1, refillTokens: 1, refillIntervalMs: 0 }),
    ).toThrow();
  });
});
