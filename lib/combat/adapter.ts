import { getHeroExpeditionSkills } from "../battle/data-selectors";
import { getHeroByName } from "../battle/data/heroes/hero-extractor";
import type { DamageDebug, RoundResult } from "../rally/combat-battle-round";
import type { FightResult } from "../rally/combat-fight";
import type {
  TroopCounts as LegacyTroopCounts,
  RallyConfig,
  RallySideConfig,
  SideBaseStats
} from "../rally/combat-types";
import { simulateBattle, type SimulateParams } from "./engine";
import { convertJoinersToSkillDefinitions, convertLeadersToSkillDefinitions, convertTroopSkillsToSkillDefinitions } from "./hero-skill-converter";
import type { BattleConfig, BattleReport, SideComposition, SkillDefinition, TroopCounts, TroopStats } from "./types";

export interface UISimulationInput {
  config: RallyConfig;
  battleConfig?: Partial<BattleConfig>;
}

export interface UISimulationOutput {
  report: BattleReport;
  legacyFight: FightResult;
}

export function simulateBattleFromUI(input: UISimulationInput): UISimulationOutput {
  const attackerSide = input.config.attacker;
  const defenderSide = input.config.defender;

  const attackerComposition = toSideComposition(attackerSide);
  const defenderComposition = toSideComposition(defenderSide);

  const params: SimulateParams = {
    attacker: attackerComposition,
    defender: defenderComposition,
    config: input.battleConfig
  };

  const outcome = simulateBattle(params);
  const legacyFight = toLegacyFight(outcome.report);

  return { report: outcome.report, legacyFight };
}

function toSideComposition(side: RallySideConfig): SideComposition {
  // Convert leader heroes to skills (all skills at configured levels)
  const leaderSkills: SkillDefinition[] = convertLeadersToSkillDefinitions(
    {
      infantry: side.heroes.infantry ? {
        heroName: side.heroes.infantry.heroName,
        skillLevels: side.heroes.infantry.skillLevels || {}
      } : null,
      lancer: side.heroes.lancer ? {
        heroName: side.heroes.lancer.heroName,
        skillLevels: side.heroes.lancer.skillLevels || {}
      } : null,
      marksman: side.heroes.marksman ? {
        heroName: side.heroes.marksman.heroName,
        skillLevels: side.heroes.marksman.skillLevels || {}
      } : null
    },
    getHeroByName,
    getHeroExpeditionSkills
  );

  // Convert joiner heroes to skills (only 1st skill at max level, first 4 joiners only)
  const joinerSkills: SkillDefinition[] = convertJoinersToSkillDefinitions(
    side.joiners.map(j => ({ heroName: j.heroName })),
    getHeroByName,
    getHeroExpeditionSkills
  );

  // Troop passive skills (heuristic mapping) per troop type present
  const troopSkills: SkillDefinition[] = [
    ...convertTroopSkillsToSkillDefinitions("infantry"),
    ...convertTroopSkillsToSkillDefinitions("lancer"),
    ...convertTroopSkillsToSkillDefinitions("marksman"),
  ];

  return {
    name: side.role === "attacker" ? "Attacker" : "Defender",
    role: side.role,
    troops: mapCounts(side.troopCounts),
    baseStats: mapBaseStats(side.baseStats),
    additiveBonuses: {},
    specialBonuses: {},
    damageModifiers: [],
    skills: [...leaderSkills, ...joinerSkills, ...troopSkills]
  };
}

function mapCounts(counts: LegacyTroopCounts): TroopCounts {
  return {
    Infantry: counts.infantry ?? 0,
    Lancer: counts.lancer ?? 0,
    Marksman: counts.marksman ?? 0
  };
}

function mapBaseStats(stats: SideBaseStats): Record<keyof TroopCounts, TroopStats> {
  return {
    Infantry: stats.infantry ?? { attack: 0, defense: 0, health: 0, lethality: 0 },
    Lancer: stats.lancer ?? { attack: 0, defense: 0, health: 0, lethality: 0 },
    Marksman: stats.marksman ?? { attack: 0, defense: 0, health: 0, lethality: 0 }
  } as Record<keyof TroopCounts, TroopStats>;
}

function toLegacyFight(report: BattleReport): FightResult {
  const rounds: RoundResult[] = report.turns.map((turn, index, arr) => {
    const prev = index === 0 ? undefined : arr[index - 1];
    const attackerCasualties = diff(prev?.attackerTroops ?? report.attacker.troops, turn.attackerTroops);
    const defenderCasualties = diff(prev?.defenderTroops ?? report.defender.troops, turn.defenderTroops);
    const attackerLogs = turn.actions
      .filter((a) => a.side === "attacker")
      .map((a) => mapDamageDebug(a));
    const defenderLogs = turn.actions
      .filter((a) => a.side === "defender")
      .map((a) => mapDamageDebug(a));
    return {
      roundIndex: turn.turn - 1,
      attackerCasualties,
      defenderCasualties,
      attackerRemaining: toLegacyCounts(turn.attackerTroops),
      defenderRemaining: toLegacyCounts(turn.defenderTroops),
      ended: index === report.turns.length - 1,
      attackerDamageLog: attackerLogs,
      defenderDamageLog: defenderLogs
    };
  });

  return {
    rounds,
    attackerRemaining: toLegacyCounts(report.attackerRemaining),
    defenderRemaining: toLegacyCounts(report.defenderRemaining),
    attackerWon: report.winner === "attacker",
    defenderWon: report.winner === "defender"
  };
}

function diff(prev: TroopCounts, next: TroopCounts): LegacyTroopCounts {
  return {
    infantry: Math.max(0, prev.Infantry - next.Infantry),
    lancer: Math.max(0, prev.Lancer - next.Lancer),
    marksman: Math.max(0, prev.Marksman - next.Marksman)
  };
}

function toLegacyCounts(counts: TroopCounts): LegacyTroopCounts {
  return {
    infantry: counts.Infantry,
    lancer: counts.Lancer,
    marksman: counts.Marksman
  };
}

function mapDamageDebug(action: BattleReport["turns"][number]["actions"][number]): DamageDebug {
  return {
    attackerType: action.actor.toLowerCase() as DamageDebug["attackerType"],
    defenderType: action.target.toLowerCase() as DamageDebug["defenderType"],
    attackMultiplier: action.components.outgoingMultiplier,
    lethalityMultiplier: action.components.outgoingMultiplier,
    defenseMultiplier: Math.max(1, action.components.incomingMultiplier),
    healthMultiplier: Math.max(1, action.components.incomingMultiplier),
    moraleMultiplier: 1,
    controlMultiplier: 1,
    dotMultiplier: 1,
    hiddenFactor: 1,
    sqrtTroops: Math.sqrt(Math.max(1, action.attackerCount)),
    offensivePower: action.components.baseKills,
    defensivePower: 1 / Math.max(1e-6, action.components.incomingMultiplier),
    mitigation: action.components.incomingMultiplier,
    kills: action.components.finalKills
  };
}
