"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const GUEST_NAV = [
  { href: "/admin/invites", label: "Invites" },
  { href: "/admin/dietary", label: "Dietary & Songs" },
  { href: "/admin/export", label: "Export" },
] as const;

const SITE_NAV = [
  { href: "/admin/content", label: "Content" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/theme", label: "Theme" },
] as const;

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  return (
    <li>
      <Link
        href={href}
        className={`block rounded px-3 py-1.5 text-sm transition-colors ${
          isActive
            ? "bg-[color:var(--color-ink)]/10 font-[500] text-[color:var(--color-ink)]"
            : "text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
        }`}
      >
        {label}
      </Link>
    </li>
  );
}

export function AdminSidebar({
  logoText,
  footer,
}: {
  logoText: string;
  footer: ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname === "/admin";

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-[color:var(--color-ink)]/10">
      <div className="border-b border-[color:var(--color-ink)]/10 px-4 py-5">
        <Link
          href="/admin"
          className="font-serif text-lg italic font-[400] text-[color:var(--color-ink)] no-underline transition-colors hover:text-[color:var(--color-cornflower)]"
        >
          {logoText}
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-2 py-4">
        <ul>
          <li>
            <Link
              href="/admin"
              className={`block rounded px-3 py-1.5 text-sm transition-colors ${
                isDashboard
                  ? "bg-[color:var(--color-ink)]/10 font-[500] text-[color:var(--color-ink)]"
                  : "text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
              }`}
            >
              Dashboard
            </Link>
          </li>
        </ul>

        <div>
          <p className="mb-1.5 px-3 text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-muted)]/60">
            Guests
          </p>
          <ul className="space-y-0.5">
            {GUEST_NAV.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-1.5 px-3 text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-muted)]/60">
            Site
          </p>
          <ul className="space-y-0.5">
            {SITE_NAV.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </ul>
        </div>
      </nav>

      <div className="border-t border-[color:var(--color-ink)]/10 px-4 py-4">
        {footer}
      </div>
    </aside>
  );
}
