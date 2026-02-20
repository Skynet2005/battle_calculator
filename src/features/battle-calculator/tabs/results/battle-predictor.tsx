'use client';

/**
 * Battle Predictor - Main Orchestrator (Redesigned)
 *
 * Coordinates all battle analysis sections with 3 visual tiers:
 * - Primary: Outcome Header (sticky) + Why You Lost (hero section)
 * - Secondary: Forces + Bonuses + Composition
 * - Tertiary: Timeline + Combat Log (collapsed by default)
 *
 * This component should remain ~150-250 lines and only wire sections together.
 */

import { useMemo, useCallback } from 'react';
import type { TroopMixConfig } from '@/shared/types';
import { EmptyState, ErrorState, SectionCard } from '@/shared/ui';
import { useSyncedMixState } from '@/features/battle-calculator/hooks/useSyncedMixState';
import type { BattleConfig, BattleReport } from '@/domain/battle/engine/types';
import type { FightResult } from '@/domain/rally/combat-fight';
import { DEFAULT_TROOP_MIX } from '@/domain/rally/rally-config';
import type { BattleSideContext, CapacityReport } from '@/features/battle-calculator/model/types';

// Primary Tier
import { OutcomeHeader } from './sections/OutcomeHeader';
import { MonteCarloStatsPanel } from './sections/MonteCarloStatsPanel';
import { FormulaBreakdown } from './sections/FormulaBreakdown';
import { BestCounterRatio } from './sections/BestCounterRatio';
import { WhyYouLost } from './sections/WhyYouLost';
import { DamageSummaryPanel } from './sections/DamageSummaryPanel';

// Secondary Tier
import { BonusesSection } from './sections/BonusesSection';
import { ForcesSection } from './sections/ForcesSection';
import { RallyComposition } from './sections/RallyComposition';

// Tertiary Tier
import { BattleAnalysisPanel } from './analysis/BattleAnalysisPanel';
import { BattleComparisonPanel } from './analysis/BattleComparisonPanel';
import { CasualtyChart } from './analysis/CasualtyChart';
import { RallyKeyMoments } from './analysis/RallyKeyMoments';
import { StatsEvolutionPanel } from './analysis/StatsEvolutionPanel';
import { SkillScorecard } from './analysis/SkillScorecard';
import { extractKeyMoments } from './utils/keyMoments';

interface BattlePredictorProps {
  player: BattleSideContext | null;
  opponent: BattleSideContext | null;
  fightResult: FightResult | null;
  onMixChange?: (side: 'player' | 'opponent', mix: TroopMixConfig) => void;
  playerCapacity?: CapacityReport | null;
  opponentCapacity?: CapacityReport | null;
  playerMixInput?: TroopMixConfig;
  opponentMixInput?: TroopMixConfig;
  playerNormalizedMix?: TroopMixConfig | null;
  opponentNormalizedMix?: TroopMixConfig | null;
  battleReport?: BattleReport | null;
  previousBattleReport?: BattleReport | null;
  errorMessage?: string | null;
  simulationMode: BattleConfig['randomMode'];
  setSimulationModeAction: (mode: BattleConfig['randomMode']) => void;
  simulationCount: number;
  setSimulationCountAction: (count: number) => void;
}

export default function BattlePredictor({
  player,
  opponent,
  fightResult,
  onMixChange,
  playerCapacity,
  opponentCapacity,
  playerMixInput,
  opponentMixInput,
  playerNormalizedMix,
  opponentNormalizedMix,
  battleReport,
  previousBattleReport,
  errorMessage,
  simulationMode,
  setSimulationModeAction,
  simulationCount,
  setSimulationCountAction,
}: BattlePredictorProps) {
  const { mix: playerMixLocal, setMix: setPlayerMixLocal } =
    useSyncedMixState(playerMixInput, playerCapacity?.rally.total, DEFAULT_TROOP_MIX);

  const { mix: opponentMixLocal, setMix: setOpponentMixLocal } =
    useSyncedMixState(opponentMixInput, opponentCapacity?.rally.total, DEFAULT_TROOP_MIX);

  const dataReady = useMemo(
    () => Boolean(player?.fighter && opponent?.fighter && fightResult),
    [player?.fighter, opponent?.fighter, fightResult]
  );

  const playerIsAttacker = player?.role === 'attacker';

  // Compute key moments once -- shared by CasualtyChart, RallyKeyMoments, VirtualizedTurnList
  const keyMoments = useMemo(
    () => battleReport?.turns?.length ? extractKeyMoments(battleReport.turns, playerIsAttacker ?? true) : [],
    [battleReport?.turns, playerIsAttacker]
  );

  const handleSimulationCountChange = useCallback((value: number) => {
    if (!Number.isFinite(value)) return;
    const next = Math.max(1, Math.min(1000, Math.round(value)));
    setSimulationCountAction(next);
  }, [setSimulationCountAction]);

  return (
    <div className="flex flex-col">
      {/* Simulation Controls */}
      <SectionCard title="Battle Simulation" collapsible={false} className="mb-6">
        {errorMessage && (
          <ErrorState title="Simulation Error" message={errorMessage} />
        )}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-100">Simulation mode</div>
            <div className="text-xs text-gray-400">
              Monte Carlo shows hit/miss variance; deterministic (expected value) averages outcomes.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['monteCarlo', 'expectedValue'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSimulationModeAction(mode)}
                className={`px-3 py-1 rounded-full text-sm border ${simulationMode === mode
                    ? 'border-rose-400 bg-rose-500/30 text-white'
                    : 'border-white/10 text-gray-300 hover:border-white/20'
                  }`}
              >
                {mode === 'monteCarlo' ? 'Monte Carlo' : 'Deterministic'}
              </button>
            ))}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Simulations</label>
              <input
                title="Simulation Count"
                placeholder="Simulation Count"
                type="number"
                min={1}
                max={1000}
                value={simulationCount}
                disabled={simulationMode !== 'monteCarlo'}
                onChange={(e) => handleSimulationCountChange(Number(e.target.value))}
                className="w-20 rounded-md border border-white/10 bg-slate-900/60 px-2 py-1 text-sm text-white disabled:opacity-60"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {!dataReady ? (
        <div className="card text-center py-10 px-6 space-y-6">
          <div className="flex justify-center text-gray-400 [data-theme='light']:text-gray-500">
            <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Configure your rally to see results</h3>
            <p className="text-sm text-gray-400 [data-theme='light']:text-gray-500 max-w-md mx-auto">
              Complete the setup steps below, then return here for a full battle analysis.
            </p>
          </div>
          <ol className="text-left text-sm max-w-sm mx-auto space-y-3">
            <li className="flex items-start gap-3">
              <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 [data-theme='light']:bg-rose-100 [data-theme='light']:text-rose-700 [data-theme='light']:border-rose-300">1</span>
              <span className="text-gray-300 [data-theme='light']:text-gray-700">Set up <strong>Player</strong> and <strong>Opponent</strong> profiles with heroes and bonuses.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 [data-theme='light']:bg-rose-100 [data-theme='light']:text-rose-700 [data-theme='light']:border-rose-300">2</span>
              <span className="text-gray-300 [data-theme='light']:text-gray-700">Configure the <strong>Rally</strong> tab with leaders, joiners, and troop mix.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 [data-theme='light']:bg-rose-100 [data-theme='light']:text-rose-700 [data-theme='light']:border-rose-300">3</span>
              <span className="text-gray-300 [data-theme='light']:text-gray-700">Set <strong>troop totals</strong> for both sides so the simulator knows army sizes.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 [data-theme='light']:bg-rose-100 [data-theme='light']:text-rose-700 [data-theme='light']:border-rose-300">4</span>
              <span className="text-gray-300 [data-theme='light']:text-gray-700">Return here to see <strong>battle overview</strong>, casualties, and recommendations.</span>
            </li>
          </ol>
        </div>
      ) : (
        <>
          {/* PRIMARY TIER */}
          <OutcomeHeader
            player={player!}
            opponent={opponent!}
            fightResult={fightResult!}
            battleReport={battleReport ?? null}
            simulationMode={simulationMode}
            simulationCount={simulationCount}
          />

          <div className="px-4 py-6 space-y-6">
            {simulationMode === 'monteCarlo' && battleReport && battleReport.simulationsRun && (
              <MonteCarloStatsPanel
                battleReport={battleReport}
                playerIsAttacker={player!.role === 'attacker'}
              />
            )}

            <FormulaBreakdown
              player={player!}
              opponent={opponent!}
            />

            <BestCounterRatio
              player={player!}
              opponent={opponent!}
              rallySize={playerMixLocal.totalTroops || opponentMixLocal.totalTroops || 0}
              onApplyRatio={(ratio) => {
                setPlayerMixLocal(ratio);
                onMixChange?.('player', ratio);
              }}
            />

            <WhyYouLost
              player={player!}
              opponent={opponent!}
              fightResult={fightResult!}
              battleReport={battleReport ?? null}
              playerCapacity={playerCapacity}
              opponentCapacity={opponentCapacity}
              playerMix={playerMixLocal}
              opponentMix={opponentMixLocal}
            />

            {battleReport && battleReport.turns?.length > 0 && (
              <DamageSummaryPanel
                battleReport={battleReport}
                playerIsAttacker={player!.role === 'attacker'}
              />
            )}

            {previousBattleReport && battleReport && (
              <BattleComparisonPanel
                battleA={battleReport}
                battleB={previousBattleReport}
                labelA="Current"
                labelB="Previous"
              />
            )}

            {/* SECONDARY TIER */}
            <ForcesSection
              player={player!}
              opponent={opponent!}
              playerMix={playerMixLocal}
              opponentMix={opponentMixLocal}
              playerCapacity={playerCapacity}
              opponentCapacity={opponentCapacity}
              onMixChange={(side, mix) => {
                if (side === 'player') {
                  setPlayerMixLocal(mix);
                } else {
                  setOpponentMixLocal(mix);
                }
                onMixChange?.(side, mix);
              }}
            />

            <BonusesSection
              playerStats={player!.stats}
              opponentStats={opponent!.stats}
              playerSpecial={player!.specialBonuses}
              opponentSpecial={opponent!.specialBonuses}
              playerJoinerAdditive={player!.joinerAdditive}
              opponentJoinerAdditive={opponent!.joinerAdditive}
            />

            <RallyComposition player={player!} opponent={opponent!} />

            {/* TERTIARY TIER */}
            {battleReport && battleReport.turns?.length > 0 && (
              <>
                <SectionCard
                  title="Timeline"
                  description="Casualties over time with key moment annotations"
                  className="mt-6"
                  collapsible
                  defaultCollapsed={true}
                >
                  <CasualtyChart
                    turns={battleReport.turns}
                    keyMoments={keyMoments}
                    playerIsAttacker={playerIsAttacker!}
                  />
                  <RallyKeyMoments
                    keyMoments={keyMoments}
                  />
                </SectionCard>

                <SkillScorecard
                  turns={battleReport.turns}
                  playerIsAttacker={playerIsAttacker!}
                />

                <StatsEvolutionPanel
                  turns={battleReport.turns}
                  playerIsAttacker={playerIsAttacker!}
                />

                <BattleAnalysisPanel
                  player={player!}
                  opponent={opponent!}
                  battleReport={battleReport}
                  keyMoments={keyMoments}
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
