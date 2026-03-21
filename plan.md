# Tech Stack Analysis — Company Management System

## System Requirements

**Core:**
- Soldier registration with phone number
- Task assignment (commander interface — desktop, soldier — mobile)
- Push Notifications + automatic alarms
- Task page + briefing for the soldier
- Duty squad with instant "scramble" alert
- Telegram/WhatsApp integration for shift groups

**Languages:**
- Full support for Hebrew (RTL) and English (LTR)
- Default: Hebrew — with option to switch to English for soldiers from abroad / new immigrants
- All interfaces (mobile + desktop) + Telegram messages — in the user's language

---

## Recommended Stack 2026

### Frontend — React Native (Expo) + Next.js

| Layer | Technology | Reason |
|---|---|---|
| Mobile App | **React Native + Expo** | One codebase for iOS + Android, Expo Notifications built-in |
| Commander Interface (desktop) | **Next.js 15 (App Router)** | SSR, PWA, same codebase as monorepo |
| Shared Logic | **TypeScript Monorepo (Turborepo)** | Share types, validations, and business logic |

### Backend — Supabase + Edge Functions

| Layer | Technology | Reason |
|---|---|---|
| Database | **Supabase (PostgreSQL)** | Built-in Row Level Security — perfect for isolating companies |
| Auth | **Supabase Auth + OTP SMS** | Phone-only registration, no passwords |
| Real-time | **Supabase Realtime** | Live assignment updates for commander |
| API / Logic | **Supabase Edge Functions (Deno)** | Serverless, close to DB |
| Push | **Expo Push Notifications** | Directly to the app |

### Integrations

| Feature | Technology | Notes |
|---|---|---|
| Shift groups | **Telegram Bot API** | Free API with full capabilities, WhatsApp Business API is expensive |
| Alarm | **Expo Scheduled Notifications** | Automatic, works in background |
| Duty scramble | **Supabase Realtime → Push** | Less than 2 seconds latency |
| SMS Fallback | **Twilio** | If Push doesn't arrive (soldier offline) |

---

## Security — Multi-Tenant Architecture

This is the most critical point. The recommended model:

```
┌─────────────────────────────────────────┐
│           Supabase Project              │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │ Company A│  │ Company B│  │  ...  │ │
│  │          │  │          │  │       │ │
│  │ RLS ✓    │  │ RLS ✓    │  │ RLS ✓ │ │
│  └──────────┘  └──────────┘  └───────┘ │
│                                         │
│  Row Level Security — every row tagged  │
│  with company_id, no company can see    │
│  another company's data                 │
└─────────────────────────────────────────┘
```

**Security layers:**

1. **OTP only** — no passwords, registration only with verified phone number
2. **Row Level Security (RLS)** — at the DB level, Company A cannot access Company B's data even if it tries
3. **JWT with `company_id` claim** — every request contains the company identity
4. **Role-based Access Control** — soldier / shift manager / commander — different permissions
5. **Invite-only joining** — soldier cannot join a company without an invite code from the commander
6. **Telegram Bot** — each company gets a separate Bot Token, groups are completely private

---

## Why Telegram and not WhatsApp?

| Criterion | Telegram | WhatsApp Business |
|---|---|---|
| API | Completely free | Costs money per message |
| Add/remove from group | Full Bot API | Very limited |
| Auto-create group | Yes | Almost impossible |
| Speed | Instant | Depends on BSP |

---

## i18n — Hebrew & English Support

### Libraries

| Layer | Technology | Reason |
|---|---|---|
| Shared Translations | **i18next** (`packages/i18n`) | Works in React Native + Next.js from the same package |
| React Native | **react-i18next** | Same `useTranslation` hook across all mobile |
| Next.js | **react-i18next** | Same API, SSR-friendly |

### Where the text lives

A single shared package in the monorepo — both apps import from it:

```
packages/
  i18n/
    locales/
      he.json   ← all Hebrew strings
      en.json   ← all English strings
    index.ts    ← i18next instance + TypeScript types
```

```ts
// apps/mobile/  AND  apps/web/ — same API
import { useTranslation } from '@battalion/i18n'

const { t } = useTranslation()
t('tasks.assignButton') // → "שבץ" / "Assign"
```

### RTL / LTR handling

**React Native:**
- `I18nManager.forceRTL(locale === 'he')` — RN automatically flips the layout

**Next.js:**
- `<html dir={locale === 'he' ? 'rtl' : 'ltr'}>` on the root layout
- Tailwind CSS `rtl:` variant for flipping padding/margin/flex per element

### Key points
1. **Fonts** — use `Heebo` or `Assistant` (Google Fonts) — clean for both Hebrew and English
2. **Dates** — use `Intl.DateTimeFormat` with locale, never hardcode strings
3. **Telegram messages** — send in the user's language (stored in their profile)
4. **Language preference** — saved in Supabase user profile + local cache (AsyncStorage / localStorage)

---

## Architecture Diagram

```
Soldier (mobile)       Commander (desktop)
      │                      │
      ▼                      ▼
  React Native           Next.js 15
      │                      │
      └──────────┬───────────┘
                 │
          Supabase Edge
          Functions (API)
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
PostgreSQL   Realtime    Supabase Auth
  + RLS      Channels     (OTP SMS)
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
  Expo Push  Telegram    Twilio SMS
Notifications  Bot API    (Fallback)
```

---

## Publishing — All Platforms

### Mobile (iOS + Android)
- Use **EAS Build** (Expo Application Services) — cloud build, no local Mac required
- iOS → Apple App Store
- Android → Google Play Store
- One command: `eas build --platform all`

### Web (Commander Interface)

The commander interface is Next.js — it's already a web app. Commanders open it in any browser, nothing to install or publish.

---

## Testing Strategy

### OTP / Phone Auth — No Real Numbers Needed

Supabase supports whitelisted test numbers with a fixed OTP code — no SMS sent, no cost:

```
+972500000001 → OTP: 123456  (developer 1)
+972500000002 → OTP: 123456  (developer 2)
+972500000003 → OTP: 123456  (test soldier)
```

### Mobile App Testing

| Method | What it does | Best for |
|---|---|---|
| **Expo Go** | Scan QR → app runs on your real phone instantly | Daily development |
| **iOS Simulator** | Run on Mac, no real device needed | UI testing (no push notifications) |
| **Android Emulator** | Run on any OS | UI + push notifications work |
| **EAS Preview Build** | Share a link → testers install on real device | Beta testing with real users |
| **TestFlight** | Apple's official beta platform | iOS beta before App Store |

### Push Notifications

Expo provides a web tool to send test notifications to any device by push token — no extra setup. Real push notifications require a real device (one developer phone is enough).

### Web (Commander Interface)

Run locally with `npm run dev`. E2E tests with **Playwright** (runs headless in CI).

### Telegram Bot

Create a separate test bot via BotFather — free and instant. Use a private test group with your team, completely separate from production bots.

### What You Actually Need to Start

- 0 purchased phone numbers
- 1 real iPhone or Android for push notification testing (your own phone)
- Supabase free tier
- Expo Go app installed on your phone

---

## MVP Recommendation

1. **Expo** for the app — fastest to ship
2. **Supabase** — backend ready in hours with auth + DB + RLS
3. **Telegram Bot** — relatively simple integration
4. **Next.js** for commander interface — PWA, works on desktop and tablet
5. **i18next** shared package — add from day one to avoid painful migration later
