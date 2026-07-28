-- v8: Real file upload for admin photo management (gallery + event photos).
--
-- Before this, admins pasted an external image URL directly into
-- gallery_photos.image_url / event_photos.image_url. This migration adds a
-- Supabase Storage bucket so admins can upload files instead, and a
-- storage_path column on both tables so deletes can also remove the
-- uploaded file (not just the DB row) — without breaking existing rows,
-- which have arbitrary external URLs and no corresponding Storage object.
--
-- DEPENDS ON supabase-v7-member-auth.sql already being applied (this reuses
-- its is_admin() helper for the bucket's write policies).
--
-- MANUAL STEP REQUIRED — bucket creation:
-- Supabase does not support creating a Storage bucket via plain SQL in the
-- SQL editor (storage.buckets is managed through the Storage API/dashboard,
-- and directly INSERTing into storage.buckets works in principle but the
-- dashboard is the documented, supported way and avoids missing any
-- internal setup the API does for you). Create it manually first:
--   1. Supabase Dashboard → Storage → New bucket
--   2. Name: photos   (must match exactly — policies below reference it)
--   3. Public bucket: ON  (so images load on the live site without signed URLs)
--   4. File size limit: 5 MB   (matches the client-side check in the new
--      upload code — set both so a modified/bypassed client can't upload
--      arbitrarily large files)
--   5. Allowed MIME types: image/jpeg, image/png, image/webp
-- Then run the policies below (they attach to storage.objects, which
-- already exists — this part IS plain SQL).
--
-- Folder convention inside the bucket (enforced by app code, not SQL):
--   gallery/<uuid>-<filename>       — homepage gallery uploads
--   events/<event_id>/<uuid>-<filename>  — per-event photo uploads

-- 1. Track the Storage path alongside the public URL, nullable so existing
-- external-URL rows are unaffected.
ALTER TABLE gallery_photos ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE event_photos ADD COLUMN IF NOT EXISTS storage_path text;

-- 2. Storage policies for the "photos" bucket.
-- Public read (so <img> tags work for anonymous site visitors).
CREATE POLICY "Public can view photos bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

-- Upload/update/delete restricted to admins only, using the same
-- is_admin() check introduced in supabase-v7-member-auth.sql — NOT the bare
-- auth.role() = 'authenticated' pattern used elsewhere, because after v7,
-- logged-in members are also 'authenticated' and must not be able to write
-- here.
CREATE POLICY "Admins can upload to photos bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'photos' AND public.is_admin());

CREATE POLICY "Admins can update photos bucket"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'photos' AND public.is_admin())
  WITH CHECK (bucket_id = 'photos' AND public.is_admin());

CREATE POLICY "Admins can delete from photos bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'photos' AND public.is_admin());
