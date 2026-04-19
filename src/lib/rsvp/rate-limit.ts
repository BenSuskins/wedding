import type { Clock } from "@/lib/clock";

export type RateLimitResult =
  | { kind: "allowed"; remaining: number }
  | { kind: "limited"; retryAfterMs: number };

export interface RateLimiter {
  consume(key: string, cost?: number): RateLimitResult;
}

export interface RateLimiterConfig {
  capacity: number;
  refillTokens: number;
  refillIntervalMs: number;
}

interface BucketState {
  tokens: number;
  lastRefillMs: number;
}

export function createInMemoryRateLimiter(
  clock: Clock,
  config: RateLimiterConfig,
): RateLimiter {
  if (config.capacity <= 0) {
    throw new Error("rate limiter capacity must be positive");
  }
  if (config.refillTokens <= 0) {
    throw new Error("rate limiter refillTokens must be positive");
  }
  if (config.refillIntervalMs <= 0) {
    throw new Error("rate limiter refillIntervalMs must be positive");
  }

  const buckets = new Map<string, BucketState>();
  const refillRatePerMs = config.refillTokens / config.refillIntervalMs;

  function currentTokens(state: BucketState, nowMs: number): number {
    const elapsed = Math.max(0, nowMs - state.lastRefillMs);
    return Math.min(config.capacity, state.tokens + elapsed * refillRatePerMs);
  }

  return {
    consume(key, cost = 1) {
      const nowMs = clock.now().getTime();
      const existing = buckets.get(key) ?? { tokens: config.capacity, lastRefillMs: nowMs };
      const available = currentTokens(existing, nowMs);

      if (available < cost) {
        const deficit = cost - available;
        const retryAfterMs = Math.ceil(deficit / refillRatePerMs);
        buckets.set(key, { tokens: available, lastRefillMs: nowMs });
        return { kind: "limited", retryAfterMs };
      }

      const remaining = available - cost;
      buckets.set(key, { tokens: remaining, lastRefillMs: nowMs });
      return { kind: "allowed", remaining: Math.floor(remaining) };
    },
  };
}
