/**
 * Database Query Caching Utilities
 *
 * Provides caching for frequently accessed database queries to improve performance.
 * Uses Next.js unstable_cache for server-side caching.
 */

import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db } from './db';
import { profiles, userSettings } from './schema';

/**
 * Get cached profiles for a user
 * Cache duration: 60 seconds (1 minute)
 *
 * @param userId - The user ID to fetch profiles for
 * @returns Array of profiles for the user
 */
export const getCachedProfiles = unstable_cache(
  async (userId: string) => {
    return await db
      .select({
        id: profiles.id,
        name: profiles.name,
        data: profiles.data,
        createdAt: profiles.createdAt,
        updatedAt: profiles.updatedAt,
      })
      .from(profiles)
      .where(eq(profiles.userId, userId));
  },
  ['profiles'],
  {
    revalidate: 60, // 1 minute cache
    tags: ['profiles'] // Tag for cache invalidation
  }
);

/**
 * Get cached user settings
 * Cache duration: 60 seconds (1 minute)
 *
 * @param userId - The user ID to fetch settings for
 * @returns User settings or null if not found
 */
export const getCachedUserSettings = unstable_cache(
  async (userId: string) => {
    try {
      const result = await db
        .select({ currentProfileId: userSettings.currentProfileId })
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);

      return result[0] ?? null;
    } catch (error) {
      // Log error but don't expose details
      console.error('Error in getCachedUserSettings:', error);
      throw error;
    }
  },
  ['user-settings'], // Cache key - will be combined with function arguments
  {
    revalidate: 60, // 1 minute cache
    tags: ['user-settings'] // Tag for cache invalidation
  }
);

/**
 * Get cached profiles with current profile ID in a single optimized query
 * Uses JOIN to combine profiles and user_settings in one query
 * Cache duration: 60 seconds (1 minute)
 *
 * @param userId - The user ID to fetch profiles for
 * @returns Object with profiles array and currentProfileId
 */
export const getCachedProfilesWithCurrent = unstable_cache(
  async (userId: string) => {
    // Optimized query using LEFT JOIN
    const result = await db
      .select({
        profile: {
          id: profiles.id,
          name: profiles.name,
          data: profiles.data,
          createdAt: profiles.createdAt,
          updatedAt: profiles.updatedAt,
        },
        currentProfileId: userSettings.currentProfileId,
      })
      .from(profiles)
      .leftJoin(userSettings, eq(profiles.userId, userSettings.userId))
      .where(eq(profiles.userId, userId));

    // Extract unique currentProfileId (should be same for all rows)
    const currentProfileId = result[0]?.currentProfileId ?? null;

    // Extract unique profiles
    const profilesMap = new Map();
    for (const row of result) {
      if (row.profile && !profilesMap.has(row.profile.id)) {
        profilesMap.set(row.profile.id, row.profile);
      }
    }

    return {
      profiles: Array.from(profilesMap.values()),
      currentProfileId,
    };
  },
  ['profiles-with-current'],
  {
    revalidate: 60, // 1 minute cache
    tags: ['profiles', 'user-settings'] // Tags for cache invalidation
  }
);
