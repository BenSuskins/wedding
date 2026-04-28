import Link from "next/link";

import { getContentBlockByKey } from "@/lib/content/content-block";
import { getPrismaClient } from "@/server/db";

import { ContentBlockEditForm } from "./edit-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KNOWN_LABELS: Record<string, string> = {
  hero: "Hero",
  travel: "Travel",
  faq: "FAQ",
};

export default async function AdminContentEditPage({
  params,
}: {
  params: Promise<{ key: string; locale: string }>;
}) {
  const { key, locale } = await params;
  const result = await getContentBlockByKey(getPrismaClient(), key, locale);

  const sectionLabel = KNOWN_LABELS[key] ?? key;
  const initialTitle = result.isOk() ? result.value.title : sectionLabel;
  const initialBody = result.isOk() ? result.value.bodyMarkdown : "";

  return (
    <section className="mx-auto max-w-3xl">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl">
            {result.isOk() ? "Edit content" : "Create content"}
          </h2>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            {sectionLabel} · <span className="uppercase">{locale}</span>
          </p>
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
        locale={locale}
        initialTitle={initialTitle}
        initialBody={initialBody}
      />
    </section>
  );
}
