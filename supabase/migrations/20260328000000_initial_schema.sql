-- ============================================================
-- Charta Alba — Initial Schema
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── papers ───────────────────────────────────────────────────
create table if not exists public.papers (
  id            text primary key,           -- arXiv ID e.g. "2401.12345"
  title         text        not null,
  abstract      text        not null,
  authors       text[]      not null default '{}',
  categories    text[]      not null default '{}',
  published_at  timestamptz not null,
  pdf_url       text        not null,
  arxiv_url     text        not null,
  created_at    timestamptz not null default now()
);

alter table public.papers enable row level security;

-- Everyone can read papers (public content)
create policy "papers_select_public"
  on public.papers for select
  using (true);

-- Only service role can insert/update (via seed script)
create policy "papers_insert_service"
  on public.papers for insert
  with check (auth.role() = 'service_role');

create policy "papers_update_service"
  on public.papers for update
  using (auth.role() = 'service_role');

-- ── cards ─────────────────────────────────────────────────────
create table if not exists public.cards (
  id                    uuid        primary key default uuid_generate_v4(),
  paper_id              text        not null references public.papers(id) on delete cascade,
  headline              text        not null,
  hook                  text        not null,
  body                  text        not null,
  tldr                  text        not null,
  tags                  text[]      not null default '{}',
  reading_time_seconds  int         not null check (reading_time_seconds between 15 and 90),
  created_at            timestamptz not null default now()
);

create index cards_paper_id_idx on public.cards(paper_id);
create index cards_created_at_idx on public.cards(created_at desc);

alter table public.cards enable row level security;

create policy "cards_select_public"
  on public.cards for select
  using (true);

create policy "cards_insert_service"
  on public.cards for insert
  with check (auth.role() = 'service_role');

-- ── profiles ──────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  username    text        unique not null,
  avatar_url  text,
  bio         text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_public"
  on public.profiles for select
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- ── likes ─────────────────────────────────────────────────────
create table if not exists public.likes (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  card_id    uuid        not null references public.cards(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, card_id)
);

create index likes_card_id_idx on public.likes(card_id);
create index likes_user_id_idx on public.likes(user_id);

alter table public.likes enable row level security;

create policy "likes_select_own"
  on public.likes for select
  using (auth.uid() = user_id);

create policy "likes_insert_own"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "likes_delete_own"
  on public.likes for delete
  using (auth.uid() = user_id);

-- ── bookmarks ─────────────────────────────────────────────────
create table if not exists public.bookmarks (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  card_id    uuid        not null references public.cards(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, card_id)
);

create index bookmarks_user_id_idx on public.bookmarks(user_id);

alter table public.bookmarks enable row level security;

create policy "bookmarks_select_own"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "bookmarks_insert_own"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "bookmarks_delete_own"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

-- ── follows ───────────────────────────────────────────────────
create table if not exists public.follows (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  category   text        not null,  -- arXiv category e.g. "cs.AI"
  created_at timestamptz not null default now(),
  unique (user_id, category)
);

create index follows_user_id_idx on public.follows(user_id);

alter table public.follows enable row level security;

create policy "follows_select_own"
  on public.follows for select
  using (auth.uid() = user_id);

create policy "follows_insert_own"
  on public.follows for insert
  with check (auth.uid() = user_id);

create policy "follows_delete_own"
  on public.follows for delete
  using (auth.uid() = user_id);

-- ── Auto-create profile on sign-up ────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
