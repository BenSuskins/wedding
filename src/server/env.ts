function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getAuthEnv(): {
  authSecret: string;
  oidcIssuer: string;
  oidcClientId: string;
  oidcClientSecret: string;
} {
  return {
    authSecret: requireEnv("AUTH_SECRET"),
    oidcIssuer: requireEnv("OIDC_ISSUER"),
    oidcClientId: requireEnv("OIDC_CLIENT_ID"),
    oidcClientSecret: requireEnv("OIDC_CLIENT_SECRET"),
  };
}

export function getInviteTokenSecret(): string {
  return requireEnv("INVITE_TOKEN_SECRET");
}

export function getPublicBaseUrl(): string {
  return process.env.PUBLIC_BASE_URL ?? "";
}
