import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { auth, signOut } from "@/server/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const adminNav: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/invites", label: "Invites" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/theme", label: "Theme" },
  { href: "/admin/export", label: "Export" },
];

export default async function AdminAuthedLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/sign-in");
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-[color:var(--color-paper)] text-[color:var(--color-ink)]">
      <header className="flex items-center justify-between border-b border-[color:var(--color-ink)]/10 px-6 py-4">
        <h1 className="font-serif text-xl">Wedding admin</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[color:var(--color-muted)]">
              {user.email ?? user.name ?? user.oidcSub ?? "Admin"}
            </span>
            <button
              type="submit"
              className="rounded border border-[color:var(--color-ink)]/20 px-3 py-1 hover:bg-[color:var(--color-ink)]/5"
            >
              Sign out
            </button>
          </div>
        </form>
      </header>
      <nav className="border-b border-[color:var(--color-ink)]/10 px-6">
        <ul className="flex gap-6 text-sm">
          {adminNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-block py-3 uppercase tracking-[0.2em] text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
