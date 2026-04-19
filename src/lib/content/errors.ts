import type { UnexpectedError, ValidationError } from "@/lib/result";

export type NotFoundError<TKey extends string = string> = {
  kind: "not_found";
  resource: TKey;
  identifier: string;
};

export function notFoundError<TKey extends string>(
  resource: TKey,
  identifier: string,
): NotFoundError<TKey> {
  return { kind: "not_found", resource, identifier };
}

export type SlugTakenError = {
  kind: "slug_taken";
  slug: string;
};

export function slugTakenError(slug: string): SlugTakenError {
  return { kind: "slug_taken", slug };
}

export type ContentBlockError =
  | NotFoundError<"content_block">
  | ValidationError
  | UnexpectedError;

export type SiteSettingError =
  | NotFoundError<"site_setting">
  | ValidationError
  | UnexpectedError;

export type EventError =
  | NotFoundError<"event">
  | SlugTakenError
  | ValidationError
  | UnexpectedError;
