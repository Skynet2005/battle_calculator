-- Enable UUID generation if available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NULL,
  "email" text NOT NULL,
  "email_verified" timestamp NULL,
  "image" text NULL,
  "role" text NOT NULL DEFAULT 'user',
  "password" text NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "users_name_idx" ON "users" ("name");

