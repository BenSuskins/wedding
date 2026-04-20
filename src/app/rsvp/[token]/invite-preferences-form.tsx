"use client";

import { useActionState } from "react";

import { emptyRsvpActionState, type RsvpActionState } from "./rsvp-action-state";
import { updateInvitePreferencesAction } from "./actions";

interface InvitePreferencesFormProps {
  token: string;
  existing: { allergiesText: string | null; songRequestText: string | null };
  disabled: boolean;
}

export function InvitePreferencesForm({ token, existing, disabled }: InvitePreferencesFormProps) {
  const bound = async (prev: RsvpActionState, data: FormData) =>
    updateInvitePreferencesAction(token, prev, data);
  const [state, action, isPending] = useActionState(bound, emptyRsvpActionState);

  return (
    <form
      action={action}
      className="space-y-5 rounded border border-[color:var(--color-ink)]/10 p-5"
    >
      <div className="space-y-4">
        <label className="block text-sm">
          <span className="block text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
            Allergies or dietary notes
          </span>
          <textarea
            name="allergiesText"
            defaultValue={existing.allergiesText ?? ""}
            rows={2}
            disabled={disabled}
            className="mt-1 w-full rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="block text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
            Song request
          </span>
          <input
            type="text"
            name="songRequestText"
            defaultValue={existing.songRequestText ?? ""}
            disabled={disabled}
            className="mt-1 w-full rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
            placeholder="Optional"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div aria-live="polite" className="text-sm">
          {state.error ? (
            <span className="text-red-700">{state.error}</span>
          ) : state.notice ? (
            <span className="text-[color:var(--color-muted)]">{state.notice}</span>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={disabled || isPending}
          className="rounded border border-[color:var(--color-ink)]/30 px-5 py-2 text-sm uppercase tracking-[0.2em] hover:bg-[color:var(--color-ink)]/5 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
