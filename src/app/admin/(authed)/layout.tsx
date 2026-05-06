import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getSiteSetting } from "@/lib/content/site-setting";
import { auth, signOut } from "@/server/auth";
import { getPrismaClient } from "@/server/db";

import { AdminSidebar } from "./admin-sidebar";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminAuthedLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/sign-in");
  }

  const user = session.user;
  const prisma = getPrismaClient();

  const [logoTextResult, siteTitleResult] = await Promise.all([
    getSiteSetting(prisma, "logo_text"),
    getSiteSetting(prisma, "site_title"),
  ]);

  const logoText =
    logoTextResult.isOk()
      ? logoTextResult.value.value.text
      : siteTitleResult.isOk()
        ? siteTitleResult.value.value.title
        : "Wedding Admin";

  const displayName = user.email ?? user.name ?? user.oidcSub ?? "Admin";

  const footer = (
    <div className="space-y-2">
      <p className="truncate text-xs text-[color:var(--color-muted)]">{displayName}</p>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] transition-colors"
        >
          Sign out
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[color:var(--color-paper)] text-[color:var(--color-ink)]">
      <AdminSidebar logoText={logoText} footer={footer} />
      <main className="flex-1 overflow-auto px-4 py-6 pt-[57px] md:px-8 md:py-8 md:pt-8">{children}</main>
    </div>
  );
}
