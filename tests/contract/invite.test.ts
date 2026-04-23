import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  addGuest,
  createInvite,
  deleteInvite,
  getInviteById,
  getInviteByToken,
  listInvites,
  rotateInviteToken,
  setInviteEventAllowances,
  softDeleteGuest,
  updateGuest,
  updateInviteCore,
} from "@/lib/invite/invite";
import { createFakeInviteTokenSigner } from "@/lib/invite-token";

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

describe("invite service", () => {
  let harness: PrismaTestHarness;

  beforeAll(async () => {
    harness = await startPrismaTestHarness();
  }, 180_000);

  afterAll(async () => {
    await harness?.dispose();
  });

  beforeEach(async () => {
    await harness.prisma.inviteEventAllowance.deleteMany({});
    await harness.prisma.guest.deleteMany({});
    await harness.prisma.event.deleteMany({});
    await harness.prisma.invite.deleteMany({});
  });

  it("creates an invite with guests and event allowances", async () => {
    const event = await createEvent(harness, "ceremony");
    const result = await createInvite(harness.prisma, {
      rsvpMode: "household",
      plusOneAllowed: true,
      adminNotes: "family of two",
      guests: [
        { displayName: "Alice Example" },
        { displayName: "Bob Example", orderIndex: 1 },
      ],
      eventIds: [event.id],
    });

    expect(result.isOk()).toBe(true);
    const invite = result._unsafeUnwrap();
    expect(invite.tokenVersion).toBe(1);
    expect(invite.guests).toHaveLength(2);
    expect(invite.eventAllowances.map((allowance) => allowance.eventId)).toEqual([event.id]);
  });

  it("rejects creation with no guests", async () => {
    const result = await createInvite(harness.prisma, {
      guests: [],
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().kind).toBe("validation");
  });

  it("updates core fields and replaces event allowances", async () => {
    const eventA = await createEvent(harness, "ceremony");
    const eventB = await createEvent(harness, "dinner");
    const created = await createInvite(harness.prisma, {
      guests: [{ displayName: "Alice" }],
      eventIds: [eventA.id],
    });
    const invite = created._unsafeUnwrap();

    const updated = await updateInviteCore(harness.prisma, invite.id, {
      rsvpMode: "individual",
      plusOneAllowed: true,
      invitationSent: false,
      adminNotes: null,
    });
    expect(updated.isOk()).toBe(true);
    expect(updated._unsafeUnwrap().rsvpMode).toBe("individual");

    const replaced = await setInviteEventAllowances(harness.prisma, invite.id, [eventB.id]);
    expect(replaced.isOk()).toBe(true);
    expect(replaced._unsafeUnwrap()).toEqual([{ eventId: eventB.id }]);
  });

  it("rotates the token version on request", async () => {
    const created = await createInvite(harness.prisma, {
      guests: [{ displayName: "Alice" }],
    });
    const invite = created._unsafeUnwrap();
    const rotated = await rotateInviteToken(harness.prisma, invite.id);
    expect(rotated.isOk()).toBe(true);
    expect(rotated._unsafeUnwrap().tokenVersion).toBe(2);
  });

  it("adds, updates, and soft-deletes guests", async () => {
    const created = await createInvite(harness.prisma, {
      guests: [{ displayName: "Alice" }],
    });
    const invite = created._unsafeUnwrap();

    const added = await addGuest(harness.prisma, invite.id, {
      displayName: "Bob",
      orderIndex: 1,
    });
    expect(added.isOk()).toBe(true);
    const bob = added._unsafeUnwrap();

    const renamed = await updateGuest(harness.prisma, bob.id, invite.id, {
      displayName: "Robert",
      orderIndex: 1,
    });
    expect(renamed.isOk()).toBe(true);
    expect(renamed._unsafeUnwrap().displayName).toBe("Robert");

    const softDeleted = await softDeleteGuest(harness.prisma, bob.id, invite.id);
    expect(softDeleted.isOk()).toBe(true);

    const reloaded = await getInviteById(harness.prisma, invite.id);
    expect(reloaded.isOk()).toBe(true);
    expect(reloaded._unsafeUnwrap().guests.map((guest) => guest.displayName)).toEqual([
      "Alice",
    ]);
  });

  it("lists invites with guest names, counts, event titles, and responded flag", async () => {
    const event = await createEvent(harness, "ceremony");
    const invite = (
      await createInvite(harness.prisma, {
        guests: [{ displayName: "Alice" }, { displayName: "Bob" }],
        eventIds: [event.id],
      })
    )._unsafeUnwrap();
    await softDeleteGuest(harness.prisma, invite.guests[1]!.id, invite.id);

    const listed = await listInvites(harness.prisma);
    expect(listed.isOk()).toBe(true);
    const rows = listed._unsafeUnwrap();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.activeGuestCount).toBe(1);
    expect(rows[0]?.guestNames).toEqual(["Alice"]);
    expect(rows[0]?.eventTitles).toEqual([event.title]);
    expect(rows[0]?.hasResponded).toBe(false);
  });

  it("looks up an invite by signed token with version check", async () => {
    const signer = createFakeInviteTokenSigner();
    const created = (
      await createInvite(harness.prisma, {
        guests: [{ displayName: "Alice" }],
      })
    )._unsafeUnwrap();

    const token = signer.sign({ inviteId: created.id, tokenVersion: 1 });
    const fetched = await getInviteByToken(harness.prisma, signer, token);
    expect(fetched.isOk()).toBe(true);
    expect(fetched._unsafeUnwrap().id).toBe(created.id);

    await rotateInviteToken(harness.prisma, created.id);
    const stale = await getInviteByToken(harness.prisma, signer, token);
    expect(stale.isErr()).toBe(true);
    expect(stale._unsafeUnwrapErr().kind).toBe("token_version_stale");

    const malformed = await getInviteByToken(harness.prisma, signer, "not-a-token");
    expect(malformed.isErr()).toBe(true);
    expect(malformed._unsafeUnwrapErr().kind).toBe("token_malformed");
  });

  it("soft-deletes an invite (sets deletedAt, hides from list and lookup)", async () => {
    const event = await createEvent(harness, "ceremony");
    const invite = (
      await createInvite(harness.prisma, {
        guests: [{ displayName: "Alice" }],
        eventIds: [event.id],
      })
    )._unsafeUnwrap();

    const deleted = await deleteInvite(harness.prisma, invite.id);
    expect(deleted.isOk()).toBe(true);

    const row = await harness.prisma.invite.findUnique({ where: { id: invite.id } });
    expect(row?.deletedAt).not.toBeNull();

    const fetched = await getInviteById(harness.prisma, invite.id);
    expect(fetched.isErr()).toBe(true);
    expect(fetched._unsafeUnwrapErr().kind).toBe("not_found");

    const listed = await listInvites(harness.prisma);
    expect(listed._unsafeUnwrap().find((i) => i.id === invite.id)).toBeUndefined();
  });
});
