# packages/types — Shared TypeScript Types

Zero-runtime package. Pure TypeScript types and enums shared across `apps/api`, `apps/web`, and `apps/mobile`.

## Rules

- No runtime code — only `type`, `interface`, `enum`, and `const` exports
- No external dependencies
- These are the **source of truth** for DTO shapes shared between API and clients

## What Lives Here

```typescript
// Enums (mirror the DB enums)
Role, SoldierStatus, AssignmentStatus, InviteStatus, EventType, AlertType

// Entity types (DB row shapes)
Battalion, Company, Platoon, Soldier, Task, CombatClockEvent, DailyAssignment, SoldierStatusRecord, Alert

// Nested types
RoleRequirement   — { role: Role, count: number, capabilities: string[] }

// Auth
JwtPayload        — { sub: string, battalion_id: string, company_id?: string, role: Role, exp: number }
RequestOtpDto     — { phone: string }
VerifyOtpDto      — { phone: string, code: string }
RedeemInviteDto   — { code: string }
```

## What Does NOT Live Here

- Validation decorators (`class-validator`) — those belong in `apps/api/src/*/dto/`
- Zod schemas — define in the app that needs them
- React component prop types — define locally in the component file
- DB schema types — those are inferred from Drizzle in `packages/db`

## Adding New Types

1. Add the type/interface to `src/index.ts`
2. Export it from the same file (everything is re-exported from the barrel)
3. Import in any app with `import { MyType } from '@battalion/types'`

## Naming Convention

- Entity types: PascalCase matching the DB table name (e.g. `Soldier`, `CombatClockEvent`)
- DTOs: suffix with `Dto` (e.g. `CreateSoldierDto`, `UpdateTaskDto`)
- Payloads: suffix with `Payload` (e.g. `JwtPayload`, `AlertPayload`)
