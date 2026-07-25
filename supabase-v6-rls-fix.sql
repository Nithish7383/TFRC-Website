-- Fix 1: Ensure the public INSERT policy exists (recreate idempotently)
DROP POLICY IF EXISTS "Public can register" ON registrations;
CREATE POLICY "Public can register"
  ON registrations FOR INSERT
  WITH CHECK (true);

-- Fix 2: Rebuild the trigger function with SECURITY DEFINER.
--
-- Without SECURITY DEFINER the trigger runs as the anon user, which has no
-- SELECT policy on registrations.  That means the COUNT inside the trigger
-- always returns 0 (RLS filters every row), making slot enforcement useless.
-- It can also surface as the "violates row-level security policy" error that
-- blocks the INSERT entirely.
--
-- SECURITY DEFINER lets the function run as its owner (postgres/superuser),
-- bypassing RLS so it can correctly count existing registrations.
CREATE OR REPLACE FUNCTION check_gender_slots()
RETURNS TRIGGER AS $$
DECLARE
  male_count int;
  female_count int;
  max_m int;
  max_f int;
BEGIN
  SELECT COUNT(*) INTO male_count
  FROM registrations
  WHERE event_id = NEW.event_id AND gender = 'Male';

  SELECT COUNT(*) INTO female_count
  FROM registrations
  WHERE event_id = NEW.event_id AND gender = 'Female';

  SELECT max_male, max_female INTO max_m, max_f
  FROM events WHERE id = NEW.event_id;

  IF NEW.gender = 'Male' AND male_count >= max_m THEN
    RAISE EXCEPTION 'Male slots are full for this event';
  END IF;

  IF NEW.gender = 'Female' AND female_count >= max_f THEN
    RAISE EXCEPTION 'Female slots are full for this event';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_gender_slots ON registrations;
CREATE TRIGGER enforce_gender_slots
  BEFORE INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION check_gender_slots();
