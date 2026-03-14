# packages/db — Drizzle ORM Schema & Database

Shared database package. Used only by `apps/api` (never imported directly by web or mobile).

## Files

```
src/
  index.ts        — exports: db client + all tables + all enums
  schema.ts       — all Drizzle table definitions and enums
  seed.ts         — dev seed: 1 company, 1 unit, 3 test soldiers
drizzle.config.ts — dialect: postgresql, migrations in ./migrations/
```

## Usage in Repositories

```typescript
import { db, soldiers, eq, and } from '@battalion/db'

// Always filter by companyId — no exceptions
db.select().from(soldiers).where(eq(soldiers.companyId, companyId))
```

## Multi-Tenancy Rule

**Every operational table has `company_id`. Every query must filter by it.**

The repository layer is the only place that calls `db.*`. Services never import from `@battalion/db` directly.

## Hierarchy

```
battalions (גדוד)   — root tenant, signs up and pays
  └── companies (פלוגה) — child of battalion, has Telegram bot + soldiers
        └── platoons (מחלקה) — sub-groups within a company
              └── soldiers — belong to company + optional platoon
```

## Tables

| Table | Purpose |
|-------|---------|
| `battalions` | Root tenant (גדוד) |
| `companies` | פלוגה — child of battalion |
| `platoons` | מחלקה — hierarchical groups within a company |
| `soldiers` | User profile, role, capabilities |
| `soldier_invites` | 6-char invite codes, status lifecycle |
| `tasks` | Task templates (recurring + one-off) |
| `combat_clock_events` | Weekly recurring schedule template |
| `daily_assignments` | Soldier ↔ task ↔ specific date |
| `soldier_status_records` | Daily presence records |
| `alerts` | System notifications |
| `refresh_tokens` | JWT refresh token storage |

## Enums

```typescript
role             — soldier | shift_manager | commander | battalion_commander | battalion_logistics
soldier_status   — present | vacation | sick | out | return
assignment_status — assigned | confirmed | no_show | override
invite_status    — not_sent | sent | pending | active | expired
event_type       — guard | formation | training | briefing | meal | patrol | sleep
alert_type       — absence | no_show | conflict | system
```

## Adding a New Table

1. Define the table in `schema.ts` — include `companyId` (FK → companies) on every operational table
2. Export it from `index.ts` (auto-exported via `export * from './schema'`)
3. Run `just db-generate` to generate migration, then `just db-migrate` to apply
4. Add to seed if needed

## Schema Conventions

- UUID primary keys: `id: uuid('id').primaryKey().defaultRandom()`
- Company FK: `companyId: uuid('company_id').notNull().references(() => companies.id)`
- Timestamps: `createdAt: timestamp('created_at').defaultNow().notNull()`
- Use `text` for strings, `integer` for numbers, `boolean`, `jsonb` for flexible payloads
- JSONB columns (e.g. `roleRequirements`, `payload`) typed via `.$type<T>()`

## Migrations

```bash
just db-generate  # generate migration files from schema changes
just db-migrate   # apply pending migrations to the DB
just db-seed      # seed with dev data (1 company, 1 unit, 3 soldiers)
just db-setup     # generate + migrate + seed (first-time setup)
just db-reset     # migrate + seed (re-seed existing DB)
just db-studio    # open Drizzle Studio, port 4983
```

**Always run `just db-generate` after changing `schema.ts`**, then commit the generated migration file.

DB commands bypass turbo — they use `pnpm --filter=packages/db` directly since they target a single package.

Never edit migration files manually after they have been applied.

## Seed

Test data created by `seed.ts`:
- 1 battalion (גדוד 8200)
- 1 company/פלוגה (פלוגת פיתוח)
- 1 platoon/מחלקה (מחלקה א)
- 3 soldiers on phones `+972500000001–003` (OTP `123456`)
