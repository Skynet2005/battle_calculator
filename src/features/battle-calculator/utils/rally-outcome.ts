import type { RoundResult } from '@/domain/rally/combat-battle-round';
import type { FightResult } from '@/domain/rally/combat-fight';
import { totalTroops } from '@/domain/rally/combat-fighter';
import type { BattleSideContext } from '../model/types';

export interface SideBattleStats {
  initial: number;
  losses: number;
  survivors: number;
}

/**
 * Unified winner resolution helper.
 * Resolves the battle outcome consistently across all components.
 */
export function resolveOutcome(
  playerRole: 'attacker' | 'defender',
  fightResult: FightResult
): { winner: 'player' | 'opponent' | 'stalemate'; label: string } {
  const playerIsAttacker = playerRole === 'attacker';
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

  // If flags are unset, fall back to survivor comparison
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
        ? 'Player wins'
        : 'Opponent wins';

  return { winner, label };
}

export function buildSideBattleStats(
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

export function sumFightCasualties(rounds: FightResult['rounds'], forAttacker: boolean): number {
  return rounds.reduce((sum, round) => {
    const c = forAttacker ? round.attackerCasualties : round.defenderCasualties;
    return sum + sumCasualties(c);
  }, 0);
}

export function opponentIsAttacker(side: BattleSideContext): boolean {
  return side.role === 'attacker';
}

export function sumCasualties(casualties: RoundResult['attackerCasualties']): number {
  return casualties.infantry + casualties.lancer + casualties.marksman;
}
