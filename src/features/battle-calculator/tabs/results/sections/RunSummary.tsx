/**
 * Run Summary Section
 *
 * Displays battle outcome, duration, and impact multipliers from the simulation.
 */

import { SectionCard, StatTile } from '@/shared/ui';
import type { FightResult } from '@/domain/rally/combat-fight';
import { resolveOutcome } from '@/features/battle-calculator/utils/rally-outcome';
import type { BattleSideContext } from '@/features/battle-calculator/model/types';

interface RunSummaryProps {
  player: BattleSideContext;
  opponent: BattleSideContext;
  fightResult: FightResult;
}

export function RunSummary({ player, opponent, fightResult }: RunSummaryProps) {
  const { winner, label: winnerLabel } = resolveOutcome(player.role, fightResult);
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
