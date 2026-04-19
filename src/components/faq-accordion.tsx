"use client";

import { useState } from "react";

export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <dl className="mx-auto max-w-[720px]">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const answerId = `faq-answer-${index}`;
        return (
          <div
            key={index}
            className="border-b border-[color:var(--color-ink)]/10 first:border-t"
          >
            <dt>
              <button
                className="flex w-full items-baseline justify-between gap-4 py-[1.4rem] text-left font-serif text-[length:clamp(1.2rem,1.1rem+0.5vw,1.5rem)] font-normal transition-colors hover:text-[color:var(--color-cornflower)]"
                style={{ color: isOpen ? "var(--color-cornflower)" : undefined }}
                aria-expanded={isOpen}
                aria-controls={answerId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span>{item.question}</span>
                <FaqIcon open={isOpen} />
              </button>
            </dt>
            <dd
              id={answerId}
              aria-hidden={!isOpen}
              className="grid transition-[grid-template-rows] duration-[280ms] ease-in-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p
                  className="max-w-[58ch] pb-6 pl-4 text-[length:clamp(1rem,0.95rem+0.25vw,1.125rem)] leading-[1.65] text-[color:var(--color-muted)]"
                  style={{ borderLeft: "2px solid var(--color-cornflower)" }}
                >
                  {item.answer}
                </p>
              </div>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function FaqIcon({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative inline-block size-4 shrink-0 transition-transform duration-[250ms]"
      style={{
        opacity: open ? 1 : 0.5,
        transform: open ? "rotate(45deg)" : undefined,
      }}
    >
      <span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 rounded-sm bg-current" />
      <span className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 rounded-sm bg-current" />
    </span>
  );
}
