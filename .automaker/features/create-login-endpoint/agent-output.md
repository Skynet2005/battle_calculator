## Implementation Summary

I have successfully implemented the **POST /api/auth/login** endpoint for the expedition battle calculator application. Here's what was created:

### Files Created

| File | Description |
|------|-------------|
| `app/api/auth/login/route.ts` | The main login endpoint handler |
| `lib/auth.ts` | JWT authentication utilities (sign, verify, cookie options) |
| `lib/db/db.ts` | Database connection with Drizzle ORM |
| `lib/db/config.ts` | Database configuration |
| `lib/db/schema.ts` | Schema exports |
| `schema/users.ts` | User table schema definition |
| `__tests__/api/auth/login.test.ts` | Comprehensive tests for the login endpoint |
| `__tests__/lib/auth.test.ts` | Tests for auth utilities |
| `package.json` | Dependencies including bcryptjs, jose, drizzle-orm, pg |
| `tsconfig.json` | TypeScript configuration with path aliases |
| `vitest.config.ts` | Test runner configuration |

### Endpoint Features

The **POST /api/auth/login** endpoint:

1. **Verifies credentials**: Accepts `username` (can be username OR email) and `password`
2. **Generates JWT token**: Using the `jose` library with HS256 algorithm, 7-day expiration
3. **Sets secure HTTP-only cookie**: 
   - `HttpOnly: true` (prevents XSS attacks)
   - `SameSite: lax` (CSRF protection)
   - `Secure: true` in production (HTTPS only)
   - 7-day expiration
4. **Returns user data**: `id`, `email`, `username` (password is never returned)

### Security Features

- Passwords are hashed with bcryptjs (bcrypt.compare for verification)
- JWT tokens are signed with a secret key from environment variables
- HTTP-only cookies prevent client-side JavaScript access
- Same generic "Invalid credentials" error for both missing user and wrong password (prevents user enumeration)
- Input validation for required fields and types

### Notes for Developer

1. **Environment Variables Required**:
   - `AUTH_SECRET` or `NEXTAUTH_SECRET` - JWT signing secret
   - `DATABASE_URL` or `DB_URL` - PostgreSQL connection string

2. **Dependencies to Install**:
   ```bash
   npm install bcryptjs jose drizzle-orm pg dotenv next react react-dom
   npm install -D vitest @types/bcryptjs @types/pg typescript drizzle-kit
   ```

3. **Database**: Requires a PostgreSQL database with a `users` table (schema included in `schema/users.ts`)

4. **Tests**: Run with `npm test` - 14 test cases covering validation, authentication, error handling, and cookie setting