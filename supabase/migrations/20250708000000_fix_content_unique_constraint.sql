-- Fix the content table unique constraint.
-- The admin-content edge function uses (key, page) as the composite identifier,
-- but the original migration only enforced uniqueness on `key`. This caused
-- inserts to fail when a key already existed under a different page.

-- Drop the old single-column unique constraint if it exists.
ALTER TABLE content
  DROP CONSTRAINT IF EXISTS content_key_key;

-- Remove any duplicate rows that would violate the new composite constraint.
-- Keep the row with the earliest created_at / updated_at for each (key, page) pair.
DELETE FROM content a
USING content b
WHERE a.id > b.id
  AND a.key = b.key
  AND a.page = b.page;

-- Add the composite unique constraint.
ALTER TABLE content
  ADD CONSTRAINT content_key_page_unique UNIQUE (key, page);
