import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  time,
  date,
} from 'drizzle-orm/pg-core'

// ── Enums ─────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum('role', [
  'soldier',
  'shift_manager',
  'commander',
  'battalion_commander',
  'battalion_logistics',
])
export const companyTypeEnum = pgEnum('company_type', ['combat', 'support'])
export const soldierStatusEnum = pgEnum('soldier_status_type', ['present', 'vacation', 'sick', 'out', 'return'])
export const assignmentStatusEnum = pgEnum('assignment_status', ['assigned', 'confirmed', 'no_show', 'override'])
export const inviteStatusEnum = pgEnum('invite_status', ['not_sent', 'sent', 'pending', 'active', 'expired'])
export const eventTypeEnum = pgEnum('event_type', ['guard', 'formation', 'training', 'briefing', 'meal', 'patrol', 'sleep'])
export const alertTypeEnum = pgEnum('alert_type', ['absence', 'no_show', 'conflict', 'system'])

// ── Battalions ────────────────────────────────────────────────────────────────
// גדוד — root tenant. Each battalion signs up and owns multiple companies (פלוגות).

export const battalions = pgTable('battalions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Companies ─────────────────────────────────────────────────────────────────
// פלוגה — child of battalion.
// type='combat'  → standard fighting company (פלוגת קו), scoped to own soldiers only.
// type='support' → Support Company / פלסם (פלוגת סיוע מנהלתי), battalion-wide read access.

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  battalionId: uuid('battalion_id').notNull().references(() => battalions.id),
  name: varchar('name', { length: 255 }).notNull(),
  type: companyTypeEnum('type').notNull().default('combat'),
  telegramBotToken: text('telegram_bot_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Platoons ──────────────────────────────────────────────────────────────────
// מחלקה — hierarchical sub-groups within a company. parentId supports nested structure.

export const platoons = pgTable('platoons', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  name: varchar('name', { length: 255 }).notNull(),
  parentId: uuid('parent_id'),
})

// ── Soldiers ──────────────────────────────────────────────────────────────────

export const soldiers = pgTable('soldiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  role: roleEnum('role').notNull().default('soldier'),
  platoonId: uuid('platoon_id').references(() => platoons.id),
  capabilities: text('capabilities').array().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Soldier Invites ───────────────────────────────────────────────────────────

export const soldierInvites = pgTable('soldier_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  soldierId: uuid('soldier_id').notNull().references(() => soldiers.id),
  code: varchar('code', { length: 6 }).notNull().unique(),
  status: inviteStatusEnum('status').notNull().default('not_sent'),
  scheduledAt: timestamp('scheduled_at'),
  sentAt: timestamp('sent_at'),
  acceptedAt: timestamp('accepted_at'),
  expiresAt: timestamp('expires_at'),
})

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  name: varchar('name', { length: 255 }).notNull(),
  type: eventTypeEnum('type').notNull(),
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurrenceDays: integer('recurrence_days').array().notNull().default([]),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  roleRequirements: jsonb('role_requirements').notNull().default([]),
})

// ── Combat Clock Events ───────────────────────────────────────────────────────

export const combatClockEvents = pgTable('combat_clock_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  name: varchar('name', { length: 255 }).notNull(),
  type: eventTypeEnum('type').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  recurrenceDays: integer('recurrence_days').array().notNull().default([]),
  requiredCount: integer('required_count').notNull().default(1),
  notes: text('notes'),
})

// ── Daily Assignments ─────────────────────────────────────────────────────────

export const dailyAssignments = pgTable('daily_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  soldierId: uuid('soldier_id').notNull().references(() => soldiers.id),
  taskId: uuid('task_id').notNull().references(() => tasks.id),
  date: date('date').notNull(),
  role: roleEnum('role').notNull(),
  status: assignmentStatusEnum('status').notNull().default('assigned'),
  overrideReason: text('override_reason'),
})

// ── Soldier Status ────────────────────────────────────────────────────────────

export const soldierStatusRecords = pgTable('soldier_status_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  soldierId: uuid('soldier_id').notNull().references(() => soldiers.id),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  date: date('date').notNull(),
  status: soldierStatusEnum('status').notNull(),
  returnTime: time('return_time'),
  departureTime: time('departure_time'),
  notes: text('notes'),
})

// ── Alerts ────────────────────────────────────────────────────────────────────

export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  type: alertTypeEnum('type').notNull(),
  payload: jsonb('payload').notNull().default({}),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Refresh Tokens ────────────────────────────────────────────────────────────

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  soldierId: uuid('soldier_id').notNull().references(() => soldiers.id),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
