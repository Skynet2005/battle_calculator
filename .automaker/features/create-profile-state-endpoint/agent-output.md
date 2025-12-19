No lint errors. Let me provide a summary of what was implemented:

## Summary

I've successfully implemented the `/api/profile-state` endpoint with the following features:

### Endpoint Implementation (`app/api/profile-state/route.ts`)

**GET `/api/profile-state`**
- Returns the current active profile ID for the authenticated user
- User-scoped access control via JWT authentication
- Returns `{ currentProfileId: string | null }` 
- Returns 401 Unauthorized if no token or invalid token

**POST `/api/profile-state`**
- Sets the current active profile ID for the authenticated user
- **Security improvements made:**
  - Validates that the profile exists and belongs to the user before setting it
  - Returns 404 if profile doesn't exist or belongs to another user
  - Returns 400 if `currentProfileId` is not a string type
- Supports setting `currentProfileId` to `null` to clear the selection
- Uses upsert pattern (creates user_settings if not exists, updates if exists)
- Returns `{ ok: true }` on success

### Error Handling Improvements
- Both GET and POST now properly wrap `verifyAuthToken()` in try-catch blocks
- Invalid/expired JWT tokens return 401 Unauthorized instead of throwing

### Test Suite (`__tests__/api/profile-state/route.test.ts`)
Created comprehensive tests covering:
- Authentication (missing token, invalid token)
- GET returning null when no settings exist
- GET returning the correct profileId when settings exist
- POST validation (non-string profileId)
- POST profile ownership validation (404 if not found or wrong user)
- POST creating new settings
- POST updating existing settings
- POST allowing null to clear profile

### Test Infrastructure
- Added vitest to the project
- Created `vitest.config.mts` with proper ESM configuration
- Added `npm test` script to package.json
- All 13 tests pass

### Notes for Developer
1. The existing codebase has some unrelated build errors (missing module imports in `lib/battle/` and `lib/profile-migration.ts`) that existed before this implementation
2. The endpoint follows the existing patterns in the codebase (JWT auth via cookies, Drizzle ORM queries, Next.js App Router conventions)
3. The `user_settings` table already existed in the schema with `currentProfileId` as a foreign key to `profiles`