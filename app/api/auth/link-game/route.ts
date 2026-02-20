import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

import { db, migrationsReady } from '@/server/db/db';
import { users, userSettings } from '@/server/db/schema';
import { requireAuth } from '@/server/middleware/auth';
import { withErrorHandling, ApiError } from '@/server/middleware/apiErrorHandler';
import { validateBody } from '@/server/middleware/validateSchema';
import { logger } from '@/server/utils/logger';
import { z } from 'zod';

const linkGameSchema = z.object({
  role_id: z.string().min(1, 'Role ID is required'),
});

const GAME_API_BASE_URL = 'https://cg-vip-mall-wos.centurygame.com';
const GAME_ID = '20121';

/**
 * Generate auth token for game login.
 * Uses HMAC-SHA256 with the format: game_id:role_id:timestamp
 *
 * Requires GAME_AUTH_SECRET to be set in .env.local
 */
function generateGameAuth(roleId: string, timestamp: number, languageCode: string = 'EN', webVersion: string = 'v1.7.2'): string {
  const secret = process.env.GAME_AUTH_SECRET;
  if (!secret) {
    throw new ApiError(500, 'GAME_AUTH_SECRET environment variable is not configured', 'CONFIG_ERROR');
  }

  // Create query string with sorted keys (matching store website format)
  // The store website includes ALL fields in the hash: game_id, language_code, login_type, role_id, ts, webVersion
  const params: Record<string, string | number> = {
    game_id: GAME_ID,
    language_code: languageCode,
    login_type: 'role_id',
    role_id: roleId,
    ts: timestamp,
    webVersion: webVersion,
  };

  // Sort keys and create query string (matching store website _0x3faccf function)
  const sortedKeys = Object.keys(params).sort();
  const data = sortedKeys.map((key) => `${key}=${params[key]}`).join('&');

  // Generate HMAC, convert to hex, then base64 encode the hex string as UTF-8
  // This matches the store website's format: HMAC -> hex -> base64(hex as UTF-8)
  const hmacHex = crypto.createHmac('sha256', secret).update(data).digest('hex');
  const authToken = Buffer.from(hmacHex, 'utf8').toString('base64');

  logger.debug('Generated game auth token', { roleId, timestamp, data, tokenLength: authToken.length });

  return authToken;
}

/**
 * Link game account to existing authenticated user
 * This calls the game's API to authenticate and get user data, then updates the user's settings
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  await migrationsReady;
  const auth = await requireAuth(req);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'Invalid request body');
  }

  const validation = validateBody(linkGameSchema, body);
  if (!validation.success) {
    throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  const { role_id } = validation.data;
  const timestamp = Date.now();
  const languageCode = body.language_code || 'EN';
  const webVersion = body.webVersion || 'v1.7.2';

  try {
    // Call game API to authenticate
    // Note: webVersion and language_code must be included in the hash
    const authToken = generateGameAuth(role_id, timestamp, languageCode, webVersion);

    const loginPayload = {
      game_id: GAME_ID,
      login_type: 'role_id',
      role_id: role_id,
      ts: timestamp,
      auth: authToken,
      language_code: 'EN',
      webVersion: 'v1.7.2',
    };

    logger.debug('Game login request', { role_id, timestamp, authTokenLength: authToken.length, payload: { ...loginPayload, auth: '[REDACTED]' } });

    const gameLoginResponse = await fetch(`${GAME_API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://store.centurygames.com',
        'Referer': 'https://store.centurygames.com/',
      },
      body: JSON.stringify(loginPayload),
    });

    if (!gameLoginResponse.ok) {
      const errorText = await gameLoginResponse.text();
      logger.error('Game link failed', undefined, { role_id, status: gameLoginResponse.status, error: errorText });
      throw new ApiError(401, 'Game authentication failed', 'GAME_AUTH_FAILED');
    }

    // Check if token is in response headers first
    const tokenFromHeader = gameLoginResponse.headers.get('token') || gameLoginResponse.headers.get('authorization')?.replace('Bearer ', '');

    const gameLoginData = await gameLoginResponse.json();

    // Log the response structure for debugging
    logger.info('Game login response structure', {
      role_id,
      responseKeys: Object.keys(gameLoginData),
      hasData: !!gameLoginData.data,
      hasTokenHeader: !!tokenFromHeader,
      responsePreview: JSON.stringify(gameLoginData).substring(0, 200)
    });

    // Extract token from login response - check multiple possible locations
    // Also check response headers
    const gameToken =
      tokenFromHeader ||
      gameLoginData.data?.token ||
      gameLoginData.data?.access_token ||
      gameLoginData.token ||
      gameLoginData.access_token ||
      gameLoginData.data?.data?.token ||
      gameLoginData.result?.token ||
      gameLoginData.data?.result?.token ||
      null;

    if (!gameToken) {
      logger.error('No token received from game login', undefined, {
        role_id,
        response: JSON.stringify(gameLoginData).substring(0, 500),
        responseKeys: Object.keys(gameLoginData),
        hasData: !!gameLoginData.data,
        dataKeys: gameLoginData.data ? Object.keys(gameLoginData.data) : []
      });
      throw new ApiError(401, 'Game authentication failed - no token received', 'GAME_AUTH_NO_TOKEN');
    }

    logger.info('Token extracted successfully', { role_id, tokenLength: gameToken.length });

    // Call get_role_info to get actual user data
    // The token should be passed in the headers as 'token'
    const roleInfoResponse = await fetch(`${GAME_API_BASE_URL}/api/callback/get_role_info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': gameToken,
        'Origin': 'https://store.centurygames.com', // Match the game store origin
        'Referer': 'https://store.centurygames.com/',
      },
      body: JSON.stringify({}),
    });

    if (!roleInfoResponse.ok) {
      const errorText = await roleInfoResponse.text();
      logger.error('Get role info failed', undefined, {
        role_id,
        status: roleInfoResponse.status,
        statusText: roleInfoResponse.statusText,
        error: errorText,
        headers: Object.fromEntries(roleInfoResponse.headers.entries())
      });
      throw new ApiError(401, `Failed to get role information: ${errorText}`, 'ROLE_INFO_FAILED');
    }

    const roleInfoData = await roleInfoResponse.json();

    // Extract user data from get_role_info response
    const userData = roleInfoData.data?.user_data?.[0];

    if (!userData) {
      logger.error('No user data in role info response', undefined, { role_id, response: roleInfoData });
      throw new ApiError(401, 'Failed to get user data from game', 'NO_USER_DATA');
    }

    // Extract actual game data from user_data[0]
    const gameId = GAME_ID;
    const state = userData.section || userData.extra_info?.value || null;
    const profilePicture = userData.icon || null;
    const username = userData.nickname || userData.role_id || null;
    const realRoleId = userData.real_role_id || userData.role_id || role_id;

    // Extract furnace level from rank URL
    let furnaceLevel: number | null = null;
    if (userData.rank) {
      const rankMatch = userData.rank.match(/stove_lv_(\d+)\.png/);
      if (rankMatch) {
        furnaceLevel = parseInt(rankMatch[1], 10);
      }
    }

    // Update user settings with game data
    const existingSettings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, auth.userId))
      .limit(1);

    if (existingSettings.length > 0) {
      await db
        .update(userSettings)
        .set({
          gameRoleId: realRoleId,
          gameId,
          gameState: state,
          gameFurnaceLevel: furnaceLevel,
          gameProfilePicture: profilePicture,
          gameAuthToken: gameToken,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, auth.userId));
    } else {
      await db.insert(userSettings).values({
        userId: auth.userId,
        gameRoleId: realRoleId,
        gameId,
        gameState: state,
        gameFurnaceLevel: furnaceLevel,
        gameProfilePicture: profilePicture,
        gameAuthToken: gameToken,
      });
    }

    // Optionally update user's image if profile picture is available
    if (profilePicture) {
      await db
        .update(users)
        .set({
          image: profilePicture,
          updatedAt: new Date(),
        })
        .where(eq(users.id, auth.userId));
    }

    logger.info('Game account linked successfully', { userId: auth.userId, role_id });

    return NextResponse.json(
      {
        success: true,
        gameData: {
          roleId: realRoleId,
          gameId,
          state,
          furnaceLevel,
          profilePicture,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Game link process failed', error, { role_id, userId: auth.userId });
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Internal server error during game link', 'GAME_LINK_ERROR');
  }
});
