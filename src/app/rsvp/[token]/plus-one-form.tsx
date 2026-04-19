"use client";

import { useActionState } from "react";

import { emptyRsvpActionState, type RsvpActionState } from "./rsvp-action-state";
import { addPlusOneAction } from "./actions";

interface PlusOneFormProps {
  token: string;
  disabled: boolean;
}

export function PlusOneForm({ token, disabled }: PlusOneFormProps) {
  const bound = async (prev: RsvpActionState, data: FormData) =>
    addPlusOneAction(token, prev, data);
  const [state, action, isPending] = useActionState(bound, emptyRsvpActionState);

  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-3 rounded border border-dashed border-[color:var(--color-ink)]/20 p-4"
    >
      <label className="flex-1">
        <span className="block text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
          Add a plus-one
        </span>
        <input
          type="text"
          name="displayName"
          placeholder="Their full name"
          required
          disabled={disabled || isPending}
          className="mt-1 w-full rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={disabled || isPending}
        className="rounded border border-[color:var(--color-ink)]/30 px-4 py-2 text-sm uppercase tracking-[0.2em] hover:bg-[color:var(--color-ink)]/5 disabled:opacity-50"
      >
        {isPending ? "Adding…" : "Add"}
      </button>
      <div aria-live="polite" className="basis-full text-sm">
        {state.error ? (
          <span className="text-red-700">{state.error}</span>
        ) : state.notice ? (
          <span className="text-[color:var(--color-muted)]">{state.notice}</span>
        ) : null}
      </div>
    </form>
  );
}
