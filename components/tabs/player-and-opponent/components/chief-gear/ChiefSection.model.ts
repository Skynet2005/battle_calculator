'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { getAllCommandCenterLevels } from '@/lib/battle/data/command_center/command_center';
import { getChiefCharmBonuses, getChiefGearBonuses } from '@/lib/battle/data-extractors';
import { getChiefGearTypes } from '@/lib/battle/data-selectors';
import type { BasicBonuses } from '@/lib/battle/calculations';

import {
  getDefaultChiefGearSelections,
  getDefaultCharmLevels,
  parseGearSelectValue,
  type ChiefGearSelections,
  type CharmLevelsByPiece,
} from './chief-gear.utils';

export type ChiefActiveSection = 'gear' | 'charms' | 'commandCenter';

export interface ChiefSectionProps {
  basicBonuses: BasicBonuses;
  onBasicBonusesChange: (bonuses: BasicBonuses) => void;

  chiefGearSelections?: ChiefGearSelections;
  onChiefGearSelectionsChange?: (selections: ChiefGearSelections) => void;

  charmLevels?: CharmLevelsByPiece;
  onCharmLevelsChange?: (levels: CharmLevelsByPiece) => void;

  commandCenterLevel?: string;
  onCommandCenterLevelChange?: (level: string) => void;
}

export function useChiefSectionModel({
  basicBonuses,
  onBasicBonusesChange,
  chiefGearSelections: providedGearSelections,
  onChiefGearSelectionsChange,
  charmLevels: providedCharmLevels,
  onCharmLevelsChange,
  commandCenterLevel: providedCommandCenterLevel,
  onCommandCenterLevelChange,
}: ChiefSectionProps) {
  const [activeSection, setActiveSection] = useState<ChiefActiveSection>('gear');

  const gearTypes = useMemo(() => getChiefGearTypes(), []);
  const commandCenterLevels = useMemo(() => getAllCommandCenterLevels(), []);
  const currentCommandCenterLevel = providedCommandCenterLevel || '';

  const safeChiefGearSelections = useMemo<ChiefGearSelections>(() => {
    const defaults = getDefaultChiefGearSelections();
    if (providedGearSelections && Object.keys(providedGearSelections).length > 0) {
      return { ...defaults, ...providedGearSelections };
    }
    return defaults;
  }, [providedGearSelections]);

  const safeCharmLevels = useMemo<CharmLevelsByPiece>(() => {
    const defaults = getDefaultCharmLevels();
    if (providedCharmLevels && Object.keys(providedCharmLevels).length > 0) {
      return { ...defaults, ...providedCharmLevels };
    }
    return defaults;
  }, [providedCharmLevels]);

  // Update Chief Gear bonuses (only when parent is persisting selections)
  useEffect(() => {
    if (providedGearSelections === undefined || onChiefGearSelectionsChange === undefined) return;

    const gearBonuses = getChiefGearBonuses(safeChiefGearSelections);
    if (
      basicBonuses.chiefGear.attack !== gearBonuses.attack ||
      basicBonuses.chiefGear.defense !== gearBonuses.defense
    ) {
      onBasicBonusesChange({
        ...basicBonuses,
        chiefGear: gearBonuses,
      });
    }
  }, [
    safeChiefGearSelections,
    providedGearSelections,
    onChiefGearSelectionsChange,
    basicBonuses,
    onBasicBonusesChange,
  ]);

  // Update Charm bonuses (only when parent is persisting levels)
  useEffect(() => {
    if (providedCharmLevels === undefined || onCharmLevelsChange === undefined) return;

    const charmBonuses = getChiefCharmBonuses(safeCharmLevels);
    const currentCharms = basicBonuses.charms;

    if (
      currentCharms.infantry.lethality !== charmBonuses.infantry.lethality ||
      currentCharms.infantry.health !== charmBonuses.infantry.health ||
      currentCharms.lancer.lethality !== charmBonuses.lancer.lethality ||
      currentCharms.lancer.health !== charmBonuses.lancer.health ||
      currentCharms.marksman.lethality !== charmBonuses.marksman.lethality ||
      currentCharms.marksman.health !== charmBonuses.marksman.health
    ) {
      onBasicBonusesChange({
        ...basicBonuses,
        charms: charmBonuses,
      });
    }
  }, [
    safeCharmLevels,
    providedCharmLevels,
    onCharmLevelsChange,
    basicBonuses,
    onBasicBonusesChange,
  ]);

  const handleGearChange = useCallback(
    (gearType: string, value: string) => {
      if (!value || !onChiefGearSelectionsChange) return;

      const parsed = parseGearSelectValue(value);
      if (!parsed) return;

      const updated: ChiefGearSelections = {
        ...safeChiefGearSelections,
        [gearType]: parsed,
      };

      onChiefGearSelectionsChange(updated);
    },
    [onChiefGearSelectionsChange, safeChiefGearSelections]
  );

  const handleCharmChange = useCallback(
    (gearPiece: string, charmIndex: number, value: string) => {
      if (!onCharmLevelsChange) return;

      const next = { ...safeCharmLevels };
      if (!next[gearPiece]) next[gearPiece] = [0, 0, 0];

      const cloned = [...next[gearPiece]];
      cloned[charmIndex] = parseInt(value, 10) || 0;

      next[gearPiece] = cloned;
      onCharmLevelsChange(next);
    },
    [onCharmLevelsChange, safeCharmLevels]
  );

  return {
    // state
    activeSection,
    setActiveSection,

    // data
    gearTypes,
    commandCenterLevels,
    currentCommandCenterLevel,

    // derived-safe
    safeChiefGearSelections,
    safeCharmLevels,

    // handlers
    handleGearChange,
    handleCharmChange,
    onCommandCenterLevelChange,
  };
}
