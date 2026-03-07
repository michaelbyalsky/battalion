# Company Management System — CLAUDE.md

## Project Overview

A military/unit management system for soldier registration, task assignment, duty squads, and alerts. Multi-tenant, multi-language (Hebrew + English).

## Tech Stack

### Monorepo
- **Turborepo** with TypeScript throughout
- `apps/mobile` — React Native + Expo
- `apps/web` — Next.js 15 (App Router), commander interface
- `packages/i18n` — shared i18next translations (he.json, en.json)

### Backend
- **Supabase** — PostgreSQL + Row Level Security (RLS), Auth (OTP SMS only, no passwords), Realtime, Edge Functions (Deno)
- Every row tagged with `company_id` — RLS enforces tenant isolation at DB level
- JWT contains `company_id` claim

### Integrations
- **Expo Push Notifications** — primary push channel
- **Telegram Bot API** — shift group messaging (each company gets its own bot token)
- **Twilio SMS** — fallback when push fails (soldier offline)

## Key Conventions

### Auth
- Phone-only OTP registration — no passwords ever
- Roles: soldier / shift manager / commander
- Invite-only: soldiers join via commander-issued invite code

### i18n
- Default language: Hebrew (RTL)
- All strings live in `packages/i18n/locales/he.json` and `en.json`
- Use `useTranslation` from `@company/i18n` — never hardcode strings
- React Native: `I18nManager.forceRTL(locale === 'he')`
- Next.js: `<html dir={locale === 'he' ? 'rtl' : 'ltr'}>` + Tailwind `rtl:` variants
- Dates: always use `Intl.DateTimeFormat` with locale
- Fonts: Heebo or Assistant (Google Fonts)
- Language preference stored in Supabase profile + local cache

### Security
- Never bypass RLS — all queries must go through Supabase client with user JWT
- Telegram groups are private; bots are per-company

## Build & Deploy

- Mobile: `eas build --platform all` (EAS Build, no local Mac needed)
- Web: standard Next.js deployment
- Local dev: `npm run dev` for web; Expo Go for mobile

## Testing

- OTP test numbers: `+972500000001–003` with OTP `123456` (whitelisted in Supabase)
- Push notifications: requires one real device
- Web E2E: Playwright (headless in CI)
- Telegram: use a separate test bot + private test group
