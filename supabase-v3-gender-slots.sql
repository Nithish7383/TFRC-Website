-- ============================================================
-- TFRC v3 — Gender-based slots
-- Paste into Supabase SQL Editor and run
-- ============================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS max_male   int NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS max_female int NOT NULL DEFAULT 20;

ALTER TABLE events
  DROP COLUMN IF EXISTS max_participants;
