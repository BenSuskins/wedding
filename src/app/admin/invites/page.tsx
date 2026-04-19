import Link from "next/link";

import { listInvites } from "@/lib/invite/invite";
import { getPrismaClient } from "@/server/db";

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
        <table className="mt-8 w-full table-fixed border-collapse text-left text-sm">
          <thead className="border-b border-[color:var(--color-ink)]/10 uppercase tracking-[0.2em] text-xs text-[color:var(--color-muted)]">
            <tr>
              <th className="py-2">Guests</th>
              <th className="py-2">Mode</th>
              <th className="py-2">+1 allowed</th>
              <th className="py-2">Events</th>
              <th className="py-2">Token v</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-ink)]/10">
            {invites.map((invite) => (
              <tr key={invite.id}>
                <td className="py-3 font-serif">{invite.activeGuestCount} guests</td>
                <td className="py-3">{invite.rsvpMode}</td>
                <td className="py-3">{invite.plusOneAllowed ? "yes" : "no"}</td>
                <td className="py-3">{invite.eventAllowanceCount}</td>
                <td className="py-3">v{invite.tokenVersion}</td>
                <td className="py-3 text-right">
                  <Link
                    href={`/admin/invites/${invite.id}`}
                    className="rounded border border-[color:var(--color-ink)]/20 px-3 py-1 text-sm hover:bg-[color:var(--color-ink)]/5"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
