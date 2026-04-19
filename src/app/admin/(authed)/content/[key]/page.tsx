import Link from "next/link";

import { getContentBlockByKey } from "@/lib/content/content-block";
import { getPrismaClient } from "@/server/db";

import { ContentBlockEditForm } from "./edit-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Params {
  key: string;
}

export default async function AdminContentEditPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { key } = await params;
  const result = await getContentBlockByKey(getPrismaClient(), key);

  const initialTitle = result.isOk() ? result.value.title : humanize(key);
  const initialBody = result.isOk() ? result.value.bodyMarkdown : "";

  return (
    <section className="mx-auto max-w-3xl">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl">
            {result.isOk() ? "Edit content" : "Create content"}
          </h2>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">Key: {key}</p>
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
        initialTitle={initialTitle}
        initialBody={initialBody}
      />
    </section>
  );
}

function humanize(key: string): string {
  return key
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}
