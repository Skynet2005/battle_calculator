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

import type { TroopMixConfig } from '@/shared/types';
import { EmptyState, ErrorState, SectionCard } from '@/shared/ui';
import { useSyncedMixState } from '@/features/battle-calculator/hooks/useSyncedMixState';
import type { BattleConfig, BattleReport } from '@/domain/combat/types';
import type { FightResult } from '@/domain/rally/combat-fight';
import { DEFAULT_TROOP_MIX } from '@/domain/rally/rally-config';
import type { BattleSideContext, CapacityReport } from '@/features/battle-calculator/model/types';

// Primary Tier
import { OutcomeHeader } from './sections/OutcomeHeader';
import { FormulaBreakdown } from './sections/FormulaBreakdown';
import { BestCounterRatio } from './sections/BestCounterRatio';
import { WhyYouLost } from './sections/WhyYouLost';

// Secondary Tier
import { BonusesSection } from './sections/BonusesSection';
import { ForcesSection } from './sections/ForcesSection';
import { RallyComposition } from './sections/RallyComposition';

// Tertiary Tier
import { BattleAnalysisPanel } from './analysis/BattleAnalysisPanel';
import { CasualtyChart } from './analysis/CasualtyChart';
import { RallyKeyMoments } from './analysis/RallyKeyMoments';
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

  const dataReady = Boolean(player?.fighter && opponent?.fighter && fightResult);

  const handleSimulationCountChange = (value: number) => {
    if (!Number.isFinite(value)) return;
    const next = Math.max(1, Math.min(1000, Math.round(value)));
    setSimulationCountAction(next);
  };

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
        <EmptyState
          title="Configuration Required"
          message="Configure both Player and Opponent sides in the Rally tab (heroes, joiners, troop mix, and troop totals) to run a full fight simulation. The battle overview, troop comparison, and special bonus table will appear here once both sides are ready."
        />
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
                    keyMoments={extractKeyMoments(battleReport.turns, player!.role === 'attacker')}
                    playerIsAttacker={player!.role === 'attacker'}
                  />
                  <RallyKeyMoments
                    turns={battleReport.turns}
                    playerIsAttacker={player!.role === 'attacker'}
                  />
                </SectionCard>

                <BattleAnalysisPanel
                  player={player!}
                  opponent={opponent!}
                  battleReport={battleReport}
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
