import type { Metadata } from "next";

import "./globals.css";
import { getSiteSetting } from "@/lib/content/site-setting";
import { getPrismaClient } from "@/server/db";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const prisma = getPrismaClient();
    const [titleResult, descResult] = await Promise.all([
      getSiteSetting(prisma, "page_title"),
      getSiteSetting(prisma, "meta_description"),
    ]);

    return {
      title: titleResult.isOk() ? titleResult.value.value.title : "Wedding",
      description: descResult.isOk()
        ? descResult.value.value.description
        : "A quiet corner of the internet for our wedding.",
    };
  } catch {
    return {
      title: "Wedding",
      description: "A quiet corner of the internet for our wedding.",
    };
  }
}

const ALLOWED_THEME_VARS: ReadonlySet<string> = new Set([
  "--color-paper",
  "--color-paper-mid",
  "--color-ink",
  "--color-muted",
  "--color-cornflower",
  "--color-cornflower-pale",
  "--color-peach",
  "--color-lavender",
  "--color-eucalyptus",
  "--font-serif",
  "--font-sans",
]);

async function buildThemeStyle(): Promise<string | null> {
  try {
    const result = await getSiteSetting(getPrismaClient(), "theme_colors");
    if (result.isErr()) return null;
    const overrides = result.value.value.overrides;
    const entries = Object.entries(overrides).filter(
      ([k, v]) => ALLOWED_THEME_VARS.has(k) && v && !/[<>{}\\]/.test(v),
    );
    if (entries.length === 0) return null;
    return `:root { ${entries.map(([k, v]) => `${k}: ${v}`).join("; ")} }`;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const themeStyle = await buildThemeStyle();

  return (
    <html lang="en">
      {themeStyle ? (
        <head>
          <style>{themeStyle}</style>
        </head>
      ) : null}
      <body>{children}</body>
    </html>
  );
}
