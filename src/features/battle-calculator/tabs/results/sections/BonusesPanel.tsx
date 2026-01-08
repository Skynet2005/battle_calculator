/**
 * Bonuses Panel Section
 *
 * Displays base stat bonuses and special rally bonuses/debuffs for both sides.
 */

import type { SideBaseStats } from '@/domain/rally/combat-types';
import { SectionCard } from '@/shared/ui';
import type { BattleSideContext, SpecialBonusSummary } from '@/features/battle-calculator/model/types';
import { TROOP_TYPES } from '@/features/battle-calculator/model/types';
import { formatSignedPercent, formatStatValue } from '../utils/format';
import { SpecialBonusTable } from './SpecialBonusTable';

interface BonusesPanelProps {
  playerStats: SideBaseStats | null;
  opponentStats: SideBaseStats | null;
  playerSpecial: SpecialBonusSummary | null;
  opponentSpecial: SpecialBonusSummary | null;
  playerJoinerAdditive?: BattleSideContext['joinerAdditive'];
  opponentJoinerAdditive?: BattleSideContext['joinerAdditive'];
}

export function BonusesPanel({
  playerStats,
  opponentStats,
  playerSpecial,
  opponentSpecial,
  playerJoinerAdditive,
  opponentJoinerAdditive,
}: BonusesPanelProps) {
  if (!playerStats && !opponentStats && !playerSpecial && !opponentSpecial) {
    return null;
  }

  return (
    <SectionCard
      title="Bonuses"
      description="Base stat output (after Basic + Additive × Multiplicative) alongside rally-only special bonuses and debuffs."
      className="mt-6"
    >
      <div className="space-y-4">
        <StatBonusCards
          playerStats={playerStats}
          opponentStats={opponentStats}
          playerJoinerAdditive={playerJoinerAdditive}
          opponentJoinerAdditive={opponentJoinerAdditive}
        />
        <SpecialBonusTable player={playerSpecial} opponent={opponentSpecial} />
      </div>
    </SectionCard>
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
      <StatBonusCard
        label="Player Stat Bonuses"
        stats={playerStats}
        accent="text-rose-200"
        joinerAdditive={playerJoinerAdditive}
      />
      <StatBonusCard
        label="Opponent Stat Bonuses"
        stats={opponentStats}
        accent="text-sky-200"
        joinerAdditive={opponentJoinerAdditive}
      />
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
                    <div className="flex justify-between">
                      <span>Attack</span>
                      <span className={`font-semibold ${accent}`}>{formatStatValue(line.attack)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Defense</span>
                      <span className={`font-semibold ${accent}`}>{formatStatValue(line.defense)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lethality</span>
                      <span className={`font-semibold ${accent}`}>{formatStatValue(line.lethality)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Health</span>
                      <span className={`font-semibold ${accent}`}>{formatStatValue(line.health)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {joinerAdditive &&
            (joinerAdditive.attack !== 0 ||
              joinerAdditive.defense !== 0 ||
              joinerAdditive.lethality !== 0 ||
              joinerAdditive.health !== 0) && (
              <div className="mt-3 rounded-lg border border-white/10 bg-slate-800/40 p-3 text-xs">
                <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                  Joiner Additive (applies to all troops)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between">
                    <span>Attack</span>
                    <span className="font-semibold text-sky-200">{formatSignedPercent(joinerAdditive.attack)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Defense</span>
                    <span className="font-semibold text-sky-200">{formatSignedPercent(joinerAdditive.defense)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lethality</span>
                    <span className="font-semibold text-sky-200">{formatSignedPercent(joinerAdditive.lethality)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Health</span>
                    <span className="font-semibold text-sky-200">{formatSignedPercent(joinerAdditive.health)}</span>
                  </div>
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
