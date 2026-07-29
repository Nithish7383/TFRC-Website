-- v11: Minimal audit log for privileged admin actions performed via the
-- service-role client (which bypasses RLS, so Postgres-level policies can't
-- record who did what). First consumer: admin-assisted password resets
-- (app/admin/members/actions.ts resetMemberPassword), which stand in for
-- self-service phone/SMS OTP reset until an SMS provider is configured.
--
-- No UI to view this yet, per the ask — just make sure the action is
-- captured somewhere queryable. Does not touch supabase-schema.sql or any
-- existing RLS on members/registrations.

CREATE TABLE IF NOT EXISTS admin_actions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  admin_user_id uuid NOT NULL REFERENCES auth.users(id),
  admin_email text,
  target_member_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_log_target_member_id ON admin_actions_log(target_member_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_log_created_at ON admin_actions_log(created_at);

ALTER TABLE admin_actions_log ENABLE ROW LEVEL SECURITY;

-- Admin-only read (no UI reads it yet, but scope it correctly regardless);
-- writes only ever happen via the service-role client server-side, which
-- bypasses RLS entirely, so no INSERT policy is needed for the app to work —
-- this policy exists so an admin could query it directly in the Supabase
-- dashboard's SQL editor without hitting a permission wall.
CREATE POLICY "Admins can read admin_actions_log"
  ON admin_actions_log FOR SELECT
  USING (is_admin());
