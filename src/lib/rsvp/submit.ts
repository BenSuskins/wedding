import type { AuditActorKind, PrismaClient, Prisma } from "@prisma/client";
import { errAsync, ResultAsync } from "neverthrow";
import { z } from "zod";

import type { Clock } from "@/lib/clock";
import { notFoundError } from "@/lib/content/errors";
import { parseWithSchema, unexpectedError } from "@/lib/result";

import { computeDeadlineStatus } from "./deadline";
import type { RsvpSubmitError } from "./errors";

export interface MenuSelectionInput {
  courseId: string;
  optionId: string;
}

export interface RsvpSubmitActor {
  kind: AuditActorKind;
  ref: string;
}

export interface RsvpSubmitInput {
  inviteId: string;
  guestId: string;
  eventId: string;
  attending: boolean;
  allergiesText: string | null;
  songRequestText: string | null;
  menuSelections: MenuSelectionInput[];
  actor: RsvpSubmitActor;
}

export interface RsvpSubmitResult {
  responseId: string;
  action: "create_rsvp" | "update_rsvp";
  attending: boolean;
  submittedAt: Date;
  updatedAt: Date;
}

const menuSelectionSchema = z.object({
  courseId: z.string().trim().min(1),
  optionId: z.string().trim().min(1),
});

const submitSchema = z.object({
  inviteId: z.string().trim().min(1),
  guestId: z.string().trim().min(1),
  eventId: z.string().trim().min(1),
  attending: z.boolean(),
  allergiesText: z
    .union([z.string(), z.null()])
    .transform((value) => (typeof value === "string" ? value.trim() : value))
    .transform((value) => (value === "" ? null : value)),
  songRequestText: z
    .union([z.string(), z.null()])
    .transform((value) => (typeof value === "string" ? value.trim() : value))
    .transform((value) => (value === "" ? null : value)),
  menuSelections: z.array(menuSelectionSchema).default([]),
  actor: z.object({
    kind: z.enum(["guest_token", "admin"]),
    ref: z.string().trim().min(1),
  }),
});

export function submitRsvp(
  prisma: PrismaClient,
  clock: Clock,
  input: RsvpSubmitInput,
  rsvpDeadline: Date | null,
): ResultAsync<RsvpSubmitResult, RsvpSubmitError> {
  return parseWithSchema(submitSchema, input).asyncAndThen((data) => {
    const deadlineStatus = computeDeadlineStatus(rsvpDeadline, clock.now());
    if (deadlineStatus.kind === "locked") {
      return errAsync<RsvpSubmitResult, RsvpSubmitError>({
        kind: "deadline_passed",
        deadline: deadlineStatus.deadline,
      });
    }

    return ResultAsync.fromPromise(
      runSubmission(prisma, data),
      (cause) => {
        if (cause instanceof SubmissionError) return cause.error;
        return unexpectedError(cause);
      },
    );
  });
}

type ParsedSubmit = z.output<typeof submitSchema>;

async function runSubmission(
  prisma: PrismaClient,
  data: ParsedSubmit,
): Promise<RsvpSubmitResult> {
  const invite = await prisma.invite.findUnique({
    where: { id: data.inviteId },
    include: {
      guests: { where: { deletedAt: null }, select: { id: true } },
      eventAllowances: { select: { eventId: true } },
    },
  });
  if (!invite) throw new SubmissionError(notFoundError("invite", data.inviteId));

  const guestBelongs = invite.guests.some((guest) => guest.id === data.guestId);
  if (!guestBelongs) throw new SubmissionError({ kind: "guest_not_in_invite" });

  const eventAllowed = invite.eventAllowances.some(
    (allowance) => allowance.eventId === data.eventId,
  );
  if (!eventAllowed) throw new SubmissionError({ kind: "event_not_allowed" });

  const courseIdsSeen = new Set<string>();
  for (const selection of data.menuSelections) {
    if (courseIdsSeen.has(selection.courseId)) {
      throw new SubmissionError({
        kind: "duplicate_course_selection",
        courseId: selection.courseId,
      });
    }
    courseIdsSeen.add(selection.courseId);
  }

  if (data.attending && data.menuSelections.length > 0) {
    const options = await prisma.menuOption.findMany({
      where: { id: { in: data.menuSelections.map((selection) => selection.optionId) } },
      include: { course: { select: { id: true, eventId: true } } },
    });
    const optionsById = new Map(options.map((option) => [option.id, option]));
    for (const selection of data.menuSelections) {
      const option = optionsById.get(selection.optionId);
      if (!option || option.courseId !== selection.courseId) {
        throw new SubmissionError({
          kind: "invalid_menu_option",
          courseId: selection.courseId,
          optionId: selection.optionId,
        });
      }
      if (option.course.eventId !== null && option.course.eventId !== data.eventId) {
        throw new SubmissionError({
          kind: "invalid_menu_option",
          courseId: selection.courseId,
          optionId: selection.optionId,
        });
      }
    }
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.rsvpResponse.findUnique({
      where: { guestId_eventId: { guestId: data.guestId, eventId: data.eventId } },
      select: { id: true },
    });
    const action = existing ? "update_rsvp" : "create_rsvp";

    const response = await tx.rsvpResponse.upsert({
      where: { guestId_eventId: { guestId: data.guestId, eventId: data.eventId } },
      create: {
        guestId: data.guestId,
        eventId: data.eventId,
        attending: data.attending,
        allergiesText: data.allergiesText,
        songRequestText: data.songRequestText,
      },
      update: {
        attending: data.attending,
        allergiesText: data.allergiesText,
        songRequestText: data.songRequestText,
        deletedAt: null,
      },
    });

    await tx.rsvpMenuSelection.deleteMany({ where: { responseId: response.id } });
    if (data.attending && data.menuSelections.length > 0) {
      await tx.rsvpMenuSelection.createMany({
        data: data.menuSelections.map((selection) => ({
          responseId: response.id,
          courseId: selection.courseId,
          optionId: selection.optionId,
        })),
      });
    }

    const payload: Prisma.InputJsonValue = {
      attending: data.attending,
      allergiesText: data.allergiesText,
      songRequestText: data.songRequestText,
      menuSelections: data.menuSelections.map((selection) => ({
        courseId: selection.courseId,
        optionId: selection.optionId,
      })),
    };

    await tx.rsvpAuditLog.create({
      data: {
        inviteId: data.inviteId,
        guestId: data.guestId,
        eventId: data.eventId,
        action,
        payloadJson: payload,
        actorKind: data.actor.kind,
        actorRef: data.actor.ref,
      },
    });

    return {
      responseId: response.id,
      action,
      attending: response.attending,
      submittedAt: response.submittedAt,
      updatedAt: response.updatedAt,
    };
  });
}

class SubmissionError extends Error {
  override readonly name = "SubmissionError";
  constructor(readonly error: RsvpSubmitError) {
    super("rsvp submission failed");
  }
}
