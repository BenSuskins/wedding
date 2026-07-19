"use client";

import { useState, type ReactNode } from "react";

import { LanguageToggle } from "@/components/language-toggle";

interface IntroSectionProps {
  contentByLocale: Record<string, ReactNode>;
}

export function IntroSection({ contentByLocale }: IntroSectionProps) {
  const locales = Object.keys(contentByLocale);
  const [locale, setLocale] = useState(locales[0] ?? "en");
  const content = contentByLocale[locale] ?? contentByLocale[locales[0] ?? "en"];

  return (
    <>
      {locales.length > 1 && (
        <div className="mb-6 flex justify-center">
          <LanguageToggle locales={locales} locale={locale} onChange={setLocale} />
        </div>
      )}
      <div
        className="text-[length:clamp(1.2rem,1.1rem+0.5vw,1.5rem)] font-[300] leading-[1.7] text-[color:var(--color-ink)]"
        style={{ textWrap: "pretty" } as React.CSSProperties}
      >
        {content}
      </div>
    </>
  );
}
