"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
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

function SidebarNav({
  logoText,
  footer,
  onNavClick,
}: {
  logoText: string;
  footer: ReactNode;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const isDashboard = pathname === "/admin";

  return (
    <>
      <div className="border-b border-[color:var(--color-ink)]/10 px-4 py-5">
        <Link
          href="/admin"
          onClick={onNavClick}
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
              onClick={onNavClick}
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
              <NavLink key={item.href} href={item.href} label={item.label} onClick={onNavClick} />
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-1.5 px-3 text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-muted)]/60">
            Site
          </p>
          <ul className="space-y-0.5">
            {SITE_NAV.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} onClick={onNavClick} />
            ))}
          </ul>
        </div>
      </nav>

      <div className="border-t border-[color:var(--color-ink)]/10 px-4 py-4">{footer}</div>
    </>
  );
}

export function AdminSidebar({
  logoText,
  footer,
}: {
  logoText: string;
  footer: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between border-b border-[color:var(--color-ink)]/10 bg-[color:var(--color-paper)] px-4 py-3">
        <Link
          href="/admin"
          className="font-serif text-lg italic font-[400] text-[color:var(--color-ink)] no-underline"
        >
          {logoText}
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] transition-colors"
          aria-label="Open navigation"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="2" y1="4.5" x2="16" y2="4.5" />
            <line x1="2" y1="9" x2="16" y2="9" />
            <line x1="2" y1="13.5" x2="16" y2="13.5" />
          </svg>
        </button>
      </div>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[color:var(--color-paper)] shadow-lg transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-end border-b border-[color:var(--color-ink)]/10 px-4 py-3">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] transition-colors"
            aria-label="Close navigation"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="1" y1="1" x2="13" y2="13" />
              <line x1="13" y1="1" x2="1" y2="13" />
            </svg>
          </button>
        </div>
        <SidebarNav logoText={logoText} footer={footer} onNavClick={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-[color:var(--color-ink)]/10">
        <SidebarNav logoText={logoText} footer={footer} />
      </aside>
    </>
  );
}
