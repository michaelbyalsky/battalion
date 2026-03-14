# apps/api — NestJS Backend

NestJS 11 API server. Port 3000. All routes prefixed with `/api` (set in `main.ts`).

## 3-Layer Architecture

Every feature module **must** have all three layers. See root `CLAUDE.md` for full explanation and example.

```
Controller  →  Service  →  Repository
```

- **Controller** — routing, guards, DTO validation, response shaping. No DB, no logic.
- **Service** — business logic only. No `db.*` calls. No HTTP types.
- **Repository** — Drizzle queries only. Always receives `companyId` as first param.

## Module Structure

```
src/
  <feature>/
    <feature>.module.ts       — imports Repository, Service, Controller
    <feature>.controller.ts
    <feature>.service.ts
    <feature>.repository.ts
    dto/
      create-<feature>.dto.ts
      update-<feature>.dto.ts
  common/
    guards/
      jwt.guard.ts
      roles.guard.ts
    interceptors/
      tenant.interceptor.ts
    decorators/
      roles.decorator.ts
```

## Request Lifecycle

```
Request (cookie)
  ↓ JwtGuard        — verifies JWT, sets req.user = { sub, company_id, role }
  ↓ TenantInterceptor — sets req.companyId = req.user.company_id
                        also: SET app.current_company_id (RLS)
  ↓ RolesGuard      — checks req.user.role against @Roles(...)
  ↓ Controller      — parses request, calls service
  ↓ Service         — runs business logic, calls repository
  ↓ Repository      — runs Drizzle query filtered by companyId
```

## Guards & Decorators

Apply on every protected route:

```typescript
@UseGuards(JwtGuard, RolesGuard)
@Roles('commander')
@Get()
```

Public routes (OTP endpoints only) use `@Public()` decorator to skip `JwtGuard`.

## DTOs

- Use `class-validator` decorators (`@IsString()`, `@IsPhoneNumber()`, etc.)
- `ValidationPipe` is global — applied in `main.ts`
- Input DTOs live in `dto/` subfolder of the feature
- Response types come from `@battalion/types`

## Multi-Tenancy Rules

- **Never** accept `company_id` from request body or params
- **Always** read `companyId` from `req.companyId` (set by `TenantInterceptor`)
- **Always** pass `companyId` as the first argument to every repository method

## Auth Module

```
POST /api/auth/request-otp   — send OTP via Twilio (public)
POST /api/auth/verify-otp    — verify OTP, issue JWT cookies (public)
POST /api/auth/logout        — clear cookies (authenticated)
POST /api/auth/refresh       — issue new access token from refresh token (public)
POST /api/auth/redeem        — redeem invite code, activate soldier account (public)
```

JWT stored as `httpOnly` cookie. Access token: 15 min. Refresh token: 30 days (stored in Redis).

## Adding a New Feature Module

1. Create `src/<feature>/` folder with all 4 files + `dto/`
2. Add `@Module({ imports: [DbModule?], providers: [Repo, Service], controllers: [Controller] })`
3. Import the module in `app.module.ts`
4. All routes automatically get `TenantInterceptor` (global)

## Environment Variables

See `.env.example`. Key vars:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `JWT_SECRET` — 32+ random bytes (stored in AWS Secrets Manager in prod)
- `TWILIO_*` — Account SID, Auth Token, phone number

## Dev Commands

```bash
just dev    # start api + web (turbo runs both in parallel)
just test   # run all tests   (turbo, all packages)
just lint   # lint all        (turbo, all packages)
```

`just` → `pnpm run` → `turbo`. Never call turbo or pnpm directly.
