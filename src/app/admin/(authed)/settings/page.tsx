import { listImageAssets } from "@/lib/content/image-asset";
import { listSiteSettings, type SiteSettingRecord } from "@/lib/content/site-setting";
import { getPrismaClient } from "@/server/db";

import { ImagePickerForm } from "./image-picker-form";
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
  const prisma = getPrismaClient();
  const [settingsResult, assetsResult] = await Promise.all([
    listSiteSettings(prisma),
    listImageAssets(prisma),
  ]);

  if (settingsResult.isErr()) {
    throw new Error(`Failed to load settings: ${settingsResult.error.kind}`);
  }

  const byKey = new Map<string, SiteSettingRecord>(
    settingsResult.value.map((row) => [row.key, row]),
  );
  const assets = assetsResult.isOk() ? assetsResult.value : [];

  const siteTitle = byKey.get("site_title");
  const logoText = byKey.get("logo_text");
  const pageTitle = byKey.get("page_title");
  const metaDescription = byKey.get("meta_description");
  const heroPretitle = byKey.get("hero_pretitle");
  const rsvpHeading = byKey.get("rsvp_heading");
  const weddingDate = byKey.get("wedding_date");
  const rsvpDeadline = byKey.get("rsvp_deadline");
  const heroImage = byKey.get("hero_image_path");
  const ceremonyImage = byKey.get("ceremony_image_path");
  const receptionImage = byKey.get("reception_image_path");
  const travelImage = byKey.get("travel_image_path");

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
        label="Site title (couple names)"
        inputType="text"
        currentValue={
          siteTitle && siteTitle.key === "site_title" ? siteTitle.value.title : ""
        }
        updatedAt={siteTitle?.updatedAt ?? null}
      />

      <SettingForm
        settingKey="logo_text"
        label="Nav logo text"
        inputType="text"
        currentValue={
          logoText && logoText.key === "logo_text" ? logoText.value.text : ""
        }
        updatedAt={logoText?.updatedAt ?? null}
      />

      <SettingForm
        settingKey="page_title"
        label="Browser tab title"
        inputType="text"
        currentValue={
          pageTitle && pageTitle.key === "page_title" ? pageTitle.value.title : ""
        }
        updatedAt={pageTitle?.updatedAt ?? null}
      />

      <SettingForm
        settingKey="meta_description"
        label="Meta description"
        inputType="text"
        currentValue={
          metaDescription && metaDescription.key === "meta_description"
            ? metaDescription.value.description
            : ""
        }
        updatedAt={metaDescription?.updatedAt ?? null}
      />

      <SettingForm
        settingKey="hero_pretitle"
        label="Hero pre-title text"
        inputType="text"
        currentValue={
          heroPretitle && heroPretitle.key === "hero_pretitle" ? heroPretitle.value.text : ""
        }
        updatedAt={heroPretitle?.updatedAt ?? null}
      />

      <SettingForm
        settingKey="rsvp_heading"
        label="RSVP section heading"
        inputType="text"
        currentValue={
          rsvpHeading && rsvpHeading.key === "rsvp_heading" ? rsvpHeading.value.text : ""
        }
        updatedAt={rsvpHeading?.updatedAt ?? null}
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

      <ImagePickerForm
        settingKey="hero_image_path"
        label="Hero image"
        currentPath={heroImage && heroImage.key === "hero_image_path" ? heroImage.value.path : ""}
        initialAssets={assets}
        updatedAt={heroImage?.updatedAt ?? null}
      />

      <ImagePickerForm
        settingKey="ceremony_image_path"
        label="Ceremony venue image"
        currentPath={
          ceremonyImage && ceremonyImage.key === "ceremony_image_path"
            ? ceremonyImage.value.path
            : ""
        }
        initialAssets={assets}
        updatedAt={ceremonyImage?.updatedAt ?? null}
      />

      <ImagePickerForm
        settingKey="reception_image_path"
        label="Reception venue image"
        currentPath={
          receptionImage && receptionImage.key === "reception_image_path"
            ? receptionImage.value.path
            : ""
        }
        initialAssets={assets}
        updatedAt={receptionImage?.updatedAt ?? null}
      />

      <ImagePickerForm
        settingKey="travel_image_path"
        label="Travel section image"
        currentPath={
          travelImage && travelImage.key === "travel_image_path" ? travelImage.value.path : ""
        }
        initialAssets={assets}
        updatedAt={travelImage?.updatedAt ?? null}
      />
    </section>
  );
}
