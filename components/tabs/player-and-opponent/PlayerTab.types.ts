import type { TroopMixConfig, UserProfile } from '@/components/types';
import type { CapacityReport } from '@/components/tabs/player-and-opponent/components/battle-predictor';
import { extractJoinerBonuses } from '@/lib/rally/rally-bonus-extractor';
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
