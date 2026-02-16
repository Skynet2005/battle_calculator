-- Add game user data columns to user_settings table
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "game_role_id" text;
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "game_id" text;
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "game_state" text;
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "game_furnace_level" integer;
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "game_profile_picture" text;
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "game_auth_token" text;
