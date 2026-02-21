import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface BattleResultRow {
  id: string;
  createdAt: string;
  inputHash: string;
  requestJson: unknown;
  responseSummaryJson: unknown;
  playerProfileId?: string | null;
  opponentProfileId?: string | null;
  rallyConfigSnapshot?: unknown;
  battleConfigSnapshot?: unknown;
  tags?: string[] | null;
  modelVersion?: string | null;
  shareToken?: string | null;
  runType?: string | null;
}

export interface BattleListResponse {
  items: BattleResultRow[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface BattleDetailResponse extends BattleResultRow {
  timelineJson?: unknown;
  metricsJson?: unknown;
  rationaleJson?: unknown;
  reportJson?: unknown;
  discordSummary?: string;
}

async function fetchBattles(limit: number, cursor: string | null): Promise<BattleListResponse> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (cursor) params.set('cursor', cursor);
  const res = await fetch(`/api/battles?${params.toString()}`, { credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch battles' }));
    throw new Error(err.error || 'Failed to fetch battles');
  }
  return res.json();
}

async function fetchBattle(id: string | null, shareToken?: string | null): Promise<BattleDetailResponse | null> {
  if (!id && !shareToken) return null;
  if (id) {
    const url = shareToken ? `/api/battles/${id}?shareToken=${encodeURIComponent(shareToken)}` : `/api/battles/${id}`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      if (res.status === 404) return null;
      const err = await res.json().catch(() => ({ error: 'Failed to fetch battle' }));
      throw new Error(err.error || 'Failed to fetch battle');
    }
    return res.json();
  }
  return null;
}

async function fetchBattleByShareToken(token: string): Promise<BattleDetailResponse | null> {
  const res = await fetch(`/api/battles/by-share/${encodeURIComponent(token)}`, { credentials: 'include' });
  if (!res.ok) {
    if (res.status === 404) return null;
    const err = await res.json().catch(() => ({ error: 'Failed to fetch battle' }));
    throw new Error(err.error || 'Failed to fetch battle');
  }
  return res.json();
}

export function useBattles(limit = 20, cursor: string | null = null) {
  return useQuery({
    queryKey: ['battles', limit, cursor],
    queryFn: () => fetchBattles(limit, cursor),
    staleTime: 30 * 1000,
  });
}

export function useBattle(id: string | null, shareToken?: string | null) {
  return useQuery({
    queryKey: ['battle', id, shareToken ?? ''],
    queryFn: () => fetchBattle(id, shareToken),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useBattleByShareToken(token: string | null) {
  return useQuery({
    queryKey: ['battle-by-share', token],
    queryFn: () => fetchBattleByShareToken(token!),
    enabled: !!token,
    staleTime: 60 * 1000,
  });
}

export interface SaveBattleVariables {
  inputHash: string;
  requestJson: unknown;
  responseSummaryJson?: unknown;
  timelineJson?: unknown;
  metricsJson?: unknown;
  rationaleJson?: unknown;
  reportJson?: unknown;
  playerProfileId?: string | null;
  opponentProfileId?: string | null;
  rallyConfigSnapshot?: unknown;
  battleConfigSnapshot?: unknown;
  tags?: string[] | null;
  modelVersion?: string | null;
  generateShareToken?: boolean;
  runType?: 'single' | 'batch_row' | 'heatmap_cell' | 'scenario_baseline';
}

export function useSaveBattle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: SaveBattleVariables) => {
      const res = await fetch('/api/battles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to save battle' }));
        throw new Error(err.error || 'Failed to save battle');
      }
      return res.json() as Promise<{ id: string; createdAt: string; inputHash: string; shareToken?: string | null }>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['battles'] });
    },
  });
}
