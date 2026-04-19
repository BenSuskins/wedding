import Link from "next/link";

import { createEventAction } from "../actions";
import { EventForm } from "../event-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function NewEventPage() {
  return (
    <section className="mx-auto max-w-3xl">
      <header className="flex items-center justify-between">
        <h2 className="font-serif text-3xl">New event</h2>
        <Link
          href="/admin/events"
          className="text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
        >
          Back
        </Link>
      </header>
      <EventForm action={createEventAction} submitLabel="Create" />
    </section>
  );
}
