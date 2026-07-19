# Hero image slideshow (random per page load)

## Goal
Every reload of the landing page shows a different hero image, drawn from a set
of images selected in the admin portal.

## Approach
The landing page is `force-dynamic`, so it renders per request. Picking a random
image server-side means each reload shows a different photo with no client-side
flash or JS.

1. **New site setting** `hero_image_paths` — `{ paths: string[] }` (each path
   1–500 chars, max 20 entries, empty list allowed).
2. **Pure selection helper** `chooseHeroImagePath(slideshowPaths, fallbackPath, random)`
   in `src/lib/content/hero-image.ts`, unit-tested with a deterministic random.
3. **Landing page** fetches `hero_image_paths`; when non-empty picks one at
   random, otherwise falls back to the existing `hero_image_path`.
4. **Admin settings** replaces the single hero picker with a
   `MultiImagePickerForm`: library thumbnails toggle in/out of the set, upload
   appends, manual path entry, selected strip with remove buttons. Prefills from
   the old `hero_image_path` when the new setting is unset.
5. **Server action** `buildValue` gains a `hero_image_paths` case reading
   `formData.getAll(...)`.
6. **Tests**: unit test for the chooser; contract round-trip for the new key.

## Compatibility
`hero_image_path` stays as the fallback — no data migration needed.
