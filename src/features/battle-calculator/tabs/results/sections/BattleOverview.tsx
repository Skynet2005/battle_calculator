/**
 * Battle Overview Section
 *
 * Displays side-by-side comparison of player and opponent battle statistics,
 * including initial troops, losses, survivors, and final verdict.
 */

import type { TroopMixConfig } from '@/shared/types';
import type { FightResult } from '@/domain/rally/combat-fight';
import { totalTroops } from '@/domain/rally/combat-fighter';
import type { SideBaseStats } from '@/domain/rally/combat-types';
import { computeCountsFromMix, normalizeRatios } from '@/domain/rally/mix-utils';
import { DEFAULT_TROOP_MIX } from '@/domain/rally/rally-config';
import { applyRallyCap } from '@/features/battle-calculator/utils/rally-mix';
import { resolveOutcome, type SideBattleStats } from '@/features/battle-calculator/utils/rally-outcome';
import type { BattleSideContext, CapacityReport, MixTroopCounts } from '@/features/battle-calculator/model/types';
import { FinalStatsMatrix } from './FinalStatsMatrix';
import { SidePanel } from './SidePanel';

interface BattleOverviewProps {
  player: BattleSideContext;
  opponent: BattleSideContext;
  fightResult: FightResult;
  playerMix: TroopMixConfig;
  opponentMix: TroopMixConfig;
  playerCapacity?: CapacityReport | null;
  opponentCapacity?: CapacityReport | null;
}

export function BattleOverview({
  player,
  opponent,
  fightResult,
  playerMix,
  opponentMix,
  playerCapacity,
  opponentCapacity
}: BattleOverviewProps) {
  const fallbackPlayerCounts = computeCountsFromMix(normalizeRatios(applyRallyCap(playerMix, playerCapacity?.rally.total), DEFAULT_TROOP_MIX));
  const fallbackOpponentCounts = computeCountsFromMix(normalizeRatios(applyRallyCap(opponentMix, opponentCapacity?.rally.total), DEFAULT_TROOP_MIX));

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
  const { winner } = resolveOutcome(player.role, fightResult);

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
      <FinalStatsMatrix
        playerStats={player.stats as SideBaseStats | null}
        opponentStats={opponent.stats as SideBaseStats | null}
      />
    </div>
  );
}
