// Roles
export type Role = 'soldier' | 'shift_manager' | 'commander' | 'battalion_commander' | 'battalion_logistics'

// Company type
// 'combat'  — standard fighting company (פלוגת קו), scoped to its own soldiers
// 'support' — Support Company / פלסם, battalion-wide read access
export type CompanyType = 'combat' | 'support'

// Soldier status
export type SoldierStatus = 'present' | 'vacation' | 'sick' | 'out' | 'return'

// Assignment status
export type AssignmentStatus = 'assigned' | 'confirmed' | 'no_show' | 'override'

// Invite status
export type InviteStatus = 'not_sent' | 'sent' | 'pending' | 'active' | 'expired'

// Combat clock event type
export type EventType = 'guard' | 'formation' | 'training' | 'briefing' | 'meal' | 'patrol' | 'sleep'

// Alert type
export type AlertType = 'absence' | 'no_show' | 'conflict' | 'system'

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface Battalion {
  id: string
  name: string
  createdAt: string
}

export interface Company {
  id: string
  battalionId: string
  name: string
  type: CompanyType
  telegramBotToken: string | null
  createdAt: string
}

export interface Platoon {
  id: string
  companyId: string
  name: string
  parentId: string | null
}

export interface Soldier {
  id: string
  companyId: string
  name: string
  phone: string
  role: Role
  platoonId: string | null
  capabilities: string[]
  inviteStatus: InviteStatus
  createdAt: string
}

export interface Task {
  id: string
  companyId: string
  name: string
  type: EventType
  isRecurring: boolean
  recurrenceDays: number[]
  startTime: string
  endTime: string
  roleRequirements: RoleRequirement[]
}

export interface RoleRequirement {
  role: Role
  count: number
  capabilities: string[]
}

export interface CombatClockEvent {
  id: string
  companyId: string
  name: string
  type: EventType
  startTime: string
  endTime: string
  recurrenceDays: number[]
  requiredCount: number
  notes: string | null
}

export interface DailyAssignment {
  id: string
  companyId: string
  soldierId: string
  taskId: string
  date: string
  role: Role
  status: AssignmentStatus
  overrideReason: string | null
}

export interface SoldierStatusRecord {
  soldierId: string
  date: string
  status: SoldierStatus
  returnTime: string | null
  departureTime: string | null
  notes: string | null
}

export interface Alert {
  id: string
  companyId: string
  type: AlertType
  payload: Record<string, unknown>
  readAt: string | null
  createdAt: string
}

// ── Auth DTOs ─────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string
  battalion_id: string
  company_id: string        // always present — soldier's own company
  battalion_scope: boolean  // true for support company soldiers → battalion-wide read access
  role: Role
  exp: number
}

export interface RequestOtpDto {
  phone: string
}

export interface VerifyOtpDto {
  phone: string
  code: string
}

export interface RedeemInviteDto {
  code: string
}
