# Linear Tickets Plan

## Project: Company Management System

One project, 5 milestones (phases).

---

## Phase 1: Foundation

| # | Title | Priority | Notes |
|---|-------|----------|-------|
| 1 | Initialize Turborepo monorepo — all app skeletons | Urgent | `apps/web`, `apps/mobile`, `apps/api`, `packages/*` |
| 2 | `packages/types` — shared DTOs and interfaces | High | Used by all apps |
| 3 | `packages/i18n` — i18next setup, `he.json` + `en.json` skeletons | High | RTL default, shared across web + mobile |
| 4 | `packages/db` — Drizzle ORM schema + migrations (all core tables) | High | `companies`, `soldiers`, `units`, `combat_clock_events`, `daily_assignments`, `tasks`, `soldier_status`, `alerts` |
| 5 | NestJS API base — modules, `TenantInterceptor`, `JwtGuard`, `RolesGuard` | Urgent | Every query must filter by `company_id` |
| 6 | Auth module — OTP request/verify (Twilio), JWT with `company_id` + `role` claims | Urgent | Phone-only, no passwords; whitelisted test numbers |
| 7 | AWS infrastructure — RDS PostgreSQL, ElastiCache Redis, S3, ECS, ALB (il-central-1) | High | All data must stay in il-central-1 |

---

## Phase 2: Backend API

| # | Title | Priority | Notes |
|---|-------|----------|-------|
| 8  | Soldiers API — CRUD, invite codes, capabilities | High | Invite-only join flow |
| 9  | Units API — create/manage unit hierarchy (מחלקה/מפלגה) | Normal | Nested under company |
| 10 | Combat Clock API — events CRUD, recurrence (by weekday) | High | `combat_clock_events` table |
| 11 | Daily Assignments API — assign soldiers to tasks by date, conflict detection | High | Two overlapping events = conflict only if same soldier |
| 12 | Tasks API — task templates, recurrence rules, role requirements | High | `role_requirements` stored as JSONB |
| 13 | Soldier Status API — daily presence tracking (present/vacation/sick/out/return) | Normal | |
| 14 | Alerts API — generation, feed, mark-as-read | Normal | |
| 15 | WebSocket gateway — real-time updates via Socket.io | High | Scramble button, assignment changes |

---

## Phase 3: Web Commander Interface

| # | Title | Priority | Notes |
|---|-------|----------|-------|
| 16 | Web app setup — Next.js 15, dark theme tokens, RTL/LTR layout, i18n wiring | Urgent | `dir="rtl"` root, Heebo font, Tailwind RTL variants |
| 17 | Dashboard `/dashboard` — KPIs, alerts feed, quick-scramble button | High | Real-time via WebSocket |
| 18 | Personnel Status `/status` — per-soldier status grid + monthly timeline bar | High | |
| 19 | Daily Schedule `/schedule` — drag-drop soldier assignments by date | High | Conflict/override badges; `daily_assignments` entity |
| 20 | Combat Clock `/combat-clock` — FullCalendar timegrid, day + week views, side-by-side overlaps | High | `@fullcalendar/react` + `@fullcalendar/timegrid`; RTL time gutter fix |
| 21 | Soldiers Management `/soldiers` — register soldiers, set capabilities, assign units | Normal | |
| 22 | Tasks Definition `/tasks` — create/edit recurring and one-off task templates | Normal | |

---

## Phase 4: Mobile Soldier App

| # | Title | Priority | Notes |
|---|-------|----------|-------|
| 23 | Mobile app setup — Expo, dark theme, RTL (`I18nManager.forceRTL`), i18n wiring | Urgent | |
| 24 | Home screen — next task hero card + countdown + alarm toggles + today's list | High | |
| 25 | Task Details screen — briefing, equipment checklist, team, notification toggles | High | |
| 26 | Schedule screen — daily timeline, soldier's assignments highlighted | Normal | |
| 27 | Combat Clock screen (mobile, read-only) — custom ScrollView + absolute-positioned blocks | Normal | No library; full RTL control |
| 28 | Alerts screen — push notification history | Normal | |
| 29 | Status screen — report late / request absence | Normal | |

---

## Phase 5: Integrations

| # | Title | Priority | Notes |
|---|-------|----------|-------|
| 30 | Expo Push Notifications — scramble alerts, task reminders, SMS fallback trigger | High | |
| 31 | Telegram Bot — per-company bot token, auto-create shift group, send messages in user's language | High | |
| 32 | Twilio SMS fallback — notify offline soldiers when push fails | Normal | |
