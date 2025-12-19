import { verifyAuthToken } from '@/lib/auth';
import { getAllHeroes } from '@/lib/battle';
import { validateQuery } from '@/server/middleware/validateSchema';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * GET /api/joiners
 *
 * Searches for joiners (heroes) based on query string.
 * Returns limited list with metadata (name, role, primary skill level).
 */

const JoinerSearchQuerySchema = z.object({
  query: z.string().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  heroClass: z.enum(['infantry', 'lancer', 'marksman']).optional(),
});

export async function GET(req: NextRequest) {
  try {
    // Authentication (optional - can be made public if needed)
    const token = req.cookies.get('auth_token')?.value;
    if (token) {
      try {
        await verifyAuthToken(token);
      } catch {
        // Token invalid, but allow public access for now
        // Uncomment below to require auth:
        // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Parse and validate query parameters
    const url = new URL(req.url);
    const queryParams: Record<string, string | undefined> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    const validation = validateQuery(JoinerSearchQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors,
        },
        { status: 400 }
      );
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

    return NextResponse.json({
      joiners,
      total: filtered.length,
      limit,
    });
  } catch (error) {
    console.error('Joiner search error:', error);
    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
