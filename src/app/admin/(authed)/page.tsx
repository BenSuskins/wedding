import Link from "next/link";

import { getSiteSetting } from "@/lib/content/site-setting";
import { getDashboardStats, getEventBreakdown } from "@/lib/rsvp/stats";
import { getPrismaClient } from "@/server/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function daysFrom(isoDate: string): number {
  const d = new Date(isoDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86_400_000);
}

export default async function AdminDashboardPage() {
  const prisma = getPrismaClient();
  const [statsResult, eventBreakdownResult, weddingDateResult, rsvpDeadlineResult] = await Promise.all([
    getDashboardStats(prisma),
    getEventBreakdown(prisma),
    getSiteSetting(prisma, "wedding_date"),
    getSiteSetting(prisma, "rsvp_deadline"),
  ]);

  const stats = statsResult.isOk() ? statsResult.value : null;
  const eventBreakdown = eventBreakdownResult.isOk() ? eventBreakdownResult.value : [];
  const weddingDate = weddingDateResult.isOk() ? weddingDateResult.value.value.isoDate : null;
  const rsvpDeadline = rsvpDeadlineResult.isOk() ? rsvpDeadlineResult.value.value.isoDate : null;

  const responseRate =
    stats && stats.totalInvites > 0
      ? Math.round((stats.invitesResponded / stats.totalInvites) * 100)
      : 0;
  const awaitingCount = stats ? stats.totalInvites - stats.invitesResponded : 0;

  return (
    <section className="max-w-3xl space-y-8">
      <header>
        <h2 className="font-serif text-3xl">Dashboard</h2>
      </header>

      {(weddingDate || rsvpDeadline) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {weddingDate && (
            <div className="rounded border border-[color:var(--color-ink)]/10 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Wedding day
              </p>
              <p className="mt-1 font-serif text-xl">{formatDate(weddingDate)}</p>
              {(() => {
                const days = daysFrom(weddingDate);
                return (
                  <p className="mt-0.5 text-sm text-[color:var(--color-muted)]">
                    {days > 0 ? `${days} days to go` : days === 0 ? "Today!" : `${Math.abs(days)} days ago`}
                  </p>
                );
              })()}
            </div>
          )}
          {rsvpDeadline && (
            <div className="rounded border border-[color:var(--color-ink)]/10 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                RSVP deadline
              </p>
              <p className="mt-1 font-serif text-xl">{formatDate(rsvpDeadline)}</p>
              {(() => {
                const days = daysFrom(rsvpDeadline);
                return (
                  <p className="mt-0.5 text-sm text-[color:var(--color-muted)]">
                    {days > 0 ? `${days} days away` : days === 0 ? "Today" : "Passed"}
                  </p>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {stats && (
        <>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded border border-[color:var(--color-ink)]/10 p-5">
              <dt className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Attending
              </dt>
              <dd className="mt-2 font-serif text-4xl text-green-700">{stats.guestsAttending}</dd>
              <p className="mt-1 text-sm text-[color:var(--color-muted)]">guests</p>
            </div>
            <div className="rounded border border-[color:var(--color-ink)]/10 p-5">
              <dt className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Declined
              </dt>
              <dd className="mt-2 font-serif text-4xl text-red-700">{stats.guestsDeclined}</dd>
              <p className="mt-1 text-sm text-[color:var(--color-muted)]">guests</p>
            </div>
            <div className="rounded border border-[color:var(--color-ink)]/10 p-5">
              <dt className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Invites
              </dt>
              <dd className="mt-2 font-serif text-4xl">
                {stats.invitesResponded}
                <span className="ml-1 text-xl text-[color:var(--color-muted)]">
                  / {stats.totalInvites}
                </span>
              </dd>
              <p className="mt-1 text-sm text-[color:var(--color-muted)]">responded</p>
            </div>
            <div className="rounded border border-[color:var(--color-ink)]/10 p-5">
              <dt className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Awaiting
              </dt>
              <dd className="mt-2 font-serif text-4xl">{awaitingCount}</dd>
              <p className="mt-1 text-sm text-[color:var(--color-muted)]">invites</p>
            </div>
          </dl>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-[color:var(--color-muted)]">Response progress</span>
              <span className="font-[500]">
                {responseRate}%{" "}
                <span className="font-normal text-[color:var(--color-muted)]">
                  ({stats.invitesResponded} of {stats.totalInvites})
                </span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--color-ink)]/10">
              <div
                className="h-full rounded-full bg-[color:var(--color-cornflower)] transition-all"
                style={{ width: `${responseRate}%` }}
              />
            </div>
          </div>
        </>
      )}

      {eventBreakdown.length > 0 && (
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
            By event
          </p>
          <div className="space-y-3">
            {eventBreakdown.map((event) => (
              <div key={event.eventId} className="rounded border border-[color:var(--color-ink)]/10 p-5">
                <p className="mb-3 font-serif text-lg">{event.title}</p>
                <dl className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <dd className="font-serif text-2xl text-green-700">{event.attending}</dd>
                    <dt className="mt-0.5 text-xs text-[color:var(--color-muted)]">Attending</dt>
                  </div>
                  <div>
                    <dd className="font-serif text-2xl text-red-700">{event.declined}</dd>
                    <dt className="mt-0.5 text-xs text-[color:var(--color-muted)]">Declined</dt>
                  </div>
                  <div>
                    <dd className="font-serif text-2xl text-[color:var(--color-muted)]">{event.noResponse}</dd>
                    <dt className="mt-0.5 text-xs text-[color:var(--color-muted)]">No response</dt>
                  </div>
                  <div>
                    <dd className="font-serif text-2xl">{event.total}</dd>
                    <dt className="mt-0.5 text-xs text-[color:var(--color-muted)]">Total</dt>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
          Quick actions
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/invites/new"
            className="rounded border border-[color:var(--color-ink)]/20 px-4 py-2 text-sm hover:bg-[color:var(--color-ink)]/5 transition-colors"
          >
            + New invite
          </Link>
          <Link
            href="/admin/export"
            className="rounded border border-[color:var(--color-ink)]/20 px-4 py-2 text-sm hover:bg-[color:var(--color-ink)]/5 transition-colors"
          >
            ↓ Export CSV
          </Link>
        </div>
      </div>
    </section>
  );
}
