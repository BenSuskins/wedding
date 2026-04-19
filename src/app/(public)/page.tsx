import { Countdown } from "@/components/countdown";
import { RenderedMarkdown } from "@/components/rendered-markdown";
import { getContentBlockByKey } from "@/lib/content/content-block";
import { getSiteSetting } from "@/lib/content/site-setting";
import { getPrismaClient } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const prisma = getPrismaClient();
  const [heroResult, dateResult, heroImageResult] = await Promise.all([
    getContentBlockByKey(prisma, "hero"),
    getSiteSetting(prisma, "wedding_date"),
    getSiteSetting(prisma, "hero_image_path"),
  ]);

  const heroMarkdown = heroResult.isOk()
    ? heroResult.value.bodyMarkdown
    : "# Our Wedding\n\nMore details soon.";
  const weddingDate = dateResult.isOk() ? new Date(dateResult.value.value.isoDate) : null;
  const heroImagePath = heroImageResult.isOk() ? heroImageResult.value.value.path : null;

  return (
    <article>
      {heroImagePath ? (
        <div
          className="relative flex min-h-[60vh] items-end overflow-hidden bg-[color:var(--color-ink)]"
          style={{
            backgroundImage: `url(${JSON.stringify(heroImagePath)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/55" />
        </div>
      ) : null}

      <section className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-10 px-6 py-20 text-center">
        <RenderedMarkdown
          source={heroMarkdown}
          className="prose prose-neutral max-w-none font-serif [&_h1]:text-5xl [&_h1]:font-light [&_h1]:tracking-tight sm:[&_h1]:text-6xl"
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
        {weddingDate ? <Countdown targetIsoDate={weddingDate.toISOString()} /> : null}
      </section>
    </article>
  );
}
