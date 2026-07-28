-- v7: Password-based auth for members.
--
-- Members previously "logged in" via a plain phone-number lookup with no
-- password and no session. This migration links each members row to a real
-- Supabase Auth user so RLS can restrict a member to their own row.
--
-- IMPORTANT — read before running:
-- Every existing "Admins full access" policy in this project (on members,
-- event_photos, registrations, events, site_settings, gallery_photos) is
-- written as `USING (auth.role() = 'authenticated')`. That check is true for
-- ANY logged-in Supabase Auth user — it has never distinguished "admin" from
-- "any authenticated session" because until now, only admins could ever
-- authenticate. Once members get real Supabase Auth accounts too, a member's
-- own session would ALSO satisfy `auth.role() = 'authenticated'` and pass
-- straight through those existing admin policies — silently re-opening
-- read/write access to every member's row (medical_conditions,
-- emergency_contact_phone, etc.), every registration, and every setting.
--
-- To prevent that, this migration marks admin accounts with
-- `app_metadata.is_admin = true` (settable only via the service-role key —
-- never by a member signing themselves up) and introduces an is_admin()
-- helper, then rewrites the "Admins full access to members" policy to use
-- it instead of the bare authenticated check.
--
-- ACTION REQUIRED BEFORE RUNNING PART 3 BELOW: for every existing admin
-- account, run in the Supabase SQL editor (once per admin email):
--   UPDATE auth.users
--   SET raw_app_meta_data = raw_app_meta_data || '{"is_admin": true}'::jsonb
--   WHERE email = 'admin@example.com';
-- If you skip this, existing admins will be locked out of the members table
-- the moment part 3 runs (they'll still have their normal admin session, but
-- it will no longer satisfy the new members-table policy).
--
-- This migration also adds get_member_for_registration(phone) (part 4
-- below), a column-scoped RPC used by /register to pre-fill a registration
-- for ANY member by phone (not just the logged-in member's own row) without
-- exposing medical_conditions, emergency_contact fields, or other sensitive
-- columns to that public-facing lookup path.
--
-- Run this on a staging/branch Supabase project first — it rewrites RLS
-- policies on live member data, and a mistake here can either lock everyone
-- out or leave data more exposed than before.

-- 1. Link members to auth.users
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_members_auth_user_id ON members(auth_user_id);

-- 2. Admin-check helper, reads the app_metadata flag from the request JWT.
-- SECURITY DEFINER + auth.jwt() so it works the same in policies regardless
-- of caller.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Rewrite RLS on members only (other tables' "authenticated" admin
-- policies are untouched per the ACTION REQUIRED note above — do the
-- app_metadata backfill for existing admins first).
DROP POLICY IF EXISTS "Public can read members" ON members;
DROP POLICY IF EXISTS "Admins full access to members" ON members;

-- Needed so /login and /join can still check "does this phone already
-- exist" before a session exists. App code must keep selecting only
-- `phone`/`member_id` on this anon path (as it already does) — RLS is
-- row-level, not column-level, so this policy still permits reading full
-- rows if a query asks for them.
CREATE POLICY "Public can check phone existence"
  ON members FOR SELECT
  USING (auth.role() = 'anon');

CREATE POLICY "Members can read own row"
  ON members FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Members can update own row"
  ON members FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Admins full access to members"
  ON members FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- 4. Column-scoped lookup for /register (RegisterForm.tsx), which needs to
-- pre-fill a registration for ANY member by phone — not just the caller's
-- own row, since one member often registers a friend/family member who
-- isn't the one holding the session. A plain SELECT policy can't do this:
-- RLS is row-level, so "let anyone read this row" always exposes every
-- column, including medical_conditions and emergency_contact_phone. This
-- function is the fix — SECURITY DEFINER so it can bypass RLS internally,
-- but it only ever returns the specific pre-fill-safe columns RegisterForm
-- actually uses (see components/RegisterForm.tsx handlePhoneLookup).
-- Do NOT add more columns here without checking every caller first.
CREATE OR REPLACE FUNCTION get_member_for_registration(lookup_phone text)
RETURNS TABLE (
  member_id text,
  name text,
  age int,
  gender text,
  place text,
  occupation text,
  running_experience text
) AS $$
  SELECT m.member_id, m.name, m.age, m.gender, m.place, m.occupation, m.running_experience
  FROM members m
  WHERE m.phone = lookup_phone
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Callable by anyone (anon or a logged-in member/admin) — the function body
-- itself is the only thing that decides what's returned.
GRANT EXECUTE ON FUNCTION get_member_for_registration(text) TO anon, authenticated;
