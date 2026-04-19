import { auth } from "@/server/auth";

export interface AdminIdentity {
  adminUserId: string;
  oidcSub: string;
  label: string;
}

export async function requireAdminIdentity(): Promise<AdminIdentity> {
  const session = await auth();
  if (!session?.user?.adminUserId) {
    throw new Error("Admin identity required but no session is active");
  }
  const label =
    session.user.email ?? session.user.name ?? session.user.oidcSub ?? session.user.adminUserId;
  return {
    adminUserId: session.user.adminUserId,
    oidcSub: session.user.oidcSub,
    label,
  };
}
