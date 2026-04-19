import type { PrismaClient } from "@prisma/client";
import { err, ok, ResultAsync } from "neverthrow";
import { z } from "zod";

import {
  notFoundError,
  slugTakenError,
  type EventError,
} from "@/lib/content/errors";
import { parseWithSchema, unexpectedError } from "@/lib/result";

export interface EventRecord {
  id: string;
  slug: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  locationName: string;
  locationAddress: string;
  locationMapUrl: string | null;
  descriptionMarkdown: string | null;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const eventBaseSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(1, "slug is required")
      .max(80)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "slug must be kebab-case (lowercase letters, digits, hyphens)",
      ),
    title: z.string().trim().min(1, "title is required").max(200),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    locationName: z.string().trim().min(1, "location name is required").max(200),
    locationAddress: z
      .string()
      .trim()
      .min(1, "location address is required")
      .max(500),
    locationMapUrl: z
      .union([z.url(), z.literal("")])
      .transform((value) => (value === "" ? null : value))
      .nullable()
      .default(null),
    descriptionMarkdown: z
      .union([z.string(), z.literal("")])
      .transform((value) => (value === "" ? null : value))
      .nullable()
      .default(null),
    orderIndex: z.coerce.number().int().min(0).default(0),
  })
  .refine((data) => data.startsAt.getTime() <= data.endsAt.getTime(), {
    message: "endsAt must be on or after startsAt",
    path: ["endsAt"],
  });

export type EventInput = z.input<typeof eventBaseSchema>;
export type ParsedEventInput = z.output<typeof eventBaseSchema>;

export function listEvents(
  prisma: PrismaClient,
): ResultAsync<EventRecord[], EventError> {
  return ResultAsync.fromPromise(
    prisma.event.findMany({ orderBy: [{ orderIndex: "asc" }, { startsAt: "asc" }] }),
    unexpectedError,
  );
}

export function getEventById(
  prisma: PrismaClient,
  id: string,
): ResultAsync<EventRecord, EventError> {
  return ResultAsync.fromPromise(
    prisma.event.findUnique({ where: { id } }),
    unexpectedError,
  ).andThen((row) => (row ? ok(row) : err(notFoundError("event", id))));
}

export function getEventBySlug(
  prisma: PrismaClient,
  slug: string,
): ResultAsync<EventRecord, EventError> {
  return ResultAsync.fromPromise(
    prisma.event.findUnique({ where: { slug } }),
    unexpectedError,
  ).andThen((row) => (row ? ok(row) : err(notFoundError("event", slug))));
}

export function createEvent(
  prisma: PrismaClient,
  input: EventInput,
): ResultAsync<EventRecord, EventError> {
  return parseWithSchema(eventBaseSchema, input).asyncAndThen((data) =>
    upsertData(prisma, null, data),
  );
}

export function updateEvent(
  prisma: PrismaClient,
  id: string,
  input: EventInput,
): ResultAsync<EventRecord, EventError> {
  return parseWithSchema(eventBaseSchema, input).asyncAndThen((data) =>
    upsertData(prisma, id, data),
  );
}

export function deleteEvent(
  prisma: PrismaClient,
  id: string,
): ResultAsync<void, EventError> {
  return ResultAsync.fromPromise(
    prisma.event.delete({ where: { id } }).then(() => undefined),
    (cause) => {
      if (isPrismaKnownNotFound(cause)) {
        return notFoundError("event", id);
      }
      return unexpectedError(cause);
    },
  );
}

function upsertData(
  prisma: PrismaClient,
  id: string | null,
  data: ParsedEventInput,
): ResultAsync<EventRecord, EventError> {
  const payload = {
    slug: data.slug,
    title: data.title,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    locationName: data.locationName,
    locationAddress: data.locationAddress,
    locationMapUrl: data.locationMapUrl,
    descriptionMarkdown: data.descriptionMarkdown,
    orderIndex: data.orderIndex,
  };
  const promise = id
    ? prisma.event.update({ where: { id }, data: payload })
    : prisma.event.create({ data: payload });
  return ResultAsync.fromPromise(promise, (cause) => {
    if (isPrismaUniqueViolation(cause, "slug")) return slugTakenError(data.slug);
    if (id && isPrismaKnownNotFound(cause)) return notFoundError("event", id);
    return unexpectedError(cause);
  });
}

function isPrismaUniqueViolation(cause: unknown, field: string): boolean {
  if (!isPrismaKnownError(cause)) return false;
  if (cause.code !== "P2002") return false;
  const meta = cause.meta as
    | {
        target?: readonly string[];
        driverAdapterError?: {
          cause?: { constraint?: { fields?: readonly string[] } };
        };
      }
    | undefined;
  if (Array.isArray(meta?.target) && meta.target.includes(field)) return true;
  const adapterFields = meta?.driverAdapterError?.cause?.constraint?.fields;
  return Array.isArray(adapterFields) && adapterFields.includes(field);
}

function isPrismaKnownNotFound(cause: unknown): boolean {
  return isPrismaKnownError(cause) && cause.code === "P2025";
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
