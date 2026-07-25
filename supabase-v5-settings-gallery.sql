-- V5 Migration: site_settings + gallery_photos
-- Safe to run on live DB — uses IF NOT EXISTS and ON CONFLICT DO NOTHING

-- ─────────────────────────────────────────────
-- site_settings
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'site_settings' AND policyname = 'Public read site_settings'
  ) THEN
    CREATE POLICY "Public read site_settings"
      ON site_settings FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'site_settings' AND policyname = 'Admin full access site_settings'
  ) THEN
    CREATE POLICY "Admin full access site_settings"
      ON site_settings FOR ALL
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

INSERT INTO site_settings (key, value) VALUES
  ('community_stat_value',  '1600+'),
  ('whatsapp_link',         'https://chat.whatsapp.com/YOUR_LINK'),
  ('instagram_url',         'https://instagram.com/thefirstruleclub'),
  ('youtube_url',           ''),
  ('featured_event_active', 'false'),
  ('featured_event_name',   ''),
  ('featured_event_date',   ''),
  ('featured_event_desc',   ''),
  ('featured_event_url',    ''),
  ('featured_event_btn',    'Register Now'),
  ('quote_1_text',          ''),
  ('quote_1_name',          ''),
  ('quote_2_text',          ''),
  ('quote_2_name',          ''),
  ('quote_3_text',          ''),
  ('quote_3_name',          '')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────
-- gallery_photos
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  caption text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'gallery_photos' AND policyname = 'Public read gallery_photos'
  ) THEN
    CREATE POLICY "Public read gallery_photos"
      ON gallery_photos FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'gallery_photos' AND policyname = 'Admin full access gallery_photos'
  ) THEN
    CREATE POLICY "Admin full access gallery_photos"
      ON gallery_photos FOR ALL
      USING (auth.role() = 'authenticated');
  END IF;
END $$;
