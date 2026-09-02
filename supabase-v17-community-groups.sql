-- v17: Community sub-groups (Readers, Blood Donors, IT-Techies, etc.) shown
-- on the homepage with a photo and a direct group-join link, plus a
-- first-person founder-story text block replacing the generic "Why We
-- Started" copy.

CREATE TABLE IF NOT EXISTS community_groups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  image_url text,
  storage_path text,
  group_link text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE community_groups ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'community_groups' AND policyname = 'Public read community_groups'
  ) THEN
    CREATE POLICY "Public read community_groups"
      ON community_groups FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'community_groups' AND policyname = 'Admin full access community_groups'
  ) THEN
    CREATE POLICY "Admin full access community_groups"
      ON community_groups FOR ALL
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

INSERT INTO site_settings (key, value) VALUES
  ('founder_story', '')
ON CONFLICT (key) DO NOTHING;
