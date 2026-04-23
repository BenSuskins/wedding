"use client";

import { useState } from "react";

import { LanguageToggle } from "@/components/language-toggle";

interface TravelSectionProps {
  enParagraphs: string[];
  frParagraphs: string[];
}

export function TravelSection({ enParagraphs, frParagraphs }: TravelSectionProps) {
  const [locale, setLocale] = useState<"en" | "fr">("en");
  const paragraphs = locale === "fr" && frParagraphs.length > 0 ? frParagraphs : enParagraphs;
  const hasFrench = frParagraphs.length > 0;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p
          className="text-[length:clamp(0.75rem,0.7rem+0.25vw,0.875rem)] font-[500] tracking-[0.14em] text-[color:var(--color-cornflower)]"
          style={{ fontVariant: "small-caps" }}
        >
          Getting Here &amp; Staying Over
        </p>
        {hasFrench && <LanguageToggle locale={locale} onChange={setLocale} />}
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
      <div className="space-y-4">
        {paragraphs.length > 0 ? (
          paragraphs.map((para, i) => (
            <p
              key={i}
              className="max-w-[46ch] text-[length:clamp(1rem,0.95rem+0.25vw,1.125rem)] leading-[1.65] text-[color:var(--color-muted)]"
              style={{ textWrap: "pretty", whiteSpace: "pre-line" } as React.CSSProperties}
            >
              {para.replace(/^#+\s*/gm, "").trim()}
            </p>
          ))
        ) : (
          <p className="max-w-[46ch] text-[length:clamp(1rem,0.95rem+0.25vw,1.125rem)] leading-[1.65] text-[color:var(--color-muted)]">
            Travel information coming soon.
          </p>
        )}
      </div>
    </div>
  );
}
