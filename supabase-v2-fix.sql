-- ============================================================
-- TFRC v2 Fix — paste into Supabase SQL Editor and run
-- ============================================================

-- Step 1: Remove duplicate registrations (keep earliest per phone+event)
DELETE FROM registrations
WHERE id NOT IN (
  SELECT MIN(id) FROM registrations
  GROUP BY event_id, phone
);

-- Step 2: Add unique constraint so the database blocks future duplicates
ALTER TABLE registrations
ADD CONSTRAINT unique_phone_per_event
UNIQUE (event_id, phone);
