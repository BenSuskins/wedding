"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { THEME_TOKENS } from "./tokens";
import { saveThemeAction } from "./actions";

function isHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

export function ThemeEditor({ initialOverrides }: { initialOverrides: Record<string, string> }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    for (const token of THEME_TOKENS) {
      result[token.variable] = initialOverrides[token.variable] ?? token.defaultValue;
    }
    return result;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setValue(variable: string, value: string) {
    setValues((prev) => ({ ...prev, [variable]: value }));
    setSaved(false);
  }

  function resetToken(variable: string) {
    const token = THEME_TOKENS.find((t) => t.variable === variable);
    if (token) setValue(variable, token.defaultValue);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const overrides: Record<string, string> = {};
    for (const token of THEME_TOKENS) {
      const value = values[token.variable] ?? token.defaultValue;
      if (value !== token.defaultValue) {
        overrides[token.variable] = value;
      }
    }
    const result = await saveThemeAction(overrides);
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSaved(true);
      router.refresh();
    }
  }

  const groups = [...new Set(THEME_TOKENS.map((t) => t.group))] as const;

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group}>
          <h3 className="mb-4 text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
            {group}
          </h3>
          <div className="space-y-2">
            {THEME_TOKENS.filter((t) => t.group === group).map((token) => {
              const value = values[token.variable] ?? token.defaultValue;
              const isDefault = value === token.defaultValue;
              return (
                <div
                  key={token.variable}
                  className="flex items-center gap-3 rounded border border-[color:var(--color-ink)]/10 px-4 py-3"
                >
                  {group === "Colors" && (
                    <div
                      className="h-7 w-7 shrink-0 rounded border border-[color:var(--color-ink)]/15"
                      style={{ background: value }}
                      aria-hidden="true"
                    />
                  )}

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="text-xs uppercase tracking-[0.15em] text-[color:var(--color-muted)]">
                      {token.label}
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(token.variable, e.target.value)}
                        className="min-w-0 flex-1 rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-1.5 font-mono text-sm"
                        spellCheck={false}
                      />
                      {group === "Colors" && (
                        <input
                          type="color"
                          value={isHex(value) ? value : "#000000"}
                          title="Pick a colour"
                          onChange={(e) => setValue(token.variable, e.target.value)}
                          className="h-9 w-10 shrink-0 cursor-pointer rounded border border-[color:var(--color-ink)]/20 p-0.5"
                        />
                      )}
                    </div>
                  </div>

                  {!isDefault && (
                    <button
                      type="button"
                      onClick={() => resetToken(token.variable)}
                      className="shrink-0 rounded border border-[color:var(--color-ink)]/20 px-2 py-1 text-xs hover:bg-[color:var(--color-ink)]/5"
                    >
                      Reset
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded border border-[color:var(--color-ink)]/30 px-6 py-2.5 text-sm uppercase tracking-[0.2em] hover:bg-[color:var(--color-ink)]/5 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save theme"}
        </button>
        {saved && (
          <span className="text-sm text-green-700">Saved — theme applied.</span>
        )}
        {error && <span className="text-sm text-red-700">{error}</span>}
      </div>
    </div>
  );
}
