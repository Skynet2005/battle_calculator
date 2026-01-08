'use client';

import type { HeroGearSelections } from '@/domain/battle';
import type { BasicBonuses } from '@/domain/battle/calculations';
import type { HeroLevel } from '@/shared/types';

import HeroGearSelector from '../hero-gear/HeroGearSelector';
import HeroGenerationSection from '../hero-gear/HeroGenerationSection';
import { useHeroSelectorModel } from './HeroSelector.model';
import HeroSelectorFilters from './HeroSelectorFilters';
import HeroSelectorTabs from './HeroSelectorTabs';

interface HeroSelectorProps {
  heroLevels: Record<string, HeroLevel>;
  onHeroLevelsChange: (heroLevels: Record<string, HeroLevel>) => void;

  basicBonuses: BasicBonuses;
  onBasicBonusesChange: (bonuses: BasicBonuses) => void;

  heroGearSelections?: HeroGearSelections;
  onHeroGearSelectionsChange?: (selections: HeroGearSelections) => void;

  isOpponent?: boolean;
}

export default function HeroSelector(props: HeroSelectorProps) {
  const vm = useHeroSelectorModel({
    heroLevels: props.heroLevels,
    onHeroLevelsChange: props.onHeroLevelsChange,
    heroGearSelections: props.heroGearSelections,
    isOpponent: props.isOpponent ?? false,
  });

  return (
    <div>
      <HeroSelectorTabs activeSection={vm.activeSection} onChange={vm.setActiveSection} />

      {vm.activeSection === 'heroes' && (
        <div>
          <h3>Hero Levels</h3>
          <p className="text-sm text-gray-400 dark:text-gray-400 mb-4">
            Set the star level and XP level for each hero. These values are used for hero-related calculations.
          </p>

          <HeroSelectorFilters
            searchTerm={vm.searchTerm}
            onSearchTermChange={vm.setSearchTerm}
            filterClass={vm.filterClass}
            onFilterClassChange={vm.setFilterClass}
            heroClasses={vm.heroClasses}
          />

          {Object.entries(vm.heroesByGeneration)
            .sort(([genA], [genB]) => Number(genB) - Number(genA))
            .map(([genStr, heroes]) => {
              const generation = Number(genStr);

              return (
                <HeroGenerationSection
                  key={generation}
                  generation={generation}
                  heroes={heroes}
                  getHeroLevelData={vm.getHeroLevelData}
                  getSkillsForHero={vm.getSkillsForHero}
                  calculatePower={vm.calculateHeroPowerComponents}
                  onUpdateStarLevel={(heroName, next) => vm.updateHeroLevel(heroName, 'starLevel', next)}
                  onUpdateXpLevel={(heroName, next) => vm.updateHeroLevel(heroName, 'xpLevel', next)}
                  onUpdateSkillLevel={(heroName, skillName, next) => vm.updateHeroSkillLevel(heroName, skillName, next)}
                  onUpdateWeaponLevel={(heroName, next, maxLevel) => vm.updateHeroExclusiveWeaponLevel(heroName, next, maxLevel)}
                />
              );
            })}

          {vm.sortedHeroes.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-400">
              No heroes found matching your search criteria.
            </div>
          )}
        </div>
      )}

      {vm.activeSection === 'heroGear' && (
        <HeroGearSelector
          basicBonuses={props.basicBonuses}
          onBasicBonusesChange={props.onBasicBonusesChange}
          heroGearSelections={vm.safeGearSelections}
          onHeroGearSelectionsChange={props.onHeroGearSelectionsChange}
        />
      )}
    </div>
  );
}
