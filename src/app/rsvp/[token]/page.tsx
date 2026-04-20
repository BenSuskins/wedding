import { notFound } from "next/navigation";

import { systemClock } from "@/lib/clock";
import { createHmacInviteTokenSigner } from "@/lib/invite-token";
import { loadRsvpStateByToken, type RsvpLoadedState } from "@/lib/rsvp/load";
import { getInviteTokenSecret } from "@/server/env";
import { getPrismaClient } from "@/server/db";

import { GuestResponseForm } from "./guest-response-form";
import { InvitePreferencesForm } from "./invite-preferences-form";
import { PlusOneForm } from "./plus-one-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Params {
  token: string;
}

export default async function RsvpPage({ params }: { params: Promise<Params> }) {
  const { token } = await params;
  const signer = createHmacInviteTokenSigner(getInviteTokenSecret());
  const result = await loadRsvpStateByToken(getPrismaClient(), signer, systemClock, token);

  if (result.isErr()) {
    if (
      result.error.kind === "token_malformed" ||
      result.error.kind === "token_signature_mismatch" ||
      result.error.kind === "not_found"
    ) {
      notFound();
    }
    if (result.error.kind === "token_version_stale") {
      return <ExpiredLinkNotice />;
    }
    throw new Error(`Failed to load RSVP: ${result.error.kind}`);
  }

  const state = result.value;
  const locked = state.deadline.kind === "locked";
  const hasPlusOneSlot = state.invite.plusOneAllowed;
  const plusOneAlreadyAdded = state.guests.some((guest) => guest.isPlusOne);

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-6 py-10">
      <header className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
          RSVP
        </p>
        <h1 className="font-serif text-4xl">You&apos;re invited</h1>
        <DeadlineNotice state={state} />
      </header>

      {state.events.length === 0 ? (
        <p className="text-center text-sm text-[color:var(--color-muted)]">
          No events are open to this invite yet. Please check back soon.
        </p>
      ) : (
        <div className="space-y-10">
          {state.events.map((event) => (
            <section key={event.id} className="space-y-4">
              <div className="border-b border-[color:var(--color-ink)]/10 pb-2">
                <h2 className="font-serif text-2xl">{event.title}</h2>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                  {formatEventWhen(event.startsAt, event.endsAt)} · {event.locationName}
                </p>
              </div>
              <div className="space-y-4">
                {state.guests.map((guest) => (
                  <GuestResponseForm
                    key={`${guest.id}-${event.id}`}
                    token={token}
                    guestId={guest.id}
                    guestName={guest.displayName}
                    eventId={event.id}
                    eventTitle={event.title}
                    courses={event.courses}
                    existing={findExisting(state, guest.id, event.id)}
                    disabled={locked}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <section className="space-y-3">
        <h3 className="font-serif text-xl">Dietary &amp; Song Request</h3>
        <p className="text-sm text-[color:var(--color-muted)]">
          Let us know about any allergies or dietary requirements, and feel free to suggest a song
          for the reception.
        </p>
        <InvitePreferencesForm
          token={token}
          existing={{
            allergiesText: state.invite.allergiesText,
            songRequestText: state.invite.songRequestText,
          }}
          disabled={locked}
        />
      </section>

      {hasPlusOneSlot && !plusOneAlreadyAdded ? (
        <section className="space-y-3">
          <h3 className="font-serif text-xl">Plus-one</h3>
          <p className="text-sm text-[color:var(--color-muted)]">
            You&apos;re welcome to bring a guest. Add their name below and they&apos;ll appear as
            their own line above.
          </p>
          <PlusOneForm token={token} disabled={locked} />
        </section>
      ) : null}
    </div>
  );
}

function findExisting(
  state: RsvpLoadedState,
  guestId: string,
  eventId: string,
): { attending: boolean; selections: ReadonlyArray<{ courseId: string; optionId: string }> } | null {
  const response = state.responses.find(
    (entry) => entry.guestId === guestId && entry.eventId === eventId,
  );
  if (!response) return null;
  return { attending: response.attending, selections: response.selections };
}

function DeadlineNotice({ state }: { state: RsvpLoadedState }) {
  if (state.deadline.kind === "locked") {
    return (
      <p className="text-sm text-[color:var(--color-muted)]">
        RSVPs closed on {formatFullDate(state.deadline.deadline)}. You can still see what you
        submitted, but changes are no longer possible.
      </p>
    );
  }
  if (state.deadline.deadline) {
    return (
      <p className="text-sm text-[color:var(--color-muted)]">
        Please RSVP by {formatFullDate(state.deadline.deadline)}.
      </p>
    );
  }
  return null;
}

function ExpiredLinkNotice() {
  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <h1 className="font-serif text-3xl">This link has been replaced</h1>
      <p className="mt-3 text-sm text-[color:var(--color-muted)]">
        Please use the most recent link sent to you. If you&apos;re not sure, reach out to the
        couple.
      </p>
    </div>
  );
}

function formatEventWhen(startsAt: Date, endsAt: Date): string {
  const start = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(startsAt);
  const endSameDay = startsAt.toDateString() === endsAt.toDateString();
  const endFormat = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  }).format(endsAt);
  return endSameDay ? `${start} – ${endFormat}` : start;
}

function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
