import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { authCookieOptions, signAuthToken } from '@/server/auth/auth';
import { db, migrationsReady } from '@/server/db/db';
import { users, userSettings } from '@/server/db/schema';
import { ApiError, withErrorHandling } from '@/server/middleware/apiErrorHandler';
import { rateLimit } from '@/server/middleware/rateLimit';
import { validateBody } from '@/server/middleware/validateSchema';
import { logger } from '@/server/utils/logger';
import { z } from 'zod';

// Rate limit: 5 requests per 15 minutes
const gameLoginRateLimit = rateLimit(5, 15 * 60 * 1000);

const gameLoginSchema = z.object({
  role_id: z.string().min(1, 'Role ID is required'),
});

const GAME_API_BASE_URL = 'https://cg-vip-mall-wos.centurygame.com';
const GAME_ID = '20121';

/**
 * Generate auth token for game login
 * Based on the game's authentication mechanism
 *
 * Found secret from giftcode website: 'tB87#kPtkxqOS2'
 * The game uses HMAC-SHA256 with the format: game_id:role_id:timestamp
 *
 * Add to .env.local: GAME_AUTH_SECRET=tB87#kPtkxqOS2
 */
function generateGameAuth(roleId: string, timestamp: number, languageCode: string = 'EN', webVersion: string = 'v1.7.2'): string {
  // Found in store website code: 'frpSTDbHmApb4CyZ'
  const secret = process.env.GAME_AUTH_SECRET || 'frpSTDbHmApb4CyZ';

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
 * Login with game role_id
 * This calls the game's API to authenticate and get user data
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  await migrationsReady;

  // Apply rate limiting
  const rateLimitResponse = gameLoginRateLimit(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'Invalid request body');
  }

  const validation = validateBody(gameLoginSchema, body);
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

    const gameLoginResponse = await fetch(`${GAME_API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_id: GAME_ID,
        login_type: 'role_id',
        role_id: role_id,
        ts: timestamp,
        auth: authToken,
        language_code: 'EN',
        webVersion: 'v1.7.2',
      }),
    });

    if (!gameLoginResponse.ok) {
      const errorText = await gameLoginResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }

      logger.error('Game login failed', undefined, {
        role_id,
        status: gameLoginResponse.status,
        error: errorText,
        errorCode: errorData.code,
        errorMsg: errorData.msg,
        hasSecret: !!process.env.GAME_AUTH_SECRET
      });

      if (errorData.code === 15006 || errorData.msg === 'auth error') {
        throw new ApiError(401, 'Game authentication failed - invalid auth token. Please check GAME_AUTH_SECRET environment variable.', 'GAME_AUTH_FAILED');
      }

      throw new ApiError(401, `Game authentication failed: ${errorData.msg || errorText}`, 'GAME_AUTH_FAILED');
    }

    const gameLoginData = await gameLoginResponse.json();

    // Log the response structure for debugging
    logger.info('Game login response structure', { role_id, responseKeys: Object.keys(gameLoginData), hasData: !!gameLoginData.data });

    // Extract token from login response - check multiple possible locations
    // The token might be in: data.token, data.access_token, token, access_token, or in a nested structure
    const gameToken =
      gameLoginData.data?.token ||
      gameLoginData.data?.access_token ||
      gameLoginData.token ||
      gameLoginData.access_token ||
      gameLoginData.data?.data?.token ||
      gameLoginData.result?.token ||
      null;

    if (!gameToken) {
      logger.error('No token received from game login', undefined, {
        role_id,
        response: JSON.stringify(gameLoginData).substring(0, 500), // Log first 500 chars
        responseKeys: Object.keys(gameLoginData),
        hasData: !!gameLoginData.data,
        dataKeys: gameLoginData.data ? Object.keys(gameLoginData.data) : []
      });
      throw new ApiError(401, 'Game authentication failed - no token received', 'GAME_AUTH_NO_TOKEN');
    }

    logger.info('Token extracted successfully', { role_id, tokenLength: gameToken.length });

    // Call get_role_info to get actual user data
    const roleInfoResponse = await fetch(`${GAME_API_BASE_URL}/api/callback/get_role_info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': gameToken,
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
    // Structure: { code: 1, data: { user_data: [{ ... }] } }
    const userData = roleInfoData.data?.user_data?.[0];

    if (!userData) {
      logger.error('No user data in role info response', undefined, { role_id, response: roleInfoData });
      throw new ApiError(401, 'Failed to get user data from game', 'NO_USER_DATA');
    }

    // Extract actual game data from user_data[0]
    const gameId = GAME_ID;
    const state = userData.section || userData.extra_info?.value || null; // section is the state number
    const profilePicture = userData.icon || null;
    const username = userData.nickname || userData.role_id || `Player_${role_id}`;
    const realRoleId = userData.real_role_id || userData.role_id || role_id;

    // Extract furnace level from rank URL (e.g., "stove_lv_10.png" -> 10)
    let furnaceLevel: number | null = null;
    if (userData.rank) {
      const rankMatch = userData.rank.match(/stove_lv_(\d+)\.png/);
      if (rankMatch) {
        furnaceLevel = parseInt(rankMatch[1], 10);
      }
    }

    // Use role_id as unique identifier for game accounts (email is required but can be role_id based)
    // Find user by gameRoleId in userSettings instead of email
    const existingUserSettings = await db
      .select({
        userId: userSettings.userId,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
        },
      })
      .from(userSettings)
      .innerJoin(users, eq(userSettings.userId, users.id))
      .where(eq(userSettings.gameRoleId, realRoleId))
      .limit(1);

    let userId: string;
    let email: string;

    if (existingUserSettings.length > 0) {
      // User already exists with this gameRoleId
      userId = existingUserSettings[0].userId;
      email = existingUserSettings[0].user.email;

      // Update user with latest game data
      await db
        .update(users)
        .set({
          name: username,
          image: profilePicture,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Update user settings
      await db
        .update(userSettings)
        .set({
          gameRoleId: realRoleId,
          gameId: gameId,
          gameState: state,
          gameFurnaceLevel: furnaceLevel,
          gameProfilePicture: profilePicture,
          gameAuthToken: gameToken,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, userId));
    } else {
      // Create new user account for game login
      // Use role_id based email since email is required but game accounts don't have real emails
      email = `game_${realRoleId}@game.local`;

      const [newUser] = await db
        .insert(users)
        .values({
          email,
          name: username,
          image: profilePicture,
          role: 'user',
        })
        .returning({ id: users.id });

      if (!newUser) {
        throw new ApiError(500, 'Failed to create user account');
      }

      userId = newUser.id;

      // Create user settings
      await db.insert(userSettings).values({
        userId: newUser.id,
        gameRoleId: realRoleId,
        gameId: gameId,
        gameState: state,
        gameFurnaceLevel: furnaceLevel,
        gameProfilePicture: profilePicture,
        gameAuthToken: gameToken,
      });
    }

    // Sign JWT token for our app
    const token = await signAuthToken({
      id: userId,
      email,
      username,
    });

    const res = NextResponse.json(
      {
        id: userId,
        email,
        username,
        gameData: {
          roleId: realRoleId,
          gameId: gameId,
          state,
          furnaceLevel,
          profilePicture,
        },
      },
      { status: 200 }
    );

    res.cookies.set({ ...authCookieOptions(), value: token });

    logger.info('Game login successful', { userId, roleId: realRoleId });

    return res;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error('Game login error', error, { role_id });
    throw new ApiError(500, 'Game login failed', 'GAME_LOGIN_ERROR');
  }
});
