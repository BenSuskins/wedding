import type { PrismaClient } from "@prisma/client";
import { err, ok, ResultAsync } from "neverthrow";
import { z } from "zod";

import { notFoundError } from "@/lib/content/errors";
import { parseWithSchema, unexpectedError } from "@/lib/result";

import type { MenuCourseError, MenuOptionError } from "./errors";

export interface MenuOptionRecord {
  id: string;
  courseId: string;
  label: string;
  description: string | null;
  orderIndex: number;
}

export interface MenuCourseRecord {
  id: string;
  eventId: string | null;
  title: string;
  orderIndex: number;
  options: MenuOptionRecord[];
}

const courseInputSchema = z.object({
  eventId: z
    .union([z.string().trim().min(1), z.null()])
    .default(null),
  title: z.string().trim().min(1, "title is required").max(200),
  orderIndex: z.coerce.number().int().min(0).default(0),
});

const optionInputSchema = z.object({
  label: z.string().trim().min(1, "label is required").max(200),
  description: z
    .union([z.string(), z.literal("")])
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .default(null),
  orderIndex: z.coerce.number().int().min(0).default(0),
});

export type MenuCourseInput = z.input<typeof courseInputSchema>;
export type MenuOptionInput = z.input<typeof optionInputSchema>;

export function listMenuCoursesForEvent(
  prisma: PrismaClient,
  eventId: string,
): ResultAsync<MenuCourseRecord[], MenuCourseError> {
  return ResultAsync.fromPromise(
    prisma.menuCourse.findMany({
      where: { OR: [{ eventId }, { eventId: null }] },
      orderBy: [{ orderIndex: "asc" }, { title: "asc" }],
      include: {
        options: { orderBy: [{ orderIndex: "asc" }, { label: "asc" }] },
      },
    }),
    unexpectedError,
  ).map((rows) =>
    rows.map((row) => ({
      id: row.id,
      eventId: row.eventId,
      title: row.title,
      orderIndex: row.orderIndex,
      options: row.options.map((option) => ({
        id: option.id,
        courseId: option.courseId,
        label: option.label,
        description: option.description,
        orderIndex: option.orderIndex,
      })),
    })),
  );
}

export function createMenuCourse(
  prisma: PrismaClient,
  input: MenuCourseInput,
): ResultAsync<MenuCourseRecord, MenuCourseError> {
  return parseWithSchema(courseInputSchema, input).asyncAndThen((data) =>
    ResultAsync.fromPromise(
      prisma.menuCourse.create({
        data: {
          eventId: data.eventId,
          title: data.title,
          orderIndex: data.orderIndex,
        },
        include: { options: true },
      }),
      (cause) => {
        if (isPrismaForeignKeyViolation(cause)) {
          return notFoundError("event", data.eventId ?? "");
        }
        return unexpectedError(cause);
      },
    ).map(toCourseRecord),
  );
}

export function updateMenuCourse(
  prisma: PrismaClient,
  id: string,
  eventId: string,
  input: MenuCourseInput,
): ResultAsync<MenuCourseRecord, MenuCourseError> {
  return parseWithSchema(courseInputSchema, input).asyncAndThen((data) =>
    ResultAsync.fromPromise(
      prisma.menuCourse.update({
        where: { id, eventId },
        data: {
          eventId: data.eventId,
          title: data.title,
          orderIndex: data.orderIndex,
        },
        include: { options: true },
      }),
      (cause) => {
        if (isPrismaKnownNotFound(cause)) return notFoundError("menu_course", id);
        if (isPrismaForeignKeyViolation(cause)) {
          return notFoundError("event", data.eventId ?? "");
        }
        return unexpectedError(cause);
      },
    ).map(toCourseRecord),
  );
}

export function deleteMenuCourse(
  prisma: PrismaClient,
  id: string,
  eventId: string,
): ResultAsync<void, MenuCourseError> {
  return ResultAsync.fromPromise(
    prisma.menuCourse.delete({ where: { id, eventId } }).then(() => undefined),
    (cause) =>
      isPrismaKnownNotFound(cause) ? notFoundError("menu_course", id) : unexpectedError(cause),
  );
}

export function createMenuOption(
  prisma: PrismaClient,
  courseId: string,
  input: MenuOptionInput,
): ResultAsync<MenuOptionRecord, MenuOptionError> {
  return parseWithSchema(optionInputSchema, input).asyncAndThen((data) =>
    ResultAsync.fromPromise(
      prisma.menuOption.create({
        data: {
          courseId,
          label: data.label,
          description: data.description,
          orderIndex: data.orderIndex,
        },
      }),
      (cause) => {
        if (isPrismaForeignKeyViolation(cause)) {
          return notFoundError("menu_course", courseId);
        }
        return unexpectedError(cause);
      },
    ).map(toOptionRecord),
  );
}

export function updateMenuOption(
  prisma: PrismaClient,
  id: string,
  courseId: string,
  input: MenuOptionInput,
): ResultAsync<MenuOptionRecord, MenuOptionError> {
  return parseWithSchema(optionInputSchema, input).asyncAndThen((data) =>
    ResultAsync.fromPromise(
      prisma.menuOption.update({
        where: { id, courseId },
        data: {
          label: data.label,
          description: data.description,
          orderIndex: data.orderIndex,
        },
      }),
      (cause) =>
        isPrismaKnownNotFound(cause) ? notFoundError("menu_option", id) : unexpectedError(cause),
    ).map(toOptionRecord),
  );
}

export function deleteMenuOption(
  prisma: PrismaClient,
  id: string,
  courseId: string,
): ResultAsync<void, MenuOptionError> {
  return ResultAsync.fromPromise(
    prisma.menuOption.delete({ where: { id, courseId } }).then(() => undefined),
    (cause) =>
      isPrismaKnownNotFound(cause) ? notFoundError("menu_option", id) : unexpectedError(cause),
  );
}

export function getMenuCourseById(
  prisma: PrismaClient,
  id: string,
): ResultAsync<MenuCourseRecord, MenuCourseError> {
  return ResultAsync.fromPromise(
    prisma.menuCourse.findUnique({
      where: { id },
      include: { options: { orderBy: [{ orderIndex: "asc" }, { label: "asc" }] } },
    }),
    unexpectedError,
  ).andThen((row) => (row ? ok(toCourseRecord(row)) : err(notFoundError("menu_course", id))));
}

interface CourseRow {
  id: string;
  eventId: string | null;
  title: string;
  orderIndex: number;
  options: readonly OptionRow[];
}

interface OptionRow {
  id: string;
  courseId: string;
  label: string;
  description: string | null;
  orderIndex: number;
}

function toCourseRecord(row: CourseRow): MenuCourseRecord {
  return {
    id: row.id,
    eventId: row.eventId,
    title: row.title,
    orderIndex: row.orderIndex,
    options: row.options.map(toOptionRecord),
  };
}

function toOptionRecord(row: OptionRow): MenuOptionRecord {
  return {
    id: row.id,
    courseId: row.courseId,
    label: row.label,
    description: row.description,
    orderIndex: row.orderIndex,
  };
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

function isPrismaForeignKeyViolation(cause: unknown): boolean {
  return isPrismaKnownError(cause) && cause.code === "P2003";
}
