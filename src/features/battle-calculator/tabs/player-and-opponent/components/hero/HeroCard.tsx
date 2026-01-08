import type { Hero } from '@/domain/battle';
import type { HeroLevel } from '@/shared/types';
import ExclusiveWeaponRow from './ExclusiveWeaponRow';
import HeroPowerSummary from './HeroPowerSummary';
import type { ExpeditionSkill, HeroPowerComponents } from './HeroSelector.model';
import HeroSkillsList from './HeroSkillsList';
import StarLevelPicker from './StarLevelPicker';

export default function HeroCard({
  hero,
  heroLevel,
  skills,
  power,

  onSetStarLevel,
  onSetXpLevel,
  onSetSkillLevel,
  onSetWeaponLevel,
}: {
  hero: Hero;
  heroLevel: HeroLevel;
  skills: ExpeditionSkill[];
  power: HeroPowerComponents;

  onSetStarLevel: (next: number) => void;
  onSetXpLevel: (next: number) => void;
  onSetSkillLevel: (skillName: string, next: number) => void;
  onSetWeaponLevel: (next: number, maxLevel: number) => void;
}) {
  const isOwned = heroLevel.starLevel > 0;
  const heroName = hero['hero-name'];
  const currentWeaponLevel = heroLevel.exclusiveWeaponLevel ?? 0;

  return (
    <div
      className={`card bg-slate-700/50 dark:bg-slate-700/50 p-4 flex flex-row items-start gap-6 w-full ${!isOwned ? 'opacity-50' : ''
        }`}
    >
      <HeroPowerSummary hero={hero} power={power} />

      <div className="flex flex-col gap-4 flex-1">
        {/* Star + XP */}
        <div className="flex gap-5 items-start flex-wrap">
          <StarLevelPicker
            starLevel={heroLevel.starLevel}
            onSetStarLevel={onSetStarLevel}
            onReset={() => onSetStarLevel(0)}
          />

          <div className="form-group flex-1 min-w-[150px]">
            <label className="text-sm text-gray-300 dark:text-gray-300 mb-1 block">XP Level</label>
            <input
              type="number"
              min="0"
              max="80"
              value={heroLevel.xpLevel}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '') {
                  onSetXpLevel(0);
                  return;
                }
                const num = parseInt(v, 10);
                if (!isNaN(num)) onSetXpLevel(num);
              }}
              className="w-full"
            />
          </div>
        </div>

        {/* Skills */}
        <HeroSkillsList
          heroName={heroName}
          skills={skills}
          skillLevels={heroLevel.skillLevels}
          onChangeSkillLevel={(_, skillName, lvl) => onSetSkillLevel(skillName, lvl)}
          disabled={!isOwned}
        />

        {/* Weapon */}
        <ExclusiveWeaponRow
          hero={hero}
          currentWeaponLevel={currentWeaponLevel}
          onChangeWeaponLevel={onSetWeaponLevel}
          disabled={!isOwned}
        />
      </div>
    </div>
  );
}
