'use client';

import { useState, useMemo, useCallback } from 'react';
import LeaderboardTable, { type LeaderboardRow } from '@/shared/ui/LeaderboardTable';

type StatKeys = 'attack' | 'defense' | 'lethality' | 'health';

const SORT_OPTIONS: { value: StatKeys; label: string }[] = [
  { value: 'attack', label: 'Total ATK' },
  { value: 'defense', label: 'Total DEF' },
  { value: 'lethality', label: 'Total LETH' },
  { value: 'health', label: 'Total HP' },
];

interface LeaderboardClientProps {
  initialRows: LeaderboardRow[];
  initialNextCursor: string | null;
}

export default function LeaderboardClient({
  initialRows,
  initialNextCursor,
}: LeaderboardClientProps) {
  const [rows, setRows] = useState<LeaderboardRow[]>(initialRows);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<StatKeys>('attack');
  const [search, setSearch] = useState('');

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/leaderboard?limit=20&cursor=${encodeURIComponent(nextCursor)}`,
      );
      if (!res.ok) throw new Error('Failed to load');
      const data: { rows: LeaderboardRow[]; nextCursor: string | null } =
        await res.json();
      setRows((prev) => [...prev, ...data.rows]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      console.error('Failed to load more leaderboard rows:', err);
    } finally {
      setLoading(false);
    }
  }, [nextCursor, loading]);

  const displayRows = useMemo(() => {
    let filtered = rows;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = rows.filter((r) =>
        (r.profileName ?? '').toLowerCase().includes(q),
      );
    }
    return [...filtered].sort((a, b) => b[sortKey] - a[sortKey]);
  }, [rows, sortKey, search]);

  return (
    <section className="px-6 py-6 space-y-4">
      {/* Controls: sort dropdown + search input */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label
            htmlFor="leaderboard-sort"
            className="text-xs font-semibold text-slate-200"
          >
            Sort:
          </label>
          <select
            id="leaderboard-sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as StatKeys)}
            className="rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <label
            htmlFor="leaderboard-search"
            className="text-xs font-semibold text-slate-200"
          >
            Search:
          </label>
          <input
            id="leaderboard-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name…"
            className="rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48"
          />
        </div>
      </div>

      <LeaderboardTable rows={displayRows} sortLabel={sortKey} />

      {/* Load more button — hidden while a search filter is active */}
      {nextCursor && !search.trim() && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="rounded border border-slate-700 bg-slate-800 px-6 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </section>
  );
}
