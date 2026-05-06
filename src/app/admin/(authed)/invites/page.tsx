import Link from "next/link";

import { listInvites } from "@/lib/invite/invite";
import { getPrismaClient } from "@/server/db";
import { SortableInvitesTable } from "./sortable-table";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminInvitesPage() {
  const result = await listInvites(getPrismaClient());
  if (result.isErr()) {
    throw new Error(`Failed to load invites: ${result.error.kind}`);
  }
  const invites = result.value;

  return (
    <section className="mx-auto max-w-5xl">
      <header className="flex items-center justify-between">
        <h2 className="font-serif text-3xl">Invites</h2>
        <Link
          href="/admin/invites/new"
          className="rounded border border-[color:var(--color-ink)]/30 px-4 py-2 text-sm uppercase tracking-[0.2em] hover:bg-[color:var(--color-ink)]/5"
        >
          New invite
        </Link>
      </header>

      {invites.length === 0 ? (
        <p className="mt-8 text-[color:var(--color-muted)]">No invites yet.</p>
      ) : (
        <SortableInvitesTable invites={invites} />
      )}
    </section>
  );
}
