-- Add locale column with default 'en'
ALTER TABLE "content_block" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';

-- Migrate existing _fr rows: strip suffix and set locale
UPDATE "content_block"
SET "locale" = 'fr',
    "key"    = regexp_replace("key", '_fr$', '')
WHERE "key" LIKE '%_fr';

-- Drop old unique index on key alone
DROP INDEX "content_block_key_key";

-- Add composite unique constraint
CREATE UNIQUE INDEX "content_block_key_locale_key" ON "content_block"("key", "locale");
