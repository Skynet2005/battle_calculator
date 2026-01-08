import type { SkillLevel } from '@/domain/battle';
import type { ExpeditionSkill } from './HeroSelector.model';

export default function HeroSkillsList({
  skills,
  skillLevels,
  onChangeSkillLevel,
  disabled,
  heroName,
}: {
  skills: ExpeditionSkill[];
  skillLevels: Record<string, SkillLevel>;
  heroName: string;
  onChangeSkillLevel: (heroName: string, skillName: string, level: number) => void;
  disabled?: boolean;
}) {
  if (skills.length === 0) return null;

  return (
    <div className="hero-skill-list">
      {skills.map((skill) => {
        const current = (skillLevels[skill.name] ?? 5) as SkillLevel;

        return (
          <div key={skill.name} className="hero-skill-row">
            <div>
              <div className="hero-skill-name">{skill.name}</div>
              {skill.description && <div className="hero-skill-description">{skill.description}</div>}
            </div>

            <div className="form-group mb-0">
              <label className="text-xs text-gray-400 dark:text-gray-400 mb-1 block">Level</label>
              <input
                type="number"
                min="1"
                max="5"
                value={current}
                onChange={(e) => {
                  const num = parseInt(e.target.value, 10);
                  onChangeSkillLevel(heroName, skill.name, Number.isNaN(num) ? current : num);
                }}
                className="w-20"
                disabled={disabled}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
