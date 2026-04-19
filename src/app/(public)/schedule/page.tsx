import { RenderedMarkdown } from "@/components/rendered-markdown";
import { listEvents } from "@/lib/content/event";
import { getPrismaClient } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatTimeRange(starts: Date, ends: Date): string {
  const sameDay = starts.toDateString() === ends.toDateString();
  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (sameDay) {
    return `${dateFormatter.format(starts)} · ${timeFormatter.format(starts)}–${timeFormatter.format(ends)}`;
  }
  return `${dateFormatter.format(starts)} ${timeFormatter.format(starts)} – ${dateFormatter.format(ends)} ${timeFormatter.format(ends)}`;
}

export default async function SchedulePage() {
  const result = await listEvents(getPrismaClient());
  const events = result.isOk() ? result.value : [];

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl">Schedule</h1>
      {events.length === 0 ? (
        <p className="mt-6 text-[color:var(--color-muted)]">The schedule will appear here soon.</p>
      ) : (
        <ol className="mt-10 space-y-12">
          {events.map((event) => (
            <li key={event.id} className="border-l-2 border-[color:var(--color-eucalyptus)] pl-6">
              <h2 className="font-serif text-2xl">{event.title}</h2>
              <p className="mt-1 text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                {formatTimeRange(event.startsAt, event.endsAt)}
              </p>
              <p className="mt-2 text-base">
                {event.locationName} · {event.locationAddress}
              </p>
              {event.locationMapUrl ? (
                <a
                  href={event.locationMapUrl}
                  className="mt-1 inline-block text-sm underline hover:text-[color:var(--color-cornflower)]"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Map
                </a>
              ) : null}
              {event.descriptionMarkdown ? (
                <RenderedMarkdown
                  source={event.descriptionMarkdown}
                  className="prose prose-neutral mt-4 max-w-none"
                />
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
