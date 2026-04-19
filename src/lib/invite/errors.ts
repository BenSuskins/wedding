import type { NotFoundError } from "@/lib/content/errors";
import type { UnexpectedError, ValidationError } from "@/lib/result";

export type InviteTokenVerificationError =
  | { kind: "token_malformed" }
  | { kind: "token_signature_mismatch" }
  | { kind: "token_version_stale" };

export type InviteError =
  | NotFoundError<"invite">
  | ValidationError
  | UnexpectedError;

export type InviteLookupError =
  | NotFoundError<"invite">
  | InviteTokenVerificationError
  | UnexpectedError;

export type GuestError =
  | NotFoundError<"guest">
  | ValidationError
  | UnexpectedError;
