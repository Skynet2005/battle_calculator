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

export const BELT_MH_BY_LEVEL: readonly number[] = MYTHIC_1_100;
export const BELT_MH_BY_PLUS: readonly number[] = LEGENDARY_1_100;
export const BELT_POWER_BY_LEVEL: readonly number[] = POWER_MYTHIC_1_100;
export const BELT_POWER_BY_PLUS: readonly number[] = POWER_LEGENDARY_1_100;

// Custom displayLevel for marksman belt (includes "Mythic"/"Legendary" prefix)
function displayLevelMarksmanBelt(p: GearProgress): string {
    if (p.rarity === "mythic") {
        return `Mythic Lv.${p.level}`;
    } else {
        return `Legendary +${p.plus}`;
    }
}

function sumBeltEmpowermentBonuses(tier: EmpowermentTier): { atk: number; def: number } {
    let atk = 0.0;
    let def = 0.0;
    if (tier >= 20) atk += 20.0;
    if (tier >= 60) def += 30.0;
    if (tier >= 100) atk += 50.0;
    return { atk, def };
}

export function calcBeltMarksmanMH(
    p: GearProgress,
    mastery_forged: boolean,
    masteryLevel: number = 0,
): MHResult {
    const warnings: string[] = [];

    const mLvl = mastery_forged ? Math.max(0, Math.min(20, Math.floor(masteryLevel))) : 0;

    const masteryForgeMultiplier = safeAt(MASTERY_FORGED_MULTIPLIER, mLvl, "MASTERY_FORGED_MULTIPLIER", warnings);
    const effectiveMultiplier = 1 + masteryForgeMultiplier;

    let baseMH: number;
    if (p.rarity === "mythic") {
        baseMH = safeAt(BELT_MH_BY_LEVEL, p.level - 1, "BELT_MH_BY_LEVEL", warnings);
    } else {
        baseMH = safeAt(BELT_MH_BY_PLUS, p.plus - 1, "BELT_MH_BY_PLUS", warnings);
    }

    const totalMH = round2(baseMH * effectiveMultiplier);

    const empowermentTier: EmpowermentTier = p.rarity === "legendary" ? empowermentTierFromPlus(p.plus) : 0;
    const { atk: marksman_attack_pct, def: marksman_defense_pct } = sumBeltEmpowermentBonuses(empowermentTier);

    const powerIndex = unifiedPowerIndex(p);

    let marksman_power: number;
    if (mastery_forged && masteryLevel >= 10) {
        marksman_power = getMasteryPower("belt", powerIndex, masteryLevel, mastery_forged);
    } else {
        marksman_power = safeAt(BELT_POWER_BY_LEVEL, powerIndex, "BELT_POWER_BY_LEVEL", warnings);
    }

    return {
        progress: p,
        displayLevel: displayLevelMarksmanBelt(p),
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
