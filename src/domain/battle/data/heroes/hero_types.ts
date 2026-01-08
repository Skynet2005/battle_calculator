export type BaseStats = {
  "infantry-attack"?: number;
  "infantry-defense"?: number;
  "marksman-attack"?: number;
  "marksman-defense"?: number;
  "lancer-attack"?: number;
  "lancer-defense"?: number;
  "marksman-lethality"?: number;
  "marksman-health"?: number;
  "lancer-lethality"?: number;
  "lancer-health"?: number;
  "infantry-lethality"?: number;
  "infantry-health"?: number;
};

export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export type SkillLevelKey = `${SkillLevel}`;

export type SkillLevelsByName = Record<string, SkillLevel>;

export type HeroSkillLevelPercent = Partial<
  Record<SkillLevelKey, number | { [troopType: string]: number }>
>;

export type HeroClass = "infantry" | "marksman" | "lancer";

export type LevelSkill = {
  "skill-name"?: string;
  "description"?: string;

  // ===== Plain-language buffs/debuffs (level-scaled) =====
  "attack_up_percentage"?: number | HeroSkillLevelPercent;
  "defense_up_percentage"?: number | HeroSkillLevelPercent;
  "health_up_percentage"?: number | HeroSkillLevelPercent;
  "damage_up_percentage"?: number | HeroSkillLevelPercent;
  "extra_damage_up_percentage"?: number | HeroSkillLevelPercent;
  "normal_attack_damage_up_percentage"?: number | HeroSkillLevelPercent;
  "skill_damage_up_percentage"?: number | HeroSkillLevelPercent;

  "damage_taken_down_percentage"?: number | HeroSkillLevelPercent;
  "damage_taken_up_percentage"?: number | HeroSkillLevelPercent;
  "enemy_damage_down_percentage"?: number | HeroSkillLevelPercent;
  "enemy_attack_down_percentage"?: number | HeroSkillLevelPercent;
  "enemy_damage_taken_up_percentage"?: number | HeroSkillLevelPercent;

  "dodge_rate_up_percentage"?: number | HeroSkillLevelPercent;
  "crit_rate_percentage"?: number | HeroSkillLevelPercent;
  "stun_chance_percentage"?: number | HeroSkillLevelPercent;

  // ===== Timings & triggers =====
  "trigger_chance"?: number | HeroSkillLevelPercent;
  "duration_turns"?: number | HeroSkillLevelPercent;
  "target_damage_taken_duration_turns"?: number;
  "reduction_duration_turns"?: number;

  // ===== Allow scoped variants (all_troops_, infantry_, lancer_, marksman_, rally_troops_, defender_troops_, enemy_) =====
  [key: string]: string | number | HeroSkillLevelPercent | undefined;
} | null;

export type ExclusiveWeaponLevel = {
  level: number;
  "marksman-lethality"?: number;
  "marksman-health"?: number;
  "lancer-lethality"?: number;
  "lancer-health"?: number;
  "infantry-lethality"?: number;
  "infantry-health"?: number;
  skills?: {
    expedition?: LevelSkill | null;
  };
  power: number;
};

export type ExclusiveWeapon = {
  name: string;
  levels: ExclusiveWeaponLevel[];
};

export type ExpeditionSkill =
  | {
    "skill-name"?: string;
    "description"?: string;
    [key: string]: any;
  }
  | undefined;

export type Hero = {
  "hero-name": string;
  "hero-class": HeroClass;
  "generation": number;
  "max-star-power": number;
  "max-skill-power": number;
  "max-level-power": number;
  "base-stats": BaseStats;
  "skills": {
    expedition: {
      [k: string]: ExpeditionSkill;
    };
  };
  "exclusive-weapon": ExclusiveWeapon | null;
};

export type CombatEffectCategory =
  | "stat"
  | "damage-dealt"
  | "damage-taken"
  | "control"
  | "dot"
  | "other";

export type TroopTarget =
  | "all_troops"
  | "rally_troops"
  | "defender_troops"
  | "infantry"
  | "lancer"
  | "marksman";

export interface NormalizedSkillEffect {
  source: "hero-skill" | "weapon-skill" | "troop-passive";
  sourceName: string;
  category: CombatEffectCategory;
  target: TroopTarget;
  stat:
  | "attack"
  | "defense"
  | "health"
  | "lethality"
  | "damage_dealt"
  | "damage_taken"
  | "hit_chance"
  | "dodge_chance"
  | "control_chance"
  | "other";
  value: number;
  isMultiplicative: boolean;
  applyToEnemy?: boolean;
}

export interface HeroSelection {
  heroName: string;
  selectionType: "leader" | "joiner";
  skillLevels?: SkillLevelsByName;
  exclusiveWeaponLevel?: number;
  starLevel?: number;
  xpLevel?: number;
}

export interface HeroCombatProfile {
  hero: Hero;
  exclusiveWeaponLevel?: number;
  baseStats: BaseStats;
  normalizedEffects: NormalizedSkillEffect[];
}
