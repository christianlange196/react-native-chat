-- Supabase schema for react-native-chat
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  name text not null,
  about text default 'Available',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  group_name text default '',
  created_by uuid not null references public.profiles(id) on delete cascade,
  direct_pair_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_members (
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  deleted_at timestamptz,
  primary key (chat_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  text text default '',
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_members_user_deleted on public.chat_members(user_id, deleted_at);
create index if not exists idx_messages_chat_created_desc on public.messages(chat_id, created_at desc);
create index if not exists idx_chats_updated_desc on public.chats(updated_at desc);
create unique index if not exists idx_chats_direct_pair_unique on public.chats(direct_pair_key)
where direct_pair_key is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_chats_updated_at on public.chats;
create trigger set_chats_updated_at
before update on public.chats
for each row
execute function public.set_updated_at();

create or replace function public.refresh_chat_timestamp()
returns trigger
language plpgsql
as $$
begin
  update public.chats
  set updated_at = now()
  where id = new.chat_id;
  return new;
end;
$$;

drop trigger if exists set_chat_updated_from_message on public.messages;
create trigger set_chat_updated_from_message
after insert on public.messages
for each row
execute function public.refresh_chat_timestamp();

alter table public.profiles enable row level security;
alter table public.chats enable row level security;
alter table public.chat_members enable row level security;
alter table public.messages enable row level security;

create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "chat_members_select_own"
on public.chat_members
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.chat_members cm
    where cm.chat_id = chat_members.chat_id
      and cm.user_id = auth.uid()
      and cm.deleted_at is null
  )
);

create policy "chat_members_insert_by_member"
on public.chat_members
for insert
to authenticated
with check (
  exists (
    select 1
    from public.chat_members cm
    where cm.chat_id = chat_members.chat_id
      and cm.user_id = auth.uid()
      and cm.deleted_at is null
  )
  or auth.uid() = user_id
);

create policy "chat_members_update_by_member"
on public.chat_members
for update
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.chat_members cm
    where cm.chat_id = chat_members.chat_id
      and cm.user_id = auth.uid()
      and cm.role in ('admin', 'owner')
      and cm.deleted_at is null
  )
)
with check (true);

create policy "chats_select_member"
on public.chats
for select
to authenticated
using (
  exists (
    select 1
    from public.chat_members cm
    where cm.chat_id = chats.id
      and cm.user_id = auth.uid()
      and cm.deleted_at is null
  )
);

create policy "chats_insert_authenticated"
on public.chats
for insert
to authenticated
with check (created_by = auth.uid());

create policy "chats_update_member"
on public.chats
for update
to authenticated
using (
  exists (
    select 1
    from public.chat_members cm
    where cm.chat_id = chats.id
      and cm.user_id = auth.uid()
      and cm.deleted_at is null
  )
)
with check (true);

create policy "messages_select_member"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.chat_members cm
    where cm.chat_id = messages.chat_id
      and cm.user_id = auth.uid()
      and cm.deleted_at is null
  )
);

create policy "messages_insert_member"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.chat_members cm
    where cm.chat_id = messages.chat_id
      and cm.user_id = auth.uid()
      and cm.deleted_at is null
  )
);

create or replace function public.create_direct_chat(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  key_a text;
  key_b text;
  pair_key text;
  existing_chat uuid;
  new_chat uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if uid = other_user_id then
    key_a := uid::text;
    key_b := uid::text;
  else
    key_a := least(uid::text, other_user_id::text);
    key_b := greatest(uid::text, other_user_id::text);
  end if;

  pair_key := key_a || ':' || key_b;

  select id into existing_chat
  from public.chats
  where direct_pair_key = pair_key
  limit 1;

  if existing_chat is not null then
    update public.chat_members
    set deleted_at = null
    where chat_id = existing_chat
      and user_id in (uid, other_user_id);

    return existing_chat;
  end if;

  insert into public.chats(group_name, created_by, direct_pair_key)
  values ('', uid, pair_key)
  returning id into new_chat;

  insert into public.chat_members(chat_id, user_id, role)
  values
    (new_chat, uid, 'owner'),
    (new_chat, other_user_id, 'member')
  on conflict (chat_id, user_id) do update
  set deleted_at = null;

  return new_chat;
end;
$$;

create or replace function public.create_group_chat(group_name text, member_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_chat uuid;
  member_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.chats(group_name, created_by)
  values (coalesce(group_name, ''), uid)
  returning id into new_chat;

  insert into public.chat_members(chat_id, user_id, role)
  values (new_chat, uid, 'owner')
  on conflict (chat_id, user_id) do nothing;

  foreach member_id in array coalesce(member_ids, array[]::uuid[])
  loop
    if member_id <> uid then
      insert into public.chat_members(chat_id, user_id, role)
      values (new_chat, member_id, 'member')
      on conflict (chat_id, user_id) do update
      set deleted_at = null;
    end if;
  end loop;

  return new_chat;
end;
$$;

create or replace function public.hard_delete_chat_if_no_active_members(chat_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  active_count int;
begin
  select count(*) into active_count
  from public.chat_members
  where chat_members.chat_id = hard_delete_chat_if_no_active_members.chat_id
    and deleted_at is null;

  if active_count = 0 then
    delete from public.chats where id = hard_delete_chat_if_no_active_members.chat_id;
  end if;
end;
$$;

create or replace function public.soft_delete_chat_for_user(chat_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_members
  set deleted_at = now()
  where chat_members.chat_id = soft_delete_chat_for_user.chat_id
    and user_id = auth.uid();

  perform public.hard_delete_chat_if_no_active_members(chat_id);
end;
$$;

grant execute on function public.create_direct_chat(uuid) to authenticated;
grant execute on function public.create_group_chat(text, uuid[]) to authenticated;
grant execute on function public.soft_delete_chat_for_user(uuid) to authenticated;
grant execute on function public.hard_delete_chat_if_no_active_members(uuid) to authenticated;
