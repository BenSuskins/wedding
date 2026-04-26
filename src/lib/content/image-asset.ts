import type { PrismaClient } from "@prisma/client";
import { ResultAsync } from "neverthrow";

import { unexpectedError } from "@/lib/result";

export interface ImageAssetRecord {
  id: string;
  filename: string;
  diskPath: string;
  mime: string;
  bytes: number;
  createdAt: Date;
}

export function listImageAssets(
  prisma: PrismaClient,
): ResultAsync<ImageAssetRecord[], { kind: string }> {
  return ResultAsync.fromPromise(
    prisma.imageAsset.findMany({ orderBy: { createdAt: "desc" } }),
    unexpectedError,
  ).map((rows) =>
    rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      diskPath: row.diskPath,
      mime: row.mime,
      bytes: row.bytes,
      createdAt: row.createdAt,
    })),
  );
}
