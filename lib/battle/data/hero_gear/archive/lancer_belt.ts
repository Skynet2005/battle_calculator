import { getMasteryPower } from "../../mastery-power-utils";
import {
    displayLevel,
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

export const BELT_LH_BY_LEVEL: readonly number[] = MYTHIC_1_100;
export const BELT_LH_BY_PLUS: readonly number[] = LEGENDARY_1_100;
export const BELT_POWER_BY_LEVEL: readonly number[] = POWER_MYTHIC_1_100;
export const BELT_POWER_BY_PLUS: readonly number[] = POWER_LEGENDARY_1_100;

function sumBeltEmpowermentBonuses(tier: EmpowermentTier): { atk: number; def: number } {
    let atk = 0;
    let def = 0;
    if (tier >= 20) atk += 20.0;
    if (tier >= 60) def += 30.0;
    if (tier >= 100) atk += 50.0;
    return { atk, def };
}

export function calcBeltLancerLH(
    p: GearProgress,
    mastery_forged: boolean,
    masteryLevel: number = 0,
): LHResult {
    const warnings: string[] = [];

    const mLvl = mastery_forged ? Math.max(0, Math.min(20, Math.floor(masteryLevel))) : 0;

    const masteryForgeMultiplier = safeAt(MASTERY_FORGED_MULTIPLIER, mLvl, "MASTERY_FORGED_MULTIPLIER", warnings);
    const effectiveMultiplier = 1 + masteryForgeMultiplier;

    let baseLH: number;
    if (p.rarity === "mythic") {
        baseLH = safeAt(BELT_LH_BY_LEVEL, p.level - 1, "BELT_LH_BY_LEVEL", warnings);
    } else {
        baseLH = safeAt(BELT_LH_BY_PLUS, p.plus - 1, "BELT_LH_BY_PLUS", warnings);
    }

    const totalLH = round2(baseLH * effectiveMultiplier);

    const empowermentTier: EmpowermentTier = p.rarity === "legendary" ? empowermentTierFromPlus(p.plus) : 0;
    const { atk: lancer_attack_pct, def: lancer_defense_pct } = sumBeltEmpowermentBonuses(empowermentTier);

    const powerIndex = unifiedPowerIndex(p);

    let lancer_power: number;
    if (mastery_forged && masteryLevel >= 10) {
        lancer_power = getMasteryPower("belt", powerIndex, masteryLevel, mastery_forged);
    } else {
        lancer_power = safeAt(BELT_POWER_BY_LEVEL, powerIndex, "BELT_POWER_BY_LEVEL", warnings);
    }

    return {
        progress: p,
        displayLevel: displayLevel(p),
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
