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
import { db, soldiers, eq, and } from '@company/db'

// Always filter by companyId — no exceptions
db.select().from(soldiers).where(eq(soldiers.companyId, companyId))
```

## Multi-Tenancy Rule

**Every table has `company_id`. Every query must filter by it.**

The repository layer is the only place that calls `db.*`. Services never import from `@company/db` directly.

## Tables

| Table | Purpose |
|-------|---------|
| `companies` | Root tenant |
| `units` | Hierarchical unit groups (parentId) |
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
role             — soldier | shift_manager | commander
soldier_status   — present | vacation | sick | out | return
assignment_status — assigned | confirmed | no_show | override
invite_status    — not_sent | sent | pending | active | expired
event_type       — guard | formation | training | briefing | meal | patrol | sleep
alert_type       — absence | no_show | conflict | system
```

## Adding a New Table

1. Define the table in `schema.ts` — include `companyId` (FK → companies) on every table
2. Export it from `index.ts`
3. Run `mise run db:migrate` to generate and apply migration
4. Add to seed if needed

## Schema Conventions

- UUID primary keys: `id: uuid('id').primaryKey().defaultRandom()`
- Company FK: `companyId: uuid('company_id').notNull().references(() => companies.id)`
- Timestamps: `createdAt: timestamp('created_at').defaultNow().notNull()`
- Use `text` for strings, `integer` for numbers, `boolean`, `jsonb` for flexible payloads
- JSONB columns (e.g. `roleRequirements`, `payload`) typed via `.$type<T>()`

## Migrations

```bash
just db-migrate   # run pending migrations  (pnpm --filter=packages/db migrate)
just db-studio    # open Drizzle Studio, port 4983
just db-reset     # re-migrate + re-seed (dev only)
```

DB commands bypass turbo — they use `pnpm --filter=packages/db` directly since they target a single package.

Never edit migration files manually after they have been applied.

## Seed

Test data created by `seed.ts`:
- 1 company
- 1 unit
- 3 soldiers on phones `+972500000001–003` (OTP `123456`)
