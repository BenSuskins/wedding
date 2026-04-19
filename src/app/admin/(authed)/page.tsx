import Link from "next/link";

import { getDashboardStats } from "@/lib/rsvp/stats";
import { getPrismaClient } from "@/server/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminDashboardPage() {
  const statsResult = await getDashboardStats(getPrismaClient());
  const stats = statsResult.isOk() ? statsResult.value : null;

  return (
    <section className="mx-auto max-w-4xl space-y-8">
      <header>
        <h2 className="font-serif text-3xl">Dashboard</h2>
      </header>

      {stats && (
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded border border-[color:var(--color-ink)]/10 p-5">
            <dt className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">Invites</dt>
            <dd className="mt-2 font-serif text-4xl">
              {stats.invitesResponded}
              <span className="ml-2 text-xl text-[color:var(--color-muted)]">/ {stats.totalInvites}</span>
            </dd>
            <p className="mt-1 text-sm text-[color:var(--color-muted)]">responded</p>
          </div>
          <div className="rounded border border-[color:var(--color-ink)]/10 p-5">
            <dt className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">Guests</dt>
            <dd className="mt-2 font-serif text-4xl">
              {stats.guestsResponded}
              <span className="ml-2 text-xl text-[color:var(--color-muted)]">/ {stats.totalGuests}</span>
            </dd>
            <p className="mt-1 text-sm text-[color:var(--color-muted)]">responded</p>
          </div>
        </dl>
      )}
      <ul className="grid gap-4 sm:grid-cols-2">
        {[
          { href: "/admin/invites", label: "Invites", hint: "Household links, guest lists, and token rotation." },
          { href: "/admin/content", label: "Content blocks", hint: "Hero, travel, FAQ, gifts, dress code." },
          { href: "/admin/events", label: "Events", hint: "Ceremony, dinner, and other wedding events." },
          { href: "/admin/settings", label: "Site settings", hint: "Site title, wedding date, RSVP deadline." },
          { href: "/admin/export", label: "Export RSVPs", hint: "Download the current RSVP state as CSV." },
        ].map((card) => (
          <li key={card.href}>
            <Link
              href={card.href}
              className="block rounded border border-[color:var(--color-ink)]/10 p-5 hover:border-[color:var(--color-cornflower)]"
            >
              <div className="font-serif text-xl">{card.label}</div>
              <p className="mt-1 text-sm text-[color:var(--color-muted)]">{card.hint}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
