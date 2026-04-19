import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-8">
      <header>
        <h2 className="font-serif text-3xl">Dashboard</h2>
        <p className="mt-2 text-[color:var(--color-muted)]">
          RSVP counts will appear here once the invite flow is live.
        </p>
      </header>
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
