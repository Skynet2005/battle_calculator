-- Migration: Add battle_results and battle_simulation_log tables
-- Created: 2025-12-18

CREATE TABLE IF NOT EXISTS "battle_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"input_hash" text NOT NULL,
	"request_json" jsonb NOT NULL,
	"response_summary_json" jsonb,
	"timeline_json" jsonb,
	"metrics_json" jsonb,
	"rationale_json" jsonb,
	"report_json" jsonb
);

CREATE TABLE IF NOT EXISTS "battle_simulation_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"input_hash" text NOT NULL,
	"latency_ms" integer,
	"cache_hit" boolean DEFAULT false,
	"error_message" text,
	"request_json" jsonb,
	"response_json" jsonb
);

DO $$ BEGIN
 ALTER TABLE "battle_results" ADD CONSTRAINT "battle_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "battle_simulation_log" ADD CONSTRAINT "battle_simulation_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "battle_results_user_id_idx" ON "battle_results" ("user_id");
CREATE INDEX IF NOT EXISTS "battle_results_input_hash_idx" ON "battle_results" ("input_hash");
CREATE INDEX IF NOT EXISTS "battle_simulation_log_user_id_idx" ON "battle_simulation_log" ("user_id");
CREATE INDEX IF NOT EXISTS "battle_simulation_log_timestamp_idx" ON "battle_simulation_log" ("timestamp");
