/**
 * Profile Migration - Migrate old profile formats to new formats
 */

import { buildMaxHeroLevels, PETS_DATA } from '@/domain/battle';
import type { UserProfile } from '@/shared/types';

/**
 * Migrate charms from old format to new format
 */
function migrateCharms(oldCharms: any): {
  infantry: { lethality: number; health: number };
  lancer: { lethality: number; health: number };
  marksman: { lethality: number; health: number };
} {
  // If it's already in the new format, return as-is
  if (oldCharms && typeof oldCharms === 'object' && 'infantry' in oldCharms) {
    return oldCharms as any;
  }

  // Old format - convert to new format (distribute evenly or set to 0)
  const oldLethality = (oldCharms?.lethality || 0) as number;
  const oldHealth = (oldCharms?.health || 0) as number;

  return {
    infantry: { lethality: 0, health: 0 }, // Old charms don't apply to new system
    lancer: { lethality: 0, health: 0 },
    marksman: { lethality: 0, health: 0 },
  };
}

function sanitizeCombatDebuffs(combatDebuffs?: any): { attack: number; defense: number; lethality: number; health: number } {
  const zero = { attack: 0, defense: 0, lethality: 0, health: 0 };
  const current = combatDebuffs || zero;
  return {
    attack: Math.abs(Number(current.attack) || 0) > 200 ? 0 : (Number(current.attack) || 0),
    defense: Math.abs(Number(current.defense) || 0) > 200 ? 0 : (Number(current.defense) || 0),
    lethality: Math.abs(Number(current.lethality) || 0) > 200 ? 0 : (Number(current.lethality) || 0),
    health: Math.abs(Number(current.health) || 0) > 200 ? 0 : (Number(current.health) || 0),
  };
}

/**
 * Migrate a profile to the latest format
 */
export function migrateProfile(profile: any): UserProfile {
  // Migrate charms
  if (profile.basicBonuses?.charms) {
    profile.basicBonuses.charms = migrateCharms(profile.basicBonuses.charms);
  }

  // Ensure heroLevels exists; default to max levels when missing
  const maxHeroLevels = buildMaxHeroLevels();
  if (!profile.heroLevels || typeof profile.heroLevels !== 'object' || Object.keys(profile.heroLevels).length === 0) {
    profile.heroLevels = maxHeroLevels;
  } else {
    Object.keys(profile.heroLevels).forEach((heroName) => {
      const heroLevel = profile.heroLevels[heroName] || {};
      const maxDefaults = maxHeroLevels[heroName] || { starLevel: 30, xpLevel: 80, skillLevels: {}, exclusiveWeaponLevel: 10 };
      profile.heroLevels[heroName] = {
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
  if (!profile.basicBonuses) {
    profile.basicBonuses = {
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
    if (!profile.basicBonuses.charms || typeof profile.basicBonuses.charms !== 'object' || !('infantry' in profile.basicBonuses.charms)) {
      profile.basicBonuses.charms = migrateCharms(profile.basicBonuses.charms);
    }
    // Ensure heroGear structure exists
    if (!profile.basicBonuses.heroGear) {
      profile.basicBonuses.heroGear = {
        infantry: { lethality: 0, health: 0, attack: 0, defense: 0 },
        lancer: { lethality: 0, health: 0, attack: 0, defense: 0 },
        marksman: { lethality: 0, health: 0, attack: 0, defense: 0 },
      };
    }
    // Ensure petRefinement structure exists
    if (!profile.basicBonuses.petRefinement) {
      profile.basicBonuses.petRefinement = {
        infantry: { lethality: 0, health: 0 },
        lancer: { lethality: 0, health: 0 },
        marksman: { lethality: 0, health: 0 },
        troops: { attack: 0, defense: 0 },
      };
    }
    // Ensure warAcademy structure exists
    if (!profile.basicBonuses.warAcademy) {
      profile.basicBonuses.warAcademy = {
        infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
        lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
        marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
      };
    }
    // Ensure daybreakIsland structure exists (migrate from old format if needed)
    if (!profile.basicBonuses.daybreakIsland || typeof profile.basicBonuses.daybreakIsland !== 'object' || !('infantry' in profile.basicBonuses.daybreakIsland)) {
      // Old format - migrate to new format
      const oldDaybreak = profile.basicBonuses.daybreakIsland || { attack: 0, defense: 0, lethality: 0, health: 0 };
      profile.basicBonuses.daybreakIsland = {
        infantry: { attack: 0, defense: 0 },
        lancer: { attack: 0, defense: 0 },
        marksman: { attack: 0, defense: 0 },
        troops: {
          attack: (oldDaybreak as any).attack || 0,
          defense: (oldDaybreak as any).defense || 0,
          lethality: (oldDaybreak as any).lethality || 0,
          health: (oldDaybreak as any).health || 0,
        },
        deploymentCapacity: 0,
        rallyCapacity: 0,
      };
    } else {
      // Ensure deploymentCapacity and rallyCapacity exist even if daybreakIsland structure is already correct
      if (profile.basicBonuses.daybreakIsland.deploymentCapacity === undefined) {
        profile.basicBonuses.daybreakIsland.deploymentCapacity = 0;
      }
      if (profile.basicBonuses.daybreakIsland.rallyCapacity === undefined) {
        profile.basicBonuses.daybreakIsland.rallyCapacity = 0;
      }
    }
  }

  // Ensure expertSelections exists and migrate from old format if needed
  if (!profile.expertSelections) {
    // New format - direct percentages
    profile.expertSelections = {
      attack: 0,
      defense: 0,
      lethality: 0,
      health: 0,
      deploymentCapacity: 0,
      rallyCapacity: 0,
    };
  } else {
    // Check if it's old format (has cyrille, agnes, etc.) or new format (has attack, defense, etc.)
    const isOldFormat = 'cyrille' in profile.expertSelections || 'agnes' in profile.expertSelections;
    const isNewFormat = 'attack' in profile.expertSelections || 'defense' in profile.expertSelections;

    if (isOldFormat && !isNewFormat) {
      // Migrate from old format to new format
      // Since we can't calculate exact percentages without expert data, set to 0
      // User will need to input their values manually
      profile.expertSelections = {
        attack: 0,
        defense: 0,
        lethality: 0,
        health: 0,
        deploymentCapacity: 0,
        rallyCapacity: 0,
      };
    } else if (!isNewFormat) {
      // Neither format detected, use defaults
      profile.expertSelections = {
        attack: 0,
        defense: 0,
        lethality: 0,
        health: 0,
        deploymentCapacity: 0,
        rallyCapacity: 0,
      };
    } else {
      // New format - ensure all properties exist
      profile.expertSelections = {
        attack: (profile.expertSelections as any).attack ?? 0,
        defense: (profile.expertSelections as any).defense ?? 0,
        lethality: (profile.expertSelections as any).lethality ?? 0,
        health: (profile.expertSelections as any).health ?? 0,
        deploymentCapacity: (profile.expertSelections as any).deploymentCapacity ?? 0,
        rallyCapacity: (profile.expertSelections as any).rallyCapacity ?? 0,
      };
    }
  }

  // Ensure heroGearSelections exists
  if (!profile.heroGearSelections) {
    const defaultGearConfig = {
      level: 200,
      masteryForged: true,
      masteryLevel: 20,
      essenceLevel: 0,
      empowermentLevel: 100, // Default to +100
      stacking: 'additive' as const,
    };

    profile.heroGearSelections = {
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
    // Ensure all gear pieces have empowermentLevel defaulted to 100 if not set
    const troopTypes: Array<'infantry' | 'lancer' | 'marksman'> = ['infantry', 'lancer', 'marksman'];
    const gearPieces: Array<'goggles' | 'glove' | 'boot' | 'belt'> = ['goggles', 'glove', 'boot', 'belt'];

    for (const troopType of troopTypes) {
      if (profile.heroGearSelections[troopType]) {
        for (const gearPiece of gearPieces) {
          if (profile.heroGearSelections[troopType][gearPiece]) {
            if (typeof profile.heroGearSelections[troopType][gearPiece].empowermentLevel !== 'number') {
              profile.heroGearSelections[troopType][gearPiece].empowermentLevel = 100;
            }
          }
        }
      }
    }
  }

  // Ensure opponent exists
  if (!profile.opponent) {
    profile.opponent = {
      heroLevels: maxHeroLevels,
      basicBonuses: profile.basicBonuses || {
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
      expertSelections: profile.expertSelections || {
        attack: 0,
        defense: 0,
        lethality: 0,
        health: 0,
        deploymentCapacity: 0,
        rallyCapacity: 0,
      },
      capacity: profile.capacity || { rally: 0, march: 0 },
      baseCapacity: profile.baseCapacity || { rally: 0, march: 0 },
      petSkillSelections: profile.petSkillSelections || (() => {
        // Default to max level for each pet if not set
        const defaults: Record<string, number> = {};
        Object.entries(PETS_DATA).forEach(([petName, pet]: [string, any]) => {
          const maxLevel = Math.max(...Object.keys(pet.levels).map((k) => parseInt(k)));
          defaults[petName] = maxLevel;
        });
        return defaults;
      })(),
    };
  } else if (!profile.opponent.heroLevels || Object.keys(profile.opponent.heroLevels).length === 0) {
    profile.opponent.heroLevels = maxHeroLevels;
  } else {
    Object.keys(profile.opponent.heroLevels).forEach((heroName) => {
      const heroLevel = profile.opponent!.heroLevels![heroName] || {};
      const maxDefaults =
        maxHeroLevels[heroName] || { starLevel: 30, xpLevel: 80, skillLevels: {}, exclusiveWeaponLevel: 10 };
      profile.opponent!.heroLevels![heroName] = {
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

  // Ensure additiveBonuses exists
  if (!profile.additiveBonuses) {
    profile.additiveBonuses = {
      temporaryEvents: { attack: 0, defense: 0, lethality: 0, health: 0 },
      supremePresident: { attack: 0, defense: 0, lethality: 0, health: 0 },
      specialBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
    };
  } else {
    // Ensure all properties exist
    if (!profile.additiveBonuses.temporaryEvents) {
      profile.additiveBonuses.temporaryEvents = { attack: 0, defense: 0, lethality: 0, health: 0 };
    }
    if (!profile.additiveBonuses.supremePresident) {
      profile.additiveBonuses.supremePresident = { attack: 0, defense: 0, lethality: 0, health: 0 };
    }
    if (!profile.additiveBonuses.specialBuffs) {
      profile.additiveBonuses.specialBuffs = { attack: 0, defense: 0, lethality: 0, health: 0 };
    }
  }

  // Ensure opponent additiveBonuses exists
  if (profile.opponent && !profile.opponent.additiveBonuses) {
    profile.opponent.additiveBonuses = {
      temporaryEvents: { attack: 0, defense: 0, lethality: 0, health: 0 },
      supremePresident: { attack: 0, defense: 0, lethality: 0, health: 0 },
      specialBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
    };
  } else if (profile.opponent?.additiveBonuses) {
    // Ensure all properties exist
    if (!profile.opponent.additiveBonuses.temporaryEvents) {
      profile.opponent.additiveBonuses.temporaryEvents = { attack: 0, defense: 0, lethality: 0, health: 0 };
    }
    if (!profile.opponent.additiveBonuses.supremePresident) {
      profile.opponent.additiveBonuses.supremePresident = { attack: 0, defense: 0, lethality: 0, health: 0 };
    }
    if (!profile.opponent.additiveBonuses.specialBuffs) {
      profile.opponent.additiveBonuses.specialBuffs = { attack: 0, defense: 0, lethality: 0, health: 0 };
    }
  }

  // Ensure multiplicativeBonuses.cityBonuses exists
  if (!profile.multiplicativeBonuses) {
    profile.multiplicativeBonuses = {
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
  } else if (!profile.multiplicativeBonuses.cityBonuses) {
    profile.multiplicativeBonuses.cityBonuses = {
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
  profile.multiplicativeBonuses.combatDebuffs = sanitizeCombatDebuffs(profile.multiplicativeBonuses.combatDebuffs);

  // Ensure opponent multiplicative bonuses exist and sanitize debuffs
  if (!profile.opponent?.multiplicativeBonuses) {
    profile.opponent = profile.opponent || {};
    profile.opponent.multiplicativeBonuses = {
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
    if (!profile.opponent.multiplicativeBonuses.cityBonuses) {
      profile.opponent.multiplicativeBonuses.cityBonuses = {
        attack: 0,
        defense: 0,
        lethality: 0,
        health: 0,
        enemyAttackReduction: 0,
        enemyDefenseReduction: 0,
        deploymentCapacity: 0,
      };
    }
    if (!profile.opponent.multiplicativeBonuses.combatDebuffs) {
      profile.opponent.multiplicativeBonuses.combatDebuffs = { attack: 0, defense: 0, lethality: 0, health: 0 };
    }
  }
  profile.opponent.multiplicativeBonuses.combatDebuffs = sanitizeCombatDebuffs(profile.opponent.multiplicativeBonuses.combatDebuffs);

  // Ensure chiefGearSelections exists
  if (!profile.chiefGearSelections) {
    profile.chiefGearSelections = undefined; // Will be initialized on first load with max levels
  }

  // Ensure charmLevels exists
  if (!profile.charmLevels) {
    profile.charmLevels = undefined; // Will be initialized on first load with max levels
  }

  // Ensure warAcademySelections exists
  if (!profile.warAcademySelections) {
    profile.warAcademySelections = undefined; // Will be initialized on first load with max levels
  }

  // Ensure commandCenterLevel exists
  if (!profile.commandCenterLevel) {
    profile.commandCenterLevel = undefined; // Will be set by user
  }

  if (!profile.rally) {
    profile.rally = {
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

  if (!profile.rally.troopMix) {
    profile.rally.troopMix = {
      player: { totalTroops: 0, infantryRatio: 33.34, lancerRatio: 33.33, marksmanRatio: 33.33 },
      opponent: { totalTroops: 0, infantryRatio: 33.34, lancerRatio: 33.33, marksmanRatio: 33.33 },
    };
  }

  return profile as UserProfile;
}

