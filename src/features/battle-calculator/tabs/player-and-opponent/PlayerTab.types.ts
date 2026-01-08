import type { TroopMixConfig, UserProfile } from '@/shared/types';
import type { CapacityReport } from '@/features/battle-calculator/model/types';
import { extractJoinerBonuses } from '@/domain/rally/rally-bonus-extractor';
import type { SubTab } from './PlayerTab.model';

export type PlayerJoinerInfo = ReturnType<typeof extractJoinerBonuses>;

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
