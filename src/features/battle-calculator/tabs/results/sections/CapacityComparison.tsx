/**
 * Capacity Comparison Section
 *
 * Displays deployment and rally capacity breakdowns for both sides.
 */

import { SectionCard } from '@/shared/ui';
import type { CapacityReport, CapacityBreakdown } from '@/features/battle-calculator/model/types';

interface CapacityComparisonProps {
  playerLabel: string;
  opponentLabel: string;
  playerCapacity: CapacityReport | null;
  opponentCapacity: CapacityReport | null;
}

export function CapacityComparison({
  playerLabel,
  opponentLabel,
  playerCapacity,
  opponentCapacity,
}: CapacityComparisonProps) {
  if (!playerCapacity && !opponentCapacity) {
    return null;
  }

  return (
    <SectionCard
      title="Capacity Breakdown"
      className="mt-6"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {playerCapacity && (
          <CapacitySummaryCard label={playerLabel} summary={playerCapacity} />
        )}
        {opponentCapacity && (
          <CapacitySummaryCard label={opponentLabel} summary={opponentCapacity} />
        )}
      </div>
    </SectionCard>
  );
}

function CapacitySummaryCard({
  label,
  summary,
}: {
  label: string;
  summary: CapacityReport;
}) {
  return (
    <div className="border border-white/10 rounded-lg p-4 space-y-4">
      <div className="text-sm font-semibold">{label}</div>
      <CapacityTable title="Deployment" breakdown={summary.deployment} />
      <CapacityTable title="Rally" breakdown={summary.rally} />
    </div>
  );
}

function CapacityTable({
  title,
  breakdown,
}: {
  title: string;
  breakdown: CapacityBreakdown;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs uppercase tracking-wide text-gray-400 mb-1">
        <span>{title}</span>
        <span>{breakdown.total.toLocaleString()}</span>
      </div>
      <div className="text-[11px] text-gray-400">
        <div>
          <strong>Base:</strong> {breakdown.base.toLocaleString()}
          {breakdown.manualOverride && ' (Manual Override)'}
        </div>
        {!breakdown.manualOverride && (
          <ul className="mt-1 space-y-0.5">
            {breakdown.breakdown.map((entry) => (
              <li key={`${title}-${entry.label}`} className="flex justify-between">
                <span>{entry.label}</span>
                <span>{entry.value.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
        {!breakdown.manualOverride && breakdown.temporary > 0 && (
          <div className="mt-2">
            <strong>Temporary:</strong> {breakdown.temporary.toLocaleString()}
            <ul className="mt-1 space-y-0.5">
              {breakdown.temporaryBreakdown.map((entry) => (
                <li key={`${title}-temp-${entry.label}`} className="flex justify-between">
                  <span>{entry.label}</span>
                  <span>{entry.value.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
