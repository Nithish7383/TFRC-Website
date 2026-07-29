-- v13: Storage bucket for admin-uploaded hero background videos.
--
-- The homepage hero needs two video files (mobile-portrait crop and
-- desktop-landscape crop of the same footage) — admin uploads them from
-- /admin/settings, stored in site_settings as hero_video_mobile_url /
-- hero_video_desktop_url, same key/value pattern as every other homepage
-- setting (whatsapp_link, featured_event_*, etc.). Videos are not yet
-- provided at the time of this migration — the settings simply stay empty
-- until an admin uploads them, and the hero falls back to the existing
-- photo background when they're unset (see components/HeroVideo.tsx).
--
-- Same bucket-creation caveat as supabase-v8-photo-storage.sql: Supabase
-- Storage buckets are created via the Dashboard/API, not plain SQL.
--
-- MANUAL STEP REQUIRED — bucket creation:
--   1. Supabase Dashboard → Storage → New bucket
--   2. Name: videos   (must match exactly — policies below reference it)
--   3. Public bucket: ON  (so <video> tags load without signed URLs)
--   4. File size limit: 100 MB (hero videos are large; adjust if your
--      actual footage needs more — Supabase's free-tier project storage
--      quota is the real ceiling to watch, not this setting)
--   5. Allowed MIME types: video/mp4, video/webm
-- Then run the policies below (they attach to storage.objects, which
-- already exists).
--
-- Folder convention inside the bucket (enforced by app code, not SQL):
--   hero/<uuid>.<ext>

CREATE POLICY "Public can view videos bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos');

CREATE POLICY "Admins can upload to videos bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'videos' AND public.is_admin());

CREATE POLICY "Admins can update videos bucket"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'videos' AND public.is_admin())
  WITH CHECK (bucket_id = 'videos' AND public.is_admin());

CREATE POLICY "Admins can delete from videos bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'videos' AND public.is_admin());
