"use server";

import { revalidatePath } from "next/cache";

import {
  createMenuCourse,
  createMenuOption,
  deleteMenuCourse,
  deleteMenuOption,
  updateMenuCourse,
  updateMenuOption,
  type MenuCourseInput,
  type MenuOptionInput,
} from "@/lib/rsvp/menu";
import { getPrismaClient } from "@/server/db";

export interface MenuFormState {
  error?: string;
  issues?: ReadonlyArray<{ path: string; message: string }>;
}

function revalidateEventMenu(eventId: string): void {
  revalidatePath(`/admin/events/${eventId}/menu`);
}

function parseCourseInput(formData: FormData, eventId: string): MenuCourseInput {
  return {
    eventId,
    title: String(formData.get("title") ?? ""),
    orderIndex: Number(formData.get("orderIndex") ?? 0),
  };
}

function parseOptionInput(formData: FormData): MenuOptionInput {
  return {
    label: String(formData.get("label") ?? ""),
    description: String(formData.get("description") ?? ""),
    orderIndex: Number(formData.get("orderIndex") ?? 0),
  };
}

function errorFromResultKind(kind: string, subject: string): MenuFormState {
  if (kind === "validation") {
    return { error: "Please fix the highlighted fields." };
  }
  if (kind === "not_found") {
    return { error: `${subject} not found.` };
  }
  return { error: `${subject} operation failed: ${kind}` };
}

export async function createMenuCourseAction(
  eventId: string,
  _previous: MenuFormState,
  formData: FormData,
): Promise<MenuFormState> {
  const result = await createMenuCourse(getPrismaClient(), parseCourseInput(formData, eventId));
  if (result.isErr()) {
    if (result.error.kind === "validation") {
      return { error: "Please fix the highlighted fields.", issues: result.error.issues };
    }
    return errorFromResultKind(result.error.kind, "Course");
  }
  revalidateEventMenu(eventId);
  return {};
}

export async function updateMenuCourseAction(
  eventId: string,
  courseId: string,
  _previous: MenuFormState,
  formData: FormData,
): Promise<MenuFormState> {
  const result = await updateMenuCourse(
    getPrismaClient(),
    courseId,
    parseCourseInput(formData, eventId),
  );
  if (result.isErr()) {
    if (result.error.kind === "validation") {
      return { error: "Please fix the highlighted fields.", issues: result.error.issues };
    }
    return errorFromResultKind(result.error.kind, "Course");
  }
  revalidateEventMenu(eventId);
  return {};
}

export async function deleteMenuCourseAction(
  eventId: string,
  courseId: string,
): Promise<void> {
  const result = await deleteMenuCourse(getPrismaClient(), courseId);
  if (result.isErr() && result.error.kind !== "not_found") {
    throw new Error(`Failed to delete menu course: ${result.error.kind}`);
  }
  revalidateEventMenu(eventId);
}

export async function createMenuOptionAction(
  eventId: string,
  courseId: string,
  _previous: MenuFormState,
  formData: FormData,
): Promise<MenuFormState> {
  const result = await createMenuOption(
    getPrismaClient(),
    courseId,
    parseOptionInput(formData),
  );
  if (result.isErr()) {
    if (result.error.kind === "validation") {
      return { error: "Please fix the highlighted fields.", issues: result.error.issues };
    }
    return errorFromResultKind(result.error.kind, "Option");
  }
  revalidateEventMenu(eventId);
  return {};
}

export async function updateMenuOptionAction(
  eventId: string,
  optionId: string,
  _previous: MenuFormState,
  formData: FormData,
): Promise<MenuFormState> {
  const result = await updateMenuOption(
    getPrismaClient(),
    optionId,
    parseOptionInput(formData),
  );
  if (result.isErr()) {
    if (result.error.kind === "validation") {
      return { error: "Please fix the highlighted fields.", issues: result.error.issues };
    }
    return errorFromResultKind(result.error.kind, "Option");
  }
  revalidateEventMenu(eventId);
  return {};
}

export async function deleteMenuOptionAction(
  eventId: string,
  optionId: string,
): Promise<void> {
  const result = await deleteMenuOption(getPrismaClient(), optionId);
  if (result.isErr() && result.error.kind !== "not_found") {
    throw new Error(`Failed to delete menu option: ${result.error.kind}`);
  }
  revalidateEventMenu(eventId);
}
