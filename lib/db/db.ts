import { config } from '@/lib/db/config';
import * as schema from '@/lib/db/schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: config.DB_URL,
});

export const db = drizzle(pool, { schema, casing: 'snake_case' });

// Ensure migrations run once at startup so required tables (e.g., users) exist.
export const migrationsReady = migrate(db, { migrationsFolder: 'drizzle' });

export async function openConnection() {
  const client = await pool.connect();
  const db = drizzle(client, { schema, casing: 'snake_case' });
  const closeConnection = async () => client.release();
  return { db, closeConnection };
}
