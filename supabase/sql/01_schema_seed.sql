-- Extensions
create extension if not exists "uuid-ossp";

-- Enums
create type role_type as enum ('owner', 'admin', 'member');
create type action_type as enum ('add','withdraw','return','adjust','trade_in','trade_out','import');
create type log_status as enum ('attempted','approved','rejected');
create type condition_type as enum ('new','good','fair','damaged');
create type priority_type as enum ('low','medium','high');

-- Teams
create table teams (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Profiles (extends auth.users)
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  role        role_type not null default 'member',
  team_id     uuid references teams(id),
  created_at  timestamptz not null default now()
);

-- Catalog
create table catalog_items (
  id          uuid primary key default uuid_generate_v4(),
  sku         text not null unique,
  part_id     text,
  name        text not null,
  unit_price  integer not null default 0,
  category    text,
  image_url   text,
  created_at  timestamptz not null default now()
);
create index catalog_search_idx on catalog_items using gin(
  to_tsvector('english', name || ' ' || sku || ' ' || coalesce(part_id,''))
);

-- Inventory (per team per item)
create table inventory (
  id               uuid primary key default uuid_generate_v4(),
  team_id          uuid not null references teams(id),
  catalog_item_id  uuid not null references catalog_items(id),
  quantity         integer not null default 0,
  threshold        integer not null default 5,
  room             text,
  updated_at       timestamptz not null default now(),
  unique(team_id, catalog_item_id)
);

-- Inventory logs (immutable audit trail)
create table inventory_logs (
  id               uuid primary key default uuid_generate_v4(),
  team_id          uuid not null references teams(id),
  catalog_item_id  uuid not null references catalog_items(id),
  user_id          uuid not null references profiles(id),
  action           action_type not null,
  quantity         integer not null,
  condition        condition_type,
  note             text,
  photo_url        text,
  status           log_status not null default 'attempted',
  created_at       timestamptz not null default now()
);

-- Wanted list
create table wanted_items (
  id               uuid primary key default uuid_generate_v4(),
  team_id          uuid not null references teams(id),
  catalog_item_id  uuid not null references catalog_items(id),
  quantity_needed  integer not null default 1,
  priority         priority_type not null default 'medium',
  note             text,
  created_at       timestamptz not null default now()
);

-- Event prep checklists
create table checklist_items (
  id          uuid primary key default uuid_generate_v4(),
  team_id     uuid references teams(id),
  label       text not null,
  checked     boolean not null default false,
  event_name  text,
  created_at  timestamptz not null default now()
);

-- BOM (Bill of Materials)
create table bom_items (
  id               uuid primary key default uuid_generate_v4(),
  team_id          uuid not null references teams(id),
  catalog_item_id  uuid not null references catalog_items(id),
  quantity_needed  integer not null default 1,
  bom_name        text not null,
  created_at       timestamptz not null default now()
);

-- Monthly cycle counts
create table cycle_counts (
  id          uuid primary key default uuid_generate_v4(),
  team_id     uuid not null references teams(id),
  month       date not null,
  completed   boolean not null default false,
  notes       text,
  created_at  timestamptz not null default now(),
  unique(team_id, month)
);

-- In-app notifications
create table notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id),
  title       text not null,
  body        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Seed: 7 teams
insert into teams (name) values
  ('98601A'),('98601B'),('98601C'),('98601D'),('98601E'),('98601X'),('98601Y');

-- Trigger: auto-create profile on auth.users insert
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, role)
  values (new.id, new.email, 'member');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Trigger: update inventory.updated_at on row update
create or replace function touch_inventory()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger inventory_updated
  before update on inventory
  for each row execute function touch_inventory();

-- RPC: process_withdrawal — atomic deduct + log
create or replace function process_withdrawal(
  p_team_id uuid,
  p_catalog_item_id uuid,
  p_quantity int,
  p_user_id uuid,
  p_condition text,
  p_note text,
  p_photo_url text
) returns json language plpgsql security definer as $$
declare
  v_current int;
begin
  select quantity into v_current
  from inventory
  where team_id = p_team_id and catalog_item_id = p_catalog_item_id
  for update;

  if v_current is null or v_current < p_quantity then
    raise exception 'Insufficient stock: % available', coalesce(v_current, 0);
  end if;

  update inventory
  set quantity = quantity - p_quantity
  where team_id = p_team_id and catalog_item_id = p_catalog_item_id;

  insert into inventory_logs(team_id, catalog_item_id, user_id, action, quantity, condition, note, photo_url, status)
  values(p_team_id, p_catalog_item_id, p_user_id, 'withdraw', p_quantity,
         p_condition::condition_type, p_note, p_photo_url, 'attempted');

  return json_build_object('success', true);
end;
$$;

-- RPC: process_return — atomic add + log
create or replace function process_return(
  p_team_id uuid,
  p_catalog_item_id uuid,
  p_quantity int,
  p_user_id uuid,
  p_condition text,
  p_note text
) returns json language plpgsql security definer as $$
begin
  update inventory
  set quantity = quantity + p_quantity
  where team_id = p_team_id and catalog_item_id = p_catalog_item_id;

  insert into inventory_logs(team_id, catalog_item_id, user_id, action, quantity, condition, note, status)
  values(p_team_id, p_catalog_item_id, p_user_id, 'return', p_quantity,
         p_condition::condition_type, p_note, 'attempted');

  return json_build_object('success', true);
end;
$$;

-- RPC: process_trade — atomic transfer between teams + logs
create or replace function process_trade(
  p_from_team_id uuid,
  p_to_team_id uuid,
  p_catalog_item_id uuid,
  p_quantity int,
  p_user_id uuid,
  p_note text
) returns json language plpgsql security definer as $$
declare
  v_current int;
begin
  select quantity into v_current
  from inventory
  where team_id = p_from_team_id and catalog_item_id = p_catalog_item_id
  for update;

  if v_current is null or v_current < p_quantity then
    raise exception 'Insufficient stock for trade';
  end if;

  update inventory
  set quantity = quantity - p_quantity
  where team_id = p_from_team_id and catalog_item_id = p_catalog_item_id;

  insert into inventory(team_id, catalog_item_id, quantity, threshold)
  values(p_to_team_id, p_catalog_item_id, p_quantity, 5)
  on conflict(team_id, catalog_item_id)
  do update set quantity = inventory.quantity + excluded.quantity;

  insert into inventory_logs(team_id, catalog_item_id, user_id, action, quantity, note, status)
  values
    (p_from_team_id, p_catalog_item_id, p_user_id, 'trade_out', p_quantity, p_note, 'attempted'),
    (p_to_team_id,   p_catalog_item_id, p_user_id, 'trade_in',  p_quantity, p_note, 'attempted');

  return json_build_object('success', true);
end;
$$;
