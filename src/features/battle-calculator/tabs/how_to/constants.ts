// Battle mechanics and game information constants
export const basicBattleInfo = [
  {
    title: 'Formation',
    icon: '⚔️',
    items: [
      'Infantry, as primary damage takers, are positioned in the front row.',
      'Lancers, as mobile units, are positioned in the middle row.',
      'Marksmen, providing the highest single-target damage, are positioned in the back row.'
    ]
  },
  {
    title: 'Process',
    icon: '🔄',
    items: [
      'Expedition battles are turn-based. Once initiated, each turn sees both sides selecting targets and attacking simultaneously. After all units have completed their actions and damage is tallied, the next turn begins.',
      'The battle ends when all troops of one side are defeated, declaring the other side the winner.'
    ]
  },
  {
    title: 'Target Selection',
    icon: '🎯',
    items: [
      'Normally, units attack the enemy\'s front row first. When the front row is eliminated, they target the next row.',
      'Lancers sometimes activate skills to directly attack enemy Marksmen in the back row.',
      'Some hero skills can target all units or specific unit types.'
    ]
  },
  {
    title: 'Outcome',
    icon: '📊',
    items: [
      'Different types of battles have varying casualty rates. After each battle, the number of dead, severely injured, lightly injured, and survivors is calculated based on the type of battle.',
      'For example, in player City battles, 35% of the attacker\'s casualties die; in Sunfire Castle battles, all casualties go to the Infirmary until it\'s full, and then any further casualties die.'
    ]
  },
  {
    title: 'Hero Skills',
    icon: '🦸',
    items: [
      'If a squad includes a hero, their expedition skills are activated (some skills are probability-based), regardless of whether the squad has the matching type of troops.',
      'Hero skills function independently of the stats listed in the battle report.'
    ]
  },
  {
    title: 'Rally & Garrison',
    icon: '🏰',
    items: [
      'Rally battles differ from solo battles mainly in the number of troops involved and skills activated. Besides the 9 hero skills of the rally initiator, only the FIRST expedition skill of each rally member is included (up to 4 joiners).',
      'IMPORTANT: For bear hunting rallies, joiners contribute ONLY their first expedition skill - subsequent skills on the same hero are completely ignored.',
      'In garrison battles, the player with the highest stat bonuses is chosen as the source of defense bonuses. Additionally, 4 primary hero skills from other garrison members are activated for the battle.'
    ]
  },
  {
    title: 'Pre-Battle Strategy',
    icon: '📋',
    items: [
      'Troop composition: You can choose different ratios of unit types to ensure enough Infantry to absorb damage, allowing units in the back row more room to deal damage and increasing your chances of victory.'
    ]
  }
];

export const killDescriptions = [
  {
    term: 'Her/His Troop',
    description: 'Boost only the troop led by the hero (One Troop Only).',
    icon: '👤'
  },
  {
    term: 'All friendly troops',
    description: 'Boost the other two troops.',
    icon: '👥'
  },
  {
    term: 'All Troops',
    description: 'Boost three troops.',
    icon: '👨‍👩‍👧‍👦'
  },
  {
    term: 'Defender Troop/Rally Troop',
    description: 'Boost three troops (For exclusive gear skills).',
    icon: '🛡️'
  }
];

export const expeditionModeInfo = [
  {
    text: 'Expedition mode uses turn-based combat, where both sides cast skills simultaneously within one turn.',
    icon: '⚡'
  },
  {
    text: 'Therefore, 1 turn equals 1 second.',
    icon: '⏱️'
  }
];

export const joinerFaqs = [
  {
    tier: 'S Tier',
    description: 'MAXIMUM IMPACT - All-troops offensive boosts affecting 91% marksmen (bear hunting army composition)',
    heroes: 'Reina (10-30% all attack), Jeronimo (5-25% all damage), Jessie (5-25% all damage), Jasser (5-25% all damage), Seo-yoon (5-25% all attack), Sonya (4-20% all damage), Magnus (5-25% all damage), Blanchette (5-25% all lethality), Bradley (5-25% all attack)',
    color: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
  },
  {
    tier: 'S- Tier',
    description: 'Strong utility - enemy debuffs (bears don\'t damage attackers, but debuffs still affect bear)',
    heroes: 'Logan (4-20% enemy attack down), Hendrik (Gen 5 all damage 5-25%)',
    color: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25'
  },
  {
    tier: 'A Tier',
    description: 'Moderate impact - offensive skills with limitations (chance-based or partial army coverage)',
    heroes: 'Alonso (10-50% all lethality, 40% chance), Greg (5-25% all damage), Lynn (1-5% marksman attack/3 strikes), Philly (3-15% all attack + 2-10% defense), Renee (marksman damage)',
    color: 'bg-amber-500/20 text-amber-200 border-amber-400/30'
  },
  {
    tier: 'B Tier',
    description: 'Limited impact - low army percentage or unreliable effects',
    heroes: 'Wayne (burst damage), Flint (20-100% infantry damage = 1% army impact), Mia (10-50% enemy damage taken, 50% chance), Gwen (5-25% enemy damage taken), Gordon (lancer damage), Gregory (infantry damage)',
    color: 'bg-orange-500/20 text-orange-200 border-orange-400/30'
  },
  {
    tier: 'NOT FOR BEAR HUNTING',
    description: 'DEFENSIVE SKILLS - Useless for bear hunting since bears deal no damage to attackers',
    heroes: 'Ahmose/Molly/Natalia/Sergey/Bahiti/Hector/Edith/Norah/Wu Ming (all damage reduction/defense skills)',
    color: 'bg-gray-500/20 text-gray-200 border-gray-400/30'
  }
];

export const joinerSpecificNotes = [
  {
    text: 'BEAR HUNTING REALITY: Bears deal ZERO damage to attackers! All defensive skills (damage reduction, defense boosts) are COMPLETELY USELESS.',
    type: 'danger' as const
  },
  {
    text: 'CRITICAL TROOP COMPOSITION: Bear hunting = ~1% Infantry / ~8% Lancer / ~91% Marksman. Only offensive skills matter!',
    type: 'danger' as const
  },
  {
    text: 'S-TIER DOMINANCE: All S-tier heroes boost offensive stats (damage/attack/lethality) for ALL troops. Pure damage dealers for bear hunting.',
    type: 'info' as const
  },
  {
    text: 'DEFENSIVE SKILLS REMOVED: Ahmose, Hector, Natalia, Molly, Sergey, Bahiti, Edith, Norah, Wu Ming - all provide ZERO value in bear hunting.',
    type: 'warning' as const
  },
  {
    text: 'Flint WORTHLESS FOR BEARS: Infantry damage boost affects ~1% of army. Bears don\'t care about your infantry strength.',
    type: 'warning' as const
  },
  {
    text: 'Logan QUESTIONABLE: Enemy attack reduction is useless if bears don\'t attack. Only kept for potential utility in mixed battles.',
    type: 'warning' as const
  },
  {
    text: 'Philly DECENT: Attack boost (3-15%) affects entire army - at least provides some offensive value despite defense component.',
    type: 'info' as const
  },
  {
    text: 'Alonso POWERFUL: Lethality boost hugely amplifies damage calculations, despite 40% chance - worth the risk for potential payoff.',
    type: 'info' as const
  },
  {
    text: 'ONLY OFFENSIVE SKILLS COUNT: Damage dealt ↑, Attack ↑, Lethality ↑. Everything else is irrelevant for bear hunting.',
    type: 'info' as const
  }
];

export const heroGearInfo = [
  {
    text: 'This is an important part of how well the troops will perform in combat. The gear that the player Rally Lead heroes are wearing will effect the bonuses that the troops they lead will get. So all of the gear each type hero wears will give bonus lethality and health to either the Infantry, Lancers, or Marksmen in the Rally capacity.',
    type: 'info' as const
  },
  {
    text: 'Prerequisite for Empowering for legendary gear:',
    type: 'important' as const,
    subItems: [
      'Level 1 (unlock legendary gear) - Mastery 10',
      'Level 20 - Mastery 11',
      'Level 40 - Mastery 12',
      'Level 60 - Mastery 13',
      'Level 80 - Mastery 14',
      'Level 100 - Mastery 15'
    ]
  }
];

export const dataFlowOverview = [
  'Rally Config sets the scaffold first: leaders/joiners, capacity stacks, and troop mix for both sides.',
  'Player/Opponent tabs then supply permanent stats that become SideBaseStats applied to the rally scaffold.',
  'Fight simulation iterates BattleRound → Fight, applying morale, type advantage, DOT, and control effects each round.',
  'Results tab visualizes totals, special bonuses, capacity deltas, and per-hit math via the Damage Calculation Debug panel.'
];

export const interpretationTips = [
  'Troop Mix Quick Editor accepts any percentages; the sim normalizes internally but the UI keeps your raw inputs for clarity.',
  'Special Bonuses table is additive-only; multiplicative sources (city, pet skills) stay inside the stat pipeline per Whiteout rules.',
  'Capacity Comparison highlights manual overrides; if totals look off, trace each line item rather than adjusting results.',
  'Damage Calculation Debug chips map directly to the guide\'s formula: Offense ÷ Mitigation = troop losses.',
  'Battle Analysis now charts defender casualties per turn; spikes point to skill bursts or targeting changes—expand turns to see the exact math.'
];

export const diminishingReturnsGuide = [
  'Damage uses √(troops) per hit: doubling bodies gives ~1.41× power at large rally sizes, not 2×.',
  'Examples: 1k→4k ≈ 2× power; 10k→20k ≈ 1.41×. Each extra troop contributes less than the one before.',
  'Stat gains (Attack, Lethality, Defense, HP, tier) beat raw count once you are at 300k+ marches or rallies.',
  'Test at realistic march sizes; 1–2k troop trials understate losses because √ scaling accelerates with size.'
];

export const damageFoundationPoints = [
  'Damage = Coefficient × √(Troops) × Attack × Lethality ÷ Enemy Defense (mirrors the Damage Calculation Debug chips).',
  'Coefficient captures hidden troop-type/tier/Fire Crystal factors; √(Troops) encodes diminishing returns.',
  'Attack and Lethality push offense; Enemy Defense and HP absorb it; troop count helps but asymptotically.'
];

export const statInfluence = [
  { stat: 'Attack', note: 'Boosts raw outgoing damage.', icon: '⚡' },
  { stat: 'Lethality', note: 'Cuts through enemy defense.', icon: '🗡️' },
  { stat: 'Defense', note: 'Reduces incoming damage.', icon: '🛡️' },
  { stat: 'Health (HP)', note: 'Increases survivability across hits.', icon: '❤️' },
  { stat: 'Troop Count', note: 'Adds strength with diminishing returns via √(troops).', icon: '👥' }
];

