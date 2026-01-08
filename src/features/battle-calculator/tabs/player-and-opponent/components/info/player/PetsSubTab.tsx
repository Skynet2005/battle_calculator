'use client';

import type { UserProfile } from '@/shared/types';
import PetsSection from '@/features/battle-calculator/tabs/player-and-opponent/components/pets-section';

export default function PlayerPetsSubTab({
  currentProfile,
  setCurrentProfile
}: {
  currentProfile: UserProfile;
  setCurrentProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}) {
  return (
    <div>
      <PetsSection
        basicBonuses={currentProfile.basicBonuses}
        onBasicBonusesChange={(bonuses) => {
          setCurrentProfile({
            ...currentProfile,
            basicBonuses: bonuses
          });
        }}
        multiplicativeBonuses={currentProfile.multiplicativeBonuses}
        onMultiplicativeBonusesChange={(bonuses) => {
          setCurrentProfile({
            ...currentProfile,
            multiplicativeBonuses: bonuses
          });
        }}
        capacity={currentProfile.capacity || { rally: 0, march: 0 }}
        onCapacityChange={(capacity) => {
          setCurrentProfile({
            ...currentProfile,
            capacity
          });
        }}
        petSkillSelections={currentProfile.petSkillSelections}
        onPetSkillSelectionsChange={(selections) => {
          setCurrentProfile({
            ...currentProfile,
            petSkillSelections: selections
          });
        }}
      />
    </div>
  );
}
