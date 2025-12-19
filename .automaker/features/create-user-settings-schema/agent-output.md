## Summary

I've successfully implemented the `UserSettings` table schema as requested. Here's what was done:

### Files Created/Modified:

1. **`schema/user_settings.ts`** - Updated the Drizzle ORM schema with:
   - `id` - UUID primary key (auto-generated)
   - `userId` - UUID foreign key to `users.id` (NOT NULL, CASCADE on delete)
   - `currentProfileId` - UUID foreign key to `profiles.id` (nullable, SET NULL on delete)
   - `theme` - Text field with default "system" (NOT NULL)
   - `createdAt` - Timestamp with `now()` default
   - `updatedAt` - Timestamp with `now()` default and `$onUpdate` for auto-updates
   - **Indexes**: Unique index on `userId`, regular index on `currentProfileId`
   - **Type exports**: `UserSettings` (select type), `UserSettingsInsert` (insert type)

2. **`drizzle/0005_update_user_settings_schema.sql`** - Migration to alter the existing table:
   - Adds `id` column with UUID default
   - Adds `theme` column with "system" default
   - Drops the old primary key on `user_id`
   - Adds new primary key on `id`
   - Creates index on `current_profile_id`

3. **`__tests__/schema/user_settings.test.ts`** - Comprehensive test suite (9 tests):
   - Table structure validation
   - Type inference tests for select and insert types
   - Nullable field tests
   - Theme field tests
   - Foreign key relationship tests

### Foreign Key Relationships:
- **userId → users.id**: CASCADE on delete (when a user is deleted, their settings are also deleted)
- **currentProfileId → profiles.id**: SET NULL on delete (when a profile is deleted, the reference becomes null)

### Notes for Developer:
1. The `theme` field defaults to `"system"` - you may want to adjust this or add validation for specific values like "light", "dark", "system"
2. The migration assumes the existing `user_settings` table exists with the old schema (userId as primary key). If this is a fresh database, you may want to use a CREATE TABLE migration instead
3. All tests pass (9/9) and TypeScript compiles without errors
4. The schema follows the existing conventions in the codebase (timestamps, UUID primary keys, snake_case in DB via Drizzle's casing config)