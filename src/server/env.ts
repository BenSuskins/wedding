function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getAuthEnv(): {
  authSecret: string;
  oidcIssuer: string | null;
  oidcClientId: string | null;
  oidcClientSecret: string | null;
  adminPassword: string | null;
} {
  return {
    authSecret: requireEnv("AUTH_SECRET"),
    oidcIssuer: process.env.OIDC_ISSUER ?? null,
    oidcClientId: process.env.OIDC_CLIENT_ID ?? null,
    oidcClientSecret: process.env.OIDC_CLIENT_SECRET ?? null,
    adminPassword: process.env.ADMIN_PASSWORD ?? null,
  };
}

export function getInviteTokenSecret(): string {
  return requireEnv("INVITE_TOKEN_SECRET");
}

export function getPublicBaseUrl(): string {
  return process.env.PUBLIC_BASE_URL ?? "";
}
