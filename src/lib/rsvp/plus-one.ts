import type { PrismaClient, Prisma } from "@prisma/client";
import { errAsync, ResultAsync } from "neverthrow";
import { z } from "zod";

import type { Clock } from "@/lib/clock";
import { notFoundError } from "@/lib/content/errors";
import type { GuestRecord } from "@/lib/invite/invite";
import { parseWithSchema, unexpectedError } from "@/lib/result";

import { computeDeadlineStatus } from "./deadline";
import type { AddPlusOneError } from "./errors";

const addPlusOneSchema = z.object({
  inviteId: z.string().trim().min(1),
  displayName: z.string().trim().min(1, "name is required").max(200),
});

export interface AddPlusOneInput {
  inviteId: string;
  displayName: string;
  actorRef: string;
}

export function addPlusOneGuest(
  prisma: PrismaClient,
  clock: Clock,
  input: AddPlusOneInput,
  rsvpDeadline: Date | null,
): ResultAsync<GuestRecord, AddPlusOneError> {
  return parseWithSchema(addPlusOneSchema, {
    inviteId: input.inviteId,
    displayName: input.displayName,
  }).asyncAndThen((data) => {
    const deadlineStatus = computeDeadlineStatus(rsvpDeadline, clock.now());
    if (deadlineStatus.kind === "locked") {
      return errAsync<GuestRecord, AddPlusOneError>({
        kind: "deadline_passed",
        deadline: deadlineStatus.deadline,
      });
    }

    return ResultAsync.fromPromise(runAddPlusOne(prisma, data, input.actorRef), (cause) => {
      if (cause instanceof AddPlusOneException) return cause.error;
      return unexpectedError(cause);
    });
  });
}

type ParsedAdd = z.output<typeof addPlusOneSchema>;

async function runAddPlusOne(
  prisma: PrismaClient,
  data: ParsedAdd,
  actorRef: string,
): Promise<GuestRecord> {
  const invite = await prisma.invite.findUnique({
    where: { id: data.inviteId },
    include: {
      guests: { where: { deletedAt: null }, select: { id: true, isPlusOne: true } },
    },
  });
  if (!invite) throw new AddPlusOneException(notFoundError("invite", data.inviteId));
  if (!invite.plusOneAllowed) {
    throw new AddPlusOneException({ kind: "plus_one_not_allowed" });
  }
  if (invite.guests.some((guest) => guest.isPlusOne)) {
    throw new AddPlusOneException({ kind: "plus_one_already_added" });
  }

  return prisma.$transaction(async (tx) => {
    const maxOrderIndex = invite.guests.length;
    const guest = await tx.guest.create({
      data: {
        inviteId: data.inviteId,
        displayName: data.displayName,
        isPlusOne: true,
        addedByGuest: true,
        orderIndex: maxOrderIndex,
      },
    });

    const payload: Prisma.InputJsonValue = {
      displayName: data.displayName,
      isPlusOne: true,
      addedByGuest: true,
    };

    await tx.rsvpAuditLog.create({
      data: {
        inviteId: data.inviteId,
        guestId: guest.id,
        action: "add_plus_one",
        payloadJson: payload,
        actorKind: "guest_token",
        actorRef,
      },
    });

    return {
      id: guest.id,
      displayName: guest.displayName,
      isPlusOne: guest.isPlusOne,
      addedByGuest: guest.addedByGuest,
      orderIndex: guest.orderIndex,
      createdAt: guest.createdAt,
      updatedAt: guest.updatedAt,
    };
  });
}

class AddPlusOneException extends Error {
  override readonly name = "AddPlusOneException";
  constructor(readonly error: AddPlusOneError) {
    super("add plus one failed");
  }
}
