-- Resource-based table allocation for Pitter Potter Wimbledon.
-- Replaces the previous coarse seat-count capacity model with per-table / per-configuration occupancy tracking.

-- Physical tables per studio.
CREATE TABLE IF NOT EXISTS studio_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio TEXT NOT NULL,
  table_id TEXT NOT NULL,
  area TEXT NOT NULL,
  table_type TEXT NOT NULL,
  width_cm INTEGER,
  length_cm INTEGER,
  min_capacity INTEGER NOT NULL DEFAULT 1,
  max_capacity INTEGER NOT NULL,
  joinable BOOLEAN NOT NULL DEFAULT false,
  join_group TEXT,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (studio, table_id)
);

-- Predefined table configurations (single tables, joined front tables, party areas, large-party combos).
CREATE TABLE IF NOT EXISTS table_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('normal', 'party', 'large_party')),
  party_area TEXT,
  core_tables TEXT[] NOT NULL DEFAULT '{}',
  expansion_tables TEXT[] NOT NULL DEFAULT '{}',
  all_tables TEXT[] NOT NULL DEFAULT '{}',
  min_capacity INTEGER NOT NULL DEFAULT 1,
  max_capacity INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_table_configurations_studio_name ON table_configurations (studio, name);

-- Time-blocked resources per booking. This is the source of truth for conflicts.
CREATE TABLE IF NOT EXISTS booking_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  table_configuration_id UUID REFERENCES table_configurations(id) ON DELETE SET NULL,
  table_id TEXT,
  blocked_start TIMESTAMP WITH TIME ZONE NOT NULL,
  blocked_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_resources_booking_id ON booking_resources(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_resources_time ON booking_resources(blocked_start, blocked_end);
CREATE INDEX IF NOT EXISTS idx_booking_resources_table ON booking_resources(table_id);

-- Store the allocated configuration/resource snapshot on the booking for quick reads.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS resources JSONB;

-- Party setup/cleanup buffer settings (minutes). 0 = no buffer.
INSERT INTO settings (key, value)
VALUES
  ('party_setup_buffer_minutes', '0'),
  ('party_cleanup_buffer_minutes', '0')
ON CONFLICT (key) DO NOTHING;

-- Wimbledon physical tables (spec section 2).
INSERT INTO studio_tables (studio, table_id, area, table_type, width_cm, length_cm, min_capacity, max_capacity, joinable, join_group, label, sort_order, active)
VALUES
  ('Wimbledon', 'T1',  'FRONT', 'SMALL_SQUARE',   75,  75, 1, 3, false, NULL, 'T1',  1, true),
  ('Wimbledon', 'T2',  'FRONT', 'LARGE_RECTANGLE',75, 125,1, 5, false, NULL, 'T2',  2, true),
  ('Wimbledon', 'T3',  'FRONT', 'LARGE_RECTANGLE',75, 125,1, 5, false, NULL, 'T3',  3, true),
  ('Wimbledon', 'T4',  'FRONT', 'LARGE_RECTANGLE',75, 125,1, 5, false, NULL, 'T4',  4, true),
  ('Wimbledon', 'T5',  'FRONT', 'LARGE_RECTANGLE',75, 125,1, 4, true,  'front_flex', 'T5',  5, true),
  ('Wimbledon', 'T6',  'FRONT', 'SMALL_SQUARE',   75,  75, 1, 2, true,  'front_flex', 'T6',  6, true),
  ('Wimbledon', 'T7',  'FRONT', 'LARGE_RECTANGLE',75, 125,1, 4, true,  'front_flex', 'T7',  7, true),
  ('Wimbledon', 'T8',  'FRONT', 'SMALL_SQUARE',   75,  75, 1, 2, true,  'front_flex', 'T8',  8, true),
  ('Wimbledon', 'T9',  'FRONT', 'LARGE_RECTANGLE',75, 125,1, 4, true,  'front_t9t10', 'T9',  9, true),
  ('Wimbledon', 'T10', 'FRONT', 'SMALL_SQUARE',   75,  75, 1, 3, true,  'front_t9t10', 'T10', 10, true),
  ('Wimbledon', 'T11', 'BACK',  'SMALL_SQUARE',   75,  75, 1, 3, true,  NULL, 'T11', 11, true),
  ('Wimbledon', 'T12', 'BACK',  'SMALL_SQUARE',   75,  75, 1, 3, true,  'back_left', 'T12', 12, true),
  ('Wimbledon', 'T13', 'BACK',  'SMALL_SQUARE',   75,  75, 1, 3, true,  'back_left', 'T13', 13, true),
  ('Wimbledon', 'T14', 'BACK',  'LARGE_RECTANGLE',75, 125,1, 5, true,  'back_right', 'T14', 14, true),
  ('Wimbledon', 'T15', 'PARTY_AREA_1', 'LARGE_RECTANGLE', 75, 125, 1, 5, true, 'party1_core', 'T15', 15, true),
  ('Wimbledon', 'T16', 'PARTY_AREA_1', 'LARGE_RECTANGLE', 75, 125, 1, 5, true, 'party1_core', 'T16', 16, true),
  ('Wimbledon', 'T17', 'PARTY_AREA_2', 'LARGE_RECTANGLE', 75, 125, 1, 5, true, 'party2_core', 'T17', 17, true),
  ('Wimbledon', 'T18', 'PARTY_AREA_2', 'LARGE_RECTANGLE', 75, 125, 1, 5, true, 'party2_core', 'T18', 18, true)
ON CONFLICT (studio, table_id) DO UPDATE SET
  area = EXCLUDED.area,
  table_type = EXCLUDED.table_type,
  width_cm = EXCLUDED.width_cm,
  length_cm = EXCLUDED.length_cm,
  min_capacity = EXCLUDED.min_capacity,
  max_capacity = EXCLUDED.max_capacity,
  joinable = EXCLUDED.joinable,
  join_group = EXCLUDED.join_group,
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

-- Wimbledon table configurations.
-- Front individual tables are also represented as configurations so the allocation engine is fully configuration-driven.
INSERT INTO table_configurations (studio, name, type, party_area, core_tables, expansion_tables, all_tables, min_capacity, max_capacity, sort_order, active)
VALUES
  -- Front individual normal tables.
  ('Wimbledon', 'T1',  'normal', NULL, ARRAY['T1'],  ARRAY[]::TEXT[], ARRAY['T1'],  1, 3,  1, true),
  ('Wimbledon', 'T2',  'normal', NULL, ARRAY['T2'],  ARRAY[]::TEXT[], ARRAY['T2'],  1, 5,  2, true),
  ('Wimbledon', 'T3',  'normal', NULL, ARRAY['T3'],  ARRAY[]::TEXT[], ARRAY['T3'],  1, 5,  3, true),
  ('Wimbledon', 'T4',  'normal', NULL, ARRAY['T4'],  ARRAY[]::TEXT[], ARRAY['T4'],  1, 5,  4, true),
  ('Wimbledon', 'T5',  'normal', NULL, ARRAY['T5'],  ARRAY[]::TEXT[], ARRAY['T5'],  1, 4,  5, true),
  ('Wimbledon', 'T6',  'normal', NULL, ARRAY['T6'],  ARRAY[]::TEXT[], ARRAY['T6'],  1, 2,  6, true),
  ('Wimbledon', 'T7',  'normal', NULL, ARRAY['T7'],  ARRAY[]::TEXT[], ARRAY['T7'],  1, 4,  7, true),
  ('Wimbledon', 'T8',  'normal', NULL, ARRAY['T8'],  ARRAY[]::TEXT[], ARRAY['T8'],  1, 2,  8, true),
  ('Wimbledon', 'T9',  'normal', NULL, ARRAY['T9'],  ARRAY[]::TEXT[], ARRAY['T9'],  1, 4,  9, true),
  ('Wimbledon', 'T10', 'normal', NULL, ARRAY['T10'], ARRAY[]::TEXT[], ARRAY['T10'], 1, 3, 10, true),
  -- Back individual normal tables.
  ('Wimbledon', 'T11', 'normal', NULL, ARRAY['T11'], ARRAY[]::TEXT[], ARRAY['T11'], 1, 3, 11, true),
  ('Wimbledon', 'T12', 'normal', NULL, ARRAY['T12'], ARRAY[]::TEXT[], ARRAY['T12'], 1, 3, 12, true),
  ('Wimbledon', 'T13', 'normal', NULL, ARRAY['T13'], ARRAY[]::TEXT[], ARRAY['T13'], 1, 3, 13, true),
  ('Wimbledon', 'T14', 'normal', NULL, ARRAY['T14'], ARRAY[]::TEXT[], ARRAY['T14'], 1, 5, 14, true),
  -- Front joined configurations (section 22).
  ('Wimbledon', 'FRONT_T5_T6',         'normal', NULL, ARRAY['T5','T6'],               ARRAY[]::TEXT[], ARRAY['T5','T6'],               1, 8,  20, true),
  ('Wimbledon', 'FRONT_T5_T6_T7',       'normal', NULL, ARRAY['T5','T6','T7'],          ARRAY[]::TEXT[], ARRAY['T5','T6','T7'],          1, 12, 21, true),
  ('Wimbledon', 'FRONT_T5_T6_T7_T8',    'normal', NULL, ARRAY['T5','T6','T7','T8'],     ARRAY[]::TEXT[], ARRAY['T5','T6','T7','T8'],     1, 14, 22, true),
  ('Wimbledon', 'FRONT_T9_T10',         'normal', NULL, ARRAY['T9','T10'],              ARRAY[]::TEXT[], ARRAY['T9','T10'],              1, 8,  23, true),
  -- Party Area 1 configurations (sections 9-10).
  ('Wimbledon', 'PA1_9',  'party', 'PA1', ARRAY['T15','T16'],          ARRAY[]::TEXT[], ARRAY['T15','T16'],          1, 9,  30, true),
  ('Wimbledon', 'PA1_12', 'party', 'PA1', ARRAY['T15','T16'],          ARRAY['T13'],    ARRAY['T13','T15','T16'],    1, 12, 31, true),
  ('Wimbledon', 'PA1_14', 'party', 'PA1', ARRAY['T15','T16'],          ARRAY['T12','T13'], ARRAY['T12','T13','T15','T16'], 1, 14, 32, true),
  -- Party Area 2 configurations (sections 9, 11).
  ('Wimbledon', 'PA2_9',  'party', 'PA2', ARRAY['T17','T18'],          ARRAY[]::TEXT[], ARRAY['T17','T18'],          1, 9,  40, true),
  ('Wimbledon', 'PA2_14', 'party', 'PA2', ARRAY['T17','T18'],          ARRAY['T14'],    ARRAY['T14','T17','T18'],    1, 14, 41, true),
  -- Large party: both party areas combined. Configurable by admin; seeded as the full back area (section 14).
  ('Wimbledon', 'PA1_PA2_28', 'large_party', 'PA1+PA2', ARRAY['T15','T16','T17','T18'], ARRAY['T12','T13','T14'], ARRAY['T12','T13','T14','T15','T16','T17','T18'], 15, 28, 50, true)
ON CONFLICT (studio, name) DO UPDATE SET
  type = EXCLUDED.type,
  party_area = EXCLUDED.party_area,
  core_tables = EXCLUDED.core_tables,
  expansion_tables = EXCLUDED.expansion_tables,
  all_tables = EXCLUDED.all_tables,
  min_capacity = EXCLUDED.min_capacity,
  max_capacity = EXCLUDED.max_capacity,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

-- Keep the legacy table_id column but make resources the source of truth.
-- Backfill booking_resources from existing Wimbledon bookings that have a table_id.
INSERT INTO booking_resources (booking_id, table_id, blocked_start, blocked_end)
SELECT
  b.id,
  trim(t),
  CASE
    WHEN position('-' in b.time) > 0 THEN (b.date || ' ' || split_part(b.time, '-', 1))::timestamptz
    ELSE (b.date || ' ' || b.time)::timestamptz
  END AS blocked_start,
  CASE
    WHEN position('-' in b.time) > 0 THEN (b.date || ' ' || split_part(b.time, '-', 2))::timestamptz
    ELSE ((b.date || ' ' || b.time)::timestamptz + interval '2 hours')
  END AS blocked_end
FROM bookings b,
     lateral unnest(string_to_array(b.table_id, ',')) AS t
WHERE b.studio = 'Wimbledon'
  AND b.table_id IS NOT NULL AND b.table_id <> ''
  AND b.status IN ('pending', 'confirmed')
ON CONFLICT DO NOTHING;

-- Populate the resources JSONB snapshot for backfilled Wimbledon bookings.
UPDATE bookings b
SET resources = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'table_id', trim(t),
      'blocked_start', CASE WHEN position('-' in b.time) > 0 THEN (b.date || ' ' || split_part(b.time, '-', 1))::timestamptz ELSE (b.date || ' ' || b.time)::timestamptz END,
      'blocked_end', CASE WHEN position('-' in b.time) > 0 THEN (b.date || ' ' || split_part(b.time, '-', 2))::timestamptz ELSE ((b.date || ' ' || b.time)::timestamptz + interval '2 hours') END
    )
  )
  FROM unnest(string_to_array(b.table_id, ',')) AS t
)
WHERE b.studio = 'Wimbledon'
  AND b.table_id IS NOT NULL AND b.table_id <> ''
  AND b.status IN ('pending', 'confirmed');

-- Ensure RLS is enabled on new tables.
ALTER TABLE studio_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_resources ENABLE ROW LEVEL SECURITY;

-- Only service-role edge functions should read/write these tables.
-- No public policies are created; edge functions bypass RLS with service role key.
