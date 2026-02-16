import { config as loadEnv } from "dotenv";
import type { Config } from "drizzle-kit";

// Prefer .env.local (Next.js convention), fall back to .env
loadEnv({ path: ".env.local" });
loadEnv();

// drizzle-kit 0.18.x API: Config uses connectionString (no defineConfig/dialect/dbCredentials)
const drizzleConfig: Config = {
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  connectionString: process.env.DATABASE_URL ?? "",
};

export default drizzleConfig;
