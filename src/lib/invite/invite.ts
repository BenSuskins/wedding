import type { PrismaClient, RsvpMode } from "@prisma/client";
import { err, errAsync, ok, ResultAsync } from "neverthrow";
import { z } from "zod";

import { notFoundError } from "@/lib/content/errors";
import type {
  GuestError,
  InviteError,
  InviteLookupError,
} from "@/lib/invite/errors";
import type { InviteTokenSigner } from "@/lib/invite-token";
import { parseWithSchema, unexpectedError } from "@/lib/result";

export interface GuestRecord {
  id: string;
  displayName: string;
  isPlusOne: boolean;
  addedByGuest: boolean;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RsvpResponseRecord {
  eventId: string;
  attending: boolean;
}

export interface GuestWithResponses extends GuestRecord {
  responses: RsvpResponseRecord[];
}

export interface InviteEventAllowanceRecord {
  eventId: string;
}

export interface InviteRecord {
  id: string;
  tokenVersion: number;
  rsvpMode: RsvpMode;
  plusOneAllowed: boolean;
  adminNotes: string | null;
  allergiesText: string | null;
  songRequestText: string | null;
  invitationSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InviteWithRelations extends InviteRecord {
  guests: GuestRecord[];
  eventAllowances: InviteEventAllowanceRecord[];
}

export interface InviteDetailRecord extends InviteRecord {
  guests: GuestWithResponses[];
  eventAllowances: InviteEventAllowanceRecord[];
}

export type InviteStatus = "not_sent" | "awaiting" | "responded" | "declined";

export interface InviteListItem extends InviteRecord {
  activeGuestCount: number;
  guestNames: string[];
  eventTitles: string[];
  hasResponded: boolean;
  status: InviteStatus;
}

const guestInputSchema = z.object({
  displayName: z.string().trim().min(1, "display name is required").max(200),
  orderIndex: z.coerce.number().int().min(0).default(0),
});

const createInviteSchema = z.object({
  rsvpMode: z.enum(["household", "individual"]).default("household"),
  plusOneAllowed: z.coerce.boolean().default(false),
  adminNotes: z
    .union([z.string(), z.literal("")])
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .default(null),
  guests: z.array(guestInputSchema).min(1, "at least one guest is required"),
  eventIds: z.array(z.string().trim().min(1)).default([]),
});

const updatePreferencesSchema = z.object({
  allergiesText: z
    .union([z.string(), z.null()])
    .transform((value) => (typeof value === "string" ? value.trim() : value))
    .transform((value) => (value === "" ? null : value)),
  songRequestText: z
    .union([z.string(), z.null()])
    .transform((value) => (typeof value === "string" ? value.trim() : value))
    .transform((value) => (value === "" ? null : value)),
});

const updateCoreSchema = z.object({
  rsvpMode: z.enum(["household", "individual"]),
  plusOneAllowed: z.coerce.boolean(),
  invitationSent: z.coerce.boolean(),
  adminNotes: z
    .union([z.string(), z.literal("")])
    .transform((value) => (value === "" ? null : value))
    .nullable(),
});

const guestUpdateSchema = guestInputSchema;

export type CreateInviteInput = z.input<typeof createInviteSchema>;
export type UpdateInviteCoreInput = z.input<typeof updateCoreSchema>;
export type GuestInput = z.input<typeof guestInputSchema>;
export type UpdateInvitePreferencesInput = z.input<typeof updatePreferencesSchema>;

function deriveInviteStatus(
  invitationSent: boolean,
  responses: { attending: boolean }[],
): InviteStatus {
  if (responses.length === 0) return invitationSent ? "awaiting" : "not_sent";
  if (responses.every((r) => !r.attending)) return "declined";
  return "responded";
}

export function listInvites(
  prisma: PrismaClient,
): ResultAsync<InviteListItem[], InviteError> {
  return ResultAsync.fromPromise(
    prisma.invite.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        guests: {
          where: { deletedAt: null },
          select: {
            displayName: true,
            rsvpResponses: { where: { deletedAt: null }, select: { attending: true } },
          },
        },
        eventAllowances: { select: { event: { select: { title: true } } } },
      },
    }),
    unexpectedError,
  ).map((rows) =>
    rows.map((row) => ({
      id: row.id,
      tokenVersion: row.tokenVersion,
      rsvpMode: row.rsvpMode,
      plusOneAllowed: row.plusOneAllowed,
      adminNotes: row.adminNotes,
      allergiesText: row.allergiesText,
      songRequestText: row.songRequestText,
      invitationSent: row.invitationSent,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      activeGuestCount: row.guests.length,
      guestNames: row.guests.map((g) => g.displayName),
      eventTitles: row.eventAllowances.map((ea) => ea.event.title),
      hasResponded: row.guests.some((g) => g.rsvpResponses.length > 0),
      status: deriveInviteStatus(
        row.invitationSent,
        row.guests.flatMap((g) => g.rsvpResponses),
      ),
    })),
  );
}

export function getInviteById(
  prisma: PrismaClient,
  id: string,
): ResultAsync<InviteDetailRecord, InviteError> {
  return ResultAsync.fromPromise(
    prisma.invite.findUnique({
      where: { id },
      include: {
        guests: {
          where: { deletedAt: null },
          orderBy: { orderIndex: "asc" },
          include: {
            rsvpResponses: {
              where: { deletedAt: null },
              select: { eventId: true, attending: true },
            },
          },
        },
        eventAllowances: { select: { eventId: true } },
      },
    }),
    unexpectedError,
  ).andThen((row) => {
    if (!row || row.deletedAt) return err(notFoundError("invite", id));
    return ok({
      ...row,
      guests: row.guests.map((guest) => ({
        ...guest,
        responses: guest.rsvpResponses,
      })),
    });
  });
}

export function getInviteByToken(
  prisma: PrismaClient,
  signer: InviteTokenSigner,
  token: string,
): ResultAsync<InviteWithRelations, InviteLookupError> {
  const verifyResult = signer.verify(token);
  if (verifyResult.isErr()) {
    const kind =
      verifyResult.error.kind === "malformed"
        ? "token_malformed"
        : "token_signature_mismatch";
    return errAsync<InviteWithRelations, InviteLookupError>({ kind });
  }

  const { inviteId, tokenVersion } = verifyResult.value;
  return ResultAsync.fromPromise(
    prisma.invite.findUnique({
      where: { id: inviteId },
      include: {
        guests: { where: { deletedAt: null }, orderBy: { orderIndex: "asc" } },
        eventAllowances: { select: { eventId: true } },
      },
    }),
    unexpectedError,
  ).andThen((row) => {
    if (!row || row.deletedAt) return err(notFoundError("invite", inviteId));
    if (row.tokenVersion !== tokenVersion) {
      return err({ kind: "token_version_stale" } as const);
    }
    return ok(row);
  });
}

export function createInvite(
  prisma: PrismaClient,
  input: CreateInviteInput,
): ResultAsync<InviteWithRelations, InviteError> {
  return parseWithSchema(createInviteSchema, input).asyncAndThen((data) =>
    ResultAsync.fromPromise(
      prisma.invite.create({
        data: {
          rsvpMode: data.rsvpMode,
          plusOneAllowed: data.plusOneAllowed,
          adminNotes: data.adminNotes,
          guests: {
            create: data.guests.map((guest, index) => ({
              displayName: guest.displayName,
              orderIndex: guest.orderIndex || index,
            })),
          },
          eventAllowances: {
            create: data.eventIds.map((eventId) => ({ eventId })),
          },
        },
        include: {
          guests: { where: { deletedAt: null }, orderBy: { orderIndex: "asc" } },
          eventAllowances: { select: { eventId: true } },
        },
      }),
      unexpectedError,
    ),
  );
}

export function updateInviteCore(
  prisma: PrismaClient,
  id: string,
  input: UpdateInviteCoreInput,
): ResultAsync<InviteRecord, InviteError> {
  return parseWithSchema(updateCoreSchema, input).asyncAndThen((data) =>
    ResultAsync.fromPromise(
      prisma.invite.update({ where: { id }, data }),
      (cause) =>
        isPrismaKnownNotFound(cause) ? notFoundError("invite", id) : unexpectedError(cause),
    ),
  );
}

export function setInviteEventAllowances(
  prisma: PrismaClient,
  id: string,
  eventIds: readonly string[],
): ResultAsync<InviteEventAllowanceRecord[], InviteError> {
  const unique = Array.from(new Set(eventIds.map((value) => value.trim()).filter(Boolean)));
  return ResultAsync.fromPromise(
    prisma.$transaction(async (tx) => {
      const invite = await tx.invite.findUnique({ where: { id }, select: { id: true } });
      if (!invite) throw new InviteMissingError(id);
      await tx.inviteEventAllowance.deleteMany({ where: { inviteId: id } });
      if (unique.length > 0) {
        await tx.inviteEventAllowance.createMany({
          data: unique.map((eventId) => ({ inviteId: id, eventId })),
        });
      }
      return tx.inviteEventAllowance.findMany({
        where: { inviteId: id },
        select: { eventId: true },
      });
    }),
    (cause) => {
      if (cause instanceof InviteMissingError) return notFoundError("invite", cause.inviteId);
      return unexpectedError(cause);
    },
  );
}

export function rotateInviteToken(
  prisma: PrismaClient,
  id: string,
): ResultAsync<InviteRecord, InviteError> {
  return ResultAsync.fromPromise(
    prisma.invite.update({
      where: { id },
      data: { tokenVersion: { increment: 1 } },
    }),
    (cause) =>
      isPrismaKnownNotFound(cause) ? notFoundError("invite", id) : unexpectedError(cause),
  );
}

export function deleteInvite(
  prisma: PrismaClient,
  id: string,
): ResultAsync<void, InviteError> {
  return ResultAsync.fromPromise(
    prisma.invite
      .update({ where: { id }, data: { deletedAt: new Date() } })
      .then(() => undefined),
    (cause) =>
      isPrismaKnownNotFound(cause) ? notFoundError("invite", id) : unexpectedError(cause),
  );
}

export function addGuest(
  prisma: PrismaClient,
  inviteId: string,
  input: GuestInput,
): ResultAsync<GuestRecord, GuestError> {
  return parseWithSchema(guestUpdateSchema, input).asyncAndThen((data) =>
    ResultAsync.fromPromise(
      prisma.guest.create({
        data: {
          inviteId,
          displayName: data.displayName,
          orderIndex: data.orderIndex,
        },
      }),
      unexpectedError,
    ),
  );
}

export function updateGuest(
  prisma: PrismaClient,
  guestId: string,
  inviteId: string,
  input: GuestInput,
): ResultAsync<GuestRecord, GuestError> {
  return parseWithSchema(guestUpdateSchema, input).asyncAndThen((data) =>
    ResultAsync.fromPromise(
      prisma.guest.update({
        where: { id: guestId, inviteId },
        data: {
          displayName: data.displayName,
          orderIndex: data.orderIndex,
        },
      }),
      (cause) =>
        isPrismaKnownNotFound(cause) ? notFoundError("guest", guestId) : unexpectedError(cause),
    ),
  );
}

export function updateInvitePreferences(
  prisma: PrismaClient,
  id: string,
  input: UpdateInvitePreferencesInput,
): ResultAsync<InviteRecord, InviteError> {
  return parseWithSchema(updatePreferencesSchema, input).asyncAndThen((data) =>
    ResultAsync.fromPromise(
      prisma.invite.update({ where: { id }, data }),
      (cause) =>
        isPrismaKnownNotFound(cause) ? notFoundError("invite", id) : unexpectedError(cause),
    ),
  );
}

export function softDeleteGuest(
  prisma: PrismaClient,
  guestId: string,
  inviteId: string,
): ResultAsync<void, GuestError> {
  return ResultAsync.fromPromise(
    prisma.guest
      .update({ where: { id: guestId, inviteId }, data: { deletedAt: new Date() } })
      .then(() => undefined),
    (cause) =>
      isPrismaKnownNotFound(cause) ? notFoundError("guest", guestId) : unexpectedError(cause),
  );
}

class InviteMissingError extends Error {
  override readonly name = "InviteMissingError";
  constructor(readonly inviteId: string) {
    super(`invite ${inviteId} not found`);
  }
}

interface PrismaKnownErrorShape {
  code: string;
  meta?: unknown;
}

function isPrismaKnownError(cause: unknown): cause is PrismaKnownErrorShape {
  return (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    typeof (cause as { code: unknown }).code === "string"
  );
}

function isPrismaKnownNotFound(cause: unknown): boolean {
  return isPrismaKnownError(cause) && cause.code === "P2025";
}
