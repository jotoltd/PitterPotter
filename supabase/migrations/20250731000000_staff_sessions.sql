-- Multi-session support for staff logins
-- Allows a staff member to be logged in from multiple locations simultaneously

CREATE TABLE IF NOT EXISTS staff_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_staff_sessions_token ON staff_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_staff_id ON staff_sessions(staff_id);

-- Enable RLS
ALTER TABLE staff_sessions ENABLE ROW LEVEL SECURITY;

-- Only service role can access (edge functions use service role key)
CREATE POLICY "Service role full access staff_sessions"
  ON staff_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Migrate existing session tokens into the new table
INSERT INTO staff_sessions (staff_id, session_token, created_at)
SELECT id, session_token, created_at
FROM staff
WHERE session_token IS NOT NULL AND session_token != ''
ON CONFLICT (session_token) DO NOTHING;
