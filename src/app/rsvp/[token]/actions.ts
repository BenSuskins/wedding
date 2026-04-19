"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { systemClock } from "@/lib/clock";
import { createHmacInviteTokenSigner } from "@/lib/invite-token";
import { getRsvpDeadlineStatus } from "@/lib/rsvp/deadline";
import { addPlusOneGuest } from "@/lib/rsvp/plus-one";
import { getRsvpRateLimiters } from "@/lib/rsvp/rate-limiter-instance";
import {
  submitRsvp,
  type MenuSelectionInput,
  type RsvpSubmitInput,
} from "@/lib/rsvp/submit";
import { getInviteTokenSecret } from "@/server/env";
import { getPrismaClient } from "@/server/db";

import { type RsvpActionState } from "./rsvp-action-state";

function buildSigner() {
  return createHmacInviteTokenSigner(getInviteTokenSecret());
}

async function resolveClientIp(): Promise<string> {
  const incoming = await headers();
  const forwarded = incoming.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return incoming.get("x-real-ip") ?? "unknown";
}

interface RateLimitGate {
  ok: true;
}

interface RateLimitBlocked {
  ok: false;
  error: string;
}

async function enforceRateLimit(token: string): Promise<RateLimitGate | RateLimitBlocked> {
  const ip = await resolveClientIp();
  const limiters = getRsvpRateLimiters();
  const tokenResult = limiters.byToken.consume(token);
  if (tokenResult.kind === "limited") {
    const seconds = Math.ceil(tokenResult.retryAfterMs / 1000);
    return { ok: false, error: `Too many attempts. Try again in ${seconds}s.` };
  }
  const ipResult = limiters.byIp.consume(ip);
  if (ipResult.kind === "limited") {
    const seconds = Math.ceil(ipResult.retryAfterMs / 1000);
    return { ok: false, error: `Too many attempts from this connection. Try again in ${seconds}s.` };
  }
  return { ok: true };
}

async function resolveInviteFromToken(token: string) {
  const signer = buildSigner();
  const verification = signer.verify(token);
  if (verification.isErr()) {
    return { ok: false as const, error: "This link is not valid." };
  }
  const prisma = getPrismaClient();
  const invite = await prisma.invite.findUnique({
    where: { id: verification.value.inviteId },
    include: {
      guests: { where: { deletedAt: null }, select: { id: true, isPlusOne: true } },
      eventAllowances: { select: { eventId: true } },
    },
  });
  if (!invite) return { ok: false as const, error: "This invite no longer exists." };
  if (invite.tokenVersion !== verification.value.tokenVersion) {
    return { ok: false as const, error: "This link has been replaced. Please use the latest one." };
  }
  return { ok: true as const, invite };
}

function parseMenuSelections(formData: FormData, courseIds: string[]): MenuSelectionInput[] {
  const selections: MenuSelectionInput[] = [];
  for (const courseId of courseIds) {
    const optionId = formData.get(`menu:${courseId}`);
    if (typeof optionId === "string" && optionId.trim().length > 0) {
      selections.push({ courseId, optionId: optionId.trim() });
    }
  }
  return selections;
}

function humanSubmitError(kind: string): string {
  switch (kind) {
    case "deadline_passed":
      return "RSVPs are closed.";
    case "guest_not_in_invite":
    case "event_not_allowed":
      return "That guest or event is no longer on this invite.";
    case "invalid_menu_option":
      return "One of the menu choices is no longer available. Please review and resubmit.";
    case "validation":
      return "Please check the highlighted fields.";
    case "not_found":
      return "This invite no longer exists.";
    default:
      return "Something went wrong saving your RSVP.";
  }
}

function humanPlusOneError(kind: string): string {
  switch (kind) {
    case "deadline_passed":
      return "RSVPs are closed.";
    case "plus_one_not_allowed":
      return "This invite does not allow a plus-one.";
    case "plus_one_already_added":
      return "A plus-one has already been added to this invite.";
    case "validation":
      return "Please provide a name.";
    default:
      return "Something went wrong adding a plus-one.";
  }
}

export async function submitRsvpAction(
  token: string,
  guestId: string,
  eventId: string,
  courseIds: string[],
  _previous: RsvpActionState,
  formData: FormData,
): Promise<RsvpActionState> {
  const rateGate = await enforceRateLimit(token);
  if (!rateGate.ok) return { error: rateGate.error };

  const resolution = await resolveInviteFromToken(token);
  if (!resolution.ok) return { error: resolution.error };
  const invite = resolution.invite;

  const attending = formData.get("attending") === "yes";
  const allergiesRaw = formData.get("allergiesText");
  const songRaw = formData.get("songRequestText");

  const input: RsvpSubmitInput = {
    inviteId: invite.id,
    guestId,
    eventId,
    attending,
    allergiesText: typeof allergiesRaw === "string" ? allergiesRaw : null,
    songRequestText: typeof songRaw === "string" ? songRaw : null,
    menuSelections: attending ? parseMenuSelections(formData, courseIds) : [],
    actor: { kind: "guest_token", ref: invite.id },
  };

  const prisma = getPrismaClient();
  const deadlineResult = await getRsvpDeadlineStatus(prisma, systemClock);
  if (deadlineResult.isErr()) {
    return { error: "We couldn't verify the RSVP deadline. Please try again." };
  }
  const deadline = deadlineResult.value.deadline;

  const result = await submitRsvp(prisma, systemClock, input, deadline);
  if (result.isErr()) {
    return { error: humanSubmitError(result.error.kind) };
  }

  revalidatePath(`/rsvp/${token}`);
  return {
    notice:
      result.value.action === "create_rsvp"
        ? "RSVP saved. You can edit it anytime before the deadline."
        : "RSVP updated.",
  };
}

export async function addPlusOneAction(
  token: string,
  _previous: RsvpActionState,
  formData: FormData,
): Promise<RsvpActionState> {
  const rateGate = await enforceRateLimit(token);
  if (!rateGate.ok) return { error: rateGate.error };

  const resolution = await resolveInviteFromToken(token);
  if (!resolution.ok) return { error: resolution.error };
  const invite = resolution.invite;

  const displayName = formData.get("displayName");
  const prisma = getPrismaClient();
  const deadlineResult = await getRsvpDeadlineStatus(prisma, systemClock);
  if (deadlineResult.isErr()) {
    return { error: "We couldn't verify the RSVP deadline. Please try again." };
  }

  const result = await addPlusOneGuest(
    prisma,
    systemClock,
    {
      inviteId: invite.id,
      displayName: typeof displayName === "string" ? displayName : "",
      actorRef: invite.id,
    },
    deadlineResult.value.deadline,
  );

  if (result.isErr()) {
    return { error: humanPlusOneError(result.error.kind) };
  }

  revalidatePath(`/rsvp/${token}`);
  return { notice: "Plus-one added." };
}

