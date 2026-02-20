/**
 * Capacity and bonus summary types shared between domain and features.
 * Domain code (e.g. battle-calculator-helpers) can import these without depending on features.
 */

export interface SpecialBonusSummary {
  troopsAttack: number;
  troopsDefense: number;
  troopsLethality: number;
  troopsHealth: number;
  enemyAttackReduction: number;
  enemyDefenseReduction: number;
  defenderAttack: number;
  defenderHealth: number;
  rallyAttack: number;
  rallyLethality: number;
  breakdown?: {
    pet: Record<'attack' | 'defense' | 'lethality' | 'health', number>;
    city: Record<'attack' | 'defense' | 'lethality' | 'health', number>;
    combat: Record<'attack' | 'defense' | 'lethality' | 'health', number>;
    special: Record<'attack' | 'defense' | 'lethality' | 'health', number>;
    joiner: Record<'attack' | 'defense' | 'lethality' | 'health', number> & { damageReduction?: number; names: string[] };
    enemyAttack: { city: number; combat: number; joiner: number; pet?: number; manual?: number };
    enemyDefense: { city: number; combat: number; joiner: number; pet?: number; manual?: number };
  };
}

export interface CapacityBreakdown {
  total: number;
  base: number;
  temporary: number;
  manualOverride: boolean;
  breakdown: Array<{ label: string; value: number }>;
  temporaryBreakdown: Array<{ label: string; value: number }>;
}

export interface CapacityReport {
  deployment: CapacityBreakdown;
  rally: CapacityBreakdown;
}
