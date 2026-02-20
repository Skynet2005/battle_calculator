import type { BattleConfig, BattleReport } from '@/domain/battle/engine/types';
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
import { simulateBattleFromUI } from '@/domain/battle/engine/adapter';
import { useUpdateProfile } from '@/shared/hooks/useProfiles';
import { migrateProfile } from '@/features/profile/api/profile-migration';
import { toast } from '@/shared/utils/toast';
import type { FightResult } from '@/domain/rally/combat-fight';
import { buildFighterSnapshot, totalTroops, type FighterSnapshot } from '@/domain/rally/combat-fighter';
import { calculateRallyBonuses, extractJoinerBonuses } from '@/domain/rally/rally-bonus-extractor';
import { clientLogger } from '@/shared/utils/clientLogger';
import { isUuid } from '@/shared/utils/validation';
import { useAutoSave } from './useAutoSave';
import { useRallyBonuses } from './useRallyBonuses';

export function useBattleCalculatorState() {
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'opponent' | 'rally' | 'results' | 'howto'>('rally');
  const [profileSubTab, setProfileSubTab] = useState<'info' | 'heroes' | 'basic' | 'research' | 'chief' | 'pets'>('info');
  const [opponentSubTab, setOpponentSubTab] = useState<'info' | 'heroes' | 'basic' | 'research' | 'chief' | 'pets'>('info');
  const [simulationMode, setSimulationMode] = useState<BattleConfig['randomMode']>('monteCarlo');
  const [simulationCount, setSimulationCount] = useState<number>(50);
  const [previousBattleReport, setPreviousBattleReport] = useState<BattleReport | null>(null);

  // Get the update profile mutation hook
  const updateProfileMutation = useUpdateProfile();

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
          maxTurns: 1000, // High limit to allow battles to continue until one side reaches zero troops
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
      clientLogger.error('Failed to simulate fight', error, {
        component: 'useBattleCalculatorState',
        simulationMode,
        simulationCount
      });
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
  }, [currentProfile?.rally, playerBaseStats, opponentBaseStats, playerCapacityReport, opponentCapacityReport, simulationMode, simulationCount]);

  const {
    result: simulatedFightResult,
    battleReport: simulatedBattleReport,
    error: fightSimulationError,
    player: simulatedPlayerContext,
    opponent: simulatedOpponentContext
  } = fightSimulation;

  // Track previous battle report for comparison
  const lastReportRef = useRef<BattleReport | null>(null);
  useEffect(() => {
    if (simulatedBattleReport && lastReportRef.current && lastReportRef.current !== simulatedBattleReport) {
      setPreviousBattleReport(lastReportRef.current);
    }
    lastReportRef.current = simulatedBattleReport;
  }, [simulatedBattleReport]);

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
      if (!isUuid(currentProfile.id)) {
        toast.error('Please create the profile first', 'Use the Profile modal to create a profile');
        return;
      }
      updateProfileMutation.mutate(
        { id: currentProfile.id, name: currentProfile.name, data: currentProfile, setCurrent: true },
        {
          onSuccess: (response) => {
            // Import migrateProfile if needed
            const { migrateProfile } = require('@/features/profile/api/profile-migration');
          const saved = migrateProfile({
            ...response.data,
            id: response.id,
            name: response.name,
            createdAt: response.createdAt ? new Date(response.createdAt).getTime() : response.data.createdAt,
            updatedAt: response.updatedAt ? new Date(response.updatedAt).getTime() : response.data.updatedAt,
          });
          if (saved.id !== currentProfile.id) setCurrentProfile(saved);
          toast.success('Profile saved successfully!');
          },
          onError: (error) => {
            clientLogger.error('Save failed', error, {
              component: 'useBattleCalculatorState',
              profileId: currentProfile.id
            });
            toast.error('Save failed', error.message || 'Please try again');
          },
        }
      );
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
          const response = await updateProfileMutation.mutateAsync({
            id: cleared.id,
            name: cleared.name,
            data: cleared,
            setCurrent: true,
          });
          const saved = migrateProfile({
            ...response.data,
            id: response.id,
            name: response.name,
            createdAt: response.createdAt ? new Date(response.createdAt).getTime() : response.data.createdAt,
            updatedAt: response.updatedAt ? new Date(response.updatedAt).getTime() : response.data.updatedAt,
          });
          if (saved.id !== cleared.id) setCurrentProfile(saved);
        }
        toast.success('Player data cleared and saved.');
      } catch (err) {
        clientLogger.error('Clear player save failed', err as Error, {
          component: 'useBattleCalculatorState',
          profileId: cleared.id
        });
        toast.error('Failed to save cleared player data', (err as Error).message || 'Please try again');
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
          const response = await updateProfileMutation.mutateAsync({
            id: nextProfile.id,
            name: nextProfile.name,
            data: nextProfile,
            setCurrent: true,
          });
          const saved = migrateProfile({
            ...response.data,
            id: response.id,
            name: response.name,
            createdAt: response.createdAt ? new Date(response.createdAt).getTime() : response.data.createdAt,
            updatedAt: response.updatedAt ? new Date(response.updatedAt).getTime() : response.data.updatedAt,
          });
          if (saved.id !== nextProfile.id) setCurrentProfile(saved);
        }
        toast.success('Opponent data cleared and saved.');
      } catch (err) {
        clientLogger.error('Clear opponent save failed', err as Error, {
          component: 'useBattleCalculatorState',
          profileId: nextProfile.id
        });
        toast.error('Failed to save cleared opponent data', (err as Error).message || 'Please try again');
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

  // Extracted hooks: auto-calculate rally bonuses and auto-save
  useRallyBonuses(currentProfile, setCurrentProfile);
  useAutoSave(currentProfile, setCurrentProfile);

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
    previousBattleReport,
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

