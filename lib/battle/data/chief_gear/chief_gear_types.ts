export interface ChiefGearEntry {
  Tier: string;
  Stars: number;
  Step?: number;
  Attack: string;
  Defense: string;
  ["Power Total"]: number;
  ["March Capacity"]?: number;
}

export type ChiefGearType = "Cap" | "Coat" | "Ring" | "Watch" | "Pants" | "Weapon";

export type ChiefGearData = {
  [K in ChiefGearType]: ChiefGearEntry[];
};
