"use client";

import { useActionState } from "react";

import { saveContentBlock, type SaveContentBlockState } from "./actions";

export interface EditFormProps {
  contentKey: string;
  locale: string;
  initialTitle: string;
  initialBody: string;
}

const initialState: SaveContentBlockState = {};

export function ContentBlockEditForm({ contentKey, locale, initialTitle, initialBody }: EditFormProps) {
  const [state, formAction, isPending] = useActionState(saveContentBlock, initialState);
  const isNew = locale === "";

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <input type="hidden" name="key" value={contentKey} />
      {isNew ? (
        <div>
          <label htmlFor="locale" className="block text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
            Locale code
          </label>
          <input
            id="locale"
            name="locale"
            required
            placeholder="e.g. fr, de, es"
            className="mt-2 w-40 rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
          />
        </div>
      ) : (
        <input type="hidden" name="locale" value={locale} />
      )}

      <div>
        <label htmlFor="title" className="block text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={initialTitle}
          required
          className="mt-2 w-full rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
        />
      </div>

      <div>
        <label
          htmlFor="bodyMarkdown"
          className="block text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]"
        >
          Body (markdown)
        </label>
        <textarea
          id="bodyMarkdown"
          name="bodyMarkdown"
          defaultValue={initialBody}
          required
          rows={20}
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
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
