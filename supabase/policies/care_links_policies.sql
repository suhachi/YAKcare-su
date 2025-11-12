-- Care link & invite schema hardening
-- Generated on 2025-11-08

-- Create invite table if it does not exist
create table if not exists public.care_link_invites (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  caregiver_id uuid not null,
  relation text,
  status text not null default 'PENDING',
  expires_at timestamptz not null,
  deep_link text,
  accepted_by uuid,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists care_link_invites_invite_code_idx on public.care_link_invites (invite_code);
create index if not exists care_link_invites_caregiver_idx on public.care_link_invites (caregiver_id);

-- Updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

alter table public.care_links
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists care_links_set_updated_at on public.care_links;
create trigger care_links_set_updated_at
before update on public.care_links
for each row execute procedure public.set_updated_at();

-- Enable RLS
alter table public.care_links enable row level security;
alter table public.care_link_invites enable row level security;

-- Care links policies
drop policy if exists care_links_select_member on public.care_links;
create policy care_links_select_member
on public.care_links
for select
using (
  auth.uid() = caregiver_id
  or auth.uid() = patient_id
);

drop policy if exists care_links_insert_patient on public.care_links;
create policy care_links_insert_patient
on public.care_links
for insert
with check (auth.uid() = patient_id);

drop policy if exists care_links_update_member on public.care_links;
create policy care_links_update_member
on public.care_links
for update
using (
  auth.uid() = caregiver_id
  or auth.uid() = patient_id
)
with check (
  auth.uid() = caregiver_id
  or auth.uid() = patient_id
);

drop policy if exists care_links_delete_member on public.care_links;
create policy care_links_delete_member
on public.care_links
for delete
using (
  auth.uid() = caregiver_id
  or auth.uid() = patient_id
);

-- Invite policies
drop policy if exists care_link_invites_select_owner on public.care_link_invites;
create policy care_link_invites_select_owner
on public.care_link_invites
for select
using (
  auth.uid() = caregiver_id
  or auth.uid() = accepted_by
);

drop policy if exists care_link_invites_insert_owner on public.care_link_invites;
create policy care_link_invites_insert_owner
on public.care_link_invites
for insert
with check (auth.uid() = caregiver_id);

drop policy if exists care_link_invites_update_owner_or_acceptor on public.care_link_invites;
create policy care_link_invites_update_owner_or_acceptor
on public.care_link_invites
for update
using (
  auth.uid() = caregiver_id
  or auth.uid() = accepted_by
)
with check (
  auth.uid() = caregiver_id
  or auth.uid() = accepted_by
);

drop policy if exists care_link_invites_delete_owner on public.care_link_invites;
create policy care_link_invites_delete_owner
on public.care_link_invites
for delete
using (auth.uid() = caregiver_id);

