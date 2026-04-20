import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  startPrismaTestHarness,
  type PrismaTestHarness,
} from "../support/prisma-testcontainer";

describe("prisma schema contract", () => {
  let harness: PrismaTestHarness;

  beforeAll(async () => {
    harness = await startPrismaTestHarness();
  }, 180_000);

  afterAll(async () => {
    await harness?.dispose();
  });

  it("round-trips an invite with guests, event allowance, and RSVP", async () => {
    const { prisma } = harness;

    const event = await prisma.event.create({
      data: {
        slug: "ceremony",
        title: "Ceremony",
        startsAt: new Date("2026-08-15T14:00:00Z"),
        endsAt: new Date("2026-08-15T15:00:00Z"),
        locationName: "The Barn",
        locationAddress: "123 Field Lane",
      },
    });

    const invite = await prisma.invite.create({
      data: {
        rsvpMode: "household",
        plusOneAllowed: true,
        guests: {
          create: [
            { displayName: "Alice Example", orderIndex: 0 },
            { displayName: "Bob Example", orderIndex: 1 },
          ],
        },
        eventAllowances: {
          create: [{ eventId: event.id }],
        },
      },
      include: { guests: true, eventAllowances: true },
    });

    expect(invite.guests).toHaveLength(2);
    expect(invite.eventAllowances).toHaveLength(1);

    const firstGuest = invite.guests[0];
    if (!firstGuest) throw new Error("missing guest");

    const response = await prisma.rsvpResponse.create({
      data: {
        guestId: firstGuest.id,
        eventId: event.id,
        attending: true,
      },
    });

    expect(response.attending).toBe(true);

    const auditEntry = await prisma.rsvpAuditLog.create({
      data: {
        inviteId: invite.id,
        guestId: firstGuest.id,
        eventId: event.id,
        action: "rsvp.created",
        payloadJson: { attending: true },
        actorKind: "guest_token",
        actorRef: `token:${invite.id}:1`,
      },
    });

    expect(auditEntry.id).toBeTruthy();
  });

  it("enforces append-only on rsvp_audit_log (update blocked at DB)", async () => {
    const { prisma } = harness;

    const invite = await prisma.invite.create({ data: {} });
    const entry = await prisma.rsvpAuditLog.create({
      data: {
        inviteId: invite.id,
        action: "invite.created",
        payloadJson: {},
        actorKind: "admin",
        actorRef: "test-admin",
      },
    });

    await expect(
      prisma.rsvpAuditLog.update({
        where: { id: entry.id },
        data: { action: "invite.tampered" },
      }),
    ).rejects.toThrow(/append-only/);

    await expect(
      prisma.rsvpAuditLog.delete({ where: { id: entry.id } }),
    ).rejects.toThrow(/append-only/);
  });

  it("enforces unique RSVP per (guest, event)", async () => {
    const { prisma } = harness;

    const event = await prisma.event.create({
      data: {
        slug: `unique-${Date.now()}`,
        title: "Dinner",
        startsAt: new Date("2026-08-15T19:00:00Z"),
        endsAt: new Date("2026-08-15T22:00:00Z"),
        locationName: "The Barn",
        locationAddress: "123 Field Lane",
      },
    });
    const invite = await prisma.invite.create({
      data: {
        guests: { create: [{ displayName: "Solo Guest", orderIndex: 0 }] },
      },
      include: { guests: true },
    });
    const guest = invite.guests[0];
    if (!guest) throw new Error("missing guest");

    await prisma.rsvpResponse.create({
      data: { guestId: guest.id, eventId: event.id, attending: true },
    });

    await expect(
      prisma.rsvpResponse.create({
        data: { guestId: guest.id, eventId: event.id, attending: false },
      }),
    ).rejects.toThrow();
  });
});
