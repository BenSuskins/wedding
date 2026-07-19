"use client";

import { useState, type ReactNode } from "react";

import { LanguageToggle } from "@/components/language-toggle";

interface TravelSectionProps {
  contentByLocale: Record<string, ReactNode>;
}

export function TravelSection({ contentByLocale }: TravelSectionProps) {
  const locales = Object.keys(contentByLocale);
  const [locale, setLocale] = useState(locales[0] ?? "en");
  const content = contentByLocale[locale] ?? contentByLocale[locales[0] ?? "en"];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p
          className="text-[length:clamp(0.75rem,0.7rem+0.25vw,0.875rem)] font-[500] tracking-[0.14em] text-[color:var(--color-cornflower)]"
          style={{ fontVariant: "small-caps" }}
        >
          Getting Here &amp; Staying Over
        </p>
        {locales.length > 1 && (
          <LanguageToggle locales={locales} locale={locale} onChange={setLocale} />
        )}
      </div>
      <h2
        className="font-serif text-[length:clamp(2rem,1.6rem+2vw,3.25rem)] font-[400] leading-[1.15]"
        style={{
          display: "inline-block",
          paddingBottom: "0.3em",
          borderBottom: "2px solid var(--color-peach)",
          marginBottom: "1.5rem",
        }}
      >
        Travel &amp;<br />Accommodation
      </h2>
      <div
        className="max-w-[46ch] text-[length:clamp(1rem,0.95rem+0.25vw,1.125rem)] leading-[1.65] text-[color:var(--color-muted)]"
        style={{ textWrap: "pretty" } as React.CSSProperties}
      >
        {content ?? "Travel information coming soon."}
      </div>
    </div>
  );
}
