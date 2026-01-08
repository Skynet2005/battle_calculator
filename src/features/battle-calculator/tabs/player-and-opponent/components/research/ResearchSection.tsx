'use client';

import ResearchTabs from './ResearchTabs';
import ResearchBonusesDisplay from './ResearchBonusesDisplay';
import ResearchCategoryCard from './ResearchCategoryCard';
import WarAcademyBonusesDisplay from './WarAcademyBonusesDisplay';
import WarAcademyTroopSection from './WarAcademyTroopSection';
import { useResearchSectionModel, type ResearchSectionProps } from './ResearchSection.model';

// ============================================================================
// Constants
// ============================================================================

const TROOP_TYPES = ['infantry', 'lancer', 'marksman'] as const;

// ============================================================================
// Main Component
// ============================================================================

export default function ResearchSection(props: ResearchSectionProps) {
  const vm = useResearchSectionModel(props);

  return (
    <div className="space-y-6">
      <ResearchTabs activeSection={vm.activeSection} onChange={vm.setActiveSection} />

      {vm.activeSection === 'research' ? (
        <div className="space-y-4">
          <SectionHeader
            title="Battle Research"
            description="Select research levels for each category to calculate combat bonuses."
          />

          <ResearchBonusesDisplay basicBonuses={props.basicBonuses} />

          <div className="space-y-3">
            {vm.researchCategories.map((category) => (
              <ResearchCategoryCard
                key={category}
                category={category}
                researchSelections={vm.researchSelections}
                onTierChange={vm.updateResearchTier}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <SectionHeader
            title="War Academy Tech"
            description="Configure War Academy technology levels for each troop type to enhance combat effectiveness."
          />

          <WarAcademyBonusesDisplay warAcademySelections={vm.warAcademySelections} />

          <div className="space-y-3">
            {TROOP_TYPES.map((troopType) => (
              <WarAcademyTroopSection
                key={troopType}
                troopType={troopType}
                warAcademyData={vm.warAcademyData}
                warAcademySelections={vm.warAcademySelections}
                setWarAcademySelections={vm.setWarAcademySelections}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

interface SectionHeaderProps {
  title: string;
  description: string;
}

function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-100 [data-theme='light']:text-gray-900">
        {title}
      </h3>
      <p className="mt-1 text-sm text-slate-400 [data-theme='light']:text-gray-600">
        {description}
      </p>
    </div>
  );
}
