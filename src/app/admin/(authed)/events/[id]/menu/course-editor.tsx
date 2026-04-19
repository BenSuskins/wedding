"use client";

import { useActionState } from "react";

import type { MenuCourseRecord } from "@/lib/rsvp/menu";

import {
  createMenuOptionAction,
  deleteMenuCourseAction,
  deleteMenuOptionAction,
  updateMenuCourseAction,
  updateMenuOptionAction,
  type MenuFormState,
} from "./actions";

const initialState: MenuFormState = {};

interface CourseEditorProps {
  eventId: string;
  course: MenuCourseRecord;
}

export function CourseEditor({ eventId, course }: CourseEditorProps) {
  return (
    <article className="rounded border border-[color:var(--color-ink)]/10 p-5">
      <CourseHeader eventId={eventId} course={course} />

      <ul className="mt-4 divide-y divide-[color:var(--color-ink)]/10">
        {course.options.map((option) => (
          <li key={option.id}>
            <OptionRow
              eventId={eventId}
              optionId={option.id}
              defaultLabel={option.label}
              defaultDescription={option.description ?? ""}
              defaultOrderIndex={option.orderIndex}
            />
          </li>
        ))}
        {course.options.length === 0 ? (
          <li className="py-3 text-sm text-[color:var(--color-muted)]">No options yet.</li>
        ) : null}
      </ul>

      <AddOption eventId={eventId} courseId={course.id} nextOrderIndex={course.options.length} />
    </article>
  );
}

function CourseHeader({ eventId, course }: { eventId: string; course: MenuCourseRecord }) {
  const bound = async (prev: MenuFormState, data: FormData) =>
    updateMenuCourseAction(eventId, course.id, prev, data);
  const [state, action, isPending] = useActionState(bound, initialState);

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input
        type="text"
        name="title"
        defaultValue={course.title}
        required
        aria-label="Course title"
        className="flex-1 rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2 font-serif text-lg"
      />
      <input
        type="number"
        name="orderIndex"
        defaultValue={course.orderIndex}
        min={0}
        aria-label="Course order"
        className="w-20 rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded border border-[color:var(--color-ink)]/20 px-3 py-1 text-sm hover:bg-[color:var(--color-ink)]/5 disabled:opacity-50"
      >
        Save
      </button>
      <button
        type="submit"
        formAction={deleteMenuCourseAction.bind(null, eventId, course.id)}
        className="rounded border border-red-300 px-3 py-1 text-sm text-red-800 hover:bg-red-50"
      >
        Delete course
      </button>
      {state.error ? (
        <span className="basis-full text-xs text-red-700">{state.error}</span>
      ) : null}
    </form>
  );
}

function OptionRow({
  eventId,
  optionId,
  defaultLabel,
  defaultDescription,
  defaultOrderIndex,
}: {
  eventId: string;
  optionId: string;
  defaultLabel: string;
  defaultDescription: string;
  defaultOrderIndex: number;
}) {
  const bound = async (prev: MenuFormState, data: FormData) =>
    updateMenuOptionAction(eventId, optionId, prev, data);
  const [state, action, isPending] = useActionState(bound, initialState);

  return (
    <form action={action} className="flex flex-wrap items-center gap-3 py-3">
      <input
        type="text"
        name="label"
        defaultValue={defaultLabel}
        required
        aria-label="Option label"
        className="flex-1 rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
      />
      <input
        type="text"
        name="description"
        defaultValue={defaultDescription}
        placeholder="Description"
        aria-label="Option description"
        className="flex-1 rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
      />
      <input
        type="number"
        name="orderIndex"
        defaultValue={defaultOrderIndex}
        min={0}
        aria-label="Option order"
        className="w-20 rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded border border-[color:var(--color-ink)]/20 px-3 py-1 text-sm hover:bg-[color:var(--color-ink)]/5 disabled:opacity-50"
      >
        Save
      </button>
      <button
        type="submit"
        formAction={deleteMenuOptionAction.bind(null, eventId, optionId)}
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

function AddOption({
  eventId,
  courseId,
  nextOrderIndex,
}: {
  eventId: string;
  courseId: string;
  nextOrderIndex: number;
}) {
  const bound = async (prev: MenuFormState, data: FormData) =>
    createMenuOptionAction(eventId, courseId, prev, data);
  const [state, action, isPending] = useActionState(bound, initialState);

  return (
    <form
      action={action}
      className="mt-4 flex flex-wrap items-center gap-3 rounded border border-dashed border-[color:var(--color-ink)]/20 p-3"
    >
      <input
        type="text"
        name="label"
        placeholder="New option (e.g. Salmon)"
        required
        className="flex-1 rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
      />
      <input
        type="text"
        name="description"
        placeholder="Description (optional)"
        className="flex-1 rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
      />
      <input type="hidden" name="orderIndex" value={nextOrderIndex} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded border border-[color:var(--color-ink)]/30 px-3 py-1 text-sm hover:bg-[color:var(--color-ink)]/5 disabled:opacity-50"
      >
        Add option
      </button>
      {state.error ? (
        <span className="basis-full text-xs text-red-700">{state.error}</span>
      ) : null}
    </form>
  );
}
