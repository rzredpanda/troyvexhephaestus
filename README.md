# VEX Inventory System

Production-ready inventory management platform for VEX Robotics teams. Built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Role-based access** — Owner, Admin, Member roles with strict enforcement
- **7 pre-seeded teams** — 98601A through 98601Y, add/archive any time
- **Inventory workflows** — Withdraw, return, and trade parts with atomic DB transactions
- **Catalog** — VEX V5 catalog import (manual trigger) + CSV import with row-level validation
- **Dashboard** — Health metrics, MTD/annual spend, reorder recommendations, top cost drivers
- **Audit logs** — Immutable inventory logs with attempted/approved/rejected states
- **History** — Org-wide visibility for all authenticated users
- **BOM** — Bill of materials with CSV export (admin/owner)
- **Wanted list** + **Event prep checklist**
- **In-app notifications** with 30s polling
- **Light/dark mode** with system default
- **Nightly log snapshots** committed to `/logs` via GitHub Actions

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS v3, shadcn/ui
- **Backend:** Supabase (Postgres, Auth, RLS, Storage)
- **Deployment:** Vercel (auto-deploy from `main`)

---

## Setup

### Prerequisites

- Node.js 18+
- A Supabase project (already configured: `itresinabiskuwkpfkyz`)
- A Vercel account linked to this GitHub repo

### Local Development

1. **Clone and install:**
   ```bash
   git clone <repo-url>
   cd troyvexhephaestus
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://itresinabiskuwkpfkyz.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   DATABASE_URL=postgresql://postgres:<password>@db.itresinabiskuwkpfkyz.supabase.co:5432/postgres
   ```
   Get the service role key from: **Supabase Dashboard → Settings → API → service_role**

3. **Run the dev server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

4. **Verify Supabase connection:**
   ```bash
   npm run supabase:verify
   ```

---

## Supabase Setup (run once)

Open the **Supabase SQL Editor** and run these files in order:

1. `supabase/sql/01_schema_seed.sql` — tables, enums, triggers, atomic RPC functions, 7 team seed
2. `supabase/sql/02_rls.sql` — Row Level Security policies
3. `supabase/sql/03_dashboard_views.sql` — analytics views

### Create the first owner user

1. Go to **Supabase Dashboard → Authentication → Users → Add user**
2. Create a user with email + password
3. Run in SQL editor:
   ```sql
   update profiles set role = 'owner', full_name = 'Your Name' where email = 'your@email.com';
   ```

### Add more teams (owner UI or SQL)

Teams can be added via the Users page (owner role) or directly:
```sql
insert into teams (name) values ('98601Z');
```

---

## Deployment (Vercel)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import this repo
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy — Vercel auto-deploys on every push to `main`

---

## GitHub Actions Setup

### Nightly log snapshot (`.github/workflows/nightly-logs.yml`)

Runs at 2:00 AM America/Los_Angeles daily. Adds secrets to your GitHub repo:

1. Go to **GitHub repo → Settings → Secrets and variables → Actions**
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://itresinabiskuwkpfkyz.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `<your service role key>`

Sanitized logs are committed to `/logs/YYYY-MM-DD.json` on `main`.

---

## VEX Catalog Import

### Option A: Manual trigger (owner only)
Go to **Catalog** page → click **Import VEX Catalog**. This scrapes JSON-LD product data from VEX/RobotMesh.

### Option B: CSV import
Go to **Import** page → upload a CSV with columns `sku, name, unit_price`. Preview shown before committing. Row-level errors shown if validation fails.

---

## Operations

### Backup & Restore

- **Automated backups:** Supabase Enterprise includes PITR. For free/pro plans, use Supabase Dashboard → Database → Backups.
- **RPO target:** < 24h (daily backup minimum)
- **RTO target:** < 4h
- **Weekly verify:** Download a backup and restore to a test project to verify integrity.

### Roles

| Action | Owner | Admin | Member |
|--------|-------|-------|--------|
| View dashboard/history | ✅ | ✅ | ✅ |
| Withdraw / Return / Trade | ✅ | ✅ | ❌ |
| CSV Import | ✅ | ✅ | ❌ |
| Approve/Reject logs | ✅ | ✅ | ❌ |
| BOM management | ✅ | ✅ | ❌ |
| Catalog import (VEX) | ✅ | ❌ | ❌ |
| User management | ✅ | ❌ | ❌ |
| Team add/archive | ✅ | ❌ | ❌ |

### Log approval flow

Inventory actions are **not blocked** by log approval status. Logs are recorded as `attempted` immediately. Admins/owners can approve or reject in the **Logs** page. This provides an audit trail without blocking operations.

---

## Development Scripts

```bash
npm run dev          # Start local dev server
npm run build        # Production build
npm run lint         # ESLint check
npm run supabase:verify  # Verify Supabase connection + tables
```
