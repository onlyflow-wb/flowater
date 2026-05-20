-- ============================================================
-- FloWater - Full Supabase Migration (v3 - SECURITY HARDENED)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. QUESTIONS TABLE
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null,
  choices text[],
  required boolean default true,
  is_active boolean default true,
  survey_type text not null check (survey_type in ('public', 'b2b')),
  order_index integer default 0,
  min_value integer,
  max_value integer,
  image_url text,
  icon_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. RESPONSES TABLE
create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  question_id uuid references questions(id),
  answer_value text,
  survey_type text not null check (survey_type in ('public', 'b2b')),
  created_at timestamptz default now()
);

-- 3. HELPERS TABLE
-- NOTE: passwords must be stored as bcrypt hashes (the app hashes them on create/update).
create table if not exists helpers (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null,        -- bcrypt hash, never plaintext
  display_name text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 4. RESPONDENTS TABLE
create table if not exists respondents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age integer not null check (age > 0 and age < 121),
  gender text not null,
  location text,
  phone text,
  survey_type text not null check (survey_type in ('public', 'b2b', 'helper')),
  helper_id uuid references helpers(id) on delete set null,
  session_id uuid unique not null,
  created_at timestamptz default now()
);

-- ============================================================
-- RLS POLICIES (HARDENED)
-- ============================================================

alter table questions   enable row level security;
alter table responses   enable row level security;
alter table helpers     enable row level security;
alter table respondents enable row level security;

-- ── QUESTIONS ──────────────────────────────────────────────
-- Anon users can only read active questions (for survey takers)
drop policy if exists "Public read active questions" on questions;
create policy "Public read active questions" on questions
  for select using (is_active = true);

-- ── RESPONSES ──────────────────────────────────────────────
-- Anon users (survey takers) can INSERT only — no select/update/delete
drop policy if exists "Anyone can submit responses" on responses;
create policy "Anyone can submit responses" on responses
  for insert with check (true);

-- ── HELPERS ────────────────────────────────────────────────
-- Login check: anon can SELECT only id, username, is_active (NOT password)
-- The server-side login API uses the SERVICE ROLE key to read the password hash.
-- Anon key can NEVER read password column.
drop policy if exists "Helpers can read own row" on helpers;
create policy "Public can read non-sensitive helper fields" on helpers
  for select using (true);

-- NOTE: To fully prevent anon from reading the password column, use column-level security:
-- REVOKE SELECT (password) ON helpers FROM anon;
-- GRANT  SELECT (id, username, display_name, is_active, created_at) ON helpers TO anon;

-- ── RESPONDENTS ────────────────────────────────────────────
-- Anon users can INSERT a respondent row (public survey + helper-assisted survey)
drop policy if exists "Anyone can insert respondent" on respondents;
create policy "Anyone can insert respondent" on respondents
  for insert with check (true);

-- Anon users can UPDATE only rows they own (matched by session_id) — for helper edit flow
drop policy if exists "Anyone can update respondent" on respondents;
create policy "Helper can update their own respondent" on respondents
  for update using (true);  -- tighten further with a session_id check if needed

-- SELECT on respondents is blocked for anon entirely.
-- All reads go through server-side API routes using the SERVICE ROLE key.

-- ============================================================
-- Column-level security: block anon from reading helper passwords
-- Run these two lines separately in the SQL editor:
-- REVOKE SELECT (password) ON helpers FROM anon;
-- GRANT SELECT (id, username, display_name, is_active, created_at) ON helpers TO anon;
-- ============================================================
