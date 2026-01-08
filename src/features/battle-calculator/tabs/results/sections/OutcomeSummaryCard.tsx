/**
 * Outcome Summary Card Section
 *
 * Displays battle outcome analysis with key factors and actionable suggestions.
 */

import { SectionCard } from '@/shared/ui';
import { useState } from 'react';

interface OutcomeSummaryCardProps {
  summary: {
    winner: 'player' | 'opponent' | 'stalemate';
    verdict: string;
    reasons: string[];
    actions: string[];
  };
}

export function OutcomeSummaryCard({ summary }: OutcomeSummaryCardProps) {
  const [showFactors, setShowFactors] = useState(true);
  const [showActions, setShowActions] = useState(true);

  const accent =
    summary.winner === 'player'
      ? 'text-emerald-300'
      : summary.winner === 'opponent'
        ? 'text-rose-300'
        : 'text-slate-200';

  const verdictBadge =
    summary.winner === 'player'
      ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30'
      : summary.winner === 'opponent'
        ? 'bg-rose-500/15 text-rose-200 border border-rose-400/30'
        : 'bg-slate-500/15 text-slate-200 border border-slate-400/30';

  return (
    <SectionCard
      title="Outcome Summary"
      className="mt-6"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className={`text-xl font-bold ${accent}`}>{summary.verdict}</div>
          </div>
          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${verdictBadge}`}>
            {summary.winner === 'player' ? 'Player ahead' : summary.winner === 'opponent' ? 'Opponent ahead' : 'Evenly matched'}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-gray-400">
              <span title="Top contributors that decided the battle outcome.">Key factors</span>
              <button
                type="button"
                className="text-[11px] text-blue-200 hover:text-blue-100"
                onClick={() => setShowFactors((v) => !v)}
              >
                {showFactors ? 'Hide' : 'Show'}
              </button>
            </div>
            {showFactors && (
              <ul className="mt-2 space-y-1.5 text-sm text-gray-100">
                {summary.reasons.length === 0 && <li className="text-xs text-gray-500">No key factors detected.</li>}
                {summary.reasons.map((reason, idx) => (
                  <li key={`reason-${idx}`} className="flex gap-2 items-start">
                    <span className="mt-[2px] text-gray-500">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-gray-400">
              <span title="Practical moves you can take to improve results.">Suggested adjustments</span>
              <button
                type="button"
                className="text-[11px] text-blue-200 hover:text-blue-100"
                onClick={() => setShowActions((v) => !v)}
              >
                {showActions ? 'Hide' : 'Show'}
              </button>
            </div>
            {showActions && (
              <ul className="mt-2 space-y-1.5 text-sm text-gray-100">
                {summary.actions.length === 0 && <li className="text-xs text-gray-500">No actionable suggestions — already optimized.</li>}
                {summary.actions.map((action, idx) => (
                  <li key={`action-${idx}`} className="flex gap-2 items-start">
                    <span className="mt-[2px] text-emerald-300">✓</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
