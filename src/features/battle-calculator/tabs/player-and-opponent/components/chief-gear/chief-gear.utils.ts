import {
  getMaxCharmLevel,
  getMaxChiefGearOption,
} from '@/domain/battle/data/max-levels';
import {
  getCharmLevels,
  getChiefGearTypes,
} from '@/domain/battle/data-selectors';

export type ChiefGearSelection = { tier: string; stars: number; step?: number };
export type ChiefGearSelections = Record<string, ChiefGearSelection>;
export type CharmLevelsByPiece = Record<string, number[]>;

export const GEAR_PIECES = ['Cap', 'Watch', 'Coat', 'Pants', 'Ring', 'Weapon'] as const;
export type GearPiece = (typeof GEAR_PIECES)[number];

export function getDefaultChiefGearSelections(): ChiefGearSelections {
  const gearTypes = getChiefGearTypes();
  const defaults: ChiefGearSelections = {};
  for (const gearType of gearTypes) {
    const maxOption = getMaxChiefGearOption(gearType);
    if (maxOption) defaults[gearType] = maxOption;
  }
  return defaults;
}

export function getDefaultCharmLevels(): CharmLevelsByPiece {
  const max = getMaxCharmLevel();
  return {
    Cap: [max, max, max],
    Watch: [max, max, max],
    Coat: [max, max, max],
    Pants: [max, max, max],
    Ring: [max, max, max],
    Weapon: [max, max, max],
  };
}

/**
 * Backwards-compatible parsing of your select value:
 *   `${tier}-${stars}-${step}`
 * Robust even if `tier` contains hyphens by splitting from the end.
 */
export function parseGearSelectValue(value: string): ChiefGearSelection | null {
  if (!value) return null;

  const lastDash = value.lastIndexOf('-');
  if (lastDash < 0) return null;

  const secondLastDash = value.lastIndexOf('-', lastDash - 1);
  if (secondLastDash < 0) return null;

  const tier = value.slice(0, secondLastDash);
  const starsStr = value.slice(secondLastDash + 1, lastDash);
  const stepStr = value.slice(lastDash + 1);

  const stars = parseInt(starsStr, 10);
  const stepNum = parseInt(stepStr, 10);

  if (Number.isNaN(stars)) return null;

  return {
    tier,
    stars,
    step: Number.isNaN(stepNum) ? undefined : (stepNum === 0 ? 0 : stepNum),
  };
}

export function toGearSelectValue(sel?: ChiefGearSelection): string {
  if (!sel) return '';
  const step = sel.step !== undefined ? sel.step : 0;
  return `${sel.tier}-${sel.stars}-${step}`;
}

export function getTroopTypeForPiece(piece: string): 'Lancer' | 'Infantry' | 'Marksman' {
  return piece === 'Cap' || piece === 'Watch'
    ? 'Lancer'
    : piece === 'Coat' || piece === 'Pants'
      ? 'Infantry'
      : 'Marksman';
}

export function computeCharmTotals(
  levels: number[] | undefined,
  charmData: Array<{ level: number; lethality: number; health: number }>
): { lethality: number; health: number } {
  const safe = levels && levels.length === 3 ? levels : [0, 0, 0];

  const lethality = safe.reduce((sum, lvl) => {
    const c = charmData.find((x) => x.level === lvl);
    return sum + (c ? c.lethality : 0);
  }, 0);

  const health = safe.reduce((sum, lvl) => {
    const c = charmData.find((x) => x.level === lvl);
    return sum + (c ? c.health : 0);
  }, 0);

  return { lethality, health };
}

export function getCharmData() {
  return getCharmLevels();
}
