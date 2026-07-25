-- Database-level trigger to enforce gender slot limits on every INSERT.
-- Run this in the Supabase SQL Editor.

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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_gender_slots ON registrations;
CREATE TRIGGER enforce_gender_slots
  BEFORE INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION check_gender_slots();
