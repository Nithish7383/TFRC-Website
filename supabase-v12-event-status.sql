-- v12: Manual event status for the homepage poster cards' 3-state CTA.
--
-- Admin-set per event (not auto-derived from slots/deadline), so an admin
-- can deliberately mark an event "closing_soon" for urgency messaging
-- independent of actual slot counts. Defaults to 'open' so existing events
-- keep working with no admin action required.

ALTER TABLE events ADD COLUMN IF NOT EXISTS status text
  CHECK (status IN ('open', 'closing_soon', 'not_open_yet'))
  DEFAULT 'open';
