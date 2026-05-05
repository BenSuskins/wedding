import type { PrismaClient } from "@prisma/client";
import { ResultAsync } from "neverthrow";

import { unexpectedError } from "@/lib/result";
import type { UnexpectedError } from "@/lib/result";

export interface DashboardStats {
  totalInvites: number;
  invitesResponded: number;
  totalGuests: number;
  guestsResponded: number;
  guestsAttending: number;
  guestsDeclined: number;
}

export interface EventBreakdown {
  eventId: string;
  slug: string;
  title: string;
  attending: number;
  declined: number;
  noResponse: number;
  total: number;
}

export function getEventBreakdown(
  prisma: PrismaClient,
): ResultAsync<EventBreakdown[], UnexpectedError> {
  return ResultAsync.fromPromise(
    prisma.event.findMany({ orderBy: { orderIndex: "asc" } }).then((events) =>
      Promise.all(
        events.map(async (event) => {
          const [attending, declined, total] = await Promise.all([
            prisma.rsvpResponse.count({
              where: {
                eventId: event.id,
                attending: true,
                deletedAt: null,
                guest: { deletedAt: null, invite: { deletedAt: null } },
              },
            }),
            prisma.rsvpResponse.count({
              where: {
                eventId: event.id,
                attending: false,
                deletedAt: null,
                guest: { deletedAt: null, invite: { deletedAt: null } },
              },
            }),
            prisma.guest.count({
              where: {
                deletedAt: null,
                invite: {
                  deletedAt: null,
                  eventAllowances: { some: { eventId: event.id } },
                },
              },
            }),
          ]);
          return {
            eventId: event.id,
            slug: event.slug,
            title: event.title,
            attending,
            declined,
            noResponse: total - attending - declined,
            total,
          };
        }),
      ),
    ),
    unexpectedError,
  );
}

export function getDashboardStats(
  prisma: PrismaClient,
): ResultAsync<DashboardStats, UnexpectedError> {
  return ResultAsync.fromPromise(
    Promise.all([
      prisma.invite.count({ where: { deletedAt: null } }),
      prisma.invite.count({
        where: {
          deletedAt: null,
          guests: {
            some: { deletedAt: null, rsvpResponses: { some: { deletedAt: null } } },
          },
        },
      }),
      prisma.guest.count({ where: { deletedAt: null, invite: { deletedAt: null } } }),
      prisma.guest.count({
        where: {
          deletedAt: null,
          invite: { deletedAt: null },
          rsvpResponses: { some: { deletedAt: null } },
        },
      }),
      prisma.rsvpResponse.count({
        where: { deletedAt: null, attending: true, guest: { deletedAt: null, invite: { deletedAt: null } } },
      }),
      prisma.rsvpResponse.count({
        where: { deletedAt: null, attending: false, guest: { deletedAt: null, invite: { deletedAt: null } } },
      }),
    ]),
    unexpectedError,
  ).map(([totalInvites, invitesResponded, totalGuests, guestsResponded, guestsAttending, guestsDeclined]) => ({
    totalInvites,
    invitesResponded,
    totalGuests,
    guestsResponded,
    guestsAttending,
    guestsDeclined,
  }));
}
