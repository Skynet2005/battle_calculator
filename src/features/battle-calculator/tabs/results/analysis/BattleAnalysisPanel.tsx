/**
 * Battle Analysis Panel
 *
 * Comprehensive turn-by-turn battle analysis with casualty charts, turn logs,
 * and detailed action breakdowns. Provides deterministic engine log with per-turn
 * state, targeting, modifiers, stats, and exact damage math.
 * Now includes filtering and virtualization for better performance.
 */

import { SectionCard, StatTile } from '@/shared/ui';
import type { BattleReport } from '@/domain/combat/types';
import { useCallback, useMemo, useState } from 'react';
import type { BattleSideContext } from '@/features/battle-calculator/model/types';
import { formatTroopCounts } from '../utils/format';
import { filterTurns, type TurnFilterOptions } from '../utils/turnFilters';
import { CombatLogFilters } from './CombatLogFilters';
import { RallyKeyMoments } from './RallyKeyMoments';
import { RallyTurnProgress } from './RallyTurnProgress';
import { VirtualizedTurnList } from './VirtualizedTurnList';

interface BattleAnalysisPanelProps {
  player: BattleSideContext;
  opponent: BattleSideContext;
  battleReport: BattleReport | null;
}

function SummaryTile({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return <StatTile label={label} value={value} helper={helper} tone="muted" size="sm" />;
}

export function BattleAnalysisPanel({
  player,
  opponent,
  battleReport
}: BattleAnalysisPanelProps) {
  const playerIsAttacker = player.role === 'attacker';

  const [filters, setFilters] = useState<TurnFilterOptions>({
    onlyKeyMoments: false,
    onlySkillProcs: false,
    onlyDeathsAbove: null,
    onlyBuffsDebuffs: false,
    searchText: ''
  });

  const filteredTurns = useMemo(
    () => (battleReport?.turns ? filterTurns(battleReport.turns, filters, playerIsAttacker) : []),
    [battleReport?.turns, filters, playerIsAttacker]
  );

  const handleExportJson = useCallback(() => {
    if (!battleReport) return;
    const payload = {
      generatedAt: new Date().toISOString(),
      config: battleReport.configSnapshot ?? battleReport.config,
      report: battleReport,
      player,
      opponent
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `battle-analysis-${battleReport?.configSnapshot?.rngSeed ?? 'export'}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [battleReport, opponent, player]);

  if (!battleReport || !battleReport.turns?.length) {
    return (
      <SectionCard
        title="Battle Analysis"
        description="No turns were recorded. Increase troop counts or ensure both sides have valid mixes."
        className="mt-6"
        collapsible
        defaultCollapsed={true}
      >
        <div className="text-sm text-gray-400">No battle data available.</div>
      </SectionCard>
    );
  }

  const config = battleReport.configSnapshot ?? battleReport.config;
  const casualties = battleReport.casualties;
  const winnerLabel =
    battleReport.winner === 'attacker'
      ? `${player.role === 'attacker' ? player.label : opponent.label} wins`
      : battleReport.winner === 'defender'
        ? `${player.role === 'defender' ? player.label : opponent.label} wins`
        : 'Draw';

  return (
    <SectionCard
      title="Combat Log (Debug)"
      description="Deterministic engine log with per-turn state, targeting, modifiers, stats, and exact damage math."
      collapsible
      defaultCollapsed={true}
    >
      <div className="grid gap-3 md:grid-cols-3">
        <SummaryTile label="Winner" value={winnerLabel} />
        <SummaryTile label="Total Turns" value={(battleReport.totalTurns ?? battleReport.turns.length).toString()} />
        <SummaryTile
          label="Mode"
          value={`${config.randomMode}${config.randomMode === 'monteCarlo' ? ` · sims ${config.simulations ?? 0}` : ''}`}
          helper={config.rngSeed ? `Seed ${config.rngSeed}` : undefined}
        />
        <SummaryTile label="K (calibration)" value={config.calibrationConstantK.toString()} />
        <SummaryTile label="Alpha (troop exponent)" value={config.troopCountExponentAlpha.toString()} />
        <SummaryTile
          label="Stacking"
          value={config.stackingBehavior}
          helper={config.allowLancerBacklineDive ? 'Lancer dive enabled' : 'Lancer dive disabled'}
        />
        {casualties && (
          <>
            <SummaryTile label="Attacker casualties" value={formatTroopCounts(casualties.attacker)} helper="Inf / Lan / Mark" />
            <SummaryTile label="Defender casualties" value={formatTroopCounts(casualties.defender)} helper="Inf / Lan / Mark" />
          </>
        )}
      </div>

      {battleReport.turns.length > 0 && (
        <>
          <RallyTurnProgress
            turns={battleReport.turns}
            playerIsAttacker={playerIsAttacker}
          />
          <RallyKeyMoments
            turns={battleReport.turns}
            playerIsAttacker={playerIsAttacker}
          />
        </>
      )}

      <div className="mt-5 space-y-4">
        <CombatLogFilters
          filters={filters}
          onFiltersChange={setFilters}
          totalTurns={battleReport.turns.length}
          filteredCount={filteredTurns.length}
        />

        <VirtualizedTurnList
          turns={battleReport.turns}
          playerIsAttacker={playerIsAttacker}
          filters={filters}
        />
      </div>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleExportJson}
          className="rounded-md border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-white hover:border-rose-400 hover:text-rose-200"
        >
          Export Battle Analysis (JSON)
        </button>
      </div>
    </SectionCard>
  );
}
