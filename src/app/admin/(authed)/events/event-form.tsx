"use client";

import { useActionState } from "react";

import type { EventFormState } from "./actions";

export interface EventFormProps {
  action: (prev: EventFormState, data: FormData) => Promise<EventFormState>;
  initial?: {
    slug: string;
    title: string;
    startsAt: Date;
    endsAt: Date;
    locationName: string;
    locationAddress: string;
    locationMapUrl: string | null;
    descriptionMarkdown: string | null;
    orderIndex: number;
  };
  submitLabel: string;
}

const initialState: EventFormState = {};

function toLocalInputValue(date: Date): string {
  return date.toISOString().slice(0, 16);
}

function issueFor(state: EventFormState, path: string): string | undefined {
  return state.issues?.find((issue) => issue.path === path)?.message;
}

export function EventForm({ action, initial, submitLabel }: EventFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Title" name="title" defaultValue={initial?.title} issue={issueFor(state, "title")} required />
        <Field label="Slug" name="slug" defaultValue={initial?.slug} issue={issueFor(state, "slug")} required />
        <Field
          label="Starts at"
          name="startsAt"
          type="datetime-local"
          defaultValue={initial ? toLocalInputValue(initial.startsAt) : undefined}
          issue={issueFor(state, "startsAt")}
          required
        />
        <Field
          label="Ends at"
          name="endsAt"
          type="datetime-local"
          defaultValue={initial ? toLocalInputValue(initial.endsAt) : undefined}
          issue={issueFor(state, "endsAt")}
          required
        />
        <Field
          label="Location name"
          name="locationName"
          defaultValue={initial?.locationName}
          issue={issueFor(state, "locationName")}
          required
        />
        <Field
          label="Location address"
          name="locationAddress"
          defaultValue={initial?.locationAddress}
          issue={issueFor(state, "locationAddress")}
          required
        />
        <Field
          label="Map URL (optional)"
          name="locationMapUrl"
          type="url"
          defaultValue={initial?.locationMapUrl ?? ""}
          issue={issueFor(state, "locationMapUrl")}
        />
        <Field
          label="Order index"
          name="orderIndex"
          type="number"
          min={0}
          defaultValue={String(initial?.orderIndex ?? 0)}
          issue={issueFor(state, "orderIndex")}
        />
      </div>

      <div>
        <label
          htmlFor="descriptionMarkdown"
          className="block text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]"
        >
          Description (markdown)
        </label>
        <textarea
          id="descriptionMarkdown"
          name="descriptionMarkdown"
          defaultValue={initial?.descriptionMarkdown ?? ""}
          rows={8}
          className="mt-2 w-full rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2 font-mono text-sm"
        />
      </div>

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
        {isPending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

interface FieldProps {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  min?: number;
  issue?: string;
}

function Field({ label, name, type = "text", defaultValue, required, min, issue }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        min={min}
        className="mt-2 w-full rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
        aria-invalid={issue ? "true" : undefined}
      />
      {issue ? <p className="mt-1 text-xs text-red-700">{issue}</p> : null}
    </div>
  );
}
