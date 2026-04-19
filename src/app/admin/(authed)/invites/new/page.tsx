import Link from "next/link";

import { listEvents } from "@/lib/content/event";
import { getPrismaClient } from "@/server/db";

import { createInviteAction } from "../actions";
import { NewInviteForm } from "./new-invite-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function NewInvitePage() {
  const eventsResult = await listEvents(getPrismaClient());
  const events = eventsResult.isOk() ? eventsResult.value : [];

  return (
    <section className="mx-auto max-w-3xl">
      <header className="flex items-center justify-between">
        <h2 className="font-serif text-3xl">New invite</h2>
        <Link
          href="/admin/invites"
          className="text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
        >
          Back
        </Link>
      </header>
      <NewInviteForm
        action={createInviteAction}
        events={events.map((event) => ({ id: event.id, title: event.title }))}
      />
    </section>
  );
}
