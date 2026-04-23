import Link from "next/link";

import { listContentBlocks } from "@/lib/content/content-block";
import { getPrismaClient } from "@/server/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KNOWN_KEYS = ["hero", "travel", "faq"] as const;

export default async function AdminContentListPage() {
  const result = await listContentBlocks(getPrismaClient());
  if (result.isErr()) {
    throw new Error(`Failed to load content blocks: ${result.error.kind}`);
  }

  const existing = new Map(result.value.map((block) => [block.key, block]));
  const rows = KNOWN_KEYS.map((key) => ({ key, block: existing.get(key) ?? null }));
  const extras = result.value.filter((block) => !KNOWN_KEYS.includes(block.key as (typeof KNOWN_KEYS)[number]));

  return (
    <section className="mx-auto max-w-4xl">
      <header className="flex items-center justify-between">
        <h2 className="font-serif text-3xl">Content</h2>
      </header>
      <p className="mt-2 text-[color:var(--color-muted)]">
        Edit the markdown behind each public page.
      </p>

      <ul className="mt-8 divide-y divide-[color:var(--color-ink)]/10">
        {rows.map(({ key, block }) => (
          <li key={key} className="flex items-center justify-between py-4">
            <div>
              <div className="font-serif text-lg">{block?.title ?? humanize(key)}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                key: {key}
                {block
                  ? ` · updated ${block.updatedAt.toLocaleString("en-GB")}`
                  : " · not yet created"}
              </div>
            </div>
            <Link
              href={`/admin/content/${key}`}
              className="rounded border border-[color:var(--color-ink)]/20 px-3 py-1 text-sm hover:bg-[color:var(--color-ink)]/5"
            >
              Edit
            </Link>
          </li>
        ))}
        {extras.map((block) => (
          <li key={block.key} className="flex items-center justify-between py-4">
            <div>
              <div className="font-serif text-lg">{block.title}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                key: {block.key} · updated {block.updatedAt.toLocaleString("en-GB")}
              </div>
            </div>
            <Link
              href={`/admin/content/${block.key}`}
              className="rounded border border-[color:var(--color-ink)]/20 px-3 py-1 text-sm hover:bg-[color:var(--color-ink)]/5"
            >
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function humanize(key: string): string {
  return key
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}
