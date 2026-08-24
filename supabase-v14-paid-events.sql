-- v14: Paid events — per-event price, payment-screenshot upload, and admin
-- payment verification.
--
-- Adds a parallel path alongside free events: an admin marks an event paid
-- with a price, registrants pay via a site-wide QR code (stored in
-- site_settings, no schema change needed for that) and upload a payment
-- screenshot as part of registering, and an admin verifies that screenshot
-- independently of the existing selected/rejected registration status.
--
-- payment_status is deliberately a separate text+check column (mirroring
-- registrations.status / events.status) rather than a boolean on
-- registrations — status answers "are they in," payment_status answers
-- "did they pay," and a boolean can't cleanly express "not applicable"
-- (free event) vs "awaiting review" vs "rejected" (e.g. blurry screenshot).
-- Defaults to 'not_required' so every existing/free-event row needs no
-- special-casing — app code must always check events.is_paid before relying
-- on payment_status, since a paid event's row starts at 'pending', not
-- 'not_required'.
--
-- No change needed to the enforce_gender_slots trigger (supabase-v5 /
-- supabase-v6-rls-fix.sql) — slot capacity and payment are orthogonal; a
-- pending-payment registration still occupies its gender slot.
--
-- MANUAL STEP REQUIRED — bucket creation (same constraint as
-- supabase-v8-photo-storage.sql: Storage buckets aren't created via plain
-- SQL in the SQL editor):
--   1. Supabase Dashboard → Storage → New bucket
--   2. Name: payment-screenshots   (must match exactly — policies below reference it)
--   3. Public bucket: ON
--   4. File size limit: 5 MB   (matches the client-side check in lib/photo-upload.ts)
--   5. Allowed MIME types: image/jpeg, image/png, image/webp
-- Then run the policies below.
--
-- This is a NEW bucket, not a reuse of the existing "photos" bucket, because
-- "photos" is admin-write-only (see v8) — registrants are anonymous, so they
-- can never satisfy is_admin(). Keeping payment screenshots in their own
-- bucket keeps that trust boundary (admin-curated marketing/event imagery
-- vs. anonymous payment-proof uploads) from ever being blurred by a future
-- policy edit on "photos".
--
-- Folder convention inside the bucket (enforced by app code, not SQL):
--   payments/<uuid>.<ext>   — no per-event subfolder needed; each screenshot
--   is already linked to its event via registrations.event_id.

-- 1. events — paid-event flag + price.
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS price_inr integer;

-- 2. registrations — payment screenshot + verification state.
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS payment_screenshot_url text;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS payment_screenshot_path text;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS payment_status text
  NOT NULL DEFAULT 'not_required'
  CHECK (payment_status IN ('not_required', 'pending', 'verified', 'rejected'));

-- 3. Storage policies for the "payment-screenshots" bucket.
-- Public read — the admin verification UI (and the registrant's own browser
-- right after upload) loads the image via its public URL, same as every
-- other image on the site.
CREATE POLICY "Public can view payment screenshots bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-screenshots');

-- Anonymous registrants can INSERT only — never SELECT-list, UPDATE, or
-- DELETE others' files. This is intentionally looser than the "photos"
-- bucket (admin-only INSERT) because uploads here happen from an
-- unauthenticated registration flow, mirroring how "Public can register"
-- already allows anon INSERT into the registrations table itself
-- (supabase-schema.sql).
CREATE POLICY "Public can upload payment screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-screenshots');

-- Admins can update/delete (e.g. cleanup), same is_admin() gate as the
-- photos bucket.
CREATE POLICY "Admins can update payment screenshots bucket"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'payment-screenshots' AND public.is_admin())
  WITH CHECK (bucket_id = 'payment-screenshots' AND public.is_admin());

CREATE POLICY "Admins can delete payment screenshots bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'payment-screenshots' AND public.is_admin());
