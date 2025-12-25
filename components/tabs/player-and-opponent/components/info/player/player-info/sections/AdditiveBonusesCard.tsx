'use client';

import type { StatType, TroopType } from '@/lib/battle/calculations';
import { extractJoinerBonuses, extractLeaderBonuses } from '@/lib/rally/rally-bonus-extractor';

import type { RallyHero, UserProfile } from '@/components/types';
import { SectionCard } from '@/components/ui';

import ManualAdditiveOverride from '@/components/tabs/player-and-opponent/components/info/manual-additive-override';
import { STAT_LIST } from '../playerInfo.constants';
import type { Stat } from '../playerInfo.types';

interface AdditiveBonusesCardProps {
  troopTypes: readonly TroopType[];
  currentProfile: UserProfile;
  playerJoinerInfo: ReturnType<typeof extractJoinerBonuses> | null;
  additiveBonuses: any;
  expertBonuses: Record<Stat, number>;
  charmBonuses: any;
  chiefGearBonuses: { attack: number; defense: number };
  onManualOverrideChange: (manualOverrideTotals?: any) => void;
}

interface AdditiveTroopSectionProps {
  troopType: TroopType;
  currentProfile: UserProfile;
  playerJoinerInfo: ReturnType<typeof extractJoinerBonuses> | null;
  additiveBonuses: any;
  expertBonuses: Record<Stat, number>;
  charmBonuses: any;
  chiefGearBonuses: { attack: number; defense: number };
}

interface BonusBreakdown {
  allianceTech: Record<Stat, number>;
  experts: Record<Stat, number>;
  daybreakIsland: Record<Stat, number>;
  pets: Record<Stat, number>;
  skins: Record<Stat, number>;
  hero: Record<Stat, number>;
  chiefGear: Record<Stat, number>;
  charms: Record<Stat, number>;
  heroGear: Record<Stat, number>;
  allianceFacilities: Record<Stat, number>;
  petRefinement: Record<Stat, number>;
  warAcademy: Record<Stat, number>;
  specialHeroes: Record<Stat, number>;
  vipPrestige: Record<Stat, number>;
  globe: Record<Stat, number>;
  temporaryEvents: Record<Stat, number>;
  supremePresident: Record<Stat, number>;
  specialBuffs: Record<Stat, number>;
}

interface BonusItem {
  label: string;
  value: number;
  detail?: string | null;
  muted?: boolean;
  highlight?: boolean;
  alwaysShow?: boolean;
}

export default function AdditiveBonusesCard({
  troopTypes,
  currentProfile,
  playerJoinerInfo,
  additiveBonuses,
  expertBonuses,
  charmBonuses,
  chiefGearBonuses,
  onManualOverrideChange
}: AdditiveBonusesCardProps) {
  return (
    <SectionCard
      title="Additive Bonuses Summary"
      description="Total additive bonuses from all sources. These are added together before multiplicative bonuses are applied."
      collapsible
      defaultCollapsed
    >
      <SectionCard
        title="Manual Additive Override (optional)"
        description="Enter total additive % per troop/stat; leave collapsed to use calculated values."
        collapsible
        defaultCollapsed
      >
        <ManualAdditiveOverride overrides={currentProfile.additiveBonuses?.manualOverrideTotals} onChange={onManualOverrideChange} />
      </SectionCard>

      {troopTypes.map((troopType) => (
        <AdditiveTroopSection
          key={troopType}
          troopType={troopType}
          currentProfile={currentProfile}
          playerJoinerInfo={playerJoinerInfo}
          additiveBonuses={additiveBonuses}
          expertBonuses={expertBonuses}
          charmBonuses={charmBonuses}
          chiefGearBonuses={chiefGearBonuses}
        />
      ))}
    </SectionCard>
  );
}

function AdditiveTroopSection({
  troopType,
  currentProfile,
  playerJoinerInfo,
  additiveBonuses,
  expertBonuses,
  charmBonuses,
  chiefGearBonuses
}: AdditiveTroopSectionProps) {
  const breakdown = useBonusBreakdown({
    troopType,
    currentProfile,
    expertBonuses,
    charmBonuses,
    chiefGearBonuses,
    additiveBonuses
  });

  const manualOverrideTotals = currentProfile.additiveBonuses?.manualOverrideTotals?.[troopType];
  const manualOverrideActive = isManualOverrideActive(manualOverrideTotals);

  const computedAdditiveTotals = calculateComputedAdditiveTotals(breakdown);
  const manualAdditiveTotals = manualOverrideActive ? convertToStatRecord(manualOverrideTotals) : null;
  const additiveTotals = manualAdditiveTotals ?? computedAdditiveTotals;

  const basicBonuses = currentProfile.basicBonuses;
  const troopTypeBonuses = basicBonuses.combatTech.troopTypeBonus as Record<TroopType, Record<StatType, number>>;
  const totalTroopBonus = basicBonuses.combatTech.totalTroopBonus;

  const calculateResearchValue = (stat: StatType): number => {
    const researchTotal = totalTroopBonus[stat] || 0;
    const troopOnly = (troopTypeBonuses[troopType]?.[stat] || 0) - researchTotal;
    return troopOnly + researchTotal;
  };

  const total = STAT_LIST.reduce((acc, stat) => {
    acc[stat] = sumTotal(stat, breakdown, additiveTotals, calculateResearchValue);
    return acc;
  }, {} as Record<Stat, number>);

  return (
    <div className="mb-8 pb-8 border-b border-slate-700/30 last:border-b-0 last:mb-0 last:pb-0 [data-theme='light']:border-gray-300">
      <h4 className="text-xl sm:text-2xl font-bold mb-5 capitalize bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent [data-theme='light']:from-blue-600 [data-theme='light']:to-purple-600">
        {troopType}
      </h4>

      {manualOverrideActive && <ManualOverrideNotice />}

      <TotalStatsGrid total={total} />

      <div className="space-y-4 sm:space-y-5">
        {STAT_LIST.map((stat) => (
          <StatBreakdownCard
            key={stat}
            stat={stat}
            troopType={troopType}
            breakdown={breakdown}
            calculateResearchValue={calculateResearchValue}
            troopTypeBonuses={troopTypeBonuses}
            totalTroopBonus={totalTroopBonus}
            playerJoinerInfo={playerJoinerInfo}
            manualOverrideActive={manualOverrideActive}
            manualAdditiveTotals={manualAdditiveTotals}
            computedAdditiveTotals={computedAdditiveTotals}
          />
        ))}
      </div>
    </div>
  );
}

function useBonusBreakdown({
  troopType,
  currentProfile,
  expertBonuses,
  charmBonuses,
  chiefGearBonuses,
  additiveBonuses
}: {
  troopType: TroopType;
  currentProfile: UserProfile;
  expertBonuses: Record<Stat, number>;
  charmBonuses: any;
  chiefGearBonuses: { attack: number; defense: number };
  additiveBonuses: any;
}): BonusBreakdown {
  const basicBonuses = currentProfile.basicBonuses;
  const playerMode = currentProfile.rally.specialWidgetBonus?.player || 'attacking';
  const leaders: Record<TroopType, RallyHero | null> | undefined =
    currentProfile.rally.playerLeader ?? currentProfile.rally.leader;
  const matchingLeader = leaders?.[troopType];

  const heroBonusesForTroop = extractHeroBonuses(matchingLeader, playerMode as 'attacking' | 'defending', currentProfile);
  const daybreakIsland = basicBonuses.daybreakIsland;
  const heroGearByTroop = basicBonuses.heroGear as Record<TroopType, Record<Stat, number>>;
  const petRefinementByTroop = basicBonuses.petRefinement as any;
  const warAcademyByTroop = basicBonuses.warAcademy as Record<TroopType, Record<StatType, number>>;

  const createStatRecord = (values: Partial<Record<Stat, number>>): Record<Stat, number> => ({
    attack: values.attack || 0,
    defense: values.defense || 0,
    lethality: values.lethality || 0,
    health: values.health || 0
  });

  return {
    allianceTech: createStatRecord({
      attack: Math.min(basicBonuses.allianceTech.attack || 0, 10),
      defense: Math.min(basicBonuses.allianceTech.defense || 0, 10),
      lethality: Math.min(basicBonuses.allianceTech.lethality || 0, 10),
      health: Math.min(basicBonuses.allianceTech.health || 0, 10)
    }),
    experts: expertBonuses,
    daybreakIsland: createStatRecord({
      attack: (daybreakIsland[troopType]?.attack || 0) + (daybreakIsland.troops?.attack || 0),
      defense: (daybreakIsland[troopType]?.defense || 0) + (daybreakIsland.troops?.defense || 0),
      lethality: daybreakIsland.troops?.lethality || 0,
      health: daybreakIsland.troops?.health || 0
    }),
    pets: basicBonuses.pets,
    skins: basicBonuses.stackedSkins,
    hero: heroBonusesForTroop,
    chiefGear: createStatRecord({
      attack: chiefGearBonuses.attack,
      defense: chiefGearBonuses.defense
    }),
    charms: createStatRecord({
      lethality: charmBonuses?.[troopType]?.lethality || 0,
      health: charmBonuses?.[troopType]?.health || 0
    }),
    heroGear: heroGearByTroop[troopType] || createStatRecord({}),
    allianceFacilities: createStatRecord({
      attack: Math.min(basicBonuses.allianceFacilities.attack || 0, 13),
      defense: Math.min(basicBonuses.allianceFacilities.defense || 0, 13)
    }),
    petRefinement: createStatRecord({
      attack: petRefinementByTroop?.troops?.attack || 0,
      defense: petRefinementByTroop?.troops?.defense || 0,
      lethality: petRefinementByTroop?.[troopType]?.lethality || 0,
      health: petRefinementByTroop?.[troopType]?.health || 0
    }),
    warAcademy: warAcademyByTroop[troopType] || createStatRecord({}),
    specialHeroes: createStatRecord({
      attack: basicBonuses.specialHeroes.natalia ? 10 : 0,
      defense: basicBonuses.specialHeroes.natalia ? 10 : 0,
      lethality: basicBonuses.specialHeroes.jeronimo ? 15 : 0,
      health: basicBonuses.specialHeroes.jeronimo ? 15 : 0
    }),
    vipPrestige: basicBonuses.vipPrestige,
    globe: basicBonuses.globe,
    temporaryEvents: additiveBonuses.temporaryEvents,
    supremePresident: additiveBonuses.supremePresident,
    specialBuffs: additiveBonuses.specialBuffs
  };
}

function extractHeroBonuses(
  matchingLeader: RallyHero | null | undefined,
  playerMode: 'attacking' | 'defending',
  currentProfile: UserProfile
): Record<Stat, number> {
  if (!matchingLeader) {
    return { attack: 0, defense: 0, lethality: 0, health: 0 };
  }

  const rallyXpLevel = matchingLeader.xpLevel;
  const heroXpLevel = currentProfile.heroLevels?.[matchingLeader.heroName]?.xpLevel;
  const effectiveXpLevel = rallyXpLevel ?? heroXpLevel ?? 80;

  const leaderBonuses = extractLeaderBonuses(matchingLeader, playerMode, effectiveXpLevel);
  return {
    attack: leaderBonuses.basic.attack,
    defense: leaderBonuses.basic.defense,
    lethality: leaderBonuses.basic.lethality,
    health: leaderBonuses.basic.health
  };
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

function calculateComputedAdditiveTotals(breakdown: BonusBreakdown): Record<Stat, number> {
  const sources = [breakdown.temporaryEvents, breakdown.supremePresident, breakdown.specialBuffs];

  return STAT_LIST.reduce((acc, stat) => {
    acc[stat] = sources.reduce((sum, source) => sum + source[stat], 0);
    return acc;
  }, {} as Record<Stat, number>);
}

function sumTotal(
  stat: StatType,
  breakdown: BonusBreakdown,
  additiveTotals: Record<Stat, number>,
  calculateResearchValue: (stat: StatType) => number
): number {
  const bonusSources = [
    calculateResearchValue(stat),
    breakdown.allianceTech[stat],
    breakdown.experts[stat],
    breakdown.daybreakIsland[stat],
    breakdown.pets[stat],
    breakdown.skins[stat],
    breakdown.hero[stat],
    breakdown.chiefGear[stat],
    breakdown.charms[stat],
    breakdown.heroGear[stat],
    breakdown.allianceFacilities[stat],
    breakdown.petRefinement[stat],
    breakdown.warAcademy[stat],
    breakdown.specialHeroes[stat],
    breakdown.vipPrestige[stat],
    breakdown.globe[stat],
    additiveTotals[stat]
  ];

  return bonusSources.reduce((sum, value) => sum + value, 0);
}

function ManualOverrideNotice() {
  return (
    <div className="mb-4 sm:mb-5 rounded-lg border-2 border-emerald-400/40 bg-linear-to-r from-emerald-500/15 to-teal-500/15 px-4 py-3 shadow-lg shadow-emerald-500/10 [data-theme='light']:from-emerald-50 [data-theme='light']:to-teal-50 [data-theme='light']:border-emerald-400">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-emerald-400 shrink-0 [data-theme='light']:text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm sm:text-base font-semibold text-emerald-100 [data-theme='light']:text-emerald-800">
          Manual additive totals are applied for this troop type. Calculated breakdowns remain for reference.
        </span>
      </div>
    </div>
  );
}

function TotalStatsGrid({ total }: { total: Record<Stat, number> }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
      {STAT_LIST.map((stat) => (
        <div
          key={stat}
          className="group relative bg-linear-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-4 sm:p-5 border border-slate-700/50 shadow-lg hover:shadow-xl hover:border-slate-600/50 transition-all duration-300 [data-theme='light']:from-white [data-theme='light']:to-gray-50 [data-theme='light']:border-gray-300 [data-theme='light']:hover:border-gray-400"
        >
          <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <div className="text-xs sm:text-sm text-bonus-label mb-2 uppercase tracking-wider font-bold">{stat}</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-bonus-total bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent [data-theme='light']:from-blue-600 [data-theme='light']:to-purple-600">
              {total[stat] > 0 ? '+' : ''}
              {total[stat].toFixed(2)}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface StatBreakdownCardProps {
  stat: Stat;
  troopType: TroopType;
  breakdown: BonusBreakdown;
  calculateResearchValue: (stat: StatType) => number;
  troopTypeBonuses: Record<TroopType, Record<StatType, number>>;
  totalTroopBonus: Record<StatType, number>;
  playerJoinerInfo: ReturnType<typeof extractJoinerBonuses> | null;
  manualOverrideActive: boolean;
  manualAdditiveTotals: Record<Stat, number> | null;
  computedAdditiveTotals: Record<Stat, number>;
}

function StatBreakdownCard({
  stat,
  troopType,
  breakdown,
  calculateResearchValue,
  troopTypeBonuses,
  totalTroopBonus,
  playerJoinerInfo,
  manualOverrideActive,
  manualAdditiveTotals,
  computedAdditiveTotals
}: StatBreakdownCardProps) {
  const researchTotal = totalTroopBonus[stat] || 0;
  const troopOnly = (troopTypeBonuses[troopType]?.[stat] || 0) - researchTotal;
  const researchTotalValue = calculateResearchValue(stat);

  const formatResearchDetail = (): string | null => {
    if (troopOnly === 0 && researchTotal === 0) return null;

    const troopPart = `Troop Type: ${troopOnly > 0 ? '+' : ''}${troopOnly.toFixed(2)}%`;
    const totalPart = `Total: ${researchTotal > 0 ? '+' : ''}${researchTotal.toFixed(2)}%`;
    return `(${troopPart}, ${totalPart})`;
  };

  const basicItems: BonusItem[] = [
    { label: 'Research', value: researchTotalValue, detail: formatResearchDetail() },
    { label: 'Alliance Tech', value: breakdown.allianceTech[stat] },
    { label: 'Experts', value: breakdown.experts[stat] },
    { label: 'Daybreak Island', value: breakdown.daybreakIsland[stat] },
    { label: 'Pets', value: breakdown.pets[stat] },
    { label: 'Skins', value: breakdown.skins[stat] },
    { label: 'Hero (Leader)', value: breakdown.hero[stat] },
    { label: 'Chief Gear', value: breakdown.chiefGear[stat] },
    { label: 'Charms', value: breakdown.charms[stat] },
    { label: 'Hero Gear', value: breakdown.heroGear[stat] },
    { label: 'Alliance Facilities', value: breakdown.allianceFacilities[stat] },
    { label: 'Pet Refinement', value: breakdown.petRefinement[stat] },
    { label: 'War Academy', value: breakdown.warAcademy[stat] },
    { label: 'Special Heroes', value: breakdown.specialHeroes[stat] },
    { label: 'VIP Prestige', value: breakdown.vipPrestige[stat] },
    { label: 'Globe', value: breakdown.globe[stat] }
  ];

  const additiveItems = buildAdditiveItems({
    stat,
    breakdown,
    playerJoinerInfo,
    manualOverrideActive,
    manualAdditiveTotals,
    computedAdditiveTotals
  });

  const total = sumTotal(stat, breakdown, manualAdditiveTotals ?? computedAdditiveTotals, calculateResearchValue);

  return (
    <SectionCard
      title={stat.charAt(0).toUpperCase() + stat.slice(1)}
      description={`Total: ${total > 0 ? '+' : ''}${total.toFixed(2)}%`}
      collapsible
      defaultCollapsed
    >
      <BonusSection title="Basic Bonuses" items={basicItems} />
      <BonusSection title="Additive Bonuses" items={additiveItems} />
    </SectionCard>
  );
}

function buildAdditiveItems({
  stat,
  breakdown,
  playerJoinerInfo,
  manualOverrideActive,
  manualAdditiveTotals,
  computedAdditiveTotals
}: {
  stat: Stat;
  breakdown: BonusBreakdown;
  playerJoinerInfo: ReturnType<typeof extractJoinerBonuses> | null;
  manualOverrideActive: boolean;
  manualAdditiveTotals: Record<Stat, number> | null;
  computedAdditiveTotals: Record<Stat, number>;
}): BonusItem[] {
  const specialBuffsValue = breakdown.specialBuffs[stat];
  const joinerAddValue = Math.min(playerJoinerInfo?.additive?.[stat] || 0, specialBuffsValue);
  const otherSpecialBuffs = specialBuffsValue - joinerAddValue;

  const additiveTotalForStat = (manualAdditiveTotals ?? computedAdditiveTotals)[stat];
  const referenceAdditiveTotal = computedAdditiveTotals[stat];
  const manualOverrideValue = manualAdditiveTotals?.[stat];
  const usingManualOverride = manualOverrideActive && manualOverrideValue !== undefined && manualOverrideValue !== null;

  const baseAdditiveItems: BonusItem[] = [
    { label: 'Temporary Events', value: breakdown.temporaryEvents[stat], muted: usingManualOverride },
    { label: 'Supreme President', value: breakdown.supremePresident[stat], muted: usingManualOverride },
    { label: 'Joiners (Special Buffs)', value: joinerAddValue, muted: usingManualOverride },
    { label: 'Special Buffs (Other)', value: otherSpecialBuffs, muted: usingManualOverride }
  ];

  if (usingManualOverride) {
    return [
      { label: 'Manual Override', value: additiveTotalForStat, highlight: true, alwaysShow: true },
      { label: 'Calculated Total (reference)', value: referenceAdditiveTotal, muted: true, alwaysShow: true },
      ...baseAdditiveItems
    ];
  }

  return baseAdditiveItems;
}

function BonusSection({ title, items }: { title: string; items: BonusItem[] }) {
  return (
    <div className="mb-4 sm:mb-5 last:mb-0">
      <div className="text-sm sm:text-base font-bold text-bonus-section-header mb-3 pb-2 border-b-2 border-slate-700/60 [data-theme='light']:border-gray-300 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-400 [data-theme='light']:bg-blue-600" />
        {title}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-2.5 text-xs sm:text-sm">
        {items.map((item) => {
          const isZero = item.value === 0;
          const showZeroState = isZero && !item.alwaysShow;

          if (showZeroState) {
            return (
              <div key={item.label} className="flex justify-between items-center py-2 px-3 rounded-lg opacity-40 hover:opacity-60 transition-opacity">
                <span className="text-bonus-zero truncate pr-2 font-medium">{item.label}:</span>
                <span className="text-bonus-zero-value shrink-0 font-semibold">0.00%</span>
              </div>
            );
          }

          const containerClasses = [
            'flex justify-between items-center py-2 px-3 rounded-lg transition-all duration-200',
            item.highlight
              ? `border-2 border-emerald-400/70 bg-linear-to-r from-emerald-500/15 to-teal-500/15 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 [data-theme='light']:from-emerald-50 [data-theme='light']:to-teal-50 [data-theme='light']:border-emerald-400`
              : "hover:bg-slate-800/60 hover:shadow-md [data-theme='light']:hover:bg-gray-100",
            item.muted ? 'opacity-60' : ''
          ]
            .filter(Boolean)
            .join(' ');

          const valueClass = item.highlight
            ? `font-bold text-bonus-total bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent [data-theme='light']:from-emerald-600 [data-theme='light']:to-teal-600`
            : 'font-bold text-bonus-additive';

          return (
            <div key={item.label} className={containerClasses}>
              <span className="text-bonus-label font-semibold truncate pr-2">{item.label}:</span>
              <div className="text-right shrink-0">
                <span className={valueClass}>
                  {item.value > 0 ? '+' : ''}
                  {item.value.toFixed(2)}%
                </span>
                {item.detail && <div className="text-xs text-bonus-detail mt-1 whitespace-nowrap opacity-75">{item.detail}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
