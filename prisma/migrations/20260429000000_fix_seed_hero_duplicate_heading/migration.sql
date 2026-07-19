-- The hero content block was seeded with a "# Our Wedding" markdown heading, which
-- duplicated the page's own <h1> (site_title) once headers started rendering as real
-- heading elements instead of being stripped to plain text. Drop the redundant heading
-- from the still-unedited default seed; admin-authored content is left untouched.
UPDATE content_block
SET "bodyMarkdown" = 'More details soon.'
WHERE id = 'seed_hero'
  AND "bodyMarkdown" = '# Our Wedding' || E'\n\nMore details soon.';
