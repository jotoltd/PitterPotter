-- Add setting to enable/disable the table plan feature. Defaults to false (disabled).
INSERT INTO public.settings (key, value, updated_at)
VALUES ('table_plan_enabled', 'false', now())
ON CONFLICT (key) DO NOTHING;
