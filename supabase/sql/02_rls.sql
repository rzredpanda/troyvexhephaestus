-- Enable RLS on all tables
alter table teams            enable row level security;
alter table profiles         enable row level security;
alter table catalog_items    enable row level security;
alter table inventory        enable row level security;
alter table inventory_logs   enable row level security;
alter table wanted_items     enable row level security;
alter table checklist_items  enable row level security;
alter table bom_items        enable row level security;
alter table cycle_counts     enable row level security;
alter table notifications    enable row level security;

-- Helper: get current user role
create or replace function current_role_type()
returns role_type language sql security definer stable as $$
  select role from profiles where id = auth.uid()
$$;

-- Helper: is admin or owner
create or replace function is_admin_or_owner()
returns boolean language sql security definer stable as $$
  select role in ('admin','owner') from profiles where id = auth.uid()
$$;

-- Teams: all authenticated users can read; owner can insert/update
create policy "teams_select" on teams for select using (auth.uid() is not null);
create policy "teams_insert" on teams for insert with check (current_role_type() = 'owner');
create policy "teams_update" on teams for update using (current_role_type() = 'owner');

-- Profiles: all authenticated see all (org transparency); owner manages
create policy "profiles_select" on profiles for select using (auth.uid() is not null);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_update_owner" on profiles for update using (current_role_type() = 'owner');
create policy "profiles_delete" on profiles for delete using (current_role_type() = 'owner');

-- Catalog: all read; admin/owner write
create policy "catalog_select" on catalog_items for select using (auth.uid() is not null);
create policy "catalog_insert" on catalog_items for insert with check (is_admin_or_owner());
create policy "catalog_update" on catalog_items for update using (is_admin_or_owner());
create policy "catalog_delete" on catalog_items for delete using (current_role_type() = 'owner');

-- Inventory: all read; admin/owner write
create policy "inventory_select" on inventory for select using (auth.uid() is not null);
create policy "inventory_insert" on inventory for insert with check (is_admin_or_owner());
create policy "inventory_update" on inventory for update using (is_admin_or_owner());

-- Logs: all read (org transparency); admin/owner insert; admin/owner update status
create policy "logs_select" on inventory_logs for select using (auth.uid() is not null);
create policy "logs_insert" on inventory_logs for insert with check (is_admin_or_owner());
create policy "logs_update_status" on inventory_logs for update using (is_admin_or_owner());

-- Wanted: all read; admin/owner write
create policy "wanted_select" on wanted_items for select using (auth.uid() is not null);
create policy "wanted_insert" on wanted_items for insert with check (is_admin_or_owner());
create policy "wanted_update" on wanted_items for update using (is_admin_or_owner());
create policy "wanted_delete" on wanted_items for delete using (is_admin_or_owner());

-- Checklist: all read; admin/owner write
create policy "checklist_select" on checklist_items for select using (auth.uid() is not null);
create policy "checklist_write" on checklist_items for all using (is_admin_or_owner());

-- BOM: admin/owner only
create policy "bom_select" on bom_items for select using (is_admin_or_owner());
create policy "bom_write" on bom_items for all using (is_admin_or_owner());

-- Cycle counts: all read; admin/owner write
create policy "cycle_select" on cycle_counts for select using (auth.uid() is not null);
create policy "cycle_write" on cycle_counts for all using (is_admin_or_owner());

-- Notifications: users see own only
create policy "notif_select" on notifications for select using (user_id = auth.uid());
create policy "notif_update" on notifications for update using (user_id = auth.uid());
