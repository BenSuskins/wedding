import { describe, expect, it } from "vitest";

import { computeCountdown } from "@/lib/countdown";

describe("computeCountdown", () => {
  it("returns days/hours/minutes/seconds for a future target", () => {
    const now = new Date("2026-04-19T12:00:00.000Z");
    const target = new Date("2026-05-01T15:30:45.000Z");
    const parts = computeCountdown(target, now);
    expect(parts.hasElapsed).toBe(false);
    expect(parts.days).toBe(12);
    expect(parts.hours).toBe(3);
    expect(parts.minutes).toBe(30);
    expect(parts.seconds).toBe(45);
  });

  it("marks a past target as elapsed with zeroed parts", () => {
    const now = new Date("2026-04-19T12:00:00.000Z");
    const target = new Date("2026-04-18T12:00:00.000Z");
    const parts = computeCountdown(target, now);
    expect(parts.hasElapsed).toBe(true);
    expect(parts.days).toBe(0);
    expect(parts.hours).toBe(0);
    expect(parts.minutes).toBe(0);
    expect(parts.seconds).toBe(0);
  });

  it("treats the exact target instant as elapsed", () => {
    const instant = new Date("2026-05-01T00:00:00.000Z");
    const parts = computeCountdown(instant, instant);
    expect(parts.hasElapsed).toBe(true);
  });
});
