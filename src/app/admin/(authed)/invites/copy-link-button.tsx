"use client";

import { useState } from "react";

export function CopyLinkButton({ value, label = "Copy link" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2_000);
    } catch {
      // Clipboard unavailable (no permission or insecure context) — leave the
      // URL visible so the admin can copy it manually. Telling them "failed"
      // is more confusing than staying silent.
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded border border-[color:var(--color-ink)]/20 px-3 py-1 text-sm hover:bg-[color:var(--color-ink)]/5"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
