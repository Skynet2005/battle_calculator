-- Migration: Decision engine - calibration_parameters, battle_report_imports, calibration_observations

CREATE TABLE IF NOT EXISTS "calibration_parameters" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "version" text NOT NULL,
  "name" text NOT NULL,
  "params_json" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "is_active" boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS "battle_report_imports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "raw_text" text NOT NULL,
  "parsed_json" jsonb,
  "linked_battle_result_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "calibration_observations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "report_import_id" uuid NOT NULL,
  "predicted_winner" text NOT NULL,
  "observed_winner" text NOT NULL,
  "predicted_remaining_json" jsonb,
  "observed_remaining_json" jsonb,
  "win_correct" boolean NOT NULL,
  "remaining_error_json" jsonb
);

DO $$ BEGIN
  ALTER TABLE "calibration_parameters" ADD CONSTRAINT "calibration_parameters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "battle_report_imports" ADD CONSTRAINT "battle_report_imports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "battle_report_imports" ADD CONSTRAINT "battle_report_imports_linked_battle_result_id_battle_results_id_fk" FOREIGN KEY ("linked_battle_result_id") REFERENCES "battle_results"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "calibration_observations" ADD CONSTRAINT "calibration_observations_report_import_id_battle_report_imports_id_fk" FOREIGN KEY ("report_import_id") REFERENCES "battle_report_imports"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "calibration_parameters_user_id_idx" ON "calibration_parameters" ("user_id");
CREATE INDEX IF NOT EXISTS "battle_report_imports_user_id_idx" ON "battle_report_imports" ("user_id");
CREATE INDEX IF NOT EXISTS "calibration_observations_report_import_id_idx" ON "calibration_observations" ("report_import_id");
