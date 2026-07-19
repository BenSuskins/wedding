import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  getSiteSetting,
  listSiteSettings,
  setSiteSetting,
} from "@/lib/content/site-setting";

import {
  startPrismaTestHarness,
  type PrismaTestHarness,
} from "../support/prisma-testcontainer";

describe("site setting service", () => {
  let harness: PrismaTestHarness;

  beforeAll(async () => {
    harness = await startPrismaTestHarness();
  }, 180_000);

  afterAll(async () => {
    await harness?.dispose();
  });

  beforeEach(async () => {
    await harness.prisma.siteSetting.deleteMany({});
  });

  it("sets and retrieves a typed setting", async () => {
    const writeResult = await setSiteSetting(harness.prisma, "site_title", {
      title: "Ben & Partner",
    });
    expect(writeResult.isOk()).toBe(true);

    const readResult = await getSiteSetting(harness.prisma, "site_title");
    expect(readResult.isOk()).toBe(true);
    const record = readResult._unsafeUnwrap();
    expect(record.value.title).toBe("Ben & Partner");
  });

  it("round-trips the hero slideshow image list", async () => {
    const writeResult = await setSiteSetting(harness.prisma, "hero_image_paths", {
      paths: ["/images/one.jpg", "/images/two.jpg"],
    });
    expect(writeResult.isOk()).toBe(true);

    const readResult = await getSiteSetting(harness.prisma, "hero_image_paths");
    expect(readResult.isOk()).toBe(true);
    expect(readResult._unsafeUnwrap().value.paths).toEqual([
      "/images/one.jpg",
      "/images/two.jpg",
    ]);
  });

  it("rejects an invalid value shape", async () => {
    const result = await setSiteSetting(harness.prisma, "wedding_date", {
      isoDate: "not-a-date",
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().kind).toBe("validation");
  });

  it("returns not_found for unset keys", async () => {
    const result = await getSiteSetting(harness.prisma, "hero_image_path");
    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error.kind).toBe("not_found");
  });

  it("lists only known settings", async () => {
    await setSiteSetting(harness.prisma, "site_title", { title: "Site" });
    await setSiteSetting(harness.prisma, "wedding_date", {
      isoDate: "2026-08-15T14:00:00Z",
    });

    const result = await listSiteSettings(harness.prisma);
    expect(result.isOk()).toBe(true);
    const rows = result._unsafeUnwrap();
    expect(rows.map((row) => row.key).sort()).toEqual([
      "site_title",
      "wedding_date",
    ]);
  });
});
