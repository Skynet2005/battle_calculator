'use client';

import type { UserProfile } from '@/shared/types';
import ResearchSection from '@/features/battle-calculator/tabs/player-and-opponent/components/research/ResearchSection';

export default function PlayerResearchSubTab({
  currentProfile,
  setCurrentProfile
}: {
  currentProfile: UserProfile;
  setCurrentProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}) {
  return (
    <div>
      <ResearchSection
        basicBonuses={currentProfile.basicBonuses}
        onBasicBonusesChange={(bonuses) => {
          setCurrentProfile({
            ...currentProfile,
            basicBonuses: bonuses
          });
        }}
        warAcademySelections={currentProfile.warAcademySelections}
        onWarAcademySelectionsChange={(selections) => {
          setCurrentProfile({
            ...currentProfile,
            warAcademySelections: selections
          });
        }}
      />
    </div>
  );
}
