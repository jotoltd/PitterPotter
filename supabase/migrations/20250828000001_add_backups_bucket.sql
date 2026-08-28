-- Create backups storage bucket for automated CSV backups
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- Allow service role to read/write backup files
CREATE POLICY "Service role full access to backups"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'backups')
  WITH CHECK (bucket_id = 'backups');
