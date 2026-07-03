-- Seed fake bookings for testing dashboard, floor plan, and capacity views
-- Covers today + next 14 days, both studios, all session types

DO $$
DECLARE
  today DATE := CURRENT_DATE;
BEGIN

-- ============================================================
-- PUTNEY — today
-- ============================================================
INSERT INTO bookings (booking_id, studio, name, email, phone, date, time, painters_count, session_type, status, source, request_date, estimated_price, notes, table_id)
VALUES
  ('PP-SEED-001', 'Putney', 'Sarah Mitchell',   'sarah.m@email.com',   '07700900001', today, '10:00', 2, 'painting',         'confirmed', 'online', to_char(today,'DD Mon YYYY'), 57.90,  NULL, 'T1'),
  ('PP-SEED-002', 'Putney', 'James Okafor',     'james.o@email.com',   '07700900002', today, '10:00', 3, 'painting',         'confirmed', 'online', to_char(today,'DD Mon YYYY'), 86.85,  NULL, 'T2'),
  ('PP-SEED-003', 'Putney', 'Priya Sharma',     'priya.s@email.com',   '07700900003', today, '10:00', 1, 'painting',         'pending',   'online', to_char(today,'DD Mon YYYY'), 28.95,  NULL, NULL),
  ('PP-SEED-004', 'Putney', 'Chloe Barnes',     'chloe.b@email.com',   '07700900004', today, '14:00', 4, 'painting',         'confirmed', 'online', to_char(today,'DD Mon YYYY'), 115.80, NULL, 'T3'),
  ('PP-SEED-005', 'Putney', 'Tom & Laura',      'tom.l@email.com',     '07700900005', today, '14:00', 2, 'painting',         'pending',   'walk-in',to_char(today,'DD Mon YYYY'), 57.90,  NULL, NULL),
  ('PP-SEED-006', 'Putney', 'The Nguyen Family','nguyen@email.com',    '07700900006', today, '10:00-12:00', 12, 'birthday-party', 'confirmed', 'online', to_char(today,'DD Mon YYYY'), 347.40, '[Birthday Party] Age: 8', 'T7'),
  ('PP-SEED-007', 'Putney', 'Emma Corporate',   'emma.c@company.com',  '07700900007', today, '15:00-17:00', 8, 'corporate',  'confirmed', 'online', to_char(today,'DD Mon YYYY'), 231.60, '[Corporate Event]', 'T10');

-- ============================================================
-- WIMBLEDON — today
-- ============================================================
INSERT INTO bookings (booking_id, studio, name, email, phone, date, time, painters_count, session_type, status, source, request_date, estimated_price, notes, table_id)
VALUES
  ('WIM-SEED-001', 'Wimbledon', 'Alice Chen',        'alice.c@email.com',   '07700900010', today, '10:00', 2, 'painting',         'confirmed', 'online', to_char(today,'DD Mon YYYY'), 57.90,  NULL, 'T1'),
  ('WIM-SEED-002', 'Wimbledon', 'Marcus Webb',       'marcus.w@email.com',  '07700900011', today, '10:00', 4, 'painting',         'confirmed', 'online', to_char(today,'DD Mon YYYY'), 115.80, NULL, 'T2'),
  ('WIM-SEED-003', 'Wimbledon', 'Fatima Al-Hassan',  'fatima.h@email.com',  '07700900012', today, '12:00', 3, 'clay-imprints',    'pending',   'online', to_char(today,'DD Mon YYYY'), 86.85,  NULL, NULL),
  ('WIM-SEED-004', 'Wimbledon', 'Ryan & Sophia',     'ryan.s@email.com',    '07700900013', today, '14:00', 2, 'painting',         'confirmed', 'online', to_char(today,'DD Mon YYYY'), 57.90,  NULL, 'T5'),
  ('WIM-SEED-005', 'Wimbledon', 'Hen Do — Katie',    'katie.hen@email.com', '07700900014', today, '12:30-14:30', 14, 'baby-shower-hen', 'confirmed', 'online', to_char(today,'DD Mon YYYY'), 405.30, '[Baby Shower / Hen] Party Area 1', 'T8'),
  ('WIM-SEED-006', 'Wimbledon', 'Big Birthday Gang', 'birthday@email.com',  '07700900015', today, '15:00-17:00', 10, 'birthday-party', 'pending', 'online', to_char(today,'DD Mon YYYY'), 289.50, '[Birthday Party] Age: 30 | Party Area 2', NULL);

-- ============================================================
-- PUTNEY — tomorrow
-- ============================================================
INSERT INTO bookings (booking_id, studio, name, email, phone, date, time, painters_count, session_type, status, source, request_date, estimated_price, notes, table_id)
VALUES
  ('PP-SEED-010', 'Putney', 'Nicole Foster',    'nicole.f@email.com',  '07700900020', today+1, '10:00', 2, 'painting',  'confirmed', 'online', to_char(today+1,'DD Mon YYYY'), 57.90,  NULL, 'T1'),
  ('PP-SEED-011', 'Putney', 'Dev Patel',        'dev.p@email.com',     '07700900021', today+1, '14:00', 3, 'painting',  'pending',   'online', to_char(today+1,'DD Mon YYYY'), 86.85,  NULL, NULL),
  ('PP-SEED-012', 'Putney', 'Clay Kids Club',   'claykids@email.com',  '07700900022', today+1, '10:00', 6, 'clay-imprints', 'confirmed','online', to_char(today+1,'DD Mon YYYY'), 173.70, NULL, 'T4');

-- ============================================================
-- WIMBLEDON — tomorrow
-- ============================================================
INSERT INTO bookings (booking_id, studio, name, email, phone, date, time, painters_count, session_type, status, source, request_date, estimated_price, notes, table_id)
VALUES
  ('WIM-SEED-010', 'Wimbledon', 'Zara Ahmed',       'zara.a@email.com',   '07700900030', today+1, '10:00', 1, 'painting',  'confirmed', 'online', to_char(today+1,'DD Mon YYYY'), 28.95,  NULL, 'T3'),
  ('WIM-SEED-011', 'Wimbledon', 'Corporate Team',   'corp@bigfirm.com',   '07700900031', today+1, '10:00-12:00', 20, 'corporate', 'confirmed', 'online', to_char(today+1,'DD Mon YYYY'), 579.00, '[Corporate Event] Team building', 'T6'),
  ('WIM-SEED-012', 'Wimbledon', 'Lily & Friends',   'lily.f@email.com',   '07700900032', today+1, '14:00', 4, 'painting',  'pending',   'online', to_char(today+1,'DD Mon YYYY'), 115.80, NULL, NULL);

-- ============================================================
-- PUTNEY — day +2
-- ============================================================
INSERT INTO bookings (booking_id, studio, name, email, phone, date, time, painters_count, session_type, status, source, request_date, estimated_price, notes, table_id)
VALUES
  ('PP-SEED-020', 'Putney', 'Hannah Green',    'hannah.g@email.com',  '07700900040', today+2, '10:00', 3, 'painting',  'confirmed', 'online', to_char(today+2,'DD Mon YYYY'), 86.85,  NULL, 'T2'),
  ('PP-SEED-021', 'Putney', 'Sofia Rossi',     'sofia.r@email.com',   '07700900041', today+2, '12:00', 2, 'painting',  'pending',   'online', to_char(today+2,'DD Mon YYYY'), 57.90,  NULL, NULL),
  ('PP-SEED-022', 'Putney', 'Bridal Party',    'bride@email.com',     '07700900042', today+2, '12:30-14:30', 16, 'baby-shower-hen', 'confirmed', 'online', to_char(today+2,'DD Mon YYYY'), 463.20, '[Baby Shower / Hen] Bride: Sophie', 'T7');

-- ============================================================
-- WIMBLEDON — day +2
-- ============================================================
INSERT INTO bookings (booking_id, studio, name, email, phone, date, time, painters_count, session_type, status, source, request_date, estimated_price, notes, table_id)
VALUES
  ('WIM-SEED-020', 'Wimbledon', 'Oliver Hunt',       'oliver.h@email.com',  '07700900050', today+2, '10:00', 2, 'painting',  'confirmed', 'online', to_char(today+2,'DD Mon YYYY'), 57.90,  NULL, 'T4'),
  ('WIM-SEED-021', 'Wimbledon', 'Amara Diallo',      'amara.d@email.com',   '07700900051', today+2, '14:00', 5, 'painting',  'pending',   'online', to_char(today+2,'DD Mon YYYY'), 144.75, NULL, NULL),
  ('WIM-SEED-022', 'Wimbledon', 'Kids Party — Noah', 'noah.bday@email.com', '07700900052', today+2, '15:00-17:00', 8, 'birthday-party', 'confirmed', 'online', to_char(today+2,'DD Mon YYYY'), 231.60, '[Birthday Party] Age: 6 | Party Area 1', 'T9');

-- ============================================================
-- PUTNEY — day +3
-- ============================================================
INSERT INTO bookings (booking_id, studio, name, email, phone, date, time, painters_count, session_type, status, source, request_date, estimated_price, notes, table_id)
VALUES
  ('PP-SEED-030', 'Putney', 'Mei Zhang',       'mei.z@email.com',     '07700900060', today+3, '10:00', 4, 'painting',  'confirmed', 'online', to_char(today+3,'DD Mon YYYY'), 115.80, NULL, 'T1'),
  ('PP-SEED-031', 'Putney', 'Ben Thornton',    'ben.t@email.com',     '07700900061', today+3, '14:00', 2, 'painting',  'confirmed', 'online', to_char(today+3,'DD Mon YYYY'), 57.90,  NULL, 'T3');

-- ============================================================
-- WIMBLEDON — day +3
-- ============================================================
INSERT INTO bookings (booking_id, studio, name, email, phone, date, time, painters_count, session_type, status, source, request_date, estimated_price, notes, table_id)
VALUES
  ('WIM-SEED-030', 'Wimbledon', 'Grace Ito',         'grace.i@email.com',   '07700900070', today+3, '10:00', 3, 'painting',      'confirmed', 'online', to_char(today+3,'DD Mon YYYY'), 86.85,  NULL, 'T2'),
  ('WIM-SEED-031', 'Wimbledon', 'Tech Co Offsite',   'hr@techco.com',       '07700900071', today+3, '12:30-14:30', 30, 'corporate','confirmed', 'online', to_char(today+3,'DD Mon YYYY'), 868.50, '[Corporate Event] All hands away day', 'T10'),
  ('WIM-SEED-032', 'Wimbledon', 'Poppy Williams',    'poppy.w@email.com',   '07700900072', today+3, '14:00', 1, 'painting',      'pending',   'online', to_char(today+3,'DD Mon YYYY'), 28.95,  NULL, NULL);

-- ============================================================
-- PUTNEY — day +5
-- ============================================================
INSERT INTO bookings (booking_id, studio, name, email, phone, date, time, painters_count, session_type, status, source, request_date, estimated_price, notes, table_id)
VALUES
  ('PP-SEED-040', 'Putney', 'Lena Kowalski',   'lena.k@email.com',    '07700900080', today+5, '10:00', 2, 'painting',  'confirmed', 'online', to_char(today+5,'DD Mon YYYY'), 57.90,  NULL, 'T1'),
  ('PP-SEED-041', 'Putney', 'Aiden Murphy',    'aiden.m@email.com',   '07700900081', today+5, '10:00', 3, 'painting',  'pending',   'online', to_char(today+5,'DD Mon YYYY'), 86.85,  NULL, NULL),
  ('PP-SEED-042', 'Putney', 'Jessica Long',    'jess.l@email.com',    '07700900082', today+5, '14:00', 4, 'clay-imprints', 'confirmed', 'online', to_char(today+5,'DD Mon YYYY'), 115.80, NULL, 'T4'),
  ('PP-SEED-043', 'Putney', 'Weekend Hen Do',  'henparty@email.com',  '07700900083', today+5, '12:30-14:30', 18, 'baby-shower-hen', 'confirmed', 'online', to_char(today+5,'DD Mon YYYY'), 521.10, '[Baby Shower / Hen] Bride: Tara', 'T7');

-- ============================================================
-- WIMBLEDON — day +5
-- ============================================================
INSERT INTO bookings (booking_id, studio, name, email, phone, date, time, painters_count, session_type, status, source, request_date, estimated_price, notes, table_id)
VALUES
  ('WIM-SEED-040', 'Wimbledon', 'Yuki Tanaka',       'yuki.t@email.com',    '07700900090', today+5, '10:00', 2, 'painting',         'confirmed', 'online', to_char(today+5,'DD Mon YYYY'), 57.90,  NULL, 'T3'),
  ('WIM-SEED-041', 'Wimbledon', 'Sophie & Dan',      'sophie.d@email.com',  '07700900091', today+5, '12:00', 2, 'painting',         'pending',   'online', to_char(today+5,'DD Mon YYYY'), 57.90,  NULL, NULL),
  ('WIM-SEED-042', 'Wimbledon', 'Mia Birthday',      'mia.bday@email.com',  '07700900092', today+5, '15:00-17:00', 12, 'birthday-party', 'confirmed', 'online', to_char(today+5,'DD Mon YYYY'), 347.40, '[Birthday Party] Age: 25 | Party Area 2', 'T11');

-- ============================================================
-- PUTNEY — day +7
-- ============================================================
INSERT INTO bookings (booking_id, studio, name, email, phone, date, time, painters_count, session_type, status, source, request_date, estimated_price, notes, table_id)
VALUES
  ('PP-SEED-050', 'Putney', 'Carlos Mendes',   'carlos.m@email.com',  '07700900100', today+7, '10:00', 3, 'painting',  'confirmed', 'online', to_char(today+7,'DD Mon YYYY'), 86.85,  NULL, 'T2'),
  ('PP-SEED-051', 'Putney', 'Isla Thomson',    'isla.t@email.com',    '07700900101', today+7, '14:00', 2, 'painting',  'pending',   'online', to_char(today+7,'DD Mon YYYY'), 57.90,  NULL, NULL),
  ('PP-SEED-052', 'Putney', 'Big Kids Party',  'kids.party@email.com','07700900102', today+7, '10:00-12:00', 20, 'birthday-party', 'confirmed', 'online', to_char(today+7,'DD Mon YYYY'), 579.00, '[Birthday Party] Age: 7 | Full party area', 'T8');

-- ============================================================
-- WIMBLEDON — day +7
-- ============================================================
INSERT INTO bookings (booking_id, studio, name, email, phone, date, time, painters_count, session_type, status, source, request_date, estimated_price, notes, table_id)
VALUES
  ('WIM-SEED-050', 'Wimbledon', 'Nadia Petrov',      'nadia.p@email.com',   '07700900110', today+7, '10:00', 4, 'painting',  'confirmed', 'online', to_char(today+7,'DD Mon YYYY'), 115.80, NULL, 'T1'),
  ('WIM-SEED-051', 'Wimbledon', 'Luke & Anya',       'luke.a@email.com',    '07700900111', today+7, '12:00', 2, 'painting',  'confirmed', 'online', to_char(today+7,'DD Mon YYYY'), 57.90,  NULL, 'T4'),
  ('WIM-SEED-052', 'Wimbledon', 'Finance Team XYZ',  'finance@xyz.com',     '07700900112', today+7, '12:30-14:30', 25, 'corporate', 'pending', 'online', to_char(today+7,'DD Mon YYYY'), 723.75, '[Corporate Event] Year-end celebration', NULL),
  ('WIM-SEED-053', 'Wimbledon', 'Twins Birthday',    'twins@email.com',     '07700900113', today+7, '15:00-17:00', 14, 'birthday-party', 'confirmed', 'online', to_char(today+7,'DD Mon YYYY'), 405.30, '[Birthday Party] Age: 10 | Party Area 1', 'T9');

-- ============================================================
-- PUTNEY — day +10
-- ============================================================
INSERT INTO bookings (booking_id, studio, name, email, phone, date, time, painters_count, session_type, status, source, request_date, estimated_price, notes, table_id)
VALUES
  ('PP-SEED-060', 'Putney', 'Freya Jensen',    'freya.j@email.com',   '07700900120', today+10, '10:00', 5, 'painting',  'pending',   'online', to_char(today+10,'DD Mon YYYY'), 144.75, NULL, NULL),
  ('PP-SEED-061', 'Putney', 'Marco Ferrari',   'marco.f@email.com',   '07700900121', today+10, '14:00', 2, 'painting',  'confirmed', 'online', to_char(today+10,'DD Mon YYYY'), 57.90,  NULL, 'T1');

-- ============================================================
-- WIMBLEDON — day +10
-- ============================================================
INSERT INTO bookings (booking_id, studio, name, email, phone, date, time, painters_count, session_type, status, source, request_date, estimated_price, notes, table_id)
VALUES
  ('WIM-SEED-060', 'Wimbledon', 'Ella Whitmore',     'ella.w@email.com',    '07700900130', today+10, '10:00', 3, 'painting',         'confirmed', 'online', to_char(today+10,'DD Mon YYYY'), 86.85,  NULL, 'T2'),
  ('WIM-SEED-061', 'Wimbledon', 'Baby Shower Rosa',  'rosa.bs@email.com',   '07700900131', today+10, '10:00-12:00', 15, 'baby-shower-hen', 'confirmed', 'online', to_char(today+10,'DD Mon YYYY'), 434.25, '[Baby Shower / Hen] Mum-to-be: Rosa', 'T8'),
  ('WIM-SEED-062', 'Wimbledon', 'Patrick Ng',        'patrick.n@email.com', '07700900132', today+10, '14:00', 1, 'painting',         'pending',   'online', to_char(today+10,'DD Mon YYYY'), 28.95,  NULL, NULL);

-- ============================================================
-- PUTNEY — day +14
-- ============================================================
INSERT INTO bookings (booking_id, studio, name, email, phone, date, time, painters_count, session_type, status, source, request_date, estimated_price, notes, table_id)
VALUES
  ('PP-SEED-070', 'Putney', 'Ingrid Larsson',  'ingrid.l@email.com',  '07700900140', today+14, '10:00', 4, 'painting',  'confirmed', 'online', to_char(today+14,'DD Mon YYYY'), 115.80, NULL, 'T2'),
  ('PP-SEED-071', 'Putney', 'Mega Hen Party',  'megahen@email.com',   '07700900141', today+14, '12:30-14:30', 20, 'baby-shower-hen', 'pending', 'online', to_char(today+14,'DD Mon YYYY'), 579.00, '[Baby Shower / Hen] Bride: Ingrid', NULL);

-- ============================================================
-- WIMBLEDON — day +14
-- ============================================================
INSERT INTO bookings (booking_id, studio, name, email, phone, date, time, painters_count, session_type, status, source, request_date, estimated_price, notes, table_id)
VALUES
  ('WIM-SEED-070', 'Wimbledon', 'Sam & Jo',          'samjo@email.com',     '07700900150', today+14, '10:00', 2, 'painting',  'confirmed', 'online', to_char(today+14,'DD Mon YYYY'), 57.90,  NULL, 'T5'),
  ('WIM-SEED-071', 'Wimbledon', 'Startup Offsite',   'ops@startup.com',     '07700900151', today+14, '10:00-12:00', 35, 'corporate', 'confirmed', 'online', to_char(today+14,'DD Mon YYYY'), 1013.25, '[Corporate Event] Product team', 'T10'),
  ('WIM-SEED-072', 'Wimbledon', 'Charlotte Hayes',   'charlotte.h@email.com','07700900152',today+14, '14:00', 3, 'painting',  'pending',   'online', to_char(today+14,'DD Mon YYYY'), 86.85,  NULL, NULL);

END $$;
