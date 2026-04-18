# Design Principles

Two surfaces, two design languages: the **public site** is editorial with a countryside/wildflower mood (guest-facing, photography-forward, warm), and the **admin UI** is utilitarian (fast CRUD, high-density). Both answer to the same core principles below.

## Mood

Quoting the florist's brief verbatim: **"wild, rustic and romantic. Bouquets have movement and allow for space. Varied stem varieties including greenery."** That line is the north star for the entire public site — not just the flowers.

Real stems in use (from the supplier moodboard at `moodboard.pdf`): garden rose, ranunculus, sea holly / eryngium, cornflower, gypsophila (baby's breath), dahlia, daisy, chamomile, eucalyptus greenery. The arrangements are **gathered-meadow** style — varied stems, breathing room between them, tied with satin ribbon.

Mood brief from the same document: **"a mix of colours including blue and orange notes throughout to create a vibrant scheme."** So the palette is not monotone-green cottagecore; it is a warm cream ground with blue, orange/peach, and lavender flower notes sitting in it.

The rules that keep this elegant rather than twee:

- **Simplicity before decoration.** If removing an ornament does not hurt the page, it should not be there. Translate "movement and space" into layout whitespace.
- **Varied stems, not a wreath.** Botanical line art may include a *small mixed sprig* (rose + cornflower + eucalyptus, say), loose and asymmetrical. Never a full wreath, garland, or symmetrical frame.
- **Naturalistic, not sugary.** Desaturated field-flower pastels are welcome. Saturated Easter-egg candy colours, neon, or pink-washed hues are not.
- **No folk-art signifiers.** No bunting, chalkboard lettering, burlap-and-lace, "Mr & Mrs" script, fairy-light overlays, or farmhouse-chic slogans.
- **Photography does the heavy lifting.** Gathered-meadow bouquets, stems-on-linen flat lays, hands-holding-bouquet, and wide countryside shots are the mood-setters. Line-art illustration stays subordinate.

## Shared principles

1. **Content first, chrome last.** Nothing decorative earns screen space. Every element has a job.
2. **Mobile-first.** Most guests RSVP on a phone. Any design that does not feel right at 375px wide is not right.
3. **Accessibility is non-negotiable.** WCAG 2.1 AA minimum. Semantic HTML, keyboard navigable, visible focus states, `prefers-reduced-motion` respected, 4.5:1 contrast for body text.
4. **Durability over trend.** No glassmorphism, neo-brutalism, bento grids, rainbow gradients, or auto-rotating carousels. Serif headings and disciplined whitespace age well.
5. **Fast by default.** No client-side JS for static content. Target LCP < 2.5s on simulated 4G, CLS < 0.1.
6. **Write like a human.** Copy is in second person ("you", "your"). Warm but restrained. Dates spelled in full (`Saturday 12 July 2026`).

## Public site

### Aesthetic
Elegant / editorial anchored in the florist's gathered-meadow bouquet style — **wild, rustic, romantic, with movement and space**. Reference points: letterpress wedding stationery, a Toast catalogue, Kinfolk's pastoral issues, a well-made botanical field guide. Serif display type, generous whitespace, meadow photography, varied-stem line-art ornament, and minimal interactive chrome.

### Typography
- **Display / headings**: old-style serif with a touch of warmth — Cormorant Garamond, EB Garamond, or Domaine Display. Italic is permitted for the couple's names and single-word section openers; not for body text.
- **Body**: one serif family throughout for a truly editorial, printed feel. Fall back to a warm humanist sans (Inter) only if serif body becomes fatiguing on mobile. Pick one rule and hold it.
- **Small caps**: use sparingly for labels (e.g. `THE CEREMONY`, `THE DAY`) — they fit the field-guide mood and stop short of cutesy script lettering.
- **Scale**: fluid `clamp()` scale, 1.333 ratio on mobile, 1.414 on desktop.
- **Line length**: 60–72 characters. Line height 1.55–1.75 for body, 1.1–1.25 for display.
- **Numbers**: `font-variant-numeric: tabular-nums` for all times, dates, and numeric data.
- **No script fonts.** No hand-drawn cursive, no "wedding script" display faces — they cross the line into twee.

### Colour

The palette is lifted directly from the florist's bouquets: a warm cream paper ground carrying **blue and orange notes with lavender and eucalyptus**. It is intentionally **vibrant-but-naturalistic** — these are field-flower colours seen in midday light, not saturated primaries and not sugar pastels. Exact hex values are ratified in Phase 6; the roles are fixed now.

| Role | Swatch reference | Use |
|---|---|---|
| Background | soft cream / ecru, e.g. `#F6F1E7` | Paper, not screen. Every public page. |
| Ink | deep walnut brown, e.g. `#2B241B` | Body and display text. Never pure black. |
| Muted | warm taupe | Secondary text, metadata. |
| Primary accent | **cornflower blue** | Links, key CTAs, hairline dividers. Echoes the sea holly / cornflower stems. |
| Warm accent | **soft peach / coral** | Section anchors, RSVP confirmations, small moments of warmth. |
| Soft accent | **lavender** | Sparingly — one small detail per page maximum. |
| Greenery | **eucalyptus / sage** | Line-art illustration stems only, not UI. |

Rules:
- Cornflower blue and peach should never fight. If both appear in a composition, the blue leads and the peach is a single highlight, or vice versa.
- Lavender is a seasoning, not a main ingredient.
- Naturalistic pastels are allowed (that is what wildflowers are). Saturated candy colours, neon, gradients, and gold foil are not.
- No pure black. No drop shadows beyond a whisper under the hero photo.

### Layout
- Long-form vertical scroll. One idea per viewport section.
- 12-column grid on desktop; single column on mobile.
- Favour asymmetry: offset photos, margin notes, pull quotes. Avoid grids-of-cards.
- Horizontal rules are hairlines in the accent colour.

### Imagery
- Photography is the visual backbone. Every public page has a hero photo.
- Subject preferences (in order): gathered-meadow bouquets in hand, stems-on-linen flat lays, wide countryside/meadow, venue detail.
- Editorially chosen, not stock. Placeholder during development is a warm cream-on-cream duotone, never a grey box.
- Aspect ratios: 3:2 or 4:5. Avoid 16:9 (too cinematic-TV).
- `alt` text is always meaningful and specific ("gathered bouquet of garden roses, cornflowers and eucalyptus tied with satin ribbon"). Decorative-only images use `alt=""`.
- All images via Next.js `<Image>` with explicit dimensions.

### Botanical ornament (line art)
- One loose hand-drawn sprig per major section at most. A sprig is 2–4 stems: rose or ranunculus + cornflower + a blade of eucalyptus, arranged asymmetrically.
- Stroke in the accent colour, ~1–1.5px equivalent weight, never filled.
- Never a wreath, garland, corner bracket, or symmetrical frame.
- Sized smaller than body type — think marginalia, not decoration.

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
- Not sugar-candy / Easter-egg pastels or Instagram-filter gradients
- Not a card-grid-of-features SaaS landing page
- Not a full-bleed auto-rotating carousel
- Not AI-generated illustrations
- Not bunting, fairy lights, chalkboards, burlap-and-lace, or any farmhouse-chic signifier
- Not wreaths, garlands, or symmetrical botanical frames

## Decision log

Design decisions live here as they are made, newest first. Reference this before changing established patterns.

- **2026-04-18** — Palette and mood re-anchored to the florist's moodboard (`moodboard.pdf`). Mood brief adopted verbatim: "wild, rustic and romantic — movement and space". Palette: cream ground with cornflower blue (primary), soft peach (warm), lavender (seasoning), eucalyptus (greenery in line art). Naturalistic pastels explicitly allowed; sugar-candy pastels explicitly forbidden.
- **2026-04-18** — Initial principles ratified. Editorial aesthetic for public site; shadcn-utilitarian for admin. Exact font pair and hex values to be ratified during Phase 6 (editorial polish), not Phase 1.
