import { getAllHeroes } from '@/domain/battle';
import { validateQuery } from '@/server/middleware/validateSchema';
import { NextRequest, NextResponse } from 'next/server';
import { optionalAuth } from '@/server/middleware/auth';
import { withErrorHandling, ApiError } from '@/server/middleware/apiErrorHandler';
import { joinerSearchQuerySchema } from '@/server/validation/schemas';
import { logger } from '@/server/utils/logger';

/**
 * GET /api/joiners
 *
 * Searches for joiners (heroes) based on query string.
 * Returns limited list with metadata (name, role, primary skill level).
 */

export const GET = withErrorHandling(async (req: NextRequest) => {
  // Authentication (optional - can be made public if needed)
  await optionalAuth(req);

  // Parse and validate query parameters
  const url = new URL(req.url);
  const queryParams: Record<string, string | undefined> = {};
  url.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  const validation = validateQuery(joinerSearchQuerySchema, queryParams);
  if (!validation.success) {
    throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
  }

  const { query = '', limit, heroClass } = validation.data;

  // Get all heroes
  const allHeroes = getAllHeroes();

  // Filter heroes
  let filtered = allHeroes;

  // Filter by hero class if specified
  if (heroClass) {
    filtered = filtered.filter((hero) => hero['hero-class'] === heroClass);
  }

  // Filter by query string (search in hero name)
  if (query) {
    const queryLower = query.toLowerCase();
    filtered = filtered.filter((hero) =>
      hero['hero-name'].toLowerCase().includes(queryLower)
    );
  }

  // Get primary skill (first skill) for each hero
  const joiners = filtered.slice(0, limit).map((hero) => {
    const skills = hero.skills?.expedition || {};
    const skillKeys = Object.keys(skills);
    const primarySkill = skillKeys.length > 0 ? skills[skillKeys[0]] : null;

    return {
      id: hero['hero-name'],
      name: hero['hero-name'],
      heroClass: hero['hero-class'],
      primarySkill: primarySkill
        ? {
          id: skillKeys[0],
          name: primarySkill['skill-name'] || 'Unknown',
          level: 1, // Default level for joiners
        }
        : null,
      skillLevel: 1, // Joiners typically use skill level 1
    };
  });

  // Stable ordering (by hero name)
  joiners.sort((a, b) => a.name.localeCompare(b.name));

  // Add cache headers for static data
  // Hero data changes infrequently, so we can cache aggressively
  // s-maxage: 1 hour for CDN/edge cache
  // stale-while-revalidate: 24 hours - serve stale content while revalidating
  return NextResponse.json(
    {
      joiners,
      total: filtered.length,
      limit,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
});
