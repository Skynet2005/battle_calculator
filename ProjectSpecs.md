```text
You are an expert game-systems engineer and TypeScript architect working inside my existing Next.js (App Router) Whiteout Survival Battle Calculator project. Your job is to implement a full, production-grade “Damage Engine” and integrate it into my Rally/Battle simulation so it behaves like Whiteout Survival, using the spec below.

NON-NEGOTIABLE OUTPUT RULES
- Output COMPLETE, working code (no placeholders, no “TODO”, no “…” omissions, no abbreviated sections).
- If you must make an assumption because the server formula is not published, implement it as a configurable parameter and DOCUMENT it clearly in code comments + a short design doc.
- Provide unit tests and at least 1 runnable example simulation that prints a turn-by-turn breakdown.
- Keep code style concise and professional: clear preamble comment blocks, compact but complete functions, strong typing, no dead code.

PRIMARY GOAL
Build a deterministic turn-based combat engine that:
1) Calculates effective troop stats from additive bonuses and “special-like” bonuses,
2) Applies hero expedition skills + rally joiner primary skills correctly,
3) Resolves per-turn targeting and damage,
4) Supports Damage Up, Damage Taken Down, Enemy Attack Down, and similar effects with correct stacking rules,
5) Produces a battle report (turn logs + totals) suitable for my UI.

SCOPE / WHERE TO INTEGRATE
- Implement the engine as a pure library (no React) under: src/lib/combat/
- Add an adapter layer that my existing UI can call (BattlePredictor / RallyConfiguration).
- Return a structured “BattleReport” object with all details needed for charts/tables.

DATA MODEL REQUIREMENTS (Types)
Create strong TS types for:
- TroopType: "Infantry" | "Lancer" | "Marksman"
- TroopStats: attack, defense, health, lethality
- TroopCounts: counts per troop type, split by rows if you support it (front/back) OR implement rows as a targeting abstraction.
- Bonus model:
  - AdditiveBonuses: percent-based modifiers per stat per troop type (and “all troops” support).
  - SpecialBonuses: percent-based “special-like” modifiers per stat per troop type (and “all troops” support).
  - DamageModifiers: DamageUp, SkillDamageUp, NormalAttackDamageUp, DamageTakenDown, SkillDamageTakenDown, NormalAttackDamageTakenDown, EnemyAttackDown, EnemyDamageDown, etc. Each must have:
    - source (hero/pet/research/etc),
    - subject (outgoing vs incoming vs enemy outgoing),
    - appliesTo (troop type filter),
    - durationTurns (or 0 for permanent),
    - chance (0..1),
    - stackingKey (to enforce “cannot stack same buff type” where applicable).
- Skill model:
  - SkillTrigger: OnTurnStart, OnNormalAttack, OnSkillCast, OnTurnEnd, PassivePermanent
  - SkillEffect: stat buff, damage multiplier, flat add-damage, targeting override, etc.
- BattleConfig:
  - maxTurns,
  - randomMode: "expectedValue" | "monteCarlo",
  - troopCountExponentAlpha (default 0.5),
  - calibrationConstantK (default 1.0),
  - targetingRules toggles (e.g., allowLancerBacklineDive),
  - stackingBehavior toggles (strict vs permissive),
  - battleType: "Expedition" | "Rally" | "Garrison" | "BearTrap" (affects joiner skill selection & casualty conversion model).

STAT PIPELINE SPEC (MUST IMPLEMENT)
1) Base troop stats come from tier/FC model (assume already available in project; if not, create a simple provider interface).
2) Most bonuses are additive:
   finalPercent = sum(all relevant additive percents)
3) Special-like bonuses use this formula per stat:
   FinalStatPercent = (BaseStatPercent * (1 + SpecialPercent)) + SpecialPercent
   Implement it generally as:
   finalPercent = basePercent + specialPercent + (basePercent * specialPercent / 100)
   - Apply sequentially if multiple special-like sources exist (in consistent order; document order).
4) EffectiveStat = BaseStatValue * (1 + finalPercent/100)
5) “Same buff type cannot stack”:
   - Enforce via stackingKey: for a given stackingKey at a given time, only the strongest magnitude applies.
   - Example: If two “Attack Buff Item” effects exist, do not stack both; take max.

SKILL SOURCE RULES (MUST IMPLEMENT)
- Rally leader provides 9 expedition skills (3 heroes × 3 expedition skills).
- Rally members contribute up to 4 “primary skills” (first skill) selected by battle rules.
- Implement a selection function:
  selectJoinerPrimarySkills(joiners, battleType) -> 4 skills
  - Default logic: pick the 4 highest effective skill levels; tie-break deterministically (player id / join order).
  - BearTrap: same selection rule, but only “primary skill” matters (no other expedition skills from joiners).
- Garrison: the defense side uses highest stat bonuses as the stat source + 4 primary skills from other garrison members.

TURN-BASED COMBAT LOOP (MUST IMPLEMENT)
Battle resolves in discrete turns until maxTurns or one side is eliminated.
Each turn:
1) Apply turn-start buffs/debuffs (duration tick management).
2) Determine each side’s action instances:
   - Normal attacks always occur.
   - Skill casts occur based on trigger rules (for now: on cooldown/turn schedule derived from skill definition).
3) Target selection:
   - Default: front row first, then next row.
   - Include a configurable exception: Lancers can target backline Marksmen with some probability OR deterministic toggle.
   - Skills may override targeting (single target, row, all troops, troop-type specific).
4) Damage calculation per action instance:
   - Compute a “BaseKills” shaped with diminishing returns to troop count:
     BaseKills = K * (N_alive ^ alpha) * (AtkEff * LethEff) / (DefEff * HpEff) * M_type * M_action
     where:
       - alpha defaults to 0.5 but configurable
       - K configurable for calibration
       - M_type is troop matchup multiplier (provide an interface; default 1.0)
       - M_action is action multiplier (e.g., “Attack*300%” => 3.0)
   - Then apply damage modifiers as multiplicative layers:
     OutgoingMultiplier = Π(1 + outgoingDamageUp)
     IncomingMultiplier = Π(1 - incomingDamageReductions)
     FinalKills = BaseKills * OutgoingMultiplier * IncomingMultiplier
   - IMPORTANT: reductions must be multiplicative, NOT simple subtraction.
   - IMPORTANT: correctly interpret subjects:
     * “Damage Taken Down” is an incoming reduction on the receiver.
     * “Enemy Attack Down” modifies the attacker’s effective attack (stat pipeline), not a damage multiplier.
     * “Enemy Damage Down” is an outgoing reduction on the enemy’s damage multiplier layer.
5) Apply kills to the target troop pools in correct order (row priority).
6) Record a detailed turn log:
   - buffs applied/expired,
   - skills triggered,
   - per-action computed components (BaseKills, multipliers, FinalKills),
   - resulting troop counts.

CHANCE SKILLS (MUST IMPLEMENT)
Support both:
- expectedValue mode: expected multiplier = 1 + p * bonus
- monteCarlo mode: seeded RNG, reproducible across runs, run N simulations and report mean + variance

DURATION SKILLS (MUST IMPLEMENT)
- Effects have durationTurns; they apply for that many turns and expire automatically.
- Non-stacking turn buffs must keep only the strongest active instance per stackingKey.

CASUALTY CONVERSION (MUST IMPLEMENT AS CONFIG)
The exact server rule varies by battle type; implement a configurable casualty model:
- casualtyModel.apply(kills, battleType, infirmaryCapacity?) -> {dead, wounded}
Provide at least:
- Expedition/Rally default: all kills treated as “losses” (simple)
- Garrison/Sunfire placeholder: split wounded/dead by configurable ratio
Document assumptions.

DELIVERABLES (FILES YOU MUST OUTPUT)
1) src/lib/combat/types.ts
   - All core types
2) src/lib/combat/bonuses.ts
   - Bonus aggregation, special-like formula, stacking resolution
3) src/lib/combat/skills.ts
   - Skill definitions, triggers, application to modifiers/stats
4) src/lib/combat/targeting.ts
   - Target selection logic (rows + lancer backline option)
5) src/lib/combat/damage.ts
   - Core damage equation, multipliers, expected value handling
6) src/lib/combat/engine.ts
   - Turn loop, state updates, report generation
7) src/lib/combat/calibration.ts
   - Helper to fit K (and optionally alpha) against an observed report (least squares on totals)
8) src/lib/combat/examples/runExample.ts
   - Runnable example that prints a turn-by-turn report
9) src/lib/combat/__tests__/engine.test.ts
   - Unit tests that verify:
     - additive vs special-like math,
     - multiplicative stacking for reductions,
     - non-stacking behavior by stackingKey,
     - deterministic joiner skill selection,
     - turn duration expiration,
     - expectedValue vs monteCarlo differences.

INTEGRATION REQUIREMENTS
- Create a minimal adapter function my UI can call:
  simulateBattle(input: UISimulationInput) -> BattleReport
- Do NOT break existing UI types; if needed create mapping functions.
- Ensure performance is acceptable for a web UI (avoid O(turns * troops * skills) explosions; precompute where possible).

DOCUMENTATION REQUIREMENT
Create a short markdown design doc at:
- src/lib/combat/DESIGN.md
Include:
- the full equation pipeline,
- stacking rules,
- what is assumed vs known,
- how to calibrate K/alpha,
- how to add new hero skills safely.

SUCCESS CRITERIA
- I can run the example and see a readable turn-by-turn log.
- Unit tests pass.
- The engine produces stable results for the same seed/config.
- The UI can call simulateBattle without needing to know internal combat details.

NOW IMPLEMENT EVERYTHING ABOVE.
Return the full code for every file listed, in order, with correct paths as headings.
```
