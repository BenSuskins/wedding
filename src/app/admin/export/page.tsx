export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function AdminExportPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header>
        <h2 className="font-serif text-3xl">Export RSVPs</h2>
        <p className="mt-2 text-[color:var(--color-muted)]">
          Download a CSV snapshot of every guest&rsquo;s RSVP, menu selections, allergies, and song
          request. One row per guest per allowed event.
        </p>
      </header>
      <div className="rounded border border-[color:var(--color-ink)]/10 p-5">
        <a
          href="/api/admin/export"
          className="inline-block rounded border border-[color:var(--color-ink)]/30 px-5 py-2 text-sm uppercase tracking-[0.2em] hover:bg-[color:var(--color-ink)]/5"
          download
        >
          Download CSV
        </a>
        <p className="mt-3 text-xs text-[color:var(--color-muted)]">
          The file is generated on demand and reflects the live database state.
        </p>
      </div>
    </section>
  );
}
