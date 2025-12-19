// Utility for stat bonuses per troop type

// Define available unit types and stat names
export type UnitType = "infantry" | "lancer" | "marksman";
export const UNIT_TYPES: UnitType[] = ["infantry", "lancer", "marksman"];
export type StatName = "attack" | "defense" | "lethality" | "health";
export const STAT_NAMES: StatName[] = ["attack", "defense", "lethality", "health"];

export type StatDict = {
  attack: number;
  defense: number;
  lethality: number;
  health: number;
};

export function createStatDict(init: Partial<StatDict> = {}): StatDict {
  return {
    attack: init.attack ?? 0,
    defense: init.defense ?? 0,
    lethality: init.lethality ?? 0,
    health: init.health ?? 0
  };
}

export class BasicStatDict {
  attack: number;
  defense: number;
  lethality: number;
  health: number;

  static statList = STAT_NAMES;

  constructor(init?: Partial<StatDict>) {
    this.attack = init?.attack ?? 0;
    this.defense = init?.defense ?? 0;
    this.lethality = init?.lethality ?? 0;
    this.health = init?.health ?? 0;
  }

  static fromDict(obj: Partial<StatDict>) {
    return new BasicStatDict(obj);
  }

  static fromList(list: number[]): BasicStatDict {
    return new BasicStatDict({
      attack: list[0] ?? 0,
      defense: list[1] ?? 0,
      lethality: list[2] ?? 0,
      health: list[3] ?? 0
    });
  }

  toJSON(): StatDict {
    return {
      attack: this.attack,
      defense: this.defense,
      lethality: this.lethality,
      health: this.health
    };
  }

  toString(): string {
    return JSON.stringify(this.toJSON(), null, 2);
  }
}

export type StatsBonusJson = Record<UnitType, StatDict>;

export class StatsBonus {
  infantry: BasicStatDict;
  lancer: BasicStatDict;
  marksman: BasicStatDict;

  constructor(init?: Partial<Record<UnitType, Partial<StatDict>>>) {
    this.infantry = new BasicStatDict(init?.infantry);
    this.lancer = new BasicStatDict(init?.lancer);
    this.marksman = new BasicStatDict(init?.marksman);
  }

  static fromDict(obj: Record<string, Partial<StatDict>>): StatsBonus {
    const out: Partial<Record<UnitType, Partial<StatDict>>> = {};
    for (const ut of UNIT_TYPES) {
      // Find key with unit type in its name (case insensitive)
      const utName = Object.keys(obj).find(key => key.toLowerCase().includes(ut));
      if (utName) {
        out[ut] = obj[utName];
      }
    }
    return new StatsBonus(out);
  }

  static fromList(obj: Record<string, number[]>): StatsBonus {
    const out: Partial<Record<UnitType, BasicStatDict>> = {};
    for (const ut of UNIT_TYPES) {
      const utName = Object.keys(obj).find(key => key.toLowerCase().includes(ut));
      if (utName) {
        out[ut] = BasicStatDict.fromList(obj[utName]);
      }
    }
    const stats = new StatsBonus();
    for (const ut of UNIT_TYPES) {
      if (out[ut]) stats[ut] = out[ut]!;
    }
    return stats;
  }

  addBonus(type: UnitType, stat: StatName, value: number) {
    const dict = this[type];
    dict[stat] = Math.round((dict[stat] + value) * 100) / 100;
  }

  toJSON(): StatsBonusJson {
    return {
      infantry: this.infantry.toJSON(),
      lancer: this.lancer.toJSON(),
      marksman: this.marksman.toJSON()
    };
  }

  toString(): string {
    return JSON.stringify(this.toJSON(), null, 2);
  }
}


