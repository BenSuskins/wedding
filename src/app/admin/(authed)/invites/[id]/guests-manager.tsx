"use client";

import { useActionState } from "react";

import type { GuestRecord } from "@/lib/invite/invite";

import {
  addGuestAction,
  removeGuestAction,
  updateGuestAction,
  type GuestFormState,
} from "../actions";

const initialState: GuestFormState = {};

interface GuestsManagerProps {
  inviteId: string;
  guests: GuestRecord[];
}

export function GuestsManager({ inviteId, guests }: GuestsManagerProps) {
  return (
    <div className="mt-4 space-y-6">
      <ul className="divide-y divide-[color:var(--color-ink)]/10">
        {guests.map((guest) => (
          <li key={guest.id}>
            <GuestRow inviteId={inviteId} guest={guest} />
          </li>
        ))}
        {guests.length === 0 ? (
          <li className="py-3 text-sm text-[color:var(--color-muted)]">No guests on this invite.</li>
        ) : null}
      </ul>
      <AddGuest inviteId={inviteId} nextOrderIndex={guests.length} />
    </div>
  );
}

function GuestRow({ inviteId, guest }: { inviteId: string; guest: GuestRecord }) {
  const bound = async (prev: GuestFormState, data: FormData) => {
    return updateGuestAction(inviteId, guest.id, prev, data);
  };
  const [state, action, isPending] = useActionState(bound, initialState);

  return (
    <form action={action} className="flex flex-wrap items-center gap-3 py-3">
      <input
        type="text"
        name="displayName"
        defaultValue={guest.displayName}
        aria-label="Display name"
        required
        className="flex-1 rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
      />
      <input
        type="number"
        name="orderIndex"
        defaultValue={guest.orderIndex}
        min={0}
        aria-label="Order"
        className="w-20 rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
      />
      <label className="flex items-center gap-2 text-sm text-[color:var(--color-muted)]">
        <input type="checkbox" name="isPlusOne" defaultChecked={guest.isPlusOne} />
        +1
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded border border-[color:var(--color-ink)]/20 px-3 py-1 text-sm hover:bg-[color:var(--color-ink)]/5 disabled:opacity-50"
      >
        Save
      </button>
      <button
        type="submit"
        formAction={removeGuestAction.bind(null, inviteId, guest.id)}
        className="rounded border border-red-300 px-3 py-1 text-sm text-red-800 hover:bg-red-50"
      >
        Remove
      </button>
      {state.error ? (
        <span className="basis-full text-xs text-red-700">{state.error}</span>
      ) : null}
    </form>
  );
}

function AddGuest({ inviteId, nextOrderIndex }: { inviteId: string; nextOrderIndex: number }) {
  const bound = async (prev: GuestFormState, data: FormData) =>
    addGuestAction(inviteId, prev, data);
  const [state, action, isPending] = useActionState(bound, initialState);

  return (
    <form action={action} className="flex flex-wrap items-center gap-3 rounded border border-dashed border-[color:var(--color-ink)]/20 p-3">
      <input
        type="text"
        name="displayName"
        placeholder="New guest name"
        required
        className="flex-1 rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
      />
      <input type="hidden" name="orderIndex" value={nextOrderIndex} />
      <label className="flex items-center gap-2 text-sm text-[color:var(--color-muted)]">
        <input type="checkbox" name="isPlusOne" />
        +1
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded border border-[color:var(--color-ink)]/30 px-3 py-1 text-sm hover:bg-[color:var(--color-ink)]/5 disabled:opacity-50"
      >
        Add
      </button>
      {state.error ? (
        <span className="basis-full text-xs text-red-700">{state.error}</span>
      ) : null}
    </form>
  );
}
