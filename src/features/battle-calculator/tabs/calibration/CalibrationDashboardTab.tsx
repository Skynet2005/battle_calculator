'use client';

import { useQuery } from '@tanstack/react-query';

async function fetchDashboard(): Promise<{
  winAccuracy: number | null;
  remainingErrorSummary: unknown;
  linkedCount: number;
  totalImports: number;
}> {
  const res = await fetch('/api/calibration/dashboard', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}

async function fetchParameters(): Promise<{ items: Array<{ id: string; version: string; name: string; isActive: boolean }> }> {
  const res = await fetch('/api/calibration/parameters', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch parameters');
  return res.json();
}

export default function CalibrationDashboardTab() {
  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['calibration-dashboard'],
    queryFn: fetchDashboard,
  });
  const { data: params, isLoading: paramsLoading } = useQuery({
    queryKey: ['calibration-parameters'],
    queryFn: fetchParameters,
  });

  if (dashLoading || paramsLoading) {
    return <div className="text-slate-400">Loading calibration data…</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="card info-card">
        <h4 className="mb-2">Calibration Dashboard</h4>
        <p className="text-sm text-slate-400 mb-3">
          Observed vs predicted from imported reports. Manage calibration parameter sets.
        </p>
        {dashboard && (
          <div className="grid gap-2 text-sm">
            <p>Win accuracy: {dashboard.winAccuracy != null ? `${dashboard.winAccuracy.toFixed(1)}%` : '—'}</p>
            <p>Linked imports: {dashboard.linkedCount} / {dashboard.totalImports}</p>
          </div>
        )}
      </div>
      <div className="card info-card">
        <h4 className="mb-2">Calibration parameter sets</h4>
        {params?.items.length ? (
          <ul className="space-y-2 text-sm">
            {params.items.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <span className="font-mono">{p.version}</span>
                <span>{p.name}</span>
                {p.isActive && <span className="text-emerald-400 text-xs">Active</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400 text-sm">No parameter sets yet. Create via API or future UI.</p>
        )}
      </div>
    </div>
  );
}
