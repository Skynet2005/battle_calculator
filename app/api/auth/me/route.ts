import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db, migrationsReady } from '@/server/db/db';
import { users, userSettings } from '@/server/db/schema';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling, ApiError } from '@/server/middleware/apiErrorHandler';

export const GET = withErrorHandling(async (req: NextRequest) => {
  await migrationsReady;
  const auth = await requireAuth(req);

  const [userResult, settingsResult] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        username: users.name,
        image: users.image,
      })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1),
    db
      .select({
        gameRoleId: userSettings.gameRoleId,
        gameId: userSettings.gameId,
        gameState: userSettings.gameState,
        gameFurnaceLevel: userSettings.gameFurnaceLevel,
        gameProfilePicture: userSettings.gameProfilePicture,
      })
      .from(userSettings)
      .where(eq(userSettings.userId, auth.userId))
      .limit(1),
  ]);

  const user = userResult[0];
  const settings = settingsResult[0];

  if (!user) {
    throw new ApiError(401, 'User not found', 'USER_NOT_FOUND');
  }

  const response = {
    ...user,
    gameData: settings
      ? {
          roleId: settings.gameRoleId,
          gameId: settings.gameId,
          state: settings.gameState,
          furnaceLevel: settings.gameFurnaceLevel,
          profilePicture: settings.gameProfilePicture || user.image,
        }
      : null,
  };

  // Add short private cache for user data (user-specific, so private cache)
  // max-age: 30 seconds - short cache for user data
  // private: only cacheable by user's browser, not CDN
  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
    },
  });
});

