import type { RallyConfiguration } from '@/components/types';
import { toBattleResultsViewModel } from '@/features/battle-results/viewmodel/toBattleResultsViewModel';
import type { BattleResultsViewModel } from '@/features/battle-results/viewmodel/types';
import type { BattleSimulationRequest } from '@/features/battle-setup/schemas/battle';
import { buildSideBaseStats } from '@/lib/battle/battle-calculator-helpers';
import { getHeroExpeditionSkills } from '@/lib/battle/data-selectors';
import { getHeroByName } from '@/lib/battle/data/heroes/hero-extractor';
import { simulateBattle } from '@/lib/combat/engine';
import { convertJoinersToSkillDefinitions, convertLeadersToSkillDefinitions } from '@/lib/combat/hero-skill-converter';
import type { BattleConfig, BattleReport, SideComposition, TroopCounts, TroopStats } from '@/lib/combat/types';
import { buildConfigForSide } from '@/lib/rally/rally-config';
import { sanitizeObject } from '../security/sanitize';

/**
 * Battle Simulation Service
 *
 * Responsibilities:
 * 1. Merge player/opponent + rally config into engine input
 * 2. Enforce joiner contribution rules (weights, caps, duplicates)
 * 3. Deterministically select joiner primary skills
 * 4. Execute lib/combat via engine
 * 5. Build derived outputs (timeline, metrics, rationale)
 * 6. Return full API response payload
 */

export interface SimulationResponse {
  result: {
    winner: 'attacker' | 'defender' | 'draw';
    turnsElapsed: number;
  };
  report: BattleReport;
  viewModel: BattleResultsViewModel;
  cacheMetadata: {
    hash: string;
    cached: boolean;
  };
}

/**
 * Validates and enforces joiner contribution rules
 */
function validateJoiners(request: BattleSimulationRequest): {
  valid: true;
  joiners: BattleSimulationRequest['rally']['joiners'];
} | {
  valid: false;
  error: string;
} {
  const { joiners } = request.rally;

  // Check max length
  if (joiners.length > 5) {
    return {
      valid: false,
      error: 'Maximum 5 joiners allowed',
    };
  }

  // Check for duplicates
  const joinerIds = joiners.map((j) => j.joinerId);
  const uniqueIds = new Set(joinerIds);
  if (uniqueIds.size !== joinerIds.length) {
    return {
      valid: false,
      error: 'Duplicate joiner IDs not allowed',
    };
  }

  // Check weights
  for (const joiner of joiners) {
    if (joiner.weight < 0 || joiner.weight > 100) {
      return {
        valid: false,
        error: `Joiner ${joiner.joinerId} has invalid weight: ${joiner.weight}`,
      };
    }
  }

  // Check total contribution
  const totalContribution = joiners.reduce((sum, j) => sum + j.weight, 0);
  if (totalContribution > 100) {
    return {
      valid: false,
      error: `Total joiner contribution (${totalContribution}%) exceeds maximum (100%)`,
    };
  }

  return { valid: true, joiners };
}

/**
 * Converts request to SideComposition for the combat engine
 * Uses existing helper functions to build from UserProfile-like structure
 */
function toSideComposition(
  sideSetup: BattleSimulationRequest['player'] | BattleSimulationRequest['opponent'],
  role: 'attacker' | 'defender',
  rallyConfig: RallyConfiguration
): SideComposition {
  // Build base stats using existing helper
  const baseStats = buildSideBaseStats(
    sideSetup.basicBonuses as any, // Schema uses passthrough, type is compatible
    sideSetup.additiveBonuses as any,
    sideSetup.multiplicativeBonuses as any,
    rallyConfig,
    sideSetup.heroLevels as any, // Schema type is compatible with HeroLevel
    role === 'attacker' ? 'player' : 'opponent',
    sideSetup.troopLevels
  );

  // Build rally side config to get troop counts
  const rallySide = buildConfigForSide(
    rallyConfig,
    role === 'attacker' ? 'player' : 'opponent',
    baseStats
  );

  // Map troop counts (RallySideConfig uses lowercase keys like 'infantry', engine uses capitalized 'Infantry')
  // Use the same mapping approach as lib/combat/adapter.ts
  const mapCounts = (counts: Record<string, number>): TroopCounts => {
    return {
      Infantry: counts.infantry ?? counts.Infantry ?? 0,
      Lancer: counts.lancer ?? counts.Lancer ?? 0,
      Marksman: counts.marksman ?? counts.Marksman ?? 0,
    };
  };

  const mapBaseStats = (stats: Record<string, { attack: number; defense: number; health: number; lethality: number }>): Record<keyof TroopCounts, TroopStats> => {
    return {
      Infantry: stats.infantry ?? stats.Infantry ?? { attack: 0, defense: 0, health: 0, lethality: 0 },
      Lancer: stats.lancer ?? stats.Lancer ?? { attack: 0, defense: 0, health: 0, lethality: 0 },
      Marksman: stats.marksman ?? stats.Marksman ?? { attack: 0, defense: 0, health: 0, lethality: 0 },
    } as Record<keyof TroopCounts, TroopStats>;
  };

  const troops = mapCounts(rallySide.troopCounts as any);
  const mappedBaseStats = mapBaseStats(baseStats as any);

  // Convert leader heroes to skills (all skills at configured levels)
  const leaders = role === 'attacker'
    ? (rallyConfig.playerLeader ?? rallyConfig.leader)
    : (rallyConfig.opponentLeader ?? rallyConfig.leader);

  const leaderSkills = convertLeadersToSkillDefinitions(
    {
      infantry: leaders.infantry ? {
        heroName: leaders.infantry.heroName,
        skillLevels: leaders.infantry.skillLevels || {}
      } : null,
      lancer: leaders.lancer ? {
        heroName: leaders.lancer.heroName,
        skillLevels: leaders.lancer.skillLevels || {}
      } : null,
      marksman: leaders.marksman ? {
        heroName: leaders.marksman.heroName,
        skillLevels: leaders.marksman.skillLevels || {}
      } : null
    },
    getHeroByName,
    getHeroExpeditionSkills
  );

  // Convert joiner heroes to skills (only 1st skill at max level, first 4 joiners only)
  const joiners = role === 'attacker'
    ? (rallyConfig.playerJoiners ?? rallyConfig.joiners ?? [])
    : (rallyConfig.opponentJoiners ?? []);

  const joinerSkills = convertJoinersToSkillDefinitions(
    joiners.map(j => ({ heroName: j.heroName })),
    getHeroByName,
    getHeroExpeditionSkills
  );

  return {
    name: role === 'attacker' ? 'Attacker' : 'Defender',
    role,
    troops,
    baseStats: mappedBaseStats,
    additiveBonuses: {},
    specialBonuses: {},
    damageModifiers: [],
    skills: [...leaderSkills, ...joinerSkills],
  };
}

/**
 * Deterministically selects joiner primary skills
 */
function selectJoinerSkills(
  joiners: BattleSimulationRequest['rally']['joiners'],
  battleType: string
): Array<{ joinerId: string; skillId: string; skillLevel: number }> {
  // TODO: Implement deterministic skill selection logic
  // For now, return empty array
  return joiners.map((joiner) => ({
    joinerId: joiner.joinerId,
    skillId: 'default',
    skillLevel: joiner.skillLevel,
  }));
}

/**
 * Main simulation function
 */
export async function simulate(
  request: BattleSimulationRequest,
  inputHash: string
): Promise<SimulationResponse> {
  // Sanitize inputs
  const sanitizedRequest = sanitizeObject(request);

  // Validate joiners
  const joinerValidation = validateJoiners(sanitizedRequest);
  if (!joinerValidation.valid) {
    throw new Error(joinerValidation.error);
  }

  // Select joiner skills
  const joinerSkills = selectJoinerSkills(
    joinerValidation.joiners,
    sanitizedRequest.rally.battleType
  );

  // Convert to engine input
  const attackerComposition = toSideComposition(
    sanitizedRequest.player,
    'attacker',
    sanitizedRequest.rally as unknown as RallyConfiguration // Schema type is compatible
  );
  const defenderComposition = toSideComposition(
    sanitizedRequest.opponent,
    'defender',
    sanitizedRequest.rally as unknown as RallyConfiguration // Schema type is compatible
  );

  // Build battle config (merge with defaults from engine)
  const battleConfig: Partial<BattleConfig> = {
    battleType: sanitizedRequest.rally.battleType as BattleConfig['battleType'],
    randomMode: (sanitizedRequest.simulationConfig?.randomMode === 'deterministic' ? 'expectedValue' : sanitizedRequest.simulationConfig?.randomMode) || 'monteCarlo' as any,
    simulations: sanitizedRequest.simulationConfig?.simulations,
    maxTurns: sanitizedRequest.simulationConfig?.maxTurns,
    rngSeed: sanitizedRequest.simulationConfig?.rngSeed,
  };

  // Execute simulation
  console.log('Executing simulation with config:', {
    battleType: battleConfig.battleType,
    randomMode: battleConfig.randomMode,
    attackerTroops: attackerComposition.troops,
    defenderTroops: defenderComposition.troops,
  });

  const outcome = simulateBattle({
    attacker: attackerComposition,
    defender: defenderComposition,
    config: battleConfig,
  });

  if (outcome.error) {
    console.error('Simulation error:', outcome.error);
    throw new Error(outcome.error);
  }

  const report = outcome.report;
  console.log('Simulation completed:', {
    winner: report.winner,
    turns: report.turns.length,
    attackerRemaining: report.attackerRemaining,
    defenderRemaining: report.defenderRemaining,
  });

  // Build view model
  const viewModel = toBattleResultsViewModel(report);

  // Build response
  return {
    result: {
      winner: report.winner,
      turnsElapsed: report.turns.length,
    },
    report,
    viewModel,
    cacheMetadata: {
      hash: inputHash,
      cached: false, // Will be set by route handler if cache hit
    },
  };
}
