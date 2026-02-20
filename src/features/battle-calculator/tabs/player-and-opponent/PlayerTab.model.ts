'use client';

import { useCallback, useMemo } from 'react';
import { createDefaultAdditiveBonuses, createDefaultMultiplicativeBonuses } from '@/domain/battle/battle-calculator-helpers';
import type { AdditiveManualOverride, MultiplicativeManualOverride } from '@/domain/battle/calculations';
import { extractJoinerBonuses } from '@/domain/rally/rally-bonus-extractor';
import type { CapacityReport, TroopMixConfig, UserProfile } from '@/shared/types';

export type SubTab = 'info' | 'heroes' | 'basic' | 'research' | 'chief' | 'pets';

export interface PlayerTabProps {
  currentProfile: UserProfile;
  setCurrentProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  profileSubTab: SubTab;
  onSubTabChange: (tab: SubTab) => void;
  playerCapacityReport: CapacityReport | null;
  playerJoinerInfo: ReturnType<typeof extractJoinerBonuses> | null;
  onSave: () => void;
  onTroopMixChange: (side: 'player', mix: TroopMixConfig) => void;
}

export function usePlayerTabModel({
  currentProfile,
  setCurrentProfile,
  playerJoinerInfo
}: Pick<PlayerTabProps, 'currentProfile' | 'setCurrentProfile' | 'playerJoinerInfo'>) {
  const effectivePlayerJoinerInfo = useMemo(() => {
    if (!currentProfile?.rally) return playerJoinerInfo;
    if (playerJoinerInfo) return playerJoinerInfo;

    return extractJoinerBonuses(
      currentProfile.rally.playerJoiners || currentProfile.rally.joiners || [],
      currentProfile.rally.specialWidgetBonus?.player || 'attacking'
    );
  }, [currentProfile?.rally, playerJoinerInfo]);

  const handleManualAdditiveOverrideChange = useCallback(
    (manualOverrideTotals?: AdditiveManualOverride) => {
      setCurrentProfile((prev) =>
        prev
          ? {
            ...prev,
            additiveBonuses: {
              ...createDefaultAdditiveBonuses(),
              ...(prev.additiveBonuses || createDefaultAdditiveBonuses()),
              manualOverrideTotals
            }
          }
          : prev
      );
    },
    [setCurrentProfile]
  );

  const handleManualMultiplicativeOverrideChange = useCallback(
    (manualOverrideTotals?: MultiplicativeManualOverride) => {
      setCurrentProfile((prev) =>
        prev
          ? {
            ...prev,
            multiplicativeBonuses: {
              ...createDefaultMultiplicativeBonuses(),
              ...(prev.multiplicativeBonuses || createDefaultMultiplicativeBonuses()),
              manualOverrideTotals
            }
          }
          : prev
      );
    },
    [setCurrentProfile]
  );

  return {
    effectivePlayerJoinerInfo,
    handleManualAdditiveOverrideChange,
    handleManualMultiplicativeOverrideChange
  };
}
