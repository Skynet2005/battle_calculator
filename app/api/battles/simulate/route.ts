import { BattleSimulationRequestSchema } from '@/features/battle-setup/schemas/battle';
import { generateRallyHash } from '@/features/battle-setup/utils/rallyHash';
import { verifyAuthToken } from '@/lib/auth';
import { battleSimulationCache } from '@/server/cache/ttlCache';
import { rateLimit, rateLimiter } from '@/server/middleware/rateLimit';
import { validateBody } from '@/server/middleware/validateSchema';
import { simulate } from '@/server/services/BattleSimulationService';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/battles/simulate
 *
 * Simulates a battle based on player, opponent, and rally configuration.
 * Requires authentication, validates input, applies rate limiting, and caches results.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId: string;
    try {
      const payload = await verifyAuthToken(token);
      userId = payload.id;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const validation = validateBody(BattleSimulationRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const request = validation.data;

    // 3. Calculate complexity and check rate limit
    const complexity = rateLimiter.calculateComplexity({
      simulations: request.simulationConfig?.simulations,
      maxTurns: request.simulationConfig?.maxTurns,
    });

    const rateLimitResult = rateLimit(userId, complexity);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    // 4. Generate input hash and check cache
    const inputHash = generateRallyHash(request);
    const cached = battleSimulationCache.get(inputHash);

    if (cached) {
      return NextResponse.json({
        ...cached,
        cacheMetadata: {
          hash: inputHash,
          cached: true,
        },
      });
    }

    // 5. Run simulation
    const startTime = Date.now();
    const result = await simulate(request, inputHash);
    const durationMs = Date.now() - startTime;

    // 6. Cache result (60 second TTL)
    battleSimulationCache.set(inputHash, {
      ...result,
      cacheMetadata: {
        hash: inputHash,
        cached: false,
      },
      durationMs,
    }, 60 * 1000);

    // 7. Return response
    return NextResponse.json({
      ...result,
      cacheMetadata: {
        hash: inputHash,
        cached: false,
      },
      durationMs,
    });
  } catch (error) {
    console.error('Battle simulation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Log full error details for debugging
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: 'Simulation failed',
        message: errorMessage,
        // Include stack in development only
        ...(process.env.NODE_ENV === 'development' && errorStack ? { stack: errorStack } : {}),
      },
      { status: 500 }
    );
  }
}
