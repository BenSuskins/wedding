import type { PrismaClient } from "@prisma/client";
import { err, ok, ResultAsync, type Result } from "neverthrow";
import { z } from "zod";

import { notFoundError, type ContentBlockError } from "@/lib/content/errors";
import { parseWithSchema, unexpectedError } from "@/lib/result";

export interface ContentBlockRecord {
  id: string;
  key: string;
  title: string;
  bodyMarkdown: string;
  updatedAt: Date;
  updatedByAdmin: string | null;
}

const upsertSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "key is required")
    .max(64, "key must be 64 characters or fewer")
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "key must be lowercase alphanumeric with underscores",
    ),
  title: z.string().trim().min(1, "title is required").max(200),
  bodyMarkdown: z.string().min(1, "body is required"),
  updatedByAdmin: z.string().trim().min(1).max(200).nullable(),
});

export type UpsertContentBlockInput = z.input<typeof upsertSchema>;

export function listContentBlocks(
  prisma: PrismaClient,
): ResultAsync<ContentBlockRecord[], ContentBlockError> {
  return ResultAsync.fromPromise(
    prisma.contentBlock.findMany({ orderBy: { key: "asc" } }),
    unexpectedError,
  );
}

export function getContentBlockByKey(
  prisma: PrismaClient,
  key: string,
): ResultAsync<ContentBlockRecord, ContentBlockError> {
  return ResultAsync.fromPromise(
    prisma.contentBlock.findUnique({ where: { key } }),
    unexpectedError,
  ).andThen((record) =>
    record ? ok(record) : err(notFoundError("content_block", key)),
  );
}

export function upsertContentBlock(
  prisma: PrismaClient,
  input: UpsertContentBlockInput,
): ResultAsync<ContentBlockRecord, ContentBlockError> {
  const parsed: Result<z.output<typeof upsertSchema>, ContentBlockError> =
    parseWithSchema(upsertSchema, input);
  return parsed.asyncAndThen((data) =>
    ResultAsync.fromPromise(
      prisma.contentBlock.upsert({
        where: { key: data.key },
        create: {
          key: data.key,
          title: data.title,
          bodyMarkdown: data.bodyMarkdown,
          updatedByAdmin: data.updatedByAdmin,
        },
        update: {
          title: data.title,
          bodyMarkdown: data.bodyMarkdown,
          updatedByAdmin: data.updatedByAdmin,
        },
      }),
      unexpectedError,
    ),
  );
}
