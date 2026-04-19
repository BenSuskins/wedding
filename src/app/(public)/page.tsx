import { RenderedMarkdown } from "@/components/rendered-markdown";
import { getContentBlockByKey } from "@/lib/content/content-block";
import { getSiteSetting } from "@/lib/content/site-setting";
import { getPrismaClient } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const prisma = getPrismaClient();
  const [heroResult, dateResult] = await Promise.all([
    getContentBlockByKey(prisma, "hero"),
    getSiteSetting(prisma, "wedding_date"),
  ]);

  const heroMarkdown = heroResult.isOk()
    ? heroResult.value.bodyMarkdown
    : "# Our Wedding\n\nMore details soon.";
  const weddingDate = dateResult.isOk() ? new Date(dateResult.value.value.isoDate) : null;

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <RenderedMarkdown
        source={heroMarkdown}
        className="prose prose-neutral max-w-none font-serif [&_h1]:text-5xl [&_h1]:font-light"
      />
      {weddingDate ? (
        <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
          <time dateTime={weddingDate.toISOString()}>
            {weddingDate.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        </p>
      ) : null}
    </section>
  );
}
