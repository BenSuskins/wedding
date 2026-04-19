"use client";

import { useActionState } from "react";

import type { InviteFormState } from "../actions";
import { GuestsBuilder } from "../guests-builder";

const initialState: InviteFormState = {};

export interface NewInviteFormProps {
  action: (prev: InviteFormState, data: FormData) => Promise<InviteFormState>;
  events: ReadonlyArray<{ id: string; title: string }>;
}

export function NewInviteForm({ action, events }: NewInviteFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <div>
        <label className="block text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
          Guests
        </label>
        <div className="mt-2">
          <GuestsBuilder />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="rsvpMode"
            className="block text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]"
          >
            RSVP mode
          </label>
          <select
            id="rsvpMode"
            name="rsvpMode"
            defaultValue="household"
            className="mt-2 w-full rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
          >
            <option value="household">Household (one shared answer)</option>
            <option value="individual">Individual (per-guest answer)</option>
          </select>
        </div>
        <div>
          <span className="block text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
            Plus-one
          </span>
          <label className="mt-3 inline-flex items-center gap-2">
            <input type="checkbox" name="plusOneAllowed" />
            Allow the primary guest to add a +1
          </label>
        </div>
      </div>

      <div>
        <label
          htmlFor="adminNotes"
          className="block text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]"
        >
          Admin notes (private)
        </label>
        <textarea
          id="adminNotes"
          name="adminNotes"
          rows={3}
          className="mt-2 w-full rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
        />
      </div>

      {events.length > 0 ? (
        <fieldset>
          <legend className="text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
            Events this invite can RSVP to
          </legend>
          <ul className="mt-3 space-y-2">
            {events.map((event) => (
              <li key={event.id}>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" name="eventIds" value={event.id} />
                  {event.title}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : (
        <p className="text-sm text-[color:var(--color-muted)]">
          No events created yet — you can add event allowances after creating events.
        </p>
      )}

      {state.error ? (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          <p>{state.error}</p>
          {state.issues ? (
            <ul className="mt-1 list-disc pl-5">
              {state.issues.map((issue, index) => (
                <li key={`${issue.path}-${index}`}>
                  <strong>{issue.path || "form"}:</strong> {issue.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded border border-[color:var(--color-ink)]/30 px-5 py-2 text-sm uppercase tracking-[0.2em] hover:bg-[color:var(--color-ink)]/5 disabled:opacity-50"
      >
        {isPending ? "Creating…" : "Create invite"}
      </button>
    </form>
  );
}
