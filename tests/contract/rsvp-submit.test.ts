import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createFakeClock } from "@/lib/clock";
import { createInvite } from "@/lib/invite/invite";
import { createMenuCourse, createMenuOption } from "@/lib/rsvp/menu";
import { addPlusOneGuest } from "@/lib/rsvp/plus-one";
import { submitRsvp } from "@/lib/rsvp/submit";

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

describe("rsvp submit service", () => {
  let harness: PrismaTestHarness;

  beforeAll(async () => {
    harness = await startPrismaTestHarness();
  }, 180_000);

  afterAll(async () => {
    await harness?.dispose();
  });

  beforeEach(async () => {
    await harness.prisma.rsvpMenuSelection.deleteMany({});
    await harness.prisma.rsvpResponse.deleteMany({});
    // rsvp_audit_log is append-only; truncate via raw to bypass the trigger's own checks
    await harness.prisma.$executeRawUnsafe(
      "ALTER TABLE rsvp_audit_log DISABLE TRIGGER ALL; DELETE FROM rsvp_audit_log; ALTER TABLE rsvp_audit_log ENABLE TRIGGER ALL;",
    );
    await harness.prisma.menuOption.deleteMany({});
    await harness.prisma.menuCourse.deleteMany({});
    await harness.prisma.inviteEventAllowance.deleteMany({});
    await harness.prisma.guest.deleteMany({});
    await harness.prisma.event.deleteMany({});
    await harness.prisma.invite.deleteMany({});
  });

  it("creates an rsvp response with menu selections and appends an audit log entry", async () => {
    const event = await createEvent(harness, "dinner");
    const invite = (
      await createInvite(harness.prisma, {
        guests: [{ displayName: "Alice" }],
        eventIds: [event.id],
      })
    )._unsafeUnwrap();
    const guest = invite.guests[0]!;

    const course = (
      await createMenuCourse(harness.prisma, { eventId: event.id, title: "Main" })
    )._unsafeUnwrap();
    const option = (
      await createMenuOption(harness.prisma, course.id, { label: "Salmon" })
    )._unsafeUnwrap();

    const clock = createFakeClock(new Date("2026-05-01T00:00:00Z"));
    const deadline = new Date("2026-06-01T00:00:00Z");

    const result = await submitRsvp(
      harness.prisma,
      clock,
      {
        inviteId: invite.id,
        guestId: guest.id,
        eventId: event.id,
        attending: true,
        allergiesText: "peanuts",
        songRequestText: "Into My Arms",
        menuSelections: [{ courseId: course.id, optionId: option.id }],
        actor: { kind: "guest_token", ref: invite.id },
      },
      deadline,
    );

    expect(result.isOk()).toBe(true);
    const submitted = result._unsafeUnwrap();
    expect(submitted.action).toBe("create_rsvp");

    const stored = await harness.prisma.rsvpResponse.findUniqueOrThrow({
      where: { guestId_eventId: { guestId: guest.id, eventId: event.id } },
      include: { menuSelections: true },
    });
    expect(stored.attending).toBe(true);
    expect(stored.allergiesText).toBe("peanuts");
    expect(stored.menuSelections).toHaveLength(1);

    const auditRows = await harness.prisma.rsvpAuditLog.findMany({
      where: { inviteId: invite.id },
      orderBy: { occurredAt: "asc" },
    });
    expect(auditRows).toHaveLength(1);
    expect(auditRows[0]?.action).toBe("create_rsvp");
    expect(auditRows[0]?.actorKind).toBe("guest_token");
  });

  it("updates an existing rsvp response and logs update_rsvp", async () => {
    const event = await createEvent(harness, "dinner");
    const invite = (
      await createInvite(harness.prisma, {
        guests: [{ displayName: "Alice" }],
        eventIds: [event.id],
      })
    )._unsafeUnwrap();
    const guest = invite.guests[0]!;

    const clock = createFakeClock(new Date("2026-05-01T00:00:00Z"));
    const deadline = new Date("2026-06-01T00:00:00Z");

    await submitRsvp(
      harness.prisma,
      clock,
      {
        inviteId: invite.id,
        guestId: guest.id,
        eventId: event.id,
        attending: true,
        allergiesText: null,
        songRequestText: null,
        menuSelections: [],
        actor: { kind: "guest_token", ref: invite.id },
      },
      deadline,
    );

    const second = await submitRsvp(
      harness.prisma,
      clock,
      {
        inviteId: invite.id,
        guestId: guest.id,
        eventId: event.id,
        attending: false,
        allergiesText: null,
        songRequestText: null,
        menuSelections: [],
        actor: { kind: "guest_token", ref: invite.id },
      },
      deadline,
    );

    expect(second.isOk()).toBe(true);
    expect(second._unsafeUnwrap().action).toBe("update_rsvp");

    const auditRows = await harness.prisma.rsvpAuditLog.findMany({
      where: { inviteId: invite.id },
      orderBy: { occurredAt: "asc" },
    });
    expect(auditRows.map((row) => row.action)).toEqual(["create_rsvp", "update_rsvp"]);
  });

  it("rejects submissions past the deadline", async () => {
    const event = await createEvent(harness, "dinner");
    const invite = (
      await createInvite(harness.prisma, {
        guests: [{ displayName: "Alice" }],
        eventIds: [event.id],
      })
    )._unsafeUnwrap();

    const clock = createFakeClock(new Date("2026-07-01T00:00:00Z"));
    const deadline = new Date("2026-06-01T00:00:00Z");

    const result = await submitRsvp(
      harness.prisma,
      clock,
      {
        inviteId: invite.id,
        guestId: invite.guests[0]!.id,
        eventId: event.id,
        attending: true,
        allergiesText: null,
        songRequestText: null,
        menuSelections: [],
        actor: { kind: "guest_token", ref: invite.id },
      },
      deadline,
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().kind).toBe("deadline_passed");
  });

  it("rejects rsvps for events the invite cannot attend", async () => {
    const allowed = await createEvent(harness, "ceremony");
    const other = await createEvent(harness, "dinner");
    const invite = (
      await createInvite(harness.prisma, {
        guests: [{ displayName: "Alice" }],
        eventIds: [allowed.id],
      })
    )._unsafeUnwrap();

    const clock = createFakeClock(new Date("2026-05-01T00:00:00Z"));
    const result = await submitRsvp(
      harness.prisma,
      clock,
      {
        inviteId: invite.id,
        guestId: invite.guests[0]!.id,
        eventId: other.id,
        attending: true,
        allergiesText: null,
        songRequestText: null,
        menuSelections: [],
        actor: { kind: "guest_token", ref: invite.id },
      },
      null,
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().kind).toBe("event_not_allowed");
  });

  it("rejects menu selections that don't match the event's courses", async () => {
    const event = await createEvent(harness, "dinner");
    const otherEvent = await createEvent(harness, "ceremony");
    const invite = (
      await createInvite(harness.prisma, {
        guests: [{ displayName: "Alice" }],
        eventIds: [event.id],
      })
    )._unsafeUnwrap();

    const foreignCourse = (
      await createMenuCourse(harness.prisma, {
        eventId: otherEvent.id,
        title: "Wrong",
      })
    )._unsafeUnwrap();
    const foreignOption = (
      await createMenuOption(harness.prisma, foreignCourse.id, { label: "Nope" })
    )._unsafeUnwrap();

    const clock = createFakeClock(new Date("2026-05-01T00:00:00Z"));
    const result = await submitRsvp(
      harness.prisma,
      clock,
      {
        inviteId: invite.id,
        guestId: invite.guests[0]!.id,
        eventId: event.id,
        attending: true,
        allergiesText: null,
        songRequestText: null,
        menuSelections: [{ courseId: foreignCourse.id, optionId: foreignOption.id }],
        actor: { kind: "guest_token", ref: invite.id },
      },
      null,
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().kind).toBe("invalid_menu_option");
  });

  it("adds a plus-one when allowed and records an audit entry", async () => {
    const event = await createEvent(harness, "dinner");
    const invite = (
      await createInvite(harness.prisma, {
        rsvpMode: "household",
        plusOneAllowed: true,
        guests: [{ displayName: "Alice" }],
        eventIds: [event.id],
      })
    )._unsafeUnwrap();

    const clock = createFakeClock(new Date("2026-05-01T00:00:00Z"));
    const added = await addPlusOneGuest(
      harness.prisma,
      clock,
      { inviteId: invite.id, displayName: "Bob", actorRef: invite.id },
      new Date("2026-06-01T00:00:00Z"),
    );
    expect(added.isOk()).toBe(true);

    const duplicate = await addPlusOneGuest(
      harness.prisma,
      clock,
      { inviteId: invite.id, displayName: "Charlie", actorRef: invite.id },
      new Date("2026-06-01T00:00:00Z"),
    );
    expect(duplicate.isErr()).toBe(true);
    expect(duplicate._unsafeUnwrapErr().kind).toBe("plus_one_already_added");

    const auditRows = await harness.prisma.rsvpAuditLog.findMany({
      where: { inviteId: invite.id, action: "add_plus_one" },
    });
    expect(auditRows).toHaveLength(1);
  });

  it("rejects adding a plus-one when the invite does not allow it", async () => {
    const event = await createEvent(harness, "dinner");
    const invite = (
      await createInvite(harness.prisma, {
        plusOneAllowed: false,
        guests: [{ displayName: "Alice" }],
        eventIds: [event.id],
      })
    )._unsafeUnwrap();

    const clock = createFakeClock(new Date("2026-05-01T00:00:00Z"));
    const result = await addPlusOneGuest(
      harness.prisma,
      clock,
      { inviteId: invite.id, displayName: "Bob", actorRef: invite.id },
      null,
    );
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().kind).toBe("plus_one_not_allowed");
  });

  it("refuses UPDATE and DELETE on rsvp_audit_log (append-only enforcement)", async () => {
    const event = await createEvent(harness, "dinner");
    const invite = (
      await createInvite(harness.prisma, {
        guests: [{ displayName: "Alice" }],
        eventIds: [event.id],
      })
    )._unsafeUnwrap();

    const clock = createFakeClock(new Date("2026-05-01T00:00:00Z"));
    await submitRsvp(
      harness.prisma,
      clock,
      {
        inviteId: invite.id,
        guestId: invite.guests[0]!.id,
        eventId: event.id,
        attending: true,
        allergiesText: null,
        songRequestText: null,
        menuSelections: [],
        actor: { kind: "guest_token", ref: invite.id },
      },
      null,
    );

    await expect(
      harness.prisma.$executeRawUnsafe(
        `UPDATE rsvp_audit_log SET action = 'tamper' WHERE "inviteId" = $1`,
        invite.id,
      ),
    ).rejects.toThrow(/append-only/i);

    await expect(
      harness.prisma.$executeRawUnsafe(
        `DELETE FROM rsvp_audit_log WHERE "inviteId" = $1`,
        invite.id,
      ),
    ).rejects.toThrow(/append-only/i);
  });
});
