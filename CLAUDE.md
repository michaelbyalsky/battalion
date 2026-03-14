# Company Management System — CLAUDE.md

## English Practice

The user is actively working on improving their English. **Before responding to any message, correct any grammar, spelling, or phrasing errors in the user's prompt.** Show the corrected version first (briefly, in italics), then proceed with the actual response. Keep corrections friendly and concise — don't over-explain.

---

## Project Overview

A military/unit management system for soldier registration, task assignment, duty squads, and alerts. Multi-tenant, multi-language (Hebrew + English). Target market: Israeli army/defense industry — deployed on AWS il-central-1 (Tel Aviv) for data residency compliance.

**Status:** Implementation underway. Mockup phase complete.
Mockups live in `mockup/` (serve with `python3 mockup/dev.py`, port 3131).

---

## Tech Stack

### Monorepo
- **Turborepo** with TypeScript throughout — package manager is **pnpm** (not npm)
- `apps/mobile` — React Native + Expo _(not yet scaffolded)_
- `apps/web` — Next.js 15 (App Router), commander interface
- `apps/api` — NestJS backend (self-hosted, replaces Supabase)
- `packages/i18n` — shared i18next translations (he.json, en.json)
- `packages/db` — Drizzle ORM schema + migrations (shared)
- `packages/types` — shared DTOs and types across api/web/mobile

### Backend (Self-Hosted on AWS il-central-1)
- **NestJS** — main API server (TypeScript, guards, interceptors, WebSockets)
- **Drizzle ORM** — database access layer, SQL-close, strong migrations
- **RDS PostgreSQL** — primary database (AWS il-central-1)
- **ElastiCache Redis** — sessions + realtime pub/sub
- **Socket.io** — realtime updates (via `@nestjs/websockets` on the NestJS server)
- **S3** — file storage (AWS il-central-1)
- **ALB** — load balancer

> No Supabase — full stack is self-owned for compliance and defense sales.

### Multi-Tenancy
- Every row tagged with `company_id`
- Tenant isolation enforced via a NestJS `TenantInterceptor` (reads `company_id` from JWT, injects into every request)
- Every Drizzle query **must** filter by `companyId` — never query without it
- JWT contains `company_id` and `role` claims

### Auth
- Phone-only OTP via Twilio — no passwords ever
- Flow: `POST /auth/request-otp` → Twilio SMS → `POST /auth/verify-otp` → JWT issued
- Roles: `soldier` / `shift_manager` / `commander`
- Invite-only: soldiers join via commander-issued invite code
- NestJS `JwtGuard` + `RolesGuard` on all routes

### Integrations
- **Expo Push Notifications** — primary push channel
- **Telegram Bot API** — shift group messaging (each company gets its own bot token)
- **Twilio SMS** — OTP auth + fallback when push fails (soldier offline)

---

## Features & Screens

### Web (Commander Interface)

| Screen | Route | Description |
|--------|-------|-------------|
| לוח בקרה | `/dashboard` | KPIs: available soldiers, active tasks, absences; alerts feed; quick-scramble button |
| מצב כוח אדם | `/status` | Per-soldier status grid by date (present/vacation/sick/out/return); monthly timeline bar |
| שיבוץ יומי | `/schedule` | **WHO** does each task on a specific date; drag-drop soldiers onto task slots; conflict/override badges |
| שעון לחימה | `/combat-clock` | **WHAT/WHEN** recurring weekly template; day + week views; overlapping events side-by-side |
| ניהול חיילים | `/soldiers` | Register soldiers, set capabilities, assign to units |
| הגדרת משימות | `/tasks` | Create recurring and one-off task templates with role requirements |

> **Critical distinction:** שיבוץ יומי = specific date assignments (who). שעון לחימה = recurring schedule template (what/when). These are separate entities in the DB and separate screens.

### Mobile (Soldier View)

| Screen | Description |
|--------|-------------|
| בית | Next assigned task hero card with countdown + alarm toggles; today's task list |
| פרטי משימה | Task briefing: equipment, checklist, team, notification toggles |
| לוח זמנים | Daily timeline of unit schedule; soldier's assignments highlighted |
| שעון לחימה | Compact daily timeline view of the combat clock (read-only for soldiers) |
| התראות | Push notification history |
| מצב | Report late / request absence |

---

## Data Model

### Core entities

```
companies          — multi-tenant root
soldiers           — user profile + role + unit + capabilities
units              — מחלקה/מפלגה hierarchy within a company
```

### Schedule & Assignment

```
combat_clock_events  — recurring schedule template rows
  id, company_id, name, type (guard|formation|training|briefing|meal|patrol|sleep)
  start_time (time), end_time (time)
  recurrence_days (int[] 0–6, Sun=0)
  required_count, notes

daily_assignments    — specific soldier ↔ task ↔ date
  id, company_id, soldier_id, task_id, date
  role, status (assigned|confirmed|no_show|override)
  override_reason

tasks               — task definitions (templates)
  id, company_id, name, type, is_recurring
  recurrence_days, start_time, end_time
  role_requirements (jsonb: [{role, count, capabilities[]}])
```

### Status & Alerts

```
soldier_status      — daily presence record
  soldier_id, date, status (present|vacation|sick|out|return)
  return_time, departure_time, notes

alerts              — system-generated notifications
  company_id, type, payload (jsonb), read_at, created_at
```

### Event types (`combat_clock_events.type`)

| Value | Hebrew | Color |
|-------|--------|-------|
| `guard` | כוננות | red `#ef4444` |
| `formation` | מסדר | green `#22c55e` |
| `training` | אימון | blue `#3b82f6` |
| `briefing` | תדריך | purple `#a855f7` |
| `meal` | ארוחה | teal `#14b8a6` |
| `patrol` | סיור | amber `#f59e0b` |

### Soldier capabilities (freeform tags, common values)
`M16` `MAG` `LAU` `נגב` `נגן` `חובש` `מטול`

### Assignment conflict logic
Two events conflict when they overlap in time **and** the same soldier is assigned to both.
Overlapping events with **different** soldiers (e.g. patrol team + base soldiers eating lunch) is **not** a conflict — show side-by-side columns.

---

## 3-Layer Architecture (API)

Every NestJS feature module follows a strict 3-layer structure. Never skip or merge layers.

```
Controller  →  Service  →  Repository
    ↓              ↓             ↓
HTTP/WS       Business       Drizzle
concerns       logic          queries
```

### Layer 1 — Controller (`*.controller.ts`)
- Handles HTTP routing, request parsing, response shaping
- Applies guards (`@UseGuards`), roles (`@Roles`), decorators
- Calls service methods — **no business logic here**
- Calls service methods — **no Drizzle queries here**
- Validates input via class-validator DTOs (`@Body()`, `@Param()`)

### Layer 2 — Service (`*.service.ts`)
- Contains all business logic and domain rules
- Calls repository methods — **no `db.*` queries directly**
- Calls repository methods — **no HTTP concerns (no `req`, `res`)**
- Orchestrates multiple repositories when needed
- Throws domain exceptions (`NotFoundException`, `ConflictException`, etc.)

### Layer 3 — Repository (`*.repository.ts`)
- Contains all Drizzle queries — the **only** place `db.*` is called
- Every method receives `companyId` as first argument — no exceptions
- No business logic, no HTTP concerns
- Returns raw DB rows or mapped types

### Module file layout
```
soldiers/
  soldiers.module.ts
  soldiers.controller.ts
  soldiers.service.ts
  soldiers.repository.ts
  dto/
    create-soldier.dto.ts
    update-soldier.dto.ts
```

### Example
```typescript
// Repository — only Drizzle, always companyId first
@Injectable()
export class SoldiersRepository {
  list(companyId: string) {
    return db.select().from(soldiers).where(eq(soldiers.companyId, companyId))
  }
  findById(companyId: string, id: string) {
    return db.select().from(soldiers)
      .where(and(eq(soldiers.companyId, companyId), eq(soldiers.id, id)))
      .then(rows => rows[0] ?? null)
  }
}

// Service — business logic, calls repository
@Injectable()
export class SoldiersService {
  constructor(private readonly repo: SoldiersRepository) {}

  async list(companyId: string) {
    return this.repo.list(companyId)
  }
  async findOrThrow(companyId: string, id: string) {
    const soldier = await this.repo.findById(companyId, id)
    if (!soldier) throw new NotFoundException('Soldier not found')
    return soldier
  }
}

// Controller — HTTP only, calls service
@UseGuards(JwtGuard, RolesGuard)
@Controller('soldiers')
export class SoldiersController {
  constructor(private readonly service: SoldiersService) {}

  @Get()
  @Roles('commander', 'shift_manager')
  list(@Req() req: RequestWithUser) {
    return this.service.list(req.companyId)
  }
}
```

---

## Key Conventions

### i18n
- Default language: Hebrew (RTL)
- All strings live in `packages/i18n/locales/he.json` and `en.json`
- Use `useTranslation` from `@company/i18n` — never hardcode strings
- React Native: `I18nManager.forceRTL(locale === 'he')`
- Next.js: `<html dir={locale === 'he' ? 'rtl' : 'ltr'}>` + Tailwind `rtl:` variants
- Dates: always use `Intl.DateTimeFormat` with locale
- Fonts: Heebo or Assistant (Google Fonts)
- Language preference stored in user profile (DB) + local cache

### RTL Gotchas
- **Time ranges in RTL containers get reversed by the bidi algorithm.** A string like `"05:30–06:30"` in a `dir="rtl"` element renders as `"06:30–05:30"`. Fix: wrap all time/number displays with `dir="ltr"` or `style="direction:ltr; unicode-bidi:isolate"`.
- Calendar grid: use `direction: ltr` on the grid container for standard left→right column layout even inside an RTL page. Override individual Hebrew text nodes back to RTL as needed.
- Tailwind: prefer `rtl:` variants over hardcoded `right:`/`left:` so layout flips correctly on locale change.

### Security
- All queries must include `companyId` from the tenant interceptor — no exceptions
- Telegram groups are private; bots are per-company
- All data stays in `il-central-1` — no cross-region replication
- Audit logs via AWS CloudTrail

---

## UI Design System

Dark theme tokens (use as CSS vars or Tailwind config):

| Token | Value | Usage |
|-------|-------|-------|
| `bg-base` | `#0f1117` | Page background |
| `bg-surface` | `#151820` | Cards, panels, topbar |
| `bg-raised` | `#1e2333` | Inputs, chips, hover |
| `border` | `#1e2333` | All borders |
| `border-strong` | `#2a3045` | Focused borders |
| `text-primary` | `#e0e0e0` | Body text |
| `text-muted` | `#7a8ab0` | Labels, subtitles |
| `text-dim` | `#4a5270` | Placeholders, empty states |
| `accent` | `#3b82f6` | Active/selected state |

Status colors: green `#22c55e` · amber `#f59e0b` · red `#ef4444` · purple `#a855f7`

### Calendar / Combat Clock (web)
- Use **`@fullcalendar/react`** with `@fullcalendar/timegrid` — handles overlapping events natively, supports custom event rendering, dark theme via CSS vars.
- Collision layout: events overlapping in time split into equal-width side-by-side columns within the same day column.
- Time gutter: `direction: ltr` override; 48px/hour (weekly), 72px/hour (daily).

### Calendar (mobile)
- Build a **custom ScrollView + absolute-positioned blocks** for the combat clock timeline — gives full control over RTL layout and dark theme without fighting a library.
- For the date picker/agenda view, `react-native-calendars` (by Wix) has native RTL/Hebrew support.

---

## Infrastructure (AWS il-central-1)

- **Compute** — ECS (NestJS API containers)
- **Database** — RDS PostgreSQL
- **Cache/Realtime** — ElastiCache Redis
- **Storage** — S3
- **Networking** — ALB + VPC
- **Logs/Audit** — CloudWatch + CloudTrail

---

## Task Runner Hierarchy

Three tools work together — each at a different level:

| Tool | Role |
|------|------|
| **just** | Developer-facing entry point. Thin wrapper around pnpm scripts. |
| **pnpm** | Package manager + workspace filter. Delegates to turbo or runs single-package scripts. |
| **turbo** | Monorepo task orchestrator. Runs multi-app tasks in parallel with caching and dependency ordering. |

```
just dev
  └─► pnpm run dev
        └─► turbo dev            ← runs apps/api + apps/web in parallel

just db-migrate
  └─► pnpm run db:migrate
        └─► pnpm --filter=packages/db migrate   ← single package, no turbo needed
```

Always use `just` as the entry point. Never call `turbo` or `pnpm run` directly.

## Build & Deploy

- Mobile: `eas build --platform all` (EAS Build, no local Mac needed)
- Web: Next.js deployed to AWS (ECS or Amplify)
- API: Docker → ECS on il-central-1
- Local dev: `just dev` (web + api); Expo Go for mobile
- Mockups: `python3 mockup/dev.py` → http://localhost:3131

## Testing

- OTP test numbers: `+972500000001–003` with OTP `123456` (whitelisted in Twilio test mode)
- Push notifications: requires one real device
- Web E2E: Playwright (headless in CI)
- Telegram: use a separate test bot + private test group
