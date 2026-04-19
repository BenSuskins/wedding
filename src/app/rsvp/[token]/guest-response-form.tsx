"use client";

import { useActionState, useId, useState } from "react";

import type { MenuCourseRecord } from "@/lib/rsvp/menu";

import {
  emptyRsvpActionState,
  submitRsvpAction,
  type RsvpActionState,
} from "./actions";

export interface ExistingResponse {
  attending: boolean;
  allergiesText: string | null;
  songRequestText: string | null;
  selections: ReadonlyArray<{ courseId: string; optionId: string }>;
}

interface GuestResponseFormProps {
  token: string;
  guestId: string;
  guestName: string;
  eventId: string;
  eventTitle: string;
  courses: ReadonlyArray<MenuCourseRecord>;
  existing: ExistingResponse | null;
  disabled: boolean;
}

export function GuestResponseForm({
  token,
  guestId,
  guestName,
  eventId,
  eventTitle,
  courses,
  existing,
  disabled,
}: GuestResponseFormProps) {
  const courseIds = courses.map((course) => course.id);
  const bound = async (prev: RsvpActionState, data: FormData) =>
    submitRsvpAction(token, guestId, eventId, courseIds, prev, data);
  const [state, action, isPending] = useActionState(bound, emptyRsvpActionState);
  const [attending, setAttending] = useState(existing?.attending ?? false);
  const formId = useId();

  const selectionByCourse = new Map<string, string>();
  for (const selection of existing?.selections ?? []) {
    selectionByCourse.set(selection.courseId, selection.optionId);
  }

  return (
    <form
      action={action}
      className="space-y-5 rounded border border-[color:var(--color-ink)]/10 p-5"
      aria-labelledby={`${formId}-heading`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 id={`${formId}-heading`} className="font-serif text-xl">
            {guestName}
          </h4>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
            {eventTitle}
          </p>
        </div>
        <fieldset className="flex items-center gap-3 text-sm" disabled={disabled}>
          <legend className="sr-only">Attending</legend>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="attending"
              value="yes"
              required
              defaultChecked={existing?.attending === true}
              onChange={() => setAttending(true)}
            />
            Joyfully accepts
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="attending"
              value="no"
              required
              defaultChecked={existing?.attending === false}
              onChange={() => setAttending(false)}
            />
            Regretfully declines
          </label>
        </fieldset>
      </header>

      {attending ? (
        <div className="space-y-4">
          {courses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {courses.map((course) => (
                <label key={course.id} className="block text-sm">
                  <span className="block text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                    {course.title}
                  </span>
                  <select
                    name={`menu:${course.id}`}
                    defaultValue={selectionByCourse.get(course.id) ?? ""}
                    disabled={disabled}
                    className="mt-1 w-full rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
                  >
                    <option value="">— no selection —</option>
                    {course.options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                        {option.description ? ` — ${option.description}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          ) : null}

          <label className="block text-sm">
            <span className="block text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
              Allergies or dietary notes
            </span>
            <textarea
              name="allergiesText"
              defaultValue={existing?.allergiesText ?? ""}
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
              defaultValue={existing?.songRequestText ?? ""}
              disabled={disabled}
              className="mt-1 w-full rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
              placeholder="Optional"
            />
          </label>
        </div>
      ) : null}

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
