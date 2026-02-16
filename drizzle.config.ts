import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Prefer .env.local (Next.js convention), fall back to .env
loadEnv({ path: ".env.local" });
loadEnv();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
  out: "./drizzle",
  casing: "snake_case",
});
