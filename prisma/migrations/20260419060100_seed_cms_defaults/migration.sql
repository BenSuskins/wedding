-- Idempotent seed of the minimum CMS content needed for the public site to render.
-- ON CONFLICT DO NOTHING preserves any admin edits on re-deploy.

INSERT INTO content_block (id, key, title, "bodyMarkdown", "updatedAt")
VALUES
  ('seed_hero',       'hero',       'Hero',       '# Our Wedding' || E'\n\nMore details soon.', NOW()),
  ('seed_travel',     'travel',     'Travel',     '## Getting there' || E'\n\nDetails coming soon.', NOW()),
  ('seed_faq',        'faq',        'FAQ',        '## Frequently asked' || E'\n\n**What should I wear?**' || E'\n\nDetails coming soon.', NOW()),
  ('seed_gifts',      'gifts',      'Gifts',      '## Gifts' || E'\n\nYour presence is our present.', NOW()),
  ('seed_dress_code', 'dress_code', 'Dress code', '## Dress code' || E'\n\nDetails coming soon.', NOW())
ON CONFLICT (key) DO NOTHING;

INSERT INTO site_setting (key, "valueJson", "updatedAt")
VALUES
  ('site_title', '{"title":"Our Wedding"}'::jsonb, NOW())
ON CONFLICT (key) DO NOTHING;
