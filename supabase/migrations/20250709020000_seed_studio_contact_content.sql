-- Seed correct studio address and phone content to fix any stale/wrong cached values
INSERT INTO content (key, value, type, page)
VALUES
  ('wimbledon_address', '52 Wimbledon Hill Road, Wimbledon SW19 7PA', 'text', 'wimbledon'),
  ('wimbledon_phone', '020 37704499', 'text', 'wimbledon'),
  ('putney_address', '234 Upper Richmond Road, Putney SW15 6TG', 'text', 'putney'),
  ('putney_phone', '020 87881635', 'text', 'putney'),
  ('wimbledon_address', '52 Wimbledon Hill Road, Wimbledon SW19 7PA', 'text', 'contact-info'),
  ('wimbledon_phone', '020 37704499', 'text', 'contact-info'),
  ('putney_address', '234 Upper Richmond Road, Putney SW15 6TG', 'text', 'contact-info'),
  ('putney_phone', '020 87881635', 'text', 'contact-info'),
  ('footer_wimbledon_address', '52 Wimbledon Hill Road SW19 7PA', 'text', 'footer'),
  ('footer_wimbledon_phone', '020 37704499', 'text', 'footer'),
  ('footer_putney_address', '234 Upper Richmond Road SW15 6TG', 'text', 'footer'),
  ('footer_putney_phone', '020 87881635', 'text', 'footer')
ON CONFLICT (key, page) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();
