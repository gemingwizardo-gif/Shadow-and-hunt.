create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  host_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby','active','finished')),
  started_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('hunter','shadow')),
  display_name text not null default 'Player',
  status text not null default 'active' check (status in ('active','captured','left')),
  lat double precision,
  lng double precision,
  accuracy double precision,
  updated_at timestamptz,
  created_at timestamptz not null default now(),
  unique(room_id,user_id),
  check (lat is null or (lat between -90 and 90)),
  check (lng is null or (lng between -180 and 180))
);

create index if not exists players_room_idx on public.players(room_id);
create index if not exists players_room_status_idx on public.players(room_id,status);
create index if not exists rooms_code_idx on public.rooms(code);

alter table public.rooms enable row level security;
alter table public.players enable row level security;

-- Browser clients cannot read room/player tables directly. All reads go through
-- authenticated server routes, which omit private GPS coordinates from rosters.
-- This prevents a Hunter from querying exact Shadow coordinates through PostgREST.

-- Writes are performed by server routes using the service role key.
-- No direct client insert/update/delete policies are intentionally granted.

alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.players;
