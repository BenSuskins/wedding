"use client";

import { useState } from "react";

import { FaqAccordion, type FaqItem } from "@/components/faq-accordion";
import { LanguageToggle } from "@/components/language-toggle";

interface FaqSectionProps {
  enItems: FaqItem[];
  frItems: FaqItem[];
}

export function FaqSection({ enItems, frItems }: FaqSectionProps) {
  const [locale, setLocale] = useState<"en" | "fr">("en");
  const items = locale === "fr" && frItems.length > 0 ? frItems : enItems;
  const hasFrench = frItems.length > 0;

  return (
    <>
      {hasFrench && (
        <div className="mb-8 flex justify-center">
          <LanguageToggle locale={locale} onChange={setLocale} />
        </div>
      )}
      <FaqAccordion items={items} />
    </>
  );
}
