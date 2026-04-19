import { systemClock } from "@/lib/clock";

import { createInMemoryRateLimiter, type RateLimiter } from "./rate-limit";

const TOKEN_BUCKET_CAPACITY = 15;
const TOKEN_REFILL = 15;
const TOKEN_REFILL_INTERVAL_MS = 60_000;

const IP_BUCKET_CAPACITY = 60;
const IP_REFILL = 60;
const IP_REFILL_INTERVAL_MS = 60_000;

declare global {
  var __rsvpRateLimiters: {
    byToken: RateLimiter;
    byIp: RateLimiter;
  } | undefined;
}

export function getRsvpRateLimiters(): { byToken: RateLimiter; byIp: RateLimiter } {
  if (!globalThis.__rsvpRateLimiters) {
    globalThis.__rsvpRateLimiters = {
      byToken: createInMemoryRateLimiter(systemClock, {
        capacity: TOKEN_BUCKET_CAPACITY,
        refillTokens: TOKEN_REFILL,
        refillIntervalMs: TOKEN_REFILL_INTERVAL_MS,
      }),
      byIp: createInMemoryRateLimiter(systemClock, {
        capacity: IP_BUCKET_CAPACITY,
        refillTokens: IP_REFILL,
        refillIntervalMs: IP_REFILL_INTERVAL_MS,
      }),
    };
  }
  return globalThis.__rsvpRateLimiters;
}
