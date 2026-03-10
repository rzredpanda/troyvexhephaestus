# Security Fixes & Code Quality Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical security vulnerabilities, important bugs, and code quality issues identified in the full code review.

**Architecture:** Targeted edits to existing files — no new files needed. All API routes get proper auth guards. DB RPC gets fixed. Frontend gets error handling and input sanitation.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase SSR, shadcn/ui

---

## Chunk 1: Critical API Security Fixes

### Task 1: Fix GET /api/users — add owner-only auth
**Modify:** `app/api/users/route.ts`
- [ ] Add auth + owner role check to `GET` handler (mirror the `POST` handler's pattern)

### Task 2: Fix PATCH /api/users/[id] — mass assignment
**Modify:** `app/api/users/[id]/route.ts:14-15`
- [ ] Replace `update(body)` with explicit allowlist: `update({ role, full_name, team_id: team_id || null })`

### Task 3: Fix POST /api/inventory — no auth
**Modify:** `app/api/inventory/route.ts:21`
- [ ] Add auth check + admin/owner role check before upsert

### Task 4: Fix DELETE /api/bom — no auth
**Modify:** `app/api/bom/route.ts:25`
- [ ] Add auth check before delete

### Task 5: Fix PATCH+DELETE /api/checklist — no auth
**Modify:** `app/api/checklist/route.ts:24,32`
- [ ] Add auth check to both `PATCH` and `DELETE` handlers

### Task 6: Add role check to withdrawals/returns/trades
**Modify:** `app/api/withdrawals/route.ts`, `app/api/returns/route.ts`, `app/api/trades/route.ts`
- [ ] After auth check, add admin/owner role check to all three POST handlers

### Task 7: Fix CSV import — add role check + file size limit
**Modify:** `app/api/import/csv/route.ts`
- [ ] After auth check, add admin/owner role check
- [ ] Add 1MB file size guard (`if (file.size > 1_000_000)`)

---

## Chunk 2: Bug Fixes

### Task 8: Fix duplicate SKU in seed data
**Modify:** `app/api/seed/route.ts:20`
- [ ] Change rubber bands SKU from `276-4855` to `276-1496`

### Task 9: Fix process_return silent no-op
**Modify:** `supabase/sql/01_schema_seed.sql:188-208`
- [ ] After the UPDATE, check `GET DIAGNOSTICS rows = ROW_COUNT` and raise exception if 0

### Task 10: Remove insecure getSession() from lib/auth.ts
**Modify:** `lib/auth.ts:5-11`
- [ ] Delete the `getSession()` function entirely

### Task 11: Add env var guard to lib/supabase/server.ts
**Modify:** `lib/supabase/server.ts`
- [ ] Replace `!` assertions with explicit checks like admin.ts does

### Task 12: Fix formatDate null guard
**Modify:** `lib/utils.ts:12`
- [ ] Change signature to `formatDate(iso: string | null | undefined)` and return `"—"` if falsy

---

## Chunk 3: Frontend Fixes

### Task 13: Fix parseInt — add radix + NaN guard
**Modify:** `app/(app)/inventory/withdraw/page.tsx:99`, `app/(app)/inventory/return/page.tsx:83`
- [ ] `parseInt(e.target.value, 10) || 1`

### Task 14: Fix handleRoleChange/handleDelete silent failures in users page
**Modify:** `app/(app)/users/page.tsx:47-57`
- [ ] Check `res.ok` before updating state; show error toast on failure

### Task 15: Fix handleCheck/handleDelete silent failures in checklist
**Modify:** `app/(app)/checklist/page.tsx:41-57`
- [ ] Check `res.ok` before updating state; revert/show error on failure

### Task 16: Add visibility-based pause to notification polling
**Modify:** `components/layout/notification-bell.tsx:35-39`
- [ ] Add `document.addEventListener('visibilitychange', ...)` to pause/resume interval

---

## Chunk 4: Vercel Env Vars

### Task 17: Set Supabase env vars on Vercel via CLI
- [ ] `npm install -g vercel`
- [ ] `vercel link` (link to project rzredpanda/troyvexhephaestus)
- [ ] `vercel env add NEXT_PUBLIC_SUPABASE_URL production`
- [ ] `vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production`
- [ ] `vercel env add SUPABASE_SERVICE_ROLE_KEY production`
- [ ] `vercel env add DATABASE_URL production`

### Task 18: Apply process_return fix to live Supabase
- [ ] Run fixed SQL via Supabase MCP `execute_sql`
