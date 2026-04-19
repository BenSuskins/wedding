"use client";

import { useState } from "react";

interface DraftGuest {
  displayName: string;
  isPlusOne: boolean;
}

export function GuestsBuilder() {
  const [guests, setGuests] = useState<DraftGuest[]>([{ displayName: "", isPlusOne: false }]);

  const update = (index: number, patch: Partial<DraftGuest>) => {
    setGuests((prev) => prev.map((guest, i) => (i === index ? { ...guest, ...patch } : guest)));
  };
  const remove = (index: number) => {
    setGuests((prev) => prev.filter((_, i) => i !== index));
  };
  const add = () => {
    setGuests((prev) => [...prev, { displayName: "", isPlusOne: false }]);
  };

  const serialised = JSON.stringify(
    guests
      .filter((guest) => guest.displayName.trim() !== "")
      .map((guest, index) => ({
        displayName: guest.displayName.trim(),
        isPlusOne: guest.isPlusOne,
        orderIndex: index,
      })),
  );

  return (
    <div className="space-y-3">
      <input type="hidden" name="guestsJson" value={serialised} />
      <ul className="space-y-2">
        {guests.map((guest, index) => (
          <li key={index} className="flex items-center gap-3">
            <input
              type="text"
              aria-label={`Guest ${index + 1} name`}
              placeholder="Full name"
              value={guest.displayName}
              onChange={(event) => update(index, { displayName: event.target.value })}
              className="flex-1 rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
            />
            <label className="flex items-center gap-2 text-sm text-[color:var(--color-muted)]">
              <input
                type="checkbox"
                checked={guest.isPlusOne}
                onChange={(event) => update(index, { isPlusOne: event.target.checked })}
              />
              +1
            </label>
            {guests.length > 1 ? (
              <button
                type="button"
                onClick={() => remove(index)}
                className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
              >
                Remove
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={add}
        className="rounded border border-[color:var(--color-ink)]/20 px-3 py-1 text-sm hover:bg-[color:var(--color-ink)]/5"
      >
        Add guest
      </button>
    </div>
  );
}
