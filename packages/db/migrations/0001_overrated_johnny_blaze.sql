CREATE TYPE "public"."company_type" AS ENUM('combat', 'support');--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "type" "company_type" DEFAULT 'combat' NOT NULL;