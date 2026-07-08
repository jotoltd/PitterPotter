-- Table for storing database backups created from the admin panel
CREATE TABLE IF NOT EXISTS db_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_db_backups_created_at ON db_backups(created_at DESC);

ALTER TABLE db_backups ENABLE ROW LEVEL SECURITY;

-- Only service role can access backups via edge functions
-- No public access policies
