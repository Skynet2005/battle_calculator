-- Migration: Decision engine - extend battle_results for saved run snapshots + permalinks
-- New columns: player_profile_id, opponent_profile_id, rally_config_snapshot, battle_config_snapshot, tags, model_version, share_token, run_type

ALTER TABLE "battle_results" ADD COLUMN IF NOT EXISTS "player_profile_id" uuid;
ALTER TABLE "battle_results" ADD COLUMN IF NOT EXISTS "opponent_profile_id" uuid;
ALTER TABLE "battle_results" ADD COLUMN IF NOT EXISTS "rally_config_snapshot" jsonb;
ALTER TABLE "battle_results" ADD COLUMN IF NOT EXISTS "battle_config_snapshot" jsonb;
ALTER TABLE "battle_results" ADD COLUMN IF NOT EXISTS "tags" jsonb;
ALTER TABLE "battle_results" ADD COLUMN IF NOT EXISTS "model_version" text;
ALTER TABLE "battle_results" ADD COLUMN IF NOT EXISTS "share_token" text;
ALTER TABLE "battle_results" ADD COLUMN IF NOT EXISTS "run_type" text;

DO $$ BEGIN
  ALTER TABLE "battle_results" ADD CONSTRAINT "battle_results_player_profile_id_profiles_id_fk" FOREIGN KEY ("player_profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "battle_results" ADD CONSTRAINT "battle_results_opponent_profile_id_profiles_id_fk" FOREIGN KEY ("opponent_profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "battle_results_share_token_unique" ON "battle_results" ("share_token") WHERE "share_token" IS NOT NULL;
