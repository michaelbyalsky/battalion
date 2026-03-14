set shell := ["bash", "-uc"]

# Show available commands
default:
  @just --list

# ── Dev ────────────────────────────────────────────────────────────────────────

# Start all apps (api + web)
dev:
  pnpm run dev

# Build all apps and packages
build:
  pnpm run build

# Lint all apps and packages
lint:
  pnpm run lint

# Run all tests
test:
  pnpm run test

# ── Environment ────────────────────────────────────────────────────────────────

# Generate .env files from .env.example templates
generate-env:
  #!/usr/bin/env bash
  _check_wsl
  files=(
    "apps/api/.env:apps/api/.env.example"
    "apps/web/.env.local:apps/web/.env.example"
  )
  for pair in "${files[@]}"; do
    dest="${pair%%:*}"
    src="${pair##*:}"
    if [ -f "$dest" ]; then
      echo "⚠  $dest already exists — skipping (delete it first to regenerate)"
    else
      cp "$src" "$dest"
      echo "✓  $dest generated"
    fi
  done

# Force regenerate all .env files (overwrites existing)
generate-env-force:
  cp apps/api/.env.example apps/api/.env
  cp apps/web/.env.example apps/web/.env.local
  echo "✓ All .env files regenerated"

# ── Database ───────────────────────────────────────────────────────────────────

# Run Drizzle migrations
db-migrate:
  pnpm run db:migrate

# Seed the database
db-seed:
  pnpm run db:seed

# Open Drizzle Studio (visual DB browser)
db-studio:
  pnpm run db:studio

# Re-run migrations + seed
db-reset:
  just db-migrate
  just db-seed
  echo "✓ Database reset"

# ── Infrastructure ─────────────────────────────────────────────────────────────

# Start Postgres + Redis and wait for Postgres to be ready
infra-up:
  #!/usr/bin/env bash
  docker compose up -d
  echo "Waiting for Postgres..."
  until docker compose exec postgres pg_isready -U dev -q; do
    sleep 1
  done
  echo "✓ Postgres ready"

# Stop Postgres + Redis
infra-down:
  docker compose down

# Tail infrastructure logs
infra-logs:
  docker compose logs -f

# ── Onboarding ─────────────────────────────────────────────────────────────────

# Full setup for a new developer (run once after clone)
bootstrap:
  #!/usr/bin/env bash
  _check_wsl
  echo "→ Installing tools via mise..."
  mise install
  echo "→ Installing pnpm dependencies..."
  pnpm install
  echo "→ Starting infrastructure..."
  just infra-up
  echo "→ Generating .env files..."
  just generate-env
  echo "→ Running migrations..."
  just db-migrate
  echo "→ Seeding database..."
  just db-seed
  echo ""
  echo "✅ All done. Run 'just dev' to start."

# ── Helpers (internal) ─────────────────────────────────────────────────────────

# Warn if not running inside WSL2
_check_wsl:
  #!/usr/bin/env bash
  if [[ "$(uname -r)" != *microsoft* ]]; then
    echo "⚠  You appear to be running outside WSL2."
    echo "   Some commands may not work correctly on native Windows."
    echo "   Open a WSL2 terminal and try again."
    exit 1
  fi
