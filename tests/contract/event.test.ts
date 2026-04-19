import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  createEvent,
  deleteEvent,
  getEventById,
  getEventBySlug,
  listEvents,
  updateEvent,
} from "@/lib/content/event";

import {
  startPrismaTestHarness,
  type PrismaTestHarness,
} from "../support/prisma-testcontainer";

const validInput = {
  slug: "ceremony",
  title: "Ceremony",
  startsAt: new Date("2026-08-15T14:00:00Z"),
  endsAt: new Date("2026-08-15T15:00:00Z"),
  locationName: "The Barn",
  locationAddress: "123 Field Lane",
  locationMapUrl: "https://maps.example.com/the-barn",
  descriptionMarkdown: "## Details",
  orderIndex: 0,
};

describe("event service", () => {
  let harness: PrismaTestHarness;

  beforeAll(async () => {
    harness = await startPrismaTestHarness();
  }, 180_000);

  afterAll(async () => {
    await harness?.dispose();
  });

  beforeEach(async () => {
    await harness.prisma.event.deleteMany({});
  });

  it("creates a valid event", async () => {
    const result = await createEvent(harness.prisma, validInput);
    expect(result.isOk()).toBe(true);
    const record = result._unsafeUnwrap();
    expect(record.slug).toBe("ceremony");
    expect(record.locationMapUrl).toBe("https://maps.example.com/the-barn");
  });

  it("rejects endsAt before startsAt", async () => {
    const result = await createEvent(harness.prisma, {
      ...validInput,
      endsAt: new Date("2026-08-15T13:00:00Z"),
    });
    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();
    expect(error.kind).toBe("validation");
    if (error.kind !== "validation") throw new Error("expected validation");
    expect(error.issues[0]?.path).toBe("endsAt");
  });

  it("rejects duplicate slugs with slug_taken", async () => {
    await createEvent(harness.prisma, validInput);
    const result = await createEvent(harness.prisma, {
      ...validInput,
      title: "Different title",
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().kind).toBe("slug_taken");
  });

  it("updates an existing event", async () => {
    const created = await createEvent(harness.prisma, validInput);
    const event = created._unsafeUnwrap();
    const updated = await updateEvent(harness.prisma, event.id, {
      ...validInput,
      title: "Renamed",
    });
    expect(updated.isOk()).toBe(true);
    expect(updated._unsafeUnwrap().title).toBe("Renamed");
  });

  it("returns not_found when updating a missing event", async () => {
    const result = await updateEvent(harness.prisma, "no-such-id", validInput);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().kind).toBe("not_found");
  });

  it("deletes an event and surfaces not_found on double-delete", async () => {
    const created = await createEvent(harness.prisma, validInput);
    const event = created._unsafeUnwrap();

    const first = await deleteEvent(harness.prisma, event.id);
    expect(first.isOk()).toBe(true);

    const second = await deleteEvent(harness.prisma, event.id);
    expect(second.isErr()).toBe(true);
    expect(second._unsafeUnwrapErr().kind).toBe("not_found");
  });

  it("finds an event by slug and by id", async () => {
    const created = await createEvent(harness.prisma, {
      ...validInput,
      slug: "dinner",
    });
    const event = created._unsafeUnwrap();

    const bySlug = await getEventBySlug(harness.prisma, "dinner");
    expect(bySlug.isOk()).toBe(true);
    expect(bySlug._unsafeUnwrap().id).toBe(event.id);

    const byId = await getEventById(harness.prisma, event.id);
    expect(byId.isOk()).toBe(true);
    expect(byId._unsafeUnwrap().slug).toBe("dinner");
  });

  it("lists events ordered by orderIndex then startsAt", async () => {
    await createEvent(harness.prisma, {
      ...validInput,
      slug: "dinner",
      startsAt: new Date("2026-08-15T19:00:00Z"),
      endsAt: new Date("2026-08-15T22:00:00Z"),
      orderIndex: 2,
    });
    await createEvent(harness.prisma, {
      ...validInput,
      slug: "ceremony",
      orderIndex: 1,
    });

    const result = await listEvents(harness.prisma);
    expect(result.isOk()).toBe(true);
    const events = result._unsafeUnwrap();
    expect(events.map((event) => event.slug)).toEqual(["ceremony", "dinner"]);
  });
});
