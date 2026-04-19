import Link from "next/link";
import { notFound } from "next/navigation";

import { getEventById } from "@/lib/content/event";
import { getPrismaClient } from "@/server/db";

import { updateEventAction, type EventFormState } from "../actions";
import { EventForm } from "../event-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Params {
  id: string;
}

export default async function EditEventPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const result = await getEventById(getPrismaClient(), id);
  if (result.isErr()) {
    if (result.error.kind === "not_found") notFound();
    throw new Error(`Failed to load event: ${result.error.kind}`);
  }

  const event = result.value;
  const boundAction = async (prev: EventFormState, data: FormData): Promise<EventFormState> => {
    "use server";
    return updateEventAction(id, prev, data);
  };

  return (
    <section className="mx-auto max-w-3xl">
      <header className="flex items-center justify-between">
        <h2 className="font-serif text-3xl">Edit event</h2>
        <div className="flex items-center gap-4 text-sm uppercase tracking-[0.2em]">
          <Link
            href={`/admin/events/${id}/menu`}
            className="text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
          >
            Menu
          </Link>
          <Link
            href="/admin/events"
            className="text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
          >
            Back
          </Link>
        </div>
      </header>
      <EventForm action={boundAction} initial={event} submitLabel="Save" />
    </section>
  );
}
