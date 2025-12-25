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

export interface MHResult {
    progress: GearProgress;
    displayLevel: string;
    empowermentTier: EmpowermentTier;

    baseMH: number;
    masteryForged: boolean;
    masteryLevel: number;
    masteryForgeMultiplier: number;
    effectiveMultiplier: number;
    totalMH: number;

    marksman_health_pct: number;
    marksman_attack_pct: number;
    marksman_defense_pct: number;
    marksman_power: number;

    warnings: string[];
}

export const GLOVE_MH_BY_LEVEL: readonly number[] = MYTHIC_1_100;
export const GLOVE_MH_BY_PLUS: readonly number[] = LEGENDARY_1_100;
export const GLOVE_POWER_BY_LEVEL: readonly number[] = POWER_MYTHIC_1_100;
export const GLOVE_POWER_BY_PLUS: readonly number[] = POWER_LEGENDARY_1_100;

// Custom displayLevel for marksman glove (includes "Mythic"/"Legendary" prefix)
function displayLevelMarksmanGlove(p: GearProgress): string {
    if (p.rarity === "mythic") {
        return `Mythic Lv.${p.level}`;
    } else {
        return `Legendary +${p.plus}`;
    }
}

function sumGloveEmpowermentBonuses(tier: EmpowermentTier): { atk: number; def: number } {
    let atk = 0;
    let def = 0;

    if (tier >= 20) {
        def += 20.0;
    }
    if (tier >= 60) {
        atk += 30.0;
    }
    if (tier >= 100) {
        def += 50.0;
    }

    return { atk, def };
}

export function calc_glove_marksman_mh(
    p: GearProgress,
    mastery_forged: boolean,
    masteryLevel: number = 0,
): MHResult {
    const warnings: string[] = [];

    const clampedMasteryLevel = Math.max(0, Math.min(20, Math.floor(masteryLevel)));

    const masteryForgeMultiplier = mastery_forged
        ? safeAt(MASTERY_FORGED_MULTIPLIER, clampedMasteryLevel, "MASTERY_FORGED_MULTIPLIER", warnings)
        : 0;

    const effectiveMultiplier = mastery_forged
        ? (1 + masteryForgeMultiplier)
        : 1;

    let baseMH: number;
    if (p.rarity === "mythic") {
        baseMH = safeAt(GLOVE_MH_BY_LEVEL, p.level - 1, "GLOVE_MH_BY_LEVEL", warnings);
    } else {
        baseMH = safeAt(GLOVE_MH_BY_PLUS, p.plus - 1, "GLOVE_MH_BY_PLUS", warnings);
    }

    const totalMH = round2(baseMH * effectiveMultiplier);

    const empowermentTier: EmpowermentTier = p.rarity === "legendary" ? empowermentTierFromPlus(p.plus) : 0;
    const { atk: marksman_attack_pct, def: marksman_defense_pct } = sumGloveEmpowermentBonuses(empowermentTier);

    const powerIndex = unifiedPowerIndex(p);

    let marksman_power: number;
    if (mastery_forged && masteryLevel >= 10) {
        marksman_power = getMasteryPower("glove", powerIndex, masteryLevel, mastery_forged);
    } else {
        marksman_power = safeAt(GLOVE_POWER_BY_LEVEL, powerIndex, "GLOVE_POWER_BY_LEVEL", warnings);
    }

    return {
        progress: p,
        displayLevel: displayLevelMarksmanGlove(p),
        empowermentTier,

        baseMH,
        masteryForged: mastery_forged,
        masteryLevel,
        masteryForgeMultiplier,
        effectiveMultiplier,
        totalMH,

        marksman_health_pct: totalMH,
        marksman_attack_pct,
        marksman_defense_pct,
        marksman_power,

        warnings
    };
}
