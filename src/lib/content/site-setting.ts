import type { PrismaClient } from "@prisma/client";
import { err, ok, ResultAsync } from "neverthrow";
import { z } from "zod";

import { notFoundError, type SiteSettingError } from "@/lib/content/errors";
import { parseWithSchema, unexpectedError } from "@/lib/result";

export const SITE_SETTING_KEYS = [
  "wedding_date",
  "rsvp_deadline",
  "site_title",
  "logo_text",
  "page_title",
  "meta_description",
  "hero_pretitle",
  "rsvp_heading",
  "hero_image_path",
  "ceremony_image_path",
  "reception_image_path",
] as const;

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[number];

export const siteSettingSchemas = {
  wedding_date: z.object({ isoDate: z.iso.datetime() }),
  rsvp_deadline: z.object({ isoDate: z.iso.datetime() }),
  site_title: z.object({ title: z.string().trim().min(1).max(200) }),
  logo_text: z.object({ text: z.string().trim().min(1).max(100) }),
  page_title: z.object({ title: z.string().trim().min(1).max(200) }),
  meta_description: z.object({ description: z.string().trim().min(1).max(500) }),
  hero_pretitle: z.object({ text: z.string().trim().min(1).max(300) }),
  rsvp_heading: z.object({ text: z.string().trim().min(1).max(200) }),
  hero_image_path: z.object({ path: z.string().trim().min(1).max(500) }),
  ceremony_image_path: z.object({ path: z.string().trim().min(1).max(500) }),
  reception_image_path: z.object({ path: z.string().trim().min(1).max(500) }),
} satisfies Record<SiteSettingKey, z.ZodTypeAny>;

export type SiteSettingValue<K extends SiteSettingKey> = z.output<
  (typeof siteSettingSchemas)[K]
>;

interface SiteSettingRecordFor<K extends SiteSettingKey> {
  key: K;
  value: SiteSettingValue<K>;
  updatedAt: Date;
}

export type SiteSettingRecord = {
  [K in SiteSettingKey]: SiteSettingRecordFor<K>;
}[SiteSettingKey];

export type TypedSiteSettingRecord<K extends SiteSettingKey> = SiteSettingRecordFor<K>;

function isKnownKey(key: string): key is SiteSettingKey {
  return (SITE_SETTING_KEYS as readonly string[]).includes(key);
}

export function getSiteSetting<K extends SiteSettingKey>(
  prisma: PrismaClient,
  key: K,
): ResultAsync<TypedSiteSettingRecord<K>, SiteSettingError> {
  return ResultAsync.fromPromise(
    prisma.siteSetting.findUnique({ where: { key } }),
    unexpectedError,
  ).andThen((row) => {
    if (!row) return err(notFoundError("site_setting", key));
    const schema = siteSettingSchemas[key] as unknown as z.ZodType<
      SiteSettingValue<K>
    >;
    return parseWithSchema(schema, row.valueJson).map((value) => ({
      key,
      value,
      updatedAt: row.updatedAt,
    }));
  });
}

export function listSiteSettings(
  prisma: PrismaClient,
): ResultAsync<SiteSettingRecord[], SiteSettingError> {
  return ResultAsync.fromPromise(
    prisma.siteSetting.findMany({ orderBy: { key: "asc" } }),
    unexpectedError,
  ).andThen((rows) => {
    const mapped: SiteSettingRecord[] = [];
    for (const row of rows) {
      if (!isKnownKey(row.key)) continue;
      const schema = siteSettingSchemas[row.key] as unknown as z.ZodType<
        SiteSettingValue<SiteSettingKey>
      >;
      const parsed = parseWithSchema(schema, row.valueJson);
      if (parsed.isErr()) return err(parsed.error);
      mapped.push({
        key: row.key,
        value: parsed.value,
        updatedAt: row.updatedAt,
      } as SiteSettingRecord);
    }
    return ok(mapped);
  });
}

export function setSiteSetting<K extends SiteSettingKey>(
  prisma: PrismaClient,
  key: K,
  rawValue: unknown,
): ResultAsync<TypedSiteSettingRecord<K>, SiteSettingError> {
  const schema = siteSettingSchemas[key] as unknown as z.ZodType<
    SiteSettingValue<K>
  >;
  return parseWithSchema(schema, rawValue).asyncAndThen((value) =>
    ResultAsync.fromPromise(
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, valueJson: value as object },
        update: { valueJson: value as object },
      }),
      unexpectedError,
    ).map((row) => ({ key, value, updatedAt: row.updatedAt })),
  );
}
