import { useEffect } from 'react';
import type { UserProfile } from '@/shared/types';
import {
  createDefaultAdditiveBonuses,
  createDefaultMultiplicativeBonuses,
} from '@/domain/battle/battle-calculator-helpers';
import { calculateRallyBonuses } from '@/domain/rally/rally-bonus-extractor';

/**
 * Auto-calculates rally bonuses from rally configuration and updates the profile.
 * Detects changes in hero stats, special buffs, and exclusive weapon bonuses.
 */
export function useRallyBonuses(
  currentProfile: UserProfile | null,
  setCurrentProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>
) {
  useEffect(() => {
    if (!currentProfile) return;

    const playerMode = currentProfile.rally.specialWidgetBonus?.player || 'attacking';
    const opponentMode = currentProfile.rally.specialWidgetBonus?.opponent || 'defending';

    const heroGearForCalculation = currentProfile.rally.usePlayerHeroes
      ? currentProfile.basicBonuses.heroGear
      : currentProfile.opponent?.basicBonuses.heroGear || currentProfile.basicBonuses.heroGear;

    const rallyBonuses = calculateRallyBonuses(
      currentProfile.rally,
      heroGearForCalculation,
      playerMode,
      opponentMode
    );

    const playerRallyConfig = {
      ...currentProfile.rally,
      leader: currentProfile.rally.playerLeader || currentProfile.rally.leader,
      joiners: currentProfile.rally.playerJoiners || currentProfile.rally.joiners || [],
      usePlayerHeroes: true,
    };
    const playerHeroGear = currentProfile.basicBonuses.heroGear;
    const playerRallyBonuses = calculateRallyBonuses(
      playerRallyConfig,
      playerHeroGear,
      playerMode,
      playerMode
    );

    const opponentRallyConfig = {
      ...currentProfile.rally,
      leader: currentProfile.rally.opponentLeader || currentProfile.rally.leader,
      joiners: currentProfile.rally.opponentJoiners || [],
      usePlayerHeroes: false,
    };
    const opponentHeroGear =
      currentProfile.opponent?.basicBonuses.heroGear || currentProfile.basicBonuses.heroGear;
    const opponentRallyBonuses = calculateRallyBonuses(
      opponentRallyConfig,
      opponentHeroGear,
      opponentMode,
      opponentMode
    );

    const zeroSpecial = { attack: 0, defense: 0, lethality: 0, health: 0 };
    const playerSpecial = currentProfile.additiveBonuses?.specialBuffs || zeroSpecial;
    const opponentSpecial = currentProfile.opponent?.additiveBonuses?.specialBuffs || zeroSpecial;

    const heroChanged =
      currentProfile.basicBonuses.hero.attack !== rallyBonuses.basic.attack ||
      currentProfile.basicBonuses.hero.defense !== rallyBonuses.basic.defense ||
      currentProfile.basicBonuses.hero.lethality !== rallyBonuses.basic.lethality ||
      currentProfile.basicBonuses.hero.health !== rallyBonuses.basic.health;

    const playerSpecialBuffsChanged =
      playerSpecial.attack !== playerRallyBonuses.additive.specialBuffs.attack ||
      playerSpecial.defense !== playerRallyBonuses.additive.specialBuffs.defense ||
      playerSpecial.lethality !== playerRallyBonuses.additive.specialBuffs.lethality ||
      playerSpecial.health !== playerRallyBonuses.additive.specialBuffs.health;

    const opponentSpecialBuffsChanged =
      opponentSpecial.attack !== opponentRallyBonuses.additive.specialBuffs.attack ||
      opponentSpecial.defense !== opponentRallyBonuses.additive.specialBuffs.defense ||
      opponentSpecial.lethality !== opponentRallyBonuses.additive.specialBuffs.lethality ||
      opponentSpecial.health !== opponentRallyBonuses.additive.specialBuffs.health;

    const exclusiveWeaponChanged =
      currentProfile.multiplicativeBonuses.exclusiveWeapon.attack !== rallyBonuses.multiplicative.exclusiveWeapon.attack ||
      currentProfile.multiplicativeBonuses.exclusiveWeapon.defense !== rallyBonuses.multiplicative.exclusiveWeapon.defense ||
      currentProfile.multiplicativeBonuses.exclusiveWeapon.lethality !== rallyBonuses.multiplicative.exclusiveWeapon.lethality ||
      currentProfile.multiplicativeBonuses.exclusiveWeapon.health !== rallyBonuses.multiplicative.exclusiveWeapon.health;

    if (!heroChanged && !playerSpecialBuffsChanged && !opponentSpecialBuffsChanged && !exclusiveWeaponChanged) {
      return;
    }

    const updatedBasicBonuses = {
      ...currentProfile.basicBonuses,
      hero: {
        attack: rallyBonuses.basic.attack,
        defense: rallyBonuses.basic.defense,
        lethality: rallyBonuses.basic.lethality,
        health: rallyBonuses.basic.health,
      },
    };

    const updatedAdditiveBonuses: typeof currentProfile.additiveBonuses = {
      temporaryEvents: {
        ...(currentProfile.additiveBonuses?.temporaryEvents || zeroSpecial),
      },
      supremePresident: {
        ...(currentProfile.additiveBonuses?.supremePresident || zeroSpecial),
      },
      specialBuffs: {
        attack: playerRallyBonuses.additive.specialBuffs.attack,
        defense: playerRallyBonuses.additive.specialBuffs.defense,
        lethality: playerRallyBonuses.additive.specialBuffs.lethality,
        health: playerRallyBonuses.additive.specialBuffs.health,
      },
    };

    const updatedMultiplicativeBonuses: typeof currentProfile.multiplicativeBonuses = {
      castleBuffs: { ...currentProfile.multiplicativeBonuses.castleBuffs },
      eventBuffs: { ...currentProfile.multiplicativeBonuses.eventBuffs },
      petSkills: { ...currentProfile.multiplicativeBonuses.petSkills },
      combatBuffs: { ...currentProfile.multiplicativeBonuses.combatBuffs },
      combatDebuffs: { ...currentProfile.multiplicativeBonuses.combatDebuffs },
      exclusiveWeapon: {
        attack: rallyBonuses.multiplicative.exclusiveWeapon.attack,
        defense: rallyBonuses.multiplicative.exclusiveWeapon.defense,
        lethality: rallyBonuses.multiplicative.exclusiveWeapon.lethality,
        health: rallyBonuses.multiplicative.exclusiveWeapon.health,
      },
      allianceTerritory: { ...currentProfile.multiplicativeBonuses.allianceTerritory },
      tyrantSpire: { ...currentProfile.multiplicativeBonuses.tyrantSpire },
      cityBonuses: {
        ...(currentProfile.multiplicativeBonuses.cityBonuses || {
          attack: 0, defense: 0, lethality: 0, health: 0,
          enemyAttackReduction: 0, enemyDefenseReduction: 0, deploymentCapacity: 0,
        }),
        enemyAttackReduction: playerRallyBonuses.multiplicative.cityBonuses.enemyAttackReduction,
      },
    };

    const updatedOpponent = currentProfile.opponent
      ? {
          ...currentProfile.opponent,
          additiveBonuses: {
            temporaryEvents:
              currentProfile.opponent.additiveBonuses?.temporaryEvents || zeroSpecial,
            supremePresident:
              currentProfile.opponent.additiveBonuses?.supremePresident || zeroSpecial,
            specialBuffs: {
              attack: opponentRallyBonuses.additive.specialBuffs.attack,
              defense: opponentRallyBonuses.additive.specialBuffs.defense,
              lethality: opponentRallyBonuses.additive.specialBuffs.lethality,
              health: opponentRallyBonuses.additive.specialBuffs.health,
            },
          },
        }
      : undefined;

    setCurrentProfile((prev) => ({
      ...(prev || currentProfile),
      basicBonuses: updatedBasicBonuses,
      additiveBonuses: updatedAdditiveBonuses,
      multiplicativeBonuses: updatedMultiplicativeBonuses,
      opponent: updatedOpponent,
      heroGearSelections: currentProfile.heroGearSelections,
    }));
  }, [currentProfile?.rally, currentProfile?.opponent?.basicBonuses?.heroGear]);
}
