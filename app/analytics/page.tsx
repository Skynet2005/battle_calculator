import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';

import { verifyAuthToken } from '@/server/auth/auth';
import { db, migrationsReady } from '@/server/db/db';
import { battleResults } from '@/server/db/schema';
import HamburgerNav from '@/shared/ui/HamburgerNav';

export const dynamic = 'force-dynamic';

interface BattleSummaryRow {
  id: string;
  createdAt: Date;
  responseSummaryJson: Record<string, unknown> | null;
  requestJson: Record<string, unknown> | null;
}

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  try {
    return await verifyAuthToken(token);
  } catch {
    return null;
  }
}

function extractWinner(row: BattleSummaryRow): string {
  const summary = row.responseSummaryJson as Record<string, unknown> | null;
  if (summary && typeof summary === 'object' && 'winner' in summary) {
    return String(summary.winner);
  }
  return 'unknown';
}

function extractTotalKills(row: BattleSummaryRow): number {
  const summary = row.responseSummaryJson as Record<string, unknown> | null;
  if (!summary || typeof summary !== 'object') return 0;

  // Try common locations for kill count
  if ('totalKills' in summary && typeof summary.totalKills === 'number') {
    return summary.totalKills;
  }

  // Fallback: sum casualties
  const casualties = summary.casualties as Record<string, Record<string, number>> | undefined;
  if (casualties) {
    let total = 0;
    for (const side of Object.values(casualties)) {
      for (const count of Object.values(side)) {
        if (typeof count === 'number') total += count;
      }
    }
    return total;
  }
  return 0;
}

function extractTroopCount(row: BattleSummaryRow, side: 'attacker' | 'defender'): string {
  const req = row.requestJson as Record<string, unknown> | null;
  if (!req || typeof req !== 'object') return '—';
  const sideData = req[side] as Record<string, unknown> | undefined;
  if (!sideData || typeof sideData !== 'object') return '—';
  const troops = sideData.troops as Record<string, number> | undefined;
  if (!troops) return '—';
  const inf = troops.Infantry ?? 0;
  const lan = troops.Lancer ?? 0;
  const mark = troops.Marksman ?? 0;
  const total = inf + lan + mark;
  return total.toLocaleString();
}

export default async function AnalyticsPage() {
  await migrationsReady;
  const user = await getAuthUser();

  if (!user) {
    redirect('/');
  }

  const rows = (await db
    .select({
      id: battleResults.id,
      createdAt: battleResults.createdAt,
      responseSummaryJson: battleResults.responseSummaryJson,
      requestJson: battleResults.requestJson,
    })
    .from(battleResults)
    .where(eq(battleResults.userId, user.id))
    .orderBy(desc(battleResults.createdAt))
    .limit(50)) as BattleSummaryRow[];

  // Compute summary stats
  const totalBattles = rows.length;
  const attackerWins = rows.filter((r) => extractWinner(r) === 'attacker').length;
  const defenderWins = rows.filter((r) => extractWinner(r) === 'defender').length;
  const draws = rows.filter((r) => extractWinner(r) === 'draw').length;
  const overallWinRate = totalBattles > 0 ? ((attackerWins / totalBattles) * 100).toFixed(1) : '0';
  const totalKills = rows.reduce((sum, r) => sum + extractTotalKills(r), 0);
  const avgKills = totalBattles > 0 ? Math.round(totalKills / totalBattles).toLocaleString() : '0';

  const outcomeCounts = { attacker: attackerWins, defender: defenderWins, draw: draws };
  const mostCommon = (Object.entries(outcomeCounts) as [string, number][]).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const mostCommonOutcome = mostCommon && mostCommon[1] > 0 ? `${mostCommon[0]} (${mostCommon[1]})` : '—';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70 sticky top-0 backdrop-blur z-10">
        <HamburgerNav
          links={[
            { href: '/', label: 'Home' },
            { href: '/leaderboard', label: 'Leaderboard' },
            { href: '/analytics', label: 'Analytics' },
            { href: '/rally-march-times', label: 'Rally March Times' },
          ]}
        />
        <h1 className="text-xl font-semibold tracking-tight">Battle Analytics</h1>
        <div />
      </header>

      {/* Summary cards */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Total Battles" value={totalBattles.toString()} />
          <SummaryCard label="Attacker Win Rate" value={`${overallWinRate}%`} />
          <SummaryCard label="Avg Kills / Battle" value={avgKills} />
          <SummaryCard label="Most Common Outcome" value={mostCommonOutcome} />
        </div>
      </section>

      {/* Recent battles table */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <h2 className="text-lg font-semibold mb-4">Recent Battles</h2>
        {rows.length === 0 ? (
          <p className="text-slate-400 text-sm">No battles recorded yet. Run a simulation to see results here.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-700">
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-center px-4 py-3 font-medium">Outcome</th>
                  <th className="text-center px-4 py-3 font-medium">Attacker Troops</th>
                  <th className="text-center px-4 py-3 font-medium">Defender Troops</th>
                  <th className="text-right px-4 py-3 font-medium">Kills</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const winner = extractWinner(row);
                  const outcomeColor =
                    winner === 'attacker'
                      ? 'text-emerald-400'
                      : winner === 'defender'
                        ? 'text-red-400'
                        : 'text-yellow-400';
                  return (
                    <tr key={row.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-300">
                        {new Date(row.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className={`px-4 py-3 text-center font-medium capitalize ${outcomeColor}`}>{winner}</td>
                      <td className="px-4 py-3 text-center text-slate-300">{extractTroopCount(row, 'attacker')}</td>
                      <td className="px-4 py-3 text-center text-slate-300">{extractTroopCount(row, 'defender')}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{extractTotalKills(row).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
    </div>
  );
}
