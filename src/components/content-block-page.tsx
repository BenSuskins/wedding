import { notFound } from "next/navigation";

import { RenderedMarkdown } from "@/components/rendered-markdown";
import { getContentBlockByKey } from "@/lib/content/content-block";
import { getPrismaClient } from "@/server/db";

export async function ContentBlockPage({ blockKey }: { blockKey: string }) {
  const result = await getContentBlockByKey(getPrismaClient(), blockKey);
  if (result.isErr()) {
    if (result.error.kind === "not_found") notFound();
    throw new Error(`Failed to load content block '${blockKey}': ${result.error.kind}`);
  }

  const block = result.value;

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl">{block.title}</h1>
      <RenderedMarkdown source={block.bodyMarkdown} className="markdown-content mt-8" />
    </section>
  );
}
