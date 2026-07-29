# The First Rule Club — Features & Functionality

This document describes the current features and functionality implemented in the TFRC website, based on the actual codebase (Next.js 14 App Router + Supabase).

---

## 1. Overview

The site serves **The First Rule Club (TFRC)**, a running community (based in Madurai). It combines:

- A public marketing/landing site with a photo gallery
- A **member system**: join → get a unique Member ID (e.g. `TFRC0001`) → phone+password login → register for events inline from the homepage. There is no personal dashboard — login exists only to gate identity for registration, not to show a member their own stats.
- A **guest/public event registration flow** (which is actually member-gated)
- A full **admin back-office**: dashboard, event management, registration triage, member management & merging, site content editing, and photo gallery management

**Tech stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Supabase Auth). No ORM — all data access goes through the Supabase client directly, secured by Postgres Row Level Security (RLS) policies. No custom REST API layer beyond a single legacy route.

---

## 2. Public Pages

| Page | Purpose |
|---|---|
| `/` | Landing page — hero, an "Upcoming Events" section (each event has a Register button that opens an inline login modal for logged-out visitors, or an inline confirm card for a logged-in member — no page navigation), "why we started," activities offered (Running/Treks/Yoga/Turf/Meetups), homepage photo gallery preview, live member count stat, social links, optional admin-configured "Featured Event" banner, rotating "Member Voices" testimonials. |
| `/join` | New member sign-up form. Collects name, phone, age, gender, place, occupation, running experience, goals, a password, plus optional emergency contact/medical info and extended profile fields (Instagram, photo, birthday, height/weight, pace, training days, interests). Blocks duplicate joins by phone. Assigns a Member ID automatically, creates the member's login, and redirects to the welcome page. |
| `/join/welcome` | Post-join confirmation — displays the new Member ID, links back to the homepage to browse events, WhatsApp community, and Instagram. |
| `/login` | Member login — phone number + password (first-time members without a password yet are prompted to set one). Redirects to the homepage on success. This same phone+password flow is also available inline as a modal directly on the homepage's event cards. |
| `/register` | Public event registration form. Requires the phone number to match an existing member (pre-fills their profile if so); otherwise prompts to join first. Shows live gender-based slot availability, collects reasons for joining and optional emergency contact info, and enforces per-gender slot caps and duplicate-registration prevention. Kept as a separate standalone entry point alongside the homepage's inline flow. |
| `/confirmation` | Success page shown after registering for an event via `/register`, with next-step guidance and links to check status, join WhatsApp, or register for another event. |
| `/status` | Registration status lookup by phone number — shows pending/selected/rejected status per event, WhatsApp group link if selected, and a "register for next event" prompt if rejected. |
| `/gallery` | Full photo gallery, grouped by event, pulling photos an admin has uploaded per event. |

---

## 3. Admin Back-Office (`/admin/*`)

Protected by Supabase Auth (email/password) — both via `middleware.ts` route protection and a second per-page auth check. Admin accounts are created manually in the Supabase dashboard (no self-signup UI).

| Page | Capabilities |
|---|---|
| `/admin/login` | Email/password sign-in. |
| `/admin` | **Dashboard** — next upcoming event with slot fill and countdown; member stats (total, joined this week, "never showed up"); engagement stats (unique registrants, total attendance); recent joins; a "Needs Attention" panel (events with pending registrations, duplicate members, events missing a cover image); create-event form; full event list. |
| `/admin/members` | **Member management** — searchable/filterable table (by gender, experience), CSV export, expandable rows with full profile/emergency/medical detail, and duplicate detection with a **merge** flow (combines registrations and attendance counts, keeps the better profile, deletes the duplicate). |
| `/admin/settings` | **Site content editor** — community stat number, social links (WhatsApp/Instagram/YouTube), featured-event banner, three homepage testimonial quotes, and the homepage photo gallery manager. |
| `/admin/event/[id]` | **Event & registrations management** — event details, stat cards (total/pending/selected/rejected/attended), gender slot progress bars, filters by gender/age, a WhatsApp outreach tool (see below), the registrations table, and per-event photo gallery management. |

### Notable admin tools
- **Auto-select runners** — three strategies (first-registered, gender-balanced, experience-mix) to automatically mark registrations as "selected" up to an event's capacity.
- **Attendance tracking** — marking a registration "attended" automatically updates that member's lifetime `attended_count` (and creates a member record if the attendee wasn't already one).
- **WhatsApp outreach tool** — generates a message template and can auto-cycle through opening a `wa.me` link for each selected participant one at a time (with pause/resume/progress), since there's no WhatsApp Business API integration.
- **Event cloning** — duplicate an existing event's settings (slots, distance, pace, links) into a new draft event, useful for recurring runs.
- **CSV export** — available for both the members table and the registrations table.

---

## 4. Data Model (Supabase / PostgreSQL)

| Table | Purpose |
|---|---|
| `events` | Title, date, male/female slot limits, WhatsApp group link, active flag, distance, pace group, registration deadline, meeting point URL, cover image. |
| `registrations` | Per-event sign-ups: name, age, gender, place, occupation, phone, reason, status (`pending`/`selected`/`rejected`), attended flag, admin notes, emergency contact. |
| `members` | The club roster: auto-generated Member ID (`TFRCxxxx`) and number, full profile (goals, emergency contact, medical info, Instagram, pace, training days, interests, etc.), lifetime `attended_count`, linked Auth user for login. |
| `event_photos` | Photos attached to a specific event, shown on `/gallery`. |
| `gallery_photos` | Homepage gallery photos, managed independently of events. |
| `site_settings` | Key/value store powering homepage content: community stat, social links, featured-event banner, testimonial quotes. |

**Server-side safeguards:**
- A Postgres trigger (`check_gender_slots`, `SECURITY DEFINER`) enforces per-gender slot caps on registration insert, in addition to client-side checks.
- A unique constraint on `(event_id, phone)` in `registrations` prevents duplicate sign-ups for the same event.
- Row Level Security policies gate all reads/writes — public can read active events/members/photos and insert registrations/members; only authenticated (admin) users can write to everything else.

---

## 5. Authentication & Security Notes

- **Admin auth** is real: Supabase Auth (email/password) with session cookies, refreshed via `middleware.ts`, and re-checked on every admin page.
- **Member auth is real**: phone + password via Supabase Auth (a synthetic `{phone}@members.tfrc.local` address is used as the Auth identifier, since Supabase requires an email-shaped one). Members RLS restricts a logged-in member to reading/updating only their own row (`auth.uid() = members.auth_user_id`). There is intentionally no member-facing dashboard — login exists only to gate identity for event registration, not to expose stats to the member.
- "Forgot password" is admin-assisted (an admin resets a member's password from `/admin/members`), not self-service SMS/OTP — this project has no SMS provider (e.g. Twilio) configured, which real phone-OTP reset would require.
- No custom REST API layer exists apart from one legacy route (`/api/events/toggle`); nearly all reads/writes go directly through the Supabase client from Server or Client Components.

---

## 6. Known Gaps / Legacy Items

- `types/index.ts` contains an older, unused type definition (pre-dates the member system and gender-slot model) — dead code, safe to remove.
- No `.env.local.example` file exists despite the README referencing one.
- No automated tests (no Jest/Vitest/Playwright configured).
- Images are unoptimized (`next.config.js` disables Next Image optimization) since photo URLs are arbitrary external links entered by admins.
- Members cannot self-edit their profile after joining (no dashboard, no edit-profile page) — only an admin can update a member's details, via `/admin/members`.
