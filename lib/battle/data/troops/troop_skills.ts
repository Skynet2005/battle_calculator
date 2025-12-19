// Troop Skills

export interface TroopSkill {
  "skill-name": string;
  description: string;
  [key: string]: any; // Allow additional properties for skill-specific data
}

export interface TroopSkills {
  infantry: TroopSkill[];
  lancer: TroopSkill[];
  marksman: TroopSkill[];
}

type SkillEffect = {
  affects_opponent: boolean;
  effect_type: string;
  effect_op: number | string;
  extra_attack: boolean;
  effect_is_chance: boolean;
  effect_probabilities: Record<string, number>;
  special: Record<string, unknown>;
  effect_num: string;
  trigger_types: {
    trigger_for: string;
    trigger_vs: string;
  };
  benefit_types: {
    benefit_for: string;
    benefit_vs: string;
  };
  effect_duration: {
    duration_type: string;
    duration_value: number;
    effect_lag: number;
  };
  effect_values: Record<string, number | string>;
};

type SkillCondition = {
  level: string;
  condition_type: string;
  condition_value: number;
};

type Frequency = {
  frequency_type: string | null;
  frequency_value: number;
};

type BaseTroopSkill = {
  // Main identifiers
  skill_name: string;
  skill_type: string;
  skill_troop_type: string;
  skill_order: number;

  // User-facing details
  description: string;
  skill_decription: string;

  // Passive/Active flags
  skill_permanent: boolean;
  skill_frequency: Frequency;
  skill_is_chance: boolean;
  skill_probability: number;
  skill_round_stackable: boolean;
  skill_type_relation: boolean | number;

  // Requirements & restrictions
  requires_skill?: string;
  skill_conditions: SkillCondition[];

  // All effects listed here
  skill_effects: SkillEffect[];

  // Additional standard fields (for search/filter)
  target?: string;
};

export const TROOP_SKILLS: TroopSkills = {
  infantry: [
    // 1. Master Brawler
    {
      skill_name: "Master Brawler",
      skill_type: "troop_skill",
      skill_troop_type: "infantry",
      skill_order: 1,
      description: "+10% Attack damage against Lancers",
      skill_decription: "Increase Attack Damage to Lancers by 10%",
      skill_permanent: true,
      skill_frequency: { frequency_type: null, frequency_value: 0 },
      skill_is_chance: false,
      skill_probability: 0.0,
      skill_round_stackable: false,
      skill_type_relation: 0,
      skill_conditions: [
        { level: "1", condition_type: "tier", condition_value: 0 }
      ],
      skill_effects: [
        {
          affects_opponent: false,
          effect_type: "DamageUp",
          effect_op: 101,
          extra_attack: false,
          effect_is_chance: false,
          effect_probabilities: {},
          special: {},
          effect_num: "Master Brawler/1",
          trigger_types: { trigger_for: "infantry", trigger_vs: "lancer" },
          benefit_types: { benefit_for: "infantry", benefit_vs: "lancer" },
          effect_duration: { duration_type: "turn", duration_value: -1, effect_lag: 0 },
          effect_values: { "1": 10 }
        }
      ],
      // SEARCHABLE
      target: "lancer",
      attack_damage_against_lancers_percentage: 0.10,
      // alias for compatibility
      "skill-name": "Master Brawler"
    },

    // 2. Bands of Steel
    {
      skill_name: "Bands of Steel",
      skill_type: "troop_skill",
      skill_troop_type: "infantry",
      skill_order: 1,
      description: "Increases Defense against Lancers by 10%",
      skill_decription: "Increase Defense against lancers by 10%",
      skill_permanent: true,
      skill_frequency: { frequency_type: null, frequency_value: 0 },
      skill_is_chance: false,
      skill_probability: 0.0,
      skill_round_stackable: false,
      skill_type_relation: 0,
      skill_conditions: [
        { level: "1", condition_type: "tier", condition_value: 7 }
      ],
      skill_effects: [
        {
          affects_opponent: false,
          effect_type: "DefenseUp",
          effect_op: 111,
          extra_attack: false,
          effect_is_chance: false,
          effect_probabilities: {},
          special: {},
          effect_num: "Bands of Steel/1",
          trigger_types: { trigger_for: "infantry", trigger_vs: "all" },
          benefit_types: { benefit_for: "infantry", benefit_vs: "lancer" },
          effect_duration: { duration_type: "turn", duration_value: -1, effect_lag: 0 },
          effect_values: { "1": 10 }
        }
      ],
      target: "lancer",
      defense_against_lancers_percentage: 0.10,
      "skill-name": "Bands of Steel"
    },

    // 3. Crystal Shield
    {
      skill_name: "Crystal Shield",
      skill_type: "troop_skill",
      skill_troop_type: "infantry",
      skill_order: 1,
      description: "The Fire Crystal energy attached to the surface makes the shield impregnable and grants it a 37.5% chance of offsetting damage.",
      skill_decription: "The Fire Crystal energy...grants it an X% chance of offsetting 36 damage",
      skill_permanent: false,
      skill_frequency: { frequency_type: "turn", frequency_value: 1 },
      skill_is_chance: false,
      skill_probability: 0.0,
      skill_round_stackable: false,
      skill_type_relation: true,
      skill_conditions: [
        { level: "1", condition_type: "fc", condition_value: 3 },
        { level: "2", condition_type: "fc", condition_value: 5 }
      ],
      skill_effects: [
        {
          affects_opponent: false,
          effect_type: "OppDamageDown",
          effect_op: 209,
          extra_attack: false,
          effect_is_chance: true,
          effect_probabilities: { "1": 25, "2": 37.5 },
          special: { onDefense: true },
          effect_num: "Crystal Shield/1",
          trigger_types: { trigger_for: "infantry", trigger_vs: "all" },
          benefit_types: { benefit_for: "trigger", benefit_vs: "target" },
          effect_duration: { duration_type: "attack", duration_value: 1, effect_lag: 0 },
          effect_values: { "1": 36, "2": 36 }
        }
      ],
      damage_offset_chance: 0.375,
      "skill-name": "Crystal Shield"
    },

    // 4. Body of Light
    {
      skill_name: "Body of Light",
      skill_type: "troop_skill",
      skill_troop_type: "infantry",
      skill_order: 1,
      description: "Fire Crystal energy forms an invisible shield that covers the bodies, increasing Infantry Defense by 6%, reducing an extra 15% damage when [Crystal Shield] is active.",
      skill_decription: "Increasing Infantry Defense by 6%, reducing an extra 15% damage when [Crystal Shield] is active",
      skill_permanent: true,
      skill_frequency: { frequency_type: null, frequency_value: 0 },
      skill_is_chance: false,
      skill_probability: 0.0,
      skill_round_stackable: false,
      skill_type_relation: true,
      skill_conditions: [
        { level: "1", condition_type: "fc", condition_value: 8 }
      ],
      requires_skill: "Crystal Shield",
      skill_effects: [
        {
          affects_opponent: false,
          effect_type: "DefenseUp",
          effect_op: 119,
          extra_attack: false,
          effect_is_chance: false,
          effect_probabilities: {},
          special: {},
          effect_num: "Body of Light/1",
          trigger_types: { trigger_for: "infantry", trigger_vs: "all" },
          benefit_types: { benefit_for: "infantry", benefit_vs: "all" },
          effect_duration: { duration_type: "turn", duration_value: -1, effect_lag: 0 },
          effect_values: { "1": 6 }
        },
        {
          affects_opponent: true,
          effect_type: "OppDamageDown",
          effect_op: 209,
          extra_attack: false,
          effect_is_chance: false,
          effect_probabilities: {},
          special: { effect_entanglment: "Crystal Shield/1" },
          effect_num: "Body of Light/2",
          trigger_types: { trigger_for: "infantry", trigger_vs: "all" },
          benefit_types: { benefit_for: "infantry", benefit_vs: "all" },
          effect_duration: { duration_type: "turn", duration_value: -1, effect_lag: 0 },
          effect_values: { "1": 15 }
        }
      ],
      infantry_defense_increase_percentage: 0.06,
      additional_damage_reduction_when_crystal_shield_active: 0.15,
      "skill-name": "Body of Light"
    }
  ],

  lancer: [
    // 1. Charge
    {
      skill_name: "Charge",
      skill_type: "troop_skill",
      skill_troop_type: "lancers",
      skill_order: 1,
      description: "+10% Attack damage against Marksman",
      skill_decription: "Increase Attack Damage to Marksmen by 10%",
      skill_permanent: true,
      skill_frequency: { frequency_type: null, frequency_value: 0 },
      skill_is_chance: false,
      skill_probability: 0.0,
      skill_round_stackable: false,
      skill_type_relation: 0,
      skill_conditions: [
        { level: "1", condition_type: "tier", condition_value: 0 }
      ],
      skill_effects: [
        {
          affects_opponent: false,
          effect_type: "DamageUp",
          effect_op: 101,
          extra_attack: false,
          effect_is_chance: false,
          effect_probabilities: {},
          special: {},
          effect_num: "Charge/1",
          trigger_types: { trigger_for: "lancer", trigger_vs: "marksmen" },
          benefit_types: { benefit_for: "lancer", benefit_vs: "marksmen" },
          effect_duration: { duration_type: "turn", duration_value: -1, effect_lag: 0 },
          effect_values: { "1": 10 }
        }
      ],
      target: "marksman",
      attack_damage_against_marksman_percentage: 0.10,
      "skill-name": "Charge"
    },

    // 2. Ambusher
    {
      skill_name: "Ambusher",
      skill_type: "troop_skill",
      skill_troop_type: "lancers",
      skill_order: 1,
      description: "Attacks have a 20% chance to strike Marksman behind Infantry",
      skill_decription: "Attacks have a 20% chance to strike Marksmen behind Infantry",
      skill_permanent: false,
      skill_frequency: { frequency_type: "turn", frequency_value: 1 },
      skill_is_chance: false,
      skill_probability: 0,
      skill_round_stackable: false,
      skill_type_relation: true,
      skill_conditions: [
        { level: "1", condition_type: "tier", condition_value: 7 }
      ],
      skill_effects: [
        {
          affects_opponent: false,
          effect_type: "attack_order",
          effect_op: "",
          extra_attack: false,
          effect_is_chance: true,
          effect_probabilities: { "1": 20 },
          special: {},
          effect_num: "Ambusher/1",
          trigger_types: { trigger_for: "lancer", trigger_vs: "infantry" },
          benefit_types: { benefit_for: "lancer", benefit_vs: "marksmen" },
          effect_duration: { duration_type: "turn", duration_value: 1, effect_lag: 0 },
          effect_values: { "1": "mark/inf/lanc" }
        }
      ],
      target: "marksman",
      chance_to_strike_marksman_behind_infantry: 0.20,
      "skill-name": "Ambusher"
    },

    // 3. Crystal Lance
    {
      skill_name: "Crystal Lance",
      skill_type: "troop_skill",
      skill_troop_type: "lancers",
      skill_order: 1,
      description: "The Fire Crystal energy attached to the blade makes the lance indestructible and grants it a 15% chance of dealing double damage.",
      skill_decription: "Grants it a X% chance of dealing double damage",
      skill_permanent: false,
      skill_frequency: { frequency_type: "turn", frequency_value: 1 },
      skill_is_chance: false,
      skill_probability: 0,
      skill_round_stackable: false,
      skill_type_relation: true,
      skill_conditions: [
        { level: "1", condition_type: "fc", condition_value: 3 },
        { level: "2", condition_type: "fc", condition_value: 5 }
      ],
      skill_effects: [
        {
          affects_opponent: false,
          effect_type: "DamageUp",
          effect_op: 101,
          extra_attack: true,
          effect_is_chance: true,
          effect_probabilities: { "1": 10, "2": 15 },
          special: {},
          effect_num: "Crystal Lance/1",
          trigger_types: { trigger_for: "lancer", trigger_vs: "all" },
          benefit_types: { benefit_for: "lancer", benefit_vs: "all" },
          effect_duration: { duration_type: "attack", duration_value: 1, effect_lag: 0 },
          effect_values: { "1": 100, "2": 100 }
        }
      ],
      double_damage_chance: 0.15,
      "skill-name": "Crystal Lance"
    },

    // 4. Incandescent Field
    {
      skill_name: "Incandescent Field",
      skill_type: "troop_skill",
      skill_troop_type: "lancers",
      skill_order: 1,
      description: "Fire Crystal energy that attaches to the [Crystal Lance] forms a force field that grants the Lancers a 10% chance of taking half the damage when under attack.",
      skill_decription: "Grants the lancers a 10% chance of taking half the damage when under attack.",
      skill_permanent: false,
      skill_frequency: { frequency_type: "turn", frequency_value: 1 },
      skill_is_chance: false,
      skill_probability: 0,
      skill_round_stackable: false,
      skill_type_relation: true,
      skill_conditions: [
        { level: "1", condition_type: "fc", condition_value: 8 }
      ],
      requires_skill: "Crystal Lance",
      skill_effects: [
        {
          affects_opponent: true,
          effect_type: "OppDamageDown",
          effect_op: 209,
          extra_attack: false,
          effect_is_chance: true,
          effect_probabilities: { "1": 10 },
          special: { onDefense: true },
          effect_num: "Crystal Lance/1",
          trigger_types: { trigger_for: "lancer", trigger_vs: "all" },
          benefit_types: { benefit_for: "trigger", benefit_vs: "target" },
          effect_duration: { duration_type: "attack", duration_value: 1, effect_lag: 0 },
          effect_values: { "1": 50 }
        }
      ],
      half_damage_chance: 0.10,
      "skill-name": "Incandescent Field"
    }
  ],

  marksman: [
    // 1. Ranged Strike
    {
      skill_name: "Ranged Strike",
      skill_type: "troop_skill",
      skill_troop_type: "marksmen",
      skill_order: 1,
      description: "+10% Attack damage against Infantry",
      skill_decription: "Increase Attack Damage to Infantry by 10%",
      skill_permanent: true,
      skill_frequency: { frequency_type: null, frequency_value: 0 },
      skill_is_chance: false,
      skill_probability: 0.0,
      skill_round_stackable: false,
      skill_type_relation: 0,
      skill_conditions: [
        { level: "1", condition_type: "tier", condition_value: 0 }
      ],
      skill_effects: [
        {
          affects_opponent: false,
          effect_type: "DamageUp",
          effect_op: 101,
          extra_attack: false,
          effect_is_chance: false,
          effect_probabilities: {},
          special: {},
          effect_num: "Ranged Strike/1",
          trigger_types: { trigger_for: "marksmen", trigger_vs: "infantry" },
          benefit_types: { benefit_for: "marksmen", benefit_vs: "infantry" },
          effect_duration: { duration_type: "turn", duration_value: -1, effect_lag: 0 },
          effect_values: { "1": 10 }
        }
      ],
      target: "infantry",
      attack_damage_against_infantry_percentage: 0.10,
      "skill-name": "Ranged Strike"
    },

    // 2. Volley
    {
      skill_name: "Volley",
      skill_type: "troop_skill",
      skill_troop_type: "marksmen",
      skill_order: 1,
      description: "Attacks have a 10% chance to strike twice",
      skill_decription: "Attacks have a 10% chance to strike twice",
      skill_permanent: false,
      skill_frequency: { frequency_type: "turn", frequency_value: 1 },
      skill_is_chance: false,
      skill_probability: 0,
      skill_round_stackable: false,
      skill_type_relation: 0,
      skill_conditions: [
        { level: "1", condition_type: "tier", condition_value: 7 }
      ],
      skill_effects: [
        {
          affects_opponent: false,
          effect_type: "DamageUp",
          effect_op: 101,
          extra_attack: true,
          effect_is_chance: true,
          effect_probabilities: { "1": 10 },
          special: {},
          effect_num: "Volley/1",
          trigger_types: { trigger_for: "marksmen", trigger_vs: "all" },
          benefit_types: { benefit_for: "trigger", benefit_vs: "target" },
          effect_duration: { duration_type: "attack", duration_value: 1, effect_lag: 0 },
          effect_values: { "1": 100 }
        }
      ],
      double_strike_chance: 0.10,
      "skill-name": "Volley"
    },

    // 3. Crystal Gunpowder
    {
      skill_name: "Crystal Gunpowder",
      skill_type: "troop_skill",
      skill_troop_type: "marksmen",
      skill_order: 1,
      description: "The powerful energy provided by the Fire Crystal enables the bullet to pierce through everything and grants it a 30% chance of dealing 50% more damage.",
      skill_decription: "Grants it a X% chance of dealing 50% more damage",
      skill_permanent: false,
      skill_frequency: { frequency_type: "turn", frequency_value: 1 },
      skill_is_chance: false,
      skill_probability: 0,
      skill_round_stackable: false,
      skill_type_relation: 0,
      skill_conditions: [
        { level: "1", condition_type: "fc", condition_value: 3 },
        { level: "2", condition_type: "fc", condition_value: 5 }
      ],
      skill_effects: [
        {
          affects_opponent: false,
          effect_type: "DamageUp",
          effect_op: 101,
          extra_attack: true,
          effect_is_chance: true,
          effect_probabilities: { "1": 20, "2": 30 },
          special: {},
          effect_num: "Crystal Gunpowder/1",
          trigger_types: { trigger_for: "marksmen", trigger_vs: "all" },
          benefit_types: { benefit_for: "marksmen", benefit_vs: "all" },
          effect_duration: { duration_type: "attack", duration_value: 1, effect_lag: 0 },
          effect_values: { "1": 50, "2": 50 }
        }
      ],
      additional_damage_chance: 0.30,
      additional_damage_percentage: 0.50,
      "skill-name": "Crystal Gunpowder"
    },

    // 4. Flame Charge
    {
      skill_name: "Flame Charge",
      skill_type: "troop_skill",
      skill_troop_type: "marksmen",
      skill_order: 1,
      description: "Fire Crystal energy boosts the power of bullets, increasing Marksmen's basic Attack by 4%. Marksman can deal an extra 25% damage when [Crystal Gunpowder] is active.",
      skill_decription: "Increasing marksmen's basic Attack by 4%. Marksmen can deal an extra 25% damage when [Crystal Gunpowder] is active",
      skill_permanent: true,
      skill_frequency: { frequency_type: null, frequency_value: 0 },
      skill_is_chance: false,
      skill_probability: 0,
      skill_round_stackable: false,
      skill_type_relation: 0,
      skill_conditions: [
        { level: "1", condition_type: "fc", condition_value: 8 }
      ],
      requires_skill: "Crystal Gunpowder",
      skill_effects: [
        {
          affects_opponent: false,
          effect_type: "DamageUp",
          effect_op: 102,
          extra_attack: false,
          effect_is_chance: false,
          effect_probabilities: {},
          special: {},
          effect_num: "Flame Charge/1",
          trigger_types: { trigger_for: "marksmen", trigger_vs: "all" },
          benefit_types: { benefit_for: "marksmen", benefit_vs: "all" },
          effect_duration: { duration_type: "attack", duration_value: 1, effect_lag: 0 },
          effect_values: { "1": 4 }
        },
        {
          affects_opponent: false,
          effect_type: "DamageUp",
          effect_op: 101,
          extra_attack: true,
          effect_is_chance: false,
          effect_probabilities: {},
          effect_num: "Crystal Gunpowder/2",
          trigger_types: { trigger_for: "marksmen", trigger_vs: "all" },
          benefit_types: { benefit_for: "marksmen", benefit_vs: "all" },
          effect_duration: { duration_type: "attack", duration_value: 1, effect_lag: 0 },
          effect_values: { "1": 25 },
          special: { effect_entanglment: "Crystal Gunpowder/1" }
        }
      ],
      marksman_basic_attack_increase_percentage: 0.04,
      additional_damage_when_crystal_gunpowder_active: 0.25,
      "skill-name": "Flame Charge"
    }
  ]
};
