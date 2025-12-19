import { describe, expect, it } from "vitest";

import { computeDamage } from "../../lib/combat/damage";
import { simulateBattle } from "../../lib/combat/engine";
import {
  DEFAULT_BATTLE_CONFIG,
  type ActionComputationLog,
  type DamageInput,
  type ModifierComponentLog,
  type SideComposition,
  type TroopStats
} from "../../lib/combat/types";

const BASE_STATS: Record<"Infantry" | "Lancer" | "Marksman", TroopStats> = {
  Infantry: { attack: 100, defense: 80, health: 90, lethality: 110 },
  Lancer: { attack: 100, defense: 80, health: 90, lethality: 110 },
  Marksman: { attack: 100, defense: 80, health: 90, lethality: 110 }
};

describe("logging and report enrichment", () => {
  it("computeDamage returns component logs when provided", () => {
    const outgoingDetails: ModifierComponentLog[] = [
      { id: "o1", source: "Test Buff", stackingKey: "buff", magnitude: 0.2, subject: "outgoing", appliesTo: "All", kept: true }
    ];
    const incomingDetails: ModifierComponentLog[] = [
      { id: "i1", source: "Test Debuff", stackingKey: "debuff", magnitude: -0.1, subject: "incoming", appliesTo: "All", kept: true }
    ];
    const input: DamageInput = {
      attackerType: "Infantry",
      defenderType: "Infantry",
      attackerStats: BASE_STATS.Infantry,
      defenderStats: BASE_STATS.Infantry,
      attackerCount: 100,
      defenderCount: 80,
      matchupMultiplier: 1,
      actionMultiplier: 1,
      outgoingModifiers: outgoingDetails.map((m) => m.magnitude),
      incomingModifiers: incomingDetails.map((m) => m.magnitude),
      outgoingDetails,
      incomingDetails
    };

    const result: ActionComputationLog = computeDamage(input, DEFAULT_BATTLE_CONFIG);

    expect(result.rawFinal).toBeDefined();
    expect(result.outgoingComponents.length).toBeGreaterThan(0);
    expect(result.incomingComponents.length).toBeGreaterThan(0);
    expect(result.finalKills).toBeGreaterThan(0);
  });

  it("simulateBattle emits enriched action logs and config snapshot", () => {
    const side: SideComposition = {
      name: "Side",
      role: "attacker",
      troops: { Infantry: 200, Lancer: 0, Marksman: 0 },
      rows: [],
      baseStats: BASE_STATS,
      additiveBonuses: {},
      specialBonuses: {},
      damageModifiers: [],
      skills: [],
      heroes: []
    };

    const outcome = simulateBattle({
      attacker: side,
      defender: { ...side, name: "Defender", role: "defender" },
      config: { maxTurns: 1, rngSeed: 3 }
    });

    const report = outcome.report;
    expect(report.configSnapshot).toBeDefined();
    expect(report.turns.length).toBeGreaterThan(0);
    const firstAction = report.turns[0].actions[0];
    expect(firstAction.id).toBeTruthy();
    expect(firstAction.components.rawFinal).toBeDefined();
    expect(firstAction.stats?.attacker.attack.base).toBeGreaterThan(0);
  });
});
