"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createEvent,
  deleteEvent,
  updateEvent,
  type EventInput,
} from "@/lib/content/event";
import { getPrismaClient } from "@/server/db";

export interface EventFormState {
  error?: string;
  issues?: ReadonlyArray<{ path: string; message: string }>;
}

function coerceFormInput(formData: FormData): EventInput {
  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAt = String(formData.get("endsAt") ?? "");
  return {
    slug: String(formData.get("slug") ?? ""),
    title: String(formData.get("title") ?? ""),
    startsAt: startsAt ? new Date(startsAt) : new Date(Number.NaN),
    endsAt: endsAt ? new Date(endsAt) : new Date(Number.NaN),
    locationName: String(formData.get("locationName") ?? ""),
    locationAddress: String(formData.get("locationAddress") ?? ""),
    locationMapUrl: String(formData.get("locationMapUrl") ?? ""),
    descriptionMarkdown: String(formData.get("descriptionMarkdown") ?? ""),
    orderIndex: Number(formData.get("orderIndex") ?? 0),
  };
}

export async function createEventAction(
  _previous: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const input = coerceFormInput(formData);
  const result = await createEvent(getPrismaClient(), input);

  if (result.isErr()) {
    if (result.error.kind === "validation") {
      return { error: "Please fix the highlighted fields.", issues: result.error.issues };
    }
    if (result.error.kind === "slug_taken") {
      return {
        error: "That slug is already in use.",
        issues: [{ path: "slug", message: "already taken" }],
      };
    }
    return { error: `Create failed: ${result.error.kind}` };
  }

  revalidatePath("/admin/events");
  revalidatePath("/schedule");
  redirect("/admin/events");
}

export async function updateEventAction(
  id: string,
  _previous: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const input = coerceFormInput(formData);
  const result = await updateEvent(getPrismaClient(), id, input);

  if (result.isErr()) {
    if (result.error.kind === "validation") {
      return { error: "Please fix the highlighted fields.", issues: result.error.issues };
    }
    if (result.error.kind === "slug_taken") {
      return {
        error: "That slug is already in use.",
        issues: [{ path: "slug", message: "already taken" }],
      };
    }
    if (result.error.kind === "not_found") {
      return { error: "This event has been deleted." };
    }
    return { error: `Save failed: ${result.error.kind}` };
  }

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
  revalidatePath("/schedule");
  redirect("/admin/events");
}

export async function deleteEventAction(id: string): Promise<void> {
  const result = await deleteEvent(getPrismaClient(), id);
  if (result.isErr() && result.error.kind !== "not_found") {
    throw new Error(`Failed to delete event: ${result.error.kind}`);
  }
  revalidatePath("/admin/events");
  revalidatePath("/schedule");
  redirect("/admin/events");
}
