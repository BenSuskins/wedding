import type { InviteTokenPayload, InviteTokenSigner } from "@/lib/invite-token";

export function buildInviteUrl(
  signer: InviteTokenSigner,
  payload: InviteTokenPayload,
  baseUrl: string,
): string {
  const token = signer.sign(payload);
  const trimmedBase = baseUrl.replace(/\/+$/, "");
  return `${trimmedBase}/rsvp/${token}`;
}
