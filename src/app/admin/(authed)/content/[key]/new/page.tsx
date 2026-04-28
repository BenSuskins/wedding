import Link from "next/link";

import { ContentBlockEditForm } from "../[locale]/edit-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KNOWN_LABELS: Record<string, string> = {
  hero: "Hero",
  travel: "Travel",
  faq: "FAQ",
};

export default async function AdminContentNewLocalePage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const sectionLabel = KNOWN_LABELS[key] ?? key;

  return (
    <section className="mx-auto max-w-3xl">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl">Add translation</h2>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">{sectionLabel}</p>
        </div>
        <Link
          href="/admin/content"
          className="text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
        >
          Back
        </Link>
      </header>

      <ContentBlockEditForm
        contentKey={key}
        locale=""
        initialTitle={sectionLabel}
        initialBody=""
      />
    </section>
  );
}
