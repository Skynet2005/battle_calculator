/**
 * Forces Section - Secondary Tier
 *
 * Combines Capacity + Troop Power into one compact section.
 * Uses CompareTable for better scanability.
 */

import { useMemo } from 'react';
import { totalTroops } from '@/domain/rally/combat-fighter';
import { DEFAULT_TROOP_MIX } from '@/domain/rally/rally-config';
import { computeCountsFromMix, normalizeRatios } from '@/domain/rally/mix-utils';
import { applyRallyCap } from '@/features/battle-calculator/utils/rally-mix';
import type { TroopMixConfig } from '@/shared/types';
import { SectionCard } from '@/shared/ui';
import { CompareTable } from '../components/CompareTable';
import type { BattleSideContext, CapacityReport, MixTroopCounts } from '@/features/battle-calculator/model/types';
import { TROOP_TYPES } from '@/features/battle-calculator/model/types';
import { TroopMixQuickEditor } from './TroopMixQuickEditor';

interface ForcesSectionProps {
  player: BattleSideContext;
  opponent: BattleSideContext;
  playerMix: TroopMixConfig;
  opponentMix: TroopMixConfig;
  playerCapacity?: CapacityReport | null;
  opponentCapacity?: CapacityReport | null;
  onMixChange?: (side: 'player' | 'opponent', mix: TroopMixConfig) => void;
}

export function ForcesSection({
  player,
  opponent,
  playerMix,
  opponentMix,
  playerCapacity,
  opponentCapacity,
  onMixChange
}: ForcesSectionProps) {
  const capacityRows = useMemo(() => {
    const rows = [];
    if (playerCapacity || opponentCapacity) {
      rows.push({
        label: 'Rally Capacity',
        playerValue: playerCapacity?.rally.total ?? 0,
        opponentValue: opponentCapacity?.rally.total ?? 0,
        format: 'number' as const,
        group: 'Capacity'
      });
      rows.push({
        label: 'Deployment Capacity',
        playerValue: playerCapacity?.deployment.total ?? 0,
        opponentValue: opponentCapacity?.deployment.total ?? 0,
        format: 'number' as const,
        group: 'Capacity'
      });
    }
    return rows;
  }, [playerCapacity, opponentCapacity]);

  const effectivePlayerMix = useMemo(
    () => applyRallyCap(playerMix, playerCapacity?.rally.total),
    [playerMix, playerCapacity?.rally.total]
  );
  const effectiveOpponentMix = useMemo(
    () => applyRallyCap(opponentMix, opponentCapacity?.rally.total),
    [opponentMix, opponentCapacity?.rally.total]
  );

  const playerCounts = useMemo(() => {
    const source = player.fighter?.troopCounts ?? player.troopCounts;
    if (source && totalTroops(source) > 0) {
      return source as MixTroopCounts;
    }
    return computeCountsFromMix(normalizeRatios(effectivePlayerMix, DEFAULT_TROOP_MIX));
  }, [player.fighter, player.troopCounts, effectivePlayerMix]);

  const opponentCounts = useMemo(() => {
    const source = opponent.fighter?.troopCounts ?? opponent.troopCounts;
    if (source && totalTroops(source) > 0) {
      return source as MixTroopCounts;
    }
    return computeCountsFromMix(normalizeRatios(effectiveOpponentMix, DEFAULT_TROOP_MIX));
  }, [opponent.fighter, opponent.troopCounts, effectiveOpponentMix]);

  const troopRows = useMemo(() => {
    return TROOP_TYPES.map((type) => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      playerValue: playerCounts[type] ?? 0,
      opponentValue: opponentCounts[type] ?? 0,
      format: 'number' as const,
      group: 'Troops'
    }));
  }, [playerCounts, opponentCounts]);

  const allRows = [...capacityRows, ...troopRows];

  return (
    <SectionCard
      title="Forces"
      description="Capacity and troop composition comparison"
      className="mt-6"
      collapsible
      defaultCollapsed={true}
    >
      <div className="space-y-6">
        <CompareTable
          rows={allRows}
          showDelta
          groupBy
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <TroopMixQuickEditor
            title="Player Troop Mix"
            mix={playerMix}
            displayMix={effectivePlayerMix}
            counts={playerCounts}
            onChange={(mix) => onMixChange?.('player', mix)}
            maxTotal={playerCapacity?.rally.total}
          />
          <TroopMixQuickEditor
            title="Opponent Troop Mix"
            mix={opponentMix}
            displayMix={effectiveOpponentMix}
            counts={opponentCounts}
            onChange={(mix) => onMixChange?.('opponent', mix)}
            maxTotal={opponentCapacity?.rally.total}
          />
        </div>
      </div>
    </SectionCard>
  );
}
