/**
 * Troop Power Comparison Section
 *
 * Allows editing troop mix ratios/counts for both player and opponent,
 * with visual comparison bars showing relative troop distribution.
 */

import type { TroopMixConfig } from '@/shared/types';
import { SectionCard } from '@/shared/ui';
import { totalTroops } from '@/domain/rally/combat-fighter';
import { computeCountsFromMix, normalizeRatios } from '@/domain/rally/mix-utils';
import { DEFAULT_TROOP_MIX } from '@/domain/rally/rally-config';
import { applyRallyCap } from '@/features/battle-calculator/utils/rally-mix';
import { useMemo } from 'react';
import type { CapacityReport, MixTroopCounts } from '@/features/battle-calculator/model/types';
import { TROOP_TYPES } from '@/features/battle-calculator/model/types';
import { formatPercent } from '../utils/format';
import { TroopMixQuickEditor } from './TroopMixQuickEditor';

interface TroopPowerComparisonProps {
  playerCounts: MixTroopCounts | null | undefined;
  opponentCounts: MixTroopCounts | null | undefined;
  playerMixInput?: TroopMixConfig | null;
  opponentMixInput?: TroopMixConfig | null;
  playerNormalizedMix?: TroopMixConfig | null;
  opponentNormalizedMix?: TroopMixConfig | null;
  onMixChange?: (side: 'player' | 'opponent', mix: TroopMixConfig) => void;
  playerCapacity?: CapacityReport | null;
  opponentCapacity?: CapacityReport | null;
}

export function TroopPowerComparison({
  playerCounts,
  opponentCounts,
  playerMixInput,
  opponentMixInput,
  playerNormalizedMix,
  opponentNormalizedMix,
  onMixChange,
  playerCapacity,
  opponentCapacity,
}: TroopPowerComparisonProps) {
  const rawPlayerMix = playerMixInput ?? DEFAULT_TROOP_MIX;
  const rawOpponentMix = opponentMixInput ?? DEFAULT_TROOP_MIX;
  const effectivePlayerMix = useMemo(
    () => applyRallyCap(rawPlayerMix, playerCapacity?.rally.total),
    [rawPlayerMix, playerCapacity?.rally.total]
  );
  const effectiveOpponentMix = useMemo(
    () => applyRallyCap(rawOpponentMix, opponentCapacity?.rally.total),
    [rawOpponentMix, opponentCapacity?.rally.total]
  );

  const derivedPlayerCounts = useMemo(
    () =>
      playerCounts && totalTroops(playerCounts) > 0
        ? playerCounts
        : computeCountsFromMix(normalizeRatios(effectivePlayerMix, DEFAULT_TROOP_MIX)),
    [playerCounts, effectivePlayerMix]
  );
  const derivedOpponentCounts = useMemo(
    () =>
      opponentCounts && totalTroops(opponentCounts) > 0
        ? opponentCounts
        : computeCountsFromMix(normalizeRatios(effectiveOpponentMix, DEFAULT_TROOP_MIX)),
    [opponentCounts, effectiveOpponentMix]
  );

  return (
    <SectionCard
      title="Troop Power Comparison"
      className="mt-6"
    >
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
    </SectionCard>
  );
}
