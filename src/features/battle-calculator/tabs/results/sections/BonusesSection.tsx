/**
 * Bonuses Section - Secondary Tier
 *
 * Shows effective values by default, hides source spam.
 * Includes toggles: "Only non-zero", "Only impactful", "Show raw / show effective"
 */

import { useState, useMemo, memo } from 'react';
import type { SideBaseStats } from '@/domain/rally/combat-types';
import { formatSignedPercent, formatStatValue } from '../utils/format';
import { SectionCard } from '@/shared/ui';
import { CompareTable } from '../components/CompareTable';
import type { BattleSideContext, SpecialBonusSummary } from '@/features/battle-calculator/model/types';
import { TROOP_TYPES } from '@/features/battle-calculator/model/types';
import { SpecialBonusTable } from './SpecialBonusTable';

interface BonusesSectionProps {
  playerStats: SideBaseStats | null;
  opponentStats: SideBaseStats | null;
  playerSpecial: SpecialBonusSummary | null;
  opponentSpecial: SpecialBonusSummary | null;
  playerJoinerAdditive?: BattleSideContext['joinerAdditive'];
  opponentJoinerAdditive?: BattleSideContext['joinerAdditive'];
}

function BonusesSectionComponent({
  playerStats,
  opponentStats,
  playerSpecial,
  opponentSpecial,
  playerJoinerAdditive,
  opponentJoinerAdditive
}: BonusesSectionProps) {
  const [showOnlyNonZero, setShowOnlyNonZero] = useState(true);

  const statRows = useMemo(() => {
    if (!playerStats || !opponentStats) return [];

    const rows: Array<{
      label: string;
      playerValue: number;
      opponentValue: number;
      format: 'number';
      group: string;
      winner?: 'player' | 'opponent' | null;
    }> = [];

    TROOP_TYPES.forEach((type) => {
      const playerLine = playerStats[type];
      const opponentLine = opponentStats[type];
      if (!playerLine || !opponentLine) return;

      ['attack', 'defense', 'lethality', 'health'].forEach((stat) => {
        const playerVal = playerLine[stat as keyof typeof playerLine] as number;
        const opponentVal = opponentLine[stat as keyof typeof opponentLine] as number;
        if (showOnlyNonZero && playerVal === 0 && opponentVal === 0) return;

        rows.push({
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${stat.charAt(0).toUpperCase() + stat.slice(1)}`,
          playerValue: playerVal,
          opponentValue: opponentVal,
          format: 'number',
          group: 'Base Stats',
          winner: playerVal > opponentVal ? 'player' : opponentVal > playerVal ? 'opponent' : null
        });
      });
    });

    return rows;
  }, [playerStats, opponentStats, showOnlyNonZero]);

  if (!playerStats && !opponentStats && !playerSpecial && !opponentSpecial) {
    return null;
  }

  return (
    <SectionCard
      title="Bonuses"
      description="Base stat output and special rally bonuses/debuffs"
      className="mt-6"
      collapsible
      defaultCollapsed={true}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={showOnlyNonZero}
              onChange={(e) => setShowOnlyNonZero(e.target.checked)}
              className="h-3 w-3 accent-rose-400"
            />
            Only non-zero
          </label>
        </div>

        {statRows.length > 0 && (
          <CompareTable
            rows={statRows}
            showDelta
            groupBy
          />
        )}

        {playerJoinerAdditive && (playerJoinerAdditive.attack !== 0 || playerJoinerAdditive.defense !== 0 || playerJoinerAdditive.lethality !== 0 || playerJoinerAdditive.health !== 0) && (
          <div className="rounded-lg border border-white/10 bg-slate-800/40 p-3 text-xs">
            <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-2">Player Joiner Additive</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between">
                <span>Attack</span>
                <span className="font-semibold text-sky-200">{formatSignedPercent(playerJoinerAdditive.attack)}</span>
              </div>
              <div className="flex justify-between">
                <span>Defense</span>
                <span className="font-semibold text-sky-200">{formatSignedPercent(playerJoinerAdditive.defense)}</span>
              </div>
              <div className="flex justify-between">
                <span>Lethality</span>
                <span className="font-semibold text-sky-200">{formatSignedPercent(playerJoinerAdditive.lethality)}</span>
              </div>
              <div className="flex justify-between">
                <span>Health</span>
                <span className="font-semibold text-sky-200">{formatSignedPercent(playerJoinerAdditive.health)}</span>
              </div>
            </div>
          </div>
        )}

        <SpecialBonusTable player={playerSpecial} opponent={opponentSpecial} />
      </div>
    </SectionCard>
  );
}

/**
 * Memoized BonusesSection component to prevent unnecessary re-renders
 * Only re-renders when props actually change
 */
export const BonusesSection = memo(BonusesSectionComponent, (prev, next) => {
  // Custom comparison function for deep equality check
  return (
    prev.playerStats === next.playerStats &&
    prev.opponentStats === next.opponentStats &&
    prev.playerSpecial === next.playerSpecial &&
    prev.opponentSpecial === next.opponentSpecial &&
    prev.playerJoinerAdditive === next.playerJoinerAdditive &&
    prev.opponentJoinerAdditive === next.opponentJoinerAdditive
  );
});
