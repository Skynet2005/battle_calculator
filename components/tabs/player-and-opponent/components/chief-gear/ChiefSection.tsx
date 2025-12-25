'use client';

import type { BasicBonuses } from '@/lib/battle/calculations';
import ChiefTabs from './ChiefTabs';
import ChiefGearSection from './ChiefGearSection';
import CharmsSection from './CharmsSection';
import CommandCenterSection from './CommandCenterSection';
import { useChiefSectionModel, type ChiefSectionProps } from './ChiefSection.model';

export default function ChiefSection(props: ChiefSectionProps) {
  const vm = useChiefSectionModel(props);

  return (
    <div>
      <ChiefTabs activeSection={vm.activeSection} onChange={vm.setActiveSection} />

      {vm.activeSection === 'gear' && (
        <ChiefGearSection
          gearTypes={vm.gearTypes}
          selections={vm.safeChiefGearSelections}
          onGearChange={vm.handleGearChange}
        />
      )}

      {vm.activeSection === 'charms' && (
        <CharmsSection charmLevels={vm.safeCharmLevels} onCharmChange={vm.handleCharmChange} />
      )}

      {vm.activeSection === 'commandCenter' && (
        <CommandCenterSection
          currentCommandCenterLevel={vm.currentCommandCenterLevel}
          commandCenterLevels={vm.commandCenterLevels}
          onCommandCenterLevelChange={vm.onCommandCenterLevelChange}
        />
      )}
    </div>
  );
}
