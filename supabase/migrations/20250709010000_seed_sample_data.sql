-- Sample data for development/testing.
-- To remove all sample data, run:
-- DELETE FROM bookings WHERE source = 'sample';
-- DELETE FROM gift_cards WHERE sender_name = 'Sample Sender';
-- DELETE FROM audit_logs WHERE details->>'note' = 'sample data seed';

-- Sample bookings across studios, dates, and session types
INSERT INTO bookings (
  booking_id, studio, name, email, phone, date, time, painters_count,
  session_type, notes, status, request_date, estimated_price, source, final_price, table_id
) VALUES
  ('BK-SAMPLE-001', 'Putney', 'Olivia Smith', 'olivia.smith@example.com', '07700 900001', '2026-07-10', '10:00', 2, 'painting', 'SAMPLE DATA: Adult + child pottery painting', 'confirmed', '2026-07-01', 59.90, 'sample', 59.90, 'T1'),
  ('BK-SAMPLE-002', 'Wimbledon', 'Noah Jones', 'noah.jones@example.com', '07700 900002', '2026-07-11', '11:00', 4, 'painting', 'SAMPLE DATA: Family of four', 'pending', '2026-07-02', 99.80, 'sample', 99.80, NULL),
  ('BK-SAMPLE-003', 'Putney', 'Emma Brown', 'emma.brown@example.com', '07700 900003', '2026-07-12', '14:00', 1, 'clay-imprints', 'SAMPLE DATA: Baby hand/foot print keepsake', 'confirmed', '2026-07-03', 35.00, 'sample', 35.00, NULL),
  ('BK-SAMPLE-004', 'Wimbledon', 'Liam Wilson', 'liam.wilson@example.com', '07700 900004', '2026-07-13', '16:00', 8, 'birthday-party', 'SAMPLE DATA: 8th birthday party', 'confirmed', '2026-07-04', 231.60, 'sample', 231.60, 'P1'),
  ('BK-SAMPLE-005', 'Putney', 'Ava Taylor', 'ava.taylor@example.com', '07700 900005', '2026-07-14', '10:00', 3, 'painting', 'SAMPLE DATA: Saturday morning session', 'cancelled', '2026-07-05', 74.85, 'sample', 74.85, NULL),
  ('BK-SAMPLE-006', 'Wimbledon', 'William Davis', 'william.davis@example.com', '07700 900006', '2026-07-15', '12:00', 2, 'painting', 'SAMPLE DATA: Couple date session', 'pending', '2026-07-06', 59.90, 'sample', 59.90, NULL),
  ('BK-SAMPLE-007', 'Putney', 'Sophia Miller', 'sophia.miller@example.com', '07700 900007', '2026-07-16', '15:00', 5, 'baby-shower-hen', 'SAMPLE DATA: Hen party group', 'confirmed', '2026-07-07', 144.75, 'sample', 144.75, 'P2'),
  ('BK-SAMPLE-008', 'Wimbledon', 'James Anderson', 'james.anderson@example.com', '07700 900008', '2026-07-17', '11:00', 1, 'painting', 'SAMPLE DATA: Walk-in customer', 'confirmed', '2026-07-08', 24.95, 'sample', 24.95, 'T3'),
  ('BK-SAMPLE-009', 'Putney', 'Isabella Thomas', 'isabella.thomas@example.com', '07700 900009', '2026-07-18', '14:00', 12, 'corporate', 'SAMPLE DATA: Team building event', 'pending', '2026-07-09', 347.40, 'sample', 347.40, NULL),
  ('BK-SAMPLE-010', 'Wimbledon', 'Mason Jackson', 'mason.jackson@example.com', '07700 900010', '2026-07-19', '10:00', 2, 'clay-imprints', 'SAMPLE DATA: Twin prints', 'confirmed', '2026-07-10', 60.00, 'sample', 60.00, NULL),
  ('BK-SAMPLE-011', 'Putney', 'Mia White', 'mia.white@example.com', '07700 900011', '2026-07-20', '13:00', 6, 'birthday-party', 'SAMPLE DATA: 6th birthday with cake', 'confirmed', '2026-07-11', 173.70, 'sample', 173.70, 'P1'),
  ('BK-SAMPLE-012', 'Wimbledon', 'Lucas Harris', 'lucas.harris@example.com', '07700 900012', '2026-07-21', '15:00', 3, 'painting', 'SAMPLE DATA: After school group', 'pending', '2026-07-12', 74.85, 'sample', 74.85, NULL),
  ('BK-SAMPLE-013', 'Putney', 'Charlotte Martin', 'charlotte.martin@example.com', '07700 900013', '2026-07-22', '11:00', 1, 'painting', 'SAMPLE DATA: Solo creative session', 'confirmed', '2026-07-13', 24.95, 'sample', 24.95, 'T2'),
  ('BK-SAMPLE-014', 'Wimbledon', 'Henry Thompson', 'henry.thompson@example.com', '07700 900014', '2026-07-23', '14:00', 4, 'painting', 'SAMPLE DATA: Family weekend', 'confirmed', '2026-07-14', 99.80, 'sample', 99.80, NULL),
  ('BK-SAMPLE-015', 'Putney', 'Amelia Garcia', 'amelia.garcia@example.com', '07700 900015', '2026-07-24', '16:00', 10, 'corporate', 'SAMPLE DATA: Office social', 'pending', '2026-07-15', 289.50, 'sample', 289.50, NULL),
  ('BK-SAMPLE-016', 'Wimbledon', 'Ethan Martinez', 'ethan.martinez@example.com', '07700 900016', '2026-07-25', '10:00', 2, 'clay-imprints', 'SAMPLE DATA: Newborn prints', 'confirmed', '2026-07-16', 60.00, 'sample', 60.00, NULL),
  ('BK-SAMPLE-017', 'Putney', 'Harper Robinson', 'harper.robinson@example.com', '07700 900017', '2026-07-26', '12:00', 5, 'baby-shower-hen', 'SAMPLE DATA: Baby shower group', 'confirmed', '2026-07-17', 144.75, 'sample', 144.75, 'P3'),
  ('BK-SAMPLE-018', 'Wimbledon', 'Alexander Clark', 'alexander.clark@example.com', '07700 900018', '2026-07-27', '15:00', 2, 'painting', 'SAMPLE DATA: Anniversary activity', 'pending', '2026-07-18', 59.90, 'sample', 59.90, NULL),
  ('BK-SAMPLE-019', 'Putney', 'Evelyn Rodriguez', 'evelyn.rodriguez@example.com', '07700 900019', '2026-07-28', '11:00', 7, 'birthday-party', 'SAMPLE DATA: 7th birthday party', 'confirmed', '2026-07-19', 202.65, 'sample', 202.65, 'P1'),
  ('BK-SAMPLE-020', 'Wimbledon', 'Daniel Lewis', 'daniel.lewis@example.com', '07700 900020', '2026-07-29', '13:00', 1, 'painting', 'SAMPLE DATA: Drop-in customer', 'cancelled', '2026-07-20', 24.95, 'sample', 24.95, NULL)
ON CONFLICT (booking_id) DO NOTHING;

-- Sample gift cards in various states
INSERT INTO gift_cards (
  code, amount, balance, recipient_name, recipient_email, sender_name, message, status,
  purchase_date, expiry_date, stripe_session_id
) VALUES
  ('SAMPLE-GC-0001', 50.00, 50.00, 'Emily', 'emily@example.com', 'Sample Sender', 'SAMPLE DATA: Happy birthday!', 'active', NOW() - INTERVAL '2 days', NOW() + INTERVAL '360 days', 'sess_sample_001'),
  ('SAMPLE-GC-0002', 100.00, 0.00, 'Jessica', 'jessica@example.com', 'Sample Sender', 'SAMPLE DATA: Thank you gift', 'redeemed', NOW() - INTERVAL '30 days', NOW() + INTERVAL '330 days', 'sess_sample_002'),
  ('SAMPLE-GC-0003', 25.00, 25.00, 'Olivia', 'olivia@example.com', 'Sample Sender', 'SAMPLE DATA: Get creative!', 'active', NOW() - INTERVAL '5 days', NOW() + INTERVAL '355 days', 'sess_sample_003'),
  ('SAMPLE-GC-0004', 75.00, 75.00, 'Sophia', 'sophia@example.com', 'Sample Sender', 'SAMPLE DATA: Housewarming present', 'active', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day', 'sess_sample_004'),
  ('SAMPLE-GC-0005', 150.00, 50.00, 'Ava', 'ava@example.com', 'Sample Sender', 'SAMPLE DATA: Family fun day', 'active', NOW() - INTERVAL '20 days', NOW() + INTERVAL '340 days', 'sess_sample_005')
ON CONFLICT (code) DO NOTHING;
