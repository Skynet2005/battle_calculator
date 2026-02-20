-- Add indexes on profiles.updated_at and profiles.deleted_at for query performance
CREATE INDEX IF NOT EXISTS "profiles_updated_at_idx" ON "profiles" ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profiles_deleted_at_idx" ON "profiles" ("deleted_at");
