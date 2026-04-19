import type { PrismaClient } from "@prisma/client";
import { errAsync, okAsync, ResultAsync } from "neverthrow";

import { getSiteSetting } from "@/lib/content/site-setting";
import type { Clock } from "@/lib/clock";

import type { DeadlineError, DeadlineStatus } from "./errors";

export function computeDeadlineStatus(
  deadline: Date | null,
  now: Date,
): DeadlineStatus {
  if (!deadline) return { kind: "open", deadline: null };
  if (now.getTime() >= deadline.getTime()) {
    return { kind: "locked", deadline };
  }
  return { kind: "open", deadline };
}

export function isRsvpLocked(status: DeadlineStatus): boolean {
  return status.kind === "locked";
}

export function getRsvpDeadlineStatus(
  prisma: PrismaClient,
  clock: Clock,
): ResultAsync<DeadlineStatus, DeadlineError> {
  return getSiteSetting(prisma, "rsvp_deadline")
    .map((record) => computeDeadlineStatus(new Date(record.value.isoDate), clock.now()))
    .orElse((error) => {
      if (error.kind === "not_found") {
        return okAsync<DeadlineStatus, DeadlineError>(computeDeadlineStatus(null, clock.now()));
      }
      return errAsync<DeadlineStatus, DeadlineError>(error);
    });
}
