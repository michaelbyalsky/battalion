# packages/i18n — Shared Translations

i18next translations shared across `apps/web` and `apps/mobile`.

## Files

```
src/
  index.ts        — exports i18next instance
  config.ts       — defaultLocale: 'he', locales: ['he', 'en']
locales/
  he.json         — Hebrew (primary language)
  en.json         — English
```

## Rules

- **Never hardcode strings** in components — all text goes through i18n
- Both `he.json` and `en.json` must always stay in sync (same keys)
- Default language is Hebrew (`he`) — Hebrew is the source of truth for key naming

## Adding New Keys

1. Add the key to `he.json` first
2. Add the same key to `en.json`
3. Use the key in components via `useTranslation()` or `getTranslation()`

```json
// he.json
{ "soldiers": { "addSoldier": "הוסף חייל" } }

// en.json
{ "soldiers": { "addSoldier": "Add Soldier" } }
```

## Key Naming Convention

Keys follow a hierarchical dot-notation structure:
```
nav.*               — sidebar navigation labels
auth.*              — login / OTP / invite screens
soldiers.*          — soldier management
soldiers.inviteStatus.*  — invite state labels
status.*            — soldier presence statuses
eventTypes.*        — combat clock event type names
common.*            — shared UI (save, cancel, loading, error, etc.)
```

## Usage in Web (Next.js)

```typescript
// Client Component
import { useTranslation } from '@company/i18n'
const { t } = useTranslation()
t('soldiers.addSoldier')

// Server Component
import { getTranslation } from '@company/i18n'
const { t } = await getTranslation(locale)
t('soldiers.addSoldier')
```

## Usage in Mobile (React Native)

```typescript
import { useTranslation } from '@company/i18n'
const { t } = useTranslation()
t('soldiers.addSoldier')
```

## RTL

Language preference is stored in the user's DB profile and local cache.
- `'he'` → RTL layout
- `'en'` → LTR layout

Web sets `<html dir="...">` in layout. Mobile uses `I18nManager.forceRTL(locale === 'he')`.
