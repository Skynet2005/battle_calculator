'use client';

import type { CapacityReport } from '@/components/tabs/player-and-opponent/components/battle-predictor';
import type { TroopMixConfig, UserProfile } from '@/components/types';
import { extractJoinerBonuses } from '@/lib/rally/rally-bonus-extractor';

import PlayerSubTabs from './components/info/player/PlayerSubTabs';
import { usePlayerTabModel, type SubTab } from './PlayerTab.model';

import PlayerBasicSubTab from './components/info/player/BasicSubTab';
import PlayerChiefSubTab from './components/info/player/ChiefSubTab';
import PlayerHeroesSubTab from './components/info/player/HeroesSubTab';
import PlayerPetsSubTab from './components/info/player/PetsSubTab';
import PlayerInfoSubTab from './components/info/player/player-info/PlayerInfoSubTab';
import PlayerResearchSubTab from './components/info/player/ResearchSubTab';

type PlayerJoinerInfo = ReturnType<typeof extractJoinerBonuses>;

export interface PlayerTabProps {
  currentProfile: UserProfile;
  setCurrentProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  profileSubTab: SubTab;
  onSubTabChange: (tab: SubTab) => void;
  playerCapacityReport: CapacityReport | null;
  playerJoinerInfo: PlayerJoinerInfo | null;
  onSave: () => void;
  onTroopMixChange: (side: 'player', mix: TroopMixConfig) => void;
}

export default function PlayerTab({
  currentProfile,
  setCurrentProfile,
  profileSubTab,
  onSubTabChange,
  playerCapacityReport,
  playerJoinerInfo,
  onSave,
  onTroopMixChange
}: PlayerTabProps) {
  const vm = usePlayerTabModel({
    currentProfile,
    setCurrentProfile,
    playerJoinerInfo
  });

  const common = { currentProfile, setCurrentProfile };

  const renderActiveSubTab = () => {
    switch (profileSubTab) {
      case 'info':
        return (
          <PlayerInfoSubTab
            {...common}
            playerCapacityReport={playerCapacityReport}
            playerJoinerInfo={vm.effectivePlayerJoinerInfo}
            onSave={onSave}
            onTroopMixChange={onTroopMixChange}
            handleManualAdditiveOverrideChange={vm.handleManualAdditiveOverrideChange}
            handleManualMultiplicativeOverrideChange={vm.handleManualMultiplicativeOverrideChange}
          />
        );

      case 'heroes':
        return <PlayerHeroesSubTab {...common} />;

      case 'basic':
        return <PlayerBasicSubTab {...common} />;

      case 'research':
        return <PlayerResearchSubTab {...common} />;

      case 'chief':
        return <PlayerChiefSubTab {...common} />;

      case 'pets':
        return <PlayerPetsSubTab {...common} />;

      default:
        return null;
    }
  };

  return (
    <div className="tab-content active">
      <PlayerSubTabs active={profileSubTab} onChange={onSubTabChange} />
      {renderActiveSubTab()}
    </div>
  );
}
