import NextAuth, { type DefaultSession, type NextAuthResult } from "next-auth";

import { authConfig } from "@/server/auth.config";
import { getPrismaClient } from "@/server/db";
import { getAuthEnv } from "@/server/env";

declare module "next-auth" {
  interface Session {
    user: {
      adminUserId: string;
      oidcSub: string;
    } & DefaultSession["user"];
  }
}

// Authorisation is delegated to Authelia: anyone the IdP lets sign in is a
// valid admin. We mirror the `sub` into AdminUser purely so audit-log rows
// can reference a stable local id. JWT fields are set/read through narrow
// casts because pnpm's hoisting makes @auth/core/jwt unresolvable for
// TypeScript module augmentation.

interface AdminJwtFields {
  adminUserId?: string;
  oidcSub?: string;
}

function buildNextAuth(): NextAuthResult {
  const env = getAuthEnv();
  return NextAuth({
    ...authConfig,
    secret: env.authSecret,
    providers: [
      {
        id: "authelia",
        name: "Authelia",
        type: "oidc",
        issuer: env.oidcIssuer,
        clientId: env.oidcClientId,
        clientSecret: env.oidcClientSecret,
        checks: ["pkce", "state"],
      },
    ],
    callbacks: {
      ...authConfig.callbacks,
      async jwt({ token, account, profile }) {
        if (account && profile?.sub) {
          const prisma = getPrismaClient();
          const email = typeof profile.email === "string" ? profile.email : null;
          const adminUser = await prisma.adminUser.upsert({
            where: { oidcSub: profile.sub },
            create: {
              oidcSub: profile.sub,
              email,
              lastSeenAt: new Date(),
            },
            update: {
              email,
              lastSeenAt: new Date(),
            },
          });
          const enriched = token as typeof token & AdminJwtFields;
          enriched.adminUserId = adminUser.id;
          enriched.oidcSub = profile.sub;
          if (email) enriched.email = email;
          if (typeof profile.name === "string") enriched.name = profile.name;
        }
        return token;
      },
      async session({ session, token }) {
        const enriched = token as typeof token & AdminJwtFields;
        if (enriched.adminUserId) session.user.adminUserId = enriched.adminUserId;
        if (enriched.oidcSub) session.user.oidcSub = enriched.oidcSub;
        return session;
      },
    },
  });
}

// Lazy singleton — Next.js page-data collection at build time imports this
// module before env vars are available; deferring construction means the
// env check happens on first request instead.
let cached: NextAuthResult | undefined;
function getNextAuth(): NextAuthResult {
  if (!cached) cached = buildNextAuth();
  return cached;
}

export const handlers: NextAuthResult["handlers"] = {
  GET: (req) => getNextAuth().handlers.GET(req),
  POST: (req) => getNextAuth().handlers.POST(req),
};

export const auth: NextAuthResult["auth"] = ((...args: unknown[]) =>
  // @ts-expect-error — NextAuthResult["auth"] is an overloaded callable; we forward args verbatim.
  getNextAuth().auth(...args)) as NextAuthResult["auth"];

export const signIn: NextAuthResult["signIn"] = ((...args: unknown[]) =>
  // @ts-expect-error — see auth above.
  getNextAuth().signIn(...args)) as NextAuthResult["signIn"];

export const signOut: NextAuthResult["signOut"] = ((...args: unknown[]) =>
  // @ts-expect-error — see auth above.
  getNextAuth().signOut(...args)) as NextAuthResult["signOut"];
