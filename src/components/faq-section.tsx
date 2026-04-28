"use client";

import { useState } from "react";

import { FaqAccordion, type FaqItem } from "@/components/faq-accordion";
import { LanguageToggle } from "@/components/language-toggle";

interface FaqSectionProps {
  contentByLocale: Record<string, FaqItem[]>;
}

export function FaqSection({ contentByLocale }: FaqSectionProps) {
  const locales = Object.keys(contentByLocale);
  const [locale, setLocale] = useState(locales[0] ?? "en");
  const items = contentByLocale[locale] ?? contentByLocale[locales[0] ?? "en"] ?? [];

  return (
    <>
      {locales.length > 1 && (
        <div className="mb-8 flex justify-center">
          <LanguageToggle locales={locales} locale={locale} onChange={setLocale} />
        </div>
      )}
      <FaqAccordion items={items} />
    </>
  );
}
