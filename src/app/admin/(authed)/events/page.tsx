import Link from "next/link";

import { listEvents } from "@/lib/content/event";
import { getPrismaClient } from "@/server/db";

import { deleteEventAction } from "./actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminEventsPage() {
  const result = await listEvents(getPrismaClient());
  if (result.isErr()) {
    throw new Error(`Failed to load events: ${result.error.kind}`);
  }
  const events = result.value;

  return (
    <section className="mx-auto max-w-4xl">
      <header className="flex items-center justify-between">
        <h2 className="font-serif text-3xl">Events</h2>
        <Link
          href="/admin/events/new"
          className="rounded border border-[color:var(--color-ink)]/30 px-4 py-2 text-sm uppercase tracking-[0.2em] hover:bg-[color:var(--color-ink)]/5"
        >
          New event
        </Link>
      </header>

      {events.length === 0 ? (
        <p className="mt-8 text-[color:var(--color-muted)]">No events yet.</p>
      ) : (
        <ul className="mt-8 divide-y divide-[color:var(--color-ink)]/10">
          {events.map((event) => (
            <li key={event.id} className="flex items-center justify-between py-4">
              <div>
                <div className="font-serif text-lg">{event.title}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                  {event.slug} · {event.startsAt.toLocaleString("en-GB")} · order {event.orderIndex}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/events/${event.id}`}
                  className="rounded border border-[color:var(--color-ink)]/20 px-3 py-1 text-sm hover:bg-[color:var(--color-ink)]/5"
                >
                  Edit
                </Link>
                <form action={deleteEventAction.bind(null, event.id)}>
                  <button
                    type="submit"
                    className="rounded border border-red-300 px-3 py-1 text-sm text-red-800 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
