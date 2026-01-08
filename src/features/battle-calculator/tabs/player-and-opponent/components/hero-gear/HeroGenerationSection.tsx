import type { Hero } from '@/domain/battle';
import type { HeroLevel } from '@/shared/types';
import HeroCard from '../hero/HeroCard';
import type { ExpeditionSkill, HeroPowerComponents } from '../hero/HeroSelector.model';

export default function HeroGenerationSection({
  generation,
  heroes,

  getHeroLevelData,
  getSkillsForHero,
  calculatePower,

  onUpdateStarLevel,
  onUpdateXpLevel,
  onUpdateSkillLevel,
  onUpdateWeaponLevel,
}: {
  generation: number;
  heroes: Hero[];

  getHeroLevelData: (heroName: string) => HeroLevel;
  getSkillsForHero: (hero: Hero) => ExpeditionSkill[];
  calculatePower: (hero: Hero, heroLevel: HeroLevel) => HeroPowerComponents;

  onUpdateStarLevel: (heroName: string, next: number) => void;
  onUpdateXpLevel: (heroName: string, next: number) => void;
  onUpdateSkillLevel: (heroName: string, skillName: string, next: number) => void;
  onUpdateWeaponLevel: (heroName: string, next: number, maxLevel: number) => void;
}) {
  return (
    <div className="mb-8">
      <h4 className="mb-4 text-lg font-semibold">
        Generation {generation} ({heroes.length} {heroes.length === 1 ? 'Hero' : 'Heroes'})
      </h4>

      <div className="flex flex-col gap-3 mb-6">
        {heroes.map((hero) => {
          const heroName = hero['hero-name'];
          const heroLevel = getHeroLevelData(heroName);
          const skills = getSkillsForHero(hero);
          const power = calculatePower(hero, heroLevel);

          return (
            <HeroCard
              key={heroName}
              hero={hero}
              heroLevel={heroLevel}
              skills={skills}
              power={power}
              onSetStarLevel={(next) => onUpdateStarLevel(heroName, next)}
              onSetXpLevel={(next) => onUpdateXpLevel(heroName, next)}
              onSetSkillLevel={(skillName, next) => onUpdateSkillLevel(heroName, skillName, next)}
              onSetWeaponLevel={(next, maxLevel) => onUpdateWeaponLevel(heroName, next, maxLevel)}
            />
          );
        })}
      </div>
    </div>
  );
}
