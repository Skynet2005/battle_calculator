/**
 * Profile Migration - Migrate old profile formats to new formats
 */

import { buildMaxHeroLevels, PETS_DATA } from '@/domain/battle';
import type { UserProfile } from '@/shared/types';

/** Input profile shape (API/storage); may be legacy or partial. */
export type LegacyProfile = Record<string, unknown>;

/** Internal mutable shape for in-place migration; avoids dozens of casts for nested access. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MutableProfile = Record<string, any>;

const defaultCharms = {
  infantry: { lethality: 0, health: 0 },
  lancer: { lethality: 0, health: 0 },
  marksman: { lethality: 0, health: 0 },
} as const;

type CharmsShape = {
  infantry: { lethality: number; health: number };
  lancer: { lethality: number; health: number };
  marksman: { lethality: number; health: number };
};

/**
 * Migrate charms from old format to new format
 */
function migrateCharms(oldCharms: unknown): CharmsShape {
  if (oldCharms && typeof oldCharms === 'object' && 'infantry' in oldCharms) {
    return oldCharms as CharmsShape;
  }
  return { ...defaultCharms };
}

const zeroDebuffs = { attack: 0, defense: 0, lethality: 0, health: 0 };

function sanitizeCombatDebuffs(
  combatDebuffs?: Record<string, unknown> | { attack?: number; defense?: number; lethality?: number; health?: number }
): { attack: number; defense: number; lethality: number; health: number } {
  const current = combatDebuffs && typeof combatDebuffs === 'object' ? combatDebuffs : zeroDebuffs;
  const n = (v: unknown) => Number(v) || 0;
  return {
    attack: Math.abs(n(current.attack)) > 200 ? 0 : n(current.attack),
    defense: Math.abs(n(current.defense)) > 200 ? 0 : n(current.defense),
    lethality: Math.abs(n(current.lethality)) > 200 ? 0 : n(current.lethality),
    health: Math.abs(n(current.health)) > 200 ? 0 : n(current.health),
  };
}

/**
 * Migrate a profile to the latest format
 */
export function migrateProfile(profile: LegacyProfile): UserProfile {
  const p = profile as MutableProfile;

  // Migrate charms
  const basicBonuses = p.basicBonuses as Record<string, unknown> | undefined;
  if (basicBonuses?.charms !== undefined) {
    basicBonuses.charms = migrateCharms(basicBonuses.charms);
  }

  // Ensure heroLevels exists; default to max levels when missing
  const maxHeroLevels = buildMaxHeroLevels();
  const heroLevels = p.heroLevels as Record<string, unknown> | undefined;
  if (!heroLevels || typeof heroLevels !== 'object' || Object.keys(heroLevels).length === 0) {
    p.heroLevels = maxHeroLevels;
  } else {
    Object.keys(heroLevels).forEach((heroName) => {
      const heroLevel = (heroLevels[heroName] as Record<string, unknown>) || {};
      const maxDefaults = maxHeroLevels[heroName] || { starLevel: 30, xpLevel: 80, skillLevels: {}, exclusiveWeaponLevel: 10 };
      (heroLevels as Record<string, unknown>)[heroName] = {
        starLevel: typeof heroLevel.starLevel === 'number' ? heroLevel.starLevel : maxDefaults.starLevel,
        xpLevel: typeof heroLevel.xpLevel === 'number' ? heroLevel.xpLevel : maxDefaults.xpLevel,
        skillLevels:
          heroLevel.skillLevels && typeof heroLevel.skillLevels === 'object'
            ? heroLevel.skillLevels
            : maxDefaults.skillLevels,
        exclusiveWeaponLevel:
          typeof heroLevel.exclusiveWeaponLevel === 'number'
            ? heroLevel.exclusiveWeaponLevel
            : maxDefaults.exclusiveWeaponLevel,
      };
    });
  }

  // Ensure all required structures exist
  if (!p.basicBonuses) {
    p.basicBonuses = {
      combatTech: {
        troopTypeBonus: {
          infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
          lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
          marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
        },
        totalTroopBonus: { attack: 0, defense: 0, lethality: 0, health: 0 },
      },
      allianceTech: { attack: 0, defense: 0, lethality: 0, health: 0 },
      experts: { attack: 0, defense: 0, lethality: 0, health: 0 },
      daybreakIsland: {
        infantry: { attack: 0, defense: 0 },
        lancer: { attack: 0, defense: 0 },
        marksman: { attack: 0, defense: 0 },
        troops: { attack: 0, defense: 0, lethality: 0, health: 0 },
        deploymentCapacity: 0,
        rallyCapacity: 0,
      },
      pets: { attack: 0, defense: 0, lethality: 0, health: 0 },
      stackedSkins: { attack: 0, defense: 0, lethality: 0, health: 0 },
      hero: { attack: 0, defense: 0, lethality: 0, health: 0 },
      chiefGear: { attack: 0, defense: 0 },
      charms: {
        infantry: { lethality: 0, health: 0 },
        lancer: { lethality: 0, health: 0 },
        marksman: { lethality: 0, health: 0 },
      },
      heroGear: {
        infantry: { lethality: 0, health: 0, attack: 0, defense: 0 },
        lancer: { lethality: 0, health: 0, attack: 0, defense: 0 },
        marksman: { lethality: 0, health: 0, attack: 0, defense: 0 },
      },
      allianceFacilities: { attack: 0, defense: 0 },
      petRefinement: {
        infantry: { lethality: 0, health: 0 },
        lancer: { lethality: 0, health: 0 },
        marksman: { lethality: 0, health: 0 },
        troops: { attack: 0, defense: 0 },
      },
      warAcademy: {
        infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
        lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
        marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
      },
      specialHeroes: { jeronimo: false, natalia: false },
      vipPrestige: { attack: 0, defense: 0, lethality: 0, health: 0 },
      globe: { attack: 0, defense: 0, lethality: 0, health: 0 },
    };
  } else {
    // Ensure charms structure exists
    if (!p.basicBonuses.charms || typeof p.basicBonuses.charms !== 'object' || !('infantry' in p.basicBonuses.charms)) {
      p.basicBonuses.charms = migrateCharms(p.basicBonuses.charms);
    }
    // Ensure heroGear structure exists
    if (!p.basicBonuses.heroGear) {
      p.basicBonuses.heroGear = {
        infantry: { lethality: 0, health: 0, attack: 0, defense: 0 },
        lancer: { lethality: 0, health: 0, attack: 0, defense: 0 },
        marksman: { lethality: 0, health: 0, attack: 0, defense: 0 },
      };
    }
    // Ensure petRefinement structure exists
    if (!p.basicBonuses.petRefinement) {
      p.basicBonuses.petRefinement = {
        infantry: { lethality: 0, health: 0 },
        lancer: { lethality: 0, health: 0 },
        marksman: { lethality: 0, health: 0 },
        troops: { attack: 0, defense: 0 },
      };
    }
    // Ensure warAcademy structure exists
    if (!p.basicBonuses.warAcademy) {
      p.basicBonuses.warAcademy = {
        infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
        lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
        marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
      };
    }
    // Ensure daybreakIsland structure exists (migrate from old format if needed)
    if (!p.basicBonuses.daybreakIsland || typeof p.basicBonuses.daybreakIsland !== 'object' || !('infantry' in p.basicBonuses.daybreakIsland)) {
      const oldDaybreak = (p.basicBonuses.daybreakIsland || { attack: 0, defense: 0, lethality: 0, health: 0 }) as Record<string, unknown>;
      p.basicBonuses.daybreakIsland = {
        infantry: { attack: 0, defense: 0 },
        lancer: { attack: 0, defense: 0 },
        marksman: { attack: 0, defense: 0 },
        troops: {
          attack: Number(oldDaybreak.attack) || 0,
          defense: Number(oldDaybreak.defense) || 0,
          lethality: Number(oldDaybreak.lethality) || 0,
          health: Number(oldDaybreak.health) || 0,
        },
        deploymentCapacity: 0,
        rallyCapacity: 0,
      };
    } else {
      // Ensure deploymentCapacity and rallyCapacity exist even if daybreakIsland structure is already correct
      if (p.basicBonuses.daybreakIsland.deploymentCapacity === undefined) {
        p.basicBonuses.daybreakIsland.deploymentCapacity = 0;
      }
      if (p.basicBonuses.daybreakIsland.rallyCapacity === undefined) {
        p.basicBonuses.daybreakIsland.rallyCapacity = 0;
      }
    }
  }

  // Ensure expertSelections exists and migrate from old format if needed
  if (!p.expertSelections) {
    // New format - direct percentages
    p.expertSelections = {
      attack: 0,
      defense: 0,
      lethality: 0,
      health: 0,
      deploymentCapacity: 0,
      rallyCapacity: 0,
    };
  } else {
    // Check if it's old format (has cyrille, agnes, etc.) or new format (has attack, defense, etc.)
    const es = p.expertSelections as Record<string, unknown> | undefined;
    const isOldFormat = es && typeof es === 'object' && ('cyrille' in es || 'agnes' in es);
    const isNewFormat = es && typeof es === 'object' && ('attack' in es || 'defense' in es);

    if (isOldFormat && !isNewFormat) {
      // Migrate from old format to new format
      // Since we can't calculate exact percentages without expert data, set to 0
      // User will need to input their values manually
      p.expertSelections = {
        attack: 0,
        defense: 0,
        lethality: 0,
        health: 0,
        deploymentCapacity: 0,
        rallyCapacity: 0,
      };
    } else if (!isNewFormat) {
      // Neither format detected, use defaults
      p.expertSelections = {
        attack: 0,
        defense: 0,
        lethality: 0,
        health: 0,
        deploymentCapacity: 0,
        rallyCapacity: 0,
      };
    } else {
      const es = p.expertSelections as Record<string, unknown> | undefined;
      p.expertSelections = {
        attack: Number(es?.attack) ?? 0,
        defense: Number(es?.defense) ?? 0,
        lethality: Number(es?.lethality) ?? 0,
        health: Number(es?.health) ?? 0,
        deploymentCapacity: Number(es?.deploymentCapacity) ?? 0,
        rallyCapacity: Number(es?.rallyCapacity) ?? 0,
      };
    }
  }

  // Ensure heroGearSelections exists
  if (!p.heroGearSelections) {
    const defaultGearConfig = {
      level: 200,
      masteryForged: true,
      masteryLevel: 20,
      essenceLevel: 0,
      empowermentLevel: 100, // Default to +100
      stacking: 'additive' as const,
    };

    p.heroGearSelections = {
      infantry: {
        goggles: { ...defaultGearConfig },
        glove: { ...defaultGearConfig },
        boot: { ...defaultGearConfig },
        belt: { ...defaultGearConfig },
      },
      lancer: {
        goggles: { ...defaultGearConfig },
        glove: { ...defaultGearConfig },
        boot: { ...defaultGearConfig },
        belt: { ...defaultGearConfig },
      },
      marksman: {
        goggles: { ...defaultGearConfig },
        glove: { ...defaultGearConfig },
        boot: { ...defaultGearConfig },
        belt: { ...defaultGearConfig },
      },
    };
  } else {
    const gearSelections = p.heroGearSelections as Record<string, Record<string, Record<string, unknown>>> | undefined;
    const troopTypes: Array<'infantry' | 'lancer' | 'marksman'> = ['infantry', 'lancer', 'marksman'];
    const gearPieces: Array<'goggles' | 'glove' | 'boot' | 'belt'> = ['goggles', 'glove', 'boot', 'belt'];

    for (const troopType of troopTypes) {
      const troopCfg = gearSelections?.[troopType];
      if (troopCfg) {
        for (const gearPiece of gearPieces) {
          const piece = troopCfg[gearPiece];
          if (piece && typeof piece.empowermentLevel !== 'number') {
            piece.empowermentLevel = 100;
          }
        }
      }
    }
  }

  // Ensure opponent exists
  if (!p.opponent) {
    p.opponent = {
      heroLevels: maxHeroLevels,
      basicBonuses: p.basicBonuses || {
        combatTech: {
          troopTypeBonus: {
            infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
            lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
            marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
          },
          totalTroopBonus: { attack: 0, defense: 0, lethality: 0, health: 0 },
        },
        allianceTech: { attack: 0, defense: 0, lethality: 0, health: 0 },
        experts: { attack: 0, defense: 0, lethality: 0, health: 0 },
        daybreakIsland: {
          infantry: { attack: 0, defense: 0 },
          lancer: { attack: 0, defense: 0 },
          marksman: { attack: 0, defense: 0 },
          troops: { attack: 0, defense: 0, lethality: 0, health: 0 },
          deploymentCapacity: 0,
          rallyCapacity: 0,
        },
        pets: { attack: 0, defense: 0, lethality: 0, health: 0 },
        stackedSkins: { attack: 0, defense: 0, lethality: 0, health: 0 },
        hero: { attack: 0, defense: 0, lethality: 0, health: 0 },
        chiefGear: { attack: 0, defense: 0 },
        charms: {
          infantry: { lethality: 0, health: 0 },
          lancer: { lethality: 0, health: 0 },
          marksman: { lethality: 0, health: 0 },
        },
        heroGear: {
          infantry: { lethality: 0, health: 0, attack: 0, defense: 0 },
          lancer: { lethality: 0, health: 0, attack: 0, defense: 0 },
          marksman: { lethality: 0, health: 0, attack: 0, defense: 0 },
        },
        allianceFacilities: { attack: 0, defense: 0 },
        petRefinement: {
          infantry: { lethality: 0, health: 0 },
          lancer: { lethality: 0, health: 0 },
          marksman: { lethality: 0, health: 0 },
          troops: { attack: 0, defense: 0 },
        },
        warAcademy: {
          infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
          lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
          marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
        },
        specialHeroes: { jeronimo: false, natalia: false },
        vipPrestige: { attack: 0, defense: 0, lethality: 0, health: 0 },
        globe: { attack: 0, defense: 0, lethality: 0, health: 0 },
      },
      expertSelections: p.expertSelections || {
        attack: 0,
        defense: 0,
        lethality: 0,
        health: 0,
        deploymentCapacity: 0,
        rallyCapacity: 0,
      },
      capacity: p.capacity || { rally: 0, march: 0 },
      baseCapacity: p.baseCapacity || { rally: 0, march: 0 },
      petSkillSelections: p.petSkillSelections || (() => {
        const defaults: Record<string, number> = {};
        Object.entries(PETS_DATA).forEach(([petName, pet]) => {
          const levels = pet && typeof pet === 'object' && 'levels' in pet ? (pet as { levels: Record<string, unknown> }).levels : {};
          const maxLevel = Object.keys(levels).length > 0 ? Math.max(...Object.keys(levels).map((k) => parseInt(k, 10) || 0)) : 0;
          defaults[petName] = maxLevel;
        });
        return defaults;
      })(),
    };
  } else {
    const opp = p.opponent as Record<string, unknown> | undefined;
    const oppHeroLevels = opp?.heroLevels as Record<string, unknown> | undefined;
    if (!oppHeroLevels || typeof oppHeroLevels !== 'object' || Object.keys(oppHeroLevels).length === 0) {
      (p.opponent as Record<string, unknown>).heroLevels = maxHeroLevels;
    } else {
      Object.keys(oppHeroLevels).forEach((heroName) => {
        const heroLevel = (oppHeroLevels[heroName] as Record<string, unknown>) || {};
        const maxDefaults =
          maxHeroLevels[heroName] || { starLevel: 30, xpLevel: 80, skillLevels: {}, exclusiveWeaponLevel: 10 };
        oppHeroLevels[heroName] = {
          starLevel: typeof heroLevel.starLevel === 'number' ? heroLevel.starLevel : maxDefaults.starLevel,
          xpLevel: typeof heroLevel.xpLevel === 'number' ? heroLevel.xpLevel : maxDefaults.xpLevel,
          skillLevels:
            heroLevel.skillLevels && typeof heroLevel.skillLevels === 'object'
              ? heroLevel.skillLevels
              : maxDefaults.skillLevels,
          exclusiveWeaponLevel:
            typeof heroLevel.exclusiveWeaponLevel === 'number'
              ? heroLevel.exclusiveWeaponLevel
              : maxDefaults.exclusiveWeaponLevel,
        };
      });
    }
  }

  // Ensure additiveBonuses exists
  if (!p.additiveBonuses) {
    p.additiveBonuses = {
      temporaryEvents: { attack: 0, defense: 0, lethality: 0, health: 0 },
      supremePresident: { attack: 0, defense: 0, lethality: 0, health: 0 },
      specialBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
    };
  } else {
    // Ensure all properties exist
    if (!p.additiveBonuses.temporaryEvents) {
      p.additiveBonuses.temporaryEvents = { attack: 0, defense: 0, lethality: 0, health: 0 };
    }
    if (!p.additiveBonuses.supremePresident) {
      p.additiveBonuses.supremePresident = { attack: 0, defense: 0, lethality: 0, health: 0 };
    }
    if (!p.additiveBonuses.specialBuffs) {
      p.additiveBonuses.specialBuffs = { attack: 0, defense: 0, lethality: 0, health: 0 };
    }
  }

  // Ensure opponent additiveBonuses exists
  if (p.opponent && !p.opponent.additiveBonuses) {
    p.opponent.additiveBonuses = {
      temporaryEvents: { attack: 0, defense: 0, lethality: 0, health: 0 },
      supremePresident: { attack: 0, defense: 0, lethality: 0, health: 0 },
      specialBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
    };
  } else if (p.opponent?.additiveBonuses) {
    // Ensure all properties exist
    if (!p.opponent.additiveBonuses.temporaryEvents) {
      p.opponent.additiveBonuses.temporaryEvents = { attack: 0, defense: 0, lethality: 0, health: 0 };
    }
    if (!p.opponent.additiveBonuses.supremePresident) {
      p.opponent.additiveBonuses.supremePresident = { attack: 0, defense: 0, lethality: 0, health: 0 };
    }
    if (!p.opponent.additiveBonuses.specialBuffs) {
      p.opponent.additiveBonuses.specialBuffs = { attack: 0, defense: 0, lethality: 0, health: 0 };
    }
  }

  // Ensure multiplicativeBonuses.cityBonuses exists
  if (!p.multiplicativeBonuses) {
    p.multiplicativeBonuses = {
      castleBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
      eventBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
      petSkills: { attack: 0, defense: 0, lethality: 0, health: 0 },
      combatBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
      combatDebuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
      exclusiveWeapon: { attack: 0, defense: 0, lethality: 0, health: 0 },
      allianceTerritory: { attack: 0, defense: 0, lethality: 0, health: 0 },
      tyrantSpire: { attack: 0, defense: 0, lethality: 0, health: 0 },
      cityBonuses: {
        attack: 0,
        defense: 0,
        lethality: 0,
        health: 0,
        enemyAttackReduction: 0,
        enemyDefenseReduction: 0,
        deploymentCapacity: 0,
      },
    };
  } else if (!p.multiplicativeBonuses.cityBonuses) {
    p.multiplicativeBonuses.cityBonuses = {
      attack: 0,
      defense: 0,
      lethality: 0,
      health: 0,
      enemyAttackReduction: 0,
      enemyDefenseReduction: 0,
      deploymentCapacity: 0,
    };
  }
  // Sanitize combat debuffs (clear out extreme/stale values)
  p.multiplicativeBonuses.combatDebuffs = sanitizeCombatDebuffs(p.multiplicativeBonuses.combatDebuffs);

  // Ensure opponent multiplicative bonuses exist and sanitize debuffs
  if (!p.opponent?.multiplicativeBonuses) {
    p.opponent = p.opponent || {};
    p.opponent.multiplicativeBonuses = {
      castleBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
      eventBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
      petSkills: { attack: 0, defense: 0, lethality: 0, health: 0 },
      combatBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
      combatDebuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
      exclusiveWeapon: { attack: 0, defense: 0, lethality: 0, health: 0 },
      allianceTerritory: { attack: 0, defense: 0, lethality: 0, health: 0 },
      tyrantSpire: { attack: 0, defense: 0, lethality: 0, health: 0 },
      cityBonuses: {
        attack: 0,
        defense: 0,
        lethality: 0,
        health: 0,
        enemyAttackReduction: 0,
        enemyDefenseReduction: 0,
        deploymentCapacity: 0,
      },
    };
  } else {
    if (!p.opponent.multiplicativeBonuses.cityBonuses) {
      p.opponent.multiplicativeBonuses.cityBonuses = {
        attack: 0,
        defense: 0,
        lethality: 0,
        health: 0,
        enemyAttackReduction: 0,
        enemyDefenseReduction: 0,
        deploymentCapacity: 0,
      };
    }
    if (!p.opponent.multiplicativeBonuses.combatDebuffs) {
      p.opponent.multiplicativeBonuses.combatDebuffs = { attack: 0, defense: 0, lethality: 0, health: 0 };
    }
  }
  p.opponent.multiplicativeBonuses.combatDebuffs = sanitizeCombatDebuffs(p.opponent.multiplicativeBonuses.combatDebuffs);

  // Ensure chiefGearSelections exists
  if (!p.chiefGearSelections) {
    p.chiefGearSelections = undefined; // Will be initialized on first load with max levels
  }

  // Ensure charmLevels exists
  if (!p.charmLevels) {
    p.charmLevels = undefined; // Will be initialized on first load with max levels
  }

  // Ensure warAcademySelections exists
  if (!p.warAcademySelections) {
    p.warAcademySelections = undefined; // Will be initialized on first load with max levels
  }

  // Ensure commandCenterLevel exists
  if (!p.commandCenterLevel) {
    p.commandCenterLevel = undefined; // Will be set by user
  }

  if (!p.rally) {
    p.rally = {
      leader: {
        infantry: null,
        lancer: null,
        marksman: null,
      },
      joiners: [],
      capacity: {
        infantry: [],
        lancer: [],
        marksman: [],
      },
    };
  }

  if (!p.rally.troopMix) {
    p.rally.troopMix = {
      player: { totalTroops: 0, infantryRatio: 33.34, lancerRatio: 33.33, marksmanRatio: 33.33 },
      opponent: { totalTroops: 0, infantryRatio: 33.34, lancerRatio: 33.33, marksmanRatio: 33.33 },
    };
  }

  return p as unknown as UserProfile;
}

