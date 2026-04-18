import type { NextAuthConfig } from "next-auth";

// Edge-safe subset of the Auth.js config. Used by src/middleware.ts which
// runs on the Edge runtime and must not import Prisma or other Node-only
// modules. The `jwt` callback here is intentionally trivial; the richer
// version (Prisma upsert of AdminUser, lastSeenAt, etc.) lives in auth.ts
// and runs only in the Node-runtime API route during sign-in.

export const authConfig: NextAuthConfig = {
  providers: [],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/sign-in",
  },
  callbacks: {
    authorized({ request, auth }) {
      const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
      const isSignInPage = request.nextUrl.pathname === "/admin/sign-in";
      if (!isAdminRoute || isSignInPage) return true;
      return !!auth;
    },
  },
};
