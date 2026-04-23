import Link from "next/link";
import type { ReactNode } from "react";

import { Sprig } from "@/components/sprig";
import { getSiteSetting } from "@/lib/content/site-setting";
import { getPrismaClient } from "@/server/db";

export const runtime = "nodejs";

async function resolveLogoText(): Promise<string> {
  try {
    const prisma = getPrismaClient();
    const logoResult = await getSiteSetting(prisma, "logo_text");
    if (logoResult.isOk()) return logoResult.value.value.text;
    const titleResult = await getSiteSetting(prisma, "site_title");
    if (titleResult.isOk()) return titleResult.value.value.title;
  } catch {
    // DB unavailable — fall through to default.
  }
  return "Our Wedding";
}

async function resolveCoupleNames(): Promise<string> {
  try {
    const result = await getSiteSetting(getPrismaClient(), "site_title");
    if (result.isOk()) return result.value.value.title;
  } catch {
    // DB unavailable — fall through to default.
  }
  return "Our Wedding";
}

const navLinks: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/#the-day", label: "The Day" },
  { href: "/#venues", label: "Venues" },
  { href: "/#travel", label: "Travel" },
  { href: "/#faq", label: "FAQs" },
];

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [logoText, coupleNames] = await Promise.all([resolveLogoText(), resolveCoupleNames()]);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-paper)", color: "var(--color-ink)" }}>
      <header
        className="border-b border-[color:var(--color-ink)]/10 px-[clamp(1.5rem,5vw,4rem)] py-5"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <Link
          href="/"
          className="font-serif text-[length:clamp(1.2rem,1.1rem+0.5vw,1.5rem)] italic font-[400] tracking-[0.04em] text-[color:var(--color-ink)] no-underline transition-colors hover:text-[color:var(--color-cornflower)]"
        >
          {logoText}
        </Link>
        <nav className="flex gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[length:clamp(1.1rem,1rem+0.5vw,1.25rem)] font-[500] tracking-[0.1em] text-[color:var(--color-ink)] no-underline opacity-70 transition-opacity hover:opacity-100"
              style={{ fontVariant: "small-caps" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="flex flex-col items-center gap-3 border-t border-[color:var(--color-ink)]/[0.12] py-10 text-center">
        <Sprig variant="footer" />
        <span className="font-serif text-[length:clamp(1.2rem,1.1rem+0.5vw,1.5rem)] font-[300] italic text-[color:var(--color-cornflower)] opacity-60">
          {coupleNames}
        </span>
      </footer>
    </div>
  );
}
