-- Amber community tables. Run this once in Supabase SQL Editor.
-- Public browsing is permitted. Every write requires an authenticated user,
-- and every poll vote is unique per (post_id, authenticated user_id).
-- This prevents duplicate votes BY THE SAME ACCOUNT, not multiple real-life identities.
-- No real tokens, donations, phone verification or identity uniqueness are claimed.
create extension if not exists pgcrypto;

create table if not exists public.amber_posts (
  id text primary key check(char_length(id) between 8 and 100),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nickname text not null default 'Mitglied' check(char_length(nickname) between 2 and 40),
  type text not null check(type in ('poll','discussion')),
  category text not null check(char_length(category) between 2 and 40),
  title text not null check(char_length(title) between 10 and 240),
  body text not null default '' check(char_length(body)<=4000),
  options text[] not null default '{}'::text[] check(array_length(options,1) is null or array_length(options,1) between 2 and 5),
  created_at timestamptz not null default now()
);
create index if not exists amber_posts_created on public.amber_posts(created_at desc);

create table if not exists public.amber_votes (
  post_id text not null check(char_length(post_id) between 1 and 100),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  choice smallint not null check(choice between 0 and 4),
  created_at timestamptz not null default now(),
  primary key(post_id,user_id)
);
create index if not exists amber_votes_user on public.amber_votes(user_id);

create table if not exists public.amber_comments (
  id text primary key check(char_length(id) between 8 and 100),
  post_id text not null check(char_length(post_id) between 1 and 100),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nickname text not null default 'Mitglied' check(char_length(nickname) between 2 and 40),
  body text not null check(char_length(body) between 2 and 2000),
  parent_id text check(parent_id is null or char_length(parent_id)<=100),
  created_at timestamptz not null default now()
);
create index if not exists amber_comments_post on public.amber_comments(post_id,created_at);

create table if not exists public.amber_followups (
  id text primary key check(char_length(id) between 8 and 100),
  post_id text not null check(char_length(post_id) between 1 and 100),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check(char_length(body) between 10 and 400),
  created_at timestamptz not null default now()
);
create index if not exists amber_followups_post on public.amber_followups(post_id);

create table if not exists public.amber_followup_votes (
  post_id text not null check(char_length(post_id) between 1 and 100),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question_id text not null check(char_length(question_id) between 1 and 100),
  created_at timestamptz not null default now(),
  primary key(post_id,user_id)
);

create table if not exists public.amber_likes (
  post_id text not null check(char_length(post_id) between 1 and 100),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(post_id,user_id)
);

create table if not exists public.amber_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  target_type text not null check(target_type in ('post','comment')),
  target_id text not null check(char_length(target_id) between 1 and 100),
  reason text not null default 'Zur Überprüfung gemeldet' check(char_length(reason) between 1 and 300),
  created_at timestamptz not null default now()
);

alter table public.amber_posts enable row level security;
alter table public.amber_votes enable row level security;
alter table public.amber_comments enable row level security;
alter table public.amber_followups enable row level security;
alter table public.amber_followup_votes enable row level security;
alter table public.amber_likes enable row level security;
alter table public.amber_reports enable row level security;

-- Explicit privilege reduction: anon can only read publicly intended content.
revoke all on public.amber_posts,public.amber_votes,public.amber_comments,public.amber_followups,public.amber_followup_votes,public.amber_likes,public.amber_reports from anon,authenticated;
grant usage on schema public to anon,authenticated;
grant select on public.amber_posts,public.amber_comments,public.amber_followups to anon,authenticated;
grant insert on public.amber_posts,public.amber_comments,public.amber_followups,public.amber_votes,public.amber_followup_votes,public.amber_likes,public.amber_reports to authenticated;
grant select on public.amber_votes,public.amber_followup_votes,public.amber_likes,public.amber_reports to authenticated;
grant update on public.amber_followup_votes to authenticated;
grant delete on public.amber_likes to authenticated;

create policy "amber posts public read" on public.amber_posts for select to anon,authenticated using (true);
create policy "amber posts author insert" on public.amber_posts for insert to authenticated with check ((select auth.uid())=user_id);
create policy "amber comments public read" on public.amber_comments for select to anon,authenticated using (true);
create policy "amber comments author insert" on public.amber_comments for insert to authenticated with check ((select auth.uid())=user_id);
create policy "amber followups public read" on public.amber_followups for select to anon,authenticated using (true);
create policy "amber followups author insert" on public.amber_followups for insert to authenticated with check ((select auth.uid())=user_id);
create policy "amber vote own read" on public.amber_votes for select to authenticated using ((select auth.uid())=user_id);
create policy "amber vote once per account" on public.amber_votes for insert to authenticated with check ((select auth.uid())=user_id);
create policy "amber followup choice own read" on public.amber_followup_votes for select to authenticated using ((select auth.uid())=user_id);
create policy "amber followup choice own insert" on public.amber_followup_votes for insert to authenticated with check ((select auth.uid())=user_id);
create policy "amber followup choice own update" on public.amber_followup_votes for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "amber like own read" on public.amber_likes for select to authenticated using ((select auth.uid())=user_id);
create policy "amber like own insert" on public.amber_likes for insert to authenticated with check ((select auth.uid())=user_id);
create policy "amber like own delete" on public.amber_likes for delete to authenticated using ((select auth.uid())=user_id);
create policy "amber reports private read" on public.amber_reports for select to authenticated using ((select auth.uid())=reporter_id);
create policy "amber reports author insert" on public.amber_reports for insert to authenticated with check ((select auth.uid())=reporter_id);

-- Moderation reports are only readable privately by the reporter and the
-- Supabase project administrator. Do not publish a mass community launch
-- without a moderation team, deletion controls, abuse-rate-limits and review process.
