import { describe, expect, it } from "vitest";

import {
  createFakeInviteTokenSigner,
  createHmacInviteTokenSigner,
} from "@/lib/invite-token";

import { runInviteTokenSignerContract } from "./invite-token.contract";

const TEST_SECRET = "test-secret-at-least-sixteen-chars";

runInviteTokenSignerContract("hmac", () => createHmacInviteTokenSigner(TEST_SECRET));
runInviteTokenSignerContract("fake", () => createFakeInviteTokenSigner());

describe("hmac invite token signer", () => {
  it("uses different signatures for different secrets", () => {
    const payload = { inviteId: "inv_1", tokenVersion: 1 };
    const tokenA = createHmacInviteTokenSigner(TEST_SECRET).sign(payload);
    const tokenB = createHmacInviteTokenSigner("different-but-also-long-enough").sign(payload);
    expect(tokenA).not.toBe(tokenB);
  });

  it("rejects a token signed by a different secret as signature_mismatch", () => {
    const signerA = createHmacInviteTokenSigner(TEST_SECRET);
    const signerB = createHmacInviteTokenSigner("different-but-also-long-enough");
    const tokenFromA = signerA.sign({ inviteId: "inv_1", tokenVersion: 1 });

    const result = signerB.verify(tokenFromA);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().kind).toBe("signature_mismatch");
  });

  it("throws if the secret is too short", () => {
    expect(() => createHmacInviteTokenSigner("short")).toThrow(/at least 16/);
  });
});
