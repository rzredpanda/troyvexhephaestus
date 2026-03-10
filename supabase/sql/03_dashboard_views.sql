-- Monthly spend per team
create or replace view v_monthly_spend as
select
  il.team_id,
  t.name as team_name,
  date_trunc('month', il.created_at) as month,
  sum(il.quantity * ci.unit_price) as spend_cents
from inventory_logs il
join catalog_items ci on ci.id = il.catalog_item_id
join teams t on t.id = il.team_id
where il.action in ('withdraw','trade_out')
  and il.status = 'approved'
group by il.team_id, t.name, date_trunc('month', il.created_at);

-- Top cost-driving parts (last 30 days)
create or replace view v_top_parts as
select
  ci.id,
  ci.name,
  ci.sku,
  ci.unit_price,
  sum(il.quantity) as total_qty,
  sum(il.quantity * ci.unit_price) as total_spend_cents
from inventory_logs il
join catalog_items ci on ci.id = il.catalog_item_id
where il.action = 'withdraw'
  and il.created_at > now() - interval '30 days'
  and il.status = 'approved'
group by ci.id, ci.name, ci.sku, ci.unit_price
order by total_spend_cents desc;

-- Low stock / reorder recommendations
create or replace view v_reorder_recommendations as
select
  i.id,
  i.team_id,
  t.name as team_name,
  i.catalog_item_id,
  ci.name as part_name,
  ci.sku,
  ci.unit_price,
  i.quantity,
  i.threshold,
  (i.threshold - i.quantity) as shortage
from inventory i
join teams t on t.id = i.team_id
join catalog_items ci on ci.id = i.catalog_item_id
where i.quantity <= i.threshold
  and not t.archived;

-- Inventory health per team
create or replace view v_inventory_health as
select
  team_id,
  count(*) as total_items,
  sum(case when quantity = 0 then 1 else 0 end) as out_of_stock,
  sum(case when quantity > 0 and quantity <= threshold then 1 else 0 end) as low_stock,
  sum(case when quantity > threshold then 1 else 0 end) as healthy
from inventory
group by team_id;
