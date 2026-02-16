import { config } from './config';
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

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
  console.error('Migration error (non-fatal, will retry on next request):', error.message);
  // Return a resolved promise so the app can continue
  // The migration will retry on the next request
  return Promise.resolve();
});

export async function openConnection() {
  const client = await pool.connect();
  const db = drizzle(client, { schema, casing: 'snake_case' });
  const closeConnection = async () => client.release();
  return { db, closeConnection };
}
