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

export const BOOT_LL_BY_LEVEL: readonly number[] = MYTHIC_1_100;
export const BOOT_LL_BY_PLUS: readonly number[] = LEGENDARY_1_100;
export const BOOT_POWER_BY_LEVEL: readonly number[] = POWER_MYTHIC_1_100;
export const BOOT_POWER_BY_PLUS: readonly number[] = POWER_LEGENDARY_1_100;

function sumBootEmpowermentBonuses(tier: EmpowermentTier): { atk: number; def: number } {
    let atk = 0.0;
    let def = 0.0;
    if (tier >= 20) def += 20.0;
    if (tier >= 60) atk += 30.0;
    if (tier >= 100) def += 50.0;
    return { atk, def };
}

export function calc_boot_lancer_ll(
    p: GearProgress,
    mastery_forged: boolean,
    masteryLevel: number = 0,
): LLResult {
    const warnings: string[] = [];

    const clampedMasteryLevel = Math.max(0, Math.min(20, Math.floor(masteryLevel)));

    const masteryForgeMultiplier = mastery_forged
        ? safeAt(MASTERY_FORGED_MULTIPLIER, clampedMasteryLevel, "MASTERY_FORGED_MULTIPLIER", warnings)
        : 0;

    const effectiveMultiplier = mastery_forged
        ? (1 + masteryForgeMultiplier)
        : 1;

    let baseLL: number;
    if (p.rarity === "mythic") {
        baseLL = safeAt(BOOT_LL_BY_LEVEL, p.level - 1, "BOOT_LL_BY_LEVEL", warnings);
    } else {
        baseLL = safeAt(BOOT_LL_BY_PLUS, p.plus - 1, "BOOT_LL_BY_PLUS", warnings);
    }

    const totalLL = round2(baseLL * effectiveMultiplier);

    const empowermentTier: EmpowermentTier = p.rarity === "legendary" ? empowermentTierFromPlus(p.plus) : 0;
    const { atk: lancer_attack_pct, def: lancer_defense_pct } = sumBootEmpowermentBonuses(empowermentTier);

    const powerIndex = unifiedPowerIndex(p);

    let lancer_power: number;
    if (mastery_forged && masteryLevel >= 10) {
        lancer_power = getMasteryPower("boot", powerIndex, masteryLevel, mastery_forged);
    } else {
        lancer_power = safeAt(BOOT_POWER_BY_LEVEL, powerIndex, "BOOT_POWER_BY_LEVEL", warnings);
    }

    return {
        progress: p,
        displayLevel: displayLevel(p),
        empowermentTier,

        baseLL,
        masteryForged: mastery_forged,
        masteryLevel,
        masteryForgeMultiplier,
        effectiveMultiplier,
        totalLL,

        lancer_lethality_pct: totalLL,
        lancer_attack_pct,
        lancer_defense_pct,
        lancer_power,

        warnings
    };
}
