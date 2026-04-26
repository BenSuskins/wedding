import { getSiteSetting } from "@/lib/content/site-setting";
import { getPrismaClient } from "@/server/db";

import { ThemeEditor } from "./theme-editor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminThemePage() {
  const result = await getSiteSetting(getPrismaClient(), "theme_colors");
  const overrides = result.isOk() ? result.value.value.overrides : {};

  return (
    <section className="mx-auto max-w-3xl">
      <header className="mb-8">
        <h2 className="font-serif text-3xl">Theme</h2>
        <p className="mt-2 text-[color:var(--color-muted)]">
          Customise colours and fonts. The colour swatches update as you type. Save to apply
          site-wide.
        </p>
      </header>
      <ThemeEditor initialOverrides={overrides} />
    </section>
  );
}
