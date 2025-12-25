import { getMasteryPower } from "../../mastery-power-utils";
import {
    EmpowermentTier,
    empowermentTierFromPlus,
    GearProgress,
    LEGENDARY_1_100,
    MASTERY_FORGED_MULTIPLIER,
    MYTHIC_1_100,
    POWER_LEGENDARY_1_100,
    POWER_MYTHIC_1_100,
    round2,
    safeAt,
    unifiedPowerIndex
} from "../gear-tables";

export interface LLResult {
    progress: GearProgress;
    displayLevel: string;
    empowermentTier: EmpowermentTier;

    baseLL: number;
    masteryForged: boolean;
    masteryLevel: number;
    masteryForgeMultiplier: number;
    effectiveMultiplier: number;
    totalLL: number;

    lancer_lethality_pct: number;
    lancer_attack_pct: number;
    lancer_defense_pct: number;
    lancer_power: number;

    warnings: string[];
}

export const GOGGLES_LL_BY_LEVEL: readonly number[] = MYTHIC_1_100;
export const GOGGLES_LL_BY_PLUS: readonly number[] = LEGENDARY_1_100;
export const GOGGLES_POWER_BY_LEVEL: readonly number[] = POWER_MYTHIC_1_100;
export const GOGGLES_POWER_BY_PLUS: readonly number[] = POWER_LEGENDARY_1_100;

// Custom displayLevel for lancer goggles (includes "Mythic"/"Legendary" prefix)
function displayLevelLancerGoggles(p: GearProgress): string {
    if (p.rarity === "mythic") {
        return `Mythic Lv.${p.level}`;
    } else {
        return `Legendary +${p.plus}`;
    }
}

function sumGogglesEmpowermentBonuses(tier: EmpowermentTier): { atk: number; def: number } {
    let atk = 0.0;
    let def = 0.0;
    if (tier >= 20) atk += 20.0;
    if (tier >= 60) def += 30.0;
    if (tier >= 100) atk += 50.0;
    return { atk, def };
}

export function calcGogglesLancerLL(
    p: GearProgress,
    mastery_forged: boolean,
    masteryLevel: number = 0,
): LLResult {
    const warnings: string[] = [];

    const clampedMasteryLevel = mastery_forged ? Math.max(0, Math.min(20, Math.floor(masteryLevel))) : 0;

    const masteryForgeMultiplier = safeAt(MASTERY_FORGED_MULTIPLIER, clampedMasteryLevel, "MASTERY_FORGED_MULTIPLIER", warnings);
    const effectiveMultiplier = 1 + masteryForgeMultiplier;

    let baseLL: number;
    if (p.rarity === "mythic") {
        baseLL = safeAt(GOGGLES_LL_BY_LEVEL, p.level - 1, "GOGGLES_LL_BY_LEVEL", warnings);
    } else {
        baseLL = safeAt(GOGGLES_LL_BY_PLUS, p.plus - 1, "GOGGLES_LL_BY_PLUS", warnings);
    }

    const totalLL = round2(baseLL * effectiveMultiplier);

    const empowermentTier: EmpowermentTier = p.rarity === "legendary" ? empowermentTierFromPlus(p.plus) : 0;
    const { atk: lancer_attack_pct, def: lancer_defense_pct } = sumGogglesEmpowermentBonuses(empowermentTier);

    const powerIndex = unifiedPowerIndex(p);

    let lancer_power: number;
    if (mastery_forged && clampedMasteryLevel >= 10) {
        lancer_power = getMasteryPower("goggles", powerIndex, clampedMasteryLevel, mastery_forged);
    } else {
        lancer_power = safeAt(GOGGLES_POWER_BY_LEVEL, powerIndex, "GOGGLES_POWER_BY_LEVEL", warnings);
    }

    return {
        progress: p,
        displayLevel: displayLevelLancerGoggles(p),
        empowermentTier,

        baseLL,
        masteryForged: mastery_forged,
        masteryLevel: clampedMasteryLevel, masteryForgeMultiplier,
        effectiveMultiplier,
        totalLL,

        lancer_lethality_pct: totalLL,
        lancer_attack_pct,
        lancer_defense_pct,
        lancer_power,

        warnings
    };
}
