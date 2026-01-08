'use client';

import type { UserProfile } from '@/shared/types';
import ChiefSection from '@/features/battle-calculator/tabs/player-and-opponent/components/chief-gear/ChiefSection';

export default function PlayerChiefSubTab({
  currentProfile,
  setCurrentProfile
}: {
  currentProfile: UserProfile;
  setCurrentProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}) {
  return (
    <div>
      <ChiefSection
        basicBonuses={currentProfile.basicBonuses}
        onBasicBonusesChange={(bonuses) => {
          setCurrentProfile({
            ...currentProfile,
            basicBonuses: bonuses
          });
        }}
        chiefGearSelections={currentProfile.chiefGearSelections}
        onChiefGearSelectionsChange={(selections) => {
          setCurrentProfile({
            ...currentProfile,
            chiefGearSelections: selections
          });
        }}
        charmLevels={currentProfile.charmLevels}
        onCharmLevelsChange={(levels) => {
          setCurrentProfile({
            ...currentProfile,
            charmLevels: levels
          });
        }}
        commandCenterLevel={currentProfile.commandCenterLevel}
        onCommandCenterLevelChange={(level) => {
          setCurrentProfile({
            ...currentProfile,
            commandCenterLevel: level
          });
        }}
      />
    </div>
  );
}
