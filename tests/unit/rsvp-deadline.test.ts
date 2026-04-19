import { describe, expect, it } from "vitest";

import { computeDeadlineStatus, isRsvpLocked } from "@/lib/rsvp/deadline";

describe("computeDeadlineStatus", () => {
  it("is open when no deadline is configured", () => {
    const status = computeDeadlineStatus(null, new Date("2026-05-01T00:00:00Z"));
    expect(status).toEqual({ kind: "open", deadline: null });
    expect(isRsvpLocked(status)).toBe(false);
  });

  it("is open when now is before the deadline", () => {
    const deadline = new Date("2026-06-01T00:00:00Z");
    const status = computeDeadlineStatus(deadline, new Date("2026-05-01T00:00:00Z"));
    expect(status).toEqual({ kind: "open", deadline });
    expect(isRsvpLocked(status)).toBe(false);
  });

  it("is locked exactly at the deadline", () => {
    const deadline = new Date("2026-06-01T00:00:00Z");
    const status = computeDeadlineStatus(deadline, new Date("2026-06-01T00:00:00Z"));
    expect(status.kind).toBe("locked");
    expect(isRsvpLocked(status)).toBe(true);
  });

  it("is locked when now is past the deadline", () => {
    const deadline = new Date("2026-06-01T00:00:00Z");
    const status = computeDeadlineStatus(deadline, new Date("2026-07-01T00:00:00Z"));
    expect(status.kind).toBe("locked");
    if (status.kind === "locked") {
      expect(status.deadline.toISOString()).toBe(deadline.toISOString());
    }
  });
});
