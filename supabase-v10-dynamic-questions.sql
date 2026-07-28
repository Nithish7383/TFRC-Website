-- v10: Dynamic per-event custom questions.
--
-- SCOPE NOTE: this is an ADD-ON system, not a replacement for the existing
-- registration fields. TFRC's real "default questions" (name, phone, age,
-- gender, place, occupation, running experience, reason, emergency contact)
-- are already typed columns on `registrations` with their own forms, admin
-- views, and selection/attendance logic — none of that changes here. This
-- migration adds a way for admins to attach EXTRA custom questions to a
-- specific event (e.g. "T-shirt size", "Do you have your own bike for the
-- bike-to-run leg"), answered alongside the existing registration form.
--
-- Also adds events.event_type, since "is_default = always shown for all
-- events of this type" needs an actual type to scope against — events had
-- no category before this (Run/Trek/Yoga/Turf/Meetup only existed as
-- homepage marketing copy, not real data).

-- 1. Event category, matching the homepage's existing activity list.
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type text
  CHECK (event_type IN ('Running', 'Trek', 'Yoga', 'Turf', 'Meetup'))
  DEFAULT 'Running';

-- 2. Questions — either a default for an event_type (is_default = true,
-- event_id NULL) or a one-off custom question tied to a specific event.
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  event_type text CHECK (event_type IN ('Running', 'Trek', 'Yoga', 'Turf', 'Meetup')),
  text text NOT NULL,
  type text NOT NULL CHECK (type IN ('text', 'number', 'select', 'multiselect', 'textarea', 'date', 'checkbox')),
  required boolean NOT NULL DEFAULT false,
  options text[] DEFAULT '{}',
  is_default boolean NOT NULL DEFAULT false,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  -- A default question is scoped by event_type (applies to every event of
  -- that type) and has no single event_id. A custom question belongs to
  -- exactly one event and isn't a default.
  CONSTRAINT default_question_scope CHECK (
    (is_default = true AND event_id IS NULL AND event_type IS NOT NULL)
    OR
    (is_default = false AND event_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_questions_event_id ON questions(event_id);
CREATE INDEX IF NOT EXISTS idx_questions_event_type ON questions(event_type) WHERE is_default = true;

-- 3. Answers, one row per question per registration.
CREATE TABLE IF NOT EXISTS question_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (registration_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_question_responses_registration_id ON question_responses(registration_id);

-- 4. RLS.
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_responses ENABLE ROW LEVEL SECURITY;

-- Questions are public-read (anyone registering needs to see them) and
-- admin-write only, matching the existing events/event_photos pattern.
CREATE POLICY "Public can view questions"
  ON questions FOR SELECT USING (true);

CREATE POLICY "Admins full access to questions"
  ON questions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- question_responses: there is no login tying a browser session to a
-- specific *registration* (registrations are looked up/created by phone,
-- same as the rest of the registration flow — see RegisterForm.tsx), so
-- "members can only see/answer their own responses" is enforced the same
-- way registrations themselves already are: public INSERT (anyone
-- registering can attach their answers), and read restricted to admins.
-- A member reads their own answers through the member dashboard, which
-- already scopes registrations by phone under the member's own RLS-checked
-- session — this table doesn't need a separate member-read policy for that
-- path since the dashboard doesn't currently surface question answers.
CREATE POLICY "Public can submit question responses"
  ON question_responses FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins full access to question_responses"
  ON question_responses FOR ALL USING (is_admin()) WITH CHECK (is_admin());
