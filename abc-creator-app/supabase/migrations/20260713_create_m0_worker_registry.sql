-- ABC Creator M0 worker registry
-- Apply this migration to the Supabase project used by ABC Creator.

create table if not exists public.m0_worker_registry (
  worker_name text primary key,
  public_url text not null,
  status text not null default 'ready'
    check (status in ('ready', 'offline')),
  slot_start_ist text not null,
  slot_stop_ist text not null,
  registered_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_health_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists m0_worker_registry_ready_idx
  on public.m0_worker_registry (status, expires_at desc, registered_at desc);

alter table public.m0_worker_registry enable row level security;

-- The registry is server-only. Browser clients must not read or write it.
revoke all on table public.m0_worker_registry from anon, authenticated;
grant all on table public.m0_worker_registry to service_role;
