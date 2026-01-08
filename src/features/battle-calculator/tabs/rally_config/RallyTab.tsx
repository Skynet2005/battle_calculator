import { Dispatch, SetStateAction } from 'react';
import type { SideBaseStats } from '@/domain/rally/combat-types';
import type { UserProfile } from '@/shared/types';
import RallyConfigurationComponent from './RallyConfiguration';
import RallyJoinerFormula from './RallyJoinerFormula';

interface RallyTabProps {
  currentProfile: UserProfile;
  setCurrentProfile: Dispatch<SetStateAction<UserProfile | null>>;
  playerBaseStats: SideBaseStats;
  opponentBaseStats: SideBaseStats;
}

export default function RallyTab({
  currentProfile,
  setCurrentProfile,
  playerBaseStats,
  opponentBaseStats
}: RallyTabProps) {
  const handleRallyChange = (rally: UserProfile['rally']) => {
    setCurrentProfile({
      ...currentProfile,
      rally
    });
  };

  return (
    <div className="tab-content active">
      <RallyConfigurationComponent
        rally={currentProfile.rally}
        onRallyChangeAction={handleRallyChange}
        playerHeroLevels={currentProfile.heroLevels}
        opponentHeroLevels={currentProfile.opponent?.heroLevels}
        playerBaseStats={playerBaseStats}
        opponentBaseStats={opponentBaseStats}
      />
      <RallyJoinerFormula rally={currentProfile.rally} />
    </div>
  );
}
