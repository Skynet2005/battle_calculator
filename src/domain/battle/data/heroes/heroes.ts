// Data verified: 2026-02-17 | Generations 1-11 covered | 43 heroes total
import type {
  Hero,
  HeroClass
} from "./hero_types";

export type {
  BaseStats,
  ExclusiveWeapon,
  ExclusiveWeaponLevel,
  Hero,
  HeroClass,
  HeroSkillLevelPercent,
  LevelSkill,
  SkillLevel,
  SkillLevelKey,
  SkillLevelsByName
} from "./hero_types";

export const bahiti: Hero = {
  "hero-name": "Bahiti",
  "hero-class": "marksman",
  "generation": 1,
  "max-star-power": 553440,
  "max-skill-power": 67680,
  "max-level-power": 149280,
  "base-stats": {
    "marksman-attack": 0.14011,
    "marksman-defense": 0.14011
  },
  "skills": {
    "expedition": {
      "1": {
        "skill-name": "Sixth Sense",
        "description": "Bahiti senses for dangers ahead, reducing damage taken by [4%/8%/12%/16%/20%] for all troops.",
        "all_troops_damage_taken_down_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20
        },
      },
      "2": {
        "skill-name": "Fluorescence",
        "description": "Bahiti's battlefield instincts grants all troops' attack a 50% chance of increasing damage dealt by [10%/20%/30%/40%/50%].",
        "all_troops_damage_up_percentage": {
          "1": 0.10,
          "2": 0.20,
          "3": 0.30,
          "4": 0.40,
          "5": 0.50
        },
        "trigger_chance": 0.5
      }
    }
  },
  "exclusive-weapon": null
};

export const gina: Hero = {
  "hero-name": "Gina",
  "hero-class": "marksman",
  "generation": 1,
  "max-star-power": 553440,
  "max-skill-power": 67680,
  "max-level-power": 149280,
  "base-stats": {
    "marksman-attack": 0.11008,
    "marksman-defense": 0.11008
  },
  "skills": {
    "expedition": {
      "1": {
        "skill-name": "Endurance Training",
        "description": "Gina's strict Governor training regimen reduces Stamina cost by [10%/12%/15%/18%/20%].",
        "stamina_cost_reduction_percentage": {
          "1": 0.10,
          "2": 0.12,
          "3": 0.15,
          "4": 0.18,
          "5": 0.20
        }
      },
      "2": {
        "skill-name": "Quick Paced",
        "description": "Gina is a fast and aggressive wilderness rider, boosting Wilderness March Speed by [20%/40%/60%/80%/100%].",
        "wilderness_march_speed_increase_percentage": {
          "1": 0.20,
          "2": 0.40,
          "3": 0.60,
          "4": 0.80,
          "5": 1.00
        }
      }
    }
  },
  "exclusive-weapon": null
};

export const jassar: Hero = {
  "hero-name": "Jassar",
  "hero-class": "marksman",
  "generation": 1,
  "max-star-power": 553440,
  "max-skill-power": 67680,
  "max-level-power": 149280,
  "base-stats": {
    "marksman-attack": 0.14011,
    "marksman-defense": 0.14011
  },
  "skills": {
    "expedition": {
      "1": {
        "skill-name": "Tactical Genius",
        "description": "Jassar's combination of courage and wisdom enriches the army, increasing damage dealt by [5%/10%/15%/20%/25%] for all troops.",
        "all_troops_damage_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      },
      "2": {
        "skill-name": "Enlightened Warfare",
        "description": "Jassar's profound knowledge increases the city's Research Speed by [3%/6%/9%/12%/15%].",
        "research_speed_increase_percentage": {
          "1": 0.03,
          "2": 0.06,
          "3": 0.09,
          "4": 0.12,
          "5": 0.15
        },
        "research_speed_type": "city"
      }
    }
  },
  "exclusive-weapon": null
};

export const jessie: Hero = {
  "hero-name": "Jessie",
  "hero-class": "lancer",
  "generation": 1,
  "max-star-power": 553440,
  "max-skill-power": 67680,
  "max-level-power": 149280,
  "base-stats": {
    "lancer-attack": 0.14011,
    "lancer-defense": 0.14011
  },
  "skills": {
    "expedition": {
      "1": {
        "skill-name": "Stand of Arms",
        "description": "Jessie implements advanced weaponry for our troops, increasing damage dealt by [5%/10%/15%/20%/25%] for all troops.",
        "all_troops_damage_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      },
      "2": {
        "skill-name": "Bulwarks",
        "description": "With a keen engineering eye, Jessie enhances troops' armor, reducing damage taken by [4%/8%/12%/16%/20%] for all troops.",
        "all_troops_damage_taken_down_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20
        }
      }
    }
  },
  "exclusive-weapon": null
};

export const patrick: Hero = {
  "hero-name": "Patrick",
  "hero-class": "lancer",
  "generation": 1,
  "max-star-power": 553440,
  "max-skill-power": 67680,
  "max-level-power": 149280,
  "base-stats": {
    "lancer-attack": 0.14011,
    "lancer-defense": 0.14011
  },
  "skills": {
    "expedition": {
      "1": {
        "skill-name": "Super Nutrients",
        "description": "Patrick's culinary masterpieces invigorate our troops, increasing Health by [5%/10%/15%/20%/25%] for all troops.",
        "all_troops_health_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      },
      "2": {
        "skill-name": "Caloric Booster",
        "description": "Patrick's gourmet meals motivate and unleash the potential of our soldiers, increasing Attack by [5%/10%/15%/20%/25%] for all troops.",
        "all_troops_attack_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      }
    }
  },
  "exclusive-weapon": null
};

export const seo_yoon: Hero = {
  "hero-name": "Seo-Yoon",
  "hero-class": "marksman",
  "generation": 1,
  "max-star-power": 553440,
  "max-skill-power": 67680,
  "max-level-power": 149280,
  "base-stats": {
    "marksman-attack": 0.14011,
    "marksman-defense": 0.14011
  },
  "skills": {
    "expedition": {
      "1": {
        "skill-name": "Rallying Beat",
        "description": "As the march nears, Seo-Yoon drums to bolster everyone's morale, increasing Attack by [5% / 10% / 15% / 20% / 25%] for all troops.",
        "all_troops_attack_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      },
      "2": {
        "skill-name": "Soothing Dance",
        "description": "Seo-Yoon treats wounded troops with traditional medicine, increasing Healing Speed in the Infirmary by [10% / 20% / 30% / 40% / 50%].",
        "infirmary_healing_speed_increase_percentage": {
          "1": 0.10,
          "2": 0.20,
          "3": 0.30,
          "4": 0.40,
          "5": 0.50
        }
      }
    }
  },
  "exclusive-weapon": null
};

export const sergey: Hero = {
  "hero-name": "Sergey",
  "hero-class": "infantry",
  "generation": 1,
  "max-star-power": 553440,
  "max-skill-power": 67680,
  "max-level-power": 149280,
  "base-stats": {
    "infantry-attack": 0.14011,
    "infantry-defense": 0.14011
  },
  "skills": {
    "expedition": {
      "1": {
        "skill-name": "Defender's Edge",
        "description": "Sergey guards our troops with his shield, reducing damage taken by [4% / 8% / 12% / 16% / 20%] for all troops.",
        "all_troops_damage_taken_down_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20
        }
      },
      "2": {
        "skill-name": "Weaken",
        "description": "Sergey's intimidating presence reduces Attack by [4% / 8% / 12% / 16% / 20%] for all enemy troops.",
        "enemy_attack_down_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20
        }
      }
    }
  },
  "exclusive-weapon": null
};

export const lumak_bokan: Hero = {
  "hero-name": "Lumak Bokan",
  "hero-class": "lancer",
  "generation": 1,
  "max-star-power": 553440,
  "max-skill-power": 67680,
  "max-level-power": 149280,
  "base-stats": {
    "lancer-attack": 0.14011,
    "lancer-defense": 0.14011
  },
  "skills": {
    "expedition": {
      "1": {
        "skill-name": "Tactical Deception",
        "description": "With Walis Bokan's expert guerrilla tactics, all enemy troops' damage dealt is reduced by [4% / 8% / 12% / 16% / 20%].",
        "enemy_damage_down_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20
        }
      }
    }
  },
  "exclusive-weapon": null
};

export const ling_xue: Hero = {
  "hero-name": "Ling Xue",
  "hero-class": "lancer",
  "generation": 1,
  "max-star-power": 553440,
  "max-skill-power": 67680,
  "max-level-power": 149280,
  "base-stats": {
    "lancer-attack": 0.14011,
    "lancer-defense": 0.14011
  },
  "skills": {
    "expedition": {
      "1": {
        "skill-name": "Fearsome Aura",
        "description": "Ling Xue's withering assault has disturbed enemies' formation, reducing all enemy Troops Attack by [4% / 8% / 12% / 16% / 20%].",
        "enemy_attack_reduction_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20
        }
      }
    }
  },
  "exclusive-weapon": null
};

const jeronimo: Hero = {
  "hero-name": "Jeronimo",
  "hero-class": "infantry",
  "generation": 1,
  "max-star-power": 864750,
  "max-skill-power": 101520,
  "max-level-power": 233250,
  "base-stats": {
    "infantry-attack": 2.6020,
    "infantry-defense": 2.6020
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Battle Manifesto",
        "description": "Jeronimo delivers a rousing rally speech ahead of the battle, increasing damage dealt by [5% / 10% / 15% / 20% / 25%] for all troops.",
        "all_troops_damage_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      },
      "2": {
        "skill-name": "Swordmentor",
        "description": "Jeronimo imparts the secrets of swordsmanship, increasing Attack by [5% / 10% / 15% / 20% / 25%] for all troops.",
        "all_troops_attack_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      },
      "3": {
        "skill-name": "Expert Swordsmanship",
        "description": "Jeronimo's teachings in sword arts increases Damage Dealt by [6% / 12% / 18% / 24% / 30%] for all troops for 2 turns every 4 turns.",
        "all_troops_damage_up_percentage": {
          "1": 0.06,
          "2": 0.12,
          "3": 0.18,
          "4": 0.24,
          "5": 0.30
        },
        "duration_turns": 2,
        "trigger_every_n_turns": 4
      }
    }
  },
  "exclusive-weapon": {
    name: "Dawnbreak",
    levels: [
      {
        level: 1,
        "infantry-lethality": 0.0625,
        "infantry-health": 0.0625,
        power: 37500,
        skills: {
          expedition: null
        }
      },
      {
        level: 2,
        "infantry-lethality": 0.1250,
        "infantry-health": 0.1250,
        power: 63750,
        skills: {
          expedition: {
            "skill-name": "Discernment",
            "description": "Rally Troop Attack +5%",
            "rally_troops_attack_up_percentage": 0.05
          }
        }
      },
      {
        level: 3,
        "infantry-lethality": 0.1875,
        "infantry-health": 0.1875,
        power: 90000,
        skills: {
          expedition: {
            "skill-name": "Discernment",
            "description": "Rally Troop Attack +5%",
            "rally_troops_attack_up_percentage": 0.05
          }
        }
      },
      {
        level: 4,
        "infantry-lethality": 0.2500,
        "infantry-health": 0.2500,
        power: 116250,
        skills: {
          expedition: {
            "skill-name": "Discernment",
            "description": "Rally Troop Attack +7.5%",
            "rally_troops_attack_up_percentage": 0.075
          }
        }
      },
      {
        level: 5,
        "infantry-lethality": 0.3125,
        "infantry-health": 0.3125,
        power: 142500,
        skills: {
          expedition: {
            "skill-name": "Discernment",
            "description": "Rally Troop Attack +7.5%",
            "rally_troops_attack_up_percentage": 0.075
          }
        }
      },
      {
        level: 6,
        "infantry-lethality": 0.3750,
        "infantry-health": 0.3750,
        power: 168750,
        skills: {
          expedition: {
            "skill-name": "Discernment",
            "description": "Rally Troop Attack +10%",
            "rally_troops_attack_up_percentage": 0.10
          }
        }
      },
      {
        level: 7,
        "infantry-lethality": 0.4375,
        "infantry-health": 0.4375,
        power: 195000,
        skills: {
          expedition: {
            "skill-name": "Discernment",
            "description": "Rally Troop Attack +10%",
            "rally_troops_attack_up_percentage": 0.10
          }
        }
      },
      {
        level: 8,
        "infantry-lethality": 0.5000,
        "infantry-health": 0.5000,
        power: 221250,
        skills: {
          expedition: {
            "skill-name": "Discernment",
            "description": "Rally Troop Attack +12.5%",
            "rally_troops_attack_up_percentage": 0.125
          }
        }
      },
      {
        level: 9,
        "infantry-lethality": 0.5625,
        "infantry-health": 0.5625,
        power: 247500,
        skills: {
          expedition: {
            "skill-name": "Discernment",
            "description": "Rally Troop Attack +12.5%",
            "rally_troops_attack_up_percentage": 0.125
          }
        }
      },
      {
        level: 10,
        "infantry-lethality": 0.6250,
        "infantry-health": 0.6250,
        power: 281250,
        skills: {
          expedition: {
            "skill-name": "Discernment",
            "description": "Rally Troop Attack +15%",
            "rally_troops_attack_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

const molly: Hero = {
  "hero-name": "Molly",
  "hero-class": "lancer",
  "generation": 1,
  "max-star-power": 691800,
  "max-skill-power": 101520,
  "max-level-power": 186600,
  "base-stats": {
    "lancer-attack": 2.0016,
    "lancer-defense": 2.0016
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Snow's Grace",
        "description": "Molly calls upon the grace of winter, granting a 40% chance of reducing all troops' Damage Taken by [10% / 20% / 30% / 40% / 50%].",
        "all_troops_damage_taken_down_percentage": {
          "1": 0.10,
          "2": 0.20,
          "3": 0.30,
          "4": 0.40,
          "5": 0.50
        },
        "trigger_chance": 0.40,
      },
      "2": {
        "skill-name": "Ice Dominion",
        "description": "Molly excels in snowy terrains, granting all troops' attack a 50% chance of increasing damage dealt by [10% / 20% / 30% / 40% / 50%].",
        "all_troops_damage_up_percentage": {
          "1": 0.10,
          "2": 0.20,
          "3": 0.30,
          "4": 0.40,
          "5": 0.50
        },
        "trigger_chance": 0.50
      },
      "3": {
        "skill-name": "Youthful Rage",
        "description": "Hell hath no fury like an angry Molly, increasing damage dealt by [5% / 10% / 15% / 20% / 25%] for all troops.",
        "all_troops_damage_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      }
    }
  },
  "exclusive-weapon": {
    name: "Yeti Spirit",
    levels: [
      {
        level: 1,
        "lancer-lethality": 0.0500,
        "lancer-health": 0.0500,
        power: 30000,
        skills: {
          expedition: null
        }
      },
      {
        level: 2,
        "lancer-lethality": 0.1000,
        "lancer-health": 0.1000,
        power: 51000,
        skills: {
          expedition: {
            "skill-name": "Snowy Blessing",
            "description": "Defender Troops' Lethality +5%",
            "defender_troops_damage_up_percentage": 0.05
          }
        }
      },
      {
        level: 3,
        "lancer-lethality": 0.1500,
        "lancer-health": 0.1500,
        power: 72000,
        skills: {
          expedition: {
            "skill-name": "Snowy Blessing",
            "description": "Defender Troops' Lethality +5%",
            "defender_troops_damage_up_percentage": 0.05
          }
        }
      },
      {
        level: 4,
        "lancer-lethality": 0.2000,
        "lancer-health": 0.2000,
        power: 93000,
        skills: {
          expedition: {
            "skill-name": "Snowy Blessing",
            "description": "Defender Troops' Lethality +7.5%",
            "defender_troops_damage_up_percentage": 0.075
          }
        }
      },
      {
        level: 5,
        "lancer-lethality": 0.2500,
        "lancer-health": 0.2500,
        power: 114000,
        skills: {
          expedition: {
            "skill-name": "Snowy Blessing",
            "description": "Defender Troops' Lethality +7.5%",
            "defender_troops_damage_up_percentage": 0.075
          }
        }
      },
      {
        level: 6,
        "lancer-lethality": 0.3000,
        "lancer-health": 0.3000,
        power: 135000,
        skills: {
          expedition: {
            "skill-name": "Snowy Blessing",
            "description": "Defender Troops' Lethality +10%",
            "defender_troops_damage_up_percentage": 0.10
          }
        }
      },
      {
        level: 7,
        "lancer-lethality": 0.3500,
        "lancer-health": 0.3500,
        power: 156000,
        skills: {
          expedition: {
            "skill-name": "Snowy Blessing",
            "description": "Defender Troops' Lethality +10%",
            "defender_troops_damage_up_percentage": 0.10
          }
        }
      },
      {
        level: 8,
        "lancer-lethality": 0.4000,
        "lancer-health": 0.4000,
        power: 177000,
        skills: {
          expedition: {
            "skill-name": "Snowy Blessing",
            "description": "Defender Troops' Lethality +12.5%",
            "defender_troops_damage_up_percentage": 0.125
          }
        }
      },
      {
        level: 9,
        "lancer-lethality": 0.4500,
        "lancer-health": 0.4500,
        power: 198000,
        skills: {
          expedition: {
            "skill-name": "Snowy Blessing",
            "description": "Defender Troops' Lethality +12.5%",
            "defender_troops_damage_up_percentage": 0.125
          }
        }
      },
      {
        level: 10,
        "lancer-lethality": 0.5000,
        "lancer-health": 0.5000,
        power: 225000,
        skills: {
          expedition: {
            "skill-name": "Snowy Blessing",
            "description": "Defender Troops' Lethality +15%",
            "defender_troops_damage_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

const natalia: Hero = {
  "hero-name": "Natalia",
  "hero-class": "infantry",
  "generation": 1,
  "max-star-power": 760980,
  "max-skill-power": 101520,
  "max-level-power": 205260,
  "base-stats": {
    "infantry-attack": 2.0016,
    "infantry-defense": 2.0016
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Feral Protection",
        "description": "Natalia's feral instincts protect her troops, granting a 40% chance of reducing all troops' Damage Taken by [10% / 20% / 30% / 40% / 50%].",
        "all_troops_damage_taken_down_percentage": {
          "1": 0.10,
          "2": 0.20,
          "3": 0.30,
          "4": 0.40,
          "5": 0.50
        },
        "trigger_chance": 0.40,
      },
      "2": {
        "skill-name": "Queen of the Wild",
        "description": "Natalia is a natural leader, increasing Attack by [5% / 10% / 15% / 20% / 25%] for all troops.",
        "all_troops_attack_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      },
      "3": {
        "skill-name": "Call of the Wild",
        "description": "Natalia's unexplained connection with nature allows her to rally wild beasts, increasing damage dealt by [5% / 10% / 15% / 20% / 25%] for all troops.",
        "all_troops_damage_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      }
    }
  },
  "exclusive-weapon": {
    name: "Gale Force",
    levels: [
      {
        level: 1,
        "infantry-lethality": 0.0555,
        "infantry-health": 0.0555,
        power: 33000,
        skills: {
          expedition: null
        }
      },
      {
        level: 2,
        "infantry-lethality": 0.1110,
        "infantry-health": 0.1110,
        power: 55100,
        skills: {
          expedition: {
            "skill-name": "Invincibles",
            "description": "Rally Troop Lethality +5%",
            "rally_troops_damage_up_percentage": 0.05
          }
        }
      },
      {
        level: 3,
        "infantry-lethality": 0.1665,
        "infantry-health": 0.1665,
        power: 79200,
        skills: {
          expedition: {
            "skill-name": "Invincibles",
            "description": "Rally Troop Lethality +5%",
            "rally_troops_damage_up_percentage": 0.05
          }
        }
      },
      {
        level: 4,
        "infantry-lethality": 0.2220,
        "infantry-health": 0.2220,
        power: 102300,
        skills: {
          expedition: {
            "skill-name": "Invincibles",
            "description": "Rally Troop Lethality +7.5%",
            "rally_troops_damage_up_percentage": 0.075
          }
        }
      },
      {
        level: 5,
        "infantry-lethality": 0.2775,
        "infantry-health": 0.2775,
        power: 125400,
        skills: {
          expedition: {
            "skill-name": "Invincibles",
            "description": "Rally Troop Lethality +7.5%",
            "rally_troops_damage_up_percentage": 0.075
          }
        }
      },
      {
        level: 6,
        "infantry-lethality": 0.3330,
        "infantry-health": 0.3330,
        power: 148500,
        skills: {
          expedition: {
            "skill-name": "Invincibles",
            "description": "Rally Troop Lethality +10%",
            "rally_troops_damage_up_percentage": 0.10
          }
        }
      },
      {
        level: 7,
        "infantry-lethality": 0.3885,
        "infantry-health": 0.3885,
        power: 171600,
        skills: {
          expedition: {
            "skill-name": "Invincibles",
            "description": "Rally Troop Lethality +10%",
            "rally_troops_damage_up_percentage": 0.10
          }
        }
      },
      {
        level: 8,
        "infantry-lethality": 0.4440,
        "infantry-health": 0.4440,
        power: 194700,
        skills: {
          expedition: {
            "skill-name": "Invincibles",
            "description": "Rally Troop Lethality +12.5%",
            "rally_troops_damage_up_percentage": 0.125
          }
        }
      },
      {
        level: 9,
        "infantry-lethality": 0.4995,
        "infantry-health": 0.4995,
        power: 217800,
        skills: {
          expedition: {
            "skill-name": "Invincibles",
            "description": "Rally Troop Lethality +12.5%",
            "rally_troops_damage_up_percentage": 0.125
          }
        }
      },
      {
        level: 10,
        "infantry-lethality": 0.5550,
        "infantry-health": 0.5550,
        power: 247500,
        skills: {
          expedition: {
            "skill-name": "Invincibles",
            "description": "Rally Troop Lethality +15%",
            "rally_troops_damage_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

const zinman: Hero = {
  "hero-name": "Zinman",
  "hero-class": "marksman",
  "generation": 1,
  "max-star-power": 830160,
  "max-skill-power": 101520,
  "max-level-power": 223920,
  "base-stats": {
    "marksman-attack": 2.0016,
    "marksman-defense": 2.0016
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Implacable",
        "description": "Zinman is the master builder udnerstands what is required of a strong defensive line, increasing all troops' Defense by 10% and Health by 10%.",
        "all_troops_defense_up_percentage": {
          "1": 0.10,
          "2": 0.10,
          "3": 0.10,
          "4": 0.10,
          "5": 0.10
        },
        "all_troops_health_up_percentage": {
          "1": 0.10,
          "2": 0.10,
          "3": 0.10,
          "4": 0.10,
          "5": 0.10
        }
      },
      "2": {
        "skill-name": "Bastionist",
        "description": "Zinman's skillful control of the construction workflow reduces basic resource consumption (Meat, Wood, Coal, Iron) by [3%, 6%, 9%, 12%, 15%] and increases Building Upgrade speed by [3%, 6%, 9%, 12%, 15%].",
        "building_upgrade_speed_increase_percentage": {
          "1": 0.03,
          "2": 0.06,
          "3": 0.09,
          "4": 0.12,
          "5": 0.15
        },
        "resource_consumption_reduction_percentage": {
          "1": 0.03,
          "2": 0.06,
          "3": 0.09,
          "4": 0.12,
          "5": 0.15
        }
      },
      "3": {
        "skill-name": "Positional Battler",
        "description": "Zinman masterfully manipulates the battlefield, increasing damage dealt by [5% / 10% / 15% / 20% / 25%] for all troops.",
        "all_troops_damage_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      }
    }
  },
  "exclusive-weapon": {
    name: "Woodpecker",
    levels: [
      {
        level: 1,
        "marksman-lethality": 0.05,
        "marksman-health": 0.05,
        power: 30000,
        skills: {
          expedition: null
        }
      },
      {
        level: 2,
        "marksman-lethality": 0.10,
        "marksman-health": 0.10,
        power: 51000,
        skills: {
          expedition: {
            "skill-name": "Defend to Attack",
            "description": "Defender Troop Attack +5%",
            "defender_troops_attack_up_percentage": 0.05
          }
        }
      },
      {
        level: 3,
        "marksman-lethality": 0.15,
        "marksman-health": 0.15,
        power: 72000,
        skills: {
          expedition: {
            "skill-name": "Defend to Attack",
            "description": "Defender Troop Attack +5%",
            "defender_troops_attack_up_percentage": 0.05
          }
        }
      },
      {
        level: 4,
        "marksman-lethality": 0.20,
        "marksman-health": 0.20,
        power: 93000,
        skills: {
          expedition: {
            "skill-name": "Defend to Attack",
            "description": "Defender Troop Attack +7.5%",
            "defender_troops_attack_up_percentage": 0.075
          }
        }
      },
      {
        level: 5,
        "marksman-lethality": 0.25,
        "marksman-health": 0.25,
        power: 114000,
        skills: {
          expedition: {
            "skill-name": "Defend to Attack",
            "description": "Defender Troop Attack +7.5%",
            "defender_troops_attack_up_percentage": 0.075
          }
        }
      },
      {
        level: 6,
        "marksman-lethality": 0.30,
        "marksman-health": 0.30,
        power: 135000,
        skills: {
          expedition: {
            "skill-name": "Defend to Attack",
            "description": "Defender Troop Attack +10%",
            "defender_troops_attack_up_percentage": 0.10
          }
        }
      },
      {
        level: 7,
        "marksman-lethality": 0.35,
        "marksman-health": 0.35,
        power: 156000,
        skills: {
          expedition: {
            "skill-name": "Defend to Attack",
            "description": "Defender Troop Attack +10%",
            "defender_troops_attack_up_percentage": 0.10
          }
        }
      },
      {
        level: 8,
        "marksman-lethality": 0.40,
        "marksman-health": 0.40,
        power: 177000,
        skills: {
          expedition: {
            "skill-name": "Defend to Attack",
            "description": "Defender Troop Attack +12.5%",
            "defender_troops_attack_up_percentage": 0.125
          }
        }
      },
      {
        level: 9,
        "marksman-lethality": 0.45,
        "marksman-health": 0.45,
        power: 198000,
        skills: {
          expedition: {
            "skill-name": "Defend to Attack",
            "description": "Defender Troop Attack +12.5%",
            "defender_troops_attack_up_percentage": 0.125
          }
        }
      },
      {
        level: 10,
        "marksman-lethality": 0.50,
        "marksman-health": 0.50,
        power: 225000,
        skills: {
          expedition: {
            "skill-name": "Defend to Attack",
            "description": "Defender Troop Attack +15%",
            "defender_troops_attack_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const alonso: Hero = {
  "hero-name": "Alonso",
  "hero-class": "marksman",
  "generation": 2,
  "max-star-power": 830160,
  "max-skill-power": 101520,
  "max-level-power": 223920,
  "base-stats": {
    "marksman-attack": 2.4019,
    "marksman-defense": 2.4019
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Onslaught",
        "description": "Alonso unleashes a devastating onslaught, granting a 40% chance of increasing all troops' Lethality by [10% / 20% / 30% / 40% / 50%].",
        "all_troops_lethality_up_percentage": {
          "1": 0.10,
          "2": 0.20,
          "3": 0.30,
          "4": 0.40,
          "5": 0.50
        },
        "trigger_chance": 0.40
      },
      "2": {
        "skill-name": "Iron Strength",
        "description": "Alonso's indomitable will grants all troops' attack a 20% chance of reducing damage dealt by [10% / 20% / 30% / 40% / 50%] for all enemy troops for 2 turns.",
        "enemy_damage_down_percentage": {
          "1": 0.10,
          "2": 0.20,
          "3": 0.30,
          "4": 0.40,
          "5": 0.50
        },
        "reduction_duration_turns": 2
      },
      "3": {
        "skill-name": "Poison Harpoon",
        "description": "Alonso coats weapons with lethal toxins, granting all troops' attack a 50% chance of dealing [10% / 20% / 30% / 40% / 50%] more damage.",
        "all_troops_extra_damage_up_percentage": {
          "1": 0.10,
          "2": 0.20,
          "3": 0.30,
          "4": 0.40,
          "5": 0.50
        }
      }
    }
  },
  "exclusive-weapon": {
    name: "Captain Ahab",
    levels: [
      {
        "level": 1,
        "marksman-lethality": 0.0600,
        "marksman-health": 0.0600,
        power: 36000,
        "skills": {}
      },
      {
        "level": 2,
        "marksman-lethality": 0.1200,
        "marksman-health": 0.1200,
        power: 61200,
        "skills": {
          "expedition": {
            "skill-name": "Harpoon Enhancement",
            "description": "Rally Troop Lethality +5%",
            "rally_troops_damage_up_percentage": 0.05
          }
        }
      },
      {
        "level": 3,
        "marksman-lethality": 0.1800,
        "marksman-health": 0.1800,
        power: 86400,
        "skills": {
          "expedition": {
            "skill-name": "Harpoon Enhancement",
            "description": "Rally Troop Lethality +5%",
            "rally_troops_damage_up_percentage": 0.05
          }
        }
      },
      {
        "level": 4,
        "marksman-lethality": 0.2400,
        "marksman-health": 0.2400,
        power: 111600,
        "skills": {
          "expedition": {
            "skill-name": "Harpoon Enhancement",
            "description": "Rally Troop Lethality +7.5%",
            "rally_troops_damage_up_percentage": 0.075
          }
        }
      },
      {
        "level": 5,
        "marksman-lethality": 0.3000,
        "marksman-health": 0.3000,
        power: 136800,
        "skills": {
          "expedition": {
            "skill-name": "Harpoon Enhancement",
            "description": "Rally Troop Lethality +7.5%",
            "rally_troops_damage_up_percentage": 0.075
          }
        }
      },
      {
        "level": 6,
        "marksman-lethality": 0.3600,
        "marksman-health": 0.3600,
        power: 162000,
        "skills": {
          "expedition": {
            "skill-name": "Harpoon Enhancement",
            "description": "Rally Troop Lethality +10%",
            "rally_troops_damage_up_percentage": 0.10
          }
        }
      },
      {
        "level": 7,
        "marksman-lethality": 0.4200,
        "marksman-health": 0.4200,
        power: 187200,
        "skills": {
          "expedition": {
            "skill-name": "Harpoon Enhancement",
            "description": "Rally Troop Lethality +10%",
            "rally_troops_damage_up_percentage": 0.10
          }
        }
      },
      {
        "level": 8,
        "marksman-lethality": 0.4800,
        "marksman-health": 0.4800,
        power: 212400,
        "skills": {
          "expedition": {
            "skill-name": "Harpoon Enhancement",
            "description": "Rally Troop Lethality +12.5%",
            "rally_troops_damage_up_percentage": 0.125
          }
        }
      },
      {
        "level": 9,
        "marksman-lethality": 0.5400,
        "marksman-health": 0.5400,
        power: 237600,
        "skills": {
          "expedition": {
            "skill-name": "Harpoon Enhancement",
            "description": "Rally Troop Lethality +12.5%",
            "rally_troops_damage_up_percentage": 0.125
          }
        }
      },
      {
        "level": 10,
        "marksman-lethality": 0.6000,
        "marksman-health": 0.6000,
        power: 270000,
        "skills": {
          "expedition": {
            "skill-name": "Harpoon Enhancement",
            "description": "Rally Troop Lethality +15%",
            "rally_troops_damage_up_percentage": 0.15
          }
        }
      }
    ]
  }
};


export const flint: Hero = {
  "hero-name": "Flint",
  "hero-class": "infantry",
  "generation": 2,
  "max-star-power": 830160,
  "max-skill-power": 101520,
  "max-level-power": 223920,
  "base-stats": {
    "infantry-attack": 2.4019,
    "infantry-defense": 2.4019
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Pyromaniac",
        "description": "Flint's pyromaniac tendencies fuel his infantry with destructive power, increasing his infantry's Damage Dealt by [20% / 40% / 60% / 80% / 100%].",
        "infantry_damage_up_percentage": {
          "1": 0.20,
          "2": 0.40,
          "3": 0.60,
          "4": 0.80,
          "5": 1.00
        }
      },
      "2": {
        "skill-name": "Burning Resolve",
        "description": "Flint's fire not only dispels the cold but also ignites the passion for battle, increasing Attack by [5% / 10% / 15% / 20% / 25%] for all troops.",
        "all_troops_attack_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      },
      "3": {
        "skill-name": "Immolation",
        "description": "Flint's self-immolation fuels his troops with lethal precision, increasing all troops' Lethality by [5% / 10% / 15% / 20% / 25%].",
        "all_troops_lethality_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      }
    }
  },
  "exclusive-weapon": {
    name: "Dragonbane",
    levels: [
      {
        "level": 1,
        "infantry-lethality": 0.0600,
        "infantry-health": 0.0600,
        power: 36000,
        "skills": {}
      },
      {
        "level": 2,
        "infantry-lethality": 0.1200,
        "infantry-health": 0.1200,
        power: 61200,
        "skills": {
          "expedition": {
            "skill-name": "Dragonbreath",
            "description": "Defender Troop Attack +5%",
            "defender_troops_attack_up_percentage": 0.05
          }
        }
      },
      {
        "level": 3,
        "infantry-lethality": 0.1800,
        "infantry-health": 0.1800,
        power: 86400,
        "skills": {
          "expedition": {
            "skill-name": "Dragonbreath",
            "description": "Defender Troop Attack +5%",
            "defender_troops_attack_up_percentage": 0.05
          }
        }
      },
      {
        "level": 4,
        "infantry-lethality": 0.2400,
        "infantry-health": 0.2400,
        power: 111600,
        "skills": {
          "expedition": {
            "skill-name": "Dragonbreath",
            "description": "Defender Troop Attack +7.5%",
            "defender_troops_attack_up_percentage": 0.075
          }
        }
      },
      {
        "level": 5,
        "infantry-lethality": 0.3000,
        "infantry-health": 0.3000,
        power: 136800,
        "skills": {
          "expedition": {
            "skill-name": "Dragonbreath",
            "description": "Defender Troop Attack +7.5%",
            "defender_troops_attack_up_percentage": 0.075
          }
        }
      },
      {
        "level": 6,
        "infantry-lethality": 0.3600,
        "infantry-health": 0.3600,
        power: 162000,
        "skills": {
          "expedition": {
            "skill-name": "Dragonbreath",
            "description": "Defender Troop Attack +10%",
            "defender_troops_attack_up_percentage": 0.10
          }
        }
      },
      {
        "level": 7,
        "infantry-lethality": 0.4200,
        "infantry-health": 0.4200,
        power: 187200,
        "skills": {
          "expedition": {
            "skill-name": "Dragonbreath",
            "description": "Defender Troop Attack +10%",
            "defender_troops_attack_up_percentage": 0.10
          }
        }
      },
      {
        "level": 8,
        "infantry-lethality": 0.4800,
        "infantry-health": 0.4800,
        power: 212400,
        "skills": {
          "expedition": {
            "skill-name": "Dragonbreath",
            "description": "Defender Troop Attack +12.5%",
            "defender_troops_attack_up_percentage": 0.125
          }
        }
      },
      {
        "level": 9,
        "infantry-lethality": 0.5400,
        "infantry-health": 0.5400,
        power: 237600,
        "skills": {
          "expedition": {
            "skill-name": "Dragonbreath",
            "description": "Defender Troop Attack +12.5%",
            "defender_troops_attack_up_percentage": 0.125
          }
        }
      },
      {
        "level": 10,
        "infantry-lethality": 0.6000,
        "infantry-health": 0.6000,
        power: 270000,
        "skills": {
          "expedition": {
            "skill-name": "Dragonbreath",
            "description": "Defender Troop Attack +15%",
            "defender_troops_attack_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const philly: Hero = {
  "hero-name": "Philly",
  "hero-class": "lancer",
  "generation": 2,
  "max-star-power": 830160,
  "max-skill-power": 101520,
  "max-level-power": 223920,
  "base-stats": {
    "lancer-attack": 2.4019,
    "lancer-defense": 2.4019
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Vigor Tactics",
        "description": "Philly's secret remedy strengthens the soldiers, increasing Attack by [3% / 6% / 9% / 12% / 15%] and Defense by [2% / 4% / 6% / 8% / 10%] for all troops.",
        "all_troops_attack_up_percentage": {
          "1": 0.03,
          "2": 0.06,
          "3": 0.09,
          "4": 0.12,
          "5": 0.15
        },
        "defense_up_percentage": {
          "1": 0.02,
          "2": 0.04,
          "3": 0.06,
          "4": 0.08,
          "5": 0.10
        }
      },
      "2": {
        "skill-name": "Dosage Boost",
        "description": "Philly uses her secret tonic to enhance the warriors' strength, granting all troops' attack a 25% chance of dealing [120% / 140% / 160% / 180% / 200%] damage.",
        "all_troops_extra_damage_up_percentage": {
          "1": 1.20,
          "2": 1.40,
          "3": 1.60,
          "4": 1.80,
          "5": 2.00
        }
      },
      "3": {
        "skill-name": "Energizing Shot",
        "description": "Philly energizes her troops with a potent shot, granting a 40% chance of reducing all troops' Damage Taken by [10% / 20% / 30% / 40% / 50%].",
        "all_troops_damage_taken_down_percentage": {
          "1": 0.10,
          "2": 0.20,
          "3": 0.30,
          "4": 0.40,
          "5": 0.50
        },
        "trigger_chance": 0.40
      }
    }
  },
  "exclusive-weapon": {
    name: "Pharmacologica",
    levels: [
      {
        "level": 1,
        "lancer-lethality": 0.0600,
        "lancer-health": 0.0600,
        power: 36000,
        "skills": {}
      },
      {
        "level": 2,
        "lancer-lethality": 0.1200,
        "lancer-health": 0.1200,
        power: 61200,
        "skills": {
          "expedition": {
            "skill-name": "First Aid Training",
            "description": "Defender Troop Health +5%",
            "defender_troops_health_up_percentage": 0.05
          }
        }
      },
      {
        "level": 3,
        "lancer-lethality": 0.1800,
        "lancer-health": 0.1800,
        power: 86400,
        "skills": {
          "expedition": {
            "skill-name": "First Aid Training",
            "description": "Defender Troop Health +5%",
            "defender_troops_health_up_percentage": 0.05
          }
        }
      },
      {
        "level": 4,
        "lancer-lethality": 0.2400,
        "lancer-health": 0.2400,
        power: 111600,
        "skills": {
          "expedition": {
            "skill-name": "First Aid Training",
            "description": "Defender Troop Health +7.5%",
            "defender_troops_health_up_percentage": 0.075
          }
        }
      },
      {
        "level": 5,
        "lancer-lethality": 0.3000,
        "lancer-health": 0.3000,
        power: 136800,
        "skills": {
          "expedition": {
            "skill-name": "First Aid Training",
            "description": "Defender Troop Health +7.5%",
            "defender_troops_health_up_percentage": 0.075
          }
        }
      },
      {
        "level": 6,
        "lancer-lethality": 0.3600,
        "lancer-health": 0.3600,
        power: 162000,
        "skills": {
          "expedition": {
            "skill-name": "First Aid Training",
            "description": "Defender Troop Health +10%",
            "defender_troops_health_up_percentage": 0.10
          }
        }
      },
      {
        "level": 7,
        "lancer-lethality": 0.4200,
        "lancer-health": 0.4200,
        power: 187200,
        "skills": {
          "expedition": {
            "skill-name": "First Aid Training",
            "description": "Defender Troop Health +10%",
            "defender_troops_health_up_percentage": 0.10
          }
        }
      },
      {
        "level": 8,
        "lancer-lethality": 0.4800,
        "lancer-health": 0.4800,
        power: 212400,
        "skills": {
          "expedition": {
            "skill-name": "First Aid Training",
            "description": "Defender Troop Health +12.5%",
            "defender_troops_health_up_percentage": 0.125
          }
        }
      },
      {
        "level": 9,
        "lancer-lethality": 0.5400,
        "lancer-health": 0.5400,
        power: 237600,
        "skills": {
          "expedition": {
            "skill-name": "First Aid Training",
            "description": "Defender Troop Health +12.5%",
            "defender_troops_health_up_percentage": 0.125
          }
        }
      },
      {
        "level": 10,
        "lancer-lethality": 0.6000,
        "lancer-health": 0.6000,
        power: 270000,
        "skills": {
          "expedition": {
            "skill-name": "First Aid Training",
            "description": "Defender Troop Health +15%",
            "defender_troops_health_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const greg: Hero = {
  "hero-name": "Greg",
  "hero-class": "marksman",
  "generation": 3,
  "max-star-power": 1037700,
  "max-skill-power": 101520,
  "max-level-power": 279900,
  "base-stats": {
    "marksman-attack": 2.9023,
    "marksman-defense": 2.9023
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Sword of Justice",
        "description": "Greg transforms our troops into a relentless sword of justice, granting a 20% chance of increasing damage dealt by [8% / 16% / 24% / 32% / 40%] for all troops for 3 turns.",
        "all_troops_extra_damage_up_percentage": {
          "1": 0.08,
          "2": 0.16,
          "3": 0.24,
          "4": 0.32,
          "5": 0.40
        }
      },
      "2": {
        "skill-name": "Deterrence of Law",
        "description": "Greg uses the authority of the law to intimidate enemies, granting all troops' attack a 20% chance of reducing enemy damage dealt by [10% / 20% / 30% / 40% / 50%] for 2 turns.",
        "enemy_damage_down_percentage": {
          "1": 0.10,
          "2": 0.20,
          "3": 0.30,
          "4": 0.40,
          "5": 0.50
        },
        "reduction_duration_turns": 2
      },
      "3": {
        "skill-name": "Law and Order",
        "description": "Greg's faith in law and order uplifts everyone, increasing Health by [5% / 10% / 15% / 20% / 25%] for all troops.",
        "all_troops_health_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      }
    }
  },
  "exclusive-weapon": {
    name: "State Edict",
    levels: [
      {
        "level": 1,
        "marksman-lethality": 0.0700,
        "marksman-health": 0.0700,
        power: 42000,
        "skills": {}
      },
      {
        "level": 2,
        "marksman-lethality": 0.1400,
        "marksman-health": 0.1400,
        power: 71400,
        "skills": {
          "expedition": {
            "skill-name": "Trumpet of Justice",
            "description": "Rally Troop Health +5%",
            "rally_troops_health_up_percentage": 0.05
          }
        }
      },
      {
        "level": 3,
        "marksman-lethality": 0.2100,
        "marksman-health": 0.2100,
        power: 100800,
        "skills": {
          "expedition": {
            "skill-name": "Trumpet of Justice",
            "description": "Rally Troop Health +5%",
            "rally_troops_health_up_percentage": 0.05
          }
        }
      },
      {
        "level": 4,
        "marksman-lethality": 0.2800,
        "marksman-health": 0.2800,
        power: 130200,
        "skills": {
          "expedition": {
            "skill-name": "Trumpet of Justice",
            "description": "Rally Troop Health +7.5%",
            "rally_troops_health_up_percentage": 0.075
          }
        }
      },
      {
        "level": 5,
        "marksman-lethality": 0.3500,
        "marksman-health": 0.3500,
        power: 159600,
        "skills": {
          "expedition": {
            "skill-name": "Trumpet of Justice",
            "description": "Rally Troop Health +7.5%",
            "rally_troops_health_up_percentage": 0.075
          }
        }
      },
      {
        "level": 6,
        "marksman-lethality": 0.4200,
        "marksman-health": 0.4200,
        power: 189000,
        "skills": {
          "expedition": {
            "skill-name": "Trumpet of Justice",
            "description": "Rally Troop Health +10%",
            "rally_troops_health_up_percentage": 0.10
          }
        }
      },
      {
        "level": 7,
        "marksman-lethality": 0.4900,
        "marksman-health": 0.4900,
        power: 218400,
        "skills": {
          "expedition": {
            "skill-name": "Trumpet of Justice",
            "description": "Rally Troop Health +10%",
            "rally_troops_health_up_percentage": 0.10
          }
        }
      },
      {
        "level": 8,
        "marksman-lethality": 0.5600,
        "marksman-health": 0.5600,
        power: 247800,
        "skills": {
          "expedition": {
            "skill-name": "Trumpet of Justice",
            "description": "Rally Troop Health +12.5%",
            "rally_troops_health_up_percentage": 0.125
          }
        }
      },
      {
        "level": 9,
        "marksman-lethality": 0.6300,
        "marksman-health": 0.6300,
        power: 277200,
        "skills": {
          "expedition": {
            "skill-name": "Trumpet of Justice",
            "description": "Rally Troop Health +12.5%",
            "rally_troops_health_up_percentage": 0.125
          }
        }
      },
      {
        "level": 10,
        "marksman-lethality": 0.7000,
        "marksman-health": 0.7000,
        power: 315000,
        "skills": {
          "expedition": {
            "skill-name": "Trumpet of Justice",
            "description": "Rally Troop Health +15%",
            "rally_troops_health_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const logan: Hero = {
  "hero-name": "Logan",
  "hero-class": "infantry",
  "generation": 3,
  "max-star-power": 1037700,
  "max-skill-power": 101520,
  "max-level-power": 279900,
  "base-stats": {
    "infantry-attack": 2.9023,
    "infantry-defense": 2.9023
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Lion's Might",
        "description": "Logan's mighty roar strikes fear into enemies, reducing all enemy Troops' Attack by [4% / 8% / 12% / 16% / 20%].",
        "enemy_attack_down_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20
        }
      },
      "2": {
        "skill-name": "Lion Intimidation",
        "description": "Logan intimidates his opponents with the ferocity of a lion, reducing damage taken by [4% / 8% / 12% / 16% / 20%] for all troops.",
        "all_troops_damage_taken_down_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20
        }
      },
      "3": {
        "skill-name": "Leader Inspiration",
        "description": "Logan inspires everyone with his inherent leadership qualities, increasing Health by [5% / 10% / 15% / 20% / 25%] for all troops.",
        "all_troops_health_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      }
    }
  },
  "exclusive-weapon": {
    name: "Fists of Steel",
    levels: [
      {
        "level": 1,
        "infantry-lethality": 0.0700,
        "infantry-health": 0.0700,
        power: 42000,
        "skills": {}
      },
      {
        "level": 2,
        "infantry-lethality": 0.1400,
        "infantry-health": 0.1400,
        power: 71400,
        "skills": {
          "expedition": {
            "skill-name": "Strong Protection",
            "description": "Defender Troop Defense +5%",
            "defender_troops_defense_up_percentage": 0.05
          }
        }
      },
      {
        "level": 3,
        "infantry-lethality": 0.2100,
        "infantry-health": 0.2100,
        power: 100800,
        "skills": {
          "expedition": {
            "skill-name": "Strong Protection",
            "description": "Defender Troop Defense +5%",
            "defender_troops_defense_up_percentage": 0.05
          }
        }
      },
      {
        "level": 4,
        "infantry-lethality": 0.2800,
        "infantry-health": 0.2800,
        power: 130200,
        "skills": {
          "expedition": {
            "skill-name": "Strong Protection",
            "description": "Defender Troop Defense +7.5%",
            "defender_troops_defense_up_percentage": 0.075
          }
        }
      },
      {
        "level": 5,
        "infantry-lethality": 0.3500,
        "infantry-health": 0.3500,
        power: 159600,
        "skills": {
          "expedition": {
            "skill-name": "Strong Protection",
            "description": "Defender Troop Defense +7.5%",
            "defender_troops_defense_up_percentage": 0.075
          }
        }
      },
      {
        "level": 6,
        "infantry-lethality": 0.4200,
        "infantry-health": 0.4200,
        power: 189000,
        "skills": {
          "expedition": {
            "skill-name": "Strong Protection",
            "description": "Defender Troop Defense +10%",
            "defender_troops_defense_up_percentage": 0.10
          }
        }
      },
      {
        "level": 7,
        "infantry-lethality": 0.4900,
        "infantry-health": 0.4900,
        power: 218400,
        "skills": {
          "expedition": {
            "skill-name": "Strong Protection",
            "description": "Defender Troop Defense +10%",
            "defender_troops_defense_up_percentage": 0.10
          }
        }
      },
      {
        "level": 8,
        "infantry-lethality": 0.5600,
        "infantry-health": 0.5600,
        power: 247800,
        "skills": {
          "expedition": {
            "skill-name": "Strong Protection",
            "description": "Defender Troop Defense +12.5%",
            "defender_troops_defense_up_percentage": 0.125
          }
        }
      },
      {
        "level": 9,
        "infantry-lethality": 0.6300,
        "infantry-health": 0.6300,
        power: 277200,
        "skills": {
          "expedition": {
            "skill-name": "Strong Protection",
            "description": "Defender Troop Defense +12.5%",
            "defender_troops_defense_up_percentage": 0.125
          }
        }
      },
      {
        "level": 10,
        "infantry-lethality": 0.7000,
        "infantry-health": 0.7000,
        power: 315000,
        "skills": {
          "expedition": {
            "skill-name": "Strong Protection",
            "description": "Defender Troop Defense +15%",
            "defender_troops_defense_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const mia: Hero = {
  "hero-name": "Mia",
  "hero-class": "lancer",
  "generation": 3,
  "max-star-power": 1037700,
  "max-skill-power": 101520,
  "max-level-power": 279900,
  "base-stats": {
    "lancer-attack": 2.9023,
    "lancer-defense": 2.9023
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Bad Luck Streak",
        "description": "Grants all troops' attack a 50% chance of cursing the target, increasing their damage taken by [10% / 20% / 30% / 40% / 50%].",
        "target_damage_taken_up_percentage": {
          "1": 0.10,
          "2": 0.20,
          "3": 0.30,
          "4": 0.40,
          "5": 0.50
        },
        "trigger_chance": 0.50
      },
      "2": {
        "skill-name": "Lucky Charm",
        "description": "Mia brings good luck to the Troops, granting a 50% chance of boosting troops' Attack by [10% / 20% / 30% / 40% / 50%].",
        "all_troops_attack_up_percentage": {
          "1": 0.10,
          "2": 0.20,
          "3": 0.30,
          "4": 0.40,
          "5": 0.50
        }
      },
      "3": {
        "skill-name": "Ritual Deciphering",
        "description": "Mia foresees potential dangers before battle, granting a 40% chance of reducing damage taken by [10% / 20% / 30% / 40% / 50%] for all troops.",
        "all_troops_damage_taken_down_percentage": {
          "1": 0.10,
          "2": 0.20,
          "3": 0.30,
          "4": 0.40,
          "5": 0.50
        }
      }
    }
  },
  "exclusive-weapon": {
    name: "Fate Crystal",
    levels: [
      {
        "level": 1,
        "lancer-lethality": 0.0700,
        "lancer-health": 0.0700,
        power: 42000,
        "skills": {}
      },
      {
        "level": 2,
        "lancer-lethality": 0.1400,
        "lancer-health": 0.1400,
        power: 71400,
        "skills": {
          "expedition": {
            "skill-name": "Rally of Fate",
            "description": "Rally Troop Attack +5%",
            "rally_troops_attack_up_percentage": 0.05
          }
        }
      },
      {
        "level": 3,
        "lancer-lethality": 0.2100,
        "lancer-health": 0.2100,
        power: 100800,
        "skills": {
          "expedition": {
            "skill-name": "Rally of Fate",
            "description": "Rally Troop Attack +5%",
            "rally_troops_attack_up_percentage": 0.05
          }
        }
      },
      {
        "level": 4,
        "lancer-lethality": 0.2800,
        "lancer-health": 0.2800,
        power: 130200,
        "skills": {
          "expedition": {
            "skill-name": "Rally of Fate",
            "description": "Rally Troop Attack +7.5%",
            "rally_troops_attack_up_percentage": 0.075
          }
        }
      },
      {
        "level": 5,
        "lancer-lethality": 0.3500,
        "lancer-health": 0.3500,
        power: 159600,
        "skills": {
          "expedition": {
            "skill-name": "Rally of Fate",
            "description": "Rally Troop Attack +7.5%",
            "rally_troops_attack_up_percentage": 0.075
          }
        }
      },
      {
        "level": 6,
        "lancer-lethality": 0.4200,
        "lancer-health": 0.4200,
        power: 189000,
        "skills": {
          "expedition": {
            "skill-name": "Rally of Fate",
            "description": "Rally Troop Attack +10%",
            "rally_troops_attack_up_percentage": 0.10
          }
        }
      },
      {
        "level": 7,
        "lancer-lethality": 0.4900,
        "lancer-health": 0.4900,
        power: 218400,
        "skills": {
          "expedition": {
            "skill-name": "Rally of Fate",
            "description": "Rally Troop Attack +10%",
            "rally_troops_attack_up_percentage": 0.10
          }
        }
      },
      {
        "level": 8,
        "lancer-lethality": 0.5600,
        "lancer-health": 0.5600,
        power: 247800,
        "skills": {
          "expedition": {
            "skill-name": "Rally of Fate",
            "description": "Rally Troop Attack +12.5%",
            "rally_troops_attack_up_percentage": 0.125
          }
        }
      },
      {
        "level": 9,
        "lancer-lethality": 0.6300,
        "lancer-health": 0.6300,
        power: 277200,
        "skills": {
          "expedition": {
            "skill-name": "Rally of Fate",
            "description": "Rally Troop Attack +12.5%",
            "rally_troops_attack_up_percentage": 0.125
          }
        }
      },
      {
        "level": 10,
        "lancer-lethality": 0.7000,
        "lancer-health": 0.7000,
        power: 315000,
        "skills": {
          "expedition": {
            "skill-name": "Rally of Fate",
            "description": "Rally Troop Attack +15%",
            "rally_troops_attack_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const ahmose: Hero = {
  "hero-name": "Ahmose",
  "hero-class": "infantry",
  "generation": 4,
  "max-star-power": 1279830,
  "max-skill-power": 101520,
  "max-level-power": 345210,
  "base-stats": {
    "infantry-attack": 3.7029,
    "infantry-defense": 3.7029,
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Viper Formation",
        "description":
          "Ahmose revives the lost art of ancient guardians. His Infantry pauses the attack once every four times, reducing damage taken by Lancers and Marksmen by [10% / 15% / 20% / 25% / 30%] and Infantry by [10% / 25% / 40% / 55% / 70%] for 2 turns.",
        "lancer_damage_taken_down_percentage": {
          "1": 0.1,
          "2": 0.15,
          "3": 0.2,
          "4": 0.25,
          "5": 0.3,
        },
        "marksman_damage_taken_down_percentage": {
          "1": 0.1,
          "2": 0.15,
          "3": 0.2,
          "4": 0.25,
          "5": 0.3,
        },
        "infantry_damage_taken_down_percentage": {
          "1": 0.1,
          "2": 0.25,
          "3": 0.4,
          "4": 0.55,
          "5": 0.7,
        },
        "duration_turns": 2,
        "trigger_every_n_strikes": 4,
      },
      "2": {
        "skill-name": "Prayer of Flame",
        "description":
          "Ahmose excels at raiding on fortified positions with well-coordinated Marksmen, increasing his Infantry's damage dealt by [100% / 125% / 150% / 175% / 200%] and Marksmen's damage dealt by [10% / 20% / 30% / 40% / 50%]. The effect decreases by 80% with each attack and is removed after the fifth.",
        "infantry_damage_up_percentage": {
          "1": 1.0,
          "2": 1.25,
          "3": 1.5,
          "4": 1.75,
          "5": 2.0,
        },
        "marksman_damage_up_percentage": {
          "1": 0.1,
          "2": 0.2,
          "3": 0.3,
          "4": 0.4,
          "5": 0.5,
        },
      },
      "3": {
        "skill-name": "Blade of Light",
        "description":
          "Ahmose infuses friendly Infantry's weapons with the essence of Fire Crystals, increasing his infantries' damage dealt per attack by [12% / 24% / 36% / 48% / 60%] and the target's damage taken by [5% / 10% / 15% / 20% / 25%] for 1 turn.",
        "infantry_damage_up_percentage": {
          "1": 0.12,
          "2": 0.24,
          "3": 0.36,
          "4": 0.48,
          "5": 0.6,
        },
        "target_damage_taken_up_percentage": {
          "1": 0.05,
          "2": 0.1,
          "3": 0.15,
          "4": 0.2,
          "5": 0.25,
        },
        "target_damage_taken_duration_turns": 1,
      },
    }
  },
  "exclusive-weapon": {
    name: "Guardian's Relic",
    levels: [
      {
        level: 1,
        "infantry-lethality": 0.0925,
        "infantry-health": 0.0925,
        power: 55000,
        skills: {
          expedition: {
            "skill-name": "Oath of Guardian",
            "description": "Defender Troop Health +0%",
            "defender_troops_health_up_percentage": 0,
          }
        }
      },
      {
        level: 2,
        "infantry-lethality": 0.185,
        "infantry-health": 0.185,
        power: 94350,
        skills: {
          expedition: {
            "skill-name": "Oath of Guardian",
            "description": "Defender Troop Health +5%",
            "defender_troops_health_up_percentage": 0.05,
          }
        }
      },
      {
        level: 3,
        "infantry-lethality": 0.2775,
        "infantry-health": 0.2775,
        power: 133200,
        skills: {
          expedition: {
            "skill-name": "Oath of Guardian",
            "description": "Defender Troop Health +5%",
            "defender_troops_health_up_percentage": 0.05,
          }
        }
      },
      {
        level: 4,
        "infantry-lethality": 0.37,
        "infantry-health": 0.37,
        power: 172050,
        skills: {
          expedition: {
            "skill-name": "Oath of Guardian",
            "description": "Defender Troop Health +7.5%",
            "defender_troops_health_up_percentage": 0.075,
          }
        }
      },
      {
        level: 5,
        "infantry-lethality": 0.4625,
        "infantry-health": 0.4625,
        power: 210900,
        skills: {
          expedition: {
            "skill-name": "Oath of Guardian",
            "description": "Defender Troop Health +7.5%",
            "defender_troops_health_up_percentage": 0.075,
          }
        }
      },
      {
        level: 6,
        "infantry-lethality": 0.555,
        "infantry-health": 0.555,
        power: 249750,
        skills: {
          expedition: {
            "skill-name": "Oath of Guardian",
            "description": "Defender Troop Health +10%",
            "defender_troops_health_up_percentage": 0.10,
          }
        }
      },
      {
        level: 7,
        "infantry-lethality": 0.6475,
        "infantry-health": 0.6475,
        power: 288600,
        skills: {
          expedition: {
            "skill-name": "Oath of Guardian",
            "description": "Defender Troop Health +10%",
            "defender_troops_health_up_percentage": 0.10,
          }
        }
      },
      {
        level: 8,
        "infantry-lethality": 0.74,
        "infantry-health": 0.74,
        power: 327450,
        skills: {
          expedition: {
            "skill-name": "Oath of Guardian",
            "description": "Defender Troop Health +12.5%",
            "defender_troops_health_up_percentage": 0.125,
          }
        }
      },
      {
        level: 9,
        "infantry-lethality": 0.8325,
        "infantry-health": 0.8325,
        power: 366300,
        skills: {
          expedition: {
            "skill-name": "Oath of Guardian",
            "description": "Defender Troop Health +12.5%",
            "defender_troops_health_up_percentage": 0.125,
          }
        }
      },
      {
        level: 10,
        "infantry-lethality": 0.925,
        "infantry-health": 0.925,
        power: 416250,
        skills: {
          expedition: {
            "skill-name": "Oath of Guardian",
            "description": "Defender Troop Health +15%",
            "defender_troops_health_up_percentage": 0.15,
          }
        }
      },
    ]
  }
};

export const lynn: Hero = {
  "hero-name": "Lynn",
  "hero-class": "marksman",
  "generation": 4,
  "max-star-power": 1279830,
  "max-skill-power": 101520,
  "max-level-power": 345210,
  "base-stats": {
    "marksman-attack": 3.7029,
    "marksman-defense": 3.7029,
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Song of Lion",
        "description":
          "Lynn uplifts our troops with an enthusiastic rhythm, granting a 40% chance of increasing damage dealt by [10% / 20% / 30% / 40% / 50%] for all troops.",
        "all_troops_damage_up_percentage": {
          "1": 0.10,
          "2": 0.20,
          "3": 0.30,
          "4": 0.40,
          "5": 0.50,
        },
        "trigger_chance": 0.40,
      },
      "2": {
        "skill-name": "Melancholic Ballad",
        "description":
          "Lynn demoralizes the enemies with a somber tune, reducing damage dealt by [4% / 8% / 12% / 16% / 20%] for all enemy troops.",
        "enemy_damage_down_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20,
        },
      },
      "3": {
        "skill-name": "Oonai Cadenza",
        "description":
          "Lynn harnesses the power of music to elevate troops morale, increasing her Marksmen's attack by [1% / 2% / 3% / 4% / 5%] for every 3 attacks. Stackable and lasts until the end of the battle.",
        "marksman_damage_up_percentage": {
          "1": 0.01,
          "2": 0.02,
          "3": 0.03,
          "4": 0.04,
          "5": 0.05,
        },
        "trigger_every_n_strikes": 3,
      },
    },
  },
  "exclusive-weapon": {
    name: "Ella's Tear",
    levels: [
      {
        level: 1,
        "marksman-lethality": 0.0925,
        "marksman-health": 0.0925,
        power: 55000,
        skills: {
          expedition: {
            "skill-name": "Iranon's Determination",
            "description": "Defender Troop Lethality +5%",
            "defender_troops_damage_up_percentage": 0.05,
          }
        }
      },
      {
        level: 2,
        "marksman-lethality": 0.185,
        "marksman-health": 0.185,
        power: 94350,
        skills: {
          expedition: {
            "skill-name": "Iranon's Determination",
            "description": "Defender Troop Lethality +5%",
            "defender_troops_damage_up_percentage": 0.05,
          }
        }
      },
      {
        level: 3,
        "marksman-lethality": 0.2775,
        "marksman-health": 0.2775,
        power: 133200,
        skills: {
          expedition: {
            "skill-name": "Iranon's Determination",
            "description": "Defender Troop Lethality +5%",
            "defender_troops_damage_up_percentage": 0.05,
          }
        }
      },
      {
        level: 4,
        "marksman-lethality": 0.37,
        "marksman-health": 0.37,
        power: 172050,
        skills: {
          expedition: {
            "skill-name": "Iranon's Determination",
            "description": "Defender Troop Lethality +7.5%",
            "defender_troops_damage_up_percentage": 0.075,
          }
        }
      },
      {
        level: 5,
        "marksman-lethality": 0.4625,
        "marksman-health": 0.4625,
        power: 210900,
        skills: {
          expedition: {
            "skill-name": "Iranon's Determination",
            "description": "Defender Troop Lethality +7.5%",
            "defender_troops_damage_up_percentage": 0.075,
          }
        }
      },
      {
        level: 6,
        "marksman-lethality": 0.555,
        "marksman-health": 0.555,
        power: 249750,
        skills: {
          expedition: {
            "skill-name": "Iranon's Determination",
            "description": "Defender Troop Lethality +10%",
            "defender_troops_damage_up_percentage": 0.10,
          }
        }
      },
      {
        level: 7,
        "marksman-lethality": 0.6475,
        "marksman-health": 0.6475,
        power: 288600,
        skills: {
          expedition: {
            "skill-name": "Iranon's Determination",
            "description": "Defender Troop Lethality +10%",
            "defender_troops_damage_up_percentage": 0.10,
          }
        }
      },
      {
        level: 8,
        "marksman-lethality": 0.74,
        "marksman-health": 0.74,
        power: 327450,
        skills: {
          expedition: {
            "skill-name": "Iranon's Determination",
            "description": "Defender Troop Lethality +12.5%",
            "defender_troops_damage_up_percentage": 0.125,
          }
        }
      },
      {
        level: 9,
        "marksman-lethality": 0.8325,
        "marksman-health": 0.8325,
        power: 366300,
        skills: {
          expedition: {
            "skill-name": "Iranon's Determination",
            "description": "Defender Troop Lethality +12.5%",
            "defender_troops_damage_up_percentage": 0.125,
          }
        }
      },
      {
        level: 10,
        "marksman-lethality": 0.925,
        "marksman-health": 0.925,
        power: 416250,
        skills: {
          expedition: {
            "skill-name": "Iranon's Determination",
            "description": "Defender Troop Lethality +15%",
            "defender_troops_damage_up_percentage": 0.15,
          }
        }
      },
    ]
  }
};

export const reina: Hero = {
  "hero-name": "Reina",
  "hero-class": "lancer",
  "generation": 4,
  "max-star-power": 1279830,
  "max-skill-power": 101520,
  "max-level-power": 345210,
  "base-stats": {
    "lancer-attack": 3.7029,
    "lancer-defense": 3.7029,
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Assassin's Instinct",
        "description":
          "Reina targets enemy weak spots, increasing normal attack damage by [10% / 15% / 20% / 25% / 30%] for all troops.",
        "all_troops_attack_up_percentage": {
          "1": 0.10,
          "2": 0.15,
          "3": 0.20,
          "4": 0.25,
          "5": 0.30,
        },
      },
      "2": {
        "skill-name": "Swift Jive",
        "description":
          "Reina's adept leadership grants all troops a [4% / 8% / 12% / 16% / 20%] chance of dodging normal attacks.",
        "all_troops_dodge_rate_up_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20,
        },
      },
      "3": {
        "skill-name": "Shadow Blade",
        "description":
          "With Reina's clever tactics, her Lancers have a 25% chance of performing an extra attack, dealing [120% / 140% / 160% / 180% / 200%] damage.",
        "lancers_damage_up_percentage": {
          "1": 1.20,
          "2": 1.40,
          "3": 1.60,
          "4": 1.80,
          "5": 2.00,
        },
        "trigger_chance": 0.25,
      },
    },
  },
  "exclusive-weapon": {
    name: "Raikiri",
    levels: [
      {
        level: 1,
        "lancer-lethality": 0.0925,
        "lancer-health": 0.0925,
        power: 55000,
      },
      {
        level: 2,
        "lancer-lethality": 0.185,
        "lancer-health": 0.185,
        power: 94350,
        skills: {
          expedition: {
            "skill-name": "Fiery Invasion",
            "description": "Rally Troop Lethality +5%",
            "rally_troops_damage_up_percentage": 0.05,
          }
        }
      },
      {
        level: 3,
        "lancer-lethality": 0.2775,
        "lancer-health": 0.2775,
        power: 133200,
        skills: {
          expedition: {
            "skill-name": "Fiery Invasion",
            "description": "Rally Troop Lethality +5%",
            "rally_troops_damage_up_percentage": 0.05,
          }
        }
      },
      {
        level: 4,
        "lancer-lethality": 0.37,
        "lancer-health": 0.37,
        power: 172050,
        skills: {
          expedition: {
            "skill-name": "Fiery Invasion",
            "description": "Rally Troop Lethality +7.5%",
            "rally_troops_damage_up_percentage": 0.075,
          }
        }
      },
      {
        level: 5,
        "lancer-lethality": 0.4625,
        "lancer-health": 0.4625,
        power: 210900,
        skills: {
          expedition: {
            "skill-name": "Fiery Invasion",
            "description": "Rally Troop Lethality +7.5%",
            "rally_troops_damage_up_percentage": 0.075,
          }
        }
      },
      {
        level: 6,
        "lancer-lethality": 0.555,
        "lancer-health": 0.555,
        power: 249750,
        skills: {
          expedition: {
            "skill-name": "Fiery Invasion",
            "description": "Rally Troop Lethality +10%",
            "rally_troops_damage_up_percentage": 0.10,
          }
        }
      },
      {
        level: 7,
        "lancer-lethality": 0.6475,
        "lancer-health": 0.6475,
        power: 288600,
        skills: {
          expedition: {
            "skill-name": "Fiery Invasion",
            "description": "Rally Troop Lethality +10%",
            "rally_troops_damage_up_percentage": 0.10,
          }
        }
      },
      {
        level: 8,
        "lancer-lethality": 0.74,
        "lancer-health": 0.74,
        power: 327450,
        skills: {
          expedition: {
            "skill-name": "Fiery Invasion",
            "description": "Rally Troop Lethality +12.5%",
            "rally_troops_damage_up_percentage": 0.125,
          }
        }
      },
      {
        level: 9,
        "lancer-lethality": 0.8325,
        "lancer-health": 0.8325,
        power: 366300,
        skills: {
          expedition: {
            "skill-name": "Fiery Invasion",
            "description": "Rally Troop Lethality +12.5%",
            "rally_troops_damage_up_percentage": 0.125,
          }
        }
      },
      {
        level: 10,
        "lancer-lethality": 0.925,
        "lancer-health": 0.925,
        power: 416250,
        skills: {
          expedition: {
            "skill-name": "Fiery Invasion",
            "description": "Rally Troop Lethality +15%",
            "rally_troops_damage_up_percentage": 0.15,
          }
        }
      },
    ]
  }
};

export const gwen: Hero = {
  "hero-name": "Gwen",
  "hero-class": "marksman",
  "generation": 5,
  "max-star-power": 1535796,
  "max-skill-power": 101520,
  "max-level-power": 414252,
  "base-stats": {
    "marksman-attack": 4.4435,
    "marksman-defense": 4.4435
  },
  "skills": {
    "expedition": {
      "1": {
        "skill-name": "Eagle Vision",
        "description": "Gwen provides unfettered vision of enemy weakpoints during flights, increasing target's Damage Taken by [5% / 10% / 15% / 20% / 25%].",
        "target_damage_taken_up_percentage": {
          "1": 0.05,
          "2": 0.1,
          "3": 0.15,
          "4": 0.2,
          "5": 0.25
        }
      },
      "2": {
        "skill-name": "Air Dominance",
        "description": "Gwen dominates the skies, granting all troops' attack [20% / 40% / 60% / 80% / 100%] extra damage after every 5 attacks, and causes the target to receive [5% / 7.5% / 10% / 12.5% / 15%] extra damage for its next attack received.",
        "all_troops_extra_damage_up_percentage": {
          "1": 0.2,
          "2": 0.4,
          "3": 0.6,
          "4": 0.8,
          "5": 1.0
        },
        "trigger_every_n_strikes": 5,
        "target_damage_taken_up_percentage": {
          "1": 0.05,
          "2": 0.075,
          "3": 0.10,
          "4": 0.125,
          "5": 0.15
        }
      },
      "3": {
        "skill-name": "Blastmaster",
        "description": "Gwen equips her marksmen with grenades, dealing [10% / 20% / 30% / 40% / 50%] extra damage to all enemies on the next attack of every 4 attacks.",
        "marksman_damage_up_percentage": {
          "1": 0.1,
          "2": 0.2,
          "3": 0.3,
          "4": 0.4,
          "5": 0.5
        },
        "trigger_every_n_strikes": 4
      }
    }
  },
  "exclusive-weapon": {
    name: "Wings of Hope",
    levels: [
      {
        level: 1,
        "marksman-lethality": 0.111,
        "marksman-health": 0.111,
        power: 66600,
        skills: {
          expedition: null
        }
      },
      {
        level: 2,
        "marksman-lethality": 0.222,
        "marksman-health": 0.222,
        power: 113220,
        skills: {
          expedition: {
            "skill-name": "Marauder",
            "description": "Gwen uses her expertise in offensive tactics, boosting Rally Troops Lethality by 5%.",
            "rally_troops_damage_up_percentage": 0.05
          }
        }
      },
      {
        level: 3,
        "marksman-lethality": 0.333,
        "marksman-health": 0.333,
        power: 159840,
        skills: {
          expedition: {
            "skill-name": "Marauder",
            "description": "Gwen uses her expertise in offensive tactics, boosting Rally Troops Lethality by 5%.",
            "rally_troops_damage_up_percentage": 0.05
          }
        }
      },
      {
        level: 4,
        "marksman-lethality": 0.444,
        "marksman-health": 0.444,
        power: 206460,
        skills: {
          expedition: {
            "skill-name": "Marauder",
            "description": "Gwen uses her expertise in offensive tactics, boosting Rally Troops Lethality by 7.5%.",
            "rally_troops_damage_up_percentage": 0.075
          }
        }
      },
      {
        level: 5,
        "marksman-lethality": 0.555,
        "marksman-health": 0.555,
        power: 253080,
        skills: {
          expedition: {
            "skill-name": "Marauder",
            "description": "Gwen uses her expertise in offensive tactics, boosting Rally Troops Lethality by 7.5%.",
            "rally_troops_damage_up_percentage": 0.075
          }
        }
      },
      {
        level: 6,
        "marksman-lethality": 0.666,
        "marksman-health": 0.666,
        power: 299700,
        skills: {
          expedition: {
            "skill-name": "Marauder",
            "description": "Gwen uses her expertise in offensive tactics, boosting Rally Troops Lethality by 10%.",
            "rally_troops_damage_up_percentage": 0.1
          }
        }
      },
      {
        level: 7,
        "marksman-lethality": 0.777,
        "marksman-health": 0.777,
        power: 346320,
        skills: {
          expedition: {
            "skill-name": "Marauder",
            "description": "Gwen uses her expertise in offensive tactics, boosting Rally Troops Lethality by 10%.",
            "rally_troops_damage_up_percentage": 0.1
          }
        }
      },
      {
        level: 8,
        "marksman-lethality": 0.888,
        "marksman-health": 0.888,
        power: 392940,
        skills: {
          expedition: {
            "skill-name": "Marauder",
            "description": "Gwen uses her expertise in offensive tactics, boosting Rally Troops Lethality by 12.5%.",
            "rally_troops_damage_up_percentage": 0.125
          }
        }
      },
      {
        level: 9,
        "marksman-lethality": 0.999,
        "marksman-health": 0.999,
        power: 439560,
        skills: {
          expedition: {
            "skill-name": "Marauder",
            "description": "Gwen uses her expertise in offensive tactics, boosting Rally Troops Lethality by 12.5%.",
            "rally_troops_damage_up_percentage": 0.125
          }
        }
      },
      {
        level: 10,
        "marksman-lethality": 1.11,
        "marksman-health": 1.11,
        power: 499500,
        skills: {
          expedition: {
            "skill-name": "Marauder",
            "description": "Gwen uses her expertise in offensive tactics, boosting Rally Troops Lethality by 15%.",
            "rally_troops_damage_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const hector: Hero = {
  "hero-name": "Hector",
  "hero-class": "infantry",
  "generation": 5,
  "max-star-power": 1535796,
  "max-skill-power": 101520,
  "max-level-power": 414252,
  "base-stats": {
    "infantry-attack": 4.4435,
    "infantry-defense": 4.4435
  },
  "skills": {
    "expedition": {
      "1": {
        "skill-name": "Survival Instincts",
        "description": "A seasoned warrior with an uncanny knack for reading the battlefield, Hector's presence has a 40% chance of reducing damage taken by [10% / 20% / 30% / 40% / 50%] for all troops.",
        "all_troops_damage_taken_down_percentage": {
          "1": 0.10,
          "2": 0.20,
          "3": 0.30,
          "4": 0.40,
          "5": 0.50
        },
        "trigger_chance": 0.40
      },
      "2": {
        "skill-name": "Rampant",
        "description": "Hector's rampant energy surges through his troops, increasing Infantry's Damage Dealt by [100% / 125% / 150% / 175% / 200%] and Marksmen's Damage Dealt by [20% / 40% / 60% / 80% / 100%], effective for 10 attacks with each attack damage boost being 85% of the previous one.",
        "infantry_damage_up_percentage": {
          "1": 1.00,
          "2": 1.25,
          "3": 1.50,
          "4": 1.75,
          "5": 2.00
        },
        "marksman_damage_up_percentage": {
          "1": 0.20,
          "2": 0.40,
          "3": 0.60,
          "4": 0.80,
          "5": 1.00
        },
        "attack_limit": 10,
        "decay_rate": 0.85
      },
      "3": {
        "skill-name": "Blitz",
        "description": "Hector has mastered the offensive strategy, granting all troops' attack a 25% chance of dealing [120% / 140% / 160% / 180% / 200%] damage.",
        "all_troops_damage_up_percentage": {
          "1": 1.20,
          "2": 1.40,
          "3": 1.60,
          "4": 1.80,
          "5": 2.00
        },
        "trigger_chance": 0.25
      }
    }
  },
  "exclusive-weapon": {
    name: "Steel Fangs",
    levels: [
      {
        level: 1,
        "infantry-lethality": 0.1110,
        "infantry-health": 0.1110,
        power: 66600,
        skills: {
          expedition: {
            "skill-name": "Goliath",
            "description": "Hector excels at using terrain against attackers, increasing Defender Troops Attack by 0%.",
            "defender_troops_attack_up_percentage": 0
          }
        }
      },
      {
        level: 2,
        "infantry-lethality": 0.2220,
        "infantry-health": 0.2220,
        power: 113220,
        skills: {
          expedition: {
            "skill-name": "Goliath",
            "description": "Hector excels at using terrain against attackers, increasing Defender Troops Attack by 5%.",
            "defender_troops_attack_up_percentage": 0.05
          }
        }
      },
      {
        level: 3,
        "infantry-lethality": 0.3330,
        "infantry-health": 0.3330,
        power: 159840,
        skills: {
          expedition: {
            "skill-name": "Goliath",
            "description": "Hector excels at using terrain against attackers, increasing Defender Troops Attack by 5%.",
            "defender_troops_attack_up_percentage": 0.05
          }
        }
      },
      {
        level: 4,
        "infantry-lethality": 0.4440,
        "infantry-health": 0.4440,
        power: 206460,
        skills: {
          expedition: {
            "skill-name": "Goliath",
            "description": "Hector excels at using terrain against attackers, increasing Defender Troops Attack by 7.5%.",
            "defender_troops_attack_up_percentage": 0.075
          }
        }
      },
      {
        level: 5,
        "infantry-lethality": 0.5550,
        "infantry-health": 0.5550,
        power: 253080,
        skills: {
          expedition: {
            "skill-name": "Goliath",
            "description": "Hector excels at using terrain against attackers, increasing Defender Troops Attack by 7.5%.",
            "defender_troops_attack_up_percentage": 0.075
          }
        }
      },
      {
        level: 6,
        "infantry-lethality": 0.6660,
        "infantry-health": 0.6660,
        power: 299700,
        skills: {
          expedition: {
            "skill-name": "Goliath",
            "description": "Hector excels at using terrain against attackers, increasing Defender Troops Attack by 10%.",
            "defender_troops_attack_up_percentage": 0.10
          }
        }
      },
      {
        level: 7,
        "infantry-lethality": 0.7770,
        "infantry-health": 0.7770,
        power: 346320,
        skills: {
          expedition: {
            "skill-name": "Goliath",
            "description": "Hector excels at using terrain against attackers, increasing Defender Troops Attack by 10%.",
            "defender_troops_attack_up_percentage": 0.10
          }
        }
      },
      {
        level: 8,
        "infantry-lethality": 0.8880,
        "infantry-health": 0.8880,
        power: 392940,
        skills: {
          expedition: {
            "skill-name": "Goliath",
            "description": "Hector excels at using terrain against attackers, increasing Defender Troops Attack by 12.5%.",
            "defender_troops_attack_up_percentage": 0.125
          }
        }
      },
      {
        level: 9,
        "infantry-lethality": 0.9990,
        "infantry-health": 0.9990,
        power: 439560,
        skills: {
          expedition: {
            "skill-name": "Goliath",
            "description": "Hector excels at using terrain against attackers, increasing Defender Troops Attack by 12.5%.",
            "defender_troops_attack_up_percentage": 0.125
          }
        }
      },
      {
        level: 10,
        "infantry-lethality": 1.1100,
        "infantry-health": 1.1100,
        power: 499500,
        skills: {
          expedition: {
            "skill-name": "Goliath",
            "description": "Hector excels at using terrain against attackers, increasing Defender Troops Attack by 15%.",
            "defender_troops_attack_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const norah: Hero = {
  "hero-name": "Norah",
  "hero-class": "lancer",
  "generation": 5,
  "max-star-power": 1535796,
  "max-skill-power": 101520,
  "max-level-power": 414252,
  "base-stats": {
    "lancer-attack": 4.4435,
    "lancer-defense": 4.4435,
  },
  "skills": {
    "expedition": {
      "1": {
        "skill-name": "Combined Arms",
        "description": "Norah is well trained in combined arms tactics, decreasing Damage Taken by [3% / 6% / 9% / 12% / 15%] and boosting Damage Dealt by [3% / 6% / 9% / 12% / 15%] for Infantry and Marksman.",
        "infantry_damage_taken_down_percentage": {
          "1": 0.03,
          "2": 0.06,
          "3": 0.09,
          "4": 0.12,
          "5": 0.15
        },
        "marksman_damage_taken_down_percentage": {
          "1": 0.03,
          "2": 0.06,
          "3": 0.09,
          "4": 0.12,
          "5": 0.15
        },
        "infantry_damage_up_percentage": {
          "1": 0.03,
          "2": 0.06,
          "3": 0.09,
          "4": 0.12,
          "5": 0.15
        },
        "marksman_damage_up_percentage": {
          "1": 0.03,
          "2": 0.06,
          "3": 0.09,
          "4": 0.12,
          "5": 0.15
        }
      },
      "2": {
        "skill-name": "Sneak Strike",
        "description": "Norah has an eye for weaknesses, granting her Lancers a 20% chance of dealing [20% / 40% / 60% / 80% / 100%] extra damage to all enemies on attack.",
        "lancers_damage_up_percentage": {
          "1": 0.20,
          "2": 0.40,
          "3": 0.60,
          "4": 0.80,
          "5": 1.00
        },
        "trigger_chance": 0.20
      },
      "3": {
        "skill-name": "Momentum",
        "description": "Norah motivates our troops, increasing all troops' damage dealt by [5% / 10% / 15% / 20% / 25%] and reducing their damage taken by [5% / 10% / 15% / 20% / 25%] every 5 attacks made by lancers for 2 turns.",
        "all_troops_damage_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        },
        "all_troops_damage_taken_down_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        },
        "trigger_every_n_strikes": 5,
        "duration_turns": 2
      }
    }
  },
  "exclusive-weapon": {
    name: "Snow Cruiser",
    levels: [
      {
        level: 1,
        "lancer-lethality": 0.1110,
        "lancer-health": 0.1110,
        power: 66600,
        skills: {
          expedition: {
            "skill-name": "True Grit",
            "description": "Norah inspires others with her courage under fire, boosting Defender Troops Defense by 0%.",
            "defender_troops_defense_up_percentage": 0.00
          }
        }
      },
      {
        level: 2,
        "lancer-lethality": 0.2220,
        "lancer-health": 0.2220,
        power: 113220,
        skills: {
          expedition: {
            "skill-name": "True Grit",
            "description": "Norah inspires others with her courage under fire, boosting Defender Troops Defense by 5%.",
            "defender_troops_defense_up_percentage": 0.05
          }
        }
      },
      {
        level: 3,
        "lancer-lethality": 0.3330,
        "lancer-health": 0.3330,
        power: 159840,
        skills: {
          expedition: {
            "skill-name": "True Grit",
            "description": "Norah inspires others with her courage under fire, boosting Defender Troops Defense by 5%.",
            "defender_troops_defense_up_percentage": 0.05
          }
        }
      },
      {
        level: 4,
        "lancer-lethality": 0.4440,
        "lancer-health": 0.4440,
        power: 206460,
        skills: {
          expedition: {
            "skill-name": "True Grit",
            "description": "Norah inspires others with her courage under fire, boosting Defender Troops Defense by 7.5%.",
            "defender_troops_defense_up_percentage": 0.075
          }
        }
      },
      {
        level: 5,
        "lancer-lethality": 0.5550,
        "lancer-health": 0.5550,
        power: 253080,
        skills: {
          expedition: {
            "skill-name": "True Grit",
            "description": "Norah inspires others with her courage under fire, boosting Defender Troops Defense by 7.5%.",
            "defender_troops_defense_up_percentage": 0.075
          }
        }
      },
      {
        level: 6,
        "lancer-lethality": 0.6660,
        "lancer-health": 0.6660,
        power: 299700,
        skills: {
          expedition: {
            "skill-name": "True Grit",
            "description": "Norah inspires others with her courage under fire, boosting Defender Troops Defense by 10%.",
            "defender_troops_defense_up_percentage": 0.10
          }
        }
      },
      {
        level: 7,
        "lancer-lethality": 0.7770,
        "lancer-health": 0.7770,
        power: 346320,
        skills: {
          expedition: {
            "skill-name": "True Grit",
            "description": "Norah inspires others with her courage under fire, boosting Defender Troops Defense by 10%.",
            "defender_troops_defense_up_percentage": 0.10
          }
        }
      },
      {
        level: 8,
        "lancer-lethality": 0.8880,
        "lancer-health": 0.8880,
        power: 392940,
        skills: {
          expedition: {
            "skill-name": "True Grit",
            "description": "Norah inspires others with her courage under fire, boosting Defender Troops Defense by 12.5%.",
            "defender_troops_defense_up_percentage": 0.125
          }
        }
      },
      {
        level: 9,
        "lancer-lethality": 0.9990,
        "lancer-health": 0.9990,
        power: 439560,
        skills: {
          expedition: {
            "skill-name": "True Grit",
            "description": "Norah inspires others with her courage under fire, boosting Defender Troops Defense by 12.5%.",
            "defender_troops_defense_up_percentage": 0.125
          }
        }
      },
      {
        level: 10,
        "lancer-lethality": 1.1100,
        "lancer-health": 1.1100,
        power: 499500,
        skills: {
          expedition: {
            "skill-name": "True Grit",
            "description": "Norah inspires others with her courage under fire, boosting Defender Troops Defense by 15%.",
            "defender_troops_defense_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const renee: Hero = {
  "hero-name": "Renee",
  "hero-class": "lancer",
  "generation": 6,
  "max-star-power": 1847106,
  "max-skill-power": 101520,
  "max-level-power": 498222,
  "base-stats": {
    "lancer-attack": 5.4043,
    "lancer-defense": 5.4043
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Nightmare Trace",
        "description":
          "Renee always fights in unbelievable ways. Her Lancers can place Dream Marks on their targets every two turns, dealing [40% / 80% / 120% / 160% / 200%] extra Lancer damage once next turn. The Dream Marks last for 1 turn.",
        "lancer_damage_up_percentage": {
          "1": 0.40,
          "2": 0.80,
          "3": 1.20,
          "4": 1.60,
          "5": 2.00
        },
        "duration_turns": 1,
        "trigger_every_n_turns": 2
      },
      "2": {
        "skill-name": "Dreamcatcher",
        "description":
          "Renee's Dream Marks highlight enemy vulnerabilities, increasing her Lancers' damage dealt to marked targets by [30% / 60% / 90% / 120% / 150%].",
        "lancer_damage_up_percentage": {
          "1": 0.30,
          "2": 0.60,
          "3": 0.90,
          "4": 1.20,
          "5": 1.50
        }
      },
      "3": {
        "skill-name": "Dreamslice",
        "description":
          "Renee's Dream Marks expose enemy weaknesses, increasing damage dealt to marked targets by [15% / 20% / 45% / 60% / 75%] for all troops.",
        "all_troops_extra_damage_up_percentage": {
          "1": 0.15,
          "2": 0.20,
          "3": 0.45,
          "4": 0.60,
          "5": 0.75
        }
      }
    }
  },
  "exclusive-weapon": {
    name: "Illusion Magiball",
    levels: [
      {
        "level": 1,
        "lancer-lethality": 0.1335,
        "lancer-health": 0.1335,
        power: 80100,
        "skills": {}
      },
      {
        "level": 2,
        "lancer-lethality": 0.2670,
        "lancer-health": 0.2670,
        power: 136170,
        "skills": {
          "expedition": {
            "skill-name": "Wistful Enhancement",
            "description": "Renee boosts morale with her extraordinary talents, increasing Rally Troops' Lethality by 5%.",
            "rally_troops_damage_up_percentage": 0.05
          }
        }
      },
      {
        "level": 3,
        "lancer-lethality": 0.4005,
        "lancer-health": 0.4005,
        power: 192240,
        "skills": {
          "expedition": {
            "skill-name": "Wistful Enhancement",
            "description": "Renee boosts morale with her extraordinary talents, increasing Rally Troops' Lethality by 5%.",
            "rally_troops_damage_up_percentage": 0.05
          }
        }
      },
      {
        "level": 4,
        "lancer-lethality": 0.5340,
        "lancer-health": 0.5340,
        power: 248310,
        "skills": {
          "expedition": {
            "skill-name": "Wistful Enhancement",
            "description": "Renee boosts morale with her extraordinary talents, increasing Rally Troops' Lethality by 7.5%.",
            "rally_troops_damage_up_percentage": 0.075
          }
        }
      },
      {
        "level": 5,
        "lancer-lethality": 0.6675,
        "lancer-health": 0.6675,
        power: 304380,
        "skills": {
          "expedition": {
            "skill-name": "Wistful Enhancement",
            "description": "Renee boosts morale with her extraordinary talents, increasing Rally Troops' Lethality by 7.5%.",
            "rally_troops_damage_up_percentage": 0.075
          }
        }
      },
      {
        "level": 6,
        "lancer-lethality": 0.8010,
        "lancer-health": 0.8010,
        power: 360450,
        "skills": {
          "expedition": {
            "skill-name": "Wistful Enhancement",
            "description": "Renee boosts morale with her extraordinary talents, increasing Rally Troops' Lethality by 10%.",
            "rally_troops_damage_up_percentage": 0.10
          }
        }
      },
      {
        "level": 7,
        "lancer-lethality": 0.9345,
        "lancer-health": 0.9345,
        power: 416520,
        "skills": {
          "expedition": {
            "skill-name": "Wistful Enhancement",
            "description": "Renee boosts morale with her extraordinary talents, increasing Rally Troops' Lethality by 10%.",
            "rally_troops_damage_up_percentage": 0.10
          }
        }
      },
      {
        "level": 8,
        "lancer-lethality": 0.10680,
        "lancer-health": 0.10680,
        power: 472590,
        "skills": {
          "expedition": {
            "skill-name": "Wistful Enhancement",
            "description": "Renee boosts morale with her extraordinary talents, increasing Rally Troops' Lethality by 12.5%.",
            "rally_troops_damage_up_percentage": 0.125
          }
        }
      },
      {
        "level": 9,
        "lancer-lethality": 0.12015,
        "lancer-health": 0.12015,
        power: 528660,
        "skills": {
          "expedition": {
            "skill-name": "Wistful Enhancement",
            "description": "Renee boosts morale with her extraordinary talents, increasing Rally Troops' Lethality by 12.5%.",
            "rally_troops_damage_up_percentage": 0.125
          }
        }
      },
      {
        "level": 10,
        "lancer-lethality": 0.13350,
        "lancer-health": 0.13350,
        power: 600750,
        "skills": {
          "expedition": {
            "skill-name": "Wistful Enhancement",
            "description": "Renee boosts morale with her extraordinary talents, increasing Rally Troops' Lethality by 15%.",
            "rally_troops_damage_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const wayne: Hero = {
  "hero-name": "Wayne",
  "hero-class": "marksman",
  "generation": 6,
  "max-star-power": 1847106,
  "max-skill-power": 101520,
  "max-level-power": 498222,
  "base-stats": {
    "marksman-attack": 5.4043,
    "marksman-defense": 5.4043
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Thunder Strike",
        "description": "Wayne's brilliant battle planning allows all troops to launch an extra attack every 4 turns, dealing [20% / 40% / 60% / 80% / 100%] damage.",
        "all_troops_extra_damage_up_percentage": {
          "1": 0.20,
          "2": 0.40,
          "3": 0.60,
          "4": 0.80,
          "5": 1.00
        }
      },
      "2": {
        "skill-name": "Roundabout Hit",
        "description": "Wayne's stratagems can pierce the thickest of defenses. On every other attack, his Marksmen deal [8% / 16%/ 24% / 32% / 40%] extra damage to enemy Lancers and [4% / 8% / 12% / 16% / 20%] extra damage to enemy Marksmen.",
        "lancer_damage_up_percentage": {
          "1": 0.08,
          "2": 0.16,
          "3": 0.24,
          "4": 0.32,
          "5": 0.40
        },
        "marksman_damage_up_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20
        }
      },
      "3": {
        "skill-name": "Fleet",
        "description": "Wayne ensures no misstep goes unpunished with an eagle's eye for weakness, granting all troops' attacks a [5% / 10% / 15% / 20% / 25%] Crit Rate.",
        "crit_rate_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      }
    }
  },
  "exclusive-weapon": {
    name: "Power Boomerang",
    levels: [
      {
        "level": 1,
        "marksman-lethality": 0.1335,
        "marksman-health": 0.1335,
        power: 80100,
        "skills": {}
      },
      {
        "level": 2,
        "marksman-lethality": 0.2670,
        "marksman-health": 0.2670,
        power: 136170,
        "skills": {
          "expedition": {
            "skill-name": "Offensive Defense",
            "description": "Wayne's strategic brilliance increases Defender Troops' Lethality by 5%.",
            "defender_troops_damage_up_percentage": 0.05
          }
        }
      },
      {
        "level": 3,
        "marksman-lethality": 0.4005,
        "marksman-health": 0.4005,
        power: 192240,
        "skills": {
          "expedition": {
            "skill-name": "Offensive Defense",
            "description": "Wayne's strategic brilliance increases Defender Troops' Lethality by 5%.",
            "defender_troops_damage_up_percentage": 0.05
          }
        }
      },
      {
        "level": 4,
        "marksman-lethality": 0.5340,
        "marksman-health": 0.5340,
        power: 248310,
        "skills": {
          "expedition": {
            "skill-name": "Offensive Defense",
            "description": "Wayne's strategic brilliance increases Defender Troops' Lethality by 7.5%.",
            "defender_troops_damage_up_percentage": 0.075
          }
        }
      },
      {
        "level": 5,
        "marksman-lethality": 0.6675,
        "marksman-health": 0.6675,
        power: 304380,
        "skills": {
          "expedition": {
            "skill-name": "Offensive Defense",
            "description": "Wayne's strategic brilliance increases Defender Troops' Lethality by 7.5%.",
            "defender_troops_damage_up_percentage": 0.075
          }
        }
      },
      {
        "level": 6,
        "marksman-lethality": 0.8010,
        "marksman-health": 0.8010,
        power: 360450,
        "skills": {
          "expedition": {
            "skill-name": "Offensive Defense",
            "description": "Wayne's strategic brilliance increases Defender Troops' Lethality by 10%.",
            "defender_troops_damage_up_percentage": 0.10
          }
        }
      },
      {
        "level": 7,
        "marksman-lethality": 0.9345,
        "marksman-health": 0.9345,
        power: 416520,
        "skills": {
          "expedition": {
            "skill-name": "Offensive Defense",
            "description": "Wayne's strategic brilliance increases Defender Troops' Lethality by 10%.",
            "defender_troops_damage_up_percentage": 0.10
          }
        }
      },
      {
        "level": 8,
        "marksman-lethality": 0.10680,
        "marksman-health": 0.10680,
        power: 472590,
        "skills": {
          "expedition": {
            "skill-name": "Offensive Defense",
            "description": "Wayne's strategic brilliance increases Defender Troops' Lethality by 12.5%.",
            "defender_troops_damage_up_percentage": 0.125
          }
        }
      },
      {
        "level": 9,
        "marksman-lethality": 0.12015,
        "marksman-health": 0.12015,
        power: 528660,
        "skills": {
          "expedition": {
            "skill-name": "Offensive Defense",
            "description": "Wayne's strategic brilliance increases Defender Troops' Lethality by 12.5%.",
            "defender_troops_damage_up_percentage": 0.125
          }
        }
      },
      {
        "level": 10,
        "marksman-lethality": 0.13350,
        "marksman-health": 0.13350,
        power: 600750,
        "skills": {
          "expedition": {
            "skill-name": "Offensive Defense",
            "description": "Wayne's strategic brilliance increases Defender Troops' Lethality by 15%.",
            "defender_troops_damage_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const wu_ming: Hero = {
  "hero-name": "Wu Ming",
  "hero-class": "infantry",
  "generation": 6,
  "max-star-power": 1847106,
  "max-skill-power": 101520,
  "max-level-power": 498222,
  "base-stats": {
    "infantry-attack": 5.4043,
    "infantry-defense": 5.4043
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Shadow's Evasion",
        "description": "Wu Ming moves like a shadow, dodging and countering enemies, reducing his Infantry's damage taken from normal attacks by [5% / 10% / 15% / 20% / 25%] and from skills by [6% / 12% / 18% / 24% / 30%].",
        "infantry_damage_taken_down_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        },
        "infantry_skill_damage_taken_down_percentage": {
          "1": 0.06,
          "2": 0.12,
          "3": 0.18,
          "4": 0.24,
          "5": 0.30
        }
      },
      "2": {
        "skill-name": "Crescent Uplift",
        "description": "Wu Ming spreads his wisdom and techniques, increasing damage dealt by [4% / 8% / 12% / 16% / 20%] for all troops.",
        "all_troops_extra_damage_up_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20
        }
      },
      "3": {
        "skill-name": "Elemental Resonance",
        "description": "Wu Ming leads everyone to heightened affinity with their combat techniques, increasing skill damage dealt by [5% / 10% / 15% / 20% / 25%] for all trooops.",
        "all_troops_skill_damage_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      }
    }
  },
  "exclusive-weapon": {
    name: "Dragonslayer",
    levels: [
      {
        "level": 1,
        "infantry-lethality": 0.1335,
        "infantry-health": 0.1335,
        power: 80100,
        "skills": {}
      },
      {
        "level": 2,
        "infantry-lethality": 0.2670,
        "infantry-health": 0.2670,
        power: 136170,
        "skills": {
          "expedition": {
            "skill-name": "Steel Discipline",
            "description": "Wu Ming puts defender troops under stern tutelage, increasing Defender Troops' Defense by 5%.",
            "defender_troops_defense_up_percentage": 0.05
          }
        }
      },
      {
        "level": 3,
        "infantry-lethality": 0.4005,
        "infantry-health": 0.4005,
        power: 192240,
        "skills": {
          "expedition": {
            "skill-name": "Steel Discipline",
            "description": "Wu Ming puts defender troops under stern tutelage, increasing Defender Troops' Defense by 5%.",
            "defender_troops_defense_up_percentage": 0.05
          }
        }
      },
      {
        "level": 4,
        "infantry-lethality": 0.5340,
        "infantry-health": 0.5340,
        power: 248310,
        "skills": {
          "expedition": {
            "skill-name": "Steel Discipline",
            "description": "Wu Ming puts defender troops under stern tutelage, increasing Defender Troops' Defense by 7.5%.",
            "defender_troops_defense_up_percentage": 0.075
          }
        }
      },
      {
        "level": 5,
        "infantry-lethality": 0.6675,
        "infantry-health": 0.6675,
        power: 304380,
        "skills": {
          "expedition": {
            "skill-name": "Steel Discipline",
            "description": "Wu Ming puts defender troops under stern tutelage, increasing Defender Troops' Defense by 7.5%.",
            "defender_troops_defense_up_percentage": 0.075
          }
        }
      },
      {
        "level": 6,
        "infantry-lethality": 0.8010,
        "infantry-health": 0.8010,
        power: 360450,
        "skills": {
          "expedition": {
            "skill-name": "Steel Discipline",
            "description": "Wu Ming puts defender troops under stern tutelage, increasing Defender Troops' Defense by 10%.",
            "defender_troops_defense_up_percentage": 0.10
          }
        }
      },
      {
        "level": 7,
        "infantry-lethality": 0.9345,
        "infantry-health": 0.9345,
        power: 416520,
        "skills": {
          "expedition": {
            "skill-name": "Steel Discipline",
            "description": "Wu Ming puts defender troops under stern tutelage, increasing Defender Troops' Defense by 10%.",
            "defender_troops_defense_up_percentage": 0.10
          }
        }
      },
      {
        "level": 8,
        "infantry-lethality": 0.10680,
        "infantry-health": 0.10680,
        power: 472590,
        "skills": {
          "expedition": {
            "skill-name": "Steel Discipline",
            "description": "Wu Ming puts defender troops under stern tutelage, increasing Defender Troops' Defense by 12.5%.",
            "defender_troops_defense_up_percentage": 0.125
          }
        }
      },
      {
        "level": 9,
        "infantry-lethality": 0.12015,
        "infantry-health": 0.12015,
        power: 528660,
        "skills": {
          "expedition": {
            "skill-name": "Steel Discipline",
            "description": "Wu Ming puts defender troops under stern tutelage, increasing Defender Troops' Defense by 12.5%.",
            "defender_troops_defense_up_percentage": 0.125
          }
        }
      },
      {
        "level": 10,
        "infantry-lethality": 0.13350,
        "infantry-health": 0.13350,
        power: 600750,
        "skills": {
          "expedition": {
            "skill-name": "Steel Discipline",
            "description": "Wu Ming puts defender troops under stern tutelage, increasing Defender Troops' Defense by 15%.",
            "defender_troops_defense_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const bradley: Hero = {
  "hero-name": "Bradley",
  "hero-class": "marksman",
  "generation": 7,
  "max-star-power": 2220678,
  "max-skill-power": 101520,
  "max-level-power": 598986,
  "base-stats": {
    "marksman-attack": 6.5052,
    "marksman-defense": 6.5052,
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Veteran's Might",
        "description":
          "Bradley's years of combat experience enables him to destroy enemies efficiently, increasing Attack by [5% / 10% / 15% / 20% / 25%] for all troops.",
        "all_troops_attack_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25,
        },
      },
      "2": {
        "skill-name": "Power Shot",
        "description":
          "Bradley uses his expertise in suppressive artillery against the enemy vanguard, increasing Damage Dealt to Lancers by [6% / 12% / 18% / 24% / 30%], and to Infantry by [5% / 10% / 15% / 20% / 25%] for all troops.",
        "lancer_damage_up_percentage": {
          "1": 0.06,
          "2": 0.12,
          "3": 0.18,
          "4": 0.24,
          "5": 0.30,
        },
        "infantry_damage_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25,
        },
      },
      "3": {
        "skill-name": "Tactical Assistance",
        "description":
          "Bradley will press every advantage against a beleaguered enemy, increasing Damage Dealt by [6% / 12% / 18% / 24% / 30%] for all troops for 2 turns every 4 turns.",
        "all_troops_damage_up_percentage": {
          "1": 0.06,
          "2": 0.12,
          "3": 0.18,
          "4": 0.24,
          "5": 0.30,
        },
        "duration_turns": 2,
        "trigger_every_n_turns": 4,
      },
    },
  },
  "exclusive-weapon": {
    name: "Thunder Cannon",
    levels: [
      {
        level: 1,
        "marksman-lethality": 0.1605,
        "marksman-health": 0.1605,
        power: 96300,
        skills: {
          expedition: null,
        },
      },
      {
        level: 2,
        "marksman-lethality": 0.321,
        "marksman-health": 0.321,
        power: 163710,
        skills: {
          expedition: {
            "skill-name": "Siege Insight",
            "description": "Bradley knows exactly where to place defenses as a siege expert, increasing Defender Troops' Attack by 5%.",
            "defender_troops_attack_up_percentage": 0.05,
          },
        },
      },
      {
        level: 3,
        "marksman-lethality": 0.4815,
        "marksman-health": 0.4815,
        power: 231120,
        skills: {
          expedition: {
            "skill-name": "Siege Insight",
            "description": "Bradley knows exactly where to place defenses as a siege expert, increasing Defender Troops' Attack by 5%.",
            "defender_troops_attack_up_percentage": 0.05,
          },
        },
      },
      {
        level: 4,
        "marksman-lethality": 0.642,
        "marksman-health": 0.642,
        power: 298530,
        skills: {
          expedition: {
            "skill-name": "Siege Insight",
            "description": "Bradley knows exactly where to place defenses as a siege expert, increasing Defender Troops' Attack by 7.5%.",
            "defender_troops_attack_up_percentage": 0.075,
          },
        },
      },
      {
        level: 5,
        "marksman-lethality": 0.8025,
        "marksman-health": 0.8025,
        power: 365940,
        skills: {
          expedition: {
            "skill-name": "Siege Insight",
            "description": "Bradley knows exactly where to place defenses as a siege expert, increasing Defender Troops' Attack by 7.5%.",
            "defender_troops_attack_up_percentage": 0.075,
          },
        },
      },
      {
        level: 6,
        "marksman-lethality": 0.963,
        "marksman-health": 0.963,
        power: 433350,
        skills: {
          expedition: {
            "skill-name": "Siege Insight",
            "description": "Bradley knows exactly where to place defenses as a siege expert, increasing Defender Troops' Attack by 10%.",
            "defender_troops_attack_up_percentage": 0.10,
          },
        },
      },
      {
        level: 7,
        "marksman-lethality": 1.1235,
        "marksman-health": 1.1235,
        power: 500760,
        skills: {
          expedition: {
            "skill-name": "Siege Insight",
            "description": "Bradley knows exactly where to place defenses as a siege expert, increasing Defender Troops' Attack by 10%.",
            "defender_troops_attack_up_percentage": 0.10,
          },
        },
      },
      {
        level: 8,
        "marksman-lethality": 1.284,
        "marksman-health": 1.284,
        power: 568170,
        skills: {
          expedition: {
            "skill-name": "Siege Insight",
            "description": "Bradley knows exactly where to place defenses as a siege expert, increasing Defender Troops' Attack by 12.5%.",
            "defender_troops_attack_up_percentage": 0.125,
          },
        },
      },
      {
        level: 9,
        "marksman-lethality": 1.4445,
        "marksman-health": 1.4445,
        power: 635580,
        skills: {
          expedition: {
            "skill-name": "Siege Insight",
            "description": "Bradley knows exactly where to place defenses as a siege expert, increasing Defender Troops' Attack by 12.5%.",
            "defender_troops_attack_up_percentage": 0.125,
          },
        },
      },
      {
        level: 10,
        "marksman-lethality": 1.605,
        "marksman-health": 1.605,
        power: 722250,
        skills: {
          expedition: {
            "skill-name": "Siege Insight",
            "description": "Bradley knows exactly where to place defenses as a siege expert, increasing Defender Troops' Attack by 15%.",
            "defender_troops_attack_up_percentage": 0.15,
          },
        },
      },
    ],
  },
};

export const edith: Hero = {
  "hero-name": "Edith",
  "hero-class": "infantry",
  "generation": 7,
  "max-star-power": 2220678,
  "max-skill-power": 101520,
  "max-level-power": 598986,
  "base-stats": {
    "infantry-attack": 6.5052,
    "infantry-defense": 6.5052
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Strategic Balance",
        "description":
          "Mr Tin's colossal presence automatically shields friendly ranged units, reducing Damage Taken by [4% / 8% / 12% / 16% / 20%] for Marksmen, and suppressess the enemy, increasing Damage Dealt by [4% / 8% / 12% / 16% / 20%] for Lancers.",
        "marksman_damage_taken_down_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.2
        },
        "lancer_damage_up_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.2
        }
      },
      "2": {
        "skill-name": "Ironclad",
        "description":
          "Mr Tin's metallic body functions as a fortified wall on the field, reducing damage taken by [4% / 8% / 12% / 16% / 20%] for Infantry.",
        "infantry_damage_taken_down_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.2
        }
      },
      "3": {
        "skill-name": "Steel Sentinel",
        "description":
          "Edith's mobile defense system is reliable, increasing Health by [5% / 10% / 15% / 20% / 25%] for all troops.",
        "all_troops_health_up_percentage": {
          "1": 0.05,
          "2": 0.1,
          "3": 0.15,
          "4": 0.2,
          "5": 0.25
        }
      }
    }
  },
  "exclusive-weapon": {
    name: "Charm Toolkit",
    levels: [
      {
        "level": 1,
        "infantry-lethality": 0.1605,
        "infantry-health": 0.1605,
        power: 96300,
        "skills": {}
      },
      {
        "level": 2,
        "infantry-lethality": 0.3210,
        "infantry-health": 0.3210,
        power: 163710,
        "skills": {
          "expedition": {
            "skill-name": "Fortworks",
            "description": "Edith and Mr. Tin are a formidable defensive duo, increasing Defender Troops' Health by 5%.",
            "defender_troops_health_up_percentage": 0.05
          }
        }
      },
      {
        "level": 3,
        "infantry-lethality": 0.4815,
        "infantry-health": 0.4815,
        power: 231120,
        "skills": {
          "expedition": {
            "skill-name": "Fortworks",
            "description": "Edith and Mr. Tin are a formidable defensive duo, increasing Defender Troops' Health by 5%.",
            "defender_troops_health_up_percentage": 0.05
          }
        }
      },
      {
        "level": 4,
        "infantry-lethality": 0.642,
        "infantry-health": 0.642,
        power: 298530,
        "skills": {
          "expedition": {
            "skill-name": "Fortworks",
            "description": "Edith and Mr. Tin are a formidable defensive duo, increasing Defender Troops' Health by 7.5%.",
            "defender_troops_health_up_percentage": 0.075
          }
        }
      },
      {
        "level": 5,
        "infantry-lethality": 0.8025,
        "infantry-health": 0.8025,
        power: 365940,
        "skills": {
          "expedition": {
            "skill-name": "Fortworks",
            "description": "Edith and Mr. Tin are a formidable defensive duo, increasing Defender Troops' Health by 7.5%.",
            "defender_troops_health_up_percentage": 0.075
          }
        }
      },
      {
        "level": 6,
        "infantry-lethality": 0.963,
        "infantry-health": 0.963,
        power: 433350,
        "skills": {
          "expedition": {
            "skill-name": "Fortworks",
            "description": "Edith and Mr. Tin are a formidable defensive duo, increasing Defender Troops' Health by 10%.",
            "defender_troops_health_up_percentage": 0.1
          }
        }
      },
      {
        "level": 7,
        "infantry-lethality": 0.11235,
        "infantry-health": 0.11235,
        power: 500760,
        "skills": {
          "expedition": {
            "skill-name": "Fortworks",
            "description": "Edith and Mr. Tin are a formidable defensive duo, increasing Defender Troops' Health by 10%.",
            "defender_troops_health_up_percentage": 0.1
          }
        }
      },
      {
        "level": 8,
        "infantry-lethality": 0.1284,
        "infantry-health": 0.1284,
        power: 568170,
        "skills": {
          "expedition": {
            "skill-name": "Fortworks",
            "description": "Edith and Mr. Tin are a formidable defensive duo, increasing Defender Troops' Health by 12.5%.",
            "defender_troops_health_up_percentage": 0.125
          }
        }
      },
      {
        "level": 9,
        "infantry-lethality": 0.14445,
        "infantry-health": 0.14445,
        power: 635580,
        "skills": {
          "expedition": {
            "skill-name": "Fortworks",
            "description": "Edith and Mr. Tin are a formidable defensive duo, increasing Defender Troops' Health by 12.5%.",
            "defender_troops_health_up_percentage": 0.125
          }
        }
      },
      {
        "level": 10,
        "infantry-lethality": 0.1605,
        "infantry-health": 0.1605,
        power: 722250,
        "skills": {
          "expedition": {
            "skill-name": "Fortworks",
            "description": "Edith and Mr. Tin are a formidable defensive duo, increasing Defender Troops' Health by 15%.",
            "defender_troops_health_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const gordon: Hero = {
  "hero-name": "Gordon",
  "hero-class": "lancer",
  "generation": 7,
  "max-star-power": 2220678,
  "max-skill-power": 101520,
  "max-level-power": 598986,
  "base-stats": {
    "lancer-attack": 6.5052,
    "lancer-defense": 6.5052
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Venom Infusion",
        "description":
          "Gordon dips Lancers' weapons in venom. Every 2 attacks, Lancers deal [20% / 40% / 60% / 80% / 100%] extra damage and apply poison to the target for 1 turn. Poisoned enemies deal [4% / 8% / 12% / 16% / 20%] less damage.",
        "extra_damage_up_percentage": {
          "1": 0.20,
          "2": 0.40,
          "3": 0.60,
          "4": 0.80,
          "5": 1.00
        },
        "damage_taken_down_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20
        },
        "duration_turns": 1,
        "trigger_every_n_turns": 3
      },
      "2": {
        "skill-name": "Chemical Terror",
        "description":
          "Gordon's envenomed weapons terrorizes the field, increasing Lancers' Damage Dealt by [30% / 60% / 90% / 120% / 150%] and reducing Damage Dealt by [6% / 12% / 18% / 24% / 30%] for all enemy troops for 1 turn.",
        "lancers_damage_up_percentage": {
          "1": 0.30,
          "2": 0.60,
          "3": 0.90,
          "4": 1.20,
          "5": 1.50
        },
        "enemy_damage_down_percentage": {
          "1": 0.06,
          "2": 0.12,
          "3": 0.18,
          "4": 0.24,
          "5": 0.30
        },
        "duration_turns": 1,
        "trigger_every_n_turns": 3
      },
      "3": {
        "skill-name": "Toxic Release",
        "description":
          "Gordon generates a defensive bio-toxic fog, confusing enemy frontline infantry, increasing their Damage Taken by [6% / 12% / 18% / 24% / 30%], while blocking enemy Marksmen's line of sight to reduce their Damage Dealt by [6% / 12% / 18% / 24% / 30%] for 2 turns.",
        "infantry_damage_taken_up_percentage": {
          "1": 0.06,
          "2": 0.12,
          "3": 0.18,
          "4": 0.24,
          "5": 0.30
        },
        "marksmen_damage_dealt_reduction_percentage": {
          "1": 0.06,
          "2": 0.12,
          "3": 0.18,
          "4": 0.24,
          "5": 0.30
        },
        "duration_turns": 2,
        "trigger_every_n_turns": 4
      }
    }
  },
  "exclusive-weapon": {
    name: "Bonecrux Venom",
    levels: [
      {
        "level": 1,
        "lancer-lethality": 0.1605,
        "lancer-health": 0.1605,
        power: 96300,
        "skills": {}
      },
      {
        "level": 2,
        "lancer-lethality": 0.3210,
        "lancer-health": 0.3210,
        power: 163710,
        "skills": {
          "expedition": {
            "skill-name": "Bio Assault",
            "description": "Gordon privileges his allies with special envenomed weaponry, increasing Rally Squads' Lethality by 5%.",
            "rally_troops_damage_up_percentage": 0.05
          }
        }
      },
      {
        "level": 3,
        "lancer-lethality": 0.4815,
        "lancer-health": 0.4815,
        power: 231120,
        "skills": {
          "expedition": {
            "skill-name": "Bio Assault",
            "description": "Gordon privileges his allies with special envenomed weaponry, increasing Rally Squads' Lethality by 5%.",
            "rally_troops_damage_up_percentage": 0.05
          }
        }
      },
      {
        "level": 4,
        "lancer-lethality": 0.642,
        "lancer-health": 0.642,
        power: 298530,
        "skills": {
          "expedition": {
            "skill-name": "Bio Assault",
            "description": "Gordon privileges his allies with special envenomed weaponry, increasing Rally Squads' Lethality by 7.5%.",
            "rally_troops_damage_up_percentage": 0.075
          }
        }
      },
      {
        "level": 5,
        "lancer-lethality": 0.8025,
        "lancer-health": 0.8025,
        power: 365940,
        "skills": {
          "expedition": {
            "skill-name": "Bio Assault",
            "description": "Gordon privileges his allies with special envenomed weaponry, increasing Rally Squads' Lethality by 7.5%.",
            "rally_troops_damage_up_percentage": 0.075
          }
        }
      },
      {
        "level": 6,
        "lancer-lethality": 0.963,
        "lancer-health": 0.963,
        power: 433350,
        "skills": {
          "expedition": {
            "skill-name": "Bio Assault",
            "description": "Gordon privileges his allies with special envenomed weaponry, increasing Rally Squads' Lethality by 10%.",
            "rally_troops_damage_up_percentage": 0.10
          }
        }
      },
      {
        "level": 7,
        "lancer-lethality": 0.11235,
        "lancer-health": 0.11235,
        power: 500760,
        "skills": {
          "expedition": {
            "skill-name": "Bio Assault",
            "description": "Gordon privileges his allies with special envenomed weaponry, increasing Rally Squads' Lethality by 10%.",
            "rally_troops_damage_up_percentage": 0.10
          }
        }
      },
      {
        "level": 8,
        "lancer-lethality": 0.1284,
        "lancer-health": 0.1284,
        power: 568170,
        "skills": {
          "expedition": {
            "skill-name": "Bio Assault",
            "description": "Gordon privileges his allies with special envenomed weaponry, increasing Rally Squads' Lethality by 12.5%.",
            "rally_troops_damage_up_percentage": 0.125
          }
        }
      },
      {
        "level": 9,
        "lancer-lethality": 0.14445,
        "lancer-health": 0.14445,
        power: 635580,
        "skills": {
          "expedition": {
            "skill-name": "Bio Assault",
            "description": "Gordon privileges his allies with special envenomed weaponry, increasing Rally Squads' Lethality by 12.5%.",
            "rally_troops_damage_up_percentage": 0.125
          }
        }
      },
      {
        "level": 10,
        "lancer-lethality": 0.1605,
        "lancer-health": 0.1605,
        power: 722250,
        "skills": {
          "expedition": {
            "skill-name": "Bio Assault",
            "description": "Gordon privileges his allies with special envenomed weaponry, increasing Rally Squads' Lethality by 15%.",
            "rally_troops_damage_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const gatot: Hero = {
  "hero-name": "Gatot",
  "hero-class": "infantry",
  "generation": 8,
  "max-star-power": 2670348,
  "max-skill-power": 101520,
  "max-level-power": 720276,
  "base-stats": {
    "infantry-attack": 7.8062,
    "infantry-defense": 7.8062
  },
  "skills": {
    "expedition": {
      "1": {
        "skill-name": "Golden Guard",
        "description": "Gatot commands his troops with imperial guard tactics, increasing his Infantry's Defense by [6% / 12% / 18% / 24% / 30%].",
        "infantry_defense_up_percentage": {
          "1": 0.06,
          "2": 0.12,
          "3": 0.18,
          "4": 0.24,
          "5": 0.30
        }
      },
      "2": {
        "skill-name": "King's Bestowal",
        "description": "The great kings blesses Gatot's Infantry, granting Infantry a Shield with protection equal to Attack* [6% / 12% / 18% / 24% / 30%] each time they attack, for 1 turn.",
        "all_troops_defense_up_percentage": {
          "1": 0.06,
          "2": 0.12,
          "3": 0.18,
          "4": 0.24,
          "5": 0.30
        },
        "duration_turns": 1
      },
      "3": {
        "skill-name": "Royal Legion",
        "description": "Gatot's formidable legion instills fear in enemies, reducing their Attack by [5% / 10% / 15% / 20% / 25%].",
        "enemy_damage_down_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      }
    }
  },
  "exclusive-weapon": {
    name: "Golden Fang",
    levels: [
      {
        level: 1,
        "infantry-lethality": 0.1930,
        "infantry-health": 0.1930,
        power: 115800,
        skills: {
          expedition: null
        }
      },
      {
        level: 2,
        "infantry-lethality": 0.3860,
        "infantry-health": 0.3860,
        power: 196860,
        skills: {
          expedition: {
            "skill-name": "Indestructible City",
            "description": "Indestructible cities are forged with courage and determination, increases Defender Troops' Defense by 5%.",
            "defender_troops_defense_up_percentage": 0.05
          }
        }
      },
      {
        level: 3,
        "infantry-lethality": 0.5790,
        "infantry-health": 0.5790,
        power: 277920,
        skills: {
          expedition: {
            "skill-name": "Indestructible City",
            "description": "Indestructible cities are forged with courage and determination, increases Defender Troops' Defense by 5%.",
            "defender_troops_defense_up_percentage": 0.05
          }
        }
      },
      {
        level: 4,
        "infantry-lethality": 0.7720,
        "infantry-health": 0.7720,
        power: 358980,
        skills: {
          expedition: {
            "skill-name": "Indestructible City",
            "description": "Indestructible cities are forged with courage and determination, increases Defender Troops' Defense by 7.5%.",
            "defender_troops_defense_up_percentage": 0.075
          }
        }
      },
      {
        level: 5,
        "infantry-lethality": 0.9650,
        "infantry-health": 0.9650,
        power: 440040,
        skills: {
          expedition: {
            "skill-name": "Indestructible City",
            "description": "Indestructible cities are forged with courage and determination, increases Defender Troops' Defense by 7.5%.",
            "defender_troops_defense_up_percentage": 0.075
          }
        }
      },
      {
        level: 6,
        "infantry-lethality": 0.11580,
        "infantry-health": 0.11580,
        power: 521100,
        skills: {
          expedition: {
            "skill-name": "Indestructible City",
            "description": "Indestructible cities are forged with courage and determination, increases Defender Troops' Defense by 10%.",
            "defender_troops_defense_up_percentage": 0.10
          }
        }
      },
      {
        level: 7,
        "infantry-lethality": 0.13510,
        "infantry-health": 0.13510,
        power: 602160,
        skills: {
          expedition: {
            "skill-name": "Indestructible City",
            "description": "Indestructible cities are forged with courage and determination, increases Defender Troops' Defense by 10%.",
            "defender_troops_defense_up_percentage": 0.10
          }
        }
      },
      {
        level: 8,
        "infantry-lethality": 0.15440,
        "infantry-health": 0.15440,
        power: 683220,
        skills: {
          expedition: {
            "skill-name": "Indestructible City",
            "description": "Indestructible cities are forged with courage and determination, increases Defender Troops' Defense by 12.5%.",
            "defender_troops_defense_up_percentage": 0.125
          }
        }
      },
      {
        level: 9,
        "infantry-lethality": 0.17370,
        "infantry-health": 0.17370,
        power: 764280,
        skills: {
          expedition: {
            "skill-name": "Indestructible City",
            "description": "Indestructible cities are forged with courage and determination, increases Defender Troops' Defense by 12.5%.",
            "defender_troops_defense_up_percentage": 0.125
          }
        }
      },
      {
        level: 10,
        "infantry-lethality": 0.19300,
        "infantry-health": 0.19300,
        power: 868500,
        skills: {
          expedition: {
            "skill-name": "Indestructible City",
            "description": "Indestructible cities are forged with courage and determination, increases Defender Troops' Defense by 15%.",
            "defender_troops_defense_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const hendrik: Hero = {
  "hero-name": "Hendrik",
  "hero-class": "marksman",
  "generation": 8,
  "max-star-power": 2670348,
  "max-skill-power": 101520,
  "max-level-power": 720276,
  "base-stats": {
    "marksman-attack": 7.8062,
    "marksman-defense": 7.8062
  },
  "skills": {
    "expedition": {
      "1": {
        "skill-name": "Worm's Ravage",
        "description":
          "Captain Hendrik commands a gigantic naval shipworm gnaw at the enemies' armor reducing all enemy troops' Defense by [5% / 10% / 15% / 20% / 25%].",
        "defense_reduction_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25,
        }
      },
      "2": {
        "skill-name": "Armor of Barnacles",
        "description":
          "Hendrik covers all friendly Troops with a layer of hard-shelled barnacles every 4 turns, increasing their Defense by [6% / 12% / 18% / 24% / 30%] for 2 turns.",
        "all_troops_defense_up_percentage": {
          "1": 0.06,
          "2": 0.12,
          "3": 0.18,
          "4": 0.24,
          "5": 0.30
        },
        "trigger_every_n_turns": 4,
        "duration_turns": 2
      },
      "3": {
        "skill-name": "Dragon's Heir",
        "description":
          "Every 3 turns, the ancient abyssal spirit's descendants will work together with Hendrik's Marksmen to launch an attack, dealing [8% / 16% / 24% / 32% / 40%] damage to all enemies.",
        "marksman_damage_up_percentage": {
          "1": 0.08,
          "2": 0.16,
          "3": 0.24,
          "4": 0.32,
          "5": 0.40
        },
        "trigger_every_n_turns": 3
      }
    }
  },
  "exclusive-weapon": {
    name: "Abyss Driver",
    levels: [
      {
        level: 1,
        "marksman-lethality": 0.1930,
        "marksman-health": 0.1930,
        power: 115800,
        skills: {
          expedition: null
        }
      },
      {
        level: 2,
        "marksman-lethality": 0.3860,
        "marksman-health": 0.3860,
        power: 196860,
        skills: {
          expedition: {
            "skill-name": "Abyssal Blessing",
            "description":
              "The ancient abyssal spirit's blessing increases the Rally Troops' Attack by 5%.",
            "rally_troops_attack_up_percentage": 0.05
          }
        }
      },
      {
        level: 3,
        "marksman-lethality": 0.5790,
        "marksman-health": 0.5790,
        power: 277920,
        skills: {
          expedition: {
            "skill-name": "Abyssal Blessing",
            "description":
              "The ancient abyssal spirit's blessing increases the Rally Troops' Attack by 5%.",
            "rally_troops_attack_up_percentage": 0.05
          }
        }
      },
      {
        level: 4,
        "marksman-lethality": 0.7720,
        "marksman-health": 0.7720,
        power: 358980,
        skills: {
          expedition: {
            "skill-name": "Abyssal Blessing",
            "description":
              "The ancient abyssal spirit's blessing increases the Rally Troops' Attack by 7.5%.",
            "rally_troops_attack_up_percentage": 0.075
          }
        }
      },
      {
        level: 5,
        "marksman-lethality": 0.9650,
        "marksman-health": 0.9650,
        power: 440040,
        skills: {
          expedition: {
            "skill-name": "Abyssal Blessing",
            "description":
              "The ancient abyssal spirit's blessing increases the Rally Troops' Attack by 7.5%.",
            "rally_troops_attack_up_percentage": 0.075
          }
        }
      },
      {
        level: 6,
        "marksman-lethality": 1.1580,
        "marksman-health": 1.1580,
        power: 521100,
        skills: {
          expedition: {
            "skill-name": "Abyssal Blessing",
            "description":
              "The ancient abyssal spirit's blessing increases the Rally Troops' Attack by 10%.",
            "rally_troops_attack_up_percentage": 0.10
          }
        }
      },
      {
        level: 7,
        "marksman-lethality": 1.3510,
        "marksman-health": 1.3510,
        power: 602160,
        skills: {
          expedition: {
            "skill-name": "Abyssal Blessing",
            "description":
              "The ancient abyssal spirit's blessing increases the Rally Troops' Attack by 10%.",
            "rally_troops_attack_up_percentage": 0.10
          }
        }
      },
      {
        level: 8,
        "marksman-lethality": 1.5440,
        "marksman-health": 1.5440,
        power: 683220,
        skills: {
          expedition: {
            "skill-name": "Abyssal Blessing",
            "description":
              "The ancient abyssal spirit's blessing increases the Rally Troops' Attack by 12.5%.",
            "rally_troops_attack_up_percentage": 0.125
          }
        }
      },
      {
        level: 9,
        "marksman-lethality": 1.7370,
        "marksman-health": 1.7370,
        power: 764280,
        skills: {
          expedition: {
            "skill-name": "Abyssal Blessing",
            "description":
              "The ancient abyssal spirit's blessing increases the Rally Troops' Attack by 12.5%.",
            "rally_troops_attack_up_percentage": 0.125
          }
        }
      },
      {
        level: 10,
        "marksman-lethality": 1.9300,
        "marksman-health": 1.9300,
        power: 868500,
        skills: {
          expedition: {
            "skill-name": "Abyssal Blessing",
            "description":
              "The ancient abyssal spirit's blessing increases the Rally Troops' Attack by 15%.",
            "rally_troops_attack_up_percentage": 0.15
          }
        }
      },
    ]
  }
};

export const sonya: Hero = {
  "hero-name": "Sonya",
  "hero-class": "lancer",
  "generation": 8,
  "max-star-power": 2670348,
  "max-skill-power": 101520,
  "max-level-power": 720276,
  "base-stats": {
    "lancer-attack": 7.8062,
    "lancer-defense": 7.8062
  },
  "skills": {
    "expedition": {
      "1": {
        "skill-name": "Treasure Hunter",
        "description": "Everyone has a share when the legendary ocean treasure is found! Sonya's promise inspires everyone, increasing Damage by [4% / 8% / 12% / 16% / 20%] for all troops.",
        "all_troops_damage_up_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20
        }
      },
      "2": {
        "skill-name": "Bounty Temptation",
        "description": "Sonya motivates her Troops with bounty, making her Lancers deal [15% / 30% / 45% / 60% / 75%] more damage every 2 attacks and increasing Attack by [5% / 10% / 15% / 20% / 25%] for all troops for 1 turn.",
        "lancers_damage_up_percentage": {
          "1": 0.15,
          "2": 0.30,
          "3": 0.45,
          "4": 0.60,
          "5": 0.75
        },
        "trigger_every_n_strikes": 2,
        "all_troops_attack_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        },
        "duration_turns": 1
      },
      "3": {
        "skill-name": "Torrential Impact",
        "description": "Sonya's Lancers will seize every chance to launch a suprise raid like underwater currents. Her Lancers deal [50% / 100% / 150% / 200% / 250%] damage every 5 turns and stun the target for 1 turn",
        "lancers_damage_up_percentage": {
          "1": 0.50,
          "2": 1.00,
          "3": 1.50,
          "4": 2.00,
          "5": 2.50
        },
        "trigger_every_n_turns": 5,
        "duration_turns": 1
      }
    }
  },
  "exclusive-weapon": {
    name: "Mangrove Frog",
    levels: [
      {
        level: 1,
        "lancer-lethality": 0.1930,
        "lancer-health": 0.1930,
        power: 115800,
        skills: {
          expedition: null
        }
      },
      {
        level: 2,
        "lancer-lethality": 0.3860,
        "lancer-health": 0.3860,
        power: 196860,
        skills: {
          expedition: {
            "skill-name": "Bio Assault",
            "description": "Sonya sets up turrets that spurt out streams of water, increasing Defender Troops Lethality by 5%.",
            "defender_troops_damage_up_percentage": 0.05
          }
        }
      },
      {
        level: 3,
        "lancer-lethality": 0.5790,
        "lancer-health": 0.5790,
        power: 277920,
        skills: {
          expedition: {
            "skill-name": "Bio Assault",
            "description": "Sonya sets up turrets that spurt out streams of water, increasing Defender Troops Lethality by 5%.",
            "defender_troops_damage_up_percentage": 0.05
          }
        }
      },
      {
        level: 4,
        "lancer-lethality": 0.7720,
        "lancer-health": 0.7720,
        power: 358980,
        skills: {
          expedition: {
            "skill-name": "Bio Assault",
            "description": "Sonya sets up turrets that spurt out streams of water, increasing Defender Troops Lethality by 7.5%.",
            "defender_troops_damage_up_percentage": 0.075
          }
        }
      },
      {
        level: 5,
        "lancer-lethality": 0.9650,
        "lancer-health": 0.9650,
        power: 440040,
        skills: {
          expedition: {
            "skill-name": "Bio Assault",
            "description": "Sonya sets up turrets that spurt out streams of water, increasing Defender Troops Lethality by 7.5%.",
            "defender_troops_damage_up_percentage": 0.075
          }
        }
      },
      {
        level: 6,
        "lancer-lethality": 1.1580,
        "lancer-health": 1.1580,
        power: 521100,
        skills: {
          expedition: {
            "skill-name": "Bio Assault",
            "description": "Sonya sets up turrets that spurt out streams of water, increasing Defender Troops Lethality by 10%.",
            "defender_troops_damage_up_percentage": 0.10
          }
        }
      },
      {
        level: 7,
        "lancer-lethality": 1.3510,
        "lancer-health": 1.3510,
        power: 602160,
        skills: {
          expedition: {
            "skill-name": "Bio Assault",
            "description": "Sonya sets up turrets that spurt out streams of water, increasing Defender Troops Lethality by 10%.",
            "defender_troops_damage_up_percentage": 0.10
          }
        }
      },
      {
        level: 8,
        "lancer-lethality": 1.5440,
        "lancer-health": 1.5440,
        power: 683220,
        skills: {
          expedition: {
            "skill-name": "Bio Assault",
            "description": "Sonya sets up turrets that spurt out streams of water, increasing Defender Troops Lethality by 12.5%.",
            "defender_troops_damage_up_percentage": 0.125
          }
        }
      },
      {
        level: 9,
        "lancer-lethality": 1.7370,
        "lancer-health": 1.7370,
        power: 764280,
        skills: {
          expedition: {
            "skill-name": "Bio Assault",
            "description": "Sonya sets up turrets that spurt out streams of water, increasing Defender Troops Lethality by 12.5%.",
            "defender_troops_damage_up_percentage": 0.125
          }
        }
      },
      {
        level: 10,
        "lancer-lethality": 1.9300,
        "lancer-health": 1.9300,
        power: 868500,
        skills: {
          expedition: {
            "skill-name": "Bio Assault",
            "description": "Sonya sets up turrets that spurt out streams of water, increasing Defender Troops Lethality by 15%.",
            "defender_troops_damage_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const fred: Hero = {
  "hero-name": "Fred",
  "hero-class": "lancer",
  "generation": 9,
  "max-star-power": 3209952,
  "max-skill-power": 101520,
  "max-level-power": 865824,
  "base-stats": {
    "lancer-attack": 9.4075,
    "lancer-defense": 9.4075,
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Hydraulic Suppression",
        "description":
          "Fred's water volleys destroy opponent momentum, reducing all enemy troops' lethality by [4% / 8% / 12% / 16% / 20%].",
        "lethality_reduction_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20,
        },
      },
      "2": {
        "skill-name": "Acidification",
        "description":
          "Fred coats enemy Infantry shields with a special acidic blend, amplifying their damage taken by [4% / 8% / 12% / 16% / 20%].",
        "infantry_damage_taken_up_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20,
        },
        "target": "enemy_infantry"
      },
      "3": {
        "skill-name": "Floodbringer",
        "description":
          "A master of pressure both hydraulic and tactical, Fred's Lancers deal [40% / 80% / 120% / 160% / 200%] additional damage every 4 strikes and reduce enemy troop damage dealt by [4% / 8% / 12% / 16% / 20%] on the next turn.",
        "lancers_damage_up_percentage": {
          "1": 0.40,
          "2": 0.80,
          "3": 1.20,
          "4": 1.60,
          "5": 2.00,
        },
        "trigger_every_n_strikes": 4,
        "enemy_damage_down_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20,
        },
        "reduction_duration_turns": 1,
      },
    },
  },
  "exclusive-weapon": {
    name: "Blazebearer",
    levels: [
      {
        level: 1,
        "lancer-lethality": 0.232,
        "lancer-health": 0.232,
        power: 111360,
        skills: {
          expedition: null
        }
      },
      {
        level: 2,
        "lancer-lethality": 0.464,
        "lancer-health": 0.464,
        power: 222720,
        skills: {
          expedition: {
            "skill-name": "Call of the Firefighter",
            "description": "Few troops can remain unmoved by Fred's remarkable heroics, increasing Rally Troops' Attack by 5%.",
            "rally_troops_attack_up_percentage": 0.05,
          }
        }
      },
      {
        level: 3,
        "lancer-lethality": 0.696,
        "lancer-health": 0.696,
        power: 334080,
        skills: {
          expedition: {
            "skill-name": "Call of the Firefighter",
            "description": "Few troops can remain unmoved by Fred's remarkable heroics, increasing Rally Troops' Attack by 5%.",
            "rally_troops_attack_up_percentage": 0.05,
          }
        }
      },
      {
        level: 4,
        "lancer-lethality": 0.928,
        "lancer-health": 0.928,
        power: 445440,
        skills: {
          expedition: {
            "skill-name": "Call of the Firefighter",
            "description": "Few troops can remain unmoved by Fred's remarkable heroics, increasing Rally Troops' Attack by 7.5%.",
            "rally_troops_attack_up_percentage": 0.075,
          }
        }
      },
      {
        level: 5,
        "lancer-lethality": 1.16,
        "lancer-health": 1.16,
        power: 556800,
        skills: {
          expedition: {
            "skill-name": "Call of the Firefighter",
            "description": "Few troops can remain unmoved by Fred's remarkable heroics, increasing Rally Troops' Attack by 7.5%.",
            "rally_troops_attack_up_percentage": 0.075,
          }
        }
      },
      {
        level: 6,
        "lancer-lethality": 1.392,
        "lancer-health": 1.392,
        power: 668160,
        skills: {
          expedition: {
            "skill-name": "Call of the Firefighter",
            "description": "Few troops can remain unmoved by Fred's remarkable heroics, increasing Rally Troops' Attack by 10%.",
            "rally_troops_attack_up_percentage": 0.10,
          }
        }
      },
      {
        level: 7,
        "lancer-lethality": 1.624,
        "lancer-health": 1.624,
        power: 779520,
        skills: {
          expedition: {
            "skill-name": "Call of the Firefighter",
            "description": "Few troops can remain unmoved by Fred's remarkable heroics, increasing Rally Troops' Attack by 10%.",
            "rally_troops_attack_up_percentage": 0.10,
          }
        }
      },
      {
        level: 8,
        "lancer-lethality": 1.856,
        "lancer-health": 1.856,
        power: 890880,
        skills: {
          expedition: {
            "skill-name": "Call of the Firefighter",
            "description": "Few troops can remain unmoved by Fred's remarkable heroics, increasing Rally Troops' Attack by 12.5%.",
            "rally_troops_attack_up_percentage": 0.125,
          }
        }
      },
      {
        level: 9,
        "lancer-lethality": 2.088,
        "lancer-health": 2.088,
        power: 1002240,
        skills: {
          expedition: {
            "skill-name": "Call of the Firefighter",
            "description": "Few troops can remain unmoved by Fred's remarkable heroics, increasing Rally Troops' Attack by 12.5%.",
            "rally_troops_attack_up_percentage": 0.125,
          }
        }
      },
      {
        level: 10,
        "lancer-lethality": 2.32,
        "lancer-health": 2.32,
        power: 1044000,
        skills: {
          expedition: {
            "skill-name": "Call of the Firefighter",
            "description":
              "Few troops can remain unmoved by Fred's remarkable heroics, increasing Rally Troops' Attack by 15%.",
            "rally_troops_attack_up_percentage": 0.15,
          }
        }
      },
    ]
  }
};

export const magnus: Hero = {
  "hero-name": "Magnus",
  "hero-class": "infantry",
  "generation": 9,
  "max-star-power": 3209952,
  "max-skill-power": 101520,
  "max-level-power": 865824,
  "base-stats": {
    "infantry-attack": 9.4075,
    "infantry-defense": 9.4075
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Rapacious",
        "description": "Magnus rouses his troops with brutal intensity, boosting friendly Troop Attack by [5% / 10% / 15% / 20% / 25%].",
        "all_troops_attack_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      },
      "2": {
        "skill-name": "Iron Phalanx",
        "description": "A master of tight formations, Infantry under Magnus' command enjoy a 40% chance of gaining [10% / 20% / 30% / 40% / 50%] Defense when attacking for 1 turn.",
        "infantry_defense_up_percentage": {
          "1": 0.10,
          "2": 0.20,
          "3": 0.30,
          "4": 0.40,
          "5": 0.50
        },
        "trigger_chance": 0.40,
        "duration_turns": 1
      },
      "3": {
        "skill-name": "Iceman",
        "description": "Magnus' intrepid adventuring skills provide a [2% / 4% / 6% / 8% / 10%] reduction in damage versus friendly Infantry while boosting friendly Marksmen damage by [2% / 4% / 6% / 8% / 10%].",
        "infantry_damage_taken_down_percentage": {
          "1": 0.02,
          "2": 0.04,
          "3": 0.06,
          "4": 0.08,
          "5": 0.10
        },
        "marksman_damage_up_percentage": {
          "1": 0.02,
          "2": 0.04,
          "3": 0.06,
          "4": 0.08,
          "5": 0.10
        }
      }
    }
  },
  "exclusive-weapon": {
    name: "Storm Axe",
    levels: [
      {
        level: 1,
        "infantry-lethality": 0.232,
        "infantry-health": 0.232,
        power: 111360,
        skills: {
          expedition: null
        }
      },
      {
        level: 2,
        "infantry-lethality": 0.464,
        "infantry-health": 0.464,
        power: 222720,
        skills: {
          expedition: {
            "skill-name": "Valoric Inspiration",
            "description": "Ever the raconteur, Magnus' tales of Valhalla and ancient heroics inspires Defender Squads with 5% increased Health.",
            "defender_troops_health_up_percentage": 0.05
          }
        }
      },
      {
        level: 3,
        "infantry-lethality": 0.696,
        "infantry-health": 0.696,
        power: 334080,
        skills: {
          expedition: {
            "skill-name": "Valoric Inspiration",
            "description": "Ever the raconteur, Magnus' tales of Valhalla and ancient heroics inspires Defender Squads with 5% increased Health.",
            "defender_troops_health_up_percentage": 0.05
          }
        }
      },
      {
        level: 4,
        "infantry-lethality": 0.928,
        "infantry-health": 0.928,
        power: 445440,
        skills: {
          expedition: {
            "skill-name": "Valoric Inspiration",
            "description": "Ever the raconteur, Magnus' tales of Valhalla and ancient heroics inspires Defender Squads with 7.5% increased Health.",
            "defender_troops_health_up_percentage": 0.075
          }
        }
      },
      {
        level: 5,
        "infantry-lethality": 1.16,
        "infantry-health": 1.16,
        power: 556800,
        skills: {
          expedition: {
            "skill-name": "Valoric Inspiration",
            "description": "Ever the raconteur, Magnus' tales of Valhalla and ancient heroics inspires Defender Squads with 7.5% increased Health.",
            "defender_troops_health_up_percentage": 0.075
          }
        }
      },
      {
        level: 6,
        "infantry-lethality": 1.392,
        "infantry-health": 1.392,
        power: 668160,
        skills: {
          expedition: {
            "skill-name": "Valoric Inspiration",
            "description": "Ever the raconteur, Magnus' tales of Valhalla and ancient heroics inspires Defender Squads with 10% increased Health.",
            "defender_troops_health_up_percentage": 0.10
          }
        }
      },
      {
        level: 7,
        "infantry-lethality": 1.624,
        "infantry-health": 1.624,
        power: 779520,
        skills: {
          expedition: {
            "skill-name": "Valoric Inspiration",
            "description": "Ever the raconteur, Magnus' tales of Valhalla and ancient heroics inspires Defender Squads with 10% increased Health.",
            "defender_troops_health_up_percentage": 0.10
          }
        }
      },
      {
        level: 8,
        "infantry-lethality": 1.856,
        "infantry-health": 1.856,
        power: 890880,
        skills: {
          expedition: {
            "skill-name": "Valoric Inspiration",
            "description": "Ever the raconteur, Magnus' tales of Valhalla and ancient heroics inspires Defender Squads with 12.5% increased Health.",
            "defender_troops_health_up_percentage": 0.125
          }
        }
      },
      {
        level: 9,
        "infantry-lethality": 2.088,
        "infantry-health": 2.088,
        power: 1002240,
        skills: {
          expedition: {
            "skill-name": "Valoric Inspiration",
            "description": "Ever the raconteur, Magnus' tales of Valhalla and ancient heroics inspires Defender Squads with 12.5% increased Health.",
            "defender_troops_health_up_percentage": 0.125
          }
        }
      },
      {
        level: 10,
        "infantry-lethality": 2.32,
        "infantry-health": 2.32,
        power: 1044000,
        skills: {
          expedition: {
            "skill-name": "Valoric Inspiration",
            "description": "Ever the raconteur, Magnus' tales of Valhalla and ancient heroics inspires Defender Squads with 15% increased Health.",
            "defender_troops_health_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const xura: Hero = {
  "hero-name": "Xura",
  "hero-class": "marksman",
  "generation": 9,
  "max-star-power": 3209952,
  "max-skill-power": 101520,
  "max-level-power": 865824,
  "base-stats": {
    "marksman-attack": 9.4075,
    "marksman-defense": 9.4075,
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Fungal Fog",
        "description": "Xura releases an underground fungi that quickly multiplies to block enemy vision, reducing damage dealt to friendly troops by [4% / 8% / 12% / 16% / 20%].",
        "all_troops_damage_taken_down_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20,
        }
      },
      "2": {
        "skill-name": "Piercing Arrow",
        "description": "Being able to identify the weak spots in the enemy's armor, Xura's Marksmen deal [20% / 40% / 60% / 80% / 100%] additional damage every 2 strikes and make their target take [5% / 10% / 15% / 20% / 25%] more damage for 1 turn.",
        "marksman_damage_up_percentage": {
          "1": 0.20,
          "2": 0.40,
          "3": 0.60,
          "4": 0.80,
          "5": 1.00,
        },
        "trigger_every_n_strikes": 2,
        "target_damage_taken_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25,
        },
        "target_damage_taken_duration_turns": 1,
      },
      "3": {
        "skill-name": "Unorthodoxy",
        "description": "Xura's unorthodox tactics are quite disruptive, increasing Marksmen's damage dealt by [3% / 6% / 9% / 12% / 15%] while reducing their damage taken by [2% / 4% / 6% / 8% / 10%].",
        "marksman_damage_up_percentage": {
          "1": 0.03,
          "2": 0.06,
          "3": 0.09,
          "4": 0.12,
          "5": 0.15,
        },
        "marksman_damage_taken_down_percentage": {
          "1": 0.02,
          "2": 0.04,
          "3": 0.06,
          "4": 0.08,
          "5": 0.10,
        },
      },
    }
  },
  "exclusive-weapon": {
    name: "Witch Mask",
    levels: [
      {
        level: 1,
        "marksman-lethality": 0.232,
        "marksman-health": 0.232,
        power: 111360,
        skills: {
          expedition: null
        }
      },
      {
        level: 2,
        "marksman-lethality": 0.464,
        "marksman-health": 0.464,
        power: 222720,
        skills: {
          expedition: {
            "skill-name": "Gaiac Hymn",
            "description": "Xura exhorts the City's Defenders with ancient hymns to Gaia, increasing their Attack by 5%.",
            "defender_troops_attack_up_percentage": 0.05
          }
        }
      },
      {
        level: 3,
        "marksman-lethality": 0.696,
        "marksman-health": 0.696,
        power: 334080,
        skills: {
          expedition: {
            "skill-name": "Gaiac Hymn",
            "description": "Xura exhorts the City's Defenders with ancient hymns to Gaia, increasing their Attack by 5%.",
            "defender_troops_attack_up_percentage": 0.05
          }
        }
      },
      {
        level: 4,
        "marksman-lethality": 0.928,
        "marksman-health": 0.928,
        power: 445440,
        skills: {
          expedition: {
            "skill-name": "Gaiac Hymn",
            "description": "Xura exhorts the City's Defenders with ancient hymns to Gaia, increasing their Attack by 7.5%.",
            "defender_troops_attack_up_percentage": 0.075
          }
        }
      },
      {
        level: 5,
        "marksman-lethality": 1.16,
        "marksman-health": 1.16,
        power: 556800,
        skills: {
          expedition: {
            "skill-name": "Gaiac Hymn",
            "description": "Xura exhorts the City's Defenders with ancient hymns to Gaia, increasing their Attack by 7.5%.",
            "defender_troops_attack_up_percentage": 0.075
          }
        }
      },
      {
        level: 6,
        "marksman-lethality": 1.392,
        "marksman-health": 1.392,
        power: 668160,
        skills: {
          expedition: {
            "skill-name": "Gaiac Hymn",
            "description": "Xura exhorts the City's Defenders with ancient hymns to Gaia, increasing their Attack by 10%.",
            "defender_troops_attack_up_percentage": 0.10
          }
        }
      },
      {
        level: 7,
        "marksman-lethality": 1.624,
        "marksman-health": 1.624,
        power: 779520,
        skills: {
          expedition: {
            "skill-name": "Gaiac Hymn",
            "description": "Xura exhorts the City's Defenders with ancient hymns to Gaia, increasing their Attack by 10%.",
            "defender_troops_attack_up_percentage": 0.10
          }
        }
      },
      {
        level: 8,
        "marksman-lethality": 1.856,
        "marksman-health": 1.856,
        power: 890880,
        skills: {
          expedition: {
            "skill-name": "Gaiac Hymn",
            "description": "Xura exhorts the City's Defenders with ancient hymns to Gaia, increasing their Attack by 12.5%.",
            "defender_troops_attack_up_percentage": 0.125
          }
        }
      },
      {
        level: 9,
        "marksman-lethality": 2.088,
        "marksman-health": 2.088,
        power: 1002240,
        skills: {
          expedition: {
            "skill-name": "Gaiac Hymn",
            "description": "Xura exhorts the City's Defenders with ancient hymns to Gaia, increasing their Attack by 12.5%.",
            "defender_troops_attack_up_percentage": 0.125
          }
        }
      },
      {
        level: 10,
        "marksman-lethality": 2.32,
        "marksman-health": 2.32,
        power: 1044000,
        skills: {
          expedition: {
            "skill-name": "Gaiac Hymn",
            "description": "Xura exhorts the City's Defenders with ancient hymns to Gaia, increasing their Attack by 15%.",
            "defender_troops_attack_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const gregory: Hero = {
  "hero-name": "Gregory",
  "hero-class": "infantry",
  "generation": 10,
  "max-star-power": 3209952,
  "max-skill-power": 101520,
  "max-level-power": 865824,
  "base-stats": {
    "infantry-attack": 11.1088,
    "infantry-defense": 11.1088
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Legion of the Sun",
        "description": "Gregory nurtures latent talents his troops did not realize they had, increasing Attack by 3/6/9/12/15% and Defense by 2/4/6/8/10% for all troops.",
        "all_troops_attack_up_percentage": {
          "1": 0.03,
          "2": 0.06,
          "3": 0.09,
          "4": 0.12,
          "5": 0.15
        },
        "all_troops_defense_up_percentage": {
          "1": 0.02,
          "2": 0.04,
          "3": 0.06,
          "4": 0.08,
          "5": 0.10
        }
      },
      "2": {
        "skill-name": "Charged Assault",
        "description": "Gregory inspires everyone with his valor and enthusiasm, granting all troop's normal attacks a 5/10/15/20/25% chance of dealing critical damage.",
        "crit_rate_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      },
      "3": {
        "skill-name": "Unbroken",
        "description": "Gregory forms unbroken defensive lines, reducing Infantry’s Damage Taken by 4/8/12/16/20%.",
        "infantry_damage_taken_down_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20
        }
      }
    }
  },
  "exclusive-weapon": {
    name: "Solarsword",
    levels: [
      {
        level: 1,
        "infantry-lethality": 0.2775,
        "infantry-health": 0.2775,
        power: 133640,
        skills: { expedition: null }
      },
      {
        level: 2,
        "infantry-lethality": 0.555,
        "infantry-health": 0.555,
        power: 267280,
        skills: {
          expedition: {
            "skill-name": "Day of the Guard",
            "description": "Courage and the will to victory will always surpass mercenary greed. Gregory's leadership increases Defender Troops' Lethality by 5%.",
            "defender_troops_lethality_up_percentage": 0.05
          }
        }
      },
      {
        level: 3,
        "infantry-lethality": 0.8325,
        "infantry-health": 0.8325,
        power: 400920,
        skills: {
          expedition: {
            "skill-name": "Day of the Guard",
            "description": "Courage and the will to victory will always surpass mercenary greed. Gregory's leadership increases Defender Troops' Lethality by 5%.",
            "defender_troops_lethality_up_percentage": 0.05
          }
        }
      },
      {
        level: 4,
        "infantry-lethality": 1.11,
        "infantry-health": 1.11,
        power: 534560,
        skills: {
          expedition: {
            "skill-name": "Day of the Guard",
            "description": "Courage and the will to victory will always surpass mercenary greed. Gregory's leadership increases Defender Troops' Lethality by 7.5%.",
            "defender_troops_lethality_up_percentage": 0.075
          }
        }
      },
      {
        level: 5,
        "infantry-lethality": 1.3875,
        "infantry-health": 1.3875,
        power: 668200,
        skills: {
          expedition: {
            "skill-name": "Day of the Guard",
            "description": "Courage and the will to victory will always surpass mercenary greed. Gregory's leadership increases Defender Troops' Lethality by 7.5%.",
            "defender_troops_lethality_up_percentage": 0.075
          }
        }
      },
      {
        level: 6,
        "infantry-lethality": 1.665,
        "infantry-health": 1.665,
        power: 801840,
        skills: {
          expedition: {
            "skill-name": "Day of the Guard",
            "description": "Courage and the will to victory will always surpass mercenary greed. Gregory's leadership increases Defender Troops' Lethality by 10%.",
            "defender_troops_lethality_up_percentage": 0.10
          }
        }
      },
      {
        level: 7,
        "infantry-lethality": 1.9425,
        "infantry-health": 1.9425,
        power: 935480,
        skills: {
          expedition: {
            "skill-name": "Day of the Guard",
            "description": "Courage and the will to victory will always surpass mercenary greed. Gregory's leadership increases Defender Troops' Lethality by 10%.",
            "defender_troops_lethality_up_percentage": 0.10
          }
        }
      },
      {
        level: 8,
        "infantry-lethality": 2.22,
        "infantry-health": 2.22,
        power: 1069120,
        skills: {
          expedition: {
            "skill-name": "Day of the Guard",
            "description": "Courage and the will to victory will always surpass mercenary greed. Gregory's leadership increases Defender Troops' Lethality by 12.5%.",
            "defender_troops_lethality_up_percentage": 0.125
          }
        }
      },
      {
        level: 9,
        "infantry-lethality": 2.4975,
        "infantry-health": 2.4975,
        power: 1202760,
        skills: {
          expedition: {
            "skill-name": "Day of the Guard",
            "description": "Courage and the will to victory will always surpass mercenary greed. Gregory's leadership increases Defender Troops' Lethality by 12.5%.",
            "defender_troops_lethality_up_percentage": 0.125
          }
        }
      },
      {
        level: 10,
        "infantry-lethality": 2.775,
        "infantry-health": 2.775,
        power: 1253250,
        skills: {
          expedition: {
            "skill-name": "Day of the Guard",
            "description": "Courage and the will to victory will always surpass mercenary greed. Gregory's leadership increases Defender Troops' Lethality by 15% (max).",
            "defender_troops_lethality_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const blanchette: Hero = {
  "hero-name": "Blanchette",
  "hero-class": "marksman",
  "generation": 10,
  "max-star-power": 3209952,
  "max-skill-power": 101520,
  "max-level-power": 865824,
  "base-stats": {
    "marksman-attack": 11.1088,
    "marksman-defense": 11.1088
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Armed to the Teeth",
        "description": "Blanchette works to ensure her forces are at least as well armed as she is, increasing all Troops' Lethality by 5/10/15/20/25%.",
        "all_troops_lethality_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      },
      "2": {
        "skill-name": "Blood Hunter",
        "description": "Blanchette's Marksmen fire a crystal blade every 3 rounds, dealing 15/30/45/60/75% extra damage to the targets.",
        "extra_damage_up_percentage": {
          "1": 0.15,
          "2": 0.30,
          "3": 0.45,
          "4": 0.60,
          "5": 0.75
        },
        "trigger_every_n_rounds": 3
      },
      "3": {
        "skill-name": "Crimson Sniper",
        "description": "Thanks to Blanchette's expertise in the art of sniping and her leadership, her Marksmen deal 8/16/24/32/40% extra damage to enemy Lancers and 4/8/12/16/20% extra damage to enemy Marksmen every 2 strikes.",
        "marksman_damage_to_lancer_up_percentage": {
          "1": 0.08,
          "2": 0.16,
          "3": 0.24,
          "4": 0.32,
          "5": 0.40
        },
        "marksman_damage_to_marksman_up_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20
        },
        "trigger_every_n_strikes": 2
      }
    }
  },
  "exclusive-weapon": {
    name: "Wolf Hunter",
    levels: [
      {
        level: 1,
        "marksman-lethality": 0.2775,
        "marksman-health": 0.2775,
        power: 133640,
        skills: { expedition: null }
      },
      {
        level: 2,
        "marksman-lethality": 0.555,
        "marksman-health": 0.555,
        power: 267280,
        skills: {
          expedition: {
            "skill-name": "Lightning Strike",
            "description": "Enemy formations have no chance against Blanchette's lightning fast Rally, increasing Rally Troops’ Lethality by 5%.",
            "rally_troops_lethality_up_percentage": 0.05
          }
        }
      },
      {
        level: 3,
        "marksman-lethality": 0.8325,
        "marksman-health": 0.8325,
        power: 400920,
        skills: {
          expedition: {
            "skill-name": "Lightning Strike",
            "description": "Enemy formations have no chance against Blanchette's lightning fast Rally, increasing Rally Troops’ Lethality by 5%.",
            "rally_troops_lethality_up_percentage": 0.05
          }
        }
      },
      {
        level: 4,
        "marksman-lethality": 1.11,
        "marksman-health": 1.11,
        power: 534560,
        skills: {
          expedition: {
            "skill-name": "Lightning Strike",
            "description": "Enemy formations have no chance against Blanchette's lightning fast Rally, increasing Rally Troops’ Lethality by 7.5%.",
            "rally_troops_lethality_up_percentage": 0.075
          }
        }
      },
      {
        level: 5,
        "marksman-lethality": 1.3875,
        "marksman-health": 1.3875,
        power: 668200,
        skills: {
          expedition: {
            "skill-name": "Lightning Strike",
            "description": "Enemy formations have no chance against Blanchette's lightning fast Rally, increasing Rally Troops’ Lethality by 7.5%.",
            "rally_troops_lethality_up_percentage": 0.075
          }
        }
      },
      {
        level: 6,
        "marksman-lethality": 1.665,
        "marksman-health": 1.665,
        power: 801840,
        skills: {
          expedition: {
            "skill-name": "Lightning Strike",
            "description": "Enemy formations have no chance against Blanchette's lightning fast Rally, increasing Rally Troops’ Lethality by 10%.",
            "rally_troops_lethality_up_percentage": 0.10
          }
        }
      },
      {
        level: 7,
        "marksman-lethality": 1.9425,
        "marksman-health": 1.9425,
        power: 935480,
        skills: {
          expedition: {
            "skill-name": "Lightning Strike",
            "description": "Enemy formations have no chance against Blanchette's lightning fast Rally, increasing Rally Troops’ Lethality by 10%.",
            "rally_troops_lethality_up_percentage": 0.10
          }
        }
      },
      {
        level: 8,
        "marksman-lethality": 2.22,
        "marksman-health": 2.22,
        power: 1069120,
        skills: {
          expedition: {
            "skill-name": "Lightning Strike",
            "description": "Enemy formations have no chance against Blanchette's lightning fast Rally, increasing Rally Troops’ Lethality by 12.5%.",
            "rally_troops_lethality_up_percentage": 0.125
          }
        }
      },
      {
        level: 9,
        "marksman-lethality": 2.4975,
        "marksman-health": 2.4975,
        power: 1202760,
        skills: {
          expedition: {
            "skill-name": "Lightning Strike",
            "description": "Enemy formations have no chance against Blanchette's lightning fast Rally, increasing Rally Troops’ Lethality by 12.5%.",
            "rally_troops_lethality_up_percentage": 0.125
          }
        }
      },
      {
        level: 10,
        "marksman-lethality": 2.775,
        "marksman-health": 2.775,
        power: 1253250,
        skills: {
          expedition: {
            "skill-name": "Lightning Strike",
            "description": "Enemy formations have no chance against Blanchette's lightning fast Rally, increasing Rally Troops’ Lethality by 15% (max).",
            "rally_troops_lethality_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const freya: Hero = {
  "hero-name": "Freya",
  "hero-class": "lancer",
  "generation": 10,
  "max-star-power": 3209952,
  "max-skill-power": 101520,
  "max-level-power": 865824,
  "base-stats": {
    "lancer-attack": 11.1088,
    "lancer-defense": 11.1088
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Fog of War",
        "description": "Freya lobs a smoke grenade to darken enemies' vision, reducing all enemy Troops' Attack by [4%/8%/12%/16%/20%].",
        "enemy_attack_down_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20
        }
      },
      "2": {
        "skill-name": "Blood Moon Scythe",
        "description": "After launching a normal attack, she has a 50% chance of performing Reap, dealing [20%/40%/60%/80%/100%] damage.",
        "extra_damage_up_percentage": {
          "1": 0.20,
          "2": 0.40,
          "3": 0.60,
          "4": 0.80,
          "5": 1.00
        },
        "trigger_chance": 0.50
      },
      "3": {
        "skill-name": "Night's Vengeance",
        "description": "Decreases damage taken and increases damage dealt for her Infantries and Marksmen by [3%/6%/9%/12%/15%].",
        "infantry_damage_taken_down_percentage": {
          "1": 0.03,
          "2": 0.06,
          "3": 0.09,
          "4": 0.12,
          "5": 0.15
        },
        "marksman_damage_taken_down_percentage": {
          "1": 0.03,
          "2": 0.06,
          "3": 0.09,
          "4": 0.12,
          "5": 0.15
        },
        "infantry_damage_up_percentage": {
          "1": 0.03,
          "2": 0.06,
          "3": 0.09,
          "4": 0.12,
          "5": 0.15
        },
        "marksman_damage_up_percentage": {
          "1": 0.03,
          "2": 0.06,
          "3": 0.09,
          "4": 0.12,
          "5": 0.15
        }
      }
    }
  },
  "exclusive-weapon": {
    name: "Blood Moon Scythe",
    levels: [
      {
        level: 1,
        "lancer-lethality": 0.2775,
        "lancer-health": 0.2775,
        power: 133640,
        skills: { expedition: null }
      },
      {
        level: 2,
        "lancer-lethality": 0.555,
        "lancer-health": 0.555,
        power: 267280,
        skills: {
          expedition: {
            "skill-name": "Defender of the Watch",
            "description": "Freya's eyes have never wavered from her sacred watch-task, increasing Defender Troops’ Defense by 5%.",
            "defender_troops_defense_up_percentage": 0.05
          }
        }
      },
      {
        level: 3,
        "lancer-lethality": 0.8325,
        "lancer-health": 0.8325,
        power: 400920,
        skills: {
          expedition: {
            "skill-name": "Defender of the Watch",
            "description": "Freya's eyes have never wavered from her sacred watch-task, increasing Defender Troops’ Defense by 5%.",
            "defender_troops_defense_up_percentage": 0.05
          }
        }
      },
      {
        level: 4,
        "lancer-lethality": 1.11,
        "lancer-health": 1.11,
        power: 534560,
        skills: {
          expedition: {
            "skill-name": "Defender of the Watch",
            "description": "Freya's eyes have never wavered from her sacred watch-task, increasing Defender Troops’ Defense by 7.5%.",
            "defender_troops_defense_up_percentage": 0.075
          }
        }
      },
      {
        level: 5,
        "lancer-lethality": 1.3875,
        "lancer-health": 1.3875,
        power: 668200,
        skills: {
          expedition: {
            "skill-name": "Defender of the Watch",
            "description": "Freya's eyes have never wavered from her sacred watch-task, increasing Defender Troops’ Defense by 7.5%.",
            "defender_troops_defense_up_percentage": 0.075
          }
        }
      },
      {
        level: 6,
        "lancer-lethality": 1.665,
        "lancer-health": 1.665,
        power: 801840,
        skills: {
          expedition: {
            "skill-name": "Defender of the Watch",
            "description": "Freya's eyes have never wavered from her sacred watch-task, increasing Defender Troops’ Defense by 10%.",
            "defender_troops_defense_up_percentage": 0.10
          }
        }
      },
      {
        level: 7,
        "lancer-lethality": 1.9425,
        "lancer-health": 1.9425,
        power: 935480,
        skills: {
          expedition: {
            "skill-name": "Defender of the Watch",
            "description": "Freya's eyes have never wavered from her sacred watch-task, increasing Defender Troops’ Defense by 10%.",
            "defender_troops_defense_up_percentage": 0.10
          }
        }
      },
      {
        level: 8,
        "lancer-lethality": 2.22,
        "lancer-health": 2.22,
        power: 1069120,
        skills: {
          expedition: {
            "skill-name": "Defender of the Watch",
            "description": "Freya's eyes have never wavered from her sacred watch-task, increasing Defender Troops’ Defense by 12.5%.",
            "defender_troops_defense_up_percentage": 0.125
          }
        }
      },
      {
        level: 9,
        "lancer-lethality": 2.4975,
        "lancer-health": 2.4975,
        power: 1202760,
        skills: {
          expedition: {
            "skill-name": "Defender of the Watch",
            "description": "Freya's eyes have never wavered from her sacred watch-task, increasing Defender Troops’ Defense by 12.5%.",
            "defender_troops_defense_up_percentage": 0.125
          }
        }
      },
      {
        level: 10,
        "lancer-lethality": 2.775,
        "lancer-health": 2.775,
        power: 1253250,
        skills: {
          expedition: {
            "skill-name": "Defender of the Watch",
            "description": "Freya's eyes have never wavered from her sacred watch-task, increasing Defender Troops’ Defense by 15%(max).",
            "defender_troops_defense_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const eleonora: Hero = {
  "hero-name": "Eleonora",
  "hero-class": "infantry",
  "generation": 11,
  "max-star-power": 3209952,
  "max-skill-power": 101520,
  "max-level-power": 865824,
  "base-stats": {
    "infantry-attack": 12.8102,
    "infantry-defense": 12.8102
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Scorching Sun",
        "description": "Eleonora inspires all troops with her royal aura and sense of honor, increasing their Health by 5/10/15/20/25%.",
        "all_troops_health_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      },
      "2": {
        "skill-name": "Solaris Nexus",
        "description": "Eleonora deploys a balanced formation, reducing damage taken by 2/4/6/8/10% for her Infantries and increasing damage dealt by 2/4/6/8/10% for her Marksmen.",
        "infantry_damage_taken_down_percentage": {
          "1": 0.02,
          "2": 0.04,
          "3": 0.06,
          "4": 0.08,
          "5": 0.10
        },
        "marksman_damage_up_percentage": {
          "1": 0.02,
          "2": 0.04,
          "3": 0.06,
          "4": 0.08,
          "5": 0.10
        }
      },
      "3": {
        "skill-name": "Soaring Flame",
        "description": "Eleonora strikes fear into her enemies with her fierce assaults, increasing all troops' damage dealt by 5/10/15/20/25% and reducing their damage taken by 5/10/15/20/25% every 5 attacks made by Infantry for 2 turns.",
        "all_troops_damage_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        },
        "all_troops_damage_taken_down_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        },
        "trigger_every_n_attacks": 5,
        "duration_turns": {
          "1": 2,
          "2": 2,
          "3": 2,
          "4": 2,
          "5": 2
        }
      }
    }
  },
  "exclusive-weapon": {
    name: "Scepter of Solaris",
    levels: [
      {
        level: 1,
        "infantry-lethality": 0.32,
        "infantry-health": 0.32,
        power: 150525,
        skills: { expedition: null }
      },
      {
        level: 2,
        "infantry-lethality": 0.64,
        "infantry-health": 0.64,
        power: 301050,
        skills: {
          expedition: {
            "skill-name": "Last Fortress",
            "description": "Eleonora fights every battle like her last, inspiring Defender Troops and increasing their Health by 7.5%.",
            "defender_troops_health_up_percentage": 0.075
          }
        }
      },
      {
        level: 3,
        "infantry-lethality": 0.96,
        "infantry-health": 0.96,
        power: 451575,
        skills: {
          expedition: {
            "skill-name": "Last Fortress",
            "description": "Eleonora fights every battle like her last, inspiring Defender Troops and increasing their Health by 7.5%.",
            "defender_troops_health_up_percentage": 0.075
          }
        }
      },
      {
        level: 4,
        "infantry-lethality": 1.28,
        "infantry-health": 1.28,
        power: 602100,
        skills: {
          expedition: {
            "skill-name": "Last Fortress",
            "description": "Eleonora fights every battle like her last, inspiring Defender Troops and increasing their Health by 10%.",
            "defender_troops_health_up_percentage": 0.10
          }
        }
      },
      {
        level: 5,
        "infantry-lethality": 1.60,
        "infantry-health": 1.60,
        power: 752625,
        skills: {
          expedition: {
            "skill-name": "Last Fortress",
            "description": "Eleonora fights every battle like her last, inspiring Defender Troops and increasing their Health by 10%.",
            "defender_troops_health_up_percentage": 0.10
          }
        }
      },
      {
        level: 6,
        "infantry-lethality": 1.92,
        "infantry-health": 1.92,
        power: 903150,
        skills: {
          expedition: {
            "skill-name": "Last Fortress",
            "description": "Eleonora fights every battle like her last, inspiring Defender Troops and increasing their Health by 12.5%.",
            "defender_troops_health_up_percentage": 0.125
          }
        }
      },
      {
        level: 7,
        "infantry-lethality": 2.24,
        "infantry-health": 2.24,
        power: 1053675,
        skills: {
          expedition: {
            "skill-name": "Last Fortress",
            "description": "Eleonora fights every battle like her last, inspiring Defender Troops and increasing their Health by 12.5%.",
            "defender_troops_health_up_percentage": 0.125
          }
        }
      },
      {
        level: 8,
        "infantry-lethality": 2.56,
        "infantry-health": 2.56,
        power: 1204200,
        skills: {
          expedition: {
            "skill-name": "Last Fortress",
            "description": "Eleonora fights every battle like her last, inspiring Defender Troops and increasing their Health by 15% (max level).",
            "defender_troops_health_up_percentage": 0.15
          }
        }
      },
      {
        level: 9,
        "infantry-lethality": 2.88,
        "infantry-health": 2.88,
        power: 1354725,
        skills: {
          expedition: {
            "skill-name": "Last Fortress",
            "description": "Eleonora fights every battle like her last, inspiring Defender Troops and increasing their Health by 15% (max level).",
            "defender_troops_health_up_percentage": 0.15
          }
        }
      },
      {
        level: 10,
        "infantry-lethality": 3.20,
        "infantry-health": 3.20,
        power: 1505250,
        skills: {
          expedition: {
            "skill-name": "Last Fortress",
            "description": "Eleonora fights every battle like her last, inspiring Defender Troops and increasing their Health by 15% (max level).",
            "defender_troops_health_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const lloyd: Hero = {
  "hero-name": "Lloyd",
  "hero-class": "lancer",
  "generation": 11,
  "max-star-power": 3209952,
  "max-skill-power": 101520,
  "max-level-power": 865824,
  "base-stats": {
    "lancer-attack": 12.8102,
    "lancer-defense": 12.8102
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Bird Invasion",
        "description": "Lloyd summons a large number of mechanical birds to disrupt enemies, reducing their Lethality by 4/8/12/16/20%.",
        "enemy_lethality_down_percentage": {
          "1": 0.04,
          "2": 0.08,
          "3": 0.12,
          "4": 0.16,
          "5": 0.20
        }
      },
      "2": {
        "skill-name": "Iceflare Bomb",
        "description": "Lloyd prepares special bomb for all Lancers, which detonates every 3 turns, increases their attack by 30/60/90/120/150% and releases frosty mist that reduces enemy Lethality by 6/12/18/24/30% for 1 turn.",
        "lancer_attack_up_percentage": {
          "1": 0.30,
          "2": 0.60,
          "3": 0.90,
          "4": 1.20,
          "5": 1.50
        },
        "enemy_lethality_down_percentage": {
          "1": 0.06,
          "2": 0.12,
          "3": 0.18,
          "4": 0.24,
          "5": 0.30
        },
        "trigger_every_n_turns": 3,
        "duration_turns": {
          "1": 1,
          "2": 1,
          "3": 1,
          "4": 1,
          "5": 1
        }
      },
      "3": {
        "skill-name": "Ingenious Mastery",
        "description": "Lloyd works to equips his forces with unstable by interesting creations, granting a 40% chance to increase all Troops' Lethality by 10/20/30/40/50%.",
        "all_troops_lethality_up_percentage": {
          "1": 0.10,
          "2": 0.20,
          "3": 0.30,
          "4": 0.40,
          "5": 0.50
        },
        "trigger_chance": 0.40
      }
    }
  },
  "exclusive-weapon": {
    name: "Mastercraft Treasure",
    levels: [
      {
        level: 1,
        "lancer-lethality": 0.32,
        "lancer-health": 0.32,
        power: 150525,
        skills: { expedition: null }
      },
      {
        level: 2,
        "lancer-lethality": 0.64,
        "lancer-health": 0.64,
        power: 301050,
        skills: {
          expedition: {
            "skill-name": "Steel Maze",
            "description": "Lloyd installs traps on the barricade to assist in the defense, increasing Defender Troops' Attack by 7.5%.",
            "defender_troops_attack_up_percentage": 0.075
          }
        }
      },
      {
        level: 3,
        "lancer-lethality": 0.96,
        "lancer-health": 0.96,
        power: 451575,
        skills: {
          expedition: {
            "skill-name": "Steel Maze",
            "description": "Lloyd installs traps on the barricade to assist in the defense, increasing Defender Troops' Attack by 7.5%.",
            "defender_troops_attack_up_percentage": 0.075
          }
        }
      },
      {
        level: 4,
        "lancer-lethality": 1.28,
        "lancer-health": 1.28,
        power: 602100,
        skills: {
          expedition: {
            "skill-name": "Steel Maze",
            "description": "Lloyd installs traps on the barricade to assist in the defense, increasing Defender Troops' Attack by 10%.",
            "defender_troops_attack_up_percentage": 0.10
          }
        }
      },
      {
        level: 5,
        "lancer-lethality": 1.60,
        "lancer-health": 1.60,
        power: 752625,
        skills: {
          expedition: {
            "skill-name": "Steel Maze",
            "description": "Lloyd installs traps on the barricade to assist in the defense, increasing Defender Troops' Attack by 10%.",
            "defender_troops_attack_up_percentage": 0.10
          }
        }
      },
      {
        level: 6,
        "lancer-lethality": 1.92,
        "lancer-health": 1.92,
        power: 903150,
        skills: {
          expedition: {
            "skill-name": "Steel Maze",
            "description": "Lloyd installs traps on the barricade to assist in the defense, increasing Defender Troops' Attack by 12.5%.",
            "defender_troops_attack_up_percentage": 0.125
          }
        }
      },
      {
        level: 7,
        "lancer-lethality": 2.24,
        "lancer-health": 2.24,
        power: 1053675,
        skills: {
          expedition: {
            "skill-name": "Steel Maze",
            "description": "Lloyd installs traps on the barricade to assist in the defense, increasing Defender Troops' Attack by 12.5%.",
            "defender_troops_attack_up_percentage": 0.125
          }
        }
      },
      {
        level: 8,
        "lancer-lethality": 2.56,
        "lancer-health": 2.56,
        power: 1204200,
        skills: {
          expedition: {
            "skill-name": "Steel Maze",
            "description": "Lloyd installs traps on the barricade to assist in the defense, increasing Defender Troops' Attack by 15% (max level).",
            "defender_troops_attack_up_percentage": 0.15
          }
        }
      },
      {
        level: 9,
        "lancer-lethality": 2.88,
        "lancer-health": 2.88,
        power: 1354725,
        skills: {
          expedition: {
            "skill-name": "Steel Maze",
            "description": "Lloyd installs traps on the barricade to assist in the defense, increasing Defender Troops' Attack by 15% (max level).",
            "defender_troops_attack_up_percentage": 0.15
          }
        }
      },
      {
        level: 10,
        "lancer-lethality": 3.20,
        "lancer-health": 3.20,
        power: 1505250,
        skills: {
          expedition: {
            "skill-name": "Steel Maze",
            "description": "Lloyd installs traps on the barricade to assist in the defense, increasing Defender Troops' Attack by 15% (max level).",
            "defender_troops_attack_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const rufus: Hero = {
  "hero-name": "Rufus",
  "hero-class": "marksman",
  "generation": 11,
  "max-star-power": 3209952,
  "max-skill-power": 101520,
  "max-level-power": 865824,
  "base-stats": {
    "marksman-attack": 12.8102,
    "marksman-defense": 12.8102
  },
  "skills": {
    expedition: {
      "1": {
        "skill-name": "Inferno Regiment",
        "description": "Rufus uses his bold leadership to transform all troops into blazing flames on the battlefield, increasing their Attack by 5/10/15/20/25%.",
        "all_troops_attack_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        }
      },
      "2": {
        "skill-name": "Armor Crush",
        "description": "Rufus equips his Marksmen with armor-piercing rounds, increasing his Infantries' damage dealt per attack by 12/24/36/48/60% and the target's damage taken by 5/10/15/20/25% for 1 turn.",
        "infantry_damage_up_percentage": {
          "1": 0.12,
          "2": 0.24,
          "3": 0.36,
          "4": 0.48,
          "5": 0.60
        },
        "enemy_damage_taken_up_percentage": {
          "1": 0.05,
          "2": 0.10,
          "3": 0.15,
          "4": 0.20,
          "5": 0.25
        },
        "target_damage_taken_duration_turns": 1
      },
      "3": {
        "skill-name": "Wrathful Quake",
        "description": "Rufus' aggressive combat style grants all troops a 20% chance to intimidate enemies, reducing their Lethality by 10/20/30/40/50% for 2 turns.",
        "enemy_lethality_down_percentage": {
          "1": 0.10,
          "2": 0.20,
          "3": 0.30,
          "4": 0.40,
          "5": 0.50
        },
        "trigger_chance": 0.20,
        "duration_turns": {
          "1": 2,
          "2": 2,
          "3": 2,
          "4": 2,
          "5": 2
        }
      }
    }
  },
  "exclusive-weapon": {
    name: "Meteor Blaster",
    levels: [
      {
        level: 1,
        "marksman-lethality": 0.32,
        "marksman-health": 0.32,
        power: 150525,
        skills: { expedition: null }
      },
      {
        level: 2,
        "marksman-lethality": 0.64,
        "marksman-health": 0.64,
        power: 301050,
        skills: {
          expedition: {
            "skill-name": "Ember of Conflict",
            "description": "Rufus' normal attacks shoot scorching bullets that set the target on fire, dealing Attack*15% damage per second for 2s.",
            "normal_attack_damage_up_percentage": 0.15,
            "dot_duration_seconds": 2
          }
        }
      },
      {
        level: 3,
        "marksman-lethality": 0.96,
        "marksman-health": 0.96,
        power: 451575,
        skills: {
          expedition: {
            "skill-name": "Ember of Conflict",
            "description": "Rufus' normal attacks shoot scorching bullets that set the target on fire, dealing Attack*15% damage per second for 2s.",
            "normal_attack_damage_up_percentage": 0.15,
            "dot_duration_seconds": 2
          }
        }
      },
      {
        level: 4,
        "marksman-lethality": 1.28,
        "marksman-health": 1.28,
        power: 602100,
        skills: {
          expedition: {
            "skill-name": "Ember of Conflict",
            "description": "Rufus' normal attacks shoot scorching bullets that set the target on fire, dealing Attack*22.5% damage per second for 2s.",
            "normal_attack_damage_up_percentage": 0.225,
            "dot_duration_seconds": 2
          }
        }
      },
      {
        level: 5,
        "marksman-lethality": 1.60,
        "marksman-health": 1.60,
        power: 752625,
        skills: {
          expedition: {
            "skill-name": "Ember of Conflict",
            "description": "Rufus' normal attacks shoot scorching bullets that set the target on fire, dealing Attack*22.5% damage per second for 2s.",
            "normal_attack_damage_up_percentage": 0.225,
            "dot_duration_seconds": 2
          }
        }
      },
      {
        level: 6,
        "marksman-lethality": 1.92,
        "marksman-health": 1.92,
        power: 903150,
        skills: {
          expedition: {
            "skill-name": "Blazing Legion",
            "description": "Rufus rallies his troops under his phoenix banner, increasing their Attack by 10%.",
            "all_troops_attack_up_percentage": 0.10
          }
        }
      },
      {
        level: 7,
        "marksman-lethality": 2.24,
        "marksman-health": 2.24,
        power: 1053675,
        skills: {
          expedition: {
            "skill-name": "Blazing Legion",
            "description": "Rufus rallies his troops under his phoenix banner, increasing their Attack by 10%.",
            "all_troops_attack_up_percentage": 0.10
          }
        }
      },
      {
        level: 8,
        "marksman-lethality": 2.56,
        "marksman-health": 2.56,
        power: 1204200,
        skills: {
          expedition: {
            "skill-name": "Blazing Legion",
            "description": "Rufus rallies his troops under his phoenix banner, increasing their Attack by 12.5%.",
            "all_troops_attack_up_percentage": 0.125
          }
        }
      },
      {
        level: 9,
        "marksman-lethality": 2.88,
        "marksman-health": 2.88,
        power: 1354725,
        skills: {
          expedition: {
            "skill-name": "Blazing Legion",
            "description": "Rufus rallies his troops under his phoenix banner, increasing their Attack by 12.5%.",
            "all_troops_attack_up_percentage": 0.125
          }
        }
      },
      {
        level: 10,
        "marksman-lethality": 3.20,
        "marksman-health": 3.20,
        power: 1505250,
        skills: {
          expedition: {
            "skill-name": "Blazing Legion",
            "description": "Rufus rallies his troops under his phoenix banner, increasing their Attack by 15% (max level).",
            "all_troops_attack_up_percentage": 0.15
          }
        }
      }
    ]
  }
};

export const HEROES: Hero[] = [
  bahiti,
  gina,
  jassar,
  jessie,
  patrick,
  seo_yoon,
  sergey,
  lumak_bokan,
  ling_xue,
  jeronimo,
  molly,
  natalia,
  zinman,
  alonso,
  flint,
  philly,
  greg,
  logan,
  mia,
  ahmose,
  lynn,
  reina,
  gwen,
  hector,
  norah,
  renee,
  wayne,
  wu_ming,
  bradley,
  edith,
  gordon,
  gatot,
  hendrik,
  sonya,
  fred,
  magnus,
  xura,
  gregory,
  blanchette,
  freya,
  eleonora,
  lloyd,
  rufus
];

const buildClassBuckets = (): Record<HeroClass, Hero[]> => ({
  infantry: [],
  marksman: [],
  lancer: []
});

export const HERO_BY_NAME: Record<string, Hero> = HEROES.reduce((acc, hero) => {
  acc[hero["hero-name"].toLowerCase()] = hero;
  return acc;
}, {} as Record<string, Hero>);

export const HEROES_BY_CLASS: Record<HeroClass, Hero[]> = HEROES.reduce(
  (acc, hero) => {
    acc[hero["hero-class"]].push(hero);
    return acc;
  },
  buildClassBuckets()
);

export const HEROES_BY_GENERATION: Record<number, Hero[]> = HEROES.reduce(
  (acc, hero) => {
    if (!acc[hero.generation]) {
      acc[hero.generation] = [];
    }
    acc[hero.generation].push(hero);
    return acc;
  },
  {} as Record<number, Hero[]>
);
