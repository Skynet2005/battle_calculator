-- Migration: Add composite indexes for query optimization
-- Created: 2025-01-XX
-- Purpose: Improve query performance for common access patterns

-- Composite index for profile queries (user + created_at for sorting)
-- This helps when fetching profiles for a user ordered by creation date
CREATE INDEX IF NOT EXISTS "idx_profiles_user_created"
ON "profiles" ("user_id", "created_at" DESC);

-- Composite index for battle results queries (user + input_hash)
-- This helps when looking up battle results by user and input hash
CREATE INDEX IF NOT EXISTS "idx_battle_results_user_hash"
ON "battle_results" ("user_id", "input_hash");

-- Composite index for user lookups (username + email)
-- This helps with leaderboard and user search queries
CREATE INDEX IF NOT EXISTS "idx_users_username_email"
ON "users" ("name", "email");

-- Index for battle results by user and creation date (for history queries)
CREATE INDEX IF NOT EXISTS "idx_battle_results_user_created"
ON "battle_results" ("user_id", "created_at" DESC);
