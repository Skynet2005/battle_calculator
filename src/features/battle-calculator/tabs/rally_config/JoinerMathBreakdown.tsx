'use client';

import { getHeroByName } from '@/domain/battle';
import { getHeroExpeditionSkills, getHeroSkillLevelOptions } from '@/domain/battle/data-selectors';
import type { SkillLevel } from '@/domain/battle/data/heroes/hero_types';
import type { RallyHero } from '@/shared/types';
import { useMemo } from 'react';

export interface JoinerMathBreakdownProps {
  joiners: RallyHero[];
}

export function JoinerMathBreakdown({ joiners }: JoinerMathBreakdownProps) {
  const breakdown = useMemo(() => {
    const firstFourJoiners = joiners.slice(0, 4);
    const details: Array<{
      heroName: string;
      skillName: string;
      skillLevel: number;
      skillType: string | null;
      bonusValue: number;
      reason?: string;
    }> = [];

    const bonusesByType: Record<string, number[]> = {
      damage: [],
      attack: [],
      defense: [],
      health: [],
      lethality: [],
      damageReduction: [],
    };

    const categorizeSkillType = (skillData: Record<string, unknown>): string | null => {
      const keys = Object.keys(skillData).map(key => key.toLowerCase());
      const damageIncreaseKeywords = [
        'damage_dealt_increase',
        'damage_boost',
        'damage_percentage',
        'damage_increase',
        'additional_damage',
        'skill_damage_increase',
        'skill_damage_up',
        'normal_attack_damage_up',
        'target_damage_taken_increase',
        'target_damage_taken_up',
        'target_damage_taken_up_percentage',
        'all_troops_damage_up',
        'dot_percentage',
        'damage_per_turn',
        'defense_reduction'
      ];
      const damageReductionKeywords = [
        'damage_reduction',
        'damage_taken_reduction',
        'damage_taken_decrease',
        'damage_received_reduction',
        'damage_resistance',
        'damage_taken',
        'damage_received',
        'damage_from_attacks_reduction',
        'damage_from_skills_reduction',
        'enemy_damage_dealt_reduction',
        'enemy_attack_reduction',
        'lethality_reduction',
      ];

      if (keys.some(k => damageIncreaseKeywords.some(keyword => k.includes(keyword)))) {
        return 'damage';
      }
      if (keys.some(k => damageReductionKeywords.some(keyword => k.includes(keyword)))) {
        return 'damageReduction';
      }
      if (keys.some(k => k.includes('attack_increase') || k.includes('attack_bonus'))) return 'attack';
      if (keys.some(k => k.includes('defense_increase') || k.includes('defense_bonus'))) return 'defense';
      if (keys.some(k => k.includes('health_increase') || k.includes('health_bonus'))) return 'health';
      if (keys.some(k => k.includes('lethality_increase') || k.includes('lethality_bonus'))) return 'lethality';
      return null;
    };

    const extractBonusValues = (skillData: Record<string, unknown>, levelToUse: number): Record<string, number> => {
      const result: Record<string, number> = {
        damage: 0,
        attack: 0,
        defense: 0,
        health: 0,
        lethality: 0,
        damageReduction: 0,
      };

      const addValue = (type: keyof typeof result, amount: number) => {
        result[type] += amount;
      };

      Object.keys(skillData).forEach(key => {
        if (key === 'skill-name' || key === 'description' || key === 'trigger_chance') return;
        const value = skillData[key];
        const numericValue = (() => {
          if (typeof value === 'object' && value !== null) {
            const levelObj = value as Record<string, unknown>;
            const levelValue = levelObj[levelToUse.toString()] ?? levelObj['1'];
            return typeof levelValue === 'number' ? levelValue : 0;
          }
          if (typeof value === 'number') {
            return value;
          }
          return 0;
        })();
        if (numericValue === 0) return;

        const pct = numericValue * 100;
        const lower = key.toLowerCase();

        if (lower.includes('percentage')) {
          if (lower.includes('reduction') || lower.includes('taken') || lower.includes('received')) {
            addValue('damageReduction', pct);
            return;
          }
          if (lower.includes('damage')) {
            addValue('damage', pct);
            return;
          }
          if (lower.includes('attack')) {
            addValue('attack', pct);
            return;
          }
          if (lower.includes('defense')) {
            addValue('defense', pct);
            return;
          }
          if (lower.includes('health')) {
            addValue('health', pct);
            return;
          }
          if (lower.includes('lethality')) {
            addValue('lethality', pct);
            return;
          }
        }

        const isDamageIncrease =
          lower.includes('damage_increase') ||
          lower.includes('damage_dealt_increase') ||
          lower.includes('damage_boost') ||
          lower.includes('damage_percentage') ||
          lower.includes('additional_damage') ||
          lower.includes('skill_damage_increase') ||
          lower.includes('skill_damage_up') ||
          lower.includes('normal_attack_damage_up') ||
          lower.includes('target_damage_taken_increase') ||
          lower.includes('target_damage_taken_up') ||
          lower.includes('all_troops_damage_up') ||
          lower.includes('dot_percentage') ||
          lower.includes('damage_per_turn') ||
          lower.includes('defense_reduction') ||
          lower.includes('extra_damage_up') ||
          lower.includes('enemy_damage_taken_up');

        const isDamageReduction =
          lower.includes('damage_taken_down') ||
          lower.includes('damage_reduction') ||
          lower.includes('damage_received_reduction') ||
          lower.includes('damage_resistance') ||
          lower.includes('damage_from_attacks_reduction') ||
          lower.includes('damage_from_skills_reduction') ||
          lower.includes('damage_taken_decrease') ||
          lower.includes('enemy_damage_down') ||
          lower.includes('enemy_attack_down') ||
          lower.includes('enemy_attack_reduction') ||
          lower.includes('lethality_reduction');

        if (isDamageIncrease) {
          addValue('damage', pct);
          return;
        }
        if (isDamageReduction) {
          addValue('damageReduction', pct);
          return;
        }
        if (lower.includes('attack_up') || lower.includes('attack_increase') || lower.includes('attack_bonus')) {
          addValue('attack', pct);
          return;
        }
        if (lower.includes('defense_up') || lower.includes('defense_increase') || lower.includes('defense_bonus')) {
          addValue('defense', pct);
          return;
        }
        if (lower.includes('health_up') || lower.includes('health_increase') || lower.includes('health_bonus')) {
          addValue('health', pct);
          return;
        }
        if (lower.includes('lethality_increase') || lower.includes('lethality_bonus')) {
          addValue('lethality', pct);
        }
      });

      return result;
    };

    const extractControlChance = (skillData: Record<string, unknown>, levelToUse: number): number => {
      let chance = 0;
      Object.keys(skillData).forEach(key => {
        const lower = key.toLowerCase();
        const value = skillData[key];
        const numericValue = (() => {
          if (typeof value === 'object' && value !== null) {
            const levelObj = value as Record<string, unknown>;
            const levelValue = levelObj[levelToUse.toString()] ?? levelObj['1'];
            return typeof levelValue === 'number' ? levelValue : 0;
          }
          if (typeof value === 'number') return value;
          return 0;
        })();
        if (numericValue === 0) return;
        if (lower.includes('immobilize') || lower.includes('stun')) {
          chance += numericValue * 100;
        }
      });
      return chance;
    };

    firstFourJoiners.forEach((joiner) => {
      if (!joiner.heroName) return;

      const hero = getHeroByName(joiner.heroName);
      if (!hero) return;

      const skills = getHeroExpeditionSkills(hero);
      if (skills.length === 0) return;

      const firstSkill = skills[0];
      const skillData = firstSkill.data;
      if (!skillData) return;

      let maxLevel = 1;
      Object.keys(skillData).forEach(key => {
        if (key === 'skill-name' || key === 'description' || key === 'trigger_chance') return;
        const value = skillData[key];
        if (typeof value === 'object' && value !== null) {
          const levelKeys = Object.keys(value)
            .filter(k => !isNaN(parseInt(k)))
            .map(k => parseInt(k))
            .sort((a, b) => b - a);
          if (levelKeys.length > 0 && levelKeys[0] > maxLevel) {
            maxLevel = levelKeys[0];
          }
        }
      });

      let skillType = categorizeSkillType(skillData);
      if (!skillType) {
        const keys = Object.keys(skillData).map((k) => k.toLowerCase());
        const hasDamageReduction = keys.some((k) =>
          k.includes('damage_reduction') ||
          k.includes('damage_taken') ||
          k.includes('damage_received') ||
          k.includes('damage_from_attacks_reduction') ||
          k.includes('damage_from_skills_reduction') ||
          k.includes('damage_resistance') ||
          k.includes('enemy_damage_dealt_reduction') ||
          k.includes('enemy_attack_reduction') ||
          k.includes('lethality_reduction')
        );
        const hasDamageIncrease = keys.some((k) =>
          k.includes('damage_dealt_increase') ||
          k.includes('damage_boost') ||
          k.includes('damage_percentage') ||
          k.includes('damage_increase') ||
          k.includes('additional_damage') ||
          k.includes('skill_damage_increase') ||
          k.includes('target_damage_taken_increase') ||
          k.includes('dot_percentage') ||
          k.includes('damage_per_turn') ||
          k.includes('defense_reduction')
        );
        if (hasDamageReduction) {
          skillType = 'damageReduction';
        } else if (hasDamageIncrease) {
          skillType = 'damage';
        }
      }

      const selectedLevel = (joiner.skillLevels?.[firstSkill.name] as SkillLevel | undefined) ?? maxLevel;

      const bonusValues = extractBonusValues(skillData, selectedLevel);
      const contributionEntries = Object.entries(bonusValues).filter(([, v]) => v > 0) as Array<[keyof typeof bonusValues, number]>;
      if (contributionEntries.length === 0) {
        const controlChance = extractControlChance(skillData, selectedLevel);
        if (controlChance > 0) {
          details.push({
            heroName: joiner.heroName,
            skillName: (skillData['skill-name'] as string) || firstSkill.name,
            skillLevel: selectedLevel,
            skillType: 'Control',
            bonusValue: controlChance,
            reason: `Control: Stun/immobilize chance +${controlChance.toFixed(2)}% (informational; not included in ATK/DMG stacking).`,
          });
          return;
        }

        details.push({
          heroName: joiner.heroName,
          skillName: (skillData['skill-name'] as string) || firstSkill.name,
          skillLevel: selectedLevel,
          skillType,
          bonusValue: 0,
          reason: 'Skill does not grant a percentage-based attack/defense/health/lethality/damage bonus.',
        });
        return;
      }

      contributionEntries.forEach(([type, value]) => {
        bonusesByType[type].push(value);
      });

      const formatTypeLabel = (type?: string | null) => {
        if (!type) return 'Unknown';
        if (type === 'damageReduction') return 'Damage Reduction';
        if (type === 'multi') return 'Multi';
        return type.charAt(0).toUpperCase() + type.slice(1);
      };

      const summary = contributionEntries
        .map(([type, value]) => `${formatTypeLabel(type)} +${value.toFixed(2)}%`)
        .join(' | ');
      const typeLabel = contributionEntries.length === 1 ? formatTypeLabel(contributionEntries[0][0]) : summary;

      details.push({
        heroName: joiner.heroName,
        skillName: (skillData['skill-name'] as string) || firstSkill.name,
        skillLevel: selectedLevel,
        skillType: typeLabel,
        bonusValue: contributionEntries.reduce((sum, [, v]) => sum + v, 0),
        reason: summary
      });
    });

    const totalsByType: Record<string, number> = {};
    Object.keys(bonusesByType).forEach(type => {
      if (bonusesByType[type].length > 0) {
        totalsByType[type] = bonusesByType[type].reduce((sum, val) => sum + val, 0);
      }
    });

    return { details, totalsByType, bonusesByType };
  }, [joiners]);

  const formatSkillTypeLabel = (type?: string | null) => {
    if (!type) return 'Unknown';
    if (type === 'damageReduction') return 'Damage Reduction';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (breakdown.details.length === 0) {
    return null;
  }

  return (
    <div className="card info-card mt-6">
      <h4>Joiner Bonus Calculations</h4>
      <p className="text-sm text-gray-400 dark:text-gray-400 mb-4">
        Showing calculations for the first {breakdown.details.length} joiner(s). Each uses their first expedition skill at the configured level (defaults to that hero's max if not set).
      </p>

      <div className="callout callout-success text-sm space-y-2">
        <strong>Stacking Rules:</strong>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Same Skill Type → Additive:</strong> If two joiners have the same type (e.g., both +DMG), their bonuses add together (10% + 25% = 35%)</li>
          <li><strong>Different Skill Types → Multiplicative:</strong> If joiners have different types (e.g., +DMG and +ATK), they multiply (Base × 1.25 × 1.10)</li>
        </ul>
      </div>

      {breakdown.details.map((detail, index) => (
        <div key={index} className="card info-card bg-slate-900/40 dark:bg-slate-900/40 border border-white/10 mb-4">
          <div className="font-bold mb-2">
            Joiner {index + 1}: {detail.heroName}
          </div>
          <div className="text-sm text-gray-400 dark:text-gray-400 mb-2">
            Skill: <strong>{detail.skillName}</strong> (Level {detail.skillLevel})
          </div>
          {detail.bonusValue > 0 ? (
            <div className="text-sm">
              <div className="ml-4">
                Type: <strong>{formatSkillTypeLabel(detail.skillType)}</strong> | Bonus: <strong>+{detail.bonusValue.toFixed(2)}%</strong>
              </div>
            </div>
          ) : (
            <div className="text-sm text-amber-200 dark:text-amber-200 ml-4">
              {detail.reason || 'This skill does not provide a measurable combat bonus for rallies.'}
            </div>
          )}
        </div>
      ))}

      <div className="card info-card border-2 border-blue-500/40 mt-6 space-y-3">
        <div className="font-bold">Stacking Calculation:</div>
        <div className="text-sm space-y-2">
          {Object.entries(breakdown.totalsByType).map(([type, total]) => {
            const bonuses = breakdown.bonusesByType[type] || [];
            const typeLabel = type === 'damageReduction'
              ? 'Damage Reduction'
              : type.charAt(0).toUpperCase() + type.slice(1);

            if (bonuses.length === 1) {
              return (
                <div key={type} className="ml-4 mb-1">
                  <strong>{typeLabel}:</strong> +{Number(total).toFixed(2)}% (single joiner)
                </div>
              );
            } else {
              return (
                <div key={type} className="ml-4 mb-1">
                  <strong>{typeLabel}:</strong> {bonuses.map((b) => `${Number(b).toFixed(2)}%`).join(' + ')} = <strong>+{Number(total).toFixed(2)}%</strong> (additive stacking)
                </div>
              );
            }
          })}
        </div>
        {Object.keys(breakdown.totalsByType).length > 1 && (
          <div className="callout callout-info text-sm space-y-2">
            <strong>Different Types Multiply:</strong> Since you have {Object.keys(breakdown.totalsByType).length} different skill types, they will multiply together in the final calculation.
            <div className="font-mono text-xs space-y-2">
              <div>Final = Base × {Object.entries(breakdown.totalsByType).map(([, total]) =>
                `(1 + ${Number(total).toFixed(2)}%)`
              ).join(' × ')}</div>
              <div>
                Final = 1 × {Object.entries(breakdown.totalsByType).map(([, total]) => {
                  const multiplier = 1 + (Number(total) / 100);
                  return `${multiplier.toFixed(4)}`;
                }).join(' × ')}
              </div>
              <div className="font-bold text-blue-200">
                Final = {(() => {
                  const base = 1;
                  const final = Object.values(breakdown.totalsByType).reduce((acc, total) => {
                    return acc * (1 + Number(total) / 100);
                  }, base);
                  return `${final.toFixed(4)} (${(final * 100).toFixed(2)}%)`;
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
