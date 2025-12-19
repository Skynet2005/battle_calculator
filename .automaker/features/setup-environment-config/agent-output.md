Summary:
- Added a `.env.local.example` file listing the required environment variables `DATABASE_URL`, `AUTH_SECRET`, and `NEXTAUTH_SECRET`.
- Implemented environment validation during server startup by reading the `.env.local` file with `dotenv`, ensuring all required variables are set, logging descriptive errors, and terminating the process if any are missing.
- Added tests verifying that the validator succeeds when all env vars are provided and fails with helpful error messages when any are missing, using temporary files to simulate `.env.local` contents.

Notes:
- Ensure `.env.local` exists in environments using this project; copy from `.env.local.example` and fill in secret values before running.
- Tests manipulate environment variables—make sure the actual environment is clean when running the suite.