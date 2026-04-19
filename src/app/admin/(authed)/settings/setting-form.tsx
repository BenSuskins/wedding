"use client";

import { useActionState } from "react";

import { saveSettingAction, type SettingsFormState } from "./actions";

export interface SettingFormProps {
  settingKey: "site_title" | "wedding_date" | "rsvp_deadline" | "hero_image_path";
  label: string;
  inputType: "text" | "datetime-local";
  currentValue: string;
  updatedAt: Date | null;
}

const initialState: SettingsFormState = {};

export function SettingForm({ settingKey, label, inputType, currentValue, updatedAt }: SettingFormProps) {
  const [state, formAction, isPending] = useActionState(saveSettingAction, initialState);
  const justSaved = state.updatedKey === settingKey;

  return (
    <form action={formAction} className="rounded border border-[color:var(--color-ink)]/10 p-5">
      <input type="hidden" name="key" value={settingKey} />
      <label
        htmlFor={settingKey}
        className="block text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]"
      >
        {label}
      </label>
      <input
        id={settingKey}
        name={settingKey}
        type={inputType}
        defaultValue={currentValue}
        className="mt-2 w-full rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-2"
      />
      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="text-[color:var(--color-muted)]">
          {updatedAt ? `Last updated ${updatedAt.toLocaleString("en-GB")}` : "Never set"}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded border border-[color:var(--color-ink)]/30 px-4 py-1.5 uppercase tracking-[0.2em] hover:bg-[color:var(--color-ink)]/5 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
      {justSaved ? (
        <p className="mt-2 text-xs text-green-700">Saved.</p>
      ) : null}
      {state.error && (state.issues?.some((issue) => issue.path.includes(settingKey)) || !state.updatedKey) ? (
        <div className="mt-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
          {state.error}
        </div>
      ) : null}
    </form>
  );
}
