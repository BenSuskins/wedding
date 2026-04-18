import { signIn } from "@/server/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function AdminSignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="font-serif text-3xl">Admin sign-in</h1>
      <p className="mt-2 text-[color:var(--color-muted)]">
        Continue with your Authelia account to manage content and RSVPs.
      </p>
      <form
        action={async () => {
          "use server";
          await signIn("authelia", { redirectTo: "/admin" });
        }}
        className="mt-8"
      >
        <button
          type="submit"
          className="rounded border border-[color:var(--color-ink)]/30 px-6 py-3 text-sm uppercase tracking-[0.2em] hover:bg-[color:var(--color-ink)]/5"
        >
          Continue with Authelia
        </button>
      </form>
    </main>
  );
}
