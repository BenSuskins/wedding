import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { listEvents } from "@/lib/content/event";
import { getInviteById } from "@/lib/invite/invite";
import { buildInviteUrl } from "@/lib/invite/invite-url";
import { createHmacInviteTokenSigner } from "@/lib/invite-token";
import { getInviteTokenSecret, getPublicBaseUrl } from "@/server/env";
import { getPrismaClient } from "@/server/db";

import {
  deleteInviteAction,
  rotateInviteTokenAction,
  updateInviteCoreAction,
  type InviteFormState,
} from "../actions";
import { CopyLinkButton } from "../copy-link-button";
import { GuestsManager } from "./guests-manager";
import { InviteCoreForm } from "./invite-core-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Params {
  id: string;
}

async function resolveBaseUrl(): Promise<string> {
  const configured = getPublicBaseUrl();
  if (configured) return configured;
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host");
  const proto = incoming.get("x-forwarded-proto") ?? "http";
  if (!host) return "";
  return `${proto}://${host}`;
}

export default async function InviteDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const [inviteResult, eventsResult, baseUrl] = await Promise.all([
    getInviteById(getPrismaClient(), id),
    listEvents(getPrismaClient()),
    resolveBaseUrl(),
  ]);

  if (inviteResult.isErr()) {
    if (inviteResult.error.kind === "not_found") notFound();
    throw new Error(`Failed to load invite: ${inviteResult.error.kind}`);
  }
  const invite = inviteResult.value;
  const allEvents = eventsResult.isOk() ? eventsResult.value : [];

  const signer = createHmacInviteTokenSigner(getInviteTokenSecret());
  const inviteUrl = buildInviteUrl(
    signer,
    { inviteId: invite.id, tokenVersion: invite.tokenVersion },
    baseUrl,
  );

  const boundCoreAction = async (
    prev: InviteFormState,
    data: FormData,
  ): Promise<InviteFormState> => {
    "use server";
    return updateInviteCoreAction(id, prev, data);
  };

  return (
    <section className="mx-auto max-w-4xl space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl">Invite</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
            id: {invite.id} · token v{invite.tokenVersion}
          </p>
        </div>
        <Link
          href="/admin/invites"
          className="text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
        >
          Back
        </Link>
      </header>

      <section className="rounded border border-[color:var(--color-ink)]/10 p-5">
        <h3 className="font-serif text-xl">Shareable link</h3>
        <p className="mt-2 break-all font-mono text-sm">{inviteUrl}</p>
        <div className="mt-3 flex items-center gap-3">
          <CopyLinkButton value={inviteUrl} />
          <form action={rotateInviteTokenAction.bind(null, invite.id)}>
            <button
              type="submit"
              className="rounded border border-[color:var(--color-ink)]/20 px-3 py-1 text-sm hover:bg-[color:var(--color-ink)]/5"
            >
              Rotate token
            </button>
          </form>
        </div>
        <p className="mt-3 text-xs text-[color:var(--color-muted)]">
          Rotating the token invalidates the previous link. Use it if a link may have been shared
          beyond this household.
        </p>
      </section>

      <section>
        <h3 className="font-serif text-xl">Settings</h3>
        <InviteCoreForm
          action={boundCoreAction}
          initial={{
            rsvpMode: invite.rsvpMode,
            plusOneAllowed: invite.plusOneAllowed,
            invitationSent: invite.invitationSent,
            adminNotes: invite.adminNotes ?? "",
            eventIds: invite.eventAllowances.map((allowance) => allowance.eventId),
          }}
          events={allEvents.map((event) => ({ id: event.id, title: event.title }))}
        />
      </section>

      <section>
        <h3 className="font-serif text-xl">Guests</h3>
        <GuestsManager
          inviteId={invite.id}
          guests={invite.guests}
          events={allEvents.map((event) => ({ id: event.id, title: event.title }))}
        />
      </section>

      {(invite.allergiesText || invite.songRequestText) ? (
        <section className="rounded border border-[color:var(--color-ink)]/10 p-5 space-y-3">
          <h3 className="font-serif text-xl">Dietary &amp; Song Request</h3>
          {invite.allergiesText ? (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">Dietary notes</p>
              <p className="mt-1 text-sm">{invite.allergiesText}</p>
            </div>
          ) : null}
          {invite.songRequestText ? (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">Song request</p>
              <p className="mt-1 text-sm">{invite.songRequestText}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      <section>
        <h3 className="font-serif text-xl text-red-800">Danger zone</h3>
        <form action={deleteInviteAction.bind(null, invite.id)} className="mt-3">
          <button
            type="submit"
            className="rounded border border-red-300 px-4 py-2 text-sm text-red-800 hover:bg-red-50"
          >
            Delete invite
          </button>
        </form>
      </section>
    </section>
  );
}
