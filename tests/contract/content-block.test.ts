import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  getContentBlockByKey,
  listContentBlocks,
  listLocalesForKey,
  upsertContentBlock,
} from "@/lib/content/content-block";

import {
  startPrismaTestHarness,
  type PrismaTestHarness,
} from "../support/prisma-testcontainer";

describe("content block service", () => {
  let harness: PrismaTestHarness;

  beforeAll(async () => {
    harness = await startPrismaTestHarness();
  }, 180_000);

  afterAll(async () => {
    await harness?.dispose();
  });

  beforeEach(async () => {
    await harness.prisma.contentBlock.deleteMany({});
  });

  it("creates a content block on first upsert", async () => {
    const result = await upsertContentBlock(harness.prisma, {
      key: "faq",
      locale: "en",
      title: "FAQ",
      bodyMarkdown: "## What time?",
      updatedByAdmin: "admin-1",
    });

    expect(result.isOk()).toBe(true);
    const block = result._unsafeUnwrap();
    expect(block.key).toBe("faq");
    expect(block.locale).toBe("en");
    expect(block.bodyMarkdown).toBe("## What time?");
    expect(block.updatedByAdmin).toBe("admin-1");
  });

  it("updates an existing content block on second upsert for the same key+locale", async () => {
    await upsertContentBlock(harness.prisma, {
      key: "travel",
      locale: "en",
      title: "Travel",
      bodyMarkdown: "First draft",
      updatedByAdmin: null,
    });
    const second = await upsertContentBlock(harness.prisma, {
      key: "travel",
      locale: "en",
      title: "Travel",
      bodyMarkdown: "Second draft",
      updatedByAdmin: "admin-2",
    });

    expect(second.isOk()).toBe(true);
    const block = second._unsafeUnwrap();
    expect(block.bodyMarkdown).toBe("Second draft");
    expect(block.updatedByAdmin).toBe("admin-2");

    const count = await harness.prisma.contentBlock.count({ where: { key: "travel" } });
    expect(count).toBe(1);
  });

  it("stores separate records for the same key with different locales", async () => {
    await upsertContentBlock(harness.prisma, {
      key: "travel", locale: "en", title: "Travel", bodyMarkdown: "English", updatedByAdmin: null,
    });
    await upsertContentBlock(harness.prisma, {
      key: "travel", locale: "fr", title: "Voyage", bodyMarkdown: "Français", updatedByAdmin: null,
    });

    const count = await harness.prisma.contentBlock.count({ where: { key: "travel" } });
    expect(count).toBe(2);

    const en = await getContentBlockByKey(harness.prisma, "travel", "en");
    expect(en._unsafeUnwrap().bodyMarkdown).toBe("English");

    const fr = await getContentBlockByKey(harness.prisma, "travel", "fr");
    expect(fr._unsafeUnwrap().bodyMarkdown).toBe("Français");
  });

  it("rejects invalid keys with a validation error", async () => {
    const result = await upsertContentBlock(harness.prisma, {
      key: "Not A Valid Key!",
      locale: "en",
      title: "Nope",
      bodyMarkdown: "body",
      updatedByAdmin: null,
    });

    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error.kind).toBe("validation");
    if (error.kind !== "validation") throw new Error("expected validation");
    expect(error.issues[0]?.path).toBe("key");
  });

  it("rejects invalid locale codes", async () => {
    const result = await upsertContentBlock(harness.prisma, {
      key: "faq",
      locale: "not_a_locale",
      title: "FAQ",
      bodyMarkdown: "body",
      updatedByAdmin: null,
    });

    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error.kind).toBe("validation");
  });

  it("returns not_found when getting an unknown key/locale", async () => {
    const result = await getContentBlockByKey(harness.prisma, "missing", "en");
    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error.kind).toBe("not_found");
    if (error.kind !== "not_found") throw new Error("expected not_found");
    expect(error.identifier).toBe("missing/en");
  });

  it("lists all content blocks ordered by key then locale", async () => {
    await upsertContentBlock(harness.prisma, { key: "zulu", locale: "en", title: "Zulu", bodyMarkdown: "z", updatedByAdmin: null });
    await upsertContentBlock(harness.prisma, { key: "alpha", locale: "fr", title: "Alpha FR", bodyMarkdown: "a-fr", updatedByAdmin: null });
    await upsertContentBlock(harness.prisma, { key: "alpha", locale: "en", title: "Alpha", bodyMarkdown: "a", updatedByAdmin: null });

    const result = await listContentBlocks(harness.prisma);
    expect(result.isOk()).toBe(true);
    const blocks = result._unsafeUnwrap();
    expect(blocks.map((b) => `${b.key}/${b.locale}`)).toEqual(["alpha/en", "alpha/fr", "zulu/en"]);
  });

  it("lists available locales for a key", async () => {
    await upsertContentBlock(harness.prisma, { key: "faq", locale: "en", title: "FAQ", bodyMarkdown: "en", updatedByAdmin: null });
    await upsertContentBlock(harness.prisma, { key: "faq", locale: "fr", title: "FAQ FR", bodyMarkdown: "fr", updatedByAdmin: null });
    await upsertContentBlock(harness.prisma, { key: "faq", locale: "de", title: "FAQ DE", bodyMarkdown: "de", updatedByAdmin: null });

    const result = await listLocalesForKey(harness.prisma, "faq");
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(["de", "en", "fr"]);
  });
});
