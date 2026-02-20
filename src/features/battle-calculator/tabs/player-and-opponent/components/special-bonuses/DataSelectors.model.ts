'use client';

import { useMemo, useState, useCallback } from 'react';
import type { ExpertSelections } from '@/domain/battle';
import { getExpertBonuses } from '@/domain/battle';
import type { AdditiveBonuses, BasicBonuses, MultiplicativeBonuses } from '@/domain/battle/calculations';
import type { RallyConfiguration } from '@/shared/types';
import {
  computeContributingHeroes,
  DEFAULT_ADDITIVE_BONUSES,
  DEFAULT_DAYBREAK,
  DEFAULT_EXPERT_SELECTIONS,
  DEFAULT_STACKED_SKINS,
  deriveVipSelectValue,
  STAT_KEYS,
  type DataSelectorsSection,
  type StatKey,
  vipValuesForSelect
} from './DataSelectors.utils';

export interface UseDataSelectorsModelArgs {
  basicBonuses: BasicBonuses;
  onBasicBonusesChange: (bonuses: BasicBonuses) => void;

  expertSelections: ExpertSelections;
  onExpertSelectionsChange: (selections: ExpertSelections) => void;

  additiveBonuses?: AdditiveBonuses;
  onAdditiveBonusesChange?: (bonuses: AdditiveBonuses) => void;

  multiplicativeBonuses?: MultiplicativeBonuses;
  onMultiplicativeBonusesChange?: (bonuses: MultiplicativeBonuses) => void;

  rally?: RallyConfiguration;
  isOpponent?: boolean;
}

export function useDataSelectorsModel({
  basicBonuses,
  onBasicBonusesChange,
  expertSelections: initialExpertSelections,
  onExpertSelectionsChange,
  additiveBonuses,
  onAdditiveBonusesChange,
  rally,
  isOpponent = false
}: UseDataSelectorsModelArgs) {
  const [activeSection, setActiveSection] = useState<DataSelectorsSection>('experts');

  const expertSelections = useMemo<ExpertSelections>(() => {
    if (!initialExpertSelections) return { ...DEFAULT_EXPERT_SELECTIONS };
    return {
      attack: initialExpertSelections.attack ?? 0,
      defense: initialExpertSelections.defense ?? 0,
      lethality: initialExpertSelections.lethality ?? 0,
      health: initialExpertSelections.health ?? 0,
      deploymentCapacity: initialExpertSelections.deploymentCapacity ?? 0,
      rallyCapacity: initialExpertSelections.rallyCapacity ?? 0
    };
  }, [initialExpertSelections]);

  const stackedSkins = useMemo(() => {
    return basicBonuses.stackedSkins || { ...DEFAULT_STACKED_SKINS };
  }, [basicBonuses.stackedSkins]);

  const daybreakIsland = useMemo(() => {
    if (!basicBonuses.daybreakIsland) return { ...DEFAULT_DAYBREAK };
    return {
      infantry: basicBonuses.daybreakIsland.infantry || DEFAULT_DAYBREAK.infantry,
      lancer: basicBonuses.daybreakIsland.lancer || DEFAULT_DAYBREAK.lancer,
      marksman: basicBonuses.daybreakIsland.marksman || DEFAULT_DAYBREAK.marksman,
      troops: basicBonuses.daybreakIsland.troops || DEFAULT_DAYBREAK.troops,
      deploymentCapacity: basicBonuses.daybreakIsland.deploymentCapacity ?? DEFAULT_DAYBREAK.deploymentCapacity,
      rallyCapacity: basicBonuses.daybreakIsland.rallyCapacity ?? DEFAULT_DAYBREAK.rallyCapacity
    };
  }, [basicBonuses.daybreakIsland]);

  const safeAdditiveBonuses = useMemo<AdditiveBonuses>(() => {
    if (!additiveBonuses) return { ...DEFAULT_ADDITIVE_BONUSES };
    return {
      temporaryEvents: additiveBonuses.temporaryEvents || DEFAULT_ADDITIVE_BONUSES.temporaryEvents,
      supremePresident: additiveBonuses.supremePresident || DEFAULT_ADDITIVE_BONUSES.supremePresident,
      specialBuffs: additiveBonuses.specialBuffs || DEFAULT_ADDITIVE_BONUSES.specialBuffs
    };
  }, [additiveBonuses]);

  const vipSelectValue = useMemo(() => deriveVipSelectValue(basicBonuses), [basicBonuses]);

  const contributingHeroes = useMemo(
    () => computeContributingHeroes(rally, isOpponent),
    [rally, isOpponent]
  );

  const updateExpertStat = useCallback(
    (stat: 'attack' | 'defense' | 'lethality' | 'health', next: number) => {
      const updated: ExpertSelections = { ...expertSelections, [stat]: next };

      // Update derived expert bonuses in basicBonuses
      const expertBonuses = getExpertBonuses(updated);
      onBasicBonusesChange({ ...basicBonuses, experts: expertBonuses });

      // Persist expert selections
      onExpertSelectionsChange(updated);
    },
    [basicBonuses, expertSelections, onBasicBonusesChange, onExpertSelectionsChange]
  );

  const updateExpertCapacity = useCallback(
    (field: 'deploymentCapacity' | 'rallyCapacity', next: number) => {
      const updated: ExpertSelections = { ...expertSelections, [field]: next };
      onExpertSelectionsChange(updated);
    },
    [expertSelections, onExpertSelectionsChange]
  );

  const updateStackedSkin = useCallback(
    (stat: StatKey, next: number) => {
      const updated = { ...stackedSkins, [stat]: next };
      onBasicBonusesChange({ ...basicBonuses, stackedSkins: updated });
    },
    [basicBonuses, onBasicBonusesChange, stackedSkins]
  );

  const updateDaybreak = useCallback(
    (
      section: 'infantry' | 'lancer' | 'marksman' | 'troops',
      stat: 'attack' | 'defense' | 'lethality' | 'health',
      next: number
    ) => {
      const subsection = daybreakIsland[section];
      const updated = {
        ...daybreakIsland,
        [section]: typeof subsection === 'object' && subsection !== null ? { ...subsection, [stat]: next } : { [stat]: next }
      };
      onBasicBonusesChange({ ...basicBonuses, daybreakIsland: updated });
    },
    [basicBonuses, daybreakIsland, onBasicBonusesChange]
  );

  const updateDaybreakCapacity = useCallback(
    (field: 'deploymentCapacity' | 'rallyCapacity', next: number) => {
      const updated = { ...daybreakIsland, [field]: next };
      onBasicBonusesChange({ ...basicBonuses, daybreakIsland: updated });
    },
    [basicBonuses, daybreakIsland, onBasicBonusesChange]
  );

  const updateVipSelection = useCallback(
    (value: string) => {
      const { vipPrestige, globe } = vipValuesForSelect(value);
      onBasicBonusesChange({ ...basicBonuses, vipPrestige, globe });
    },
    [basicBonuses, onBasicBonusesChange]
  );

  const toggleSpecialHero = useCallback(
    (hero: 'jeronimo' | 'natalia', checked: boolean) => {
      onBasicBonusesChange({
        ...basicBonuses,
        specialHeroes: {
          ...basicBonuses.specialHeroes,
          [hero]: checked
        }
      });
    },
    [basicBonuses, onBasicBonusesChange]
  );

  const updateAdditive = useCallback(
    (bucket: 'temporaryEvents' | 'supremePresident', stat: StatKey, next: number) => {
      if (!onAdditiveBonusesChange) return;
      const current = safeAdditiveBonuses[bucket];
      onAdditiveBonusesChange({
        ...safeAdditiveBonuses,
        [bucket]: { ...current, [stat]: next }
      });
    },
    [onAdditiveBonusesChange, safeAdditiveBonuses]
  );

  return {
    STAT_KEYS,

    // state
    activeSection,
    setActiveSection,

    // derived values
    expertSelections,
    stackedSkins,
    daybreakIsland,
    safeAdditiveBonuses,
    vipSelectValue,
    contributingHeroes,

    // handlers
    updateExpertStat,
    updateExpertCapacity,
    updateStackedSkin,
    updateDaybreak,
    updateDaybreakCapacity,
    updateVipSelection,
    toggleSpecialHero,
    updateAdditive
  };
}
