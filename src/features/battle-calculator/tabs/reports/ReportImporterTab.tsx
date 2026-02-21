'use client';

import { useState } from 'react';

export default function ReportImporterTab() {
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastImport, setLastImport] = useState<{ id: string; parsed: unknown } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reports/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rawText: rawText.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      const data = await res.json();
      setLastImport({ id: data.id, parsed: data.parsed });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="card info-card">
        <h4 className="mb-2">Battle Report Importer</h4>
        <p className="text-sm text-slate-400 mb-3">
          Paste in-game report summary. We parse winner, turn count, and numbers. Save and link to a saved scenario for predicted vs observed comparison.
        </p>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste report text here..."
          rows={6}
          className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500"
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={loading || !rawText.trim()}
          className="btn primary mt-2"
        >
          {loading ? 'Importing…' : 'Import'}
        </button>
        {error && <p className="text-rose-400 text-sm mt-2">{error}</p>}
        {lastImport && (
          <div className="mt-3 p-3 rounded bg-slate-800/50 text-sm">
            <p className="text-slate-300">Saved. ID: {lastImport.id}</p>
            <pre className="mt-2 text-slate-400 overflow-auto max-h-40">{JSON.stringify(lastImport.parsed, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
