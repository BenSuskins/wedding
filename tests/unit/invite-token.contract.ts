import { describe, expect, it } from "vitest";

import type { InviteTokenSigner } from "@/lib/invite-token";

export function runInviteTokenSignerContract(
  label: string,
  buildSigner: () => InviteTokenSigner,
) {
  describe(`invite token signer contract — ${label}`, () => {
    it("round-trips a signed payload", () => {
      const signer = buildSigner();
      const token = signer.sign({ inviteId: "inv_123", tokenVersion: 1 });

      const result = signer.verify(token);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({ inviteId: "inv_123", tokenVersion: 1 });
    });

    it("distinguishes signatures across token versions", () => {
      const signer = buildSigner();
      const v1 = signer.sign({ inviteId: "inv_1", tokenVersion: 1 });
      const v2 = signer.sign({ inviteId: "inv_1", tokenVersion: 2 });
      expect(v1).not.toBe(v2);

      const verified = signer.verify(v2);
      expect(verified.isOk()).toBe(true);
      expect(verified._unsafeUnwrap().tokenVersion).toBe(2);
    });

    it("rejects a tampered payload as signature_mismatch or malformed", () => {
      const signer = buildSigner();
      const token = signer.sign({ inviteId: "inv_1", tokenVersion: 1 });
      const tampered = token.slice(0, -4) + "AAAA";

      const result = signer.verify(tampered);
      expect(result.isErr()).toBe(true);
      const kind = result._unsafeUnwrapErr().kind;
      expect(kind === "signature_mismatch" || kind === "malformed").toBe(true);
    });

    it("rejects a token with the wrong number of segments as malformed", () => {
      const signer = buildSigner();
      const result = signer.verify("not-a-real-token");
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().kind).toBe("malformed");
    });

    it("rejects an empty token", () => {
      const signer = buildSigner();
      const result = signer.verify("");
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().kind).toBe("malformed");
    });
  });
}
