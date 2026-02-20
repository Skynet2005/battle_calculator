/**
 * Rally Composition Section
 *
 * Displays hero leaders and joiners for both player and opponent sides.
 */

import type { HeroSelection } from '@/domain/battle';
import { getHeroByName, getHeroExpeditionSkills } from '@/domain/battle';
import { SectionCard } from '@/shared/ui';
import type { BattleSideContext } from '@/features/battle-calculator/model/types';
import { TROOP_TYPES, type TroopType } from '@/features/battle-calculator/model/types';

function getFirstSkillInfo(heroName?: string | null) {
  if (!heroName) return null;
  const hero = getHeroByName(heroName);
  if (!hero) return null;
  const skills = getHeroExpeditionSkills(hero);
  if (!skills.length) return null;
  const first = skills[0];
  const skillData = first.data as Record<string, unknown> | null | undefined;
  if (!skillData || typeof skillData !== 'object') return null;
  let maxLevel = 1;
  Object.keys(skillData).forEach((key) => {
    const val = skillData[key];
    if (typeof val === 'object' && val !== null) {
      const levels = Object.keys(val).filter((k) => !isNaN(Number(k))).map(Number);
      if (levels.length) {
        maxLevel = Math.max(maxLevel, Math.max(...levels));
      }
    }
  });
  const skillName = typeof skillData['skill-name'] === 'string' ? skillData['skill-name'] : first.name;
  return { name: skillName, level: maxLevel };
}

function formatHeroMeta(hero?: HeroSelection | null) {
  if (!hero) return null;
  const stars = hero.starLevel !== undefined ? `★${Math.max(0, Math.round(hero.starLevel / 5 - 1))}` : null;
  const level = `Lv ${hero.xpLevel ?? 80}`;
  return [stars, level].filter(Boolean).join(' · ');
}

interface RallyCompositionProps {
  player: BattleSideContext;
  opponent: BattleSideContext;
}

export function RallyComposition({ player, opponent }: RallyCompositionProps) {
  return (
    <SectionCard
      title="Rally Composition"
      className="mt-6"
      collapsible
      defaultCollapsed={true}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <HeroColumn label={player.label} leaders={player.leaders} joiners={player.joiners} />
        <HeroColumn label={opponent.label} leaders={opponent.leaders} joiners={opponent.joiners} />
      </div>
    </SectionCard>
  );
}

function HeroColumn({
  label,
  leaders,
  joiners,
}: {
  label: string;
  leaders: Partial<Record<TroopType, HeroSelection | null>>;
  joiners: HeroSelection[];
}) {
  return (
    <div>
      <div className="text-sm font-semibold mb-2">{label}</div>
      <div className="border border-white/10 rounded-lg p-3">
        <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Leaders</div>
        <div className="space-y-2">
          {TROOP_TYPES.map((type) => {
            const hero = leaders[type];
            return (
              <div key={`leader-${label}-${type}`} className="flex justify-between text-sm">
                <span className="font-semibold capitalize">{type}</span>
                {hero ? (
                  <span className="text-right text-xs text-gray-300">
                    {hero.heroName}
                    {formatHeroMeta(hero) ? ` · ${formatHeroMeta(hero)}` : ''}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">None</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="text-xs uppercase tracking-wide text-gray-400 mt-4 mb-2">Joiners (first 4 active)</div>
        <div className="space-y-2">
          {joiners.slice(0, 4).map((joiner, index) => {
            const skillInfo = getFirstSkillInfo(joiner.heroName);
            return (
              <div
                key={`joiner-${label}-${joiner.heroName}-${index}`}
                className="text-xs text-gray-300 flex justify-between"
              >
                <span>{joiner.heroName}</span>
                <div className="text-right">
                  <div>{formatHeroMeta(joiner) || '—'}</div>
                  <div className="text-[11px] text-gray-500">
                    {skillInfo ? `${skillInfo.name} - Lv ${skillInfo.level}` : 'Skill: —'}
                  </div>
                </div>
              </div>
            );
          })}
          {joiners.length === 0 && <div className="text-xs text-gray-500">No joiners configured</div>}
        </div>
      </div>
    </div>
  );
}
