"use client";

import { useActionState, useId, useState } from "react";

import type { MenuCourseRecord } from "@/lib/rsvp/menu";

import { emptyRsvpActionState, type RsvpActionState } from "./rsvp-action-state";
import { submitRsvpAction } from "./actions";

export interface ExistingResponse {
  attending: boolean;
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

  // Remounting uncontrolled inputs whenever the saved value actually changes keeps
  // defaultChecked in sync with the server; otherwise React's automatic form reset
  // (on a successful action) snaps fields back to their original mount-time value.
  const attendingKey = existing?.attending === true ? "yes" : existing?.attending === false ? "no" : "unset";

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
        <fieldset key={attendingKey} className="flex items-center gap-3 text-sm" disabled={disabled}>
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
            <div className="grid gap-5 sm:grid-cols-2">
              {courses.map((course) => {
                const selectedOptionId = selectionByCourse.get(course.id) ?? "";
                return (
                  <fieldset key={`${course.id}-${selectedOptionId}`} disabled={disabled}>
                    <legend className="block text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                      {course.title}
                    </legend>
                    <div className="mt-2 grid gap-2">
                      {course.options.map((option) => (
                        <label
                          key={option.id}
                          className="group flex cursor-pointer items-start gap-3 rounded border border-[color:var(--color-ink)]/20 px-3 py-2 text-sm transition-colors has-checked:border-[color:var(--color-ink)] has-checked:bg-[color:var(--color-ink)]/5 has-disabled:cursor-not-allowed has-disabled:opacity-50"
                        >
                          <input
                            type="radio"
                            name={`menu:${course.id}`}
                            value={option.id}
                            defaultChecked={selectedOptionId === option.id}
                            className="mt-1"
                          />
                          <span>
                            <span className="block font-medium">{option.label}</span>
                            {option.description ? (
                              <span className="block text-xs text-[color:var(--color-muted)]">
                                {option.description}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      ))}
                      <label className="group flex cursor-pointer items-center gap-3 rounded border border-[color:var(--color-ink)]/20 px-3 py-2 text-sm text-[color:var(--color-muted)] transition-colors has-checked:border-[color:var(--color-ink)] has-checked:bg-[color:var(--color-ink)]/5 has-disabled:cursor-not-allowed has-disabled:opacity-50">
                        <input
                          type="radio"
                          name={`menu:${course.id}`}
                          value=""
                          defaultChecked={selectedOptionId === ""}
                        />
                        — no selection —
                      </label>
                    </div>
                  </fieldset>
                );
              })}
            </div>
          ) : null}
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
