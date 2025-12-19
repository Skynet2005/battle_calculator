'use client';

import { useMemo } from 'react';
import { getHeroByName } from '../../../lib/battle';
import { getHeroExpeditionSkills } from '../../../lib/battle/data-selectors';
import type { RallyConfiguration } from '../../types';
import { SectionCard } from '../../ui';

interface RallyJoinerFormulaProps {
  rally: RallyConfiguration;
}

export default function RallyJoinerFormula({ rally }: RallyJoinerFormulaProps) {
  const joiners = rally.joiners ?? [];

  const joinerBonuses = useMemo(() => {
    const bonuses = {
      attack: 0,
      defense: 0,
      lethality: 0,
      health: 0,
      all_troops_attack: 0,
      all_troops_defense: 0,
      all_troops_lethality: 0,
      all_troops_health: 0,
      rally_troops_attack: 0,
      rally_troops_lethality: 0,
      rally_troops_health: 0,
    };

    // Only process the first 4 joiners
    const firstFourJoiners = joiners.slice(0, 4);

    firstFourJoiners.forEach((joiner, index) => {
      if (!joiner.heroName) return;

      const hero = getHeroByName(joiner.heroName);
      if (!hero) return;

      const skills = getHeroExpeditionSkills(hero);
      if (skills.length === 0) return;

      // Only process the first skill
      const firstSkill = skills[0];
      const skillData = firstSkill.data;
      if (!skillData) return;

      // Find the maximum skill level for this skill
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

      // Use maximum skill level
      const level = maxLevel;

      // Extract bonuses from skill at maximum level
      // Check for level-based properties
      Object.keys(skillData).forEach(key => {
        if (key === 'skill-name' || key === 'description') return;

        const value = skillData[key];
        if (typeof value === 'object' && value !== null) {
          // It's a level-based object
          const levelValue = value[level.toString()] || value['1'];
          if (typeof levelValue === 'number') {
            const percentage = levelValue * 100;

            // Map skill properties to bonuses
            if (key.includes('attack_increase') && key.includes('all_troops')) {
              bonuses.all_troops_attack += percentage;
            } else if (key.includes('defense_increase') && key.includes('all_troops')) {
              bonuses.all_troops_defense += percentage;
            } else if (key.includes('health_increase') && key.includes('all_troops')) {
              bonuses.all_troops_health += percentage;
            } else if (key.includes('attack_increase') && key.includes('rally')) {
              bonuses.rally_troops_attack += percentage;
            } else if (key.includes('health_increase') && key.includes('rally')) {
              bonuses.rally_troops_health += percentage;
            } else if (key.includes('lethality') && key.includes('rally')) {
              bonuses.rally_troops_lethality += percentage;
            } else if (key.includes('attack_increase') && !key.includes('all_troops') && !key.includes('rally')) {
              bonuses.attack += percentage;
            } else if (key.includes('defense_increase') && !key.includes('all_troops')) {
              bonuses.defense += percentage;
            } else if (key.includes('health_increase') && !key.includes('all_troops') && !key.includes('rally')) {
              bonuses.health += percentage;
            } else if (key.includes('lethality') && !key.includes('rally')) {
              bonuses.lethality += percentage;
            }
          }
        } else if (typeof value === 'number') {
          // Direct percentage value
          const percentage = value * 100;
          if (key.includes('attack_increase') && key.includes('all_troops')) {
            bonuses.all_troops_attack += percentage;
          } else if (key.includes('defense_increase') && key.includes('all_troops')) {
            bonuses.all_troops_defense += percentage;
          } else if (key.includes('health_increase') && key.includes('all_troops')) {
            bonuses.all_troops_health += percentage;
          } else if (key.includes('attack_increase') && key.includes('rally')) {
            bonuses.rally_troops_attack += percentage;
          } else if (key.includes('health_increase') && key.includes('rally')) {
            bonuses.rally_troops_health += percentage;
          } else if (key.includes('lethality') && key.includes('rally')) {
            bonuses.rally_troops_lethality += percentage;
          }
        }
      });
    });

    return bonuses;
  }, [joiners]);

  return (
    <SectionCard
      title="Rally Joiner Formula & Bonuses"
      className="mt-4"
    >

      <div className="space-y-2 mb-4">
        <h4>How Rally Joiners Work:</h4>
        <ul className="list-disc pl-5 text-sm text-gray-300 dark:text-gray-300 space-y-1">
          <li>Up to <strong>4 joiners</strong> can be added to a rally</li>
          <li>Only the <strong>first 4 joiners</strong> contribute bonuses</li>
          <li>Each joiner uses their <strong>first expedition skill</strong> at its <strong>highest available skill level</strong></li>
          <li>Joiners contribute bonuses that are <strong>added to the additive bonuses</strong></li>
          <li>Leader heroes use their <strong>full skill levels</strong> and contribute to basic bonuses</li>
        </ul>
      </div>

      <div className="mb-4">
        <h4>Formula:</h4>
        <div className="callout callout-muted font-mono text-sm mt-2">
          <div><strong>Final Stats =</strong></div>
          <div className="ml-4 mt-1">
            [(Basic Bonuses + Joiner Bonuses + Other Additive Bonuses)] × Multiplicative Bonuses
          </div>
        </div>
      </div>

      {joiners.length > 0 ? (
        <div>
          <h4>Current Joiner Bonuses (First 4 Joiners, First Skill at Max Level):</h4>
          {joiners.length > 4 && (
            <div className="callout callout-warning text-sm my-2">
              <strong>Note:</strong> Only the first 4 joiners contribute bonuses. {joiners.length - 4} additional joiner(s) will not contribute.
            </div>
          )}
          <div className="grid gap-4 mt-3">
            {(joinerBonuses.attack > 0 || joinerBonuses.defense > 0 || joinerBonuses.lethality > 0 || joinerBonuses.health > 0) && (
              <div className="callout callout-muted">
                <strong>Individual Troop Bonuses:</strong>
                <div className="text-sm mt-2 space-y-1">
                  {joinerBonuses.attack > 0 && <div>Attack: +{joinerBonuses.attack.toFixed(2)}%</div>}
                  {joinerBonuses.defense > 0 && <div>Defense: +{joinerBonuses.defense.toFixed(2)}%</div>}
                  {joinerBonuses.lethality > 0 && <div>Lethality: +{joinerBonuses.lethality.toFixed(2)}%</div>}
                  {joinerBonuses.health > 0 && <div>Health: +{joinerBonuses.health.toFixed(2)}%</div>}
                </div>
              </div>
            )}

            {(joinerBonuses.all_troops_attack > 0 || joinerBonuses.all_troops_defense > 0 ||
              joinerBonuses.all_troops_lethality > 0 || joinerBonuses.all_troops_health > 0) && (
                <div className="callout callout-muted">
                  <strong>All Troops Bonuses:</strong>
                  <div className="text-sm mt-2 space-y-1">
                    {joinerBonuses.all_troops_attack > 0 && <div>Attack: +{joinerBonuses.all_troops_attack.toFixed(2)}%</div>}
                    {joinerBonuses.all_troops_defense > 0 && <div>Defense: +{joinerBonuses.all_troops_defense.toFixed(2)}%</div>}
                    {joinerBonuses.all_troops_lethality > 0 && <div>Lethality: +{joinerBonuses.all_troops_lethality.toFixed(2)}%</div>}
                    {joinerBonuses.all_troops_health > 0 && <div>Health: +{joinerBonuses.all_troops_health.toFixed(2)}%</div>}
                  </div>
                </div>
              )}

            {(joinerBonuses.rally_troops_attack > 0 || joinerBonuses.rally_troops_lethality > 0 ||
              joinerBonuses.rally_troops_health > 0) && (
                <div className="callout callout-muted">
                  <strong>Rally Troops Bonuses:</strong>
                  <div className="text-sm mt-2 space-y-1">
                    {joinerBonuses.rally_troops_attack > 0 && <div>Attack: +{joinerBonuses.rally_troops_attack.toFixed(2)}%</div>}
                    {joinerBonuses.rally_troops_lethality > 0 && <div>Lethality: +{joinerBonuses.rally_troops_lethality.toFixed(2)}%</div>}
                    {joinerBonuses.rally_troops_health > 0 && <div>Health: +{joinerBonuses.rally_troops_health.toFixed(2)}%</div>}
                  </div>
                </div>
              )}
          </div>

          {Object.values(joinerBonuses).every(v => v === 0) && (
            <div className="text-sm text-gray-400 dark:text-gray-400 mt-2">
              No bonuses detected from joiners. This may be because:
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Joiners don't have expedition skills</li>
                <li>First skill doesn't have level-based values</li>
                <li>Skills use different property names</li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-400 dark:text-gray-400">
          No joiners added yet. Add joiners in the Rally Configuration tab to see their bonuses.
        </div>
      )}
    </SectionCard>
  );
}

