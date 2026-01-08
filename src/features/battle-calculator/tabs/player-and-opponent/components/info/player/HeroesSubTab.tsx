'use client';

import type { HeroGearSelections } from '@/domain/battle';
import type { BasicBonuses } from '@/domain/battle/calculations';
import type { HeroLevel, UserProfile } from '@/shared/types';

import HeroSelector from '@/features/battle-calculator/tabs/player-and-opponent/components/hero/HeroSelector';

export default function PlayerHeroesSubTab({
  currentProfile,
  setCurrentProfile
}: {
  currentProfile: UserProfile;
  setCurrentProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}) {
  return (
    <div>
      <HeroSelector
        heroLevels={currentProfile.heroLevels || {}}
        onHeroLevelsChange={(heroLevels: Record<string, HeroLevel>) => {
          setCurrentProfile({
            ...currentProfile,
            heroLevels
          });
        }}
        basicBonuses={currentProfile.basicBonuses}
        onBasicBonusesChange={(bonuses: BasicBonuses) => {
          setCurrentProfile({
            ...currentProfile,
            basicBonuses: bonuses
          });
        }}
        heroGearSelections={currentProfile.heroGearSelections}
        onHeroGearSelectionsChange={(selections: HeroGearSelections) => {
          setCurrentProfile({
            ...currentProfile,
            heroGearSelections: selections
          });
        }}
      />
    </div>
  );
}
