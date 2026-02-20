/**
 * Battle Analysis Panel
 *
 * Comprehensive turn-by-turn battle analysis with casualty charts, turn logs,
 * and detailed action breakdowns. Provides deterministic engine log with per-turn
 * state, targeting, modifiers, stats, and exact damage math.
 * Now includes filtering and virtualization for better performance.
 */

import { SectionCard, StatTile } from '@/shared/ui';
import type { BattleReport, TroopCounts } from '@/domain/battle/engine/types';
import { TROOP_TYPE_VALUES } from '@/domain/battle/engine/types';
import { useCallback, useMemo, useState } from 'react';
import type { BattleSideContext } from '@/features/battle-calculator/model/types';
import { formatTroopCounts } from '../utils/format';
import { filterTurns, type TurnFilterOptions } from '../utils/turnFilters';
import type { KeyMoment } from '../utils/keyMoments';
import { CombatLogFilters } from './CombatLogFilters';
import { RallyKeyMoments } from './RallyKeyMoments';
import { RallyTurnProgress } from './RallyTurnProgress';
import { VirtualizedTurnList } from './VirtualizedTurnList';

interface BattleAnalysisPanelProps {
  player: BattleSideContext;
  opponent: BattleSideContext;
  battleReport: BattleReport | null;
  keyMoments?: KeyMoment[];
}

function SummaryTile({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return <StatTile label={label} value={value} helper={helper} tone="muted" size="sm" />;
}

export function BattleAnalysisPanel({
  player,
  opponent,
  battleReport,
  keyMoments: precomputedKeyMoments
}: BattleAnalysisPanelProps) {
  const playerIsAttacker = player.role === 'attacker';

  const [filters, setFilters] = useState<TurnFilterOptions>({
    onlyKeyMoments: false,
    onlySkillProcs: false,
    onlyDeathsAbove: null,
    onlyBuffsDebuffs: false,
    searchText: ''
  });

  const keyMoments = precomputedKeyMoments ?? [];

  const filteredTurns = useMemo(
    () => (battleReport?.turns ? filterTurns(battleReport.turns, filters, playerIsAttacker, keyMoments) : []),
    [battleReport?.turns, filters, playerIsAttacker, keyMoments]
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

  const handleExportCsv = useCallback(() => {
    if (!battleReport) return;
    const troopSum = (counts: TroopCounts) => counts.Infantry + counts.Lancer + counts.Marksman;
    const header = ['Turn', ...TROOP_TYPE_VALUES.map((t) => `Atk_${t}`), 'Atk_Total', ...TROOP_TYPE_VALUES.map((t) => `Def_${t}`), 'Def_Total', ...TROOP_TYPE_VALUES.map((t) => `AtkCas_${t}`), ...TROOP_TYPE_VALUES.map((t) => `DefCas_${t}`)];
    const rows = battleReport.turns.map((turn, idx) => {
      const prev = idx === 0 ? null : battleReport.turns[idx - 1];
      const atkStart = turn.startAttackerTroops ?? turn.attackerTroops;
      const defStart = turn.startDefenderTroops ?? turn.defenderTroops;
      const atkCas = TROOP_TYPE_VALUES.map((t) => Math.max(0, (atkStart[t]) - turn.attackerTroops[t]));
      const defCas = TROOP_TYPE_VALUES.map((t) => Math.max(0, (defStart[t]) - turn.defenderTroops[t]));
      return [
        turn.turn,
        ...TROOP_TYPE_VALUES.map((t) => turn.attackerTroops[t]),
        troopSum(turn.attackerTroops),
        ...TROOP_TYPE_VALUES.map((t) => turn.defenderTroops[t]),
        troopSum(turn.defenderTroops),
        ...atkCas,
        ...defCas,
      ].join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `battle-casualties-${battleReport?.configSnapshot?.rngSeed ?? 'export'}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [battleReport]);

  const [copiedSummary, setCopiedSummary] = useState(false);
  const handleCopySummary = useCallback(() => {
    if (!battleReport) return;
    const totalTurns = battleReport.totalTurns ?? battleReport.turns.length;
    const atkRemaining = battleReport.attackerRemaining;
    const defRemaining = battleReport.defenderRemaining;
    const winnerStr = battleReport.winner === 'attacker' ? 'Attacker wins' : battleReport.winner === 'defender' ? 'Defender wins' : 'Draw';
    const lines = [
      `Battle Result: ${winnerStr}`,
      `Turns: ${totalTurns}`,
      `Attacker Remaining: INF ${atkRemaining.Infantry} / LNC ${atkRemaining.Lancer} / MRK ${atkRemaining.Marksman}`,
      `Defender Remaining: INF ${defRemaining.Infantry} / LNC ${defRemaining.Lancer} / MRK ${defRemaining.Marksman}`,
    ];
    if (battleReport.attackerWinRate != null) {
      lines.push(`Win Rate: ${battleReport.attackerWinRate.toFixed(1)}% (attacker)`);
    }
    if (battleReport.killsStdDev != null) {
      lines.push(`Kills StdDev: ${battleReport.killsStdDev.toFixed(0)}`);
    }
    if (battleReport.casualties) {
      lines.push(`Attacker Casualties: INF ${battleReport.casualties.attacker.Infantry} / LNC ${battleReport.casualties.attacker.Lancer} / MRK ${battleReport.casualties.attacker.Marksman}`);
      lines.push(`Defender Casualties: INF ${battleReport.casualties.defender.Infantry} / LNC ${battleReport.casualties.defender.Lancer} / MRK ${battleReport.casualties.defender.Marksman}`);
    }
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    });
  }, [battleReport]);

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
      title="Battle Replay"
      description="Engine log with per-turn state, targeting, modifiers, stats, and exact damage math."
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
            keyMoments={keyMoments}
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
          filteredTurns={filteredTurns}
          totalTurnCount={battleReport.turns.length}
          keyMoments={keyMoments}
        />
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={handleCopySummary}
          className="rounded-md border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-white hover:border-emerald-400 hover:text-emerald-200"
        >
          {copiedSummary ? 'Copied!' : 'Copy Summary'}
        </button>
        <button
          type="button"
          onClick={handleExportCsv}
          className="rounded-md border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-white hover:border-sky-400 hover:text-sky-200"
        >
          Export CSV
        </button>
        <button
          type="button"
          onClick={handleExportJson}
          className="rounded-md border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-white hover:border-rose-400 hover:text-rose-200"
        >
          Export JSON
        </button>
      </div>
    </SectionCard>
  );
}
