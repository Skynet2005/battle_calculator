import HamburgerNav from '@/shared/ui/HamburgerNav';
import { fetchLeaderboardPage } from './leaderboard-data';
import LeaderboardClient from './LeaderboardClient';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const { rows, nextCursor } = await fetchLeaderboardPage({ limit: 20 });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70 sticky top-0 backdrop-blur z-10">
        <HamburgerNav
          links={[
            { href: '/', label: 'Home' },
            { href: '/leaderboard', label: 'Leaderboard' },
            { href: '/rally-march-times', label: 'Rally March Times' },
          ]}
        />
        <h1 className="text-xl font-semibold tracking-tight">Player Leaderboard</h1>
        <div />
      </header>

      <LeaderboardClient initialRows={rows} initialNextCursor={nextCursor} />
    </main>
  );
}
