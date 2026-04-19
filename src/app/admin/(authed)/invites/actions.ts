"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  addGuest,
  createInvite,
  deleteInvite,
  rotateInviteToken,
  setInviteEventAllowances,
  softDeleteGuest,
  updateGuest,
  updateInviteCore,
  type CreateInviteInput,
} from "@/lib/invite/invite";
import { getPrismaClient } from "@/server/db";

export interface InviteFormState {
  error?: string;
  issues?: ReadonlyArray<{ path: string; message: string }>;
}

function parseGuestsJson(raw: FormDataEntryValue | null): CreateInviteInput["guests"] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry, index) => {
        if (typeof entry !== "object" || entry === null) return null;
        const record = entry as Record<string, unknown>;
        const displayName = typeof record.displayName === "string" ? record.displayName : "";
        if (!displayName.trim()) return null;
        return {
          displayName: displayName.trim(),
          isPlusOne: Boolean(record.isPlusOne),
          orderIndex: typeof record.orderIndex === "number" ? record.orderIndex : index,
        };
      })
      .filter((guest): guest is NonNullable<typeof guest> => guest !== null);
  } catch {
    return [];
  }
}

function parseEventIds(formData: FormData): string[] {
  return formData
    .getAll("eventIds")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value !== "");
}

export async function createInviteAction(
  _previous: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const rawRsvpMode = String(formData.get("rsvpMode") ?? "household");
  const rsvpMode: CreateInviteInput["rsvpMode"] =
    rawRsvpMode === "individual" ? "individual" : "household";
  const input: CreateInviteInput = {
    rsvpMode,
    plusOneAllowed: formData.get("plusOneAllowed") === "on",
    adminNotes: String(formData.get("adminNotes") ?? ""),
    guests: parseGuestsJson(formData.get("guestsJson")),
    eventIds: parseEventIds(formData),
  };

  const result = await createInvite(getPrismaClient(), input);
  if (result.isErr()) {
    if (result.error.kind === "validation") {
      return { error: "Please fix the highlighted fields.", issues: result.error.issues };
    }
    return { error: `Create failed: ${result.error.kind}` };
  }

  revalidatePath("/admin/invites");
  redirect(`/admin/invites/${result.value.id}`);
}

export async function updateInviteCoreAction(
  id: string,
  _previous: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const rawRsvpMode = String(formData.get("rsvpMode") ?? "household");
  const rsvpMode = rawRsvpMode === "individual" ? "individual" : "household";

  const coreResult = await updateInviteCore(getPrismaClient(), id, {
    rsvpMode,
    plusOneAllowed: formData.get("plusOneAllowed") === "on",
    adminNotes: String(formData.get("adminNotes") ?? ""),
  });
  if (coreResult.isErr()) {
    if (coreResult.error.kind === "validation") {
      return { error: "Please fix the highlighted fields.", issues: coreResult.error.issues };
    }
    if (coreResult.error.kind === "not_found") {
      return { error: "This invite has been deleted." };
    }
    return { error: `Save failed: ${coreResult.error.kind}` };
  }

  const allowancesResult = await setInviteEventAllowances(
    getPrismaClient(),
    id,
    parseEventIds(formData),
  );
  if (allowancesResult.isErr()) {
    return { error: `Save failed on event allowances: ${allowancesResult.error.kind}` };
  }

  revalidatePath("/admin/invites");
  revalidatePath(`/admin/invites/${id}`);
  return {};
}

export async function rotateInviteTokenAction(inviteId: string): Promise<void> {
  const result = await rotateInviteToken(getPrismaClient(), inviteId);
  if (result.isErr() && result.error.kind !== "not_found") {
    throw new Error(`Token rotation failed: ${result.error.kind}`);
  }
  revalidatePath("/admin/invites");
  revalidatePath(`/admin/invites/${inviteId}`);
  redirect(`/admin/invites/${inviteId}`);
}

export async function deleteInviteAction(inviteId: string): Promise<void> {
  const result = await deleteInvite(getPrismaClient(), inviteId);
  if (result.isErr() && result.error.kind !== "not_found") {
    throw new Error(`Delete failed: ${result.error.kind}`);
  }
  revalidatePath("/admin/invites");
  redirect("/admin/invites");
}

export interface GuestFormState {
  error?: string;
  issues?: ReadonlyArray<{ path: string; message: string }>;
}

export async function addGuestAction(
  inviteId: string,
  _previous: GuestFormState,
  formData: FormData,
): Promise<GuestFormState> {
  const result = await addGuest(getPrismaClient(), inviteId, {
    displayName: String(formData.get("displayName") ?? ""),
    isPlusOne: formData.get("isPlusOne") === "on",
    orderIndex: Number(formData.get("orderIndex") ?? 0),
  });
  if (result.isErr()) {
    if (result.error.kind === "validation") {
      return { error: "Please fix the highlighted fields.", issues: result.error.issues };
    }
    return { error: `Add failed: ${result.error.kind}` };
  }
  revalidatePath(`/admin/invites/${inviteId}`);
  return {};
}

export async function updateGuestAction(
  inviteId: string,
  guestId: string,
  _previous: GuestFormState,
  formData: FormData,
): Promise<GuestFormState> {
  const result = await updateGuest(getPrismaClient(), guestId, {
    displayName: String(formData.get("displayName") ?? ""),
    isPlusOne: formData.get("isPlusOne") === "on",
    orderIndex: Number(formData.get("orderIndex") ?? 0),
  });
  if (result.isErr()) {
    if (result.error.kind === "validation") {
      return { error: "Please fix the highlighted fields.", issues: result.error.issues };
    }
    if (result.error.kind === "not_found") {
      return { error: "This guest no longer exists." };
    }
    return { error: `Save failed: ${result.error.kind}` };
  }
  revalidatePath(`/admin/invites/${inviteId}`);
  return {};
}

export async function removeGuestAction(inviteId: string, guestId: string): Promise<void> {
  const result = await softDeleteGuest(getPrismaClient(), guestId);
  if (result.isErr() && result.error.kind !== "not_found") {
    throw new Error(`Remove failed: ${result.error.kind}`);
  }
  revalidatePath(`/admin/invites/${inviteId}`);
  redirect(`/admin/invites/${inviteId}`);
}
