-- Add metadata column to content table for storing button hrefs and other extra data
ALTER TABLE content ADD COLUMN IF NOT EXISTS metadata jsonb;
