'use client';

import { useEffect, useMemo, useState } from "react";
import type { HeroGearSelections as OldHeroGearSelections } from "@/domain/battle";
import type { BasicBonuses } from "@/domain/battle/calculations";
import { heroGearRegistry } from "./heroGearRegistry";
import HeroGearSelectorPanel, {
  createDefaultLoadout,
  type GearComputed,
  type GearPiece,
  type GearSelection,
  type HeroGearLoadout,
  type HeroGearRegistry,
  type TroopType
} from "./HeroGearSelectorPanel";

// ============================================================================
// Types
// ============================================================================

type HeroGearSelectorProps = {
  basicBonuses: BasicBonuses;
  onBasicBonusesChange: (bonuses: BasicBonuses) => void;
  heroGearSelections?: OldHeroGearSelections;
  onHeroGearSelectionsChange?: (selections: OldHeroGearSelections) => void;
};

// ============================================================================
// Constants
// ============================================================================

const TROOPS: readonly TroopType[] = ["infantry", "lancer", "marksman"];
const PIECES: readonly GearPiece[] = ["belt", "boots", "gloves", "goggles"];

// ============================================================================
// Utility Functions
// ============================================================================

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  const x = Math.floor(n);
  return Math.min(Math.max(x, min), max);
}

// ============================================================================
// Legacy Conversion Functions
// ============================================================================

/**
 * Map legacy HeroGearSelections (level 1-200, empowermentLevel) to the new loadout model.
 */
function legacyToLoadout(sel?: OldHeroGearSelections): HeroGearLoadout {
  const base = createDefaultLoadout();
  if (!sel) return base;

  const mapPiece = (cfg: any): GearSelection => {
    const level = clampInt(cfg?.level ?? 1, 1, 200);
    const masteryForged = Boolean(cfg?.masteryForged);
    const masteryLevel = clampInt(cfg?.masteryLevel ?? 0, 0, 20);
    const essenceLevel = clampInt(cfg?.essenceLevel ?? 0, 0, 20);

    if (level <= 100) {
      return {
        progress: { rarity: "mythic", level },
        masteryForged,
        masteryLevel,
        essenceLevel
      };
    }
    const plus = clampInt(level - 100, 1, 100);
    return {
      progress: { rarity: "legendary", plus },
      masteryForged,
      masteryLevel,
      essenceLevel
    };
  };

  const next = createDefaultLoadout();
  for (const t of TROOPS) {
    const troopCfg = (sel as any)[t];
    if (!troopCfg) continue;
    for (const p of PIECES) {
      next[t][p] = mapPiece((troopCfg as any)[p]);
    }
  }
  return next;
}

/**
 * Map new loadout back to legacy HeroGearSelections for storage.
 */
function loadoutToLegacy(loadout: HeroGearLoadout): OldHeroGearSelections {
  const out: any = {};

  const empowermentFromPlus = (plus: number): number => {
    if (plus >= 100) return 100;
    if (plus >= 80) return 80;
    if (plus >= 60) return 60;
    if (plus >= 40) return 40;
    if (plus >= 20) return 20;
    return 0;
  };

  for (const t of TROOPS) {
    out[t] = {};
    for (const p of PIECES) {
      const sel = loadout[t][p];
      const isMythic = sel.progress.rarity === "mythic";
      const mythicLevel = isMythic ? clampInt((sel.progress as any).level, 0, 100) : 0;
      const legendaryPlus = !isMythic ? clampInt((sel.progress as any).plus, 1, 100) : 0;
      const level = isMythic ? Math.max(1, mythicLevel) : 100 + legendaryPlus;
      const empowermentLevel = isMythic ? 0 : empowermentFromPlus(legendaryPlus);

      out[t][p] = {
        level,
        masteryForged: sel.masteryForged,
        masteryLevel: sel.masteryForged ? clampInt(sel.masteryLevel, 0, 20) : 0,
        essenceLevel: sel.masteryForged ? clampInt(sel.essenceLevel, 0, 20) : 0,
        empowermentLevel,
        stacking: "additive"
      };
    }
  }
  return out as OldHeroGearSelections;
}

// ============================================================================
// Computation Functions
// ============================================================================

function computeHeroGearBonuses(loadout: HeroGearLoadout, registry: typeof heroGearRegistry) {
  const totals: Record<TroopType, { attack: number; defense: number; health: number; lethality: number; power: number; warnings: string[] }> = {
    infantry: { attack: 0, defense: 0, health: 0, lethality: 0, power: 0, warnings: [] },
    lancer: { attack: 0, defense: 0, health: 0, lethality: 0, power: 0, warnings: [] },
    marksman: { attack: 0, defense: 0, health: 0, lethality: 0, power: 0, warnings: [] }
  };

  const computedPieces: Record<TroopType, Record<GearPiece, GearComputed>> = {
    infantry: { belt: null as any, boots: null as any, gloves: null as any, goggles: null as any },
    lancer: { belt: null as any, boots: null as any, gloves: null as any, goggles: null as any },
    marksman: { belt: null as any, boots: null as any, gloves: null as any, goggles: null as any }
  };

  for (const t of TROOPS) {
    for (const p of PIECES) {
      const r = registry[t][p](loadout[t][p]);
      computedPieces[t][p] = r;
      totals[t].attack += r.attackPct;
      totals[t].defense += r.defensePct;
      totals[t].power += r.power;
      totals[t].warnings.push(...r.warnings);

      // Boots and goggles contribute to lethality, belt and gloves to health
      if (p === "boots" || p === "goggles") {
        totals[t].lethality += r.totalMainStatPct;
      } else {
        totals[t].health += r.totalMainStatPct;
      }
    }
  }

  return { totals, computedPieces };
}

// ============================================================================
// Component
// ============================================================================

export default function HeroGearSelector({
  basicBonuses,
  onBasicBonusesChange,
  heroGearSelections,
  onHeroGearSelectionsChange
}: HeroGearSelectorProps) {
  const [loadout, setLoadout] = useState<HeroGearLoadout>(() => legacyToLoadout(heroGearSelections));

  // Keep local state in sync if parent provides updated legacy selections
  useEffect(() => {
    setLoadout(legacyToLoadout(heroGearSelections));
  }, [heroGearSelections]);

  const totals = useMemo(() => computeHeroGearBonuses(loadout, heroGearRegistry).totals, [loadout]);

  // Push hero gear bonuses into basic bonuses on change
  useEffect(() => {
    onBasicBonusesChange({
      ...basicBonuses,
      heroGear: {
        infantry: {
          attack: totals.infantry.attack,
          defense: totals.infantry.defense,
          lethality: totals.infantry.lethality,
          health: totals.infantry.health
        },
        lancer: {
          attack: totals.lancer.attack,
          defense: totals.lancer.defense,
          lethality: totals.lancer.lethality,
          health: totals.lancer.health
        },
        marksman: {
          attack: totals.marksman.attack,
          defense: totals.marksman.defense,
          lethality: totals.marksman.lethality,
          health: totals.marksman.health
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totals]);

  const handleLoadoutChange = (next: HeroGearLoadout) => {
    setLoadout(next);
    if (onHeroGearSelectionsChange) {
      onHeroGearSelectionsChange(loadoutToLegacy(next));
    }
  };

  return (
    <HeroGearSelectorPanel
      registry={heroGearRegistry as unknown as HeroGearRegistry}
      initialLoadout={loadout}
      onLoadoutChange={handleLoadoutChange}
    />
  );
}
