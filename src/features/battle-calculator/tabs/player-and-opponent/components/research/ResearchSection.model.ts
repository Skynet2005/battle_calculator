'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import type { BasicBonuses } from '@/domain/battle/calculations';
import { getResearchBonuses, getWarAcademyBonuses } from '@/domain/battle/data-extractors';
import { getResearchCategories, getWarAcademyTech } from '@/domain/battle/data-selectors';
import { getMaxWarAcademyLevels } from '@/domain/battle/data/max-levels';

import { buildDefaultResearchSelections, type ResearchSelections } from './research.utils';

export type ResearchActiveSection = 'research' | 'warAcademy';

export interface ResearchSectionProps {
  basicBonuses: BasicBonuses;
  onBasicBonusesChange: (bonuses: BasicBonuses) => void;

  warAcademySelections?: Record<string, number>;
  onWarAcademySelectionsChange?: (selections: Record<string, number>) => void;
}

export function useResearchSectionModel({
  basicBonuses,
  onBasicBonusesChange,
  warAcademySelections: providedWarAcademySelections,
  onWarAcademySelectionsChange,
}: ResearchSectionProps) {
  const [activeSection, setActiveSection] = useState<ResearchActiveSection>('research');

  // Static-ish data
  const researchCategories = useMemo(() => getResearchCategories(), []);
  const warAcademyData = useMemo(() => getWarAcademyTech(), []);
  const maxWarAcademyLevels = useMemo(() => getMaxWarAcademyLevels(), []);

  // Research selections (LOCAL ONLY, defaults to max) — matches your current behavior
  const [researchSelections, setResearchSelections] = useState<ResearchSelections>(() => buildDefaultResearchSelections());

  // War Academy selections — local mirror that syncs to prop + notifies parent on changes
  const [localWarAcademySelections, setLocalWarAcademySelections] = useState<Record<string, number>>(() => {
    return providedWarAcademySelections || maxWarAcademyLevels;
  });

  useEffect(() => {
    if (providedWarAcademySelections) {
      setLocalWarAcademySelections(providedWarAcademySelections);
    }
  }, [providedWarAcademySelections]);

  const warAcademySelections = localWarAcademySelections;

  const setWarAcademySelections = useCallback(
    (selections: Record<string, number>) => {
      setLocalWarAcademySelections(selections);
      onWarAcademySelectionsChange?.(selections);
    },
    [onWarAcademySelectionsChange]
  );

  const updateResearchTier = useCallback(
    (category: string, tierLabel: string, level: number) => {
      setResearchSelections((prev) => ({
        ...prev,
        [category]: {
          ...prev[category],
          [tierLabel]: level,
        },
      }));
    },
    []
  );

  // Update Research bonuses
  useEffect(() => {
    const researchBonuses = getResearchBonuses(researchSelections, 'infantry');

    const newCombatTech = {
      ...basicBonuses.combatTech,
      troopTypeBonus: {
        infantry: {
          attack: researchBonuses.troopTypeBonus.infantry.attack,
          defense: researchBonuses.troopTypeBonus.infantry.defense,
          lethality: researchBonuses.troopTypeBonus.infantry.lethality,
          health: researchBonuses.troopTypeBonus.infantry.health,
        },
        lancer: {
          attack: researchBonuses.troopTypeBonus.lancer.attack,
          defense: researchBonuses.troopTypeBonus.lancer.defense,
          lethality: researchBonuses.troopTypeBonus.lancer.lethality,
          health: researchBonuses.troopTypeBonus.lancer.health,
        },
        marksman: {
          attack: researchBonuses.troopTypeBonus.marksman.attack,
          defense: researchBonuses.troopTypeBonus.marksman.defense,
          lethality: researchBonuses.troopTypeBonus.marksman.lethality,
          health: researchBonuses.troopTypeBonus.marksman.health,
        },
      },
      totalTroopBonus: researchBonuses.totalTroopBonus,
    };

    const currentCombatTech = basicBonuses.combatTech;

    const troopTypeChanged =
      currentCombatTech.troopTypeBonus.infantry.attack !== newCombatTech.troopTypeBonus.infantry.attack ||
      currentCombatTech.troopTypeBonus.infantry.defense !== newCombatTech.troopTypeBonus.infantry.defense ||
      currentCombatTech.troopTypeBonus.infantry.lethality !== newCombatTech.troopTypeBonus.infantry.lethality ||
      currentCombatTech.troopTypeBonus.infantry.health !== newCombatTech.troopTypeBonus.infantry.health ||
      currentCombatTech.troopTypeBonus.lancer.attack !== newCombatTech.troopTypeBonus.lancer.attack ||
      currentCombatTech.troopTypeBonus.lancer.defense !== newCombatTech.troopTypeBonus.lancer.defense ||
      currentCombatTech.troopTypeBonus.lancer.lethality !== newCombatTech.troopTypeBonus.lancer.lethality ||
      currentCombatTech.troopTypeBonus.lancer.health !== newCombatTech.troopTypeBonus.lancer.health ||
      currentCombatTech.troopTypeBonus.marksman.attack !== newCombatTech.troopTypeBonus.marksman.attack ||
      currentCombatTech.troopTypeBonus.marksman.defense !== newCombatTech.troopTypeBonus.marksman.defense ||
      currentCombatTech.troopTypeBonus.marksman.lethality !== newCombatTech.troopTypeBonus.marksman.lethality ||
      currentCombatTech.troopTypeBonus.marksman.health !== newCombatTech.troopTypeBonus.marksman.health;

    const totalChanged =
      currentCombatTech.totalTroopBonus.attack !== newCombatTech.totalTroopBonus.attack ||
      currentCombatTech.totalTroopBonus.defense !== newCombatTech.totalTroopBonus.defense ||
      currentCombatTech.totalTroopBonus.lethality !== newCombatTech.totalTroopBonus.lethality ||
      currentCombatTech.totalTroopBonus.health !== newCombatTech.totalTroopBonus.health;

    if (troopTypeChanged || totalChanged) {
      onBasicBonusesChange({
        ...basicBonuses,
        combatTech: newCombatTech,
      });
    }
  }, [researchSelections, basicBonuses, onBasicBonusesChange]);

  // Update War Academy bonuses
  useEffect(() => {
    const academyBonuses = getWarAcademyBonuses(warAcademySelections);

    const currentWarAcademy = basicBonuses.warAcademy || {
      infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
      lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
      marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
    };

    const hasChanged =
      currentWarAcademy.infantry.attack !== academyBonuses.infantry.attack ||
      currentWarAcademy.infantry.defense !== academyBonuses.infantry.defense ||
      currentWarAcademy.infantry.lethality !== academyBonuses.infantry.lethality ||
      currentWarAcademy.infantry.health !== academyBonuses.infantry.health ||
      currentWarAcademy.lancer.attack !== academyBonuses.lancer.attack ||
      currentWarAcademy.lancer.defense !== academyBonuses.lancer.defense ||
      currentWarAcademy.lancer.lethality !== academyBonuses.lancer.lethality ||
      currentWarAcademy.lancer.health !== academyBonuses.lancer.health ||
      currentWarAcademy.marksman.attack !== academyBonuses.marksman.attack ||
      currentWarAcademy.marksman.defense !== academyBonuses.marksman.defense ||
      currentWarAcademy.marksman.lethality !== academyBonuses.marksman.lethality ||
      currentWarAcademy.marksman.health !== academyBonuses.marksman.health;

    if (hasChanged) {
      onBasicBonusesChange({
        ...basicBonuses,
        warAcademy: academyBonuses,
      });
    }
  }, [warAcademySelections, basicBonuses, onBasicBonusesChange]);

  return {
    activeSection,
    setActiveSection,

    // research
    researchSelections,
    updateResearchTier,
    researchCategories,

    // war academy
    warAcademySelections,
    setWarAcademySelections,
    warAcademyData,
  };
}
