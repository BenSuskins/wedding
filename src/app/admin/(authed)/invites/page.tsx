import Link from "next/link";

import { listInvites, type InviteStatus } from "@/lib/invite/invite";
import { getPrismaClient } from "@/server/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const statusBadge: Record<InviteStatus, { label: string; className: string }> = {
  not_sent: {
    label: "Not sent",
    className: "bg-gray-100 text-gray-600 border border-gray-200",
  },
  awaiting: {
    label: "Awaiting",
    className: "bg-yellow-50 text-yellow-800 border border-yellow-200",
  },
  responded: {
    label: "Responded",
    className: "bg-green-50 text-green-800 border border-green-200",
  },
  declined: {
    label: "Declined",
    className: "bg-red-50 text-red-800 border border-red-200",
  },
};

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
              <th className="py-2">Names</th>
              <th className="py-2 w-20"># Guests</th>
              <th className="py-2">Events</th>
              <th className="py-2 w-28">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-ink)]/10">
            {invites.map((invite) => {
              const badge = statusBadge[invite.status];
              return (
                <tr key={invite.id}>
                  <td className="py-3 font-serif">{invite.guestNames.join(", ")}</td>
                  <td className="py-3">{invite.activeGuestCount}</td>
                  <td className="py-3">{invite.eventTitles.join(", ")}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/admin/invites/${invite.id}`}
                      className="rounded border border-[color:var(--color-ink)]/20 px-3 py-1 text-sm hover:bg-[color:var(--color-ink)]/5"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
