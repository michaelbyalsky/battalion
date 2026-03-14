# apps/web — Next.js 15 Commander Interface

Next.js 15 App Router. Port 3001. Commander-only interface (roles: `commander`, `shift_manager`).

## Routing

| Route | Screen (Hebrew) | Description |
|-------|-----------------|-------------|
| `/dashboard` | לוח בקרה | KPIs, alerts feed, quick-scramble |
| `/status` | מצב כוח אדם | Per-soldier daily status grid |
| `/schedule` | שיבוץ יומי | WHO does each task on a specific date |
| `/combat-clock` | שעון לחימה | Recurring weekly schedule template |
| `/soldiers` | ניהול חיילים | Register soldiers, capabilities, invite flow |
| `/tasks` | הגדרת משימות | Task templates (recurring + one-off) |

> **Critical:** שיבוץ יומי (schedule) = specific date assignments. שעון לחימה (combat-clock) = weekly template. Separate DB tables, separate screens.

## Component Rules

- Prefer **Server Components** by default — fetch data server-side via API calls
- Use `'use client'` only when you need interactivity (state, effects, event handlers)
- Never fetch data directly from the DB in web — always go through `apps/api`
- API calls use `fetch` with credentials (`credentials: 'include'`) to send JWT cookie

## File Structure (App Router)

```
src/app/
  layout.tsx              — root layout: Heebo font, RTL, dark theme
  globals.css             — Tailwind theme, CSS variables, event colors
  (auth)/
    login/page.tsx        — OTP login flow
  (commander)/
    layout.tsx            — commander shell: sidebar + topbar
    dashboard/page.tsx
    status/page.tsx
    schedule/page.tsx
    combat-clock/page.tsx
    soldiers/page.tsx
    tasks/page.tsx
```

## Styling

Tailwind CSS 4. All design tokens defined as CSS variables in `globals.css`:

| Variable | Value | Usage |
|----------|-------|-------|
| `--bg-base` | `#0f1117` | Page background |
| `--bg-surface` | `#151820` | Cards, panels |
| `--bg-raised` | `#1e2333` | Inputs, hover states |
| `--text-primary` | `#e0e0e0` | Body text |
| `--text-muted` | `#7a8ab0` | Labels, subtitles |
| `--text-dim` | `#4a5270` | Placeholders |
| `--accent` | `#3b82f6` | Active/selected |
| `--border` | `#1e2333` | Default borders |
| `--border-strong` | `#2a3045` | Focus rings |

Event type colors: guard `#ef4444` · formation `#22c55e` · training `#3b82f6` · briefing `#a855f7` · meal `#14b8a6` · patrol `#f59e0b`

## RTL Rules

- Root layout sets `dir="rtl"` (Hebrew default)
- Use Tailwind `rtl:` variants — never hardcode `right:`/`left:`
- Wrap **all time and number displays** in `dir="ltr"` to prevent bidi reversal:
  ```tsx
  <span dir="ltr">05:30–06:30</span>
  ```
- Calendar/grid containers: `direction: ltr` on the container, Hebrew text nodes override back

## i18n

- Import from `@battalion/i18n`
- In Server Components: use `getTranslation(locale)` (server-side)
- In Client Components: use `useTranslation()` hook
- Never hardcode Hebrew or English strings — all keys in `packages/i18n/locales/`

## Calendar (Combat Clock)

Use `@fullcalendar/react` + `@fullcalendar/timegrid`:
- Time gutter: `direction: ltr`, 48px/hour (week), 72px/hour (day)
- Dark theme via CSS variables
- Overlapping events: side-by-side columns (FullCalendar handles this natively)

## Auth

- JWT stored in `httpOnly` cookie — no token handling in JS
- Unauthenticated requests redirect to `/login`
- Middleware (`middleware.ts`) checks for valid JWT cookie on protected routes
- After login, redirect to `/dashboard`
