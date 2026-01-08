import type { BattleConfig, BattleReport } from '@/domain/combat/types';
import { DEFAULT_TROOP_MIX, buildConfigForSide, mixToCounts } from '@/domain/rally/rally-config';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BattleSideContext, CapacityReport } from '@/features/battle-calculator/model/types';
import type { RallyHero, TroopMixConfig, UserProfile } from '@/shared/types';
import { PETS_DATA } from '@/domain/battle/data/pets/pet_skills';
import {
  buildOpponentCapacityReport,
  buildPlayerCapacityReport,
  buildSideBaseStats,
  buildSpecialBonusSummary,
  computePetDebuffTotals,
  createDefaultAdditiveBonuses,
  createDefaultMultiplicativeBonuses,
  createEmptyBaseStats,
  createEmptyPetSkillSelections,
  ensureTroopCounts,
  hasTroops,
  normalizeAdditiveBonuses,
  normalizeMultiplicativeBonuses,
  normalizeTroopMix,
  sanitizeMix,
  sumCapacityCounts
  } from '@/domain/battle/battle-calculator-helpers';
import type { CombatSideBonuses } from '@/domain/battle/calculations';
import {
  getDefaultOpponentBasicBonuses,
  getDefaultOpponentCommandCenterLevel,
  getDefaultOpponentExpertSelections
} from '@/domain/battle/index';
import { simulateBattleFromUI } from '@/domain/combat/adapter';
import { saveProfile } from '@/features/profile/api/profile-storage';
import type { FightResult } from '@/domain/rally/combat-fight';
import { buildFighterSnapshot, totalTroops, type FighterSnapshot } from '@/domain/rally/combat-fighter';
import { calculateRallyBonuses, extractJoinerBonuses } from '@/domain/rally/rally-bonus-extractor';

const isUuid = (value: string | undefined | null) =>
  typeof value === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);

export function useBattleCalculatorState() {
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'opponent' | 'rally' | 'results' | 'howto'>('rally');
  const [profileSubTab, setProfileSubTab] = useState<'info' | 'heroes' | 'basic' | 'research' | 'chief' | 'pets'>('info');
  const [opponentSubTab, setOpponentSubTab] = useState<'info' | 'heroes' | 'basic' | 'research' | 'chief' | 'pets'>('info');
  const [simulationMode, setSimulationMode] = useState<BattleConfig['randomMode']>('monteCarlo');
  const [simulationCount, setSimulationCount] = useState<number>(50);

  const { playerBaseStats, opponentBaseStats } = useMemo(() => {
    if (!currentProfile) {
      return {
        playerBaseStats: createEmptyBaseStats(),
        opponentBaseStats: createEmptyBaseStats()
      };
    }

    // Build enemy side bonuses for cross-application of debuffs
    const opponentEnemySide: CombatSideBonuses | undefined = currentProfile.opponent
      ? {
        basic: currentProfile.opponent.basicBonuses,
        additive: normalizeAdditiveBonuses(
          currentProfile.opponent.additiveBonuses ?? createDefaultAdditiveBonuses()
        ),
        multipliers: normalizeMultiplicativeBonuses(
          currentProfile.opponent.multiplicativeBonuses ?? createDefaultMultiplicativeBonuses()
        )
      }
      : undefined;

    const playerEnemySide: CombatSideBonuses | undefined = {
      basic: currentProfile.basicBonuses,
      additive: normalizeAdditiveBonuses(currentProfile.additiveBonuses),
      multipliers: normalizeMultiplicativeBonuses(currentProfile.multiplicativeBonuses)
    };

    const playerStats = buildSideBaseStats(
      currentProfile.basicBonuses,
      currentProfile.additiveBonuses,
      currentProfile.multiplicativeBonuses,
      currentProfile.rally,
      currentProfile.heroLevels,
      'player',
      currentProfile.troopLevels,
      opponentEnemySide
    );

    const opponentStats = currentProfile.opponent
      ? buildSideBaseStats(
        currentProfile.opponent.basicBonuses,
        currentProfile.opponent.additiveBonuses ?? createDefaultAdditiveBonuses(),
        currentProfile.opponent.multiplicativeBonuses ?? createDefaultMultiplicativeBonuses(),
        currentProfile.rally,
        currentProfile.opponent.heroLevels,
        'opponent',
        currentProfile.opponent.troopLevels,
        playerEnemySide
      )
      : createEmptyBaseStats();

    return {
      playerBaseStats: playerStats,
      opponentBaseStats: opponentStats
    };
  }, [currentProfile]);

  const playerCapacityReport = useMemo<CapacityReport | null>(() => {
    if (!currentProfile) {
      return null;
    }
    return buildPlayerCapacityReport(currentProfile);
  }, [currentProfile]);

  const opponentCapacityReport = useMemo<CapacityReport | null>(() => {
    if (!currentProfile) {
      return null;
    }
    return buildOpponentCapacityReport(currentProfile);
  }, [currentProfile]);

  const fightSimulation = useMemo<{
    attacker: FighterSnapshot | null;
    defender: FighterSnapshot | null;
    result: FightResult | null;
    battleReport: BattleReport | null;
    error: string | null;
    player: BattleSideContext | null;
    opponent: BattleSideContext | null;
  }>(() => {
    if (!currentProfile?.rally) {
      return { attacker: null, defender: null, result: null, battleReport: null, error: null, player: null, opponent: null };
    }

    try {
      const playerSide = buildConfigForSide(currentProfile.rally, 'player', playerBaseStats);
      const opponentSide = buildConfigForSide(currentProfile.rally, 'opponent', opponentBaseStats);
      const playerIsAttacker = playerSide.role === 'attacker';

      const playerMixConfigRaw = normalizeTroopMix(currentProfile.rally.troopMix?.player ?? DEFAULT_TROOP_MIX);
      const opponentMixConfigRaw = normalizeTroopMix(currentProfile.rally.troopMix?.opponent ?? DEFAULT_TROOP_MIX);

      const playerCapacityTotal = playerCapacityReport?.rally.total || 0;
      const opponentCapacityTotal = opponentCapacityReport?.rally.total || 0;

      const playerMixConfig: typeof playerMixConfigRaw = {
        ...playerMixConfigRaw,
        totalTroops: playerMixConfigRaw.totalTroops > 0 ? playerMixConfigRaw.totalTroops : playerCapacityTotal
      };
      const opponentMixConfig: typeof opponentMixConfigRaw = {
        ...opponentMixConfigRaw,
        totalTroops: opponentMixConfigRaw.totalTroops > 0 ? opponentMixConfigRaw.totalTroops : opponentCapacityTotal
      };

      const playerMixCounts = mixToCounts(playerMixConfig).counts;
      const opponentMixCounts = mixToCounts(opponentMixConfig).counts;
      const playerCapacityCounts = sumCapacityCounts(currentProfile.rally.capacity);

      const normalizedPlayerSide = ensureTroopCounts(
        playerSide,
        hasTroops(playerMixCounts) ? playerMixCounts : playerCapacityCounts
      );
      const normalizedOpponentSide = ensureTroopCounts(
        opponentSide,
        hasTroops(opponentMixCounts) ? opponentMixCounts : undefined
      );

      const attackerSide = playerIsAttacker ? normalizedPlayerSide : normalizedOpponentSide;
      const defenderSide = playerIsAttacker ? normalizedOpponentSide : normalizedPlayerSide;

      const attackerName = playerIsAttacker ? 'Player Rally' : 'Opponent Rally';
      const defenderName = playerIsAttacker ? 'Opponent Rally' : 'Player Rally';

      const { legacyFight, report } = simulateBattleFromUI({
        config: { attacker: attackerSide, defender: defenderSide },
        battleConfig: {
          maxTurns: 30,
          randomMode: simulationMode,
          simulations: simulationMode === 'monteCarlo' ? simulationCount : undefined
        }
      });
      const result = legacyFight;

      const attackerInitialTotal = totalTroops(attackerSide.troopCounts);
      const defenderInitialTotal = totalTroops(defenderSide.troopCounts);

      const attacker = buildFighterSnapshot(attackerName, attackerSide, defenderSide);
      const defender = buildFighterSnapshot(defenderName, defenderSide, attackerSide);

      const deriveSideMultipliers = (role: 'attacker' | 'defender') => {
        const outgoing = report.turns.flatMap((turn) =>
          turn.actions.filter((action) => action.side === role)
        );
        const incoming = report.turns.flatMap((turn) =>
          turn.actions.filter((action) => action.side !== role)
        );
        const sum = (vals: number[]) => vals.reduce((s, v) => s + v, 0);
        const totalOutgoingFinal = sum(outgoing.map((a) => a.components.finalKills));
        const totalOutgoingBase = sum(outgoing.map((a) => a.components.baseKills));
        const totalIncomingFinal = sum(incoming.map((a) => a.components.finalKills));
        const initialPool =
          role === 'attacker' ? attackerInitialTotal : defenderInitialTotal;

        const damageDealtMultiplier =
          totalOutgoingBase > 0 ? totalOutgoingFinal / totalOutgoingBase : 1;
        const damageTakenMultiplier =
          initialPool > 0 ? totalIncomingFinal / initialPool : 1;

        return {
          damageDealtMultiplier: Number(damageDealtMultiplier.toFixed(3)),
          damageTakenMultiplier: Number(damageTakenMultiplier.toFixed(3))
        };
      };

      const enrichSummary = (fighter: FighterSnapshot, role: 'attacker' | 'defender'): FighterSnapshot => {
        const derived = deriveSideMultipliers(role);
        return {
          ...fighter,
          summary: {
            ...fighter.summary,
            damageDealtMultiplier: derived.damageDealtMultiplier,
            damageTakenMultiplier: derived.damageTakenMultiplier
          }
        };
      };

      const enrichedAttacker = enrichSummary(attacker, 'attacker');
      const enrichedDefender = enrichSummary(defender, 'defender');

      const playerJoinerMode: 'attacking' | 'defending' = normalizedPlayerSide.role === 'attacker' ? 'attacking' : 'defending';
      const opponentJoinerMode: 'attacking' | 'defending' = normalizedOpponentSide.role === 'attacker' ? 'attacking' : 'defending';
      const playerJoinersForBonuses = normalizedPlayerSide.joiners as unknown as RallyHero[];
      const opponentJoinersForBonuses = normalizedOpponentSide.joiners as unknown as RallyHero[];
      const playerJoinerResult = extractJoinerBonuses(playerJoinersForBonuses, playerJoinerMode);
      const opponentJoinerResult = extractJoinerBonuses(opponentJoinersForBonuses, opponentJoinerMode);
      const playerJoinerMult = playerJoinerResult.multiplicative;
      const opponentJoinerMult = opponentJoinerResult.multiplicative;
      const playerJoinerMultiplicative: ReturnType<typeof calculateRallyBonuses>['multiplicative'] = {
        ...createDefaultMultiplicativeBonuses(),
        ...playerJoinerMult
      };
      const opponentJoinerMultiplicative: ReturnType<typeof calculateRallyBonuses>['multiplicative'] = {
        ...createDefaultMultiplicativeBonuses(),
        ...opponentJoinerMult
      };
      const playerJoinerAdd = playerJoinerResult.additive;
      const opponentJoinerAdd = opponentJoinerResult.additive;
      const playerJoinerNames = playerJoinersForBonuses.slice(0, 4).map((j) => j.heroName).filter(Boolean);
      const opponentJoinerNames = opponentJoinersForBonuses.slice(0, 4).map((j) => j.heroName).filter(Boolean);

      const playerPetDebuffs = computePetDebuffTotals(currentProfile.petSkillSelections);

      const opponentMaxPetLevels: Record<string, number> = {};
      Object.entries(PETS_DATA).forEach(([petName, pet]) => {
        const maxLevel = Math.max(...Object.keys(pet.levels).map((k) => parseInt(k)));
        opponentMaxPetLevels[petName] = maxLevel;
      });
      const opponentPetDebuffs = computePetDebuffTotals(opponentMaxPetLevels);

      const playerSpecialBonuses = buildSpecialBonusSummary(
        currentProfile.additiveBonuses,
        currentProfile.multiplicativeBonuses,
        normalizedPlayerSide.role,
        playerJoinerMultiplicative,
        currentProfile.multiplicativeBonuses.combatDebuffs,
        playerJoinerNames,
        playerPetDebuffs
      );
      const opponentSpecialBonuses = buildSpecialBonusSummary(
        currentProfile.opponent?.additiveBonuses ?? createDefaultAdditiveBonuses(),
        currentProfile.opponent?.multiplicativeBonuses ?? createDefaultMultiplicativeBonuses(),
        normalizedOpponentSide.role,
        opponentJoinerMultiplicative,
        currentProfile.opponent?.multiplicativeBonuses?.combatDebuffs,
        opponentJoinerNames,
        opponentPetDebuffs
      );

      const playerContext: BattleSideContext = {
        label: 'Player',
        fighter: playerIsAttacker ? enrichedAttacker : enrichedDefender,
        role: normalizedPlayerSide.role,
        troopCounts: normalizedPlayerSide.troopCounts,
        stats: playerBaseStats,
        mix: playerMixConfig,
        leaders: normalizedPlayerSide.heroes,
        joiners: normalizedPlayerSide.joiners,
        joinerAdditive: {
          ...playerJoinerAdd,
          names: playerJoinerNames
        },
        specialBonuses: playerSpecialBonuses
      };

      const opponentContext: BattleSideContext = {
        label: 'Opponent',
        fighter: playerIsAttacker ? enrichedDefender : enrichedAttacker,
        role: normalizedOpponentSide.role,
        troopCounts: normalizedOpponentSide.troopCounts,
        stats: opponentBaseStats,
        mix: opponentMixConfig,
        leaders: normalizedOpponentSide.heroes,
        joiners: normalizedOpponentSide.joiners,
        joinerAdditive: {
          ...opponentJoinerAdd,
          names: opponentJoinerNames
        },
        specialBonuses: opponentSpecialBonuses
      };

      return { attacker, defender, result, battleReport: report, error: null, player: playerContext, opponent: opponentContext };
    } catch (error) {
      console.error('Failed to simulate fight', error);
      return {
        attacker: null,
        defender: null,
        result: null,
        battleReport: null,
        error: error instanceof Error ? error.message : 'Unknown simulation error',
        player: null,
        opponent: null
      };
    }
  }, [currentProfile?.rally, playerBaseStats, opponentBaseStats, simulationMode, simulationCount]);

  const {
    result: simulatedFightResult,
    battleReport: simulatedBattleReport,
    error: fightSimulationError,
    player: simulatedPlayerContext,
    opponent: simulatedOpponentContext
  } = fightSimulation;

  const playerJoinerInfo = useMemo(() => {
    if (!currentProfile?.rally) {
      return null;
    }
    const mode = currentProfile.rally.specialWidgetBonus?.player || 'attacking';
    const joiners = currentProfile.rally.playerJoiners || currentProfile.rally.joiners || [];
    const bonuses = extractJoinerBonuses(joiners, mode);
    return bonuses;
  }, [currentProfile?.rally]);

  const opponentJoinerInfo = useMemo(() => {
    if (!currentProfile?.rally) {
      return null;
    }
    const mode = currentProfile.rally.specialWidgetBonus?.opponent || 'defending';
    const joiners = currentProfile.rally.opponentJoiners || [];
    const bonuses = extractJoinerBonuses(joiners, mode);
    return bonuses;
  }, [currentProfile?.rally]);

  const profileLoaded = Boolean(currentProfile);
  const playerReady = Boolean(simulatedPlayerContext?.fighter);
  const opponentReady = Boolean(simulatedOpponentContext?.fighter);
  const rallyReady = Boolean(currentProfile?.rally && playerReady && opponentReady);
  const fightReady = Boolean(simulatedFightResult && !fightSimulationError);
  const roundsSimulated = simulatedFightResult?.rounds.length ?? 0;

  const handleProfileChange = useCallback((profile: UserProfile | null) => {
    setCurrentProfile(profile);
  }, []);

  const handleSave = async () => {
    if (currentProfile) {
      try {
        if (!isUuid(currentProfile.id)) {
          alert('Please create the profile first (use the Profile modal).');
          return;
        }
        const saved = await saveProfile(currentProfile);
        if (saved.id !== currentProfile.id) setCurrentProfile(saved);
        alert('Profile saved successfully!');
      } catch (err) {
        const message = (err as Error).message || '';
        console.error('Save failed', err);
        alert(message || 'Save failed');
      }
    }
  };

  const handleClearPlayerStorage = () => {
    if (!currentProfile) return;
    const cleared: UserProfile = {
      ...currentProfile,
      heroLevels: {},
      basicBonuses: getDefaultOpponentBasicBonuses(),
      expertSelections: getDefaultOpponentExpertSelections(),
      additiveBonuses: createDefaultAdditiveBonuses(),
      multiplicativeBonuses: {
        ...createDefaultMultiplicativeBonuses(),
        combatDebuffs: { attack: 0, defense: 0, lethality: 0, health: 0 }
      },
      petSkillSelections: createEmptyPetSkillSelections(),
      capacity: { rally: 0, march: 0 },
      baseCapacity: { rally: 0, march: 0 }
    };
    (async () => {
      setCurrentProfile(cleared);
      try {
        if (isUuid(cleared.id)) {
          const saved = await saveProfile(cleared);
          if (saved.id !== cleared.id) setCurrentProfile(saved);
        }
        alert('Player data cleared and saved.');
      } catch (err) {
        console.error('Clear player save failed', err);
        alert('Failed to save cleared player data');
      }
    })();
  };

  const handleClearOpponentStorage = () => {
    if (!currentProfile) return;
    const clearedOpponent: UserProfile['opponent'] = {
      heroLevels: {},
      basicBonuses: getDefaultOpponentBasicBonuses(),
      expertSelections: getDefaultOpponentExpertSelections(),
      additiveBonuses: createDefaultAdditiveBonuses(),
      multiplicativeBonuses: {
        ...createDefaultMultiplicativeBonuses(),
        combatDebuffs: { attack: 0, defense: 0, lethality: 0, health: 0 }
      },
      baseCapacity: { rally: 0, march: 0 },
      capacity: { rally: 0, march: 0 },
      commandCenterLevel: getDefaultOpponentCommandCenterLevel(),
      petSkillSelections: createEmptyPetSkillSelections()
    };
    const nextProfile = {
      ...currentProfile,
      opponent: clearedOpponent
    };
    (async () => {
      setCurrentProfile(nextProfile);
      try {
        if (isUuid(nextProfile.id)) {
          const saved = await saveProfile(nextProfile);
          if (saved.id !== nextProfile.id) setCurrentProfile(saved);
        }
        alert('Opponent data cleared and saved.');
      } catch (err) {
        console.error('Clear opponent save failed', err);
        alert('Failed to save cleared opponent data');
      }
    })();
  };

  const handleTroopMixChange = useCallback(
    (side: 'player' | 'opponent', mix: TroopMixConfig) => {
      setCurrentProfile((previous) => {
        if (!previous) {
          return previous;
        }
        const currentMix = previous.rally.troopMix ?? {
          player: DEFAULT_TROOP_MIX,
          opponent: DEFAULT_TROOP_MIX
        };
        return {
          ...previous,
          rally: {
            ...previous.rally,
            troopMix: {
              player: side === 'player' ? sanitizeMix(mix) : currentMix.player,
              opponent: side === 'opponent' ? sanitizeMix(mix) : currentMix.opponent
            }
          }
        };
      });
    },
    []
  );

  // Auto-calculate bonuses from Rally Configuration
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
      usePlayerHeroes: true
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
      usePlayerHeroes: false
    };
    const opponentHeroGear = currentProfile.opponent?.basicBonuses.heroGear || currentProfile.basicBonuses.heroGear;
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
      (opponentSpecial.attack !== opponentRallyBonuses.additive.specialBuffs.attack) ||
      (opponentSpecial.defense !== opponentRallyBonuses.additive.specialBuffs.defense) ||
      (opponentSpecial.lethality !== opponentRallyBonuses.additive.specialBuffs.lethality) ||
      (opponentSpecial.health !== opponentRallyBonuses.additive.specialBuffs.health);

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
        health: rallyBonuses.basic.health
      }
    };

    const updatedAdditiveBonuses: typeof currentProfile.additiveBonuses = {
      temporaryEvents: { ...(currentProfile.additiveBonuses?.temporaryEvents || { attack: 0, defense: 0, lethality: 0, health: 0 }) },
      supremePresident: { ...(currentProfile.additiveBonuses?.supremePresident || { attack: 0, defense: 0, lethality: 0, health: 0 }) },
      specialBuffs: {
        attack: playerRallyBonuses.additive.specialBuffs.attack,
        defense: playerRallyBonuses.additive.specialBuffs.defense,
        lethality: playerRallyBonuses.additive.specialBuffs.lethality,
        health: playerRallyBonuses.additive.specialBuffs.health
      }
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
        health: rallyBonuses.multiplicative.exclusiveWeapon.health
      },
      allianceTerritory: { ...currentProfile.multiplicativeBonuses.allianceTerritory },
      tyrantSpire: { ...currentProfile.multiplicativeBonuses.tyrantSpire },
      cityBonuses: {
        ...(currentProfile.multiplicativeBonuses.cityBonuses || {
          attack: 0,
          defense: 0,
          lethality: 0,
          health: 0,
          enemyAttackReduction: 0,
          enemyDefenseReduction: 0,
          deploymentCapacity: 0
        }),
        enemyAttackReduction: playerRallyBonuses.multiplicative.cityBonuses.enemyAttackReduction
      }
    };

    const updatedOpponent = currentProfile.opponent
      ? {
        ...currentProfile.opponent,
        additiveBonuses: {
          temporaryEvents: currentProfile.opponent.additiveBonuses?.temporaryEvents || { attack: 0, defense: 0, lethality: 0, health: 0 },
          supremePresident: currentProfile.opponent.additiveBonuses?.supremePresident || { attack: 0, defense: 0, lethality: 0, health: 0 },
          specialBuffs: {
            attack: opponentRallyBonuses.additive.specialBuffs.attack,
            defense: opponentRallyBonuses.additive.specialBuffs.defense,
            lethality: opponentRallyBonuses.additive.specialBuffs.lethality,
            health: opponentRallyBonuses.additive.specialBuffs.health
          }
        }
      }
      : undefined;

    setCurrentProfile((prev) => ({
      ...(prev || currentProfile),
      basicBonuses: updatedBasicBonuses,
      additiveBonuses: updatedAdditiveBonuses,
      multiplicativeBonuses: updatedMultiplicativeBonuses,
      opponent: updatedOpponent,
      heroGearSelections: currentProfile.heroGearSelections
    }));
  }, [currentProfile?.rally, currentProfile?.opponent?.basicBonuses?.heroGear]);

  // Auto-save to database when profile changes (debounced)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const lastSavedProfileIdRef = useRef<string | null>(null);
  const profileLoadTimeRef = useRef<number>(0);
  const isInitialLoadRef = useRef(true);

  // Track when profile is loaded to avoid saving immediately after load
  useEffect(() => {
    if (currentProfile && isUuid(currentProfile.id)) {
      // If this is a different profile ID, it's a new load
      if (lastSavedProfileIdRef.current !== currentProfile.id) {
        isInitialLoadRef.current = true;
        profileLoadTimeRef.current = Date.now();
      }
      lastSavedProfileIdRef.current = currentProfile.id;
      // Mark as no longer initial load after a short delay
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 3000);
    } else if (!currentProfile) {
      lastSavedProfileIdRef.current = null;
      isInitialLoadRef.current = true;
    }
  }, [currentProfile?.id]);

  useEffect(() => {
    if (!currentProfile) return;

    // Only auto-save if profile has a valid UUID (already created)
    if (!isUuid(currentProfile.id)) return;

    // Skip if we're currently saving
    if (isSavingRef.current) return;

    // Skip if this is the initial load (within first 3 seconds)
    if (isInitialLoadRef.current) {
      const timeSinceLoad = Date.now() - profileLoadTimeRef.current;
      if (timeSinceLoad < 3000) {
        return;
      }
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save (1.5 seconds after last change)
    saveTimeoutRef.current = setTimeout(async () => {
      if (!currentProfile || !isUuid(currentProfile.id)) return;

      isSavingRef.current = true;
      try {
        console.log('Auto-saving profile to database...', currentProfile.id);
        const saved = await saveProfile(currentProfile, false);
        console.log('Auto-save successful', saved.id);
        lastSavedProfileIdRef.current = saved.id;
        // Update profile if ID changed (shouldn't happen, but just in case)
        if (saved.id !== currentProfile.id) {
          setCurrentProfile(saved);
        }
      } catch (err) {
        console.error('Auto-save failed', err);
        // Don't show alert for auto-save failures, just log
      } finally {
        isSavingRef.current = false;
      }
    }, 1500);

    // Cleanup timeout on unmount or profile change
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentProfile]);

  return {
    currentProfile,
    setCurrentProfile,
    activeTab,
    setActiveTab,
    profileSubTab,
    setProfileSubTab,
    opponentSubTab,
    setOpponentSubTab,
    playerBaseStats,
    opponentBaseStats,
    playerCapacityReport,
    opponentCapacityReport,
    simulatedFightResult,
    fightSimulationError,
    simulatedPlayerContext,
    simulatedOpponentContext,
    simulatedBattleReport,
    simulationMode,
    setSimulationModeAction: setSimulationMode,
    simulationCount,
    setSimulationCountAction: setSimulationCount,
    playerJoinerInfo,
    opponentJoinerInfo,
    profileLoaded,
    playerReady,
    opponentReady,
    rallyReady,
    fightReady,
    roundsSimulated,
    handleProfileChange,
    handleSave,
    handleClearPlayerStorage,
    handleClearOpponentStorage,
    handleTroopMixChange
  };
}

