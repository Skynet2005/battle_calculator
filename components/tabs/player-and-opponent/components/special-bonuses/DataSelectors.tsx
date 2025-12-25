'use client';

import type { ExpertSelections } from '@/lib/battle';
import type { AdditiveBonuses, BasicBonuses, MultiplicativeBonuses } from '@/lib/battle/calculations';
import type { RallyConfiguration } from '@/components/types';

import { useDataSelectorsModel } from './DataSelectors.model';
import DataSelectorsTabs from './DataSelectorsTabs';
import ExpertsSection from './ExpertsSection';
import SkinsSection from './SkinsSection';
import DaybreakIslandSection from './DaybreakIslandSection';
import SpecialBonusesSection from './SpecialBonusesSection';

interface DataSelectorsProps {
  basicBonuses: BasicBonuses;
  onBasicBonusesChange: (bonuses: BasicBonuses) => void;

  expertSelections: ExpertSelections;
  onExpertSelectionsChange: (selections: ExpertSelections) => void;

  additiveBonuses?: AdditiveBonuses;
  onAdditiveBonusesChange?: (bonuses: AdditiveBonuses) => void;

  multiplicativeBonuses?: MultiplicativeBonuses;
  onMultiplicativeBonusesChange?: (bonuses: MultiplicativeBonuses) => void;

  rally?: RallyConfiguration;
  isOpponent?: boolean;
}

export default function DataSelectors(props: DataSelectorsProps) {
  const vm = useDataSelectorsModel(props);

  return (
    <div>
      <DataSelectorsTabs activeSection={vm.activeSection} onChange={vm.setActiveSection} />

      {vm.activeSection === 'experts' && (
        <ExpertsSection
          expertSelections={vm.expertSelections}
          onChangeStat={vm.updateExpertStat}
          onChangeCapacity={vm.updateExpertCapacity}
        />
      )}

      {vm.activeSection === 'skins' && (
        <SkinsSection stackedSkins={vm.stackedSkins} onChange={vm.updateStackedSkin} />
      )}

      {vm.activeSection === 'daybreakIsland' && (
        <DaybreakIslandSection
          daybreakIsland={vm.daybreakIsland}
          onChangeStat={vm.updateDaybreak}
          onChangeCapacity={vm.updateDaybreakCapacity}
        />
      )}

      {vm.activeSection === 'specialBonuses' && (
        <SpecialBonusesSection
          basicBonuses={props.basicBonuses}
          onBasicBonusesChange={props.onBasicBonusesChange}
          vipSelectValue={vm.vipSelectValue}
          onVipChange={vm.updateVipSelection}
          onToggleSpecialHero={vm.toggleSpecialHero}
          additiveBonuses={props.additiveBonuses ? vm.safeAdditiveBonuses : undefined}
          onChangeAdditive={
            props.additiveBonuses && props.onAdditiveBonusesChange ? vm.updateAdditive : undefined
          }
          contributingHeroes={vm.contributingHeroes}
        />
      )}
    </div>
  );
}
