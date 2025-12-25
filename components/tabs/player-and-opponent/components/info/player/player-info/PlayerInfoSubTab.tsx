'use client';

import { useCallback, useMemo } from 'react';

import { getExpertBonuses } from '@/lib/battle';
import {
  createDefaultAdditiveBonuses,
  createDefaultMultiplicativeBonuses,
  defaultExpertSelections,
  TROOP_TYPE_LIST
} from '@/lib/battle/battle-calculator-helpers';
import { getChiefCharmBonuses, getChiefGearBonuses } from '@/lib/battle/data-extractors';
import { getMaxCharmLevel } from '@/lib/battle/index';
import { extractJoinerBonuses } from '@/lib/rally/rally-bonus-extractor';

import type { CapacityReport } from '@/components/tabs/player-and-opponent/components/battle-predictor';
import type { TroopMixConfig, UserProfile } from '@/components/types';

import type { CityBonuses } from './playerInfo.types';
import { buildDefaultCharmLevels, computePetSkillCalc, normalizeCityBonuses } from './playerInfo.utils';

import MultiplicativeBonusesCard from './sections/MultiplicativeBonusesCard';
import AdditiveBonusesCard from './sections/AdditiveBonusesCard';
import BonusSettingsCard from './sections/BonusSettingsCard';
import CapacityCard from './sections/CapacityCard';
import ProfileHeaderCard from './sections/ProfileHeaderCard';

export default function PlayerInfoSubTab({
  currentProfile,
  setCurrentProfile,
  playerCapacityReport,
  playerJoinerInfo,
  onSave,
  onTroopMixChange: _onTroopMixChange,
  handleManualAdditiveOverrideChange,
  handleManualMultiplicativeOverrideChange
}: {
  currentProfile: UserProfile;
  setCurrentProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  playerCapacityReport: CapacityReport | null;
  playerJoinerInfo: ReturnType<typeof extractJoinerBonuses> | null;
  onSave: () => void;
  onTroopMixChange: (side: 'player', mix: TroopMixConfig) => void;
  handleManualAdditiveOverrideChange: (manualOverrideTotals?: any) => void;
  handleManualMultiplicativeOverrideChange: (manualOverrideTotals?: any) => void;
}) {
  const updateProfile = useCallback(
    (fn: (prev: UserProfile) => UserProfile) => {
      setCurrentProfile((prev) => (prev ? fn(prev) : prev));
    },
    [setCurrentProfile]
  );

  const additiveBonuses = useMemo(
    () => currentProfile.additiveBonuses || createDefaultAdditiveBonuses(),
    [currentProfile.additiveBonuses]
  );

  const multiplicativeBonuses = useMemo(
    () => currentProfile.multiplicativeBonuses || createDefaultMultiplicativeBonuses(),
    [currentProfile.multiplicativeBonuses]
  );

  const cityBonuses: CityBonuses = useMemo(
    () => normalizeCityBonuses(multiplicativeBonuses.cityBonuses),
    [multiplicativeBonuses.cityBonuses]
  );

  const expertBonuses = useMemo(
    () => getExpertBonuses(currentProfile.expertSelections || defaultExpertSelections),
    [currentProfile.expertSelections]
  );

  const maxCharmLevel = useMemo(() => getMaxCharmLevel(), []);
  const defaultCharmLevels = useMemo(() => buildDefaultCharmLevels(maxCharmLevel), [maxCharmLevel]);

  const charmBonuses = useMemo(() => {
    return getChiefCharmBonuses(currentProfile.charmLevels || defaultCharmLevels) as any;
  }, [currentProfile.charmLevels, defaultCharmLevels]);

  const chiefGearBonuses = useMemo(() => {
    return currentProfile.chiefGearSelections
      ? getChiefGearBonuses(currentProfile.chiefGearSelections)
      : {
        attack: currentProfile.basicBonuses.chiefGear.attack || 0,
        defense: currentProfile.basicBonuses.chiefGear.defense || 0
      };
  }, [currentProfile.chiefGearSelections, currentProfile.basicBonuses.chiefGear.attack, currentProfile.basicBonuses.chiefGear.defense]);

  const petCalc = useMemo(() => computePetSkillCalc(currentProfile.petSkillSelections || {}), [currentProfile.petSkillSelections]);

  const petSkillsEnabled = currentProfile.petSkillsEnabled !== false;

  const handlePetSkillsEnabledChange = useCallback(
    (enabled: boolean) => {
      updateProfile((prev) => ({
        ...prev,
        petSkillsEnabled: enabled
      }));
    },
    [updateProfile]
  );

  const handleCityBonusChange = useCallback(
    <K extends keyof CityBonuses>(key: K, value: CityBonuses[K]) => {
      updateProfile((prev) => {
        const nextMult = prev.multiplicativeBonuses || createDefaultMultiplicativeBonuses();
        const nextCity = normalizeCityBonuses(nextMult.cityBonuses);
        return {
          ...prev,
          multiplicativeBonuses: {
            ...nextMult,
            cityBonuses: {
              ...nextCity,
              [key]: value
            }
          }
        };
      });
    },
    [updateProfile]
  );

  const handleTroopLevelChange = useCallback(
    (troop: any, value?: string) => {
      updateProfile((prev) => ({
        ...prev,
        troopLevels: {
          ...(prev.troopLevels || {}),
          [troop]: value
        }
      }));
    },
    [updateProfile]
  );

  const handleBaseCapacityChange = useCallback(
    (key: 'march' | 'rally', value: number) => {
      updateProfile((prev) => ({
        ...prev,
        baseCapacity: {
          ...(prev.baseCapacity || { rally: 0, march: 0 }),
          [key]: value
        }
      }));
    },
    [updateProfile]
  );

  return (
    <div>
      <ProfileHeaderCard
        profileName={currentProfile.name}
        createdAt={currentProfile.createdAt}
        updatedAt={currentProfile.updatedAt}
        onSave={onSave}
      />

      <BonusSettingsCard
        petSkillsEnabled={petSkillsEnabled}
        cityBonuses={cityBonuses}
        onPetSkillsEnabledChange={handlePetSkillsEnabledChange}
        onCityBonusChange={handleCityBonusChange}
      />

      <CapacityCard
        troopLevels={currentProfile.troopLevels || {}}
        baseCapacity={currentProfile.baseCapacity || { rally: 0, march: 0 }}
        playerCapacityReport={playerCapacityReport}
        onTroopLevelChange={handleTroopLevelChange}
        onBaseCapacityChange={handleBaseCapacityChange}
      />

      <AdditiveBonusesCard
        troopTypes={TROOP_TYPE_LIST as any}
        currentProfile={currentProfile}
        playerJoinerInfo={playerJoinerInfo}
        additiveBonuses={additiveBonuses}
        expertBonuses={expertBonuses}
        charmBonuses={charmBonuses}
        chiefGearBonuses={chiefGearBonuses}
        onManualOverrideChange={handleManualAdditiveOverrideChange}
      />

      <MultiplicativeBonusesCard
        troopTypes={TROOP_TYPE_LIST as any}
        cityBonuses={cityBonuses}
        playerJoinerInfo={playerJoinerInfo}
        petSkillsEnabled={petSkillsEnabled}
        petCalc={petCalc}
        multiplicativeBonuses={multiplicativeBonuses}
        onManualOverrideChange={handleManualMultiplicativeOverrideChange}
      />
    </div>
  );
}
