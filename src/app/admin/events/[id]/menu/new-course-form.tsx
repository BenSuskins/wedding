"use client";

import { useActionState } from "react";

import { createMenuCourseAction, type MenuFormState } from "./actions";

const initialState: MenuFormState = {};

export function NewCourseForm({
  eventId,
  nextOrderIndex,
}: {
  eventId: string;
  nextOrderIndex: number;
}) {
  const bound = async (prev: MenuFormState, data: FormData) =>
    createMenuCourseAction(eventId, prev, data);
  const [state, action, isPending] = useActionState(bound, initialState);

  return (
    <form
      action={action}
      className="flex flex-wrap items-center gap-3 rounded border border-dashed border-[color:var(--color-ink)]/20 p-4"
    >
      <input
        type="text"
        name="title"
        placeholder="New course title (e.g. Main)"
        required
        className="flex-1 rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
      />
      <input type="hidden" name="orderIndex" value={nextOrderIndex} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded border border-[color:var(--color-ink)]/30 px-4 py-2 text-sm uppercase tracking-[0.2em] hover:bg-[color:var(--color-ink)]/5 disabled:opacity-50"
      >
        Add course
      </button>
      {state.error ? (
        <span className="basis-full text-xs text-red-700">{state.error}</span>
      ) : null}
    </form>
  );
}
