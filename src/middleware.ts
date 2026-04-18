import NextAuth from "next-auth";

import { authConfig } from "@/server/auth.config";

// Edge-runtime middleware: only uses the edge-safe config. The richer
// Node-runtime config (Prisma upsert, etc.) lives in src/server/auth.ts and
// is loaded lazily by the API route handlers.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/admin/:path*"],
};

export default middleware;
