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

export interface LHResult {
    progress: GearProgress;
    displayLevel: string;
    empowermentTier: EmpowermentTier;

    baseLH: number;
    masteryForged: boolean;
    masteryLevel: number;
    masteryForgeMultiplier: number;
    effectiveMultiplier: number;
    totalLH: number;

    lancer_health_pct: number;
    lancer_attack_pct: number;
    lancer_defense_pct: number;
    lancer_power: number;

    warnings: string[];
}

export const GLOVE_LH_BY_LEVEL: readonly number[] = MYTHIC_1_100;
export const GLOVE_LH_BY_PLUS: readonly number[] = LEGENDARY_1_100;
export const GLOVE_POWER_BY_LEVEL: readonly number[] = POWER_MYTHIC_1_100;
export const GLOVE_POWER_BY_PLUS: readonly number[] = POWER_LEGENDARY_1_100;

// Custom displayLevel for lancer glove (includes "Mythic"/"Legendary" prefix)
function displayLevelLancerGlove(p: GearProgress): string {
    if (p.rarity === "mythic") {
        return `Mythic Lv.${p.level}`;
    } else {
        return `Legendary +${p.plus}`;
    }
}

interface GloveEmpowermentBonus {
    atk: number;
    def: number;
}

function sumGloveEmpowermentBonuses(tier: EmpowermentTier): GloveEmpowermentBonus {
    let atk = 0.0;
    let def = 0.0;

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

export function calc_glove_lancer_lh(
    p: GearProgress,
    mastery_forged: boolean,
    masteryLevel: number = 0,
): LHResult {
    const warnings: string[] = [];

    const clampedMasteryLevel = Math.max(0, Math.min(20, Math.floor(masteryLevel)));

    const masteryForgeMultiplier = mastery_forged
        ? safeAt(MASTERY_FORGED_MULTIPLIER, clampedMasteryLevel, "MASTERY_FORGED_MULTIPLIER", warnings)
        : 0;

    const effectiveMultiplier = mastery_forged
        ? (1 + masteryForgeMultiplier)
        : 1;

    let baseLH: number;
    if (p.rarity === "mythic") {
        baseLH = safeAt(GLOVE_LH_BY_LEVEL, p.level - 1, "GLOVE_LH_BY_LEVEL", warnings);
    } else {
        baseLH = safeAt(GLOVE_LH_BY_PLUS, p.plus - 1, "GLOVE_LH_BY_PLUS", warnings);
    }

    const totalLH = round2(baseLH * effectiveMultiplier);

    const empowermentTier: EmpowermentTier = p.rarity === "legendary" ? empowermentTierFromPlus(p.plus) : 0;
    const { atk: lancer_attack_pct, def: lancer_defense_pct } = sumGloveEmpowermentBonuses(empowermentTier);

    const powerIndex = unifiedPowerIndex(p);

    let lancer_power: number;
    if (mastery_forged && masteryLevel >= 10) {
        lancer_power = getMasteryPower("glove", powerIndex, masteryLevel, mastery_forged);
    } else {
        lancer_power = safeAt(GLOVE_POWER_BY_LEVEL, powerIndex, "GLOVE_POWER_BY_LEVEL", warnings);
    }

    return {
        progress: p,
        displayLevel: displayLevelLancerGlove(p),
        empowermentTier,

        baseLH,
        masteryForged: mastery_forged,
        masteryLevel,
        masteryForgeMultiplier,
        effectiveMultiplier,
        totalLH,

        lancer_health_pct: totalLH,
        lancer_attack_pct,
        lancer_defense_pct,
        lancer_power,

        warnings
    };
}
