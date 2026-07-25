-- 1. Add cover_image_url to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS cover_image_url text;

-- 2. Create members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id text UNIQUE,
  member_number int UNIQUE,
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  age int NOT NULL,
  gender text NOT NULL CHECK (gender IN ('Male', 'Female')),
  place text NOT NULL,
  occupation text NOT NULL,
  running_experience text NOT NULL CHECK (running_experience IN ('First timer', 'Casual', 'Regular', 'Competitive')),
  goals text[] DEFAULT '{}',
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_conditions text,
  blood_group text,
  instagram_handle text,
  profile_photo_url text,
  birthday date,
  height numeric,
  weight numeric,
  running_pace text,
  weekly_training_days int CHECK (weekly_training_days BETWEEN 1 AND 7),
  interests text[] DEFAULT '{}',
  level int NOT NULL DEFAULT 1 CHECK (level IN (1, 2)),
  attended_count int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. Member ID auto-generation trigger
CREATE OR REPLACE FUNCTION generate_member_id()
RETURNS TRIGGER AS $$
DECLARE
  next_num int;
BEGIN
  SELECT COALESCE(MAX(member_number), 0) + 1 INTO next_num FROM members;
  NEW.member_number := next_num;
  NEW.member_id := 'TFRC' || LPAD(next_num::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_member_id ON members;
CREATE TRIGGER set_member_id
  BEFORE INSERT ON members
  FOR EACH ROW
  WHEN (NEW.member_id IS NULL)
  EXECUTE FUNCTION generate_member_id();

-- 4. RLS for members
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can register as member"
  ON members FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read members"
  ON members FOR SELECT USING (true);

CREATE POLICY "Admins full access to members"
  ON members FOR ALL USING (auth.role() = 'authenticated');

-- 5. Create event_photos table
CREATE TABLE IF NOT EXISTS event_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  instagram_post_url text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 6. RLS for event_photos
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view event photos"
  ON event_photos FOR SELECT USING (true);

CREATE POLICY "Admins full access to event_photos"
  ON event_photos FOR ALL USING (auth.role() = 'authenticated');

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON event_photos(event_id);
