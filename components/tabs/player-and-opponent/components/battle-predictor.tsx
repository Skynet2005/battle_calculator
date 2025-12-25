'use client';

import type { HeroSelection, NormalizedSkillEffect } from '@/lib/battle';
import { getHeroByName, getHeroExpeditionSkills } from '@/lib/battle';
import type {
  ActionLogEntry,
  BattleConfig,
  BattleReport,
  TroopCounts as CombatTroopCounts,
  EffectiveStatSnapshot,
  ModifierComponentLog,
  TurnLog
} from '@/lib/combat/types';
import type { DamageDebug, RoundResult } from '@/lib/rally/combat-battle-round';
import type { FightResult } from '@/lib/rally/combat-fight';
import type { FighterSnapshot } from '@/lib/rally/combat-fighter';
import { totalTroops } from '@/lib/rally/combat-fighter';
import type { TroopCounts as RallyTroopCounts, SideBaseStats } from '@/lib/rally/combat-types';
import { DEFAULT_TROOP_MIX } from '@/lib/rally/rally-config';
import { Fragment, useCallback, useEffect, useState } from 'react';
import type { TroopMixConfig } from '../../../types';
import { EmptyState, ErrorState, SectionCard, StatTile } from '../../../ui';

const TROOP_TYPES = ['infantry', 'lancer', 'marksman'] as const;
type TroopType = (typeof TROOP_TYPES)[number];
type MixTroopCounts = RallyTroopCounts; // lowercase counts used for mix inputs
type BattleTroopCounts = CombatTroopCounts; // uppercase counts used in battle reports/turn logs

export interface SpecialBonusSummary {
  troopsAttack: number;
  troopsDefense: number;
  troopsLethality: number;
  troopsHealth: number;
  enemyAttackReduction: number;
  enemyDefenseReduction: number;
  defenderAttack: number;
  defenderHealth: number;
  rallyAttack: number;
  rallyLethality: number;
  breakdown?: {
    pet: Record<'attack' | 'defense' | 'lethality' | 'health', number>;
    city: Record<'attack' | 'defense' | 'lethality' | 'health', number>;
    combat: Record<'attack' | 'defense' | 'lethality' | 'health', number>;
    special: Record<'attack' | 'defense' | 'lethality' | 'health', number>;
    joiner: Record<'attack' | 'defense' | 'lethality' | 'health', number> & { damageReduction?: number; names: string[] };
    enemyAttack: { city: number; combat: number; joiner: number; pet?: number; manual?: number };
    enemyDefense: { city: number; combat: number; joiner: number; pet?: number; manual?: number };
  };
}

export interface BattleSideContext {
  label: string;
  fighter: FighterSnapshot | null;
  role: 'attacker' | 'defender';
  troopCounts: RallyTroopCounts | null;
  stats: SideBaseStats | null;
  mix: TroopMixConfig | null;
  leaders: Partial<Record<TroopType, HeroSelection | null>>;
  joiners: HeroSelection[];
  joinerAdditive?: {
    attack: number;
    defense: number;
    lethality: number;
    health: number;
    names: string[];
  };
  specialBonuses: SpecialBonusSummary | null;
}

export interface CapacityBreakdown {
  total: number;
  base: number;
  temporary: number;
  manualOverride: boolean;
  breakdown: Array<{ label: string; value: number }>;
  temporaryBreakdown: Array<{ label: string; value: number }>;
}

export interface CapacityReport {
  deployment: CapacityBreakdown;
  rally: CapacityBreakdown;
}

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
  const primeMix = (mix: TroopMixConfig | null | undefined, cap?: number | null): TroopMixConfig => {
    const base = mix ?? DEFAULT_TROOP_MIX;
    const capValue = cap && cap > 0 ? cap : undefined;
    const total =
      base.totalTroops && base.totalTroops > 0
        ? capValue ? Math.min(base.totalTroops, capValue) : base.totalTroops
        : capValue ?? 0;
    return {
      ...DEFAULT_TROOP_MIX,
      ...base,
      totalTroops: total
    };
  };

  const [playerMixLocal, setPlayerMixLocal] = useState<TroopMixConfig>(() =>
    primeMix(playerMixInput, playerCapacity?.rally.total)
  );
  const [opponentMixLocal, setOpponentMixLocal] = useState<TroopMixConfig>(() =>
    primeMix(opponentMixInput, opponentCapacity?.rally.total)
  );

  // State sync from prop changes; safe in this controlled context.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setPlayerMixLocal(primeMix(playerMixInput, playerCapacity?.rally.total));
  }, [playerMixInput, playerCapacity?.rally.total]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setOpponentMixLocal(primeMix(opponentMixInput, opponentCapacity?.rally.total));
  }, [opponentMixInput, opponentCapacity?.rally.total]);
  const dataReady = Boolean(player?.fighter && opponent?.fighter && fightResult);

  const handleSimulationCountChange = (value: number) => {
    if (!Number.isFinite(value)) return;
    const next = Math.max(1, Math.min(1000, Math.round(value)));
    setSimulationCountAction(next);
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Battle Simulation"
        collapsible={false}
      >
        {errorMessage && (
          <ErrorState
            title="Simulation Error"
            message={errorMessage}
          />
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

        {!dataReady ? (
          <EmptyState
            title="Configuration Required"
            message="Configure both Player and Opponent sides in the Rally tab (heroes, joiners, troop mix, and troop totals) to run a full fight simulation. The battle overview, troop comparison, and special bonus table will appear here once both sides are ready."
          />
        ) : (
          <>
            <RunSummary player={player!} opponent={opponent!} fightResult={fightResult!} />
            <BattleOverview
              player={player!}
              opponent={opponent!}
              fightResult={fightResult!}
              playerMix={playerMixLocal}
              opponentMix={opponentMixLocal}
              playerCapacity={playerCapacity}
              opponentCapacity={opponentCapacity}
            />
            <OutcomeSummaryCard
              summary={buildOutcomeSummary({
                player: player!,
                opponent: opponent!,
                fightResult: fightResult!,
                battleReport: battleReport ?? null,
                playerCapacity,
                opponentCapacity,
                playerMix: playerMixLocal,
                opponentMix: opponentMixLocal
              })}
            />
            <CapacityComparison
              playerLabel={player!.label}
              opponentLabel={opponent!.label}
              playerCapacity={playerCapacity ?? null}
              opponentCapacity={opponentCapacity ?? null}
            />
            <TroopPowerComparison
              playerCounts={player!.fighter?.troopCounts ?? player!.troopCounts}
              opponentCounts={opponent!.fighter?.troopCounts ?? opponent!.troopCounts}
              playerMixInput={playerMixLocal}
              opponentMixInput={opponentMixLocal}
              playerNormalizedMix={playerNormalizedMix}
              opponentNormalizedMix={opponentNormalizedMix}
              onMixChange={(side, mix) => {
                if (side === 'player') {
                  setPlayerMixLocal(mix);
                } else {
                  setOpponentMixLocal(mix);
                }
                // Keep parent callback optional; do not mutate profiles directly.
                onMixChange?.(side, mix);
              }}
              playerCapacity={playerCapacity}
              opponentCapacity={opponentCapacity}
            />
            <RallyComposition
              player={player!}
              opponent={opponent!}
            />
            <BonusesPanel
              playerStats={player!.stats}
              opponentStats={opponent!.stats}
              playerSpecial={player!.specialBonuses}
              opponentSpecial={opponent!.specialBonuses}
              playerJoinerAdditive={player!.joinerAdditive}
              opponentJoinerAdditive={opponent!.joinerAdditive}
            />
            <BattleAnalysisPanel
              player={player!}
              opponent={opponent!}
              battleReport={battleReport ?? null}
            />
          </>
        )}
      </SectionCard>
    </div>
  );
}

function RunSummary({
  player,
  opponent,
  fightResult
}: {
  player: BattleSideContext;
  opponent: BattleSideContext;
  fightResult: FightResult;
}) {
  const resolveOutcome = () => {
    const playerIsAttacker = player.role === 'attacker';
    const rawAttackerWon = fightResult.attackerWon ?? false;
    const rawDefenderWon = fightResult.defenderWon ?? false;

    const playerRemaining = playerIsAttacker ? fightResult.attackerRemaining : fightResult.defenderRemaining;
    const opponentRemaining = playerIsAttacker ? fightResult.defenderRemaining : fightResult.attackerRemaining;
    const playerSurvivors = totalTroops(playerRemaining);
    const opponentSurvivors = totalTroops(opponentRemaining);

    let winner: 'player' | 'opponent' | 'stalemate' =
      rawAttackerWon ? (playerIsAttacker ? 'player' : 'opponent')
        : rawDefenderWon ? (playerIsAttacker ? 'opponent' : 'player')
          : 'stalemate';

    // If flags are unset, fall back to survivor comparison (matches BattleOverview).
    if (winner === 'stalemate' && fightResult.rounds.length > 0) {
      if (playerSurvivors > opponentSurvivors) {
        winner = 'player';
      } else if (opponentSurvivors > playerSurvivors) {
        winner = 'opponent';
      }
    }

    const label =
      winner === 'stalemate'
        ? 'Stalemate'
        : winner === 'player'
          ? `${player.label} wins`
          : `${opponent.label} wins`;

    return { winner, label };
  };

  const { winner, label: winnerLabel } = resolveOutcome();
  const playerIsAttacker = player.role === 'attacker';
  const rounds = fightResult.rounds?.length ?? 0;
  const playerSummary = player.fighter?.summary;

  return (
    <SectionCard
      title="Run summary"
      description="Outcome, duration, and impact multipliers."
      tone="elevated"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Outcome"
          value={winnerLabel}
          tone={
            winner === 'stalemate'
              ? 'muted'
              : winner === 'player'
                ? 'success'
                : 'error'
          }
          helper={playerIsAttacker ? 'Player started as attacker' : 'Player started as defender'}
        />
        <StatTile
          label="Rounds"
          value={rounds}
          tone="info"
          helper="Total turns simulated"
        />
        <StatTile
          label="Player dmg dealt"
          value={`${(playerSummary?.damageDealtMultiplier ?? 1).toFixed(2)}×`}
          tone="info"
          helper="Final kills vs base"
        />
        <StatTile
          label="Player dmg taken"
          value={`${(playerSummary?.damageTakenMultiplier ?? 1).toFixed(2)}×`}
          tone="warning"
          helper="Incoming vs initial pool"
        />
      </div>
    </SectionCard>
  );
}

function BattleOverview({
  player,
  opponent,
  fightResult,
  playerMix,
  opponentMix,
  playerCapacity,
  opponentCapacity
}: {
  player: BattleSideContext;
  opponent: BattleSideContext;
  fightResult: FightResult;
  playerMix: TroopMixConfig;
  opponentMix: TroopMixConfig;
  playerCapacity?: CapacityReport | null;
  opponentCapacity?: CapacityReport | null;
}) {
  const fallbackPlayerCounts = computeCountsFromMix(applyRallyCap(playerMix, playerCapacity?.rally.total));
  const fallbackOpponentCounts = computeCountsFromMix(applyRallyCap(opponentMix, opponentCapacity?.rally.total));

  const hasCounts = (counts: any): counts is MixTroopCounts =>
    counts && typeof counts.infantry === 'number' && typeof counts.lancer === 'number' && typeof counts.marksman === 'number';

  const playerCountsSource = hasCounts(player.fighter?.troopCounts) ? player.fighter!.troopCounts : null;
  const opponentCountsSource = hasCounts(opponent.fighter?.troopCounts) ? opponent.fighter!.troopCounts : null;

  const playerCounts = playerCountsSource && totalTroops(playerCountsSource) > 0
    ? playerCountsSource
    : fallbackPlayerCounts;
  const opponentCounts = opponentCountsSource && totalTroops(opponentCountsSource) > 0
    ? opponentCountsSource
    : fallbackOpponentCounts;

  const basePlayerStats = buildSideBattleStats(player, fightResult);
  const baseOpponentStats = buildSideBattleStats(opponent, fightResult);

  const playerInitial = totalTroops(playerCounts);
  const opponentInitial = totalTroops(opponentCounts);

  const playerRemainingCounts = player.role === 'attacker' ? fightResult.attackerRemaining : fightResult.defenderRemaining;
  const opponentRemainingCounts = opponent.role === 'attacker' ? fightResult.attackerRemaining : fightResult.defenderRemaining;

  const playerSurvivors = totalTroops(playerRemainingCounts);
  const opponentSurvivors = totalTroops(opponentRemainingCounts);

  const playerLosses = Math.max(0, playerInitial - playerSurvivors);
  const opponentLosses = Math.max(0, opponentInitial - opponentSurvivors);

  const playerStats: SideBattleStats = {
    initial: playerInitial,
    losses: playerLosses,
    survivors: playerSurvivors
  };
  const opponentStats: SideBattleStats = {
    initial: opponentInitial,
    losses: opponentLosses,
    survivors: opponentSurvivors
  };

  const rounds = fightResult.rounds.length;

  const playerIsAttacker = player.role === 'attacker';
  const rawAttackerWon = fightResult.attackerWon ?? false;
  const rawDefenderWon = fightResult.defenderWon ?? false;

  const winnerFromFlags =
    rawAttackerWon ? (playerIsAttacker ? 'player' : 'opponent')
      : rawDefenderWon ? (playerIsAttacker ? 'opponent' : 'player')
        : null;

  let winner: 'player' | 'opponent' | 'stalemate' = winnerFromFlags ?? 'stalemate';
  if (!winnerFromFlags && rounds > 0) {
    if (playerStats.survivors > opponentStats.survivors) {
      winner = 'player';
    } else if (opponentStats.survivors > playerStats.survivors) {
      winner = 'opponent';
    }
  }

  const playerWon = winner === 'player';
  const opponentWon = winner === 'opponent';

  const verdict =
    winner === 'player' ? 'Victory!'
      : winner === 'opponent' ? 'Defeat'
        : rounds === 0 ? 'No Rounds' : 'Stalemate';

  return (
    <div className="mt-4 border border-slate-700/50 bg-slate-900/30 rounded-xl overflow-hidden dark:border-slate-700/70">
      <div className="grid gap-4 lg:grid-cols-[1fr,auto,1fr] items-stretch p-4">
        <SidePanel
          title={player.label}
          stats={playerStats}
          fighter={player.fighter!}
          align="left"
        />

        <div className="flex flex-col items-center justify-center gap-2 px-6">
          <div className={`text-2xl font-bold ${playerWon ? 'text-emerald-300' : opponentWon ? 'text-rose-300' : 'text-slate-200'}`}>
            {verdict}
          </div>
          <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-400">
            {rounds === 0 ? 'No Rounds' : `${rounds} Round${rounds === 1 ? '' : 's'}`}
          </div>
          <div className="text-xs text-center text-gray-400 dark:text-gray-400">
            {player.fighter?.name} ({player.role === 'attacker' ? 'Attacker' : 'Defender'}) vs {opponent.fighter?.name}
          </div>
        </div>

        <SidePanel
          title={opponent.label}
          stats={opponentStats}
          fighter={opponent.fighter!}
          align="right"
        />
      </div>
    </div>
  );
}

function SidePanel({
  title,
  stats,
  fighter,
  align,
}: {
  title: string;
  stats: SideBattleStats;
  fighter: FighterSnapshot;
  align: 'left' | 'right';
}) {
  const accent = align === 'left' ? 'text-rose-300' : 'text-sky-300';
  const roleBadge =
    align === 'left'
      ? 'bg-rose-500/15 text-rose-200 border border-rose-400/30'
      : 'bg-sky-500/15 text-sky-200 border border-sky-400/30';
  const lossPct = stats.initial > 0 ? (stats.losses / stats.initial) * 100 : 0;
  const survPct = stats.initial > 0 ? (stats.survivors / stats.initial) * 100 : 0;

  return (
    <div className={`flex flex-col gap-3 ${align === 'right' ? 'items-end text-right' : ''}`}>
      <div className="flex items-center justify-between gap-2 w-full">
      <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-400">{title}</div>
        <span className={`rounded-full px-2 py-[2px] text-[11px] font-semibold ${roleBadge}`}>
          {fighter.role === 'attacker' ? 'Attacker' : 'Defender'}
        </span>
      </div>

      <div className={`text-3xl font-bold ${accent}`}>
        {formatBigNumber(stats.survivors > 0 ? stats.survivors : stats.initial)}
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-400">
        {fighter.name}
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs text-slate-200 dark:text-gray-200 w-full">
        <StatBlock label="Troops" value={stats.initial} align={align} />
        <StatBlock label="Losses" value={stats.losses} align={align} />
        <StatBlock label="Survivors" value={stats.survivors} align={align} />
      </div>

      <div className="flex flex-wrap gap-3 text-[11px] text-gray-400 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="text-gray-500">Losses</span>
          <span className="font-semibold text-rose-200">{lossPct.toFixed(1)}%</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-gray-500">Survivors</span>
          <span className="font-semibold text-emerald-200">{survPct.toFixed(1)}%</span>
        </span>
      </div>

      <div className="text-[11px] text-gray-500 dark:text-gray-400">
        Damage dealt {(fighter.summary?.damageDealtMultiplier ?? 1).toFixed(2)}× · Damage taken {(fighter.summary?.damageTakenMultiplier ?? 1).toFixed(2)}×
      </div>

      <div className="h-1.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className={`${align === 'left' ? 'bg-rose-400/70' : 'bg-sky-400/70'} h-full transition-all`}
          style={{ width: `${Math.min(100, Math.max(0, survPct))}%` }}
        />
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  align,
}: {
  label: string;
  value: number;
  align: 'left' | 'right';
}) {
  return (
    <div className={`rounded-lg bg-slate-900/40 px-3 py-2 border border-slate-700/40 ${align === 'right' ? 'text-right' : ''}`}>
      <div className="text-[10px] uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-sm font-semibold">{formatBigNumber(value)}</div>
    </div>
  );
}

function FinalStatsMatrix({
  playerStats,
  opponentStats,
}: {
  playerStats: SideBaseStats | null;
  opponentStats: SideBaseStats | null;
}) {
  if (!playerStats && !opponentStats) {
    return null;
  }

  return (
    <div className="px-4 pb-4">
      <div className="text-sm font-semibold text-slate-200 mb-2">Final Troop Stats</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-slate-200">
          <thead>
            <tr className="text-slate-400 uppercase tracking-wide">
              <th className="py-2 text-left">Troop</th>
              <th className="py-2 text-center" colSpan={4}>Player</th>
              <th className="py-2 text-center" colSpan={4}>Opponent</th>
            </tr>
            <tr className="text-[10px] uppercase text-slate-500">
              <th />
              {['Atk', 'Def', 'Leth', 'HP'].map((label) => (
                <th key={`player-${label}`} className="py-1 text-center">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TROOP_TYPES.map((type) => (
              <tr key={type} className="border-t border-white/10">
                <td className="py-2 font-semibold capitalize">{type}</td>
                <td className="py-2 text-center">{formatStatValue(playerStats?.[type]?.attack)}</td>
                <td className="py-2 text-center">{formatStatValue(playerStats?.[type]?.defense)}</td>
                <td className="py-2 text-center">{formatStatValue(playerStats?.[type]?.lethality)}</td>
                <td className="py-2 text-center">{formatStatValue(playerStats?.[type]?.health)}</td>
                <td className="py-2 text-center">{formatStatValue(opponentStats?.[type]?.attack)}</td>
                <td className="py-2 text-center">{formatStatValue(opponentStats?.[type]?.defense)}</td>
                <td className="py-2 text-center">{formatStatValue(opponentStats?.[type]?.lethality)}</td>
                <td className="py-2 text-center">{formatStatValue(opponentStats?.[type]?.health)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface SideBattleStats {
  initial: number;
  losses: number;
  survivors: number;
}

function buildSideBattleStats(
  side: BattleSideContext | null,
  fightResult: FightResult | null
): SideBattleStats {
  if (!side?.fighter) {
    return { initial: 0, losses: 0, survivors: 0 };
  }

  const initial = totalTroops(side.fighter.troopCounts);
  let losses = 0;

  if (fightResult) {
    losses = fightResult.rounds.reduce((sum, round) => {
      const casualties =
        side.role === 'attacker' ? round.attackerCasualties : round.defenderCasualties;
      return sum + sumCasualties(casualties);
    }, 0);
  }

  const survivors = Math.max(0, initial - losses);
  return { initial, losses, survivors };
}

function TroopPowerComparison({
  playerCounts,
  opponentCounts,
  playerMixInput,
  opponentMixInput,
  playerNormalizedMix,
  opponentNormalizedMix,
  onMixChange,
  playerCapacity,
  opponentCapacity,
}: {
  playerCounts: MixTroopCounts | null | undefined;
  opponentCounts: MixTroopCounts | null | undefined;
  playerMixInput?: TroopMixConfig | null;
  opponentMixInput?: TroopMixConfig | null;
  playerNormalizedMix?: TroopMixConfig | null;
  opponentNormalizedMix?: TroopMixConfig | null;
  onMixChange?: (side: 'player' | 'opponent', mix: TroopMixConfig) => void;
  playerCapacity?: CapacityReport | null;
  opponentCapacity?: CapacityReport | null;
}) {
  const rawPlayerMix = playerMixInput ?? DEFAULT_TROOP_MIX;
  const rawOpponentMix = opponentMixInput ?? DEFAULT_TROOP_MIX;
  const effectivePlayerMix = applyRallyCap(rawPlayerMix, playerCapacity?.rally.total);
  const effectiveOpponentMix = applyRallyCap(rawOpponentMix, opponentCapacity?.rally.total);

  const derivedPlayerCounts =
    playerCounts && totalTroops(playerCounts) > 0
      ? playerCounts
      : computeCountsFromMix(effectivePlayerMix);
  const derivedOpponentCounts =
    opponentCounts && totalTroops(opponentCounts) > 0
      ? opponentCounts
      : computeCountsFromMix(effectiveOpponentMix);

  return (
    <div className="card info-card mt-6">
      <h3>Troop Power Comparison</h3>
      <div className="grid gap-6 lg:grid-cols-2 mt-4">
        <TroopMixQuickEditor
          title="Player Troop Mix"
          mix={rawPlayerMix}
          displayMix={playerNormalizedMix ?? effectivePlayerMix}
          counts={derivedPlayerCounts}
          onChange={(mix) => onMixChange?.('player', mix)}
          maxTotal={playerCapacity?.rally.total}
        />
        <TroopMixQuickEditor
          title="Opponent Troop Mix"
          mix={rawOpponentMix}
          displayMix={opponentNormalizedMix ?? effectiveOpponentMix}
          counts={derivedOpponentCounts}
          onChange={(mix) => onMixChange?.('opponent', mix)}
          maxTotal={opponentCapacity?.rally.total}
        />
      </div>
      <div className="space-y-4 mt-4">
        {TROOP_TYPES.map((type) => {
          const playerValue = derivedPlayerCounts?.[type] ?? 0;
          const opponentValue = derivedOpponentCounts?.[type] ?? 0;
          const total = playerValue + opponentValue;
          const playerPercent = total === 0 ? 0 : (playerValue / total) * 100;
          const opponentPercent = 100 - playerPercent;

          return (
            <div key={type}>
              <div className="flex justify-between text-xs uppercase tracking-wide text-gray-400 dark:text-gray-400 mb-1">
                <span>{type}</span>
                <span>{formatPercent(playerPercent)} vs {formatPercent(opponentPercent)}</span>
              </div>
              <div className="h-3 bg-slate-800/60 rounded-full overflow-hidden flex">
                <span
                  className="bg-rose-500/80"
                  style={{ width: `${playerPercent}%` }}
                  aria-label={`Player ${type} ratio`}
                />
                <span
                  className="bg-sky-500/80"
                  style={{ width: `${opponentPercent}%` }}
                  aria-label={`Opponent ${type} ratio`}
                />
              </div>
              <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                <span>{playerValue.toLocaleString()} units</span>
                <span>{opponentValue.toLocaleString()} units</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function applyRallyCap(mix: TroopMixConfig, cap?: number | null): TroopMixConfig {
  if (!cap || cap <= 0) {
    return {
      ...mix,
      totalTroops: Math.max(0, mix.totalTroops ?? 0) || 0,
    };
  }
  const currentTotal = Math.max(0, mix.totalTroops ?? 0);
  if (currentTotal > 0) {
    return { ...mix, totalTroops: Math.min(currentTotal, cap) };
  }
  return { ...mix, totalTroops: cap };
}

function TroopMixQuickEditor({
  title,
  mix,
  displayMix,
  counts,
  onChange,
  maxTotal,
}: {
  title: string;
  mix: any;
  displayMix?: any | null;
  counts: MixTroopCounts | null | undefined;
  onChange?: (mix: any) => void;
  maxTotal?: number;
}) {
  const [mode, setMode] = useState<'percent' | 'count'>('percent');
  const derivedCounts: MixTroopCounts = counts && totalTroops(counts) > 0 ? counts : computeCountsFromMix(mix);

  const handlePercentChange = (type: TroopType, value: number) => {
    if (!onChange) return;
    const key = `${type}Ratio` as const;
    const updated: any = {
      ...mix,
      [key]: Math.max(0, value),
    };
    onChange(updated);
  };

  const handleCountChange = (type: TroopType, value: number) => {
    if (!onChange) return;
    const sanitized = Math.max(0, value);
    const nextCounts: MixTroopCounts = {
      infantry: derivedCounts.infantry,
      lancer: derivedCounts.lancer,
      marksman: derivedCounts.marksman,
    };
    nextCounts[type] = sanitized;
    onChange(countsToMix(nextCounts));
  };

  const handleTotalChange = (value: number) => {
    if (!onChange) return;
    const sanitized = Math.max(0, value || 0);
    const capped = maxTotal ? Math.min(maxTotal, sanitized) : sanitized;
    onChange({
      ...mix,
      totalTroops: capped,
    });
  };

  return (
    <div className="rounded-lg border border-white/10 p-4 bg-slate-900/40">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-gray-400">
            Rally size: {Math.round(mix.totalTroops).toLocaleString()} troops
            {displayMix && displayMix.totalTroops !== mix.totalTroops && (
              <> &rarr; {Math.round(displayMix.totalTroops).toLocaleString()} used</>
            )}
          </div>
        </div>
        <div className="text-xs bg-slate-800/60 rounded-full p-1 flex">
          {['percent', 'count'].map((modeValue) => (
            <button
              key={modeValue}
              className={`px-2 py-1 rounded-full ${mode === modeValue ? 'bg-rose-500/70 text-white' : 'text-gray-300'}`}
              onClick={() => setMode(modeValue as 'percent' | 'count')}
            >
              {modeValue === 'percent' ? '% Ratio' : 'Unit Count'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3">
        <div className="form-group mb-2">
          <label>Total Troops</label>
          <input
            type="number"
            min={0}
            value={Math.round(mix.totalTroops)}
            onChange={(e) => handleTotalChange(parseInt(e.target.value, 10) || 0)}
            disabled={mode === 'count'}
            className="bg-slate-900/50 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
          />
          {mode === 'count' && (
            <p className="text-xs text-gray-500 mt-1">
              Total is derived from individual troop counts in Unit Count mode.
            </p>
          )}
        </div>
        {TROOP_TYPES.map((type) => {
          const ratioKey = `${type}Ratio` as const;
          const percentValue = mix[ratioKey] ?? 0;
          const unitValue = derivedCounts[type] ?? 0;
          const normalizedPercent = displayMix ? displayMix[ratioKey] ?? percentValue : percentValue;
          return (
            <div key={type} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs uppercase text-gray-400">
                <span>{type}</span>
                <span>
                  {mode === 'percent'
                    ? `${unitValue.toLocaleString()} units`
                    : `${percentValue.toFixed(2)}%`}
                </span>
              </div>
              {displayMix && (
                <div className="text-[11px] text-gray-500 flex justify-between">
                  <span>Effective</span>
                  <span>{normalizedPercent.toFixed(2)}%</span>
                </div>
              )}
              <input
                type="number"
                min={0}
                value={mode === 'percent' ? Number(percentValue.toFixed(2)) : unitValue}
                onChange={(e) => {
                  const parsed = parseFloat(e.target.value);
                  if (Number.isNaN(parsed)) {
                    return;
                  }
                  if (mode === 'percent') {
                    handlePercentChange(type, parsed);
                  } else {
                    handleCountChange(type, parsed);
                  }
                }}
                className="bg-slate-900/50 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RallyComposition({
  player,
  opponent,
}: {
  player: BattleSideContext;
  opponent: BattleSideContext;
}) {
  return (
    <div className="card info-card mt-6">
      <h3>Rally Composition</h3>
      <div className="grid gap-4 lg:grid-cols-2">
        <HeroColumn label={player.label} leaders={player.leaders} joiners={player.joiners} />
        <HeroColumn label={opponent.label} leaders={opponent.leaders} joiners={opponent.joiners} />
      </div>
    </div>
  );
}

function HeroColumn({
  label,
  leaders,
  joiners,
}: {
  label: string;
  leaders: Partial<Record<TroopType, HeroSelection | null>>;
  joiners: HeroSelection[];
}) {
  const getFirstSkillInfo = (heroName?: string | null) => {
    if (!heroName) return null;
    const hero = getHeroByName(heroName);
    if (!hero) return null;
    const skills = getHeroExpeditionSkills(hero);
    if (!skills.length) return null;
    const first = skills[0];
    const skillData = first.data as any;
    if (!skillData) return null;
    let maxLevel = 1;
    Object.keys(skillData).forEach((key) => {
      const val = (skillData as any)[key];
      if (typeof val === 'object' && val !== null) {
        const levels = Object.keys(val).filter((k) => !isNaN(Number(k))).map(Number);
        if (levels.length) {
          maxLevel = Math.max(maxLevel, Math.max(...levels));
        }
      }
    });
    return { name: skillData['skill-name'] || first.name, level: maxLevel };
  };

  const formatHeroMeta = (hero?: HeroSelection | null) => {
    if (!hero) return null;
    const stars = hero.starLevel !== undefined ? `★${Math.max(0, Math.round(hero.starLevel / 5 - 1))}` : null;
    const level = `Lv ${hero.xpLevel ?? 80}`;
    return [stars, level].filter(Boolean).join(' · ');
  };

  return (
    <div>
      <div className="text-sm font-semibold mb-2">{label}</div>
      <div className="border border-white/10 rounded-lg p-3">
        <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Leaders</div>
        <div className="space-y-2">
          {TROOP_TYPES.map((type) => {
            const hero = leaders[type];
            return (
              <div key={`leader-${label}-${type}`} className="flex justify-between text-sm">
                <span className="font-semibold capitalize">{type}</span>
                {hero ? (
                  <span className="text-right text-xs text-gray-300">
                    {hero.heroName}
                    {formatHeroMeta(hero) ? ` · ${formatHeroMeta(hero)}` : ''}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">None</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="text-xs uppercase tracking-wide text-gray-400 mt-4 mb-2">Joiners (first 4 active)</div>
        <div className="space-y-2">
          {joiners.slice(0, 4).map((joiner, index) => {
            const skillInfo = getFirstSkillInfo(joiner.heroName);
            return (
              <div
                key={`joiner-${label}-${joiner.heroName}-${index}`}
                className="text-xs text-gray-300 flex justify-between"
              >
                <span>{joiner.heroName}</span>
                <div className="text-right">
                  <div>{formatHeroMeta(joiner) || '—'}</div>
                  <div className="text-[11px] text-gray-500">
                    {skillInfo ? `${skillInfo.name} - Lv ${skillInfo.level}` : 'Skill: —'}
                  </div>
                </div>
              </div>
            );
          })}
          {joiners.length === 0 && <div className="text-xs text-gray-500">No joiners configured</div>}
        </div>
      </div>
    </div>
  );
}

function CapacityComparison({
  playerLabel,
  opponentLabel,
  playerCapacity,
  opponentCapacity,
}: {
  playerLabel: string;
  opponentLabel: string;
  playerCapacity: CapacityReport | null;
  opponentCapacity: CapacityReport | null;
}) {
  if (!playerCapacity && !opponentCapacity) {
    return null;
  }

  return (
    <div className="card info-card mt-6">
      <h3>Capacity Breakdown</h3>
      <div className="grid gap-4 lg:grid-cols-2">
        {playerCapacity && (
          <CapacitySummaryCard label={playerLabel} summary={playerCapacity} />
        )}
        {opponentCapacity && (
          <CapacitySummaryCard label={opponentLabel} summary={opponentCapacity} />
        )}
      </div>
    </div>
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

function BonusesPanel({
  playerStats,
  opponentStats,
  playerSpecial,
  opponentSpecial,
  playerJoinerAdditive,
  opponentJoinerAdditive,
}: {
  playerStats: SideBaseStats | null;
  opponentStats: SideBaseStats | null;
  playerSpecial: SpecialBonusSummary | null;
  opponentSpecial: SpecialBonusSummary | null;
  playerJoinerAdditive?: BattleSideContext['joinerAdditive'];
  opponentJoinerAdditive?: BattleSideContext['joinerAdditive'];
}) {
  if (!playerStats && !opponentStats && !playerSpecial && !opponentSpecial) {
    return null;
  }

  return (
    <div className="card info-card mt-6">
      <h3>Bonuses</h3>
      <p className="text-sm text-gray-400 dark:text-gray-400 mt-2">
        Base stat output (after Basic + Additive × Multiplicative) alongside rally-only special bonuses and debuffs.
      </p>
      <div className="space-y-4 mt-4">
        <StatBonusCards playerStats={playerStats} opponentStats={opponentStats} playerJoinerAdditive={playerJoinerAdditive} opponentJoinerAdditive={opponentJoinerAdditive} />
        <SpecialBonusTable player={playerSpecial} opponent={opponentSpecial} />
      </div>
    </div>
  );
}

function StatBonusCards({
  playerStats,
  opponentStats,
  playerJoinerAdditive,
  opponentJoinerAdditive,
}: {
  playerStats: SideBaseStats | null;
  opponentStats: SideBaseStats | null;
  playerJoinerAdditive?: BattleSideContext['joinerAdditive'];
  opponentJoinerAdditive?: BattleSideContext['joinerAdditive'];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <StatBonusCard label="Player Stat Bonuses" stats={playerStats} accent="text-rose-200" joinerAdditive={playerJoinerAdditive} />
      <StatBonusCard label="Opponent Stat Bonuses" stats={opponentStats} accent="text-sky-200" joinerAdditive={opponentJoinerAdditive} />
    </div>
  );
}

function StatBonusCard({
  label,
  stats,
  accent,
  joinerAdditive,
}: {
  label: string;
  stats: SideBaseStats | null;
  accent: string;
  joinerAdditive?: BattleSideContext['joinerAdditive'];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <div className="text-sm font-semibold text-white mb-2">{label}</div>
      {!stats ? (
        <p className="text-xs text-gray-400">Configure this side&apos;s profile to view stat outputs.</p>
      ) : (
        <>
          <div className="space-y-4">
            {TROOP_TYPES.map((type) => {
              const line = stats[type];
              if (!line) return null;
              return (
                <div key={`${label}-${type}`} className="border border-white/10 rounded-lg p-3 bg-slate-900/30">
                  <div className="text-sm font-semibold capitalize mb-2">{type}</div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span>Attack</span><span className={`font-semibold ${accent}`}>{formatStatValue(line.attack)}</span></div>
                    <div className="flex justify-between"><span>Defense</span><span className={`font-semibold ${accent}`}>{formatStatValue(line.defense)}</span></div>
                    <div className="flex justify-between"><span>Lethality</span><span className={`font-semibold ${accent}`}>{formatStatValue(line.lethality)}</span></div>
                    <div className="flex justify-between"><span>Health</span><span className={`font-semibold ${accent}`}>{formatStatValue(line.health)}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
          {joinerAdditive && (joinerAdditive.attack !== 0 || joinerAdditive.defense !== 0 || joinerAdditive.lethality !== 0 || joinerAdditive.health !== 0) && (
            <div className="mt-3 rounded-lg border border-white/10 bg-slate-800/40 p-3 text-xs">
              <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">Joiner Additive (applies to all troops)</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between"><span>Attack</span><span className="font-semibold text-sky-200">{formatSignedPercent(joinerAdditive.attack)}</span></div>
                <div className="flex justify-between"><span>Defense</span><span className="font-semibold text-sky-200">{formatSignedPercent(joinerAdditive.defense)}</span></div>
                <div className="flex justify-between"><span>Lethality</span><span className="font-semibold text-sky-200">{formatSignedPercent(joinerAdditive.lethality)}</span></div>
                <div className="flex justify-between"><span>Health</span><span className="font-semibold text-sky-200">{formatSignedPercent(joinerAdditive.health)}</span></div>
              </div>
              <div className="mt-2 text-[11px] text-gray-500">
                Joiners: {joinerAdditive.names && joinerAdditive.names.length ? joinerAdditive.names.join(', ') : '—'}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SpecialBonusTable({
  player,
  opponent,
}: {
  player: SpecialBonusSummary | null;
  opponent: SpecialBonusSummary | null;
}) {
  const rows: Array<{
    label: string;
    playerValue: number;
    opponentValue: number;
    group: 'Troops' | 'Enemy' | 'Defender' | 'Rally';
  }> = [
      { label: 'Troops Attack Bonus', playerValue: player?.troopsAttack ?? 0, opponentValue: opponent?.troopsAttack ?? 0, group: 'Troops' },
      { label: 'Troops Defense Bonus', playerValue: player?.troopsDefense ?? 0, opponentValue: opponent?.troopsDefense ?? 0, group: 'Troops' },
      { label: 'Troops Lethality Bonus', playerValue: player?.troopsLethality ?? 0, opponentValue: opponent?.troopsLethality ?? 0, group: 'Troops' },
      { label: 'Troops Health Bonus', playerValue: player?.troopsHealth ?? 0, opponentValue: opponent?.troopsHealth ?? 0, group: 'Troops' },
      { label: 'Enemy Troops Attack', playerValue: player?.enemyAttackReduction ?? 0, opponentValue: opponent?.enemyAttackReduction ?? 0, group: 'Enemy' },
      { label: 'Enemy Troops Defense', playerValue: player?.enemyDefenseReduction ?? 0, opponentValue: opponent?.enemyDefenseReduction ?? 0, group: 'Enemy' },
    ];

  let lastGroup: string | null = null;

  const formatSourceList = (values: Array<{ label: string; value: number; detail?: string }>) => {
    const filtered = values.filter((v) => Math.abs(v.value) > 0.0001);
    if (filtered.length === 0) return null;
    return (
      <div className="flex flex-col gap-0.5">
        {filtered.map((v) => (
          <div key={v.label} className="flex flex-col gap-0.5">
            <div className="flex justify-between">
              <span className="text-gray-500">{v.label}</span>
              <span className="text-gray-400">{formatSignedPercent(v.value)}</span>
            </div>
            {v.detail && <div className="text-[10px] text-gray-600">{v.detail}</div>}
          </div>
        ))}
      </div>
    );
  };

  const formatCombatDebuffDetail = (entry?: { combat?: number; pet?: number; manual?: number }) => {
    if (!entry) return undefined;
    const parts: string[] = [];
    // Only show pet and manual - no "stored" value since we calculate from pet + manual
    if (entry.pet !== undefined && Math.abs(entry.pet) > 0.0001) {
      parts.push(`pet: ${formatSignedPercent(entry.pet)}`);
    }
    if (entry.manual !== undefined && Math.abs(entry.manual) > 0.0001) {
      parts.push(`manual: ${formatSignedPercent(entry.manual)}`);
    }
    return parts.length ? parts.join(' | ') : undefined;
  };

  const statKeyForLabel = (label: string): 'attack' | 'defense' | 'lethality' | 'health' | null => {
    if (label.includes('Attack')) return 'attack';
    if (label.includes('Defense')) return 'defense';
    if (label.includes('Lethality')) return 'lethality';
    if (label.includes('Health')) return 'health';
    return null;
  };

  const buildSources = (
    summary: SpecialBonusSummary | null,
    label: string
  ): Array<{ label: string; value: number; detail?: string }> => {
    if (!summary?.breakdown) return [];
    const key = statKeyForLabel(label);
    if (label === 'Enemy Troops Attack') {
      const combatDetail = formatCombatDebuffDetail(summary.breakdown.enemyAttack);
      const joinerDetail = summary.breakdown.joiner.names.length && summary.breakdown.enemyAttack.joiner !== 0
        ? summary.breakdown.joiner.names.join(', ')
        : undefined;
      return [
        { label: 'City', value: summary.breakdown.enemyAttack.city },
        { label: 'Combat Debuffs / Pets', value: summary.breakdown.enemyAttack.combat, detail: combatDetail },
        { label: 'Joiners', value: summary.breakdown.enemyAttack.joiner, detail: joinerDetail },
      ];
    }
    if (label === 'Enemy Troops Defense') {
      const combatDetail = formatCombatDebuffDetail(summary.breakdown.enemyDefense);
      const joinerDetail = summary.breakdown.joiner.names.length && summary.breakdown.enemyDefense.joiner !== 0
        ? summary.breakdown.joiner.names.join(', ')
        : undefined;
      return [
        { label: 'City', value: summary.breakdown.enemyDefense.city },
        { label: 'Combat Debuffs / Pets', value: summary.breakdown.enemyDefense.combat, detail: combatDetail },
        { label: 'Joiners', value: summary.breakdown.enemyDefense.joiner, detail: joinerDetail },
      ];
    }
    if (!key) return [];
    const joinerDetail = summary.breakdown.joiner.names.length && summary.breakdown.joiner[key] !== 0
      ? summary.breakdown.joiner.names.join(', ')
      : undefined;
    return [
      { label: 'Pet Skills', value: summary.breakdown.pet[key] || 0 },
      { label: 'City Bonuses', value: summary.breakdown.city[key] || 0 },
      { label: 'Combat Buffs', value: summary.breakdown.combat[key] || 0 },
      { label: 'Special Buffs', value: summary.breakdown.special?.[key] || 0 },
      { label: 'Joiners', value: summary.breakdown.joiner[key] || 0, detail: joinerDetail },
    ];
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <div className="text-sm font-semibold text-white mb-2">Special Bonuses</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 dark:text-gray-400 text-xs uppercase tracking-wide">
              <th className="py-2">Bonus</th>
              <th className="py-2 text-center">Player</th>
              <th className="py-2 text-center">Opponent</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const showGroupHeader = row.group !== lastGroup;
              lastGroup = row.group;
              const playerSourcesRaw = formatSourceList(buildSources(player, row.label));
              const opponentSourcesRaw = formatSourceList(buildSources(opponent, row.label));

              const isEnemyRow = row.group === 'Enemy';
              const playerValueDisplay = isEnemyRow ? -(row.opponentValue) : row.playerValue;
              const opponentValueDisplay = isEnemyRow ? -(row.playerValue) : row.opponentValue;

              const playerSources = isEnemyRow ? opponentSourcesRaw : playerSourcesRaw;
              const opponentSources = isEnemyRow ? playerSourcesRaw : opponentSourcesRaw;

              const hasSources = Boolean(playerSources || opponentSources);
              return (
                <Fragment key={`${row.label}-${index}`}>
                  {showGroupHeader && (
                    <tr className="bg-slate-900/60 border-t border-slate-800/80">
                      <td colSpan={3} className="py-2 px-2 text-[10px] uppercase tracking-wide text-gray-500">
                        {row.group} Bonuses
                      </td>
                    </tr>
                  )}
                  <tr className="border-t border-slate-800/60">
                    <td className="py-2 px-2">{row.label}</td>
                    <td className="py-2 text-center font-semibold text-rose-200">
                      {formatSignedPercent(playerValueDisplay)}
                    </td>
                    <td className="py-2 text-center font-semibold text-sky-200">
                      {formatSignedPercent(opponentValueDisplay)}
                    </td>
                  </tr>
                  {hasSources && (
                    <tr className="text-[11px] text-gray-500 align-top">
                      <td className="py-1 px-4 text-gray-500">Sources</td>
                      <td className="py-1 px-2 align-top">{playerSources || <span className="text-gray-600">—</span>}</td>
                      <td className="py-1 px-2 align-top">{opponentSources || <span className="text-gray-600">—</span>}</td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BattleAnalysisPanel({
  player,
  opponent,
  battleReport
}: {
  player: BattleSideContext;
  opponent: BattleSideContext;
  battleReport: BattleReport | null;
}) {
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
      <div className="card info-card mt-6">
        <h3>Battle Analysis</h3>
        <p className="text-sm text-gray-400 dark:text-gray-400">
          No turns were recorded. Increase troop counts or ensure both sides have valid mixes.
        </p>
      </div>
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
      title="Battle Analysis"
      description="Deterministic engine log with per-turn state, targeting, modifiers, stats, and exact damage math."
      collapsible
      defaultCollapsed={false}
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

      <div className="mt-4">
        <CasualtyChart turns={battleReport.turns} />
      </div>

      <div className="mt-5 space-y-3">
        {battleReport.turns.map((turn) => (
          <TurnCard key={`turn-${turn.turn}`} turn={turn} />
        ))}
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

function SummaryTile({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return <StatTile label={label} value={value} helper={helper} tone="muted" size="sm" />;
}

function TurnCard({ turn }: { turn: TurnLog }) {
  const [open, setOpen] = useState(turn.turn === 1);
  const startAttacker = turn.startAttackerTroops ?? turn.attackerTroops;
  const startDefender = turn.startDefenderTroops ?? turn.defenderTroops;
  const startAttackerMods = turn.startModifiers?.attacker?.length ?? 0;
  const startDefenderMods = turn.startModifiers?.defender?.length ?? 0;
  const attackerSkills = collectSkillActivations(turn, "attacker");
  const defenderSkills = collectSkillActivations(turn, "defender");

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
          <span className="text-xs uppercase tracking-wide text-gray-400">Turn {turn.turn}</span>
          <span className="text-sm text-gray-300">
            Start A: {formatTroopCounts(startAttacker)} · D: {formatTroopCounts(startDefender)}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>Mods A:{startAttackerMods}</span>
          <span>D:{startDefenderMods}</span>
          <span className="text-lg text-gray-400">{open ? '−' : '+'}</span>
        </div>
      </button>
      {open && (
        <div className="border-t border-white/5 px-4 py-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <TurnStateSummary
              label="Start of turn"
              attacker={startAttacker as CombatTroopCounts}
              defender={startDefender as CombatTroopCounts}
            />
            <TurnStateSummary
              label="End of turn"
              attacker={turn.attackerTroops as CombatTroopCounts}
              defender={turn.defenderTroops as CombatTroopCounts}
            />
          </div>
          <div className="space-y-2">
            {turn.actions.map((action) => (
              <ActionRow key={action.id} action={action} turn={turn} />
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <SkillTable label="Attacker skills" rows={attackerSkills} />
            <SkillTable label="Defender skills" rows={defenderSkills} />
          </div>
        </div>
      )}
    </div>
  );
}

function TurnStateSummary({ label, attacker, defender }: { label: string; attacker: CombatTroopCounts; defender: CombatTroopCounts }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-xs text-gray-300">
        <div className="flex justify-between"><span>Attacker</span><span>{formatTroopCounts(attacker)}</span></div>
        <div className="flex justify-between"><span>Defender</span><span>{formatTroopCounts(defender)}</span></div>
      </div>
    </div>
  );
}

function ActionRow({ action, turn }: { action: ActionLogEntry; turn: TurnLog }) {
  const [open, setOpen] = useState(false);
  const kills = action.components?.finalKills ?? 0;

  return (
    <div className="rounded-xl border border-white/10 bg-black/20">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 text-left text-xs text-slate-200"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {action.side === 'attacker' ? 'Attacker' : 'Defender'} · {action.actor} → {action.target} ({action.actionType})
          </span>
          {action.skillName && <span className="text-[11px] text-slate-400">Skill: {action.skillName}</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-300 font-semibold">{kills.toFixed(2)} kills</span>
          <span className="text-[11px] text-slate-400">{open ? 'Hide' : 'Show'} details</span>
        </div>
      </button>
      {open && <ActionDetail action={action} turn={turn} />}
    </div>
  );
}

function ActionDetail({ action, turn }: { action: ActionLogEntry; turn: TurnLog }) {
  const comp = action.components;
  const outgoing = action.outgoingComponents ?? comp?.outgoingComponents ?? [];
  const incoming = action.incomingComponents ?? comp?.incomingComponents ?? [];
  const keptOutgoing = outgoing.filter((m) => m.kept !== false);
  const keptIncoming = incoming.filter((m) => m.kept !== false);
  const discarded = [...outgoing, ...incoming].filter((m) => m.kept === false);

  return (
    <div className="border-t border-white/5 px-3 py-3 space-y-3 text-xs text-slate-200 bg-slate-950/40">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">Formula</div>
      <div className="space-y-1 text-slate-300">
        <div>baseKills = K({formatNumber(comp?.k)}) · N^alpha({formatNumber(comp?.nTerm)}) · ratio({formatNumber(comp?.ratio)}) · matchup({formatNumber(comp?.matchupMultiplier)}) · action({formatNumber(comp?.actionMultiplier)})</div>
        <div>outgoingMultiplier = {formatNumber(comp?.outgoingMultiplier)} · incomingMultiplier = {formatNumber(comp?.incomingMultiplier)}</div>
        <div>rawFinal = {formatNumber(comp?.rawFinal)} · finalKills = {formatNumber(comp?.finalKills)}</div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <StatBreakdown title="Attacker stats" detail={action.stats?.attacker} />
        <StatBreakdown title="Defender stats" detail={action.stats?.defender} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ModifierList title="Outgoing modifiers" items={keptOutgoing} multiplier={comp?.outgoingMultiplier} />
        <ModifierList title="Incoming modifiers" items={keptIncoming} multiplier={comp?.incomingMultiplier} />
      </div>

      {discarded.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="text-[11px] uppercase tracking-wide text-amber-300">Discarded (stacking)</div>
          <div className="mt-1 space-y-1 text-xs text-amber-100">
            {discarded.map((d) => (
              <div key={d.id} className="flex justify-between">
                <span>{d.source ?? d.id}</span>
                <span>{d.discardedReason ?? 'discarded'} (stack {d.stackingKey ?? '—'})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {action.targeting && (
        <div>
          <div className="text-[11px] uppercase tracking-wide text-gray-500">Targeting</div>
          <div className="mt-1 text-slate-300">
            Target: {action.targeting.selected ?? 'None'} · Reason: {action.targeting.reason ?? '—'} · Roll: {formatNumber(action.targeting.roll)}
          </div>
        </div>
      )}

      {action.rngRolls && action.rngRolls.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wide text-gray-500">RNG</div>
          <div className="mt-1 space-y-1">
            {action.rngRolls.map((roll, idx) => (
              <div key={idx} className="flex justify-between text-slate-300">
                <span>{roll.label}</span>
                <span>{formatNumber(roll.value)} / thresh {formatNumber(roll.threshold)} {roll.succeeded ? '✓' : '✗'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <SkillList title="Attacker skills (this turn)" rows={skillsForSide(turn, action.side)} />
        <SkillList title="Defender skills (this turn)" rows={skillsForSide(turn, action.side === 'attacker' ? 'defender' : 'attacker')} />
      </div>
    </div>
  );
}

function SkillTable({ label, rows }: { label: string; rows: ReturnType<typeof collectSkillActivations> }) {
  const impactMap = new Map<
    string,
    { target?: string; trigger?: string; sourceType?: 'Hero' | 'Troop'; succeeded?: boolean }
  >();
  rows.impacts.forEach((i) =>
    impactMap.set(`${i.heroId ?? '__troop'}:${i.name}`, {
      target: i.target,
      trigger: i.trigger,
      sourceType: i.sourceType === 'hero' ? 'Hero' : 'Troop',
      succeeded:
        i.damageModifier !== undefined || i.stats?.length || i.specialStats?.length ? true : i.succeeded
    })
  );

  const merged: Array<{
    name: string;
    heroId?: string;
    count: number;
    trigger?: string;
    target?: string;
    sourceType: 'Hero' | 'Troop';
    succeeded?: boolean;
  }> = [
      ...rows.hero.map((h) => {
        const meta = impactMap.get(`${h.heroId ?? '__troop'}:${h.name}`);
        return {
          name: h.name,
          heroId: h.heroId,
          count: h.count,
          trigger: h.trigger ?? meta?.trigger,
          target: h.target ?? meta?.target,
          sourceType: (h.sourceType === 'hero' ? 'Hero' : 'Troop') as 'Hero' | 'Troop',
          succeeded: meta?.succeeded ?? true
        };
      }),
      ...rows.troop.map((t) => {
        const meta = impactMap.get(`__troop:${t.name}`);
        return {
          name: t.name,
          count: t.count,
          trigger: t.trigger ?? meta?.trigger,
          target: t.target ?? meta?.target,
          sourceType: (t.sourceType === 'hero' ? 'Hero' : 'Troop') as 'Hero' | 'Troop',
          succeeded: meta?.succeeded ?? true
        };
      })
    ];

  const allRows = merged.sort((a, b) => (a.name > b.name ? 1 : -1));
  const passives = allRows.filter((r) => (r.trigger ?? '').toLowerCase().includes('passive'));
  const triggered = allRows.filter((r) => !passives.includes(r));

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">{label}</div>
      {allRows.length === 0 && <div className="text-xs text-gray-500">No skills recorded this turn.</div>}

      {passives.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">Passive / Ongoing</div>
          <div className="divide-y divide-white/5">
            {passives.map((row, idx) => (
              <div key={`p-${row.name}-${idx}`} className="flex items-center justify-between py-1 text-xs text-slate-200">
                <div>
                  <div className="font-semibold">
                    {row.sourceType === 'Hero' && row.heroId ? `${row.heroId} - ${row.name}` : row.name}
                  </div>
                  <div className="text-[11px] text-slate-400">{row.target ?? 'General'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-200">
                    passive
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {triggered.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">Turn-based / Chance</div>
          <div className="divide-y divide-white/5">
            {triggered.map((row, idx) => (
              <div key={`t-${row.name}-${idx}`} className="flex items-center justify-between py-1 text-xs text-slate-200">
                <div>
                  <div className="font-semibold">
                    {row.sourceType === 'Hero' && row.heroId ? `${row.heroId} - ${row.name}` : row.name}
                  </div>
                  <div className="text-[11px] text-slate-400">{row.target ?? 'General'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-200">
                    {row.trigger ?? 'OnTurn'}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${row.succeeded === false
                      ? 'bg-rose-500/20 text-rose-200'
                      : row.succeeded === true
                        ? 'bg-emerald-500/20 text-emerald-200'
                        : 'bg-slate-700/60 text-slate-200'
                      }`}
                  >
                    {row.succeeded === false ? 'miss' : row.succeeded === true ? 'hit' : 'expected'}
                  </span>
                  {row.count > 1 && (
                    <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[11px] text-emerald-300">
                      {row.count}x
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SkillList({ title, rows }: { title: string; rows: Array<{ name: string; trigger?: string; succeeded?: boolean; heroId?: string }> }) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/15 p-3">
        <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">{title}</div>
        <div className="text-xs text-gray-500">No skills recorded this turn.</div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-white/10 bg-black/15 p-3 space-y-1">
      <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">{title}</div>
      {rows.map((row, idx) => (
        <div key={`${row.name}-${row.heroId ?? 'troop'}-${idx}`} className="flex items-center justify-between text-xs text-slate-200">
          <span className="font-semibold">{row.heroId ? `${row.heroId} - ${row.name}` : row.name}</span>
          <span className="text-[11px] text-slate-400">{row.trigger ?? '—'}</span>
          <span className={`text-[11px] ${row.succeeded === false ? 'text-rose-300' : 'text-emerald-300'}`}>
            {row.succeeded === false ? 'miss' : 'hit'}
          </span>
        </div>
      ))}
    </div>
  );
}

function skillsForSide(turn: TurnLog, side: 'attacker' | 'defender') {
  const rows: Array<{ name: string; trigger?: string; succeeded?: boolean; heroId?: string }> = [];
  const push = (name: string, trigger?: string, succeeded?: boolean, heroId?: string) => {
    rows.push({ name, trigger, succeeded, heroId });
  };
  // Create a lookup map for triggers from skillRolls
  const triggerMap = new Map<string, string>();
  turn.skillRolls?.filter((r) => r.side === side).forEach((r) => {
    const key = `${r.heroId ?? '__troop'}:${r.name}`;
    if (r.trigger && !triggerMap.has(key)) {
      triggerMap.set(key, r.trigger);
    }
  });
  turn.skillsActivated?.filter((s) => s.side === side).forEach((s) => {
    const key = `${s.heroId ?? '__troop'}:${s.name}`;
    const trigger = s.isActive ? 'Passive' : triggerMap.get(key) ?? (s as any).trigger;
    push(s.name, trigger, s.succeeded, s.heroId);
  });
  turn.skillImpacts?.filter((s) => s.side === side).forEach((s) => push(s.name, s.trigger as any, s.succeeded, s.heroId));
  turn.skillRolls?.filter((r) => r.side === side).forEach((r) => push(r.name, r.trigger, r.succeeded, r.heroId));
  // Dedup by name/heroId/trigger keeping first hit/miss
  const seen = new Set<string>();
  const unique: typeof rows = [];
  rows.forEach((r) => {
    const key = `${r.heroId ?? '__troop'}:${r.name}:${r.trigger ?? 'any'}`;
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(r);
  });
  return unique;
}

function StatBreakdown({ title, detail }: { title: string; detail?: EffectiveStatSnapshot }) {
  if (!detail) return null;
  const rows: Array<{ key: keyof EffectiveStatSnapshot; label: string }> = [
    { key: 'attack', label: 'Attack' },
    { key: 'lethality', label: 'Lethality' },
    { key: 'defense', label: 'Defense' },
    { key: 'health', label: 'Health' }
  ];
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{title}</div>
      <div className="mt-2 space-y-1">
        {rows.map((row) => (
          <div key={row.key} className="flex justify-between text-slate-200">
            <span>{row.label}</span>
            <span>
              {formatNumber(detail[row.key].base)} → {formatNumber(detail[row.key].effective)} ({formatNumber(detail[row.key].finalPercent)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModifierList({ title, items, multiplier }: { title: string; items: ModifierComponentLog[]; multiplier?: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/15 p-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-gray-500">
        <span>{title}</span>
        <span className="text-slate-300">× {formatNumber(multiplier ?? 1)}</span>
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-gray-500 mt-1">None applied</div>
      ) : (
        <div className="mt-2 space-y-1 text-xs text-slate-200">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>{item.source ?? item.id}</span>
              <span>{formatNumber(item.magnitude)} (stack {item.stackingKey ?? '—'})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CasualtyChart({ turns }: { turns: TurnLog[] }) {
  const [hover, setHover] = useState<{
    side: "attacker" | "defender";
    turn: number;
    losses: number;
    byType: Partial<CombatTroopCounts>;
    topSkill?: string;
    pairedLosses?: number;
    pairedByType?: Partial<CombatTroopCounts>;
    pairedSkill?: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"losses" | "kills">("losses");
  const [usePercentScale, setUsePercentScale] = useState<boolean>(false);
  const [cumulative, setCumulative] = useState<boolean>(false);

  if (!turns.length) return null;
  const series = buildCasualtySeries(turns);

  const initialAtt = turns[0]?.startAttackerTroops ?? turns[0]?.attackerTroops;
  const initialDef = turns[0]?.startDefenderTroops ?? turns[0]?.defenderTroops;
  const initialTotals = {
    attacker: Math.max(1, totalCounts(initialAtt)),
    defender: Math.max(1, totalCounts(initialDef))
  };
  const initialByType = {
    attacker: initialAtt ?? { Infantry: 0, Lancer: 0, Marksman: 0 },
    defender: initialDef ?? { Infantry: 0, Lancer: 0, Marksman: 0 }
  };

  const mapLoss = (p: ReturnType<typeof buildCasualtySeries>[number], side: "attacker" | "defender") => {
    if (viewMode === "losses") {
      return side === "attacker" ? p.attackerLosses : p.defenderLosses;
    }
    // kills: flip perspective
    return side === "attacker" ? p.defenderLosses : p.attackerLosses;
  };
  const mapLossByType = (p: ReturnType<typeof buildCasualtySeries>[number], side: "attacker" | "defender") => {
    if (viewMode === "losses") {
      return side === "attacker" ? p.attackerLossesByType : p.defenderLossesByType;
    }
    return side === "attacker" ? p.defenderLossesByType : p.attackerLossesByType;
  };
  const normalizeValue = (value: number, side: "attacker" | "defender") =>
    usePercentScale ? (value / initialTotals[side]) * 100 : value;
  const normalizeByType = (value: number | undefined, side: "attacker" | "defender", type: keyof CombatTroopCounts) => {
    const denom = usePercentScale ? (initialByType[side]?.[type] || initialTotals[side]) : 1;
    if (!denom) return 0;
    return usePercentScale ? (value ?? 0) / denom * 100 : value ?? 0;
  };

  // Apply cumulative transform when enabled
  const cumulativeSeries = cumulative
    ? series.reduce<ReturnType<typeof buildCasualtySeries>>((acc, curr, idx) => {
      const prev = acc[idx - 1];
      acc.push({
        ...curr,
        attackerLosses: (prev?.attackerLosses ?? 0) + curr.attackerLosses,
        defenderLosses: (prev?.defenderLosses ?? 0) + curr.defenderLosses,
        attackerLossesByType: {
          Infantry: (prev?.attackerLossesByType.Infantry ?? 0) + (curr.attackerLossesByType.Infantry ?? 0),
          Lancer: (prev?.attackerLossesByType.Lancer ?? 0) + (curr.attackerLossesByType.Lancer ?? 0),
          Marksman: (prev?.attackerLossesByType.Marksman ?? 0) + (curr.attackerLossesByType.Marksman ?? 0)
        },
        defenderLossesByType: {
          Infantry: (prev?.defenderLossesByType.Infantry ?? 0) + (curr.defenderLossesByType.Infantry ?? 0),
          Lancer: (prev?.defenderLossesByType.Lancer ?? 0) + (curr.defenderLossesByType.Lancer ?? 0),
          Marksman: (prev?.defenderLossesByType.Marksman ?? 0) + (curr.defenderLossesByType.Marksman ?? 0)
        }
      });
      return acc;
    }, [])
    : series;

  const maxDef = Math.max(...cumulativeSeries.map((p) => normalizeValue(mapLoss(p, "defender"), "defender")), 1);
  const maxAtt = Math.max(...cumulativeSeries.map((p) => normalizeValue(mapLoss(p, "attacker"), "attacker")), 1);
  const maxLoss = Math.max(maxDef, maxAtt);
  // Fit chart width to number of turns so points are spaced and readable on small screens.
  // Use a minimum step per turn and allow horizontal scrolling when many turns exist.
  const padX = 14;
  const padY = 14;
  const minStep = 28; // spacing per turn to keep labels readable on mobile
  const turnsCount = Math.max(series.length, 1);
  const width = Math.max(360, padX * 2 + (turnsCount - 1) * minStep);
  const height = 180;
  const step = turnsCount > 1 ? (width - padX * 2) / (turnsCount - 1) : 0;

  // Avoid flat lines when values are tiny; enforce a minimal vertical range in percent mode.
  const scaleMax =
    usePercentScale && maxLoss > 0
      ? Math.max(maxLoss, 5) // at least 5% range so small losses are visible
      : Math.max(maxLoss, 1);

  const toPoint = (value: number, idx: number) => {
    const x = padX + idx * step;
    const y = padY + (height - padY * 2) * (1 - value / scaleMax);
    return { x, y };
  };

  const defenderPoints = cumulativeSeries.map((p, idx) => {
    const lossesRaw = mapLoss(p, "defender");
    const lossesNorm = normalizeValue(lossesRaw, "defender");
    return {
      ...toPoint(lossesNorm, idx),
      turn: p.turn,
      byType: mapLossByType(p, "defender"),
      lossesRaw,
      topSkill: p.skillAgainstDefender,
      pairedLosses: mapLoss(p, "attacker"),
      pairedByType: mapLossByType(p, "attacker"),
      pairedSkill: p.skillAgainstAttacker
    };
  });
  const attackerPoints = cumulativeSeries.map((p, idx) => {
    const lossesRaw = mapLoss(p, "attacker");
    const lossesNorm = normalizeValue(lossesRaw, "attacker");
    return {
      ...toPoint(lossesNorm, idx),
      turn: p.turn,
      byType: mapLossByType(p, "attacker"),
      lossesRaw,
      topSkill: p.skillAgainstAttacker,
      pairedLosses: mapLoss(p, "defender"),
      pairedByType: mapLossByType(p, "defender"),
      pairedSkill: p.skillAgainstDefender
    };
  });
  const defenderStr = defenderPoints.map(({ x, y }) => `${x},${y}`).join(" ");
  const attackerStr = attackerPoints.map(({ x, y }) => `${x},${y}`).join(" ");

  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs uppercase tracking-wide text-gray-400">
        <div className="flex items-center gap-2">
          <span>Casualties per turn</span>
          <span className="text-[11px] text-slate-500">Attacker vs Defender {viewMode === "losses" ? "losses" : "kills"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 normal-case">
          <div className="text-[11px] text-gray-400 mr-2">Scale: {usePercentScale ? "% of starting troops" : "absolute count"}</div>
          <div className="flex rounded-full border border-white/10 bg-slate-900/40 overflow-hidden">
            {(["losses", "kills"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-2 py-1 text-[11px] ${viewMode === mode ? "bg-rose-500/40 text-white" : "text-gray-300"}`}
              >
                {mode === "losses" ? "Casualties" : "Kills"}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1 text-[11px] text-gray-300">
            <input
              type="checkbox"
              checked={usePercentScale}
              onChange={(e) => setUsePercentScale(e.target.checked)}
              className="h-3 w-3 accent-rose-400"
            />
            % scale
          </label>
          <label className="flex items-center gap-1 text-[11px] text-gray-300">
            <input
              type="checkbox"
              checked={cumulative}
              onChange={(e) => setCumulative(e.target.checked)}
              className="h-3 w-3 accent-rose-400"
            />
            Cumulative
          </label>
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-white/5 bg-slate-900/40 p-3 relative overflow-x-auto casualty-scroll">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-label="Casualties line chart"
          className="h-48 min-w-full"
        >
          {renderTypeLines(series, maxLoss, toPoint, "defender", setHover)}
          {renderTypeLines(series, maxLoss, toPoint, "attacker", setHover)}
        </svg>
        <div className="mt-2 text-[11px] text-gray-400 flex justify-between">
          <span className="text-rose-200">
            Def max: {usePercentScale ? `${maxLoss.toFixed(1)}%` : formatBigNumber(maxLoss)}
          </span>
          <span className="text-sky-200">
            Att max: {usePercentScale
              ? `${maxAtt.toFixed(1)}%`
              : formatBigNumber(Math.max(...series.map((p) => mapLoss(p, "attacker")), 1))}
          </span>
          <span className="text-slate-300">Turns: {series.length}</span>
        </div>
        {hover && (
          <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/80 p-3 text-xs text-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                Turn {hover.turn} · {hover.side === "defender" ? "Defender" : "Attacker"} {viewMode === "losses" ? "losses" : "kills"}:{" "}
                {usePercentScale
                  ? `${normalizeValue(hover.losses, hover.side).toFixed(2)}%`
                  : formatBigNumber(hover.losses)}
              </span>
              {hover.topSkill && <span className="text-[11px] text-emerald-300">Skill vs {hover.side === "defender" ? "Def" : "Att"}: {hover.topSkill}</span>}
            </div>
            <div className="mt-1 text-[11px] text-slate-300">
              {renderByType("Infantry", hover.byType.Infantry, hover.side, usePercentScale, normalizeByType)}
              {renderByType("Lancer", hover.byType.Lancer, hover.side, usePercentScale, normalizeByType)}
              {renderByType("Marksman", hover.byType.Marksman, hover.side, usePercentScale, normalizeByType)}
            </div>
            {hover.pairedLosses !== undefined && (
              <div className="mt-3 border-t border-white/10 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    Opposite side {viewMode === "losses" ? "losses" : "kills"}:{" "}
                    {usePercentScale
                      ? `${normalizeValue(hover.pairedLosses, hover.side === "defender" ? "attacker" : "defender").toFixed(2)}%`
                      : formatBigNumber(hover.pairedLosses)}
                  </span>
                  {hover.pairedSkill && <span className="text-[11px] text-sky-300">Skill vs {hover.side === "defender" ? "Att" : "Def"}: {hover.pairedSkill}</span>}
                </div>
                <div className="mt-1 text-[11px] text-slate-300">
                  {renderByType("Infantry", hover.pairedByType?.Infantry, hover.side === "defender" ? "attacker" : "defender", usePercentScale, normalizeByType)}
                  {renderByType("Lancer", hover.pairedByType?.Lancer, hover.side === "defender" ? "attacker" : "defender", usePercentScale, normalizeByType)}
                  {renderByType("Marksman", hover.pairedByType?.Marksman, hover.side === "defender" ? "attacker" : "defender", usePercentScale, normalizeByType)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 text-[11px] text-slate-300">
        <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
          <div className="uppercase tracking-wide text-gray-500">Defender remaining (end)</div>
          <div className="font-semibold text-white mt-1">{formatTroopCounts(series[series.length - 1].defenderRemaining)}</div>
        </div>
        <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
          <div className="uppercase tracking-wide text-gray-500">Attacker remaining (end)</div>
          <div className="font-semibold text-white mt-1">{formatTroopCounts(series[series.length - 1].attackerRemaining)}</div>
        </div>
      </div>
      {/* Scrollbar theme (light/dark aware) scoped to casualty chart container */}
      <style jsx global>{`
        .casualty-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.5) rgba(15, 23, 42, 0.6);
        }
        .casualty-scroll::-webkit-scrollbar {
          height: 8px;
        }
        .casualty-scroll::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.6);
          border-radius: 9999px;
        }
        .casualty-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg, rgba(148, 163, 184, 0.65), rgba(99, 102, 241, 0.75));
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .casualty-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(90deg, rgba(226, 232, 240, 0.8), rgba(94, 234, 212, 0.85));
        }
        @media (prefers-color-scheme: light) {
          .casualty-scroll {
            scrollbar-color: rgba(100, 116, 139, 0.55) rgba(226, 232, 240, 0.8);
          }
          .casualty-scroll::-webkit-scrollbar-track {
            background: rgba(226, 232, 240, 0.8);
          }
          .casualty-scroll::-webkit-scrollbar-thumb {
            background: linear-gradient(90deg, rgba(100, 116, 139, 0.7), rgba(59, 130, 246, 0.75));
            border: 1px solid rgba(148, 163, 184, 0.35);
          }
          .casualty-scroll::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(90deg, rgba(79, 70, 229, 0.85), rgba(16, 185, 129, 0.85));
          }
        }
      `}</style>
    </div>
  );
}

function buildCasualtySeries(turns: TurnLog[]) {
  const series: Array<{
    turn: number;
    attackerLosses: number;
    defenderLosses: number;
    attackerLossesByType: CombatTroopCounts;
    defenderLossesByType: CombatTroopCounts;
    attackerRemaining: CombatTroopCounts;
    defenderRemaining: CombatTroopCounts;
    skillAgainstAttacker?: string;
    skillAgainstDefender?: string;
  }> = [];
  let prevAtt = turns[0]?.startAttackerTroops ?? turns[0]?.attackerTroops;
  let prevDef = turns[0]?.startDefenderTroops ?? turns[0]?.defenderTroops;
  turns.forEach((turn) => {
    const startAtt = turn.startAttackerTroops ?? prevAtt ?? turn.attackerTroops;
    const startDef = turn.startDefenderTroops ?? prevDef ?? turn.defenderTroops;
    const endAtt = turn.attackerTroops;
    const endDef = turn.defenderTroops;
    const attackerLossesByType = diffCounts(startAtt, endAtt);
    const defenderLossesByType = diffCounts(startDef, endDef);
    const attackerLosses = Math.max(0, totalCounts(startAtt) - totalCounts(endAtt));
    const defenderLosses = Math.max(0, totalCounts(startDef) - totalCounts(endDef));
    series.push({
      turn: turn.turn,
      attackerLosses,
      defenderLosses,
      attackerLossesByType,
      defenderLossesByType,
      attackerRemaining: endAtt,
      defenderRemaining: endDef,
      skillAgainstAttacker: pickTopSkill(turn, "defender"), // defender's skills hitting attacker
      skillAgainstDefender: pickTopSkill(turn, "attacker") // attacker's skills hitting defender
    });
    prevAtt = endAtt;
    prevDef = endDef;
  });
  return series;
}

function renderTypeLines(
  series: ReturnType<typeof buildCasualtySeries>,
  maxLoss: number,
  toPoint: (value: number, idx: number) => { x: number; y: number },
  side: "attacker" | "defender",
  setHover: (v: {
    side: "attacker" | "defender";
    turn: number;
    losses: number;
    byType: Partial<CombatTroopCounts>;
    topSkill?: string;
    pairedLosses?: number;
    pairedByType?: Partial<CombatTroopCounts>;
    pairedSkill?: string;
  } | null) => void
) {
  const palette =
    side === "defender"
      ? { Infantry: "rgba(248,113,113,0.95)", Lancer: "rgba(248,150,113,0.9)", Marksman: "rgba(248,180,113,0.9)" }
      : { Infantry: "rgba(125,211,252,0.95)", Lancer: "rgba(96,165,250,0.9)", Marksman: "rgba(59,130,246,0.9)" };

  return (["Infantry", "Lancer", "Marksman"] as const).map((type) => {
    const points = series.map((p, idx) => {
      const losses = side === "defender" ? p.defenderLossesByType[type] : p.attackerLossesByType[type];
      const pt = toPoint(losses ?? 0, idx);
      return {
        ...pt,
        turn: p.turn,
        losses,
        byType: side === "defender" ? p.defenderLossesByType : p.attackerLossesByType,
        topSkill: side === "defender" ? p.skillAgainstDefender : p.skillAgainstAttacker,
        pairedLosses: side === "defender" ? p.attackerLosses : p.defenderLosses,
        pairedByType: side === "defender" ? p.attackerLossesByType : p.defenderLossesByType,
        pairedSkill: side === "defender" ? p.skillAgainstAttacker : p.skillAgainstDefender
      };
    });
    const pointsStr = points.map(({ x, y }) => `${x},${y}`).join(" ");
    return (
      <g key={`${side}-${type}`}>
        <polyline fill="none" stroke={(palette as any)[type]} strokeWidth="1.5" points={pointsStr} />
        {points.map((pt, idx) => (
          <circle
            key={`${side}-${type}-${idx}`}
            cx={pt.x}
            cy={pt.y}
            r={3}
            fill={(palette as any)[type]}
            onMouseEnter={() =>
              setHover({
                side,
                turn: pt.turn,
                losses: pt.losses ?? 0,
                byType: pt.byType,
                topSkill: pt.topSkill,
                pairedLosses: pt.pairedLosses,
                pairedByType: pt.pairedByType,
                pairedSkill: pt.pairedSkill
              })
            }
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </g>
    );
  });
}

function totalCounts(counts?: CombatTroopCounts) {
  if (!counts) return 0;
  return (counts.Infantry ?? 0) + (counts.Lancer ?? 0) + (counts.Marksman ?? 0);
}

function diffCounts(before?: CombatTroopCounts, after?: CombatTroopCounts): CombatTroopCounts {
  return {
    Infantry: Math.max(0, (before?.Infantry ?? 0) - (after?.Infantry ?? 0)),
    Lancer: Math.max(0, (before?.Lancer ?? 0) - (after?.Lancer ?? 0)),
    Marksman: Math.max(0, (before?.Marksman ?? 0) - (after?.Marksman ?? 0))
  };
}

function renderByType(
  label: string,
  value: number | undefined,
  side: "attacker" | "defender",
  usePercent: boolean,
  normalizeFn: (value: number | undefined, side: "attacker" | "defender", type: keyof CombatTroopCounts) => number
) {
  if (value === undefined) return null;
  const norm =
    label === "Infantry"
      ? normalizeFn(value, side, "Infantry")
      : label === "Lancer"
        ? normalizeFn(value, side, "Lancer")
        : normalizeFn(value, side, "Marksman");
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="text-emerald-200">
        {usePercent ? `${norm.toFixed(2)}%` : formatBigNumber(value)}
      </span>
    </div>
  );
}

function pickTopSkill(turn: TurnLog, targetSide: "attacker" | "defender") {
  if (!turn.skillImpacts?.length) return undefined;
  const candidates = turn.skillImpacts.filter((s) => s.side === targetSide);
  if (!candidates.length) return undefined;
  const scored = candidates.map((c) => {
    const score = (c.damageModifier ? 3 : 0) + (c.stats?.length ?? 0) * 0.5 + (c.specialStats?.length ?? 0) * 0.5;
    return { score, name: c.heroId ? `${c.heroId} - ${c.name}` : c.name };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.name;
}

function shorten(value?: string, max = 14) {
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function formatNumber(value?: number) {
  if (value === undefined || Number.isNaN(value)) return '—';
  return Number(value).toFixed(3);
}

function formatTroopCounts(counts?: CombatTroopCounts) {
  if (!counts) return '—';
  return `${counts.Infantry ?? 0}/${counts.Lancer ?? 0}/${counts.Marksman ?? 0}`;
}

function OutcomeSummaryCard({
  summary
}: {
  summary: {
    winner: 'player' | 'opponent' | 'stalemate';
    verdict: string;
    reasons: string[];
    actions: string[];
  };
}) {
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
    <div className="card info-card mt-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-400">Outcome summary</div>
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
  );
}

function buildOutcomeSummary({
  player,
  opponent,
  fightResult,
  battleReport,
  playerCapacity,
  opponentCapacity,
  playerMix,
  opponentMix
}: {
  player: BattleSideContext;
  opponent: BattleSideContext;
  fightResult: FightResult;
  battleReport: BattleReport | null;
  playerCapacity?: CapacityReport | null;
  opponentCapacity?: CapacityReport | null;
  playerMix: any;
  opponentMix: any;
}): { winner: 'player' | 'opponent' | 'stalemate'; verdict: string; reasons: string[]; actions: string[] } {
  type Factor = { reason: string; score: number };
  const actions: string[] = [];

  const playerIsAttacker = player.role === 'attacker';
  const rawAttackerWon = fightResult.attackerWon ?? false;
  const rawDefenderWon = fightResult.defenderWon ?? false;
  const winnerFromFlags: 'player' | 'opponent' | 'stalemate' =
    rawAttackerWon ? (playerIsAttacker ? 'player' : 'opponent')
      : rawDefenderWon ? (playerIsAttacker ? 'opponent' : 'player')
        : 'stalemate';

  const playerFinal = playerIsAttacker ? fightResult.attackerRemaining : fightResult.defenderRemaining;
  const opponentFinal = opponentIsAttacker(opponent) ? fightResult.attackerRemaining : fightResult.defenderRemaining;
  const playerInitial = totalTroops(player.fighter?.troopCounts || computeCountsFromMix(applyRallyCap(playerMix, playerCapacity?.rally.total)));
  const opponentInitial = totalTroops(opponent.fighter?.troopCounts || computeCountsFromMix(applyRallyCap(opponentMix, opponentCapacity?.rally.total)));
  const playerSurvivors = totalTroops(playerFinal);
  const opponentSurvivors = totalTroops(opponentFinal);

  const winner: 'player' | 'opponent' | 'stalemate' =
    winnerFromFlags !== 'stalemate'
      ? winnerFromFlags
      : playerSurvivors > opponentSurvivors
        ? 'player'
        : opponentSurvivors > playerSurvivors
          ? 'opponent'
          : 'stalemate';

  const verdict =
    winner === 'player'
      ? 'Player Victory'
      : winner === 'opponent'
        ? 'Opponent Victory'
        : 'Stalemate';

  const factors: Factor[] = [];

  // Capacity edge
  const playerCap = playerCapacity?.rally.total ?? playerInitial;
  const opponentCap = opponentCapacity?.rally.total ?? opponentInitial;
  if (playerCap !== opponentCap) {
    const deltaPct = ((playerCap - opponentCap) / Math.max(playerCap, opponentCap || 1)) * 100;
    factors.push({
      score: Math.abs(deltaPct),
      reason:
        playerCap > opponentCap
          ? `Player marched with a larger rally (+${deltaPct.toFixed(1)}% capacity: ${playerCap.toLocaleString()} vs ${opponentCap.toLocaleString()}).`
          : `Opponent marched with a larger rally (+${(-deltaPct).toFixed(1)}% capacity: ${opponentCap.toLocaleString()} vs ${playerCap.toLocaleString()}).`
    });
    if (winner !== 'player' && playerCap < opponentCap) {
      actions.push('Increase rally capacity (Command Center, Daybreak capacity, pet bonus, city deployment %, chief gear capacity).');
    }
  }

  // Survivors gap
  if (playerSurvivors !== opponentSurvivors) {
    const survivorDelta = playerSurvivors - opponentSurvivors;
    const survivorPct = (survivorDelta / Math.max(playerSurvivors, opponentSurvivors || 1)) * 100;
    factors.push({
      score: Math.abs(survivorPct),
      reason:
        survivorDelta > 0
          ? `Player ended with more survivors (+${survivorPct.toFixed(1)}%: ${playerSurvivors.toLocaleString()} vs ${opponentSurvivors.toLocaleString()}).`
          : `Opponent ended with more survivors (+${(-survivorPct).toFixed(1)}%: ${opponentSurvivors.toLocaleString()} vs ${playerSurvivors.toLocaleString()}).`
    });
    if (winner !== 'player' && survivorDelta < 0) {
      actions.push('Reduce losses: boost HP/DEF (skins, chief gear, pets), or bring more capacity to dilute losses.');
    }
  }

  // Kills / losses edge
  const playerTotalLosses = sumFightCasualties(fightResult.rounds, playerIsAttacker);
  const opponentTotalLosses = sumFightCasualties(fightResult.rounds, !playerIsAttacker);
  if (playerTotalLosses !== opponentTotalLosses) {
    const lossDelta = opponentTotalLosses - playerTotalLosses; // positive means player lost fewer
    const lossPct = (lossDelta / Math.max(playerTotalLosses, opponentTotalLosses || 1)) * 100;
    factors.push({
      score: Math.abs(lossPct),
      reason:
        lossDelta > 0
          ? `Player inflicted more net kills (lost ${playerTotalLosses.toLocaleString()} vs ${opponentTotalLosses.toLocaleString()}).`
          : `Opponent inflicted more net kills (lost ${opponentTotalLosses.toLocaleString()} vs ${playerTotalLosses.toLocaleString()}).`
    });
    if (winner !== 'player' && lossDelta < 0) {
      actions.push('Increase damage: raise ATK/LETH (hero lead, chief gear, skins, pet refinement, war academy, city buffs).');
    }
  }

  // Per-type casualty driver (from BattleReport if available)
  if (battleReport) {
    const { playerCasualtiesByType, opponentCasualtiesByType } = computeCasualtiesByType(battleReport, playerIsAttacker);
    const playerMaxType = maxType(playerCasualtiesByType);
    const opponentMaxType = maxType(opponentCasualtiesByType);
    if (playerMaxType) {
      const pct = pctShare(playerCasualtiesByType[playerMaxType], playerCasualtiesByType);
      factors.push({
        score: pct,
        reason: `Player losses were highest in ${playerMaxType} (${playerCasualtiesByType[playerMaxType].toLocaleString()} lost, ${pct.toFixed(1)}% of player losses).`
      });
      if (winner !== 'player') {
        actions.push(`Bolster ${playerMaxType}: prioritize HP/DEF (skins, chief gear, pets) and consider shifting mix away from ${playerMaxType}.`);
      }
    }
    if (opponentMaxType) {
      const pct = pctShare(opponentCasualtiesByType[opponentMaxType], opponentCasualtiesByType);
      factors.push({
        score: pct,
        reason: `Opponent losses were concentrated in ${opponentMaxType} (${opponentCasualtiesByType[opponentMaxType].toLocaleString()} lost, ${pct.toFixed(1)}% of opponent losses).`
      });
      if (winner !== 'player') {
        actions.push(`Target ${opponentMaxType}: lean on the counter troop type by +5–10% and ensure matching attack/lethality buffs.`);
      }
    }

    // Top skill impact evidence
    const topPlayerSkill = topSkillHit(battleReport, playerIsAttacker ? 'attacker' : 'defender');
    const topOpponentSkill = topSkillHit(battleReport, playerIsAttacker ? 'defender' : 'attacker');
    if (topOpponentSkill) {
      factors.push({
        score: 6,
        reason: `Enemy skill impact: ${topOpponentSkill.name} hit ${topOpponentSkill.count}x; likely driving incoming multipliers.`
      });
      if (winner !== 'player') {
        actions.push(`Mitigate ${topOpponentSkill.name}: raise HP/DEF on counter troop, stack damage reduction, or adjust mix to reduce exposure.`);
      }
    }
    if (topPlayerSkill && winner !== 'player') {
      actions.push(`Capitalize on ${topPlayerSkill.name}: ensure it triggers (chance/turn skills) and pair with troop-type buffs for that source.`);
    }

    // RNG note if many misses
    const rngNote = skillRngNote(battleReport, playerIsAttacker);
    if (rngNote) {
      factors.push({ score: 3, reason: rngNote });
    }
  }

  // Stat edge
  const avgStatsPlayer = averageStats(player.stats);
  const avgStatsOpponent = averageStats(opponent.stats);
  if (avgStatsPlayer && avgStatsOpponent) {
    const attackDelta = avgStatsPlayer.attack - avgStatsOpponent.attack;
    const defenseDelta = avgStatsPlayer.defense - avgStatsOpponent.defense;
    const lethalityDelta = avgStatsPlayer.lethality - avgStatsOpponent.lethality;
    const healthDelta = avgStatsPlayer.health - avgStatsOpponent.health;
    const statEdgeThreshold = 3;
    const pushStat = (label: string, delta: number) => {
      if (Math.abs(delta) > statEdgeThreshold) {
        factors.push({
          score: Math.abs(delta),
          reason: delta > 0
            ? `Player had higher ${label} (+${delta.toFixed(1)}%).`
            : `Opponent had higher ${label} (+${(-delta).toFixed(1)}%).`
        });
        if (winner !== 'player' && delta < 0) {
          if (label === 'attack' || label === 'lethality') {
            actions.push(`Raise ${label}: hero (leader), chief gear, skins, pet refinement, VIP, war academy, city bonuses.`);
          } else if (label === 'defense' || label === 'health') {
            actions.push(`Raise ${label}: skins, chief gear, daybreak, pet refinement, VIP, alliance facilities.`);
          }
        }
      }
    };
    pushStat('attack', attackDelta);
    pushStat('defense', defenseDelta);
    pushStat('lethality', lethalityDelta);
    pushStat('health', healthDelta);
  }

  // Mix skew
  const mixNote = describeMixSkew(playerMix, opponentMix, winner);
  if (mixNote) {
    factors.push({ score: 4, reason: mixNote });
    if (winner !== 'player') {
      const counterSuggestion = computeCounterMixRecommendation(playerMix, opponentMix);
      if (counterSuggestion) {
        actions.push(counterSuggestion);
      }
    }
  }

  // Hero/Joiner readiness
  if (winner !== 'player') {
    const missingLeader = !player.leaders?.infantry || !player.leaders?.lancer || !player.leaders?.marksman;
    if (missingLeader) {
      actions.push('Assign rally leaders for each troop type to unlock leader stats.');
    }
    if (!player.joiners || player.joiners.length === 0) {
      actions.push('Add up to 4 rally joiners with expedition buffs for multiplicative gains.');
    }
  }

  // Targeted mix counter suggestion
  if (winner !== 'player') {
    const oppRatios = {
      infantry: opponentMix.infantryRatio ?? DEFAULT_TROOP_MIX.infantryRatio,
      lancer: opponentMix.lancerRatio ?? DEFAULT_TROOP_MIX.lancerRatio,
      marksman: opponentMix.marksmanRatio ?? DEFAULT_TROOP_MIX.marksmanRatio,
    };
    const maxOpp = Object.entries(oppRatios).sort((a, b) => b[1] - a[1])[0][0] as keyof typeof oppRatios;
    const counter = maxOpp === 'infantry' ? 'marksman' : maxOpp === 'marksman' ? 'lancer' : 'infantry';
    actions.push(`Increase ${counter} ratio by ~5–10% to counter opponent's heavier ${maxOpp}.`);
  }

  // Sort by score desc and keep top 4 to keep it concise
  const reasons = factors
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((f) => f.reason);

  if (!reasons.length) {
    reasons.push('Outcome driven by combined stats, skills, and morale over the simulated rounds.');
  }

  const dedupedActions = Array.from(new Set(actions)).slice(0, 4);

  return { winner, verdict, reasons, actions: dedupedActions };
}

function opponentIsAttacker(side: BattleSideContext) {
  return side.role === 'attacker';
}

function sumFightCasualties(rounds: FightResult['rounds'], forAttacker: boolean): number {
  return rounds.reduce((sum, round) => {
    const c = forAttacker ? round.attackerCasualties : round.defenderCasualties;
    return sum + sumCasualties(c);
  }, 0);
}

function computeCasualtiesByType(report: BattleReport, playerIsAttacker: boolean) {
  const normalize = (c: Partial<CombatTroopCounts> | undefined | null): CombatTroopCounts => ({
    Infantry: c?.Infantry ?? (c as any)?.infantry ?? 0,
    Lancer: c?.Lancer ?? (c as any)?.lancer ?? 0,
    Marksman: c?.Marksman ?? (c as any)?.marksman ?? 0
  });

  const initialAtt = normalize(report.turns[0]?.startAttackerTroops ?? report.attacker.troops);
  const initialDef = normalize(report.turns[0]?.startDefenderTroops ?? report.defender.troops);
  const finalAtt = normalize(report.attackerRemaining);
  const finalDef = normalize(report.defenderRemaining);

  const diff = (start: CombatTroopCounts, end: CombatTroopCounts): CombatTroopCounts => ({
    Infantry: Math.max(0, start.Infantry - end.Infantry),
    Lancer: Math.max(0, start.Lancer - end.Lancer),
    Marksman: Math.max(0, start.Marksman - end.Marksman)
  });

  const attackerLosses = diff(initialAtt, finalAtt);
  const defenderLosses = diff(initialDef, finalDef);

  const playerCasualtiesByType = playerIsAttacker ? attackerLosses : defenderLosses;
  const opponentCasualtiesByType = playerIsAttacker ? defenderLosses : attackerLosses;

  return { playerCasualtiesByType, opponentCasualtiesByType };
}

function maxType(losses: CombatTroopCounts): keyof CombatTroopCounts | null {
  const entries: Array<[keyof CombatTroopCounts, number]> = [
    ['Infantry', losses.Infantry],
    ['Lancer', losses.Lancer],
    ['Marksman', losses.Marksman]
  ];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  return sorted[0][1] > 0 ? sorted[0][0] : null;
}

function pctShare(value: number, totals: CombatTroopCounts) {
  const total = totals.Infantry + totals.Lancer + totals.Marksman;
  if (total === 0) return 0;
  return (value / total) * 100;
}

function topSkillHit(report: BattleReport, side: 'attacker' | 'defender'): { count: number; name: string } | null {
  const counts = new Map<string, { count: number; name: string }>();
  report.turns.forEach((t) => {
    t.skillImpacts
      ?.filter((s) => s.side === side && s.succeeded !== false)
      .forEach((s) => {
        const key = `${s.heroId ?? '__'}:${s.name}`;
        const current = counts.get(key)?.count ?? 0;
        counts.set(key, { count: current + 1, name: s.heroId ? `${s.heroId} - ${s.name}` : s.name });
      });
  });
  let best: { count: number; name: string } | null = null;
  counts.forEach((v) => {
    if (!best || v.count > best.count) best = v;
  });
  return best;
}

function skillRngNote(report: BattleReport, playerIsAttacker: boolean) {
  const rolls = report.turns.flatMap((t) => t.skillRolls ?? []);
  if (!rolls.length) return '';
  const playerSide: 'attacker' | 'defender' = playerIsAttacker ? 'attacker' : 'defender';
  const oppSide: 'attacker' | 'defender' = playerIsAttacker ? 'defender' : 'attacker';
  const playerMisses = rolls.filter((r) => r.side === playerSide && r.succeeded === false).length;
  const playerTotal = rolls.filter((r) => r.side === playerSide).length;
  const oppHits = rolls.filter((r) => r.side === oppSide && r.succeeded).length;
  const oppTotal = rolls.filter((r) => r.side === oppSide).length;
  const missRate = playerTotal ? playerMisses / playerTotal : 0;
  const oppHitRate = oppTotal ? oppHits / oppTotal : 0;
  if (missRate > 0.35) {
    return `Player chance skills missed often this run (miss rate ${(missRate * 100).toFixed(0)}%).`;
  }
  if (oppHitRate > 0.7) {
    return `Enemy chance skills landed frequently this run (hit rate ${(oppHitRate * 100).toFixed(0)}%).`;
  }
  return '';
}

function averageStats(stats: SideBaseStats | null): SideBaseStats[keyof SideBaseStats] | null {
  if (!stats) return null;
  const keys = Object.keys(stats) as (keyof SideBaseStats)[];
  if (!keys.length) return null;
  const agg = keys.reduce(
    (acc, key) => {
      acc.attack += stats[key].attack;
      acc.defense += stats[key].defense;
      acc.lethality += stats[key].lethality;
      acc.health += stats[key].health;
      return acc;
    },
    { attack: 0, defense: 0, lethality: 0, health: 0 }
  );
  const count = keys.length;
  return {
    attack: agg.attack / count,
    defense: agg.defense / count,
    lethality: agg.lethality / count,
    health: agg.health / count
  };
}

function describeMixSkew(playerMix: any, opponentMix: any, winner: 'player' | 'opponent' | 'stalemate') {
  const toSkew = (mix: any) => {
    const total = Math.max(1, mix.totalTroops || 0);
    return {
      infantry: (mix.infantryRatio ?? 0),
      lancer: (mix.lancerRatio ?? 0),
      marksman: (mix.marksmanRatio ?? 0)
    };
  };
  const p = toSkew(playerMix);
  const o = toSkew(opponentMix);
  const diffM = p.marksman - o.marksman;
  const diffL = p.lancer - o.lancer;
  const diffI = p.infantry - o.infantry;
  const major = 8;
  if (Math.abs(diffM) > major) {
    return diffM > 0
      ? `Player leaned marksman more (+${diffM.toFixed(1)}%); advantageous vs infantry-heavy opponents.`
      : `Opponent leaned marksman more (+${(-diffM).toFixed(1)}%); advantageous vs infantry-heavy opponents.`;
  }
  if (Math.abs(diffL) > major) {
    return diffL > 0
      ? `Player leaned lancer more (+${diffL.toFixed(1)}%); stronger into marksman.`
      : `Opponent leaned lancer more (+${(-diffL).toFixed(1)}%); stronger into marksman.`;
  }
  if (Math.abs(diffI) > major) {
    return diffI > 0
      ? `Player leaned infantry more (+${diffI.toFixed(1)}%).`
      : `Opponent leaned infantry more (+${(-diffI).toFixed(1)}%).`;
  }
  return null;
}

function computeCounterMixRecommendation(playerMix: any, opponentMix: any): string | null {
  const current = {
    infantry: playerMix.infantryRatio ?? DEFAULT_TROOP_MIX.infantryRatio,
    lancer: playerMix.lancerRatio ?? DEFAULT_TROOP_MIX.lancerRatio,
    marksman: playerMix.marksmanRatio ?? DEFAULT_TROOP_MIX.marksmanRatio,
  };
  const opp = {
    infantry: opponentMix.infantryRatio ?? DEFAULT_TROOP_MIX.infantryRatio,
    lancer: opponentMix.lancerRatio ?? DEFAULT_TROOP_MIX.lancerRatio,
    marksman: opponentMix.marksmanRatio ?? DEFAULT_TROOP_MIX.marksmanRatio,
  };

  const oppHeaviest = (Object.entries(opp) as Array<[keyof typeof opp, number]>).sort((a, b) => b[1] - a[1])[0][0];
  const counter: keyof typeof current =
    oppHeaviest === 'infantry' ? 'marksman' :
      oppHeaviest === 'marksman' ? 'lancer' : 'infantry';

  const shift = 10; // percent points to move toward counter
  const others = (['infantry', 'lancer', 'marksman'] as const).filter((t) => t !== counter);
  const available = others.reduce((sum, t) => sum + current[t], 0);
  if (available <= 0.5) return null;

  const actualShift = Math.min(shift, Math.max(2, available - 1)); // keep something on others
  let next = { ...current };
  next[counter] = Math.min(100, next[counter] + actualShift);
  const reductionTotal = actualShift;
  const otherSum = others.reduce((sum, t) => sum + next[t], 0);
  if (otherSum > 0) {
    others.forEach((t) => {
      const reduction = reductionTotal * (next[t] / otherSum);
      next[t] = Math.max(0, next[t] - reduction);
    });
  }
  // normalize to 100
  const normSum = next.infantry + next.lancer + next.marksman || 1;
  next = {
    infantry: Math.round((next.infantry / normSum) * 100),
    lancer: Math.round((next.lancer / normSum) * 100),
    marksman: Math.round((next.marksman / normSum) * 100),
  };

  return `Shift mix to INF ${next.infantry}% / LNC ${next.lancer}% / MRK ${next.marksman}% to counter opponent's ${oppHeaviest}-heavy march (boost ${counter} ~${actualShift.toFixed(1)} pts).`;
}

function RoundDetailColumn({
  title,
  logs,
  skills,
  skillActivations,
  casualties,
}: {
  title: string;
  logs: DamageDebug[];
  skills: NormalizedSkillEffect[];
  skillActivations: ReturnType<typeof collectSkillActivations>;
  casualties: RoundResult['attackerCasualties'];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs uppercase tracking-wide text-gray-400">{title}</div>
      <div className="text-[11px] text-gray-500">
        Losses this round: {formatCasualtyLine(casualties)}
      </div>
      <DamageLogCard entries={logs} />
      <SkillTriggerList effects={skills} activations={{ ...skillActivations, impacts: [] }} />
    </div>
  );
}

function RoundRemaining({ label, counts }: { label: string; counts: MixTroopCounts }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-sm text-white">
        INF {counts.infantry.toLocaleString()} · LNC {counts.lancer.toLocaleString()} · MRK {counts.marksman.toLocaleString()}
      </div>
    </div>
  );
}

function DamageLogCard({ entries }: { entries: DamageDebug[] }) {
  const preview = entries.slice(0, 5);
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3 flex flex-col gap-3">
      <div className="text-sm font-semibold text-slate-100">Damage Steps</div>
      {!preview.length ? (
        <div className="text-xs text-gray-500 dark:text-gray-400">No attacks logged for this round.</div>
      ) : (
        preview.map((entry, index) => (
          <DamageEntry key={`${entry.attackerType}-${entry.defenderType}-${index}`} entry={entry} />
        ))
      )}
      {entries.length > preview.length && (
        <div className="text-[11px] text-gray-500 dark:text-gray-400">
          +{entries.length - preview.length} additional hits recorded
        </div>
      )}
    </div>
  );
}

function SkillTriggerList({
  effects,
  activations
}: {
  effects: NormalizedSkillEffect[];
  activations: {
    hero: Array<{ name: string; heroId?: string; count: number }>;
    troop: Array<{ name: string; count: number }>;
    impacts: Array<{
      name: string;
      heroId?: string;
      stats?: string[];
      specialStats?: string[];
      damageModifier?: boolean;
      target?: string;
      trigger?: string;
      sourceType?: 'Hero' | 'Troop' | 'hero' | 'troop';
      succeeded?: boolean;
    }>;
  };
}) {
  const { heroEffects, troopEffects } = splitSkillEffects(effects);
  const totalHero = activations.hero.reduce((s, a) => s + a.count, 0);
  const totalTroop = activations.troop.reduce((s, a) => s + a.count, 0);
  const impactMap = new Map<string, { stats?: string[]; specialStats?: string[]; damageModifier?: boolean; target?: string }>();
  activations.impacts.forEach((imp) => {
    const key = `${imp.heroId ?? '__troop'}:${imp.name}`;
    impactMap.set(key, {
      stats: imp.stats,
      specialStats: imp.specialStats,
      damageModifier: imp.damageModifier,
      target: imp.target
    });
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3 flex flex-col gap-3">
      <div className="text-sm font-semibold text-slate-100">Skill Triggers</div>
      <SkillActivationSection
        label="Hero & Weapon Skills"
        activations={activations.hero}
        total={totalHero}
        emptyLabel="No hero/weapon skills triggered this round."
        impactMap={impactMap}
      />
      <SkillActivationSection
        label="Troop Passives"
        activations={activations.troop}
        total={totalTroop}
        emptyLabel="No troop skills triggered this round."
        impactMap={impactMap}
      />
      <SkillEffectSection label="Hero & Weapon Effects (summary)" items={heroEffects} />
      <SkillEffectSection label="Troop Passive Effects (summary)" items={troopEffects} />
    </div>
  );
}

function collectSkillActivations(turnLog: TurnLog | undefined, role: 'attacker' | 'defender'): {
  hero: Array<{ name: string; heroId?: string; count: number; trigger?: string; sourceType?: 'hero' | 'troop'; target?: string; succeeded?: boolean }>;
  troop: Array<{ name: string; count: number; trigger?: string; sourceType?: 'hero' | 'troop'; target?: string; succeeded?: boolean }>;
  impacts: Array<{
    name: string;
    heroId?: string;
    stats?: string[];
    specialStats?: string[];
    damageModifier?: boolean;
    target?: string;
    trigger?: string;
    sourceType?: 'hero' | 'troop';
    succeeded?: boolean;
  }>;
} {
  if (!turnLog) return { hero: [], troop: [], impacts: [] };
  const heroCounts = new Map<string, { name: string; heroId?: string; count: number; trigger?: string; sourceType?: 'hero' | 'troop'; target?: string }>();
  const troopCounts = new Map<string, { name: string; count: number; trigger?: string; sourceType?: 'hero' | 'troop'; target?: string }>();
  const impacts: Array<{ name: string; heroId?: string; stats?: string[]; specialStats?: string[]; damageModifier?: boolean; target?: string; trigger?: string; sourceType?: 'hero' | 'troop'; succeeded?: boolean }> = [];
  const rolls: Array<{ name: string; heroId?: string; trigger?: string; succeeded?: boolean }> =
    turnLog.skillRolls?.filter((r) => r.side === role) ?? [];

  // Create lookup maps for trigger and sourceType from skillRolls
  const triggerMap = new Map<string, string>();
  const sourceTypeMap = new Map<string, 'hero' | 'troop'>();
  rolls.forEach((r) => {
    const key = `${r.heroId ?? '__troop'}:${r.name}`;
    if (r.trigger && !triggerMap.has(key)) {
      triggerMap.set(key, r.trigger);
    }
  });
  turnLog.skillRolls?.filter((r) => r.side === role).forEach((r) => {
    const key = `${r.heroId ?? '__troop'}:${r.name}`;
    if (r.sourceType && !sourceTypeMap.has(key)) {
      sourceTypeMap.set(key, r.sourceType);
    }
  });

  // Prefer explicit skill activation log
  if (turnLog.skillsActivated && turnLog.skillsActivated.length) {
    turnLog.skillsActivated
      .filter((entry) => entry.side === role)
      .forEach((entry) => {
        const isHero = Boolean(entry.heroId);
        const key = `${entry.heroId ?? '__troop'}:${entry.name}`;
        const trigger = triggerMap.get(key);
        const triggerKey = (trigger ?? '').toLowerCase();
        const passive = triggerKey.includes('passive') || entry.isActive;
        if (isHero) {
          const existing = heroCounts.get(key);
          heroCounts.set(key, {
            name: entry.name,
            heroId: entry.heroId,
            count: passive ? 1 : (existing?.count ?? 0) + 1,
            trigger: trigger,
            sourceType: 'hero',
            target: undefined
          });
        } else {
          const existing = troopCounts.get(entry.name);
          troopCounts.set(entry.name, {
            name: entry.name,
            count: passive ? 1 : (existing?.count ?? 0) + 1,
            trigger: trigger,
            sourceType: 'troop',
            target: undefined
          });
        }
      });
    // impacts for this role
    if (turnLog.skillImpacts && turnLog.skillImpacts.length) {
      turnLog.skillImpacts
        .filter((entry) => entry.side === role)
        .forEach((entry) => {
          const key = `${entry.heroId ?? '__troop'}:${entry.name}`;
          impacts.push({
            name: entry.name,
            heroId: entry.heroId,
            stats: entry.stats,
            specialStats: entry.specialStats,
            damageModifier: entry.damageModifier,
            target: undefined, // skillImpacts doesn't have target property
            trigger: entry.trigger ?? triggerMap.get(key),
            sourceType: (sourceTypeMap.get(key) ?? (entry.heroId ? 'hero' : 'troop')) as 'hero' | 'troop',
            succeeded: entry.succeeded
          });
        });
    }
  } else {
    // Fallback: derive from actions if available
    const relevantActions = turnLog.actions.filter((a) => a.side === role);
    const skillActions = relevantActions.filter((a) => a.skillName || a.skillId);
    skillActions.forEach((action) => {
      const name = action.skillName || action.skillId || 'Skill';
      const existing = troopCounts.get(name);
      troopCounts.set(name, { name, count: (existing?.count ?? 0) + 1 });
    });
  }

  const impactLookup = new Map<string, { trigger?: string; sourceType?: 'hero' | 'troop'; target?: string }>();
  impacts.forEach((i) => {
    const key = `${i.heroId ?? '__troop'}:${i.name}`;
    impactLookup.set(key, { trigger: i.trigger, sourceType: i.sourceType, target: i.target });
  });

  const toArrHero = (m: Map<string, { name: string; heroId?: string; count: number; trigger?: string; sourceType?: 'hero' | 'troop'; target?: string }>) =>
    Array.from(m.values()).map((v) => {
      const meta = impactLookup.get(`${v.heroId ?? '__troop'}:${v.name}`);
      return { ...v, trigger: v.trigger ?? meta?.trigger, sourceType: v.sourceType ?? meta?.sourceType, target: v.target ?? meta?.target };
    });
  const toArrTroop = (m: Map<string, { name: string; count: number; trigger?: string; sourceType?: 'hero' | 'troop'; target?: string }>) =>
    Array.from(m.values()).map((v) => {
      const meta = impactLookup.get(`__troop:${v.name}`);
      return { ...v, trigger: v.trigger ?? meta?.trigger, sourceType: v.sourceType ?? meta?.sourceType, target: v.target ?? meta?.target };
    });

  return { hero: toArrHero(heroCounts), troop: toArrTroop(troopCounts), impacts };
}

function SkillEffectSection({
  label,
  items,
}: {
  label: string;
  items: Array<{ label: string; value: number }>;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      {items.length === 0 ? (
        <div className="text-xs text-gray-500">No effects recorded for this round.</div>
      ) : (
        <ul className="text-xs text-gray-300 mt-1 space-y-1">
          {items.map((item) => (
            <li key={item.label} className="flex justify-between gap-2">
              <span>{item.label}</span>
              <span className="text-emerald-300 font-semibold">{formatEffectValue(item.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SkillActivationSection({
  label,
  activations,
  total,
  emptyLabel,
  impactMap
}: {
  label: string;
  activations: Array<{ name: string; heroId?: string; count: number; trigger?: string; sourceType?: 'hero' | 'troop'; target?: string }>;
  total: number;
  emptyLabel: string;
  impactMap: Map<string, { stats?: string[]; specialStats?: string[]; damageModifier?: boolean; target?: string }>;
}) {
  const buckets: Record<string, { label: string; items: typeof activations }> = {};
  activations.forEach((item) => {
    const key = `${item.heroId ?? '__troop'}:${item.name}`;
    const impact = impactMap.get(key);
    const isPassive = item.trigger === 'PassivePermanent';
    const sourceType = item.sourceType === 'hero' ? 'Hero' : 'Troop';
    const passiveLabel = `${sourceType} Passive`;
    const activeLabel = `${sourceType} Turn-based`;
    const bucketLabel = isPassive ? passiveLabel : activeLabel;
    if (!buckets[bucketLabel]) buckets[bucketLabel] = { label: bucketLabel, items: [] as any };
    buckets[bucketLabel].items.push({ ...item, target: impact?.target ?? item.target });
  });

  const orderedLabels = ['Hero Passive', 'Hero Turn-based', 'Troop Passive', 'Troop Turn-based'];

  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      {activations.length === 0 ? (
        <div className="text-xs text-gray-500">{emptyLabel}</div>
      ) : (
        <div className="mt-1 space-y-3">
          {orderedLabels
            .filter((lbl) => buckets[lbl])
            .map((lbl) => buckets[lbl])
            .map((bucket) => {
              const byTarget = new Map<string, typeof bucket.items>();
              bucket.items.forEach((item) => {
                const target = item.target ?? 'General';
                if (!byTarget.has(target)) byTarget.set(target, [] as any);
                byTarget.get(target)!.push(item);
              });
              return (
                <div key={bucket.label} className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/30">
                  <div className="flex justify-between items-center px-3 py-2 border-b border-white/5 text-[11px] uppercase tracking-wide text-slate-400">
                    <span>{bucket.label}</span>
                    <span className="text-slate-500">Count</span>
                  </div>
                  <div className="divide-y divide-white/5 text-xs text-gray-300">
                    {Array.from(byTarget.entries()).map(([target, items]) => (
                      <div key={target}>
                        <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-slate-500 border-b border-white/5">
                          Target: {target}
                        </div>
                        {items.map((item) => {
                          const key = `${item.heroId ?? '__troop'}:${item.name}`;
                          const impact = impactMap.get(key);
                          const parts: string[] = [];
                          if (impact?.stats?.length) parts.push(`Stats: ${impact.stats.join(', ')}`);
                          if (impact?.specialStats?.length) parts.push(`Special: ${impact.specialStats.join(', ')}`);
                          if (impact?.damageModifier) parts.push('Damage mod');
                          const displayName = item.heroId ? `${item.heroId} - ${item.name}` : item.name;
                          return (
                            <div key={key} className="grid grid-cols-[1.3fr,1fr,0.5fr] items-start px-3 py-2 gap-2">
                              <span className="font-semibold text-slate-100">{displayName}</span>
                              <span className="text-[11px] text-slate-400">
                                {parts.length > 0 ? parts.join(' · ') : '—'}
                              </span>
                              <span className="text-emerald-300 font-semibold text-right">
                                {item.count}
                                <span className="text-[11px] text-slate-500 ml-1">
                                  ({((item.count / Math.max(1, total)) * 100).toFixed(0)}%)
                                </span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

function DamageEntry({ entry }: { entry: DamageDebug }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/5 bg-black/20">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 text-left text-xs text-slate-200"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {capitalize(entry.attackerType)} → {capitalize(entry.defenderType)}
          </span>
          <span className="text-[11px] text-slate-400">{open ? 'Hide details' : 'Show details'}</span>
        </div>
        <span className="text-emerald-300 font-semibold">{formatBigNumber(entry.kills)} KIA</span>
      </button>
      {open && (
        <div className="p-3 pt-0 space-y-2">
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
            <DamageChip label="√Troops" value={entry.sqrtTroops.toFixed(1)} />
            <DamageChip label="Hidden" value={formatMultiplier(entry.hiddenFactor)} />
            <DamageChip label="Morale" value={formatMultiplier(entry.moraleMultiplier)} />
            <DamageChip label="Control" value={formatMultiplier(entry.controlMultiplier)} />
            <DamageChip label="DOT" value={formatMultiplier(entry.dotMultiplier)} />
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
            <DamageChip label="Attack" value={formatMultiplier(entry.attackMultiplier)} />
            <DamageChip label="Lethality" value={formatMultiplier(entry.lethalityMultiplier)} />
            <DamageChip label="Defense" value={formatMultiplier(entry.defenseMultiplier)} />
            <DamageChip label="HP" value={formatMultiplier(entry.healthMultiplier)} />
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
            <DamageChip label="Offense" value={formatPowerValue(entry.offensivePower)} />
            <DamageChip label="Def Power" value={formatPowerValue(entry.defensivePower)} />
            <DamageChip label="Mitigation" value={formatPowerValue(entry.mitigation)} />
          </div>
        </div>
      )}
    </div>
  );
}

function DamageChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 py-1 rounded-md border border-white/5 bg-slate-950/40">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-xs font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function getDamageLogForRole(round: RoundResult, role: 'attacker' | 'defender'): DamageDebug[] {
  return role === 'attacker' ? round.attackerDamageLog : round.defenderDamageLog;
}

function splitSkillEffects(effects: NormalizedSkillEffect[]) {
  const hero = effects.filter((effect) => effect.source !== 'troop-passive');
  const troop = effects.filter((effect) => effect.source === 'troop-passive');
  return {
    heroEffects: collapseEffects(hero),
    troopEffects: collapseEffects(troop)
  };
}

function collapseEffects(effects: NormalizedSkillEffect[]) {
  const map = new Map<string, number>();
  effects.forEach((effect) => {
    const label = `${effect.sourceName} · ${formatEffectStat(effect.stat)}`;
    map.set(label, (map.get(label) ?? 0) + effect.value);
  });
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 5);
}

function formatEffectValue(value: number): string {
  const percent = value * 100;
  if (Math.abs(percent) < 0.01) {
    return '0.00%';
  }
  return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
}

function formatEffectStat(stat: NormalizedSkillEffect['stat']): string {
  switch (stat) {
    case 'attack':
      return 'Attack';
    case 'defense':
      return 'Defense';
    case 'health':
      return 'Health';
    case 'lethality':
      return 'Lethality';
    case 'damage_dealt':
      return 'Damage Dealt';
    case 'damage_taken':
      return 'Damage Taken';
    case 'control_chance':
      return 'Control';
    default:
      return stat?.replace(/_/g, ' ') ?? 'Bonus';
  }
}


function sumCasualties(casualties: RoundResult['attackerCasualties']): number {
  return casualties.infantry + casualties.lancer + casualties.marksman;
}

function formatCasualtyLine(casualties: RoundResult['attackerCasualties']): string {
  return `INF ${casualties.infantry.toLocaleString()} · LNC ${casualties.lancer.toLocaleString()} · MRK ${casualties.marksman.toLocaleString()}`;
}

function formatBigNumber(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(0);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatSignedPercent(value: number): string {
  if (value === 0) {
    return '0.0%';
  }
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function formatStatValue(value?: number): string {
  if (value === undefined || Number.isNaN(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatMultiplier(value?: number): string {
  if (value === undefined || Number.isNaN(value)) return '—';
  return `${value.toFixed(2)}×`;
}

function formatPowerValue(value?: number): string {
  if (value === undefined || Number.isNaN(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
}

function capitalize(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function computeCountsFromMix(mix: any): MixTroopCounts {
  const effectiveTotal = Math.max(0, mix.totalTroops || 0);
  const ratios: Record<TroopType, number> = {
    infantry: mix.infantryRatio ?? DEFAULT_TROOP_MIX.infantryRatio,
    lancer: mix.lancerRatio ?? DEFAULT_TROOP_MIX.lancerRatio,
    marksman: mix.marksmanRatio ?? DEFAULT_TROOP_MIX.marksmanRatio,
  };
  const ratioSum = ratios.infantry + ratios.lancer + ratios.marksman || 1;
  const normalized = {
    infantry: ratios.infantry / ratioSum,
    lancer: ratios.lancer / ratioSum,
    marksman: ratios.marksman / ratioSum,
  };
  return {
    infantry: Math.round(effectiveTotal * normalized.infantry),
    lancer: Math.round(effectiveTotal * normalized.lancer),
    marksman: Math.round(effectiveTotal * normalized.marksman),
  };
}

function countsToMix(counts: MixTroopCounts): any {
  const total = totalTroops(counts);
  if (total === 0) {
    return { ...DEFAULT_TROOP_MIX, totalTroops: 0 };
  }
  return {
    totalTroops: total,
    infantryRatio: Number(((counts.infantry / total) * 100).toFixed(2)),
    lancerRatio: Number(((counts.lancer / total) * 100).toFixed(2)),
    marksmanRatio: Number(((counts.marksman / total) * 100).toFixed(2)),
  };
}

