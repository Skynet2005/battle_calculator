import HamburgerNav from '@/components/ui/HamburgerNav';
import LeaderboardTable, { type LeaderboardRow } from '@/components/ui/LeaderboardTable';
import { buildSideBaseStats } from '@/lib/battle/battle-calculator-helpers';
import type { FinalStats } from '@/lib/battle/calculations';
import { db, migrationsReady } from '@/lib/db/db';
import { profiles } from '@/schema/profiles';
import { users } from '@/schema/users';
import { desc, eq } from 'drizzle-orm';

type StatKeys = 'attack' | 'defense' | 'lethality' | 'health';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  await migrationsReady;

  const params = await searchParams;

  // Fetch all profiles (all users), include user just to ensure join validity, but display profile totals only.
  const rows = await db
    .select({
      profileId: profiles.id,
      profileName: profiles.name,
      updatedAt: profiles.updatedAt,
      profileData: profiles.data,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .orderBy(desc(profiles.updatedAt ?? users.createdAt));

  const leaderboardRows: LeaderboardRow[] = [];

  for (const row of rows) {
    if (!row.profileId) {
      continue; // skip users without profiles; leaderboard is per-profile
    }
    const data = (row.profileData as any) ?? {};
    const calculated = data.calculatedStats as
      | { infantry?: FinalStats; lancer?: FinalStats; marksman?: FinalStats }
      | undefined;

    // Fallback: derive stats if not stored
    const derived =
      calculated ||
      (() => {
        try {
          const sideStats = buildSideBaseStats(
            data.basicBonuses,
            data.additiveBonuses,
            data.multiplicativeBonuses,
            data.rally,
            data.heroLevels,
            'player',
            data.troopLevels
          );
          return {
            infantry: sideStats.infantry,
            lancer: sideStats.lancer,
            marksman: sideStats.marksman,
          } as { infantry?: FinalStats; lancer?: FinalStats; marksman?: FinalStats };
        } catch {
          return undefined;
        }
      })();

    const sumStat = (key: StatKeys) =>
      ['infantry', 'lancer', 'marksman']
        .map((t) => derived?.[t as keyof typeof derived]?.[key] ?? 0)
        .reduce((a, b) => a + (Number(b) || 0), 0);

    // Skip if no stats at all
    const attack = sumStat('attack');
    const defense = sumStat('defense');
    const lethality = sumStat('lethality');
    const health = sumStat('health');

    leaderboardRows.push({
      profileId: row.profileId,
      profileName: row.profileName ?? data?.name ?? 'Profile',
      updatedAt: row.updatedAt ?? null,
      attack,
      defense,
      lethality,
      health,
      infantry: derived?.infantry ?? null,
      lancer: derived?.lancer ?? null,
      marksman: derived?.marksman ?? null,
    });
  }

  const sortKey: StatKeys =
    params?.sort === 'defense'
      ? 'defense'
      : params?.sort === 'lethality'
        ? 'lethality'
        : params?.sort === 'health'
          ? 'health'
          : 'attack';

  const leaderboard = leaderboardRows.sort((a, b) => b[sortKey] - a[sortKey]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70 sticky top-0 backdrop-blur">
        <HamburgerNav
          links={[
            { href: '/', label: 'Home' },
            { href: '/leaderboard', label: 'Leaderboard' }
          ]}
        />
        <h1 className="text-xl font-semibold tracking-tight">Player Leaderboard</h1>
        <div className="text-xs text-slate-400">Ranked by {sortKey}</div>
      </header>

      <section className="px-6 py-6 space-y-3">
        <div className="text-xs text-slate-400 flex flex-wrap gap-3 items-center">
          <span className="font-semibold text-slate-200">Sort:</span>
          <a
            href="?sort=attack"
            className={`px-2 py-1 rounded border border-slate-700 ${sortKey === 'attack' ? 'bg-emerald-800/60 text-emerald-100' : 'text-slate-200 hover:bg-slate-800'
              }`}
          >
            Total ATK
          </a>
          <a
            href="?sort=defense"
            className={`px-2 py-1 rounded border border-slate-700 ${sortKey === 'defense' ? 'bg-emerald-800/60 text-emerald-100' : 'text-slate-200 hover:bg-slate-800'
              }`}
          >
            Total DEF
          </a>
          <a
            href="?sort=lethality"
            className={`px-2 py-1 rounded border border-slate-700 ${sortKey === 'lethality' ? 'bg-emerald-800/60 text-emerald-100' : 'text-slate-200 hover:bg-slate-800'
              }`}
          >
            Total LETH
          </a>
          <a
            href="?sort=health"
            className={`px-2 py-1 rounded border border-slate-700 ${sortKey === 'health' ? 'bg-emerald-800/60 text-emerald-100' : 'text-slate-200 hover:bg-slate-800'
              }`}
          >
            Total HP
          </a>
        </div>
        <LeaderboardTable rows={leaderboard} sortLabel={sortKey} />
      </section>
    </main>
  );
}
