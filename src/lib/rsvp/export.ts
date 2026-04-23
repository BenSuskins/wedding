import type { PrismaClient } from "@prisma/client";
import { ResultAsync } from "neverthrow";

import { writeCsv, type CsvCell } from "@/lib/csv/serialize";
import { unexpectedError, type UnexpectedError } from "@/lib/result";

export interface RsvpExportRow {
  inviteId: string;
  rsvpMode: string;
  plusOneAllowed: boolean;
  adminNotes: string | null;
  tokenVersion: number;
  guestId: string;
  guestName: string;
  isPlusOne: boolean;
  addedByGuest: boolean;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  attendingStatus: "yes" | "no" | "no_response";
  allergiesText: string | null;
  songRequestText: string | null;
  menuSelections: string | null;
  submittedAt: Date | null;
  updatedAt: Date | null;
}

const CSV_HEADERS: readonly string[] = [
  "invite_id",
  "rsvp_mode",
  "plus_one_allowed",
  "admin_notes",
  "token_version",
  "guest_id",
  "guest_name",
  "is_plus_one",
  "added_by_guest",
  "event_id",
  "event_slug",
  "event_title",
  "attending",
  "allergies",
  "song_request",
  "menu_selections",
  "submitted_at",
  "updated_at",
];

export function buildRsvpExportRows(
  prisma: PrismaClient,
): ResultAsync<RsvpExportRow[], UnexpectedError> {
  return ResultAsync.fromPromise(
    Promise.all([
      prisma.invite.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: {
          guests: {
            where: { deletedAt: null },
            orderBy: { orderIndex: "asc" },
          },
          eventAllowances: { select: { eventId: true } },
        },
      }),
      prisma.event.findMany({ orderBy: [{ orderIndex: "asc" }, { startsAt: "asc" }] }),
      prisma.rsvpResponse.findMany({
        where: { deletedAt: null },
        include: {
          menuSelections: {
            include: {
              option: { select: { label: true, course: { select: { title: true } } } },
            },
          },
        },
      }),
    ]),
    unexpectedError,
  ).map(([invites, events, responses]) => {
    const eventById = new Map(events.map((event) => [event.id, event]));
    const responseKey = (guestId: string, eventId: string) => `${guestId}::${eventId}`;
    const responseByGuestEvent = new Map(
      responses.map((response) => [responseKey(response.guestId, response.eventId), response]),
    );

    const rows: RsvpExportRow[] = [];
    for (const invite of invites) {
      for (const guest of invite.guests) {
        for (const allowance of invite.eventAllowances) {
          const event = eventById.get(allowance.eventId);
          if (!event) continue;
          const response = responseByGuestEvent.get(responseKey(guest.id, event.id));

          const menuSelections = response
            ? response.menuSelections
                .map(
                  (selection) =>
                    `${selection.option.course.title}: ${selection.option.label}`,
                )
                .join(" | ") || null
            : null;

          rows.push({
            inviteId: invite.id,
            rsvpMode: invite.rsvpMode,
            plusOneAllowed: invite.plusOneAllowed,
            adminNotes: invite.adminNotes,
            tokenVersion: invite.tokenVersion,
            guestId: guest.id,
            guestName: guest.displayName,
            isPlusOne: guest.isPlusOne,
            addedByGuest: guest.addedByGuest,
            eventId: event.id,
            eventSlug: event.slug,
            eventTitle: event.title,
            attendingStatus: response
              ? response.attending
                ? "yes"
                : "no"
              : "no_response",
            allergiesText: invite.allergiesText,
            songRequestText: invite.songRequestText,
            menuSelections: menuSelections ?? null,
            submittedAt: response?.submittedAt ?? null,
            updatedAt: response?.updatedAt ?? null,
          });
        }
      }
    }

    return rows;
  });
}

export function renderRsvpExportCsv(rows: ReadonlyArray<RsvpExportRow>): string {
  const body: CsvCell[][] = rows.map((row) => [
    row.inviteId,
    row.rsvpMode,
    row.plusOneAllowed,
    row.adminNotes,
    row.tokenVersion,
    row.guestId,
    row.guestName,
    row.isPlusOne,
    row.addedByGuest,
    row.eventId,
    row.eventSlug,
    row.eventTitle,
    row.attendingStatus,
    row.allergiesText,
    row.songRequestText,
    row.menuSelections,
    row.submittedAt,
    row.updatedAt,
  ]);
  return writeCsv(CSV_HEADERS, body);
}

export function exportRsvpCsv(
  prisma: PrismaClient,
): ResultAsync<string, UnexpectedError> {
  return buildRsvpExportRows(prisma).map(renderRsvpExportCsv);
}
