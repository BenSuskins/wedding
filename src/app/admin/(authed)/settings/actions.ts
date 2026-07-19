"use server";

import { revalidatePath } from "next/cache";

import {
  setSiteSetting,
  SITE_SETTING_KEYS,
  type SiteSettingKey,
} from "@/lib/content/site-setting";
import { requireAdminIdentity } from "@/lib/admin/session";
import { getPrismaClient } from "@/server/db";

export interface SettingsFormState {
  error?: string;
  issues?: ReadonlyArray<{ path: string; message: string }>;
  updatedKey?: SiteSettingKey;
}

function isKnownKey(key: string): key is SiteSettingKey {
  return (SITE_SETTING_KEYS as readonly string[]).includes(key);
}

function buildValue(key: SiteSettingKey, formData: FormData): unknown {
  switch (key) {
    case "site_title":
      return { title: String(formData.get("site_title") ?? "") };
    case "wedding_date": {
      const raw = String(formData.get("wedding_date") ?? "");
      return { isoDate: raw ? new Date(raw).toISOString() : "" };
    }
    case "rsvp_deadline": {
      const raw = String(formData.get("rsvp_deadline") ?? "");
      return { isoDate: raw ? new Date(raw).toISOString() : "" };
    }
    case "logo_text":
      return { text: String(formData.get("logo_text") ?? "") };
    case "page_title":
      return { title: String(formData.get("page_title") ?? "") };
    case "meta_description":
      return { description: String(formData.get("meta_description") ?? "") };
    case "hero_pretitle":
      return { text: String(formData.get("hero_pretitle") ?? "") };
    case "rsvp_heading":
      return { text: String(formData.get("rsvp_heading") ?? "") };
    case "hero_image_path":
      return { path: String(formData.get("hero_image_path") ?? "") };
    case "hero_image_paths":
      return {
        paths: formData
          .getAll("hero_image_paths")
          .map((entry) => String(entry).trim())
          .filter((path) => path.length > 0),
      };
    case "ceremony_image_path":
      return { path: String(formData.get("ceremony_image_path") ?? "") };
    case "reception_image_path":
      return { path: String(formData.get("reception_image_path") ?? "") };
    case "travel_image_path":
      return { path: String(formData.get("travel_image_path") ?? "") };
    case "theme_colors":
      // Managed by saveThemeAction on /admin/theme — not reachable via this form.
      return { overrides: {} };
  }
}

export async function saveSettingAction(
  _previous: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireAdminIdentity();
  const key = String(formData.get("key") ?? "");
  if (!isKnownKey(key)) {
    return { error: `Unknown setting: ${key}` };
  }

  const result = await setSiteSetting(getPrismaClient(), key, buildValue(key, formData));

  if (result.isErr()) {
    if (result.error.kind === "validation") {
      return { error: "Please fix the highlighted fields.", issues: result.error.issues };
    }
    return { error: `Save failed: ${result.error.kind}` };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { updatedKey: key };
}
