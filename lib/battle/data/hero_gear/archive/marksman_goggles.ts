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

export interface MLResult {
    progress: GearProgress;
    displayLevel: string;
    empowermentTier: EmpowermentTier;

    baseML: number;
    masteryForged: boolean;
    masteryLevel: number;
    masteryForgeMultiplier: number;
    effectiveMultiplier: number;
    totalML: number;

    marksman_lethality_pct: number;
    marksman_attack_pct: number;
    marksman_defense_pct: number;
    marksman_power: number;

    warnings: string[];
}

export const GOGGLES_ML_BY_LEVEL: readonly number[] = MYTHIC_1_100;
export const GOGGLES_ML_BY_PLUS: readonly number[] = LEGENDARY_1_100;
export const GOGGLES_POWER_BY_LEVEL: readonly number[] = POWER_MYTHIC_1_100;
export const GOGGLES_POWER_BY_PLUS: readonly number[] = POWER_LEGENDARY_1_100;

function sumGogglesEmpowermentBonuses(tier: EmpowermentTier): { atk: number; def: number } {
    let atk = 0;
    let def = 0;
    if (tier >= 20) atk += 20.0;
    if (tier >= 60) def += 30.0;
    if (tier >= 100) atk += 50.0;
    return { atk, def };
}

export function calcGogglesMarksmanML(
    p: GearProgress,
    mastery_forged: boolean,
    masteryLevel: number = 0,
): MLResult {
    const warnings: string[] = [];

    const clampedMasteryLevel = Math.max(0, Math.min(20, Math.floor(masteryLevel)));

    const masteryForgeMultiplier = mastery_forged
        ? safeAt(MASTERY_FORGED_MULTIPLIER, clampedMasteryLevel, "MASTERY_FORGED_MULTIPLIER", warnings)
        : 0;

    const effectiveMultiplier = mastery_forged
        ? (1 + masteryForgeMultiplier)
        : 1;

    let baseML: number;
    if (p.rarity === "mythic") {
        baseML = safeAt(GOGGLES_ML_BY_LEVEL, p.level - 1, "GOGGLES_ML_BY_LEVEL", warnings);
    } else {
        baseML = safeAt(GOGGLES_ML_BY_PLUS, p.plus - 1, "GOGGLES_ML_BY_PLUS", warnings);
    }

    const totalML = round2(baseML * effectiveMultiplier);

    const empowermentTier: EmpowermentTier = p.rarity === "legendary" ? empowermentTierFromPlus(p.plus) : 0;
    const { atk: marksman_attack_pct, def: marksman_defense_pct } = sumGogglesEmpowermentBonuses(empowermentTier);

    const powerIndex = unifiedPowerIndex(p);

    let marksman_power: number;
    if (mastery_forged && masteryLevel >= 10) {
        marksman_power = getMasteryPower("goggles", powerIndex, masteryLevel, mastery_forged);
    } else {
        marksman_power = safeAt(GOGGLES_POWER_BY_LEVEL, powerIndex, "GOGGLES_POWER_BY_LEVEL", warnings);
    }

    return {
        progress: p,
        displayLevel: displayLevel(p),
        empowermentTier,

        baseML,
        masteryForged: mastery_forged,
        masteryLevel,
        masteryForgeMultiplier,
        effectiveMultiplier,
        totalML,

        marksman_lethality_pct: totalML,
        marksman_attack_pct,
        marksman_defense_pct,
        marksman_power,

        warnings
    };
}
