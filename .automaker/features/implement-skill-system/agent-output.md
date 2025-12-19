Summary:
- Added a skill system capable of attaching skills to fighters with multiple trigger types (OnTurnStart, OnNormalAttack, OnSkillCast, OnTurnEnd, PassivePermanent).
- Developed a new `SkillTrigger` enum and `SkillData` structure for configuring trigger behavior, effects, and chance.
- Implemented `SkillEffect` to encapsulate effect logic (currently supports healing & damage) and `ISkillEffectProvider` for combat entities to apply effects.
- Added `Skill` component that listens to relevant events from `Combat`’s turn manager, activating based on trigger, chance, and cooldown.
- Wired skill processing into `Combat`’s `PerformRound` to notify skills of turn and action events.
- Included comprehensive tests covering skill activation for each trigger, chance handling, cooldowns, and effect application.
Notes:
- Only simple heal/damage effects are currently implemented; expand effect types as needed.
- Chance success is evaluated deterministically by injecting an `IProbabilityProvider` (stubbed in tests).