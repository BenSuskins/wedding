import Link from "next/link";

import { listContentBlocks } from "@/lib/content/content-block";
import { getPrismaClient } from "@/server/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KNOWN_KEYS = ["hero", "travel", "faq"] as const;

const KNOWN_LABELS: Record<(typeof KNOWN_KEYS)[number], string> = {
  hero: "Hero",
  travel: "Travel",
  faq: "FAQ",
};

export default async function AdminContentListPage() {
  const result = await listContentBlocks(getPrismaClient());
  if (result.isErr()) {
    throw new Error(`Failed to load content blocks: ${result.error.kind}`);
  }

  const byKey = new Map<string, { locale: string; updatedAt: Date }[]>();
  for (const block of result.value) {
    const existing = byKey.get(block.key) ?? [];
    existing.push({ locale: block.locale, updatedAt: block.updatedAt });
    byKey.set(block.key, existing);
  }

  const knownRows = KNOWN_KEYS.map((key) => ({ key, label: KNOWN_LABELS[key], locales: byKey.get(key) ?? [] }));
  const extraKeys = [...byKey.keys()].filter((k) => !KNOWN_KEYS.includes(k as (typeof KNOWN_KEYS)[number]));
  const extraRows = extraKeys.map((key) => ({ key, label: key, locales: byKey.get(key) ?? [] }));
  const rows = [...knownRows, ...extraRows];

  return (
    <section className="mx-auto max-w-4xl">
      <header className="flex items-center justify-between">
        <h2 className="font-serif text-3xl">Content</h2>
      </header>
      <p className="mt-2 text-[color:var(--color-muted)]">
        Edit the markdown behind each public page.
      </p>

      <ul className="mt-8 divide-y divide-[color:var(--color-ink)]/10">
        {rows.map(({ key, label, locales }) => (
          <li key={key} className="flex items-center justify-between py-4">
            <div>
              <div className="font-serif text-lg">{label}</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {locales.length === 0 ? (
                  <span className="text-xs uppercase tracking-[0.15em] text-[color:var(--color-muted)]">
                    Not yet created
                  </span>
                ) : (
                  locales.map(({ locale, updatedAt }) => (
                    <Link
                      key={locale}
                      href={`/admin/content/${key}/${locale}`}
                      className="rounded border border-[color:var(--color-ink)]/20 px-2 py-0.5 text-xs uppercase tracking-[0.15em] hover:bg-[color:var(--color-ink)]/5"
                      title={`Updated ${updatedAt.toLocaleString("en-GB")}`}
                    >
                      {locale}
                    </Link>
                  ))
                )}
              </div>
            </div>
            <Link
              href={`/admin/content/${key}/new`}
              className="rounded border border-[color:var(--color-ink)]/20 px-3 py-1 text-sm hover:bg-[color:var(--color-ink)]/5"
            >
              + Translation
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
