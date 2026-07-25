-- ============================================================
-- TFRC v2 Migration — paste into Supabase SQL Editor and run
-- ============================================================

-- 1. events table — new optional columns
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS registration_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS meeting_point_url     text,
  ADD COLUMN IF NOT EXISTS distance              text,
  ADD COLUMN IF NOT EXISTS pace_group            text;

-- 2. registrations table — new optional columns
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS admin_notes              text,
  ADD COLUMN IF NOT EXISTS attended                 boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS running_experience       text,
  ADD COLUMN IF NOT EXISTS emergency_contact_name  text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
