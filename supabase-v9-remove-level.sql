-- v9: Remove the Level 1/2 member concept entirely.
--
-- The "level" gate (admins manually flipping a member from 1 to 2 to unlock
-- extended profile fields via /join/level2) is being removed. All members
-- can now fill in every profile field directly at signup or later via their
-- dashboard's Edit Profile screen — there is no longer a locked/unlocked
-- distinction.
--
-- Checked all supabase-v*.sql files for other references to `level` before
-- writing this: the only other place it appears is its own column
-- definition in supabase-v4-members-gallery.sql (`level int NOT NULL
-- DEFAULT 1 CHECK (level IN (1, 2))`). No RLS policy, trigger, or function
-- anywhere branches on its value — is_admin() and check_gender_slots() are
-- unrelated. So this is a plain column drop, nothing else to unwind.

ALTER TABLE members DROP COLUMN IF EXISTS level;
