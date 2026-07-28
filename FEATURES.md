# The First Rule Club — Features & Functionality

This document describes the current features and functionality implemented in the TFRC website, based on the actual codebase (Next.js 14 App Router + Supabase).

---

## 1. Overview

The site serves **The First Rule Club (TFRC)**, a running community (based in Madurai). It combines:

- A public marketing/landing site with a photo gallery
- A **member system**: join → get a unique Member ID (e.g. `TFRC0001`) → phone-based "login" → personal dashboard → self-service event registration
- A **guest/public event registration flow** (which is actually member-gated)
- A full **admin back-office**: dashboard, event management, registration triage, member management & merging, site content editing, and photo gallery management

**Tech stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Supabase Auth). No ORM — all data access goes through the Supabase client directly, secured by Postgres Row Level Security (RLS) policies. No custom REST API layer beyond a single legacy route.

---

## 2. Public Pages

| Page | Purpose |
|---|---|
| `/` | Landing page — hero, "why we started," activities offered (Running/Treks/Yoga/Turf/Meetups), homepage photo gallery preview, live member count stat, social links, optional admin-configured "Featured Event" banner, rotating "Member Voices" testimonials. |
| `/join` | New member sign-up form. Collects name, phone, age, gender, place, occupation, running experience, goals, optional emergency contact & medical info. Blocks duplicate joins by phone. Assigns a Member ID automatically and redirects to the welcome page. |
| `/join/welcome` | Post-join confirmation — displays the new Member ID, links to the member dashboard, WhatsApp community, and Instagram. |
| `/join/level2` | Optional extended profile form (Instagram handle, photo, birthday, height/weight, running pace, training days/week, interests) — only unlocked once an admin manually upgrades the member to "Level 2." |
| `/login` | Member "login" — enter your phone number to be looked up and redirected to your member dashboard. (No password; see Security Notes.) |
| `/member/[id]` | **Member dashboard** — the richest public page. Shows loyalty tier (Rookie/Rising/Regular/Elite based on runs attended), attendance streak, upcoming events with inline self-registration, recent registration history, club-wide stats, a top-5 leaderboard, a motivational quote, and profile badges. |
| `/register` | Public event registration form. Requires the phone number to match an existing member (pre-fills their profile if so); otherwise prompts to join first. Shows live gender-based slot availability, collects reasons for joining and optional emergency contact info, and enforces per-gender slot caps and duplicate-registration prevention. |
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
| `/admin/members` | **Member management** — searchable/filterable table (by level, gender, experience), CSV export, expandable rows with full profile/emergency/medical detail, one-click "Upgrade to Level 2," and duplicate detection with a **merge** flow (combines registrations and attendance counts, keeps the better profile, deletes the duplicate). |
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
| `members` | The club roster: auto-generated Member ID (`TFRCxxxx`) and number, full profile, goals, Level 1/2 flag, lifetime `attended_count`, and (for Level 2) extended fields like Instagram, pace, training days, interests. |
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
- **Member "login" is not authenticated** — `/login` and the member dashboard rely purely on knowing a phone number / Member ID, since member records are publicly readable via RLS. There is no password or session tied to a specific member. This is a reasonable tradeoff for a low-stakes community site, but worth knowing if member data ever includes anything sensitive.
- No custom REST API layer exists apart from one legacy route (`/api/events/toggle`); nearly all reads/writes go directly through the Supabase client from Server or Client Components.

---

## 6. Known Gaps / Legacy Items

- `types/index.ts` contains an older, unused type definition (pre-dates the member system and gender-slot model) — dead code, safe to remove.
- No `.env.local.example` file exists despite the README referencing one.
- No automated tests (no Jest/Vitest/Playwright configured).
- Images are unoptimized (`next.config.js` disables Next Image optimization) since photo URLs are arbitrary external links entered by admins.
- "Weekly Challenge" on the member dashboard is a placeholder ("Coming Soon") — not yet implemented.
