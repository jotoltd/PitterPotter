-- Create short_urls table (for collection-ready short links)
-- This table was originally created manually; this migration ensures reproducibility.

CREATE TABLE IF NOT EXISTS public.short_urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code text NOT NULL UNIQUE,
  target_url text NOT NULL,
  booking_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.short_urls ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read short_urls (needed for redirect lookups)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Anyone can read short_urls' AND polrelid = 'public.short_urls'::regclass
  ) THEN
    CREATE POLICY "Anyone can read short_urls" ON public.short_urls FOR SELECT USING (true);
  END IF;
END $$;
