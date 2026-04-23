import Link from "next/link";

import { listInvites } from "@/lib/invite/invite";
import { getPrismaClient } from "@/server/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminDietaryPage() {
  const result = await listInvites(getPrismaClient());
  if (result.isErr()) {
    throw new Error(`Failed to load invites: ${result.error.kind}`);
  }

  const invites = result.value;
  const dietary = invites.filter((invite) => invite.allergiesText);
  const songs = invites.filter((invite) => invite.songRequestText);

  return (
    <section className="mx-auto max-w-4xl space-y-10">
      <header className="flex items-center justify-between">
        <h2 className="font-serif text-3xl">Dietary &amp; Song Requests</h2>
        <Link
          href="/admin"
          className="text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
        >
          Back
        </Link>
      </header>

      <section>
        <h3 className="font-serif text-xl">Dietary notes</h3>
        {dietary.length === 0 ? (
          <p className="mt-4 text-sm text-[color:var(--color-muted)]">No dietary notes submitted.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[color:var(--color-ink)]/10">
            {dietary.map((invite) => (
              <li key={invite.id} className="py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                  {invite.guestNames.join(", ")}
                </p>
                <p className="mt-1 text-sm">{invite.allergiesText}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="font-serif text-xl">Song requests</h3>
        {songs.length === 0 ? (
          <p className="mt-4 text-sm text-[color:var(--color-muted)]">No song requests submitted.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[color:var(--color-ink)]/10">
            {songs.map((invite) => (
              <li key={invite.id} className="py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                  {invite.guestNames.join(", ")}
                </p>
                <p className="mt-1 text-sm">{invite.songRequestText}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
