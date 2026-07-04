-- Add allowed_studios column to staff table
-- null = access to all studios (super admin behaviour)
-- ['Putney'] = Putney only, ['Wimbledon'] = Wimbledon only, ['Putney','Wimbledon'] = both (same as null)
ALTER TABLE staff ADD COLUMN IF NOT EXISTS allowed_studios TEXT[];
