"use server";

import { revalidatePath } from "next/cache";

import { requireAdminIdentity } from "@/lib/admin/session";
import { setSiteSetting } from "@/lib/content/site-setting";
import { getPrismaClient } from "@/server/db";

import { ALLOWED_THEME_VARIABLES } from "./tokens";

function sanitizeCssValue(value: string): string {
  return value.replace(/[<>{}\\]/g, "").trim();
}

export async function saveThemeAction(
  rawOverrides: Record<string, string>,
): Promise<{ error?: string }> {
  await requireAdminIdentity();

  const overrides: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawOverrides)) {
    if (!ALLOWED_THEME_VARIABLES.has(key)) continue;
    const safe = sanitizeCssValue(value);
    if (safe) overrides[key] = safe;
  }

  const result = await setSiteSetting(getPrismaClient(), "theme_colors", { overrides });
  if (result.isErr()) {
    return { error: `Save failed: ${result.error.kind}` };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/theme");
  return {};
}
