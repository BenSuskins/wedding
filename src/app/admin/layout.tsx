import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { auth, signOut } from "@/server/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/sign-in");
  }

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
              {session.user.email ?? session.user.name ?? session.user.oidcSub ?? "Admin"}
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
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
