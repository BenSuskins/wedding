"use client";

interface LanguageToggleProps {
  locales: string[];
  locale: string;
  onChange: (locale: string) => void;
}

export function LanguageToggle({ locales, locale, onChange }: LanguageToggleProps) {
  return (
    <div
      className="flex items-center rounded-full border border-[color:var(--color-cornflower)]/30 p-[3px] text-[0.7rem] font-[600] tracking-[0.1em]"
      role="group"
      aria-label="Language"
    >
      {locales.map((lang) => (
        <button
          key={lang}
          onClick={() => onChange(lang)}
          aria-pressed={locale === lang}
          className="rounded-full px-3 py-1 uppercase transition-colors"
          style={
            locale === lang
              ? { background: "var(--color-cornflower)", color: "var(--color-paper)" }
              : { color: "var(--color-cornflower)", opacity: 0.6 }
          }
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
