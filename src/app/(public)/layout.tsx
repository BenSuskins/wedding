import Link from "next/link";
import type { ReactNode } from "react";

import { getPrismaClient } from "@/server/db";
import { getSiteSetting } from "@/lib/content/site-setting";

export const runtime = "nodejs";

async function resolveSiteTitle(): Promise<string> {
  try {
    const result = await getSiteSetting(getPrismaClient(), "site_title");
    if (result.isOk()) return result.value.value.title;
  } catch {
    // DB unavailable — fall through to default. Public site stays up during incidents.
  }
  return "Our Wedding";
}

const navLinks: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/schedule", label: "Schedule" },
  { href: "/travel", label: "Travel" },
  { href: "/faq", label: "FAQ" },
  { href: "/gifts", label: "Gifts" },
];

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const siteTitle = await resolveSiteTitle();

  return (
    <div className="min-h-screen bg-[color:var(--color-paper)] text-[color:var(--color-ink)]">
      <header className="border-b border-[color:var(--color-ink)]/10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-6 sm:flex-row sm:justify-between">
          <Link
            href="/"
            className="font-serif text-2xl tracking-wide hover:text-[color:var(--color-cornflower)]"
          >
            {siteTitle}
          </Link>
          <nav className="flex gap-6 text-xs uppercase tracking-[0.25em] text-[color:var(--color-muted)]">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-[color:var(--color-ink)]">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-24 border-t border-[color:var(--color-ink)]/10 py-8 text-center text-xs uppercase tracking-[0.25em] text-[color:var(--color-muted)]">
        Made with care
      </footer>
    </div>
  );
}
