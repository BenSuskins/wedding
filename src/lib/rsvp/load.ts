import type { PrismaClient } from "@prisma/client";
import { err, ok, ResultAsync } from "neverthrow";

import type { Clock } from "@/lib/clock";
import { notFoundError } from "@/lib/content/errors";
import type { EventRecord } from "@/lib/content/event";
import type { GuestRecord, InviteRecord } from "@/lib/invite/invite";
import type { InviteTokenSigner } from "@/lib/invite-token";
import { unexpectedError } from "@/lib/result";

import { getRsvpDeadlineStatus } from "./deadline";
import type { DeadlineStatus, RsvpLoadError } from "./errors";
import type { MenuCourseRecord } from "./menu";

export interface RsvpMenuSelectionRecord {
  courseId: string;
  optionId: string;
}

export interface RsvpResponseRecord {
  id: string;
  guestId: string;
  eventId: string;
  attending: boolean;
  submittedAt: Date;
  updatedAt: Date;
  selections: RsvpMenuSelectionRecord[];
}

export interface EventWithMenuCourses extends EventRecord {
  courses: MenuCourseRecord[];
}

export interface RsvpLoadedState {
  invite: InviteRecord;
  guests: GuestRecord[];
  events: EventWithMenuCourses[];
  responses: RsvpResponseRecord[];
  deadline: DeadlineStatus;
}

export function loadRsvpStateByToken(
  prisma: PrismaClient,
  signer: InviteTokenSigner,
  clock: Clock,
  token: string,
): ResultAsync<RsvpLoadedState, RsvpLoadError> {
  const verification = signer.verify(token);
  if (verification.isErr()) {
    const kind =
      verification.error.kind === "malformed"
        ? ("token_malformed" as const)
        : ("token_signature_mismatch" as const);
    return ResultAsync.fromSafePromise(Promise.resolve(null)).andThen(() => err({ kind }));
  }

  const { inviteId, tokenVersion } = verification.value;

  return ResultAsync.fromPromise(
    prisma.invite.findUnique({
      where: { id: inviteId },
      include: {
        guests: { where: { deletedAt: null }, orderBy: { orderIndex: "asc" } },
        eventAllowances: { select: { eventId: true } },
      },
    }),
    unexpectedError,
  )
    .andThen((invite) => {
      if (!invite || invite.deletedAt) return err(notFoundError("invite", inviteId));
      if (invite.tokenVersion !== tokenVersion) {
        return err({ kind: "token_version_stale" as const });
      }
      return ok(invite);
    })
    .andThen((invite) => {
      const allowedEventIds = invite.eventAllowances.map((allowance) => allowance.eventId);
      const guestIds = invite.guests.map((guest) => guest.id);

      return ResultAsync.fromPromise(
        Promise.all([
          prisma.event.findMany({
            where: { id: { in: allowedEventIds } },
            orderBy: [{ orderIndex: "asc" }, { startsAt: "asc" }],
          }),
          prisma.menuCourse.findMany({
            where: {
              OR: [{ eventId: { in: allowedEventIds } }, { eventId: null }],
            },
            orderBy: [{ orderIndex: "asc" }, { title: "asc" }],
            include: { options: { orderBy: [{ orderIndex: "asc" }, { label: "asc" }] } },
          }),
          prisma.rsvpResponse.findMany({
            where: {
              guestId: { in: guestIds },
              eventId: { in: allowedEventIds },
              deletedAt: null,
            },
            include: { menuSelections: true },
          }),
          getRsvpDeadlineStatus(prisma, clock),
        ]),
        unexpectedError,
      ).andThen(([eventRows, courseRows, responseRows, deadlineResult]) => {
        if (deadlineResult.isErr()) {
          return err(unexpectedError(deadlineResult.error));
        }

        const events: EventWithMenuCourses[] = eventRows.map((event) => ({
          id: event.id,
          slug: event.slug,
          title: event.title,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          locationName: event.locationName,
          locationAddress: event.locationAddress,
          locationMapUrl: event.locationMapUrl,
          descriptionMarkdown: event.descriptionMarkdown,
          orderIndex: event.orderIndex,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
          courses: courseRows
            .filter((course) => course.eventId === event.id || course.eventId === null)
            .map((course) => ({
              id: course.id,
              eventId: course.eventId,
              title: course.title,
              orderIndex: course.orderIndex,
              options: course.options.map((option) => ({
                id: option.id,
                courseId: option.courseId,
                label: option.label,
                description: option.description,
                orderIndex: option.orderIndex,
              })),
            })),
        }));

        const responses: RsvpResponseRecord[] = responseRows.map((row) => ({
          id: row.id,
          guestId: row.guestId,
          eventId: row.eventId,
          attending: row.attending,
          submittedAt: row.submittedAt,
          updatedAt: row.updatedAt,
          selections: row.menuSelections.map((selection) => ({
            courseId: selection.courseId,
            optionId: selection.optionId,
          })),
        }));

        const deadline = deadlineResult.value;

        const state: RsvpLoadedState = {
          invite: {
            id: invite.id,
            tokenVersion: invite.tokenVersion,
            rsvpMode: invite.rsvpMode,
            plusOneAllowed: invite.plusOneAllowed,
            invitationSent: invite.invitationSent,
            adminNotes: invite.adminNotes,
            allergiesText: invite.allergiesText,
            songRequestText: invite.songRequestText,
            createdAt: invite.createdAt,
            updatedAt: invite.updatedAt,
          },
          guests: invite.guests.map((guest) => ({
            id: guest.id,
            displayName: guest.displayName,
            isPlusOne: guest.isPlusOne,
            addedByGuest: guest.addedByGuest,
            orderIndex: guest.orderIndex,
            createdAt: guest.createdAt,
            updatedAt: guest.updatedAt,
          })),
          events,
          responses,
          deadline,
        };

        return ok(state);
      });
    });
}

export function getDeadlineFromState(state: RsvpLoadedState): Date | null {
  return state.deadline.deadline;
}
