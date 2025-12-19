export interface WarAcademyTech {
  name: string;
  effect: string;
  type?: string;
  level: {
    [key: string]: number;
  };
}

export interface WarAcademyData {
  War_Academy_tech: WarAcademyTech[];
}
