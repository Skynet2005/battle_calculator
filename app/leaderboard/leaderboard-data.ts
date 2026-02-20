import { db, migrationsReady } from '@/server/db/db';
import { profiles } from '@/server/db/schema';
import { and, desc, lt, isNull } from 'drizzle-orm';
import { buildSideBaseStats } from '@/domain/battle/battle-calculator-helpers';
import type {
  BasicBonuses,
  AdditiveBonuses,
  MultiplicativeBonuses,
  FinalStats,
} from '@/domain/battle/calculations';
import type { RallyConfiguration } from '@/shared/types';
import type { HeroLevel } from '@/shared/types/heroes';
import type { LeaderboardRow } from '@/shared/ui/LeaderboardTable';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

type StatKeys = 'attack' | 'defense' | 'lethality' | 'health';

/** Subset of stored profile JSON used for leaderboard stat derivation. */
interface LeaderboardProfileData {
  name?: string;
  calculatedStats?: {
    infantry?: FinalStats;
    lancer?: FinalStats;
    marksman?: FinalStats;
  };
  basicBonuses?: unknown;
  additiveBonuses?: unknown;
  multiplicativeBonuses?: unknown;
  rally?: unknown;
  heroLevels?: unknown;
  troopLevels?: unknown;
}

export interface LeaderboardPageResult {
  rows: LeaderboardRow[];
  nextCursor: string | null;
}

/**
 * Fetch a single page of leaderboard data using cursor-based pagination.
 * Profiles are ordered by updatedAt DESC; the cursor is an ISO date string.
 */
export async function fetchLeaderboardPage(opts: {
  limit?: number;
  cursor?: string | null;
}): Promise<LeaderboardPageResult> {
  await migrationsReady;

  const limit = Math.min(Math.max(opts.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

  const conditions = [isNull(profiles.deletedAt)];
  if (opts.cursor) {
    conditions.push(lt(profiles.updatedAt, new Date(opts.cursor)));
  }

  const rows = await db
    .select({
      profileId: profiles.id,
      profileName: profiles.name,
      updatedAt: profiles.updatedAt,
      profileData: profiles.data,
    })
    .from(profiles)
    .where(and(...conditions))
    .orderBy(desc(profiles.updatedAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  const leaderboardRows: LeaderboardRow[] = pageRows.map((row) => {
    const data: LeaderboardProfileData =
      (row.profileData as LeaderboardProfileData | null) ?? {};
    const calculated = data.calculatedStats;

    const derived =
      calculated ??
      (() => {
        try {
          const sideStats = buildSideBaseStats(
            data.basicBonuses as BasicBonuses,
            data.additiveBonuses as AdditiveBonuses,
            data.multiplicativeBonuses as MultiplicativeBonuses,
            data.rally as RallyConfiguration | null | undefined,
            data.heroLevels as Record<string, HeroLevel> | undefined,
            'player',
            data.troopLevels as Partial<
              Record<'infantry' | 'lancer' | 'marksman', string>
            > | undefined,
          );
          return {
            infantry: sideStats.infantry,
            lancer: sideStats.lancer,
            marksman: sideStats.marksman,
          } as {
            infantry?: FinalStats;
            lancer?: FinalStats;
            marksman?: FinalStats;
          };
        } catch {
          return undefined;
        }
      })();

    const sumStat = (key: StatKeys) =>
      (['infantry', 'lancer', 'marksman'] as const)
        .map((t) => derived?.[t]?.[key] ?? 0)
        .reduce((a, b) => a + (Number(b) || 0), 0);

    return {
      profileId: row.profileId,
      profileName: row.profileName ?? data?.name ?? 'Profile',
      updatedAt: row.updatedAt ?? null,
      attack: sumStat('attack'),
      defense: sumStat('defense'),
      lethality: sumStat('lethality'),
      health: sumStat('health'),
      infantry: derived?.infantry ?? null,
      lancer: derived?.lancer ?? null,
      marksman: derived?.marksman ?? null,
    };
  });

  const nextCursor =
    hasMore && pageRows.length > 0
      ? (pageRows[pageRows.length - 1].updatedAt?.toISOString() ?? null)
      : null;

  return { rows: leaderboardRows, nextCursor };
}
