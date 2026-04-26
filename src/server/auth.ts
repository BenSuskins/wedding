import NextAuth, { type DefaultSession, type NextAuthResult } from "next-auth";
import Credentials from "next-auth/providers/credentials";

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

interface AdminJwtFields {
  adminUserId?: string;
  oidcSub?: string;
}

function buildNextAuth(): NextAuthResult {
  const env = getAuthEnv();

  const providers: Parameters<typeof NextAuth>[0]["providers"] = [];

  if (env.oidcIssuer && env.oidcClientId && env.oidcClientSecret) {
    providers.push({
      id: "oidc",
      name: "SSO",
      type: "oidc",
      issuer: env.oidcIssuer,
      clientId: env.oidcClientId,
      clientSecret: env.oidcClientSecret,
      checks: ["pkce", "state"],
    });
  }

  if (env.adminPassword) {
    const password = env.adminPassword;
    providers.push(
      Credentials({
        id: "credentials",
        credentials: { password: {} },
        authorize(credentials) {
          if (credentials.password !== password) return null;
          return { id: "credentials:admin", name: "Admin" };
        },
      }),
    );
  }

  return NextAuth({
    ...authConfig,
    secret: env.authSecret,
    providers,
    callbacks: {
      ...authConfig.callbacks,
      async jwt({ token, account, profile, user }) {
        if (account?.provider === "credentials" && user) {
          const prisma = getPrismaClient();
          const adminUser = await prisma.adminUser.upsert({
            where: { oidcSub: "credentials:admin" },
            create: { oidcSub: "credentials:admin", email: null, lastSeenAt: new Date() },
            update: { lastSeenAt: new Date() },
          });
          const enriched = token as typeof token & AdminJwtFields;
          enriched.adminUserId = adminUser.id;
          enriched.oidcSub = "credentials:admin";
        } else if (account && profile?.sub) {
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
