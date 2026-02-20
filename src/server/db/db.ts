import { config } from './config';
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { logger } from '@/server/utils/logger';

const pool = new Pool({
  connectionString: config.DB_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
});

export const db = drizzle(pool, { schema, casing: 'snake_case' });

// Ensure migrations run once at startup so required tables (e.g., users) exist.
// Wrap in try-catch to handle connection issues gracefully
export const migrationsReady = migrate(db, { migrationsFolder: 'drizzle' }).catch((error) => {
  logger.error('Migration error (non-fatal, will retry on next request)', error);
  // In production, fail fast so deployment does not serve with missing tables
  if (process.env.NODE_ENV === 'production') {
    return Promise.reject(error);
  }
  return Promise.resolve();
});

export async function openConnection() {
  const client = await pool.connect();
  const db = drizzle(client, { schema, casing: 'snake_case' });
  const closeConnection = async () => client.release();
  return { db, closeConnection };
}
