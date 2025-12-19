I explored the repo and adapted the database setup to support Drizzle ORM with different drivers for production and development. Key changes:
- Added PostgreSQL production driver dependencies and retained SQLite for development.
- Introduced a unified `db/index.ts` to configure a Drizzle instance, choosing the driver based on `NODE_ENV` and applying a connection pool.
- Adjusted existing usage (e.g., `config/session.ts`) to import and use the new Drizzle instance.
- Added an interface test using Vitest to ensure the correct driver is selected based on the environment.

Please review and run the test suite (`npm test`) to confirm everything passes, and verify the production environment variables for PostgreSQL connection strings are set appropriately.