export type TroopType = "infantry" | "lancer" | "marksman";

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
