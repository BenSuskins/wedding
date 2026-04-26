import { signIn } from "@/server/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const hasOidc = !!(
  process.env.OIDC_ISSUER &&
  process.env.OIDC_CLIENT_ID &&
  process.env.OIDC_CLIENT_SECRET
);
const hasPassword = !!process.env.ADMIN_PASSWORD;

export default function AdminSignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-serif text-3xl">Admin sign-in</h1>

      {hasOidc && (
        <form
          action={async () => {
            "use server";
            await signIn("oidc", { redirectTo: "/admin" });
          }}
        >
          <button
            type="submit"
            className="rounded border border-[color:var(--color-ink)]/30 px-6 py-3 text-sm uppercase tracking-[0.2em] hover:bg-[color:var(--color-ink)]/5"
          >
            Continue with SSO
          </button>
        </form>
      )}

      {hasPassword && (
        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("credentials", {
              password: formData.get("password"),
              redirectTo: "/admin",
            });
          }}
          className="flex w-full flex-col gap-3"
        >
          <input
            type="password"
            name="password"
            placeholder="Admin password"
            required
            className="w-full rounded border border-[color:var(--color-ink)]/20 bg-white px-4 py-2 text-center"
          />
          <button
            type="submit"
            className="rounded border border-[color:var(--color-ink)]/30 px-6 py-3 text-sm uppercase tracking-[0.2em] hover:bg-[color:var(--color-ink)]/5"
          >
            Sign in
          </button>
        </form>
      )}

      {!hasOidc && !hasPassword && (
        <p className="text-[color:var(--color-muted)]">
          No authentication method configured. Set{" "}
          <code className="text-sm">ADMIN_PASSWORD</code> or OIDC environment variables.
        </p>
      )}
    </main>
  );
}
