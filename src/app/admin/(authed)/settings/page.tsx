import { listSiteSettings, type SiteSettingRecord } from "@/lib/content/site-setting";
import { getPrismaClient } from "@/server/db";

import { SettingForm } from "./setting-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function toDatetimeLocal(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "";
  const tzOffsetMinutes = parsed.getTimezoneOffset();
  const local = new Date(parsed.getTime() - tzOffsetMinutes * 60_000);
  return local.toISOString().slice(0, 16);
}

export default async function AdminSettingsPage() {
  const result = await listSiteSettings(getPrismaClient());
  if (result.isErr()) {
    throw new Error(`Failed to load settings: ${result.error.kind}`);
  }

  const byKey = new Map<string, SiteSettingRecord>(
    result.value.map((row) => [row.key, row]),
  );
  const siteTitle = byKey.get("site_title");
  const weddingDate = byKey.get("wedding_date");
  const rsvpDeadline = byKey.get("rsvp_deadline");
  const heroImage = byKey.get("hero_image_path");
  const ceremonyImage = byKey.get("ceremony_image_path");
  const receptionImage = byKey.get("reception_image_path");

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header>
        <h2 className="font-serif text-3xl">Settings</h2>
        <p className="mt-2 text-[color:var(--color-muted)]">
          Keys consumed by the public site and the RSVP flow.
        </p>
      </header>

      <SettingForm
        settingKey="site_title"
        label="Site title"
        inputType="text"
        currentValue={
          siteTitle && siteTitle.key === "site_title" ? siteTitle.value.title : ""
        }
        updatedAt={siteTitle?.updatedAt ?? null}
      />

      <SettingForm
        settingKey="wedding_date"
        label="Wedding date"
        inputType="datetime-local"
        currentValue={
          weddingDate && weddingDate.key === "wedding_date"
            ? toDatetimeLocal(weddingDate.value.isoDate)
            : ""
        }
        updatedAt={weddingDate?.updatedAt ?? null}
      />

      <SettingForm
        settingKey="rsvp_deadline"
        label="RSVP deadline"
        inputType="datetime-local"
        currentValue={
          rsvpDeadline && rsvpDeadline.key === "rsvp_deadline"
            ? toDatetimeLocal(rsvpDeadline.value.isoDate)
            : ""
        }
        updatedAt={rsvpDeadline?.updatedAt ?? null}
      />

      <SettingForm
        settingKey="hero_image_path"
        label="Hero image path"
        inputType="text"
        currentValue={
          heroImage && heroImage.key === "hero_image_path" ? heroImage.value.path : ""
        }
        updatedAt={heroImage?.updatedAt ?? null}
      />

      <SettingForm
        settingKey="ceremony_image_path"
        label="Ceremony venue image path"
        inputType="text"
        currentValue={
          ceremonyImage && ceremonyImage.key === "ceremony_image_path"
            ? ceremonyImage.value.path
            : ""
        }
        updatedAt={ceremonyImage?.updatedAt ?? null}
      />

      <SettingForm
        settingKey="reception_image_path"
        label="Reception venue image path"
        inputType="text"
        currentValue={
          receptionImage && receptionImage.key === "reception_image_path"
            ? receptionImage.value.path
            : ""
        }
        updatedAt={receptionImage?.updatedAt ?? null}
      />
    </section>
  );
}
