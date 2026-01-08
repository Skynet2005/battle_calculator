export const STAR_COUNT = 5;
export const SEGMENTS_PER_STAR = 6;
export const MAX_STAR_LEVEL = STAR_COUNT * SEGMENTS_PER_STAR; // 30
export const MAX_XP_LEVEL = 80;

export type ActiveSection = 'heroes' | 'heroGear';
export type HeroClassKey = 'infantry' | 'lancer' | 'marksman';

export function toHeroClassKey(heroClass: string): HeroClassKey | null {
  const cls = heroClass.toLowerCase();
  if (cls === 'infantry' || cls === 'lancer' || cls === 'marksman') return cls;
  return null;
}

export function getSkillLevelFromStarLevel(starLevel: number): number {
  const completeStars = Math.floor(starLevel / SEGMENTS_PER_STAR);
  return Math.min(5, Math.max(1, completeStars + 1));
}
