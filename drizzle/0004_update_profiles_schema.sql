-- Migration: Update profiles table schema
-- - Remove 'data' column (replaced by payloadJson and inputJson)
-- - Add 'payload_json' column (jsonb, nullable)
-- - Add 'input_json' column (jsonb, nullable)
-- - Add 'deleted_at' column (timestamp, nullable) for soft deletes
-- - Add unique constraint on (user_id, name) for user-scoped uniqueness

-- Add new columns
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "payload_json" jsonb;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "input_json" jsonb;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;

-- Remove old data column (if exists)
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "data";

-- Add unique constraint on user_id + name for user-scoped uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_user_name_unique" ON "profiles" ("user_id", "name");
