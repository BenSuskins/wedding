export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-prose flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
        Save the Date
      </p>
      <h1 className="text-5xl font-light leading-tight sm:text-6xl">
        Our Wedding
      </h1>
      <p className="max-w-md text-lg leading-relaxed text-[color:var(--color-muted)]">
        Details are being gathered. Come back soon.
      </p>
    </main>
  );
}
