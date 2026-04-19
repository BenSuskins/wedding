import { err, ok, type Result } from "neverthrow";
import type { ZodError, ZodType } from "zod";

export interface ValidationIssue {
  path: string;
  message: string;
}

export type ValidationError = {
  kind: "validation";
  issues: ValidationIssue[];
};

export function validationError(issues: ValidationIssue[]): ValidationError {
  return { kind: "validation", issues };
}

export function parseWithSchema<TInput, TOutput>(
  schema: ZodType<TOutput, TInput>,
  input: TInput,
): Result<TOutput, ValidationError> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return ok(parsed.data);
  return err(zodErrorToValidationError(parsed.error));
}

function zodErrorToValidationError(error: ZodError): ValidationError {
  return {
    kind: "validation",
    issues: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}

export type UnexpectedError = {
  kind: "unexpected";
  cause: unknown;
};

export function unexpectedError(cause: unknown): UnexpectedError {
  return { kind: "unexpected", cause };
}
