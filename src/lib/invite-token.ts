import { createHmac, timingSafeEqual } from "node:crypto";

import { err, ok, type Result } from "neverthrow";

export interface InviteTokenPayload {
  inviteId: string;
  tokenVersion: number;
}

export type InviteTokenError =
  | { kind: "malformed" }
  | { kind: "signature_mismatch" };

export interface InviteTokenSigner {
  sign(payload: InviteTokenPayload): string;
  verify(token: string): Result<InviteTokenPayload, InviteTokenError>;
}

const SEPARATOR = ".";

function toBase64Url(buffer: Buffer): string {
  return buffer.toString("base64url");
}

function fromBase64Url(input: string): Buffer | null {
  if (!input || /[^A-Za-z0-9_-]/.test(input)) return null;
  try {
    return Buffer.from(input, "base64url");
  } catch {
    return null;
  }
}

function computeSignature(secret: string, inviteId: string, tokenVersion: number): Buffer {
  const mac = createHmac("sha256", secret);
  mac.update(inviteId);
  mac.update(SEPARATOR);
  mac.update(String(tokenVersion));
  return mac.digest();
}

export function createHmacInviteTokenSigner(secret: string): InviteTokenSigner {
  if (!secret || secret.length < 16) {
    throw new Error("invite token secret must be at least 16 characters");
  }

  return {
    sign(payload) {
      const signature = computeSignature(secret, payload.inviteId, payload.tokenVersion);
      const parts = [
        toBase64Url(Buffer.from(payload.inviteId, "utf8")),
        toBase64Url(Buffer.from(String(payload.tokenVersion), "utf8")),
        toBase64Url(signature),
      ];
      return parts.join(SEPARATOR);
    },
    verify(token) {
      const segments = token.split(SEPARATOR);
      if (segments.length !== 3) return err({ kind: "malformed" });
      const [rawInviteId, rawVersion, rawSignature] = segments;
      if (!rawInviteId || !rawVersion || !rawSignature) {
        return err({ kind: "malformed" });
      }

      const inviteIdBytes = fromBase64Url(rawInviteId);
      const versionBytes = fromBase64Url(rawVersion);
      const signatureBytes = fromBase64Url(rawSignature);
      if (!inviteIdBytes || !versionBytes || !signatureBytes) {
        return err({ kind: "malformed" });
      }

      const inviteId = inviteIdBytes.toString("utf8");
      const versionText = versionBytes.toString("utf8");
      if (!/^[0-9]+$/.test(versionText)) return err({ kind: "malformed" });
      const tokenVersion = Number.parseInt(versionText, 10);
      if (!Number.isSafeInteger(tokenVersion) || tokenVersion < 1) {
        return err({ kind: "malformed" });
      }

      const expected = computeSignature(secret, inviteId, tokenVersion);
      if (expected.length !== signatureBytes.length) {
        return err({ kind: "signature_mismatch" });
      }
      if (!timingSafeEqual(expected, signatureBytes)) {
        return err({ kind: "signature_mismatch" });
      }

      return ok({ inviteId, tokenVersion });
    },
  };
}

// Deterministic fake used in tests. Encodes the payload as JSON under a
// constant prefix; verification rejects tampered output and anything not
// matching the prefix. The fake shares its contract suite with the real
// signer via tests/contract/invite-token.contract.ts.
const FAKE_PREFIX = "fake:";

export function createFakeInviteTokenSigner(): InviteTokenSigner {
  return {
    sign(payload) {
      return `${FAKE_PREFIX}${toBase64Url(
        Buffer.from(JSON.stringify(payload), "utf8"),
      )}`;
    },
    verify(token) {
      if (!token.startsWith(FAKE_PREFIX)) return err({ kind: "malformed" });
      const body = fromBase64Url(token.slice(FAKE_PREFIX.length));
      if (!body) return err({ kind: "malformed" });
      try {
        const parsed = JSON.parse(body.toString("utf8")) as unknown;
        if (
          typeof parsed !== "object" ||
          parsed === null ||
          typeof (parsed as InviteTokenPayload).inviteId !== "string" ||
          typeof (parsed as InviteTokenPayload).tokenVersion !== "number"
        ) {
          return err({ kind: "malformed" });
        }
        return ok(parsed as InviteTokenPayload);
      } catch {
        return err({ kind: "malformed" });
      }
    },
  };
}
