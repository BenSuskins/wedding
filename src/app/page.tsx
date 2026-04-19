import Image from "next/image";
import Link from "next/link";

import { Countdown } from "@/components/countdown";
import { FaqAccordion } from "@/components/faq-accordion";
import { Sprig } from "@/components/sprig";
import { getContentBlockByKey } from "@/lib/content/content-block";
import { listEvents } from "@/lib/content/event";
import { getSiteSetting } from "@/lib/content/site-setting";
import { parseFaqMarkdown } from "@/lib/parse-faq-markdown";
import { getPrismaClient } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatEventTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  const displayMinutes = minutes === 0 ? "" : `.${String(minutes).padStart(2, "0")}`;
  return `${displayHours}${displayMinutes}\u00a0${ampm}`;
}

function SectionRule({ label }: { label: string }) {
  return (
    <div className="mb-[clamp(3rem,6vw,5rem)] flex items-center gap-6">
      <hr className="flex-1 border-none border-t border-t-[color:var(--color-cornflower)] opacity-35" />
      <h2
        className="whitespace-nowrap font-serif text-[length:clamp(1rem,0.95rem+0.25vw,1.125rem)] font-[500] tracking-[0.14em] text-[color:var(--color-cornflower)]"
        style={{ fontVariant: "small-caps", opacity: 0.7 }}
      >
        {label}
      </h2>
      <hr className="flex-1 border-none border-t border-t-[color:var(--color-cornflower)] opacity-35" />
    </div>
  );
}

export default async function LandingPage() {
  const prisma = getPrismaClient();

  const [
    siteTitleResult,
    weddingDateResult,
    rsvpDeadlineResult,
    heroImageResult,
    ceremonyImageResult,
    receptionImageResult,
    eventsResult,
    introResult,
    travelResult,
    faqResult,
  ] = await Promise.all([
    getSiteSetting(prisma, "site_title"),
    getSiteSetting(prisma, "wedding_date"),
    getSiteSetting(prisma, "rsvp_deadline"),
    getSiteSetting(prisma, "hero_image_path"),
    getSiteSetting(prisma, "ceremony_image_path"),
    getSiteSetting(prisma, "reception_image_path"),
    listEvents(prisma),
    getContentBlockByKey(prisma, "hero"),
    getContentBlockByKey(prisma, "travel"),
    getContentBlockByKey(prisma, "faq"),
  ]);

  const coupleNames = siteTitleResult.isOk() ? siteTitleResult.value.value.title : "Our Wedding";
  const weddingDate = weddingDateResult.isOk() ? new Date(weddingDateResult.value.value.isoDate) : null;
  const rsvpDeadline = rsvpDeadlineResult.isOk() ? new Date(rsvpDeadlineResult.value.value.isoDate) : null;
  const heroImagePath = heroImageResult.isOk() ? heroImageResult.value.value.path : null;
  const ceremonyImagePath = ceremonyImageResult.isOk() ? ceremonyImageResult.value.value.path : null;
  const receptionImagePath = receptionImageResult.isOk() ? receptionImageResult.value.value.path : null;
  const events = eventsResult.isOk() ? eventsResult.value : [];
  const introText = introResult.isOk()
    ? introResult.value.bodyMarkdown
    : "We are so glad you can be with us. This little site holds everything you need to know for the day.";
  const travelText = travelResult.isOk() ? travelResult.value.bodyMarkdown : "";
  const faqMarkdown = faqResult.isOk() ? faqResult.value.bodyMarkdown : "";
  const faqItems = parseFaqMarkdown(faqMarkdown);

  const venues = events.reduce<{ name: string; address: string; mapUrl: string | null; type: string }[]>(
    (acc, event) => {
      if (!acc.find((v) => v.name === event.locationName)) {
        acc.push({
          name: event.locationName,
          address: event.locationAddress,
          mapUrl: event.locationMapUrl,
          type: acc.length === 0 ? "Ceremony" : "Reception",
        });
      }
      return acc;
    },
    [],
  );

  const [firstLine, ...nameParts] = coupleNames.split(/\s*&\s*/);
  const secondName = nameParts.join(" & ");

  const formattedWeddingDate = weddingDate
    ? weddingDate.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const formattedRsvpDeadline = rsvpDeadline
    ? rsvpDeadline.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const travelParagraphs = travelText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      {/* NAV */}
      <nav
        aria-label="Site navigation"
        className="fixed left-0 right-0 top-0 z-[100] flex items-center justify-between px-[clamp(1.5rem,5vw,4rem)] pb-12 pt-5"
        style={{
          background: "linear-gradient(to bottom, rgba(246,241,231,0.96) 0%, rgba(246,241,231,0) 100%)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
        }}
      >
        <Link
          href="#"
          aria-label="Return to top"
          className="font-serif text-[length:clamp(1.2rem,1.1rem+0.5vw,1.5rem)] italic font-[400] tracking-[0.04em] text-[color:var(--color-ink)] no-underline"
        >
          M & B
        </Link>
        <ul className="hidden list-none gap-8 sm:flex">
          {[
            { href: "#the-day", label: "The Day" },
            { href: "#venues", label: "Venues" },
            { href: "#travel", label: "Travel" },
            { href: "#faq", label: "FAQs" },
          ].map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-[length:clamp(0.75rem,0.7rem+0.25vw,0.875rem)] font-[500] tracking-[0.1em] text-[color:var(--color-ink)] no-underline opacity-70 transition-opacity hover:opacity-100"
                style={{ fontVariant: "small-caps" }}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* HERO */}
      <section
        className="landing-hero-grid min-h-[100svh]"
        aria-label="Hero"
      >
        <div
          className="flex flex-col justify-center"
          style={{
            padding:
              "clamp(6rem,12vw,10rem) clamp(1.5rem,5vw,5rem) clamp(4rem,6vw,6rem)",
          }}
        >
          <p
            className="mb-6 text-[length:clamp(0.75rem,0.7rem+0.25vw,0.875rem)] font-[500] tracking-[0.14em] text-[color:var(--color-cornflower)]"
            style={{ fontVariant: "small-caps", opacity: 0.7 }}
          >
            You are warmly invited to celebrate the marriage of
          </p>

          <h1
            className="mb-8 font-serif text-[length:clamp(3.5rem,2.4rem+5vw,7rem)] font-[300] italic leading-[1.05] tracking-[-0.01em] text-[color:var(--color-ink)]"
          >
            {firstLine}
            <em className="block text-[0.55em] not-italic font-[400] tracking-[0.04em] text-[color:var(--color-muted)] my-[0.4em]">
              &amp;
            </em>
            <span style={{ fontSize: "0.92em" }}>{secondName}</span>
          </h1>

          {formattedWeddingDate ? (
            <p
              className="mb-8 text-[length:clamp(1rem,0.95rem+0.25vw,1.125rem)] font-[600] tracking-[0.1em] text-[color:var(--color-peach)]"
              style={{ fontVariant: "small-caps" }}
            >
              <time dateTime={weddingDate?.toISOString()}>{formattedWeddingDate}</time>
            </p>
          ) : null}

          {weddingDate ? (
            <div className="mb-10">
              <Countdown targetIsoDate={weddingDate.toISOString()} />
            </div>
          ) : null}

          {venues.length > 0 ? (
            <p className="text-[length:clamp(0.75rem,0.7rem+0.25vw,0.875rem)] italic leading-[1.5] text-[color:var(--color-muted)]">
              {venues[0]?.name}
              {venues[1] ? (
                <>
                  <br />
                  followed by {venues[1].name}
                </>
              ) : null}
            </p>
          ) : null}

          <div className="mt-10">
            <Sprig variant="hero" />
          </div>
        </div>

        <div className="landing-hero-img-col relative overflow-hidden">
          {heroImagePath ? (
            <div className="relative h-full min-h-[80svh]">
              <Image
                src={heroImagePath}
                alt="Wedding bouquet"
                fill
                className="object-cover object-top"
                priority
              />
            </div>
          ) : (
            <div
              className="h-full min-h-[80svh] w-full"
              style={{ background: "var(--color-paper-mid)" }}
            />
          )}
        </div>
      </section>

      {/* INTRO */}
      <section
        className="py-[clamp(5rem,10vw,9rem)] text-center"
        style={{ background: "oklch(from var(--color-peach) l c h / 0.06)" }}
        aria-label="Introduction"
      >
        <div className="mx-auto max-w-[600px] px-[clamp(1.5rem,5vw,2rem)]">
          <div className="mb-8 flex justify-center">
            <Sprig variant="intro" />
          </div>
          <p
            className="text-[length:clamp(1.2rem,1.1rem+0.5vw,1.5rem)] font-[300] leading-[1.7] text-[color:var(--color-ink)]"
            style={{ textWrap: "pretty" } as React.CSSProperties}
          >
            {introText.replace(/^#+\s*/gm, "").trim()}
          </p>
        </div>
      </section>

      {/* THE DAY */}
      <section
        id="the-day"
        className="py-[clamp(4rem,8vw,8rem)]"
        style={{ background: "var(--color-paper)" }}
        aria-label="Order of the day"
      >
        <div className="mx-auto max-w-[1140px] px-[clamp(1.5rem,5vw,4rem)]">
          <SectionRule label="The Day" />

          <div className="mb-10 flex justify-center">
            <Sprig variant="schedule" />
          </div>

          <ol className="flex flex-col">
            {events.map((event) => (
              <li
                key={event.id}
                className="landing-schedule-item group border-b border-[color:var(--color-ink)]/10 py-10 first:border-t transition-colors hover:bg-[oklch(from_var(--color-peach)_l_c_h_/_0.05)]"
              >
                <div>
                  <h3
                    className="mb-[0.3rem] font-serif text-[length:clamp(1.5rem,1.3rem+1vw,2.1rem)] font-[400] leading-[1.15] transition-colors group-hover:text-[color:var(--color-cornflower)]"
                  >
                    {event.title}
                  </h3>
                  <p className="mb-[0.6rem] text-[length:clamp(1rem,0.95rem+0.25vw,1.125rem)] italic text-[color:var(--color-muted)]">
                    {event.locationName}
                    {event.locationAddress ? `, ${event.locationAddress.split(",")[0]}` : ""}
                  </p>
                  {event.descriptionMarkdown ? (
                    <p className="max-w-[52ch] text-[length:clamp(0.75rem,0.7rem+0.25vw,0.875rem)] leading-[1.6] text-[color:var(--color-muted)]">
                      {event.descriptionMarkdown.replace(/^#+\s*/gm, "").trim()}
                    </p>
                  ) : null}
                </div>

                <div
                  className="w-px self-stretch mt-[0.4rem] opacity-30"
                  style={{ background: "var(--color-cornflower)" }}
                  aria-hidden="true"
                />

                <span
                  className="overflow-hidden break-words text-center text-[length:clamp(1.2rem,1.1rem+0.5vw,1.5rem)] font-[600] italic leading-[1.2] tracking-[0.02em] tabular"
                  style={{
                    color: "var(--color-cornflower)",
                    opacity: 0.85,
                    paddingTop: "0.1em",
                  }}
                >
                  {formatEventTime(event.startsAt)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* VENUES */}
      {venues.length > 0 ? (
        <section
          id="venues"
          className="py-[clamp(4rem,8vw,8rem)]"
          style={{ background: "var(--color-paper-mid)" }}
          aria-label="Venue information"
        >
          <div className="mx-auto max-w-[1140px] px-[clamp(1.5rem,5vw,4rem)]">
            <SectionRule label="The Venues" />

            <div className="mb-12 flex justify-center">
              <Sprig variant="venues" />
            </div>

            <div className="landing-two-col gap-[clamp(2rem,4vw,4rem)] items-start">
              {venues.slice(0, 2).map((venue, i) => {
                const imagePath = i === 0 ? ceremonyImagePath : receptionImagePath;
                return (
                  <article
                    key={venue.name}
                    className={i === 1 ? "landing-venue-offset" : undefined}
                    style={i === 1 ? { marginTop: "clamp(3rem,8vw,7rem)" } : undefined}
                  >
                    {imagePath ? (
                      <div className="relative mb-6 w-full" style={{ aspectRatio: "4/5" }}>
                        <Image
                          src={imagePath}
                          alt={venue.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="mb-6 w-full"
                        style={{ aspectRatio: "4/5", background: "var(--color-paper)" }}
                      />
                    )}
                    <p
                      className="mb-2 text-[length:clamp(0.75rem,0.7rem+0.25vw,0.875rem)] font-[500] tracking-[0.12em] text-[color:var(--color-cornflower)]"
                      style={{ fontVariant: "small-caps" }}
                    >
                      {venue.type}
                    </p>
                    <h3
                      className="mb-2 font-serif text-[length:clamp(1.5rem,1.3rem+1vw,2.1rem)] font-[400] leading-[1.2] transition-colors hover:text-[color:var(--color-cornflower)]"
                    >
                      {venue.name}
                    </h3>
                    <address className="mb-4 text-[length:clamp(0.75rem,0.7rem+0.25vw,0.875rem)] italic leading-[1.6] text-[color:var(--color-muted)] not-italic">
                      {venue.address}
                    </address>
                    {venue.mapUrl ? (
                      <a
                        href={venue.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[length:clamp(0.75rem,0.7rem+0.25vw,0.875rem)] tracking-[0.08em] text-[color:var(--color-peach)] underline underline-offset-[3px] no-underline hover:underline"
                        style={{ fontVariant: "small-caps" }}
                      >
                        View on map →
                      </a>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* TRAVEL */}
      <section
        id="travel"
        className="py-[clamp(5rem,9vw,9rem)]"
        aria-label="Travel and accommodation"
      >
        <div className="mx-auto max-w-[1140px] px-[clamp(1.5rem,5vw,4rem)]">
          <div className="landing-two-col items-center gap-[clamp(3rem,6vw,7rem)]">
            <div className="relative w-full" style={{ aspectRatio: "3/2" }}>
              <Image
                src="/images/country.jpg"
                alt="Essex countryside"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p
                className="mb-5 text-[length:clamp(0.75rem,0.7rem+0.25vw,0.875rem)] font-[500] tracking-[0.14em] text-[color:var(--color-cornflower)]"
                style={{ fontVariant: "small-caps" }}
              >
                Getting Here &amp; Staying Over
              </p>
              <h2
                className="mb-6 font-serif text-[length:clamp(2rem,1.6rem+2vw,3.25rem)] font-[400] leading-[1.15]"
                style={{
                  display: "inline-block",
                  paddingBottom: "0.3em",
                  borderBottom: "2px solid var(--color-peach)",
                  marginBottom: "1.5rem",
                }}
              >
                Travel &amp;<br />Accommodation
              </h2>
              <div className="space-y-4">
                {travelParagraphs.length > 0 ? (
                  travelParagraphs.map((para, i) => (
                    <p
                      key={i}
                      className="max-w-[46ch] text-[length:clamp(1rem,0.95rem+0.25vw,1.125rem)] leading-[1.65] text-[color:var(--color-muted)]"
                      style={{ textWrap: "pretty", whiteSpace: "pre-line" } as React.CSSProperties}
                    >
                      {para.replace(/^#+\s*/gm, "").trim()}
                    </p>
                  ))
                ) : (
                  <p className="max-w-[46ch] text-[length:clamp(1rem,0.95rem+0.25vw,1.125rem)] leading-[1.65] text-[color:var(--color-muted)]">
                    Travel information coming soon.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      {faqItems.length > 0 ? (
        <section
          id="faq"
          className="py-[clamp(4rem,8vw,8rem)]"
          style={{ background: "var(--color-paper-mid)" }}
          aria-label="Frequently asked questions"
        >
          <div className="mx-auto max-w-[1140px] px-[clamp(1.5rem,5vw,4rem)]">
            <SectionRule label="FAQs" />
            <FaqAccordion items={faqItems} />
          </div>
        </section>
      ) : null}

      {/* RSVP CTA */}
      <section
        className="py-[clamp(5rem,10vw,10rem)] text-center"
        style={{ background: "oklch(from var(--color-cornflower) l c h / 0.05)" }}
        aria-label="RSVP"
      >
        <div className="mx-auto max-w-[1140px] px-[clamp(1.5rem,5vw,4rem)]">
          <div className="mb-10 flex justify-center">
            <Sprig variant="rsvp" />
          </div>
          <h2
            className="mb-5 font-serif text-[length:clamp(2.8rem,2rem+3.5vw,5rem)] font-[300] italic leading-[1.1] text-[color:var(--color-ink)]"
          >
            Will you join us?
          </h2>
          {formattedRsvpDeadline ? (
            <p className="mx-auto mb-10 max-w-[42ch] leading-[1.65] text-[color:var(--color-muted)]">
              Please reply by{" "}
              <time dateTime={rsvpDeadline?.toISOString()}>{formattedRsvpDeadline}</time>. Use
              the personal link in your invitation to let us know you are coming.
            </p>
          ) : (
            <p className="mx-auto mb-10 max-w-[42ch] leading-[1.65] text-[color:var(--color-muted)]">
              Use the personal link in your invitation to let us know you are coming.
            </p>
          )}
          <p className="mt-5 text-[length:clamp(0.75rem,0.7rem+0.25vw,0.875rem)] italic text-[color:var(--color-muted)] opacity-70">
            The RSVP form is linked to your invitation. If you have lost your link, please get in
            touch directly.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="flex flex-col items-center gap-3 border-t border-[color:var(--color-ink)]/[0.12] py-10 text-center"
        style={{ padding: "2.5rem clamp(1.5rem,5vw,4rem)" }}
      >
        <Sprig variant="footer" />
        <span
          className="font-serif text-[length:clamp(1.2rem,1.1rem+0.5vw,1.5rem)] font-[300] italic text-[color:var(--color-cornflower)] opacity-60"
        >
          {coupleNames}
        </span>
        {formattedWeddingDate ? (
          <span
            className="text-[length:clamp(0.75rem,0.7rem+0.25vw,0.875rem)] tracking-[0.1em] text-[color:var(--color-muted)]"
            style={{ fontVariant: "small-caps" }}
          >
            <time dateTime={weddingDate?.toISOString()}>{formattedWeddingDate}</time>
          </span>
        ) : null}
      </footer>
    </>
  );
}
