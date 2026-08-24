-- v15: Server-side enforcement that a paid event's registration actually
-- has a payment screenshot attached.
--
-- BUG FIXED: supabase-v14-paid-events.sql added the payment_screenshot_url
-- column and a client-side check in RegisterForm.tsx's handleSubmit, but
-- never added DB-level enforcement — the registrations table's INSERT
-- policy is `WITH CHECK (true)` (see supabase-v6-rls-fix.sql), so nothing
-- actually stopped a row from being inserted with payment_status='pending'
-- and no screenshot. In practice this let registrants slip through without
-- paying (confirmed in production: 4 of 5 registrants on a paid event had
-- no screenshot). A client-side-only check is not real enforcement — anyone
-- can insert directly via the anon key, bypassing the form entirely.
--
-- FIX: a BEFORE INSERT trigger, mirroring check_gender_slots() /
-- enforce_gender_slots exactly (same SECURITY DEFINER reasoning — the
-- trigger must read events.is_paid regardless of the inserting session's
-- RLS visibility, and the anon role has no SELECT policy on events beyond
-- is_active=true rows, which is unrelated here but the same class of
-- problem the gender-slot trigger already solved this way).
CREATE OR REPLACE FUNCTION check_payment_screenshot()
RETURNS TRIGGER AS $$
DECLARE
  event_is_paid boolean;
BEGIN
  SELECT is_paid INTO event_is_paid
  FROM events WHERE id = NEW.event_id;

  IF event_is_paid AND (NEW.payment_screenshot_url IS NULL OR NEW.payment_screenshot_url = '') THEN
    RAISE EXCEPTION 'Payment screenshot is required for this event';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_payment_screenshot ON registrations;
CREATE TRIGGER enforce_payment_screenshot
  BEFORE INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION check_payment_screenshot();
