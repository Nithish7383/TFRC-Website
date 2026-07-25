-- =============================================
-- First Rule Club — Running Club Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. EVENTS TABLE
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  max_participants int not null default 50,
  group_link text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. REGISTRATIONS TABLE
create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  age int not null,
  place text not null,
  phone text not null,
  gender text not null check (gender in ('Male', 'Female', 'Other')),
  occupation text not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'selected', 'rejected')),
  created_at timestamptz not null default now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS
alter table events enable row level security;
alter table registrations enable row level security;

-- Events: anyone can read active events
create policy "Public can read active events"
  on events for select
  using (is_active = true);

-- Events: admins (authenticated) can do everything
create policy "Admins full access to events"
  on events for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Registrations: anyone can insert
create policy "Public can register"
  on registrations for insert
  with check (true);

-- Registrations: admins can read/update all
create policy "Admins full access to registrations"
  on registrations for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- =============================================
-- SAMPLE DATA (optional, delete in production)
-- =============================================

insert into events (title, date, max_participants, group_link, is_active)
values
  ('Weekend 5K Morning Run', '2025-07-05', 30, 'https://chat.whatsapp.com/your-group-link', true),
  ('Sunday Long Run — 10K', '2025-07-13', 20, 'https://chat.whatsapp.com/your-group-link-2', true);
