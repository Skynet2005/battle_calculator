## Summary

I've implemented the **create-profiles-schema** feature. Here's what was done:

### Changes Made

#### 1. Updated Schema (`schema/profiles.ts`)
The profiles table now has the following fields as requested:
- **id**: UUID primary key with auto-generated random value
- **userId**: UUID foreign key referencing `users.id` with CASCADE delete (NOT NULL)
- **name**: Text field (NOT NULL)
- **payloadJson**: JSONB field (nullable) - *new*
- **inputJson**: JSONB field (nullable) - *new*
- **createdAt**: Timestamp with database-side default `now()` (NOT NULL)
- **updatedAt**: Timestamp with database-side default `now()` and client-side `$onUpdate` trigger (NOT NULL)
- **deletedAt**: Timestamp for soft deletes (nullable) - *new*

**Constraints & Indexes:**
- `profiles_user_idx`: Index on `userId` for efficient queries
- `profiles_user_name_unique`: **New** unique composite index on `(userId, name)` for user-scoped uniqueness

**Type Exports:**
- `DbProfile` - Type inferred from select operations
- `DbProfileInsert` - Type inferred for insert operations (new export)

#### 2. Created Migration (`drizzle/0004_update_profiles_schema.sql`)
Migration SQL to:
- Add `payload_json` column (JSONB)
- Add `input_json` column (JSONB)  
- Add `deleted_at` column (timestamp)
- Remove old `data` column
- Add unique index on `(user_id, name)`

#### 3. Added Schema Tests (`__tests__/schema/profiles.test.ts`)
Tests verifying:
- All required columns exist
- Table name is correct
- Type inference works correctly for select and insert types
- Nullable fields (payloadJson, inputJson, deletedAt) work as expected

### Notes for Developer

1. **Breaking Change**: The `data` field was removed and replaced with `payloadJson` and `inputJson`. Any code using `profiles.data` will need to be updated.

2. **API Routes**: The file `app/api/profiles/route.ts` references the old `data` field and will need to be updated to use `payloadJson` and/or `inputJson` instead.

3. **Existing Tests**: The tests in `__tests__/api/profiles/route.test.ts` use the old `data` field in mocks and will need updating.

4. **Running Migration**: After deploying, run `npx drizzle-kit push` or apply the migration manually to update the database schema.

5. **User-Scoped Uniqueness**: Profile names must now be unique per user - attempting to create two profiles with the same name for the same user will fail.