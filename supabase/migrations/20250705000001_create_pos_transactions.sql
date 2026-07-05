CREATE TABLE IF NOT EXISTS pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  gift_card_code TEXT,
  total_amount NUMERIC(10, 2) NOT NULL,
  gift_card_discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  clover_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON pos_transactions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
