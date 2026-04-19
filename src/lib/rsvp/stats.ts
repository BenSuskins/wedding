import type { PrismaClient } from "@prisma/client";
import { ResultAsync } from "neverthrow";

import { unexpectedError } from "@/lib/result";
import type { UnexpectedError } from "@/lib/result";

export interface DashboardStats {
  totalInvites: number;
  invitesResponded: number;
  totalGuests: number;
  guestsResponded: number;
}

export function getDashboardStats(
  prisma: PrismaClient,
): ResultAsync<DashboardStats, UnexpectedError> {
  return ResultAsync.fromPromise(
    Promise.all([
      prisma.invite.count(),
      prisma.invite.count({
        where: {
          guests: {
            some: { deletedAt: null, rsvpResponses: { some: { deletedAt: null } } },
          },
        },
      }),
      prisma.guest.count({ where: { deletedAt: null } }),
      prisma.guest.count({
        where: { deletedAt: null, rsvpResponses: { some: { deletedAt: null } } },
      }),
    ]),
    unexpectedError,
  ).map(([totalInvites, invitesResponded, totalGuests, guestsResponded]) => ({
    totalInvites,
    invitesResponded,
    totalGuests,
    guestsResponded,
  }));
}
