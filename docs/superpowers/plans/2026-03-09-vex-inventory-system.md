# VEX Inventory System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready VEX Inventory Management System with role-based access, team-aware inventory, catalog search, trades, logs, and analytics.

**Architecture:** Next.js App Router + Supabase (Postgres/Auth/RLS) + Tailwind/shadcn. All inventory mutations go through server-side API routes that enforce RLS and role checks. The UI is a left-rail + top-filter layout with light/dark mode.

**Tech Stack:** Next.js 14 (App Router, TypeScript), Tailwind CSS, shadcn/ui, Supabase JS v2, Vercel

**Credentials (already confirmed):**
- `NEXT_PUBLIC_SUPABASE_URL=https://itresinabiskuwkpfkyz.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cmVzaW5hYmlza3V3a3Bma3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDE4MjIsImV4cCI6MjA4ODY3NzgyMn0.gZHukfgIe838OE8mmsu7yB7gTvSrmARyPjJLmGE8axE`
- `DATABASE_URL=postgresql://postgres:TroyVEX12#$1224@db.itresinabiskuwkpfkyz.supabase.co:5432/postgres`

---

## File Map

```
/
├── app/
│   ├── globals.css                        # From style-export.css
│   ├── layout.tsx                         # Root layout, ThemeProvider
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   └── login/page.tsx
│   └── (app)/
│       ├── layout.tsx                     # Sidebar + TopBar shell
│       ├── page.tsx                       # Dashboard
│       ├── inventory/page.tsx
│       ├── inventory/withdraw/page.tsx
│       ├── inventory/return/page.tsx
│       ├── inventory/trade/page.tsx
│       ├── catalog/page.tsx
│       ├── history/page.tsx
│       ├── logs/attempted/page.tsx
│       ├── logs/approved/page.tsx
│       ├── wanted/page.tsx
│       ├── checklist/page.tsx
│       ├── bom/page.tsx
│       ├── import/page.tsx
│       ├── settings/page.tsx
│       └── users/page.tsx
├── app/api/
│   ├── dashboard/summary/route.ts
│   ├── inventory/route.ts
│   ├── withdrawals/route.ts
│   ├── returns/route.ts
│   ├── trades/route.ts
│   ├── history/route.ts
│   ├── logs/attempted/route.ts
│   ├── logs/approved/route.ts
│   ├── catalog/import/vex/route.ts
│   ├── catalog/search/route.ts
│   ├── import/csv/route.ts
│   ├── settings/route.ts
│   ├── users/route.ts
│   └── users/[id]/route.ts
├── components/
│   ├── ui/                                # shadcn generated components
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── top-bar.tsx
│   │   └── theme-toggle.tsx
│   ├── dashboard/
│   │   ├── metric-card.tsx
│   │   └── reorder-table.tsx
│   ├── inventory/
│   │   ├── inventory-table.tsx
│   │   ├── withdraw-form.tsx
│   │   ├── return-form.tsx
│   │   └── trade-form.tsx
│   ├── catalog/
│   │   └── catalog-search.tsx
│   ├── logs/
│   │   ├── log-table.tsx
│   │   └── history-table.tsx
│   └── shared/
│       ├── scope-filter.tsx
│       └── status-badge.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                      # Browser client
│   │   ├── server.ts                      # Server client (cookies)
│   │   └── admin.ts                       # Service role client
│   ├── auth.ts                            # requireRole() helper
│   ├── types.ts                           # All shared TS types/enums
│   └── utils.ts                           # cn(), formatCurrency()
├── middleware.ts                           # Session refresh + route guard
├── supabase/sql/
│   ├── 01_schema_seed.sql
│   ├── 02_rls.sql
│   └── 03_dashboard_views.sql
├── .github/workflows/
│   └── nightly-logs.yml
├── .env.local
├── .env.example
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## Chunk 1: Project Scaffold + Design System

### Task 1: Bootstrap Next.js project

- [ ] Run scaffold in repo root:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*" --no-git
```
- [ ] Install core deps:
```bash
npm install @supabase/supabase-js @supabase/ssr next-themes clsx tailwind-merge class-variance-authority tailwindcss-animate lucide-react
```
- [ ] Install shadcn:
```bash
npx shadcn@latest init
```
  When prompted: style=default, base color=neutral, CSS variables=yes
- [ ] Add shadcn components:
```bash
npx shadcn@latest add button input label card badge table dialog sheet select tabs dropdown-menu separator avatar skeleton toast sonner
```

### Task 2: Design system / globals.css

- [ ] Replace `app/globals.css` with contents of `style-export.css` (already in repo root)
- [ ] Create `tailwind.config.ts` with the config from the bottom of `style-export.css`:

```ts
import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        sans:    ["DM Sans", "sans-serif"],
        heading: ["Space Grotesk", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input:  "hsl(var(--input))",
        ring:   "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary:     { DEFAULT: "hsl(var(--primary))",     foreground: "hsl(var(--primary-foreground))"     },
        secondary:   { DEFAULT: "hsl(var(--secondary))",   foreground: "hsl(var(--secondary-foreground))"   },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted:       { DEFAULT: "hsl(var(--muted))",       foreground: "hsl(var(--muted-foreground))"       },
        accent:      { DEFAULT: "hsl(var(--accent))",      foreground: "hsl(var(--accent-foreground))"      },
        popover:     { DEFAULT: "hsl(var(--popover))",     foreground: "hsl(var(--popover-foreground))"     },
        card:        { DEFAULT: "hsl(var(--card))",        foreground: "hsl(var(--card-foreground))"        },
        success:     { DEFAULT: "hsl(var(--success))",     foreground: "hsl(var(--success-foreground))"     },
        warning:     { DEFAULT: "hsl(var(--warning))",     foreground: "hsl(var(--warning-foreground))"     },
        info:        { DEFAULT: "hsl(var(--info))",        foreground: "hsl(var(--info-foreground))"        },
        sidebar: {
          DEFAULT:              "hsl(var(--sidebar-background))",
          foreground:           "hsl(var(--sidebar-foreground))",
          primary:              "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent:               "hsl(var(--sidebar-accent))",
          "accent-foreground":  "hsl(var(--sidebar-accent-foreground))",
          border:               "hsl(var(--sidebar-border))",
          ring:                 "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      keyframes: {
        "accordion-down":  { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":    { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in":         { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-in-left":   { from: { opacity: "0", transform: "translateX(-12px)" }, to: { opacity: "1", transform: "translateX(0)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fade-in 0.4s ease-out",
        "slide-in-left":  "slide-in-left 0.3s ease-out",
      },
    },
  },
  plugins: [animate],
};
export default config;
```

### Task 3: Environment files

- [ ] Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://itresinabiskuwkpfkyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cmVzaW5hYmlza3V3a3Bma3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDE4MjIsImV4cCI6MjA4ODY3NzgyMn0.gZHukfgIe838OE8mmsu7yB7gTvSrmARyPjJLmGE8axE
SUPABASE_SERVICE_ROLE_KEY=<get from Supabase dashboard → Settings → API>
DATABASE_URL=postgresql://postgres:TroyVEX12#$1224@db.itresinabiskuwkpfkyz.supabase.co:5432/postgres
```
- [ ] Create `.env.example` (same keys, empty values)

### Task 4: Supabase client helpers

- [ ] Create `lib/supabase/client.ts`:
```ts
import { createBrowserClient } from "@supabase/ssr";
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
```

- [ ] Create `lib/supabase/server.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export const createClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
};
```

- [ ] Create `lib/supabase/admin.ts`:
```ts
import { createClient } from "@supabase/supabase-js";
export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### Task 5: Shared types

- [ ] Create `lib/types.ts`:
```ts
export type Role = "owner" | "admin" | "member";
export type Scope = "overall" | "team";
export type Action = "add" | "withdraw" | "return" | "adjust" | "trade_in" | "trade_out" | "import";
export type LogStatus = "attempted" | "approved" | "rejected";
export type Condition = "new" | "good" | "fair" | "damaged";

export interface Team {
  id: string;
  name: string;
  archived: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  team_id: string | null;
  created_at: string;
}

export interface CatalogItem {
  id: string;
  sku: string;
  part_id: string | null;
  name: string;
  unit_price: number;
  category: string | null;
  image_url: string | null;
}

export interface InventoryItem {
  id: string;
  team_id: string;
  catalog_item_id: string;
  quantity: number;
  threshold: number;
  room: string | null;
  updated_at: string;
  catalog_item?: CatalogItem;
  team?: Team;
}

export interface InventoryLog {
  id: string;
  team_id: string;
  catalog_item_id: string;
  user_id: string;
  action: Action;
  quantity: number;
  condition: Condition | null;
  note: string | null;
  photo_url: string | null;
  status: LogStatus;
  created_at: string;
  profile?: Profile;
  catalog_item?: CatalogItem;
  team?: Team;
}

export interface WantedItem {
  id: string;
  team_id: string;
  catalog_item_id: string;
  quantity_needed: number;
  priority: "low" | "medium" | "high";
  note: string | null;
  created_at: string;
  catalog_item?: CatalogItem;
}

export interface ChecklistItem {
  id: string;
  team_id: string | null;
  label: string;
  checked: boolean;
  event_name: string | null;
  created_at: string;
}

export interface BOMItem {
  id: string;
  team_id: string;
  catalog_item_id: string;
  quantity_needed: number;
  bom_name: string;
  created_at: string;
  catalog_item?: CatalogItem;
}
```

- [ ] Create `lib/utils.ts`:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
```

### Task 6: Auth helper + middleware

- [ ] Create `lib/auth.ts`:
```ts
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/types";

export async function getSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
}

export async function requireRole(minRole: Role) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const hierarchy: Role[] = ["member", "admin", "owner"];
  if (hierarchy.indexOf(profile.role) < hierarchy.indexOf(minRole)) {
    redirect("/");
  }
  return profile;
}
```

- [ ] Create `middleware.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cs) => {
          cs.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cs.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  if (!user && !pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
```

- [ ] Commit:
```bash
git add -A && git commit -m "feat: scaffold Next.js + design system + supabase clients + auth middleware"
```

---

## Chunk 2: Database Schema

### Task 7: Schema + seed SQL

- [ ] Create `supabase/sql/01_schema_seed.sql`:
```sql
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
  unit_price  integer not null default 0,  -- cents
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

-- Inventory logs (immutable)
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

-- BOM
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
  month       date not null,  -- first of month
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

-- Trigger: auto-create profile on signup
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

-- Trigger: update inventory.updated_at
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
```

### Task 8: RLS policies

- [ ] Create `supabase/sql/02_rls.sql`:
```sql
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

-- Helper: is owner or admin
create or replace function is_admin_or_owner()
returns boolean language sql security definer stable as $$
  select role in ('admin','owner') from profiles where id = auth.uid()
$$;

-- Teams: all authenticated users can read; owner can insert/update
create policy "teams_select" on teams for select using (auth.uid() is not null);
create policy "teams_insert" on teams for insert with check (current_role_type() = 'owner');
create policy "teams_update" on teams for update using (current_role_type() = 'owner');

-- Profiles: users see all (org transparency); owner manages all
create policy "profiles_select" on profiles for select using (auth.uid() is not null);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_update_owner" on profiles for update using (current_role_type() = 'owner');
create policy "profiles_delete" on profiles for delete using (current_role_type() = 'owner');

-- Catalog: everyone reads; admin/owner writes
create policy "catalog_select" on catalog_items for select using (auth.uid() is not null);
create policy "catalog_insert" on catalog_items for insert with check (is_admin_or_owner());
create policy "catalog_update" on catalog_items for update using (is_admin_or_owner());
create policy "catalog_delete" on catalog_items for delete using (current_role_type() = 'owner');

-- Inventory: everyone reads; admin/owner writes
create policy "inventory_select" on inventory for select using (auth.uid() is not null);
create policy "inventory_insert" on inventory for insert with check (is_admin_or_owner());
create policy "inventory_update" on inventory for update using (is_admin_or_owner());

-- Logs: everyone reads (org transparency); admin/owner inserts
create policy "logs_select" on inventory_logs for select using (auth.uid() is not null);
create policy "logs_insert" on inventory_logs for insert with check (is_admin_or_owner());
create policy "logs_update_status" on inventory_logs for update using (is_admin_or_owner());

-- Wanted: everyone reads; admin/owner writes
create policy "wanted_select" on wanted_items for select using (auth.uid() is not null);
create policy "wanted_insert" on wanted_items for insert with check (is_admin_or_owner());
create policy "wanted_update" on wanted_items for update using (is_admin_or_owner());
create policy "wanted_delete" on wanted_items for delete using (is_admin_or_owner());

-- Checklist: everyone reads; admin/owner writes
create policy "checklist_select" on checklist_items for select using (auth.uid() is not null);
create policy "checklist_write" on checklist_items for all using (is_admin_or_owner());

-- BOM: owner/admin only
create policy "bom_select" on bom_items for select using (is_admin_or_owner());
create policy "bom_write" on bom_items for all using (is_admin_or_owner());

-- Cycle counts: everyone reads; admin/owner writes
create policy "cycle_select" on cycle_counts for select using (auth.uid() is not null);
create policy "cycle_write" on cycle_counts for all using (is_admin_or_owner());

-- Notifications: users see own only
create policy "notif_select" on notifications for select using (user_id = auth.uid());
create policy "notif_update" on notifications for update using (user_id = auth.uid());
```

### Task 9: Dashboard views

- [ ] Create `supabase/sql/03_dashboard_views.sql`:
```sql
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

-- Inventory health summary
create or replace view v_inventory_health as
select
  team_id,
  count(*) as total_items,
  sum(case when quantity = 0 then 1 else 0 end) as out_of_stock,
  sum(case when quantity > 0 and quantity <= threshold then 1 else 0 end) as low_stock,
  sum(case when quantity > threshold then 1 else 0 end) as healthy
from inventory
group by team_id;
```

- [ ] Commit:
```bash
git add -A && git commit -m "feat: add SQL schema, RLS policies, and dashboard views"
```

---

## Chunk 3: App Layout + Auth UI

### Task 10: Root layout + ThemeProvider

- [ ] Create `app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "VEX Inventory",
  description: "VEX Robotics Inventory Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Task 11: Login page

- [ ] Create `app/(auth)/layout.tsx`:
```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {children}
    </div>
  );
}
```

- [ ] Create `app/(auth)/login/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      router.push("/");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">VEX Inventory</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Task 12: Sidebar + ThemeToggle

- [ ] Create `components/layout/theme-toggle.tsx`:
```tsx
"use client";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

- [ ] Create `components/layout/sidebar.tsx`:
```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Package, BookOpen, History, FileText,
  Heart, CheckSquare, FileSpreadsheet, Upload, Settings, Users, Layers
} from "lucide-react";
import type { Role } from "@/lib/types";

const navItems = [
  { href: "/",                label: "Dashboard",    icon: LayoutDashboard, roles: ["owner","admin","member"] as Role[] },
  { href: "/inventory",       label: "Inventory",    icon: Package,          roles: ["owner","admin","member"] as Role[] },
  { href: "/catalog",         label: "Catalog",      icon: BookOpen,         roles: ["owner","admin","member"] as Role[] },
  { href: "/history",         label: "History",      icon: History,          roles: ["owner","admin","member"] as Role[] },
  { href: "/logs/attempted",  label: "Logs",         icon: FileText,         roles: ["owner","admin","member"] as Role[] },
  { href: "/wanted",          label: "Wanted",       icon: Heart,            roles: ["owner","admin","member"] as Role[] },
  { href: "/checklist",       label: "Checklist",    icon: CheckSquare,      roles: ["owner","admin","member"] as Role[] },
  { href: "/bom",             label: "BOM",          icon: Layers,           roles: ["owner","admin"] as Role[] },
  { href: "/import",          label: "Import",       icon: Upload,           roles: ["owner","admin"] as Role[] },
  { href: "/users",           label: "Users",        icon: Users,            roles: ["owner"] as Role[] },
  { href: "/settings",        label: "Settings",     icon: Settings,         roles: ["owner","admin","member"] as Role[] },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const filtered = navItems.filter(i => i.roles.includes(role));
  return (
    <aside className="flex h-full w-56 flex-col border-r bg-sidebar px-3 py-4">
      <div className="mb-6 px-2">
        <span className="font-heading text-xl font-bold text-sidebar-foreground">VEX Inventory</span>
      </div>
      <nav className="flex-1 space-y-1">
        {filtered.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === href
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] Create `components/layout/top-bar.tsx`:
```tsx
"use client";
import { ThemeToggle } from "./theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import type { Profile } from "@/lib/types";

export function TopBar({ profile }: { profile: Profile }) {
  const router = useRouter();
  const supabase = createClient();
  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <span className="section-label">{profile.role.toUpperCase()}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{profile.full_name || profile.email}</span>
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
      </div>
    </header>
  );
}
```

### Task 13: App shell layout

- [ ] Create `app/(app)/layout.tsx`:
```tsx
import { getProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={profile.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] Commit:
```bash
git add -A && git commit -m "feat: add app shell layout, login page, sidebar, and theme toggle"
```

---

## Chunk 4: Dashboard + API Routes

### Task 14: Dashboard summary API

- [ ] Create `app/api/dashboard/summary/route.ts`:
```ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("team_id");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const yearStart  = new Date(now.getFullYear(), 0, 1).toISOString();

  let inventoryQuery = supabase.from("v_inventory_health").select("*");
  if (teamId) inventoryQuery = inventoryQuery.eq("team_id", teamId);
  const { data: health } = await inventoryQuery;

  let spendQuery = supabase.from("v_monthly_spend").select("*").gte("month", monthStart);
  if (teamId) spendQuery = spendQuery.eq("team_id", teamId);
  const { data: monthlySpend } = await spendQuery;

  let yearSpendQuery = supabase.from("v_monthly_spend").select("*").gte("month", yearStart);
  if (teamId) yearSpendQuery = yearSpendQuery.eq("team_id", teamId);
  const { data: yearSpend } = await yearSpendQuery;

  const { data: topParts } = await supabase.from("v_top_parts").select("*").limit(5);
  let reorderQuery = supabase.from("v_reorder_recommendations").select("*");
  if (teamId) reorderQuery = reorderQuery.eq("team_id", teamId);
  const { data: reorder } = await reorderQuery;

  const mtdSpend = (monthlySpend ?? []).reduce((s, r) => s + (r.spend_cents ?? 0), 0);
  const annualSpend = (yearSpend ?? []).reduce((s, r) => s + (r.spend_cents ?? 0), 0);
  const totalHealth = (health ?? []).reduce(
    (acc, r) => ({
      total: acc.total + (r.total_items ?? 0),
      out: acc.out + (r.out_of_stock ?? 0),
      low: acc.low + (r.low_stock ?? 0),
      healthy: acc.healthy + (r.healthy ?? 0),
    }),
    { total: 0, out: 0, low: 0, healthy: 0 }
  );

  return NextResponse.json({ health: totalHealth, mtdSpend, annualSpend, topParts: topParts ?? [], reorder: reorder ?? [] });
}
```

### Task 15: Dashboard page

- [ ] Create `components/dashboard/metric-card.tsx`:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  sub?: string;
  className?: string;
}

export function MetricCard({ title, value, sub, className }: MetricCardProps) {
  return (
    <div className={cn("card-elevated", className)}>
      <p className="metric-label">{title}</p>
      <p className="metric-value mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
```

- [ ] Create `components/shared/scope-filter.tsx`:
```tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Team } from "@/lib/types";

export function ScopeFilter({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  function onChange(val: string) {
    const params = new URLSearchParams(sp.toString());
    if (val === "overall") params.delete("team_id");
    else params.set("team_id", val);
    router.push("?" + params.toString());
  }
  return (
    <Select defaultValue={sp.get("team_id") ?? "overall"} onValueChange={onChange}>
      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="overall">All Teams</SelectItem>
        {teams.filter(t => !t.archived).map(t => (
          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

- [ ] Create `app/(app)/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ScopeFilter } from "@/components/shared/scope-filter";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ team_id?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: teams } = await supabase.from("teams").select("*").order("name");

  const url = new URL("http://localhost/api/dashboard/summary");
  if (sp.team_id) url.searchParams.set("team_id", sp.team_id);

  // Fetch on server using supabase directly for speed
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const yearStart  = new Date(now.getFullYear(), 0, 1).toISOString();

  let healthQ = supabase.from("v_inventory_health").select("*");
  if (sp.team_id) healthQ = healthQ.eq("team_id", sp.team_id);
  const { data: health } = await healthQ;

  let mtdQ = supabase.from("v_monthly_spend").select("spend_cents").gte("month", monthStart);
  if (sp.team_id) mtdQ = mtdQ.eq("team_id", sp.team_id);
  const { data: mtd } = await mtdQ;

  let annQ = supabase.from("v_monthly_spend").select("spend_cents").gte("month", yearStart);
  if (sp.team_id) annQ = annQ.eq("team_id", sp.team_id);
  const { data: ann } = await annQ;

  const { data: topParts } = await supabase.from("v_top_parts").select("*").limit(5);

  let reorderQ = supabase.from("v_reorder_recommendations").select("*").limit(20);
  if (sp.team_id) reorderQ = reorderQ.eq("team_id", sp.team_id);
  const { data: reorder } = await reorderQ;

  const totalHealth = (health ?? []).reduce((a, r) => ({
    total: a.total + (r.total_items ?? 0),
    out: a.out + (r.out_of_stock ?? 0),
    low: a.low + (r.low_stock ?? 0),
    healthy: a.healthy + (r.healthy ?? 0),
  }), { total: 0, out: 0, low: 0, healthy: 0 });

  const mtdSpend = (mtd ?? []).reduce((s, r) => s + (r.spend_cents ?? 0), 0);
  const annSpend = (ann ?? []).reduce((s, r) => s + (r.spend_cents ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
        <ScopeFilter teams={teams ?? []} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard title="Healthy Items" value={String(totalHealth.healthy)} sub={`of ${totalHealth.total} total`} />
        <MetricCard title="Low Stock" value={String(totalHealth.low)} sub="at or below threshold" />
        <MetricCard title="Out of Stock" value={String(totalHealth.out)} />
        <MetricCard title="MTD Spend" value={formatCurrency(mtdSpend)} sub={`Annual: ${formatCurrency(annSpend)}`} />
      </div>

      {(reorder ?? []).length > 0 && (
        <div>
          <h2 className="font-heading text-lg font-semibold mb-3">Reorder Recommendations</h2>
          <div className="card-elevated divide-y">
            {(reorder ?? []).map(r => (
              <div key={r.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{r.part_name}</p>
                  <p className="text-xs text-muted-foreground">{r.sku} · {r.team_name}</p>
                </div>
                <Badge variant="destructive">{r.quantity} / {r.threshold} min</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {(topParts ?? []).length > 0 && (
        <div>
          <h2 className="font-heading text-lg font-semibold mb-3">Top Cost Drivers (30d)</h2>
          <div className="card-elevated divide-y">
            {(topParts ?? []).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.sku}</p>
                </div>
                <span className="font-semibold">{formatCurrency(p.total_spend_cents)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] Commit:
```bash
git add -A && git commit -m "feat: dashboard with health metrics, spend, reorder recommendations"
```

---

## Chunk 5: Inventory Workflows

### Task 16: Inventory API

- [ ] Create `app/api/inventory/route.ts`:
```ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("team_id");
  let q = supabase.from("inventory")
    .select("*, catalog_item:catalog_items(*), team:teams(*)").order("updated_at", { ascending: false });
  if (teamId) q = q.eq("team_id", teamId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const body = await req.json();
  const { data, error } = await supabase.from("inventory").upsert(body, { onConflict: "team_id,catalog_item_id" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

### Task 17: Withdrawal API

- [ ] Create `app/api/withdrawals/route.ts`:
```ts
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { team_id, catalog_item_id, quantity, condition, note, photo_url } = body;

  // Atomic: check stock and deduct in a transaction via RPC
  const { data, error } = await adminClient.rpc("process_withdrawal", {
    p_team_id: team_id,
    p_catalog_item_id: catalog_item_id,
    p_quantity: quantity,
    p_user_id: user.id,
    p_condition: condition ?? null,
    p_note: note ?? null,
    p_photo_url: photo_url ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
```

- [ ] Add RPC function to `supabase/sql/01_schema_seed.sql` (append):
```sql
-- process_withdrawal: atomic deduct + log
create or replace function process_withdrawal(
  p_team_id uuid, p_catalog_item_id uuid, p_quantity int,
  p_user_id uuid, p_condition text, p_note text, p_photo_url text
) returns json language plpgsql security definer as $$
declare
  v_current int;
begin
  select quantity into v_current from inventory
    where team_id = p_team_id and catalog_item_id = p_catalog_item_id
    for update;
  if v_current is null or v_current < p_quantity then
    raise exception 'Insufficient stock: % available', coalesce(v_current,0);
  end if;
  update inventory set quantity = quantity - p_quantity
    where team_id = p_team_id and catalog_item_id = p_catalog_item_id;
  insert into inventory_logs(team_id,catalog_item_id,user_id,action,quantity,condition,note,photo_url,status)
    values(p_team_id,p_catalog_item_id,p_user_id,'withdraw',p_quantity,p_condition::condition_type,p_note,p_photo_url,'attempted');
  return json_build_object('success', true);
end;
$$;

-- process_return: atomic add + log
create or replace function process_return(
  p_team_id uuid, p_catalog_item_id uuid, p_quantity int,
  p_user_id uuid, p_condition text, p_note text
) returns json language plpgsql security definer as $$
begin
  update inventory set quantity = quantity + p_quantity
    where team_id = p_team_id and catalog_item_id = p_catalog_item_id;
  insert into inventory_logs(team_id,catalog_item_id,user_id,action,quantity,condition,note,status)
    values(p_team_id,p_catalog_item_id,p_user_id,'return',p_quantity,p_condition::condition_type,p_note,'attempted');
  return json_build_object('success', true);
end;
$$;

-- process_trade: atomic transfer between teams + logs
create or replace function process_trade(
  p_from_team_id uuid, p_to_team_id uuid, p_catalog_item_id uuid,
  p_quantity int, p_user_id uuid, p_note text
) returns json language plpgsql security definer as $$
declare v_current int;
begin
  select quantity into v_current from inventory
    where team_id = p_from_team_id and catalog_item_id = p_catalog_item_id for update;
  if v_current is null or v_current < p_quantity then
    raise exception 'Insufficient stock for trade';
  end if;
  update inventory set quantity = quantity - p_quantity
    where team_id = p_from_team_id and catalog_item_id = p_catalog_item_id;
  insert into inventory(team_id,catalog_item_id,quantity,threshold)
    values(p_to_team_id,p_catalog_item_id,p_quantity,5)
    on conflict(team_id,catalog_item_id) do update set quantity = inventory.quantity + excluded.quantity;
  insert into inventory_logs(team_id,catalog_item_id,user_id,action,quantity,note,status)
    values
    (p_from_team_id,p_catalog_item_id,p_user_id,'trade_out',p_quantity,p_note,'attempted'),
    (p_to_team_id,  p_catalog_item_id,p_user_id,'trade_in', p_quantity,p_note,'attempted');
  return json_build_object('success', true);
end;
$$;
```

### Task 18: Returns + Trades API

- [ ] Create `app/api/returns/route.ts`:
```ts
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { team_id, catalog_item_id, quantity, condition, note } = await req.json();
  const { data, error } = await adminClient.rpc("process_return", {
    p_team_id: team_id, p_catalog_item_id: catalog_item_id,
    p_quantity: quantity, p_user_id: user.id,
    p_condition: condition ?? null, p_note: note ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
```

- [ ] Create `app/api/trades/route.ts`:
```ts
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { from_team_id, to_team_id, catalog_item_id, quantity, note } = await req.json();
  const { data, error } = await adminClient.rpc("process_trade", {
    p_from_team_id: from_team_id, p_to_team_id: to_team_id,
    p_catalog_item_id: catalog_item_id, p_quantity: quantity,
    p_user_id: user.id, p_note: note ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
```

### Task 19: Inventory pages (list + forms)

- [ ] Create `app/(app)/inventory/page.tsx` — server page fetching inventory, renders `InventoryTable`
- [ ] Create `components/inventory/inventory-table.tsx` — table with columns: Part, SKU, Team, Qty, Threshold, Room, Status badge
- [ ] Create `app/(app)/inventory/withdraw/page.tsx` — form: select team, search part, qty, condition, note, photo (upload to Supabase Storage if qty > threshold)
- [ ] Create `app/(app)/inventory/return/page.tsx` — form: select team, search part, qty, condition, note
- [ ] Create `app/(app)/inventory/trade/page.tsx` — form: from team, to team, search part, qty, note

Each form POSTs to the relevant API route and shows toast on success/error.

- [ ] Commit:
```bash
git add -A && git commit -m "feat: inventory CRUD, withdrawal/return/trade with atomic DB transactions"
```

---

## Chunk 6: Catalog + History + Logs

### Task 20: Catalog import (VEX V5)

- [ ] Create `app/api/catalog/import/vex/route.ts`:
```ts
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Scrapes robotmesh.com VEX V5 catalog pages
// Owner-only endpoint — triggered manually
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    // Fetch VEX V5 parts from robotevents/vexrobotics product catalog RSS or public API
    // Using VEX Robotics public product data (no auth required)
    const CATALOG_SOURCES = [
      "https://www.vexrobotics.com/v5-motors.html",
      // Add more category URLs as needed
    ];

    // For initial seed: fetch structured data from vexrobotics.com product JSON
    // The site exposes structured data in <script type="application/ld+json">
    const items: { sku: string; name: string; unit_price: number; category: string }[] = [];

    for (const url of CATALOG_SOURCES) {
      const res = await fetch(url, { headers: { "User-Agent": "VEX-Inventory-Bot/1.0" } });
      const html = await res.text();
      // Extract JSON-LD product data
      const matches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
      for (const match of matches) {
        try {
          const data = JSON.parse(match[1]);
          if (data["@type"] === "Product") {
            items.push({
              sku: data.sku ?? data.mpn ?? "",
              name: data.name,
              unit_price: Math.round(parseFloat(data.offers?.price ?? "0") * 100),
              category: "V5",
            });
          }
        } catch {}
      }
    }

    if (items.length === 0) {
      return NextResponse.json({ message: "No items parsed — check catalog source URLs", imported: 0 });
    }

    const { error } = await adminClient.from("catalog_items").upsert(items, { onConflict: "sku", ignoreDuplicates: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Import complete", imported: items.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

### Task 21: Catalog search API + page

- [ ] Create `app/api/catalog/search/route.ts`:
```ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function GET(req: Request) {
  const supabase = await createClient();
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const { data, error } = await supabase
    .from("catalog_items")
    .select("*")
    .or(`name.ilike.%${q}%,sku.ilike.%${q}%,part_id.ilike.%${q}%`)
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] Create `app/(app)/catalog/page.tsx` — search bar + table of catalog items, owner sees "Import VEX Catalog" button that calls POST `/api/catalog/import/vex`

### Task 22: History + Logs pages + APIs

- [ ] Create `app/api/history/route.ts`:
```ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("team_id");
  let q = supabase.from("inventory_logs")
    .select("*, profile:profiles(full_name,email), catalog_item:catalog_items(name,sku), team:teams(name)")
    .order("created_at", { ascending: false }).limit(200);
  if (teamId) q = q.eq("team_id", teamId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] Create `app/api/logs/attempted/route.ts` — same as history but filter `status = 'attempted'`
- [ ] Create `app/api/logs/approved/route.ts` — filter `status = 'approved'`; include PATCH to approve/reject (admin/owner only)
- [ ] Create `app/(app)/history/page.tsx` — table with scope filter
- [ ] Create `app/(app)/logs/attempted/page.tsx` — table with approve/reject actions for admin/owner
- [ ] Create `app/(app)/logs/approved/page.tsx` — read-only table
- [ ] Create `components/logs/log-table.tsx` — shared table component for all log views with status badges
- [ ] Create `components/shared/status-badge.tsx`:
```tsx
import { cn } from "@/lib/utils";
import type { LogStatus } from "@/lib/types";
export function StatusBadge({ status }: { status: LogStatus }) {
  return (
    <span className={cn("status-badge", {
      "status-success":     status === "approved",
      "status-warning":     status === "attempted",
      "status-destructive": status === "rejected",
    })}>
      {status}
    </span>
  );
}
```

- [ ] Commit:
```bash
git add -A && git commit -m "feat: catalog, history, attempted/approved log pages and APIs"
```

---

## Chunk 7: Advanced Features

### Task 23: Wanted list

- [ ] Create `app/api/wanted/route.ts` — GET all, POST new (admin/owner)
- [ ] Create `app/(app)/wanted/page.tsx` — list with team filter, add form (admin/owner)

### Task 24: Event prep checklist

- [ ] Create `app/(app)/checklist/page.tsx` — list by event, check/uncheck items, add/delete (admin/owner)
- [ ] Add simple API or use Supabase directly via server component

### Task 25: BOM (owner/admin only)

- [ ] Create `app/(app)/bom/page.tsx` — owner/admin gate via `requireRole("admin")`, list BOMs by name, add items, export CSV

### Task 26: CSV strict import

- [ ] Create `app/api/import/csv/route.ts`:
```ts
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const commit = formData.get("commit") === "true";
  const text = await file.text();
  const lines = text.split("\n").filter(Boolean);
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

  const errors: { row: number; message: string }[] = [];
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",").map(v => v.trim());
    const row: any = {};
    headers.forEach((h, idx) => row[h] = vals[idx]);

    if (!row.sku) errors.push({ row: i + 1, message: "Missing SKU" });
    if (!row.name) errors.push({ row: i + 1, message: "Missing name" });
    if (isNaN(parseInt(row.quantity))) errors.push({ row: i + 1, message: "Invalid quantity" });
    else rows.push(row);
  }

  if (errors.length > 0) return NextResponse.json({ errors, committed: false });
  if (!commit) return NextResponse.json({ preview: rows, errors: [], committed: false });

  // Commit: upsert catalog then inventory
  const { error } = await adminClient.from("catalog_items")
    .upsert(rows.map(r => ({ sku: r.sku, name: r.name, unit_price: parseInt(r.unit_price ?? "0") * 100 })), { onConflict: "sku" });
  if (error) return NextResponse.json({ error: error.message, committed: false }, { status: 500 });
  return NextResponse.json({ committed: true, imported: rows.length });
}
```

- [ ] Create `app/(app)/import/page.tsx` — file upload, shows preview table with row errors, commit button

### Task 27: Users management (owner only)

- [ ] Create `app/api/users/route.ts` — GET profiles, POST new user (owner: uses adminClient.auth.admin.createUser)
- [ ] Create `app/api/users/[id]/route.ts` — PATCH (role/team), DELETE (soft deactivate)
- [ ] Create `app/(app)/users/page.tsx` — table of users, invite form, role/team assignment

### Task 28: Settings page

- [ ] Create `app/api/settings/route.ts` — GET/PUT user profile (full_name, team assignment)
- [ ] Create `app/(app)/settings/page.tsx` — profile form, team selector

- [ ] Commit:
```bash
git add -A && git commit -m "feat: wanted list, checklist, BOM, CSV import, users management, settings"
```

---

## Chunk 8: Notifications + CI/CD

### Task 29: In-app notifications

- [ ] Add notification bell to `TopBar` with unread count badge
- [ ] Create `app/api/notifications/route.ts` — GET (user's own), PATCH (mark read)
- [ ] Trigger notifications inside RPC functions using `pg_notify` or insert into notifications table within atomic transactions

### Task 30: GitHub Action — nightly log snapshot

- [ ] Create `.github/workflows/nightly-logs.yml`:
```yaml
name: Nightly Log Snapshot
on:
  schedule:
    - cron: "0 10 * * *"  # 2:00 AM America/Los_Angeles (UTC-8)
  workflow_dispatch:

jobs:
  snapshot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Fetch sanitized logs
        env:
          SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: |
          DATE=$(date +%Y-%m-%d)
          mkdir -p logs
          curl -s "$SUPABASE_URL/rest/v1/inventory_logs?select=id,team_id,action,quantity,status,created_at&order=created_at.desc&limit=1000" \
            -H "apikey: $SUPABASE_SERVICE_KEY" \
            -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
            > logs/$DATE.json

      - name: Commit logs
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add logs/
          git diff --cached --quiet || git commit -m "chore: nightly log snapshot $(date +%Y-%m-%d)"
          git push
```

### Task 31: Vercel config

- [ ] Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@next_public_supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@next_public_supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key"
  }
}
```

### Task 32: npm run supabase:verify

- [ ] Add to `package.json` scripts:
```json
"supabase:verify": "node scripts/verify-supabase.js"
```
- [ ] Create `scripts/verify-supabase.js`:
```js
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function verify() {
  const { data, error } = await client.from("teams").select("count").limit(1);
  if (error) { console.error("❌ Supabase connection failed:", error.message); process.exit(1); }
  console.log("✅ Supabase connected. Teams table accessible.");
}
verify();
```

- [ ] Final commit:
```bash
git add -A && git commit -m "feat: notifications, nightly log GitHub Action, Vercel config, supabase:verify"
```

---

## Chunk 9: README + Final Verification

### Task 33: README

- [ ] Overwrite `README.md` with full setup guide:
  - Prerequisites (Node 20+, Supabase CLI optional)
  - Local setup: `npm install`, `.env.local`, `npm run dev`
  - Supabase setup: run 3 SQL files in order in Supabase SQL editor
  - First user: create in Supabase Auth, then update their profile role to 'owner'
  - Deployment: push to main → Vercel auto-deploys; set env vars in Vercel dashboard
  - Operations: nightly log snapshot via GitHub Actions, backup via Supabase dashboard
  - `npm run supabase:verify` to check connection

### Task 34: Final build check

- [ ] Run `npm run build` — fix any TypeScript/lint errors
- [ ] Run `npm run supabase:verify` — confirm DB connection
- [ ] Commit any fixes: `git commit -m "fix: build errors and type issues"`

---

## SQL Execution Order (run in Supabase SQL Editor)

1. `supabase/sql/01_schema_seed.sql` — tables, enums, triggers, seed data, RPC functions
2. `supabase/sql/02_rls.sql` — RLS policies
3. `supabase/sql/03_dashboard_views.sql` — views

**After running SQL:** Go to Supabase Auth → Users → create the owner user, then run:
```sql
update profiles set role = 'owner' where email = 'your@email.com';
```
