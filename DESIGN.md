# Design Principles

Two surfaces, two design languages: the **public site** is editorial (guest-facing, photography-forward, warm), and the **admin UI** is utilitarian (fast CRUD, high-density). Both answer to the same core principles below.

## Shared principles

1. **Content first, chrome last.** Nothing decorative earns screen space. Every element has a job.
2. **Mobile-first.** Most guests RSVP on a phone. Any design that does not feel right at 375px wide is not right.
3. **Accessibility is non-negotiable.** WCAG 2.1 AA minimum. Semantic HTML, keyboard navigable, visible focus states, `prefers-reduced-motion` respected, 4.5:1 contrast for body text.
4. **Durability over trend.** No glassmorphism, neo-brutalism, bento grids, rainbow gradients, or auto-rotating carousels. Serif headings and disciplined whitespace age well.
5. **Fast by default.** No client-side JS for static content. Target LCP < 2.5s on simulated 4G, CLS < 0.1.
6. **Write like a human.** Copy is in second person ("you", "your"). Warm but restrained. Dates spelled in full (`Saturday 12 July 2026`).

## Public site

### Aesthetic
Elegant / editorial. Reference points: printed wedding stationery, a well-designed travel magazine, Kinfolk. Serif display type, generous whitespace, large photography, minimal interactive chrome.

### Typography
- **Display / headings**: old-style or transitional serif (Cormorant Garamond, EB Garamond, or Libre Caslon). Italic variants reserved for romantic accents, not for body text.
- **Body**: one serif family throughout for a truly editorial feel; fall back to a warm humanist sans (Inter) only if serif body becomes fatiguing on mobile. Pick one rule and hold it.
- **Scale**: fluid `clamp()` scale, 1.333 ratio on mobile, 1.414 on desktop.
- **Line length**: 60–72 characters. Line height 1.55–1.75 for body, 1.1–1.25 for display.
- **Numbers**: `font-variant-numeric: tabular-nums` for all times, dates, and numeric data.

### Colour
- **Background**: warm off-white, e.g. `#FAF7F2`.
- **Ink**: near-black charcoal, e.g. `#1F1B16`. Never pure black on cream.
- **Muted**: warm grey for secondary text.
- **Accent**: one restrained accent only — sage, olive, muted terracotta, or aged gold. Used for links, key CTAs, and hairline dividers. Pick and commit.
- No gradients. No drop shadows, with a possible whisper of one on the hero photo if it needs lift.

### Layout
- Long-form vertical scroll. One idea per viewport section.
- 12-column grid on desktop; single column on mobile.
- Favour asymmetry: offset photos, margin notes, pull quotes. Avoid grids-of-cards.
- Horizontal rules are hairlines in the accent colour.

### Imagery
- Photography is the visual backbone. Every public page has a hero photo.
- Aspect ratios: 3:2 or 4:5. Avoid 16:9 (too cinematic-TV).
- Editorially chosen, not stock. The placeholder during development is a warm duotone, never a grey box.
- `alt` text is always meaningful and specific. Decorative-only images use `alt=""`.
- All images via Next.js `<Image>` with explicit dimensions.

### Motion
- Subtle fade/translate on paint (150–250ms). That is the motion budget.
- No parallax. No scroll-jacking. No autoplaying video.
- `prefers-reduced-motion: reduce` disables all transitions.

### Voice and copy
- Second person, warm, restrained.
- Full sentences, not bullet-point blurbs.
- Dates written out. Times in 12-hour with `am`/`pm`.

### Core components (public)
- **Hero** — full-viewport photo, couple names, date. Nothing else above the fold.
- **Schedule item** — event title (serif), time (tabular), venue (italic), short description. Chronological list, not cards.
- **Venue** — photo + name + address + link out to a map. No embedded iframes (weight + tracking).
- **FAQ** — progressive disclosure accordion; expanded by default on desktop.
- **RSVP entry point** — never in the public nav. Guests reach it only via their invite link.

## Admin UI

### Aesthetic
Utilitarian. Fast. Plain. Built on shadcn/ui defaults with minimal customisation. No marketing polish, no illustrations, no animation beyond necessary feedback.

### Principles
- **Density without clutter.** Tables show a lot; typography stays readable.
- **Keyboard-first.** Every CRUD action is reachable without a mouse. `cmd/ctrl+enter` submits forms.
- **Destructive actions confirm.** Deleting a guest, rotating a token, overwriting a RSVP all prompt explicitly.
- **Always-visible status.** Dashboard shows RSVP totals and days-to-deadline at all times.
- **No surprises.** Save is explicit; there is no autosave that can silently damage data.

### Typography & colour
- Inter, 14–16px base.
- System light mode. Dark mode only if automatic via `prefers-color-scheme`, and only as a stretch.
- Status colours: success green, warning amber, danger red. Muted, not saturated.

### Core components (admin)
- shadcn/ui: Button, Input, Select, Checkbox, Dialog, DropdownMenu, Toast, Table, Tabs, Badge.
- Tables: sortable columns, sticky header, per-row action menu, inline filters on list pages.
- Forms: label above input, helper text below, inline validation, preserve entered values on failed submit.
- Empty states: one sentence + one primary action. No illustrations.

## Accessibility checklist (applied to every change)

- [ ] Semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<button>` (never `<div onClick>`)
- [ ] Every interactive element is reachable via Tab and actionable via Enter/Space
- [ ] Visible focus ring (never `outline: none` without a replacement)
- [ ] Colour contrast ≥ 4.5:1 body, 3:1 large text and UI
- [ ] Form inputs have associated `<label>`
- [ ] Images have meaningful `alt`; decorative-only images use `alt=""`
- [ ] Public site remains usable without JS (RSVP may require JS, but say so)
- [ ] `prefers-reduced-motion` honoured for all transitions

## Performance budget

- LCP < 2.5s on simulated 4G
- CLS < 0.1
- Public-page JS < 100KB gzipped
- No third-party scripts on the public site (no analytics, no CDN fonts if self-hosted fonts suffice)
- All images explicitly sized; fonts preloaded

## What this design is NOT

- Not dark-on-black goth wedding
- Not "hero video with slow zoom"
- Not Instagram-filter pastel gradients
- Not a card-grid-of-features SaaS landing page
- Not a full-bleed auto-rotating carousel
- Not AI-generated illustrations

## Decision log

Design decisions live here as they are made, newest first. Reference this before changing established patterns.

- **2026-04-18** — Initial principles ratified. Editorial aesthetic for public site; shadcn-utilitarian for admin. Accent colour and exact font pair to be chosen during Phase 6 (editorial polish), not Phase 1.
