-- Ensure profiles table has optional payload/input/deleted columns without dropping legacy data
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "payload_json" jsonb;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "input_json" jsonb;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;

-- Safety: reintroduce data column if a previous migration removed it
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "data" jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Optional uniqueness guard on (user_id, name)
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_user_name_unique" ON "profiles" ("user_id", "name");
