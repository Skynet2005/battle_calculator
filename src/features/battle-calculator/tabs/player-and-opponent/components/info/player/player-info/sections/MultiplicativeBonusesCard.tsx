'use client';

import type { TroopType } from '@/domain/battle/calculations';
import { extractJoinerBonuses } from '@/domain/rally/rally-bonus-extractor';

import ManualMultiplicativeOverride from '@/features/battle-calculator/tabs/player-and-opponent/components/info/manual-multiplicative-override';
import { SectionCard } from '@/shared/ui';

import { STAT_LIST } from '../playerInfo.constants';
import type { CityBonuses, PetSkillCalc, Stat } from '../playerInfo.types';

interface MultiplicativeBonusesCardProps {
  troopTypes: readonly TroopType[];
  cityBonuses: CityBonuses;
  playerJoinerInfo: ReturnType<typeof extractJoinerBonuses> | null;
  petSkillsEnabled: boolean;
  petCalc: PetSkillCalc;
  multiplicativeBonuses: any;
  onManualOverrideChange: (manualOverrideTotals?: any) => void;
}

interface MultiplicativeTroopSectionProps {
  troopType: TroopType;
  cityBonuses: CityBonuses;
  playerJoinerInfo: ReturnType<typeof extractJoinerBonuses> | null;
  petSkillsEnabled: boolean;
  petCalc: PetSkillCalc;
  multiplicativeBonuses: any;
}

interface BonusItem {
  label: string;
  value: number;
  detail: string | null;
  muted?: boolean;
  highlight?: boolean;
  alwaysShow?: boolean;
}

export default function MultiplicativeBonusesCard({
  troopTypes,
  cityBonuses,
  playerJoinerInfo,
  petSkillsEnabled,
  petCalc,
  multiplicativeBonuses,
  onManualOverrideChange
}: MultiplicativeBonusesCardProps) {
  return (
    <SectionCard
      title="Multiplicative Bonuses Summary"
      description="Total multiplicative bonuses from Pet Skills, City Bonuses, and Joiners. These are applied after additive bonuses."
      collapsible
      defaultCollapsed
    >
      <SectionCard
        title="Manual Multiplicative Override (optional)"
        description="Enter total multiplicative % per troop/stat; leave collapsed to use calculated values."
        collapsible
        defaultCollapsed
      >
        <ManualMultiplicativeOverride overrides={multiplicativeBonuses.manualOverrideTotals} onChange={onManualOverrideChange} />
      </SectionCard>

      {troopTypes.map((troopType) => (
        <MultiplicativeTroopSection
          key={troopType}
          troopType={troopType}
          cityBonuses={cityBonuses}
          playerJoinerInfo={playerJoinerInfo}
          petSkillsEnabled={petSkillsEnabled}
          petCalc={petCalc}
          multiplicativeBonuses={multiplicativeBonuses}
        />
      ))}
    </SectionCard>
  );
}

function MultiplicativeTroopSection({
  troopType,
  cityBonuses,
  playerJoinerInfo,
  petSkillsEnabled,
  petCalc,
  multiplicativeBonuses
}: MultiplicativeTroopSectionProps) {
  const { calculatedPetSkills, calculatedPetDebuffs, petContributions, petDebuffContributions } = petCalc;

  const petSkills = petSkillsEnabled ? calculatedPetSkills : { attack: 0, defense: 0, lethality: 0, health: 0 };

  const joinerMultiplicative = playerJoinerInfo?.multiplicative || {
    damage: 0,
    attack: 0,
    defense: 0,
    lethality: 0,
    health: 0,
    damageReduction: 0
  };

  const manualOverrideTotals = multiplicativeBonuses.manualOverrideTotals?.[troopType];
  const manualOverrideActive = isManualOverrideActive(manualOverrideTotals);

  const computedMultiplicativeTotals = {
    attack: petSkills.attack + cityBonuses.attack + joinerMultiplicative.attack + (joinerMultiplicative.damage || 0),
    defense: petSkills.defense + cityBonuses.defense + joinerMultiplicative.defense,
    lethality: petSkills.lethality + cityBonuses.lethality + joinerMultiplicative.lethality,
    health: petSkills.health + cityBonuses.health + joinerMultiplicative.health
  };

  const manualMultiplicativeTotals = manualOverrideActive ? convertToStatRecord(manualOverrideTotals) : null;
  const multiplicativeTotals = manualMultiplicativeTotals ?? computedMultiplicativeTotals;

  const combatDebuffs = { ...calculatedPetDebuffs, ...(multiplicativeBonuses.combatDebuffs || {}) };

  return (
    <div className="mb-8 pb-8 border-b border-slate-700/30 last:border-b-0 last:mb-0 last:pb-0 [data-theme='light']:border-gray-300">
      <h4 className="text-xl sm:text-2xl font-bold mb-5 capitalize bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent [data-theme='light']:from-blue-600 [data-theme='light']:to-purple-600">
        {troopType}
      </h4>

      {manualOverrideActive && <ManualOverrideNotice />}

      <TotalStatsGrid total={multiplicativeTotals} />

      <div className="space-y-4 sm:space-y-5">
        {STAT_LIST.map((stat) => (
          <StatBreakdownCard
            key={stat}
            stat={stat}
            petSkillsEnabled={petSkillsEnabled}
            petSkills={petSkills}
            petContributions={petContributions}
            cityBonuses={cityBonuses}
            manualOverrideActive={manualOverrideActive}
            manualMultiplicativeTotals={manualMultiplicativeTotals}
            computedMultiplicativeTotals={computedMultiplicativeTotals}
          />
        ))}
      </div>

      <DebuffSection
        cityBonuses={cityBonuses}
        combatDebuffs={combatDebuffs}
        petDebuffContributions={petDebuffContributions}
      />
    </div>
  );
}

function isManualOverrideActive(manualOverrideTotals: any): boolean {
  if (!manualOverrideTotals) return false;

  return Object.values(manualOverrideTotals).some((v) => {
    const num = Number(v);
    return v !== undefined && v !== null && !Number.isNaN(num);
  });
}

function convertToStatRecord(manualOverrideTotals: any): Record<Stat, number> {
  return {
    attack: Number(manualOverrideTotals?.attack ?? 0),
    defense: Number(manualOverrideTotals?.defense ?? 0),
    lethality: Number(manualOverrideTotals?.lethality ?? 0),
    health: Number(manualOverrideTotals?.health ?? 0)
  };
}

function ManualOverrideNotice() {
  return (
    <div className="mb-4 sm:mb-5 rounded-lg border-2 border-emerald-400/40 bg-linear-to-r from-emerald-500/15 to-teal-500/15 px-4 py-3 shadow-lg shadow-emerald-500/10 [data-theme='light']:from-emerald-50 [data-theme='light']:to-teal-50 [data-theme='light']:border-emerald-400">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-emerald-400 shrink-0 [data-theme='light']:text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm sm:text-base font-semibold text-emerald-100 [data-theme='light']:text-emerald-800">
          Manual multiplicative totals are applied for this troop type. Calculated breakdowns remain for reference.
        </span>
      </div>
    </div>
  );
}

function TotalStatsGrid({ total }: { total: Record<Stat, number> }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
      {STAT_LIST.map((stat) => (
        <div
          key={stat}
          className="bg-linear-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-3 sm:p-4 border border-slate-700/50 shadow-lg hover:shadow-xl hover:border-slate-600/50 transition-all duration-200 [data-theme='light']:from-white [data-theme='light']:to-gray-50 [data-theme='light']:border-gray-300"
        >
          <div className="text-xs sm:text-sm text-slate-400 mb-1.5 sm:mb-2 uppercase tracking-wider font-semibold [data-theme='light']:text-gray-600">
            {stat}
          </div>
          <div className="text-xl sm:text-2xl font-bold bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent [data-theme='light']:from-emerald-600 [data-theme='light']:to-teal-600">
            {total[stat] > 0 ? '+' : ''}
            {total[stat].toFixed(2)}%
          </div>
        </div>
      ))}
    </div>
  );
}

interface StatBreakdownCardProps {
  stat: Stat;
  petSkillsEnabled: boolean;
  petSkills: Record<Stat, number>;
  petContributions: Record<Stat, Record<string, number>>;
  cityBonuses: CityBonuses;
  manualOverrideActive: boolean;
  manualMultiplicativeTotals: Record<Stat, number> | null;
  computedMultiplicativeTotals: Record<Stat, number>;
}

function StatBreakdownCard({
  stat,
  petSkillsEnabled,
  petSkills,
  petContributions,
  cityBonuses,
  manualOverrideActive,
  manualMultiplicativeTotals,
  computedMultiplicativeTotals
}: StatBreakdownCardProps) {
  const petsForStat = petSkillsEnabled ? Object.entries(petContributions[stat]).filter(([_, v]) => v > 0) : [];

  const items: BonusItem[] = [
    ...(petSkillsEnabled
      ? petsForStat.map(([petName, value]) => ({
        label: petName,
        value,
        detail: null
      }))
      : [{ label: 'Pet Skills', value: 0, detail: 'Disabled', muted: true }]),
    ...(petSkillsEnabled && petsForStat.length > 0
      ? [{ label: 'Pet Skills Total', value: petSkills[stat], detail: null, highlight: true }]
      : []),
    { label: 'City Bonuses', value: cityBonuses[stat], detail: null },
    ...(manualOverrideActive
      ? [
        {
          label: 'Manual Override',
          value: manualMultiplicativeTotals![stat],
          detail: null,
          highlight: true,
          alwaysShow: true
        }
      ]
      : []),
    {
      label: manualOverrideActive ? 'Calculated Total (reference)' : 'Grand Total',
      value: computedMultiplicativeTotals[stat],
      detail: null,
      highlight: !manualOverrideActive,
      muted: manualOverrideActive,
      alwaysShow: true
    }
  ];

  return (
    <div className="bg-linear-to-br from-slate-900/40 to-slate-800/40 rounded-xl p-4 sm:p-5 border border-slate-700/40 shadow-md hover:shadow-lg transition-shadow duration-200 [data-theme='light']:from-gray-50 [data-theme='light']:to-white [data-theme='light']:border-gray-200">
      <div className="text-base sm:text-lg font-bold mb-3 sm:mb-4 capitalize text-slate-200 [data-theme='light']:text-gray-800">
        {stat}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs sm:text-sm">
        {items.map((item, idx) => {
          const showItem = item.alwaysShow || item.value !== 0 || item.muted;
          if (!showItem) return null;

          const isHighlight = item.highlight;
          const isMuted = item.muted;

          return (
            <div
              key={idx}
              className={`flex justify-between items-center py-2 px-3 rounded-lg transition-all duration-150 ${isHighlight
                ? 'bg-linear-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/40 shadow-sm shadow-emerald-500/10 [data-theme=\'light\']:from-emerald-50 [data-theme=\'light\']:to-teal-50 [data-theme=\'light\']:border-emerald-400'
                : 'hover:bg-slate-800/50 [data-theme=\'light\']:hover:bg-gray-100'
                }`}
            >
              <span
                className={`font-medium ${isMuted
                  ? 'text-slate-500 [data-theme=\'light\']:text-gray-500'
                  : isHighlight
                    ? 'text-emerald-300 [data-theme=\'light\']:text-emerald-700'
                    : 'text-slate-300 [data-theme=\'light\']:text-gray-700'
                  }`}
              >
                {item.label}:
              </span>
              <span
                className={`font-semibold ${isMuted
                  ? 'text-slate-400 [data-theme=\'light\']:text-gray-400'
                  : isHighlight
                    ? 'text-emerald-200 [data-theme=\'light\']:text-emerald-800'
                    : item.value === 0
                      ? 'text-slate-500 [data-theme=\'light\']:text-gray-500'
                      : 'text-slate-200 [data-theme=\'light\']:text-gray-800'
                  }`}
              >
                {item.detail ? (
                  item.detail
                ) : (
                  <>
                    {item.value > 0 ? '+' : ''}
                    {item.value.toFixed(2)}%
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DebuffSectionProps {
  cityBonuses: CityBonuses;
  combatDebuffs: any;
  petDebuffContributions: Record<'defense' | 'health', Record<string, number>>;
}

function DebuffSection({ cityBonuses, combatDebuffs, petDebuffContributions }: DebuffSectionProps) {
  const hasAnyDebuffs =
    Object.values(petDebuffContributions.defense).some((v) => v > 0) ||
    Object.values(petDebuffContributions.health).some((v) => v > 0) ||
    cityBonuses.enemyDefenseReduction > 0 ||
    cityBonuses.enemyAttackReduction > 0;

  if (!hasAnyDebuffs) return null;

  return (
    <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t-2 border-slate-700/50 [data-theme='light']:border-gray-300">
      <h4 className="text-lg sm:text-xl font-bold mb-4 sm:mb-5 bg-linear-to-r from-red-400 to-orange-400 bg-clip-text text-transparent [data-theme='light']:from-red-600 [data-theme='light']:to-orange-600">
        Enemy Reduction Debuffs (Applied to Opponent)
      </h4>

      <div className="space-y-4 sm:space-y-5">
        {(['defense', 'health'] as const).map((stat) => {
          const petsForDebuff = Object.entries(petDebuffContributions[stat]).filter(([_, v]) => v > 0);
          const cityDebuff = stat === 'defense' ? cityBonuses.enemyDefenseReduction : 0;
          const totalDebuff = combatDebuffs[stat] + (stat === 'defense' ? cityDebuff : 0);

          if (petsForDebuff.length === 0 && cityDebuff === 0) return null;

          return (
            <div
              key={stat}
              className="bg-linear-to-br from-slate-900/40 to-slate-800/40 rounded-xl p-4 sm:p-5 border border-slate-700/40 shadow-md [data-theme='light']:from-gray-50 [data-theme='light']:to-white [data-theme='light']:border-gray-200"
            >
              <div className="text-base sm:text-lg font-bold mb-3 sm:mb-4 capitalize text-slate-200 [data-theme='light']:text-gray-800">
                Enemy {stat === 'defense' ? 'Defense' : 'Health'} Reduction
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs sm:text-sm">
                {petsForDebuff.map(([petName, value]) => (
                  <div
                    key={petName}
                    className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-all duration-150 [data-theme='light']:hover:bg-gray-100"
                  >
                    <span className="text-slate-300 font-medium [data-theme='light']:text-gray-700">{petName}:</span>
                    <span className="text-slate-200 font-semibold [data-theme='light']:text-gray-800">
                      {value > 0 ? '+' : ''}
                      {value.toFixed(2)}%
                    </span>
                  </div>
                ))}

                {stat === 'defense' && cityDebuff > 0 && (
                  <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-all duration-150 [data-theme='light']:hover:bg-gray-100">
                    <span className="text-slate-300 font-medium [data-theme='light']:text-gray-700">City Bonuses:</span>
                    <span className="text-slate-200 font-semibold [data-theme='light']:text-gray-800">
                      {cityDebuff > 0 ? '+' : ''}
                      {cityDebuff.toFixed(2)}%
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-linear-to-r from-red-500/20 to-orange-500/20 border border-red-400/40 shadow-sm shadow-red-500/10 [data-theme='light']:from-red-50 [data-theme='light']:to-orange-50 [data-theme='light']:border-red-400">
                  <span className="text-red-300 font-semibold [data-theme='light']:text-red-700">
                    Total Enemy {stat === 'defense' ? 'Defense' : 'Health'} Reduction:
                  </span>
                  <span className="text-red-200 font-bold [data-theme='light']:text-red-800">
                    {totalDebuff > 0 ? '+' : ''}
                    {totalDebuff.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {cityBonuses.enemyAttackReduction > 0 && (
          <div className="bg-linear-to-br from-slate-900/40 to-slate-800/40 rounded-xl p-4 sm:p-5 border border-slate-700/40 shadow-md [data-theme='light']:from-gray-50 [data-theme='light']:to-white [data-theme='light']:border-gray-200">
            <div className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-slate-200 [data-theme='light']:text-gray-800">
              Enemy Attack Reduction
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs sm:text-sm">
              <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-all duration-150 [data-theme='light']:hover:bg-gray-100">
                <span className="text-slate-300 font-medium [data-theme='light']:text-gray-700">City Bonuses:</span>
                <span className="text-slate-200 font-semibold [data-theme='light']:text-gray-800">
                  {cityBonuses.enemyAttackReduction > 0 ? '+' : ''}
                  {cityBonuses.enemyAttackReduction.toFixed(2)}%
                </span>
              </div>

              <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-linear-to-r from-red-500/20 to-orange-500/20 border border-red-400/40 shadow-sm shadow-red-500/10 [data-theme='light']:from-red-50 [data-theme='light']:to-orange-50 [data-theme='light']:border-red-400">
                <span className="text-red-300 font-semibold [data-theme='light']:text-red-700">Total Enemy Attack Reduction:</span>
                <span className="text-red-200 font-bold [data-theme='light']:text-red-800">
                  {cityBonuses.enemyAttackReduction > 0 ? '+' : ''}
                  {cityBonuses.enemyAttackReduction.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
