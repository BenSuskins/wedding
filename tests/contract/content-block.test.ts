import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  getContentBlockByKey,
  listContentBlocks,
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
      title: "FAQ",
      bodyMarkdown: "## What time?",
      updatedByAdmin: "admin-1",
    });

    expect(result.isOk()).toBe(true);
    const block = result._unsafeUnwrap();
    expect(block.key).toBe("faq");
    expect(block.bodyMarkdown).toBe("## What time?");
    expect(block.updatedByAdmin).toBe("admin-1");
  });

  it("updates an existing content block on second upsert", async () => {
    await upsertContentBlock(harness.prisma, {
      key: "travel",
      title: "Travel",
      bodyMarkdown: "First draft",
      updatedByAdmin: null,
    });
    const second = await upsertContentBlock(harness.prisma, {
      key: "travel",
      title: "Travel",
      bodyMarkdown: "Second draft",
      updatedByAdmin: "admin-2",
    });

    expect(second.isOk()).toBe(true);
    const block = second._unsafeUnwrap();
    expect(block.bodyMarkdown).toBe("Second draft");
    expect(block.updatedByAdmin).toBe("admin-2");

    const count = await harness.prisma.contentBlock.count({
      where: { key: "travel" },
    });
    expect(count).toBe(1);
  });

  it("rejects invalid keys with a validation error", async () => {
    const result = await upsertContentBlock(harness.prisma, {
      key: "Not A Valid Key!",
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

  it("returns not_found when getting an unknown key", async () => {
    const result = await getContentBlockByKey(harness.prisma, "missing");
    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error.kind).toBe("not_found");
    if (error.kind !== "not_found") throw new Error("expected not_found");
    expect(error.identifier).toBe("missing");
  });

  it("lists all content blocks alphabetically by key", async () => {
    await upsertContentBlock(harness.prisma, {
      key: "zulu",
      title: "Zulu",
      bodyMarkdown: "z",
      updatedByAdmin: null,
    });
    await upsertContentBlock(harness.prisma, {
      key: "alpha",
      title: "Alpha",
      bodyMarkdown: "a",
      updatedByAdmin: null,
    });

    const result = await listContentBlocks(harness.prisma);
    expect(result.isOk()).toBe(true);
    const blocks = result._unsafeUnwrap();
    expect(blocks.map((block) => block.key)).toEqual(["alpha", "zulu"]);
  });
});
