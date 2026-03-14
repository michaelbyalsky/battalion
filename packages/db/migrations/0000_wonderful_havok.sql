CREATE TYPE "public"."alert_type" AS ENUM('absence', 'no_show', 'conflict', 'system');--> statement-breakpoint
CREATE TYPE "public"."assignment_status" AS ENUM('assigned', 'confirmed', 'no_show', 'override');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('guard', 'formation', 'training', 'briefing', 'meal', 'patrol', 'sleep');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('not_sent', 'sent', 'pending', 'active', 'expired');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('soldier', 'shift_manager', 'commander', 'battalion_commander', 'battalion_logistics');--> statement-breakpoint
CREATE TYPE "public"."soldier_status_type" AS ENUM('present', 'vacation', 'sick', 'out', 'return');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"type" "alert_type" NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "battalions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "combat_clock_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "event_type" NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"recurrence_days" integer[] DEFAULT '{}' NOT NULL,
	"required_count" integer DEFAULT 1 NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"battalion_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"telegram_bot_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"soldier_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"date" date NOT NULL,
	"role" "role" NOT NULL,
	"status" "assignment_status" DEFAULT 'assigned' NOT NULL,
	"override_reason" text
);
--> statement-breakpoint
CREATE TABLE "platoons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"parent_id" uuid
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"soldier_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "soldier_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"soldier_id" uuid NOT NULL,
	"code" varchar(6) NOT NULL,
	"status" "invite_status" DEFAULT 'not_sent' NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"accepted_at" timestamp,
	"expires_at" timestamp,
	CONSTRAINT "soldier_invites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "soldier_status_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"soldier_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"date" date NOT NULL,
	"status" "soldier_status_type" NOT NULL,
	"return_time" time,
	"departure_time" time,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "soldiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"role" "role" DEFAULT 'soldier' NOT NULL,
	"platoon_id" uuid,
	"capabilities" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "soldiers_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "event_type" NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurrence_days" integer[] DEFAULT '{}' NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"role_requirements" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combat_clock_events" ADD CONSTRAINT "combat_clock_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_battalion_id_battalions_id_fk" FOREIGN KEY ("battalion_id") REFERENCES "public"."battalions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_assignments" ADD CONSTRAINT "daily_assignments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_assignments" ADD CONSTRAINT "daily_assignments_soldier_id_soldiers_id_fk" FOREIGN KEY ("soldier_id") REFERENCES "public"."soldiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_assignments" ADD CONSTRAINT "daily_assignments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platoons" ADD CONSTRAINT "platoons_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_soldier_id_soldiers_id_fk" FOREIGN KEY ("soldier_id") REFERENCES "public"."soldiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soldier_invites" ADD CONSTRAINT "soldier_invites_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soldier_invites" ADD CONSTRAINT "soldier_invites_soldier_id_soldiers_id_fk" FOREIGN KEY ("soldier_id") REFERENCES "public"."soldiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soldier_status_records" ADD CONSTRAINT "soldier_status_records_soldier_id_soldiers_id_fk" FOREIGN KEY ("soldier_id") REFERENCES "public"."soldiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soldier_status_records" ADD CONSTRAINT "soldier_status_records_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soldiers" ADD CONSTRAINT "soldiers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soldiers" ADD CONSTRAINT "soldiers_platoon_id_platoons_id_fk" FOREIGN KEY ("platoon_id") REFERENCES "public"."platoons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;