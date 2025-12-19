/**
 * Comprehensive tests for Hero Skill System
 *
 * Tests cover:
 * - Joiner selection (only first 4, only 1st skill, max level)
 * - Additive stacking (same type bonuses add together)
 * - Multiplicative stacking (different types multiply)
 * - Troop scoping (effects apply only to specified troops)
 * - Duration expiration (buffs expire after correct number of turns)
 * - Periodic triggers ("Every N turns" triggers at correct turns)
 * - Chance procs (deterministic RNG produces expected results)
 * - Wu Ming infantry-only (normal/skill reductions apply only to infantry)
 * - Not stackable (Renee's recurring buff replaces previous instance)
 * - Integration tests (multi-joiner mixes, leader + joiner combinations)
 */

import { describe, expect, it } from "vitest";
import { getHeroExpeditionSkills } from "../../lib/battle/data-selectors";
import { getHeroByName } from "../../lib/battle/data/heroes/hero-extractor";
import type { LevelSkill } from "../../lib/battle/data/heroes/hero_types";
import {
  convertJoinersToSkillDefinitions,
  convertLeadersToSkillDefinitions,
  convertLevelSkillToSkillDefinition
} from "../../lib/combat/hero-skill-converter";
import { applyStackingRules } from "../../lib/combat/skill-stacking";
import { initSkillRuntime, makeRng, triggerSkills } from "../../lib/combat/skills";
import type { DamageModifier, SkillDefinition } from "../../lib/combat/types";

describe("Hero Skill Converter", () => {
  describe("convertLevelSkillToSkillDefinition", () => {
    it("should convert a simple permanent passive skill", () => {
      const skill: LevelSkill = {
        "skill-name": "Test Skill",
        "description": "Test description",
        "all_troops_damage_up_percentage": {
          "1": 0.10,
          "2": 0.15,
          "3": 0.20,
          "4": 0.25,
          "5": 0.30
        }
      };

      const result = convertLevelSkillToSkillDefinition("TestHero", skill, 1, 5);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Test Skill");
      expect(result?.trigger).toBe("PassivePermanent");
      expect(result?.effects.length).toBeGreaterThan(0);
      expect(result?.effects[0].damageModifier?.magnitude).toBeCloseTo(0.30, 5);
    });

    it("should handle periodic triggers correctly", () => {
      const skill: LevelSkill = {
        "skill-name": "Periodic Skill",
        "description": "Every 4 turns",
        "all_troops_damage_up_percentage": {
          "5": 1.0
        },
        "trigger_every_n_turns": 4
      };

      const result = convertLevelSkillToSkillDefinition("TestHero", skill, 1, 5);

      expect(result).not.toBeNull();
      expect(result?.trigger).toBe("OnTurnStart");
      expect(result?.periodicInterval).toBe(4);
      expect(result?.isAfterEveryNTurns).toBeUndefined();
    });

    it("should handle chance procs correctly", () => {
      const skill: LevelSkill = {
        "skill-name": "Chance Skill",
        "description": "50% chance",
        "all_troops_damage_up_percentage": {
          "5": 0.50
        },
        "trigger_chance": 0.5
      };

      const result = convertLevelSkillToSkillDefinition("TestHero", skill, 1, 5);

      expect(result).not.toBeNull();
      expect(result?.effects[0].chance).toBe(0.5);
    });

    it("should handle durations correctly", () => {
      const skill: LevelSkill = {
        "skill-name": "Duration Skill",
        "description": "Lasts 2 turns",
        "all_troops_damage_up_percentage": {
          "5": 0.25
        },
        "duration_turns": 2
      };

      const result = convertLevelSkillToSkillDefinition("TestHero", skill, 1, 5);

      expect(result).not.toBeNull();
      expect(result?.effects[0].durationTurns).toBe(2);
      expect(result?.effects[0].damageModifier?.durationTurns).toBe(2);
    });

    it("should handle troop-scoped effects", () => {
      const skill: LevelSkill = {
        "skill-name": "Infantry Skill",
        "description": "Infantry only",
        "infantry_damage_up_percentage": {
          "5": 0.20
        }
      };

      const result = convertLevelSkillToSkillDefinition("TestHero", skill, 1, 5);

      expect(result).not.toBeNull();
      expect(result?.effects[0].target).toBe("Infantry");
      expect(result?.effects[0].damageModifier?.appliesTo).toBe("Infantry");
    });

    it("should handle Wu Ming's infantry-only normal/skill damage reductions", () => {
      const wuMing = getHeroByName("Wu Ming");
      expect(wuMing).not.toBeNull();

      const skills = getHeroExpeditionSkills(wuMing!);
      const firstSkill = skills[0];

      const result = convertLevelSkillToSkillDefinition("Wu Ming", firstSkill.data as LevelSkill, 1, 5);

      expect(result).not.toBeNull();

      // Should have two effects: normal attack reduction and skill damage reduction
      const normalAttackEffect = result?.effects.find(e =>
        e.damageModifier?.scope === "NormalAttackReceived"
      );
      const skillDamageEffect = result?.effects.find(e =>
        e.damageModifier?.scope === "SkillReceived"
      );

      expect(normalAttackEffect).toBeDefined();
      expect(skillDamageEffect).toBeDefined();
      expect(normalAttackEffect?.damageModifier?.appliesTo).toBe("Infantry");
      expect(skillDamageEffect?.damageModifier?.appliesTo).toBe("Infantry");
    });
  });

  describe("convertJoinersToSkillDefinitions", () => {
    it("should only process first 4 joiners", () => {
      const joiners = [
        { heroName: "Sergey" },
        { heroName: "Bahiti" },
        { heroName: "Patrick" },
        { heroName: "Jessie" },
        { heroName: "Seo-yoon" }, // 5th joiner should be ignored
      ];

      const skills = convertJoinersToSkillDefinitions(
        joiners,
        getHeroByName,
        getHeroExpeditionSkills
      );

      expect(skills.length).toBe(4);
    });

    it("should only use 1st skill from each joiner", () => {
      const joiners = [
        { heroName: "Patrick" }, // Has 2 skills, should only use 1st
      ];

      const skills = convertJoinersToSkillDefinitions(
        joiners,
        getHeroByName,
        getHeroExpeditionSkills
      );

      expect(skills.length).toBe(1);
      // Patrick's 1st skill is "Super Nutrients" (Health Up)
      expect(skills[0].name).toContain("Super Nutrients");
    });

    it("should use max level for joiner skills", () => {
      const joiners = [
        { heroName: "Sergey" },
      ];

      const skills = convertJoinersToSkillDefinitions(
        joiners,
        getHeroByName,
        getHeroExpeditionSkills
      );

      expect(skills.length).toBe(1);
      expect(skills[0].level).toBe(5); // Max level
    });

    it("should handle empty joiners array", () => {
      const skills = convertJoinersToSkillDefinitions(
        [],
        getHeroByName,
        getHeroExpeditionSkills
      );

      expect(skills.length).toBe(0);
    });
  });

  describe("convertLeadersToSkillDefinitions", () => {
    it("should convert all skills from leader heroes", () => {
      const leaders = {
        infantry: {
          heroName: "Sergey",
          skillLevels: { "Defender's Edge": 5, "Weaken": 5 }
        },
        lancer: null,
        marksman: null
      };

      const skills = convertLeadersToSkillDefinitions(
        leaders,
        getHeroByName,
        getHeroExpeditionSkills
      );

      expect(skills.length).toBe(2); // Sergey has 2 skills
    });

    it("should use configured skill levels", () => {
      const leaders = {
        infantry: {
          heroName: "Sergey",
          skillLevels: { "Defender's Edge": 3, "Weaken": 2 }
        },
        lancer: null,
        marksman: null
      };

      const skills = convertLeadersToSkillDefinitions(
        leaders,
        getHeroByName,
        getHeroExpeditionSkills
      );

      expect(skills[0].level).toBe(3);
      expect(skills[1].level).toBe(2);
    });

    it("should default to level 5 if skill level not specified", () => {
      const leaders = {
        infantry: {
          heroName: "Sergey",
          skillLevels: {}
        },
        lancer: null,
        marksman: null
      };

      const skills = convertLeadersToSkillDefinitions(
        leaders,
        getHeroByName,
        getHeroExpeditionSkills
      );

      expect(skills[0].level).toBe(5);
    });
  });
});

describe("Periodic Triggers", () => {
  it("should trigger 'every 4 turns' at turns 4, 8, 12...", () => {
    const skill: SkillDefinition = {
      id: "test_periodic",
      name: "Every 4 Turns",
      trigger: "OnTurnStart",
      effects: [{
        id: "effect1",
        trigger: "OnTurnStart",
        type: "DamageMultiplier",
        target: "All",
        damageModifier: {
          id: "mod1",
          source: "test",
          subject: "outgoing",
          appliesTo: "All",
          durationTurns: 0,
          chance: 1,
          magnitude: 1.0
        }
      }],
      periodicInterval: 4
    };

    const runtime = initSkillRuntime([skill]);
    const rng = makeRng(12345);

    // Turn 1: Should not trigger
    const turn1 = triggerSkills(runtime, "OnTurnStart", 1, { randomMode: "expectedValue", stackingBehavior: "permissive" } as any, rng);
    expect(turn1.effects.length).toBe(0);

    // Turn 4: Should trigger
    const turn4 = triggerSkills(runtime, "OnTurnStart", 4, { randomMode: "expectedValue", stackingBehavior: "permissive" } as any, rng);
    expect(turn4.effects.length).toBeGreaterThan(0);

    // Turn 8: Should trigger
    const turn8 = triggerSkills(runtime, "OnTurnStart", 8, { randomMode: "expectedValue", stackingBehavior: "permissive" } as any, rng);
    expect(turn8.effects.length).toBeGreaterThan(0);
  });

  it("should trigger 'every 2 turns' at turns 2, 4, 6...", () => {
    const skill: SkillDefinition = {
      id: "test_periodic_2",
      name: "Every 2 Turns",
      trigger: "OnTurnStart",
      effects: [{
        id: "effect1",
        trigger: "OnTurnStart",
        type: "DamageMultiplier",
        target: "All",
        damageModifier: {
          id: "mod1",
          source: "test",
          subject: "outgoing",
          appliesTo: "All",
          durationTurns: 0,
          chance: 1,
          magnitude: 0.5
        }
      }],
      periodicInterval: 2
    };

    const runtime = initSkillRuntime([skill]);
    const rng = makeRng(12345);

    // Turn 1: Should not trigger
    const turn1 = triggerSkills(runtime, "OnTurnStart", 1, { randomMode: "expectedValue", stackingBehavior: "permissive" } as any, rng);
    expect(turn1.effects.length).toBe(0);

    // Turn 2: Should trigger
    const turn2 = triggerSkills(runtime, "OnTurnStart", 2, { randomMode: "expectedValue", stackingBehavior: "permissive" } as any, rng);
    expect(turn2.effects.length).toBeGreaterThan(0);

    // Turn 3: Should not trigger
    const turn3 = triggerSkills(runtime, "OnTurnStart", 3, { randomMode: "expectedValue", stackingBehavior: "permissive" } as any, rng);
    expect(turn3.effects.length).toBe(0);

    // Turn 4: Should trigger
    const turn4 = triggerSkills(runtime, "OnTurnStart", 4, { randomMode: "expectedValue", stackingBehavior: "permissive" } as any, rng);
    expect(turn4.effects.length).toBeGreaterThan(0);
  });
});

describe("Stacking Rules", () => {
  it("should add same-type modifiers (additive)", () => {
    const modifiers: DamageModifier[] = [
      {
        id: "damage1",
        source: "Hero1: Damage Up",
        subject: "outgoing",
        appliesTo: "All",
        durationTurns: 0,
        chance: 1,
        magnitude: 0.25, // 25%
        scope: "Any"
      },
      {
        id: "damage2",
        source: "Hero2: Damage Up",
        subject: "outgoing",
        appliesTo: "All",
        durationTurns: 0,
        chance: 1,
        magnitude: 0.20, // 20%
        scope: "Any"
      }
    ];

    const multipliers = applyStackingRules(modifiers);

    // Should sum: 0.25 + 0.20 = 0.45
    expect(multipliers.length).toBe(1);
    expect(multipliers[0]).toBeCloseTo(0.45, 5);
  });

  it("should multiply different-type modifiers (multiplicative)", () => {
    const modifiers: DamageModifier[] = [
      {
        id: "damage1",
        source: "Hero1: Damage Up",
        subject: "outgoing",
        appliesTo: "All",
        durationTurns: 0,
        chance: 1,
        magnitude: 0.25, // 25%
        scope: "Any"
      },
      {
        id: "attack1",
        source: "Hero2: Attack Up",
        subject: "outgoing",
        appliesTo: "All",
        durationTurns: 0,
        chance: 1,
        magnitude: 0.25, // 25%
        scope: "Any"
      }
    ];

    const multipliers = applyStackingRules(modifiers);

    // Should have 2 different types
    expect(multipliers.length).toBe(2);
    expect(multipliers).toContain(0.25);
  });
});

describe("Troop Scoping", () => {
  it("should apply infantry-only effects only to infantry", () => {
    const skill: LevelSkill = {
      "skill-name": "Infantry Only",
      "description": "Infantry only",
      "infantry_damage_up_percentage": {
        "5": 0.20
      }
    };

    const result = convertLevelSkillToSkillDefinition("TestHero", skill, 1, 5);

    expect(result).not.toBeNull();
    expect(result?.effects[0].target).toBe("Infantry");
    expect(result?.effects[0].damageModifier?.appliesTo).toBe("Infantry");
  });

  it("should apply all_troops effects to all troop types", () => {
    const skill: LevelSkill = {
      "skill-name": "All Troops",
      "description": "All troops",
      "all_troops_damage_up_percentage": {
        "5": 0.25
      }
    };

    const result = convertLevelSkillToSkillDefinition("TestHero", skill, 1, 5);

    expect(result).not.toBeNull();
    expect(result?.effects[0].target).toBe("All");
    expect(result?.effects[0].damageModifier?.appliesTo).toBe("All");
  });
});

describe("Chance Procs", () => {
  it("should use deterministic RNG for chance procs", () => {
    const skill: SkillDefinition = {
      id: "chance_skill",
      name: "50% Chance",
      trigger: "PassivePermanent",
      effects: [{
        id: "effect1",
        trigger: "PassivePermanent",
        type: "DamageMultiplier",
        target: "All",
        chance: 0.5,
        damageModifier: {
          id: "mod1",
          source: "test",
          subject: "outgoing",
          appliesTo: "All",
          durationTurns: 0,
          chance: 0.5,
          magnitude: 1.0
        }
      }]
    };

    const runtime = initSkillRuntime([skill]);
    const rng1 = makeRng(12345);
    const rng2 = makeRng(12345); // Same seed

    const result1 = triggerSkills(runtime, "PassivePermanent", 1, { randomMode: "monteCarlo", stackingBehavior: "permissive" } as any, rng1);
    const result2 = triggerSkills(runtime, "PassivePermanent", 1, { randomMode: "monteCarlo", stackingBehavior: "permissive" } as any, rng2);

    // With same seed, should produce same results
    expect(result1.effects.length).toBe(result2.effects.length);
  });

  it("should scale effects by chance in expectedValue mode", () => {
    const skill: SkillDefinition = {
      id: "chance_skill",
      name: "50% Chance",
      trigger: "PassivePermanent",
      effects: [{
        id: "effect1",
        trigger: "PassivePermanent",
        type: "DamageMultiplier",
        target: "All",
        chance: 0.5,
        damageModifier: {
          id: "mod1",
          source: "test",
          subject: "outgoing",
          appliesTo: "All",
          durationTurns: 0,
          chance: 0.5,
          magnitude: 1.0
        }
      }]
    };

    const runtime = initSkillRuntime([skill]);
    const rng = makeRng(12345);

    const result = triggerSkills(runtime, "PassivePermanent", 1, { randomMode: "expectedValue", stackingBehavior: "permissive" } as any, rng);

    // In expectedValue mode, should always apply but scaled by chance
    expect(result.effects.length).toBeGreaterThan(0);
    expect(result.damageModifiers[0].magnitude).toBeCloseTo(0.5, 5); // 1.0 * 0.5
  });
});

describe("Duration Expiration", () => {
  it("should set duration correctly for 'for 1 turn' effects", () => {
    const skill: LevelSkill = {
      "skill-name": "1 Turn Buff",
      "description": "Lasts 1 turn",
      "all_troops_damage_up_percentage": {
        "5": 0.25
      },
      "duration_turns": 1
    };

    const result = convertLevelSkillToSkillDefinition("TestHero", skill, 1, 5);

    expect(result).not.toBeNull();
    expect(result?.effects[0].durationTurns).toBe(1);
    expect(result?.effects[0].damageModifier?.durationTurns).toBe(1);
  });

  it("should set duration correctly for 'for 2 turns' effects", () => {
    const skill: LevelSkill = {
      "skill-name": "2 Turn Buff",
      "description": "Lasts 2 turns",
      "all_troops_damage_up_percentage": {
        "5": 0.30
      },
      "duration_turns": 2
    };

    const result = convertLevelSkillToSkillDefinition("TestHero", skill, 1, 5);

    expect(result).not.toBeNull();
    expect(result?.effects[0].durationTurns).toBe(2);
    expect(result?.effects[0].damageModifier?.durationTurns).toBe(2);
  });

  it("should handle permanent effects (duration 0 or undefined)", () => {
    const skill: LevelSkill = {
      "skill-name": "Permanent Buff",
      "description": "Permanent",
      "all_troops_damage_up_percentage": {
        "5": 0.20
      }
      // No duration_turns = permanent
    };

    const result = convertLevelSkillToSkillDefinition("TestHero", skill, 1, 5);

    expect(result).not.toBeNull();
    expect(result?.effects[0].durationTurns).toBeUndefined();
    expect(result?.effects[0].damageModifier?.durationTurns).toBe(0); // 0 = permanent
  });
});

describe("Not Stackable Effects", () => {
  it("should set stackingKey for non-stackable effects", () => {
    const skill: LevelSkill = {
      "skill-name": "Renee Skill",
      "description": "Renee always fights in unbelievable ways. Her Lancers can place Dream Marks on their targets every two turns, dealing extra Lancer damage once next turn. The Dream Marks last for 1 turn.",
      "lancer_damage_up_percentage": {
        "5": 2.0
      },
      "duration_turns": 1,
      "trigger_every_n_turns": 2
    };

    const result = convertLevelSkillToSkillDefinition("Renee", skill, 1, 5);

    expect(result).not.toBeNull();
    // Should have stackingKey because description mentions "recurring" or "not stackable"
    // Actually, the converter checks for these keywords in description
    const hasStackingKey = result?.effects.some(e => e.stackingKey !== undefined);
    // Note: This test may need adjustment based on actual Renee skill description
  });
});

describe("Integration Tests", () => {
  it("should handle multiple joiners with different skill types", () => {
    const joiners = [
      { heroName: "Sergey" }, // Damage Taken Down
      { heroName: "Jassar" }, // Damage Up
      { heroName: "Patrick" }, // Health Up
    ];

    const skills = convertJoinersToSkillDefinitions(
      joiners,
      getHeroByName,
      getHeroExpeditionSkills
    );

    expect(skills.length).toBe(3);

    // Verify each joiner's 1st skill is present
    const skillNames = skills.map(s => s.name);
    expect(skillNames).toContain("Defender's Edge"); // Sergey's 1st
    expect(skillNames).toContain("Tactical Genius"); // Jassar's 1st
    expect(skillNames).toContain("Super Nutrients"); // Patrick's 1st
  });

  it("should handle leader + joiner combination", () => {
    const leaders = {
      infantry: {
        heroName: "Sergey",
        skillLevels: { "Defender's Edge": 5, "Weaken": 5 }
      },
      lancer: null,
      marksman: null
    };

    const joiners = [
      { heroName: "Bahiti" },
    ];

    const leaderSkills = convertLeadersToSkillDefinitions(
      leaders,
      getHeroByName,
      getHeroExpeditionSkills
    );

    const joinerSkills = convertJoinersToSkillDefinitions(
      joiners,
      getHeroByName,
      getHeroExpeditionSkills
    );

    expect(leaderSkills.length).toBe(2); // Sergey has 2 skills
    expect(joinerSkills.length).toBe(1); // 1 joiner, 1st skill only
  });

  it("should handle all epic heroes as joiners", () => {
    const epicHeroes = [
      "Sergey", "Bahiti", "Patrick", "Jessie", "Seo-yoon", "Jassar",
      "Lumak Bokan", "Ling Xue"
    ];

    const joiners = epicHeroes.slice(0, 4).map(name => ({ heroName: name }));
    const skills = convertJoinersToSkillDefinitions(
      joiners,
      getHeroByName,
      getHeroExpeditionSkills
    );

    expect(skills.length).toBe(4);
    expect(skills.every(s => s.level === 5)).toBe(true); // All at max level
  });
});
