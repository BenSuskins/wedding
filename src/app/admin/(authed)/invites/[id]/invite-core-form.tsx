"use client";

import { useActionState } from "react";

import type { InviteFormState } from "../actions";

const initialState: InviteFormState = {};

export interface InviteCoreFormProps {
  action: (prev: InviteFormState, data: FormData) => Promise<InviteFormState>;
  initial: {
    rsvpMode: "household" | "individual";
    plusOneAllowed: boolean;
    invitationSent: boolean;
    adminNotes: string;
    eventIds: string[];
  };
  events: ReadonlyArray<{ id: string; title: string }>;
}

export function InviteCoreForm({ action, initial, events }: InviteCoreFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const allowedIds = new Set(initial.eventIds);

  return (
    <form action={formAction} className="mt-4 space-y-6">
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
            defaultValue={initial.rsvpMode}
            className="mt-2 w-full rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
          >
            <option value="household">Household</option>
            <option value="individual">Individual</option>
          </select>
        </div>
        <div>
          <span className="block text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
            Plus-one
          </span>
          <label className="mt-3 inline-flex items-center gap-2">
            <input type="checkbox" name="plusOneAllowed" defaultChecked={initial.plusOneAllowed} />
            Allow +1
          </label>
        </div>
        <div>
          <span className="block text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
            Invitation
          </span>
          <label className="mt-3 inline-flex items-center gap-2">
            <input type="checkbox" name="invitationSent" defaultChecked={initial.invitationSent} />
            Sent
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
          defaultValue={initial.adminNotes}
          className="mt-2 w-full rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
        />
      </div>

      <fieldset>
        <legend className="text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
          Events this invite can RSVP to
        </legend>
        {events.length === 0 ? (
          <p className="mt-2 text-sm text-[color:var(--color-muted)]">No events created yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {events.map((event) => (
              <li key={event.id}>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="eventIds"
                    value={event.id}
                    defaultChecked={allowedIds.has(event.id)}
                  />
                  {event.title}
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      {state.error ? (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded border border-[color:var(--color-ink)]/30 px-5 py-2 text-sm uppercase tracking-[0.2em] hover:bg-[color:var(--color-ink)]/5 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
