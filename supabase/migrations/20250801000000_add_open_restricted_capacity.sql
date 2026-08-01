-- Add front-tables-only capacity for open (painting) sessions, used when a
-- party is booked in the same time slot (back tables reserved for the party).
--
-- Studio table layout:
--   Putney:    6 front tables (painting) + 4 back tables (party area)  = 10 total
--   Wimbledon: 10 front tables (painting) + 7 back tables (party areas) = 17 total
--
-- 'open'            = full studio capacity for painting sessions (no party booked)
-- 'open_restricted' = front-tables-only capacity for painting sessions (party booked)
-- 'party'           = capacity for a party booking (back tables)
--
-- Defaults below are proportional to each studio's existing 'open' capacity,
-- scaled by the front/total table ratio. Admins can adjust via the Capacity
-- settings in the admin dashboard.

INSERT INTO capacity (studio, session_type, max_painters)
SELECT studio, 'open_restricted', ROUND(max_painters * front_ratio)::int
FROM capacity
JOIN (VALUES
  ('Putney', 6.0 / 10.0),
  ('Wimbledon', 10.0 / 17.0)
) AS ratios(studio, front_ratio) USING (studio)
WHERE capacity.session_type = 'open'
ON CONFLICT (studio, session_type) DO NOTHING;
