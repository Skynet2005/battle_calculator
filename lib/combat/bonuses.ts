import type {
  AdditiveBonuses,
  DamageModifier,
  SpecialBonuses,
  TroopStats,
  TroopType
} from "./types";

export const TROOP_TYPES: TroopType[] = ["Infantry", "Lancer", "Marksman"];

type StatKey = keyof TroopStats;

const ZERO_STATS: TroopStats = { attack: 0, defense: 0, health: 0, lethality: 0 };

export function zeroStats(): TroopStats {
  return { ...ZERO_STATS };
}

export function cloneStats(stats: Partial<TroopStats> | undefined): TroopStats {
  return {
    attack: stats?.attack ?? 0,
    defense: stats?.defense ?? 0,
    health: stats?.health ?? 0,
    lethality: stats?.lethality ?? 0
  };
}

/**
 * Aggregates additive bonuses by troop type including "All" bucket.
 */
export function aggregateAdditive(additive: AdditiveBonuses): Record<TroopType, TroopStats> {
  return TROOP_TYPES.reduce<Record<TroopType, TroopStats>>((acc, type) => {
    const base = cloneStats(additive?.All);
    const specific = cloneStats(additive?.[type]);
    acc[type] = {
      attack: base.attack + specific.attack,
      defense: base.defense + specific.defense,
      health: base.health + specific.health,
      lethality: base.lethality + specific.lethality
    };
    return acc;
  }, {} as Record<TroopType, TroopStats>);
}

/**
 * Special-like bonuses stack via Whiteout Survival rule:
 * finalPercent = base + special + (base * special / 100)
 * Multiple specials apply sequentially in deterministic order (sorted by key).
 */
export function applySpecialFormula(base: number, special: number): number {
  return base + special + (base * special) / 100;
}

export function aggregateSpecial(
  base: Record<TroopType, TroopStats>,
  special: SpecialBonuses
): Record<TroopType, TroopStats> {
  const orderedKeys: StatKey[] = ["attack", "defense", "health", "lethality"];
  return TROOP_TYPES.reduce<Record<TroopType, TroopStats>>((acc, type) => {
    const baseStats = base[type];
    const specialAll = cloneStats(special?.All);
    const specialType = cloneStats(special?.[type]);
    const combined = orderedKeys.reduce((next, key) => {
      const first = applySpecialFormula(baseStats[key], specialAll[key]);
      const second = applySpecialFormula(first, specialType[key]);
      return { ...next, [key]: second };
    }, {} as TroopStats);
    acc[type] = combined;
    return acc;
  }, {} as Record<TroopType, TroopStats>);
}

export function computeEffectiveStats(
  base: Record<TroopType, TroopStats>,
  additive: AdditiveBonuses,
  special: SpecialBonuses
): Record<TroopType, { additive: TroopStats; special: TroopStats; final: TroopStats }> {
  const additiveTotals = aggregateAdditive(additive);
  const specialTotals = aggregateSpecial(additiveTotals, special);
  return TROOP_TYPES.reduce((acc, type) => {
    const final: TroopStats = {
      attack: base[type].attack * (1 + specialTotals[type].attack / 100),
      defense: base[type].defense * (1 + specialTotals[type].defense / 100),
      health: base[type].health * (1 + specialTotals[type].health / 100),
      lethality: base[type].lethality * (1 + specialTotals[type].lethality / 100)
    };
    acc[type] = { additive: additiveTotals[type], special: specialTotals[type], final };
    return acc;
  }, {} as Record<TroopType, { additive: TroopStats; special: TroopStats; final: TroopStats }>);
}

/**
 * Enforces "same buff type cannot stack" by stackingKey: keep strongest magnitude per key.
 */
export function enforceStacking<T extends { stackingKey?: string; magnitude?: number }>(
  items: T[]
): T[] {
  const bestByKey = new Map<string, T>();
  items.forEach((item) => {
    if (!item.stackingKey) {
      return;
    }
    const existing = bestByKey.get(item.stackingKey);
    if (!existing || Math.abs(item.magnitude ?? 0) > Math.abs(existing.magnitude ?? 0)) {
      bestByKey.set(item.stackingKey, item);
    }
  });
  const filtered = items.filter((item) => {
    if (!item.stackingKey) return true;
    return bestByKey.get(item.stackingKey) === item;
  });
  return filtered;
}

export function normalizeModifiers(
  modifiers: DamageModifier[],
  stackingBehavior: "strict" | "permissive"
): DamageModifier[] {
  if (stackingBehavior === "permissive") {
    return modifiers;
  }
  return enforceStacking(modifiers);
}
