-- Add locale column if it doesn't already exist (migration may have partially run)
ALTER TABLE "content_block" ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'en';

-- Drop old unique index BEFORE the UPDATE to avoid duplicate key violations
DROP INDEX IF EXISTS "content_block_key_key";

-- Migrate existing _fr rows: strip suffix and set locale
UPDATE "content_block"
SET "locale" = 'fr',
    "key"    = regexp_replace("key", '_fr$', '')
WHERE "key" LIKE '%_fr';

-- Add composite unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "content_block_key_locale_key" ON "content_block"("key", "locale");
