import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  createMenuCourse,
  createMenuOption,
  deleteMenuCourse,
  deleteMenuOption,
  getMenuCourseById,
  listMenuCoursesForEvent,
  updateMenuCourse,
  updateMenuOption,
} from "@/lib/rsvp/menu";

import {
  startPrismaTestHarness,
  type PrismaTestHarness,
} from "../support/prisma-testcontainer";

async function createEvent(harness: PrismaTestHarness, slug: string) {
  return harness.prisma.event.create({
    data: {
      slug,
      title: slug,
      startsAt: new Date("2026-08-15T14:00:00Z"),
      endsAt: new Date("2026-08-15T15:00:00Z"),
      locationName: "The Barn",
      locationAddress: "123 Field Lane",
    },
  });
}

describe("menu course and option service", () => {
  let harness: PrismaTestHarness;

  beforeAll(async () => {
    harness = await startPrismaTestHarness();
  }, 180_000);

  afterAll(async () => {
    await harness?.dispose();
  });

  beforeEach(async () => {
    await harness.prisma.menuOption.deleteMany({});
    await harness.prisma.menuCourse.deleteMany({});
    await harness.prisma.event.deleteMany({});
  });

  it("creates a course scoped to an event and lists it with its options", async () => {
    const event = await createEvent(harness, "dinner");
    const course = (
      await createMenuCourse(harness.prisma, {
        eventId: event.id,
        title: "Main",
        orderIndex: 0,
      })
    )._unsafeUnwrap();

    await createMenuOption(harness.prisma, course.id, { label: "Salmon" });
    await createMenuOption(harness.prisma, course.id, { label: "Beef", orderIndex: 1 });

    const listed = (await listMenuCoursesForEvent(harness.prisma, event.id))._unsafeUnwrap();
    expect(listed).toHaveLength(1);
    expect(listed[0]?.options.map((option) => option.label)).toEqual(["Salmon", "Beef"]);
  });

  it("also lists global courses alongside event-scoped ones", async () => {
    const event = await createEvent(harness, "ceremony");
    const global = (
      await createMenuCourse(harness.prisma, {
        eventId: null,
        title: "Dietary needs",
      })
    )._unsafeUnwrap();

    const listed = (await listMenuCoursesForEvent(harness.prisma, event.id))._unsafeUnwrap();
    expect(listed.some((course) => course.id === global.id)).toBe(true);
  });

  it("updates and deletes courses and options", async () => {
    const event = await createEvent(harness, "reception");
    const course = (
      await createMenuCourse(harness.prisma, { eventId: event.id, title: "Starter" })
    )._unsafeUnwrap();
    const option = (
      await createMenuOption(harness.prisma, course.id, { label: "Soup" })
    )._unsafeUnwrap();

    const renamed = (
      await updateMenuCourse(harness.prisma, course.id, {
        eventId: event.id,
        title: "First course",
        orderIndex: 2,
      })
    )._unsafeUnwrap();
    expect(renamed.title).toBe("First course");
    expect(renamed.orderIndex).toBe(2);

    const relabeled = (
      await updateMenuOption(harness.prisma, option.id, {
        label: "Tomato soup",
        description: "vegan",
      })
    )._unsafeUnwrap();
    expect(relabeled.label).toBe("Tomato soup");
    expect(relabeled.description).toBe("vegan");

    const deletedOption = await deleteMenuOption(harness.prisma, option.id);
    expect(deletedOption.isOk()).toBe(true);

    const deletedCourse = await deleteMenuCourse(harness.prisma, course.id);
    expect(deletedCourse.isOk()).toBe(true);

    const fetched = await getMenuCourseById(harness.prisma, course.id);
    expect(fetched.isErr()).toBe(true);
    expect(fetched._unsafeUnwrapErr().kind).toBe("not_found");
  });

  it("rejects creating a course for a non-existent event", async () => {
    const result = await createMenuCourse(harness.prisma, {
      eventId: "missing-event-id",
      title: "Ghost",
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().kind).toBe("not_found");
  });
});
