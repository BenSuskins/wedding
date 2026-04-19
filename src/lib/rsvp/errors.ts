import type { NotFoundError, SiteSettingError } from "@/lib/content/errors";
import type { UnexpectedError, ValidationError } from "@/lib/result";

export type DeadlineError = Exclude<SiteSettingError, NotFoundError<"site_setting">> | UnexpectedError;

export type DeadlineStatus =
  | { kind: "open"; deadline: Date | null }
  | { kind: "locked"; deadline: Date };

export type MenuCourseError =
  | NotFoundError<"menu_course">
  | NotFoundError<"event">
  | ValidationError
  | UnexpectedError;

export type MenuOptionError =
  | NotFoundError<"menu_option">
  | NotFoundError<"menu_course">
  | ValidationError
  | UnexpectedError;

export type RsvpLoadError =
  | NotFoundError<"invite">
  | { kind: "token_malformed" }
  | { kind: "token_signature_mismatch" }
  | { kind: "token_version_stale" }
  | UnexpectedError;

export type RsvpSubmitError =
  | { kind: "deadline_passed"; deadline: Date }
  | NotFoundError<"invite">
  | { kind: "guest_not_in_invite" }
  | { kind: "event_not_allowed" }
  | { kind: "invalid_menu_option"; courseId: string; optionId: string }
  | { kind: "duplicate_course_selection"; courseId: string }
  | ValidationError
  | UnexpectedError;

export type AddPlusOneError =
  | { kind: "deadline_passed"; deadline: Date }
  | NotFoundError<"invite">
  | { kind: "plus_one_not_allowed" }
  | { kind: "plus_one_already_added" }
  | ValidationError
  | UnexpectedError;
