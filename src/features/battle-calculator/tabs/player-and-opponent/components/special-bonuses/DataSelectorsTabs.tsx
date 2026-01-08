import type { DataSelectorsSection } from './DataSelectors.utils';

export default function DataSelectorsTabs({
  activeSection,
  onChange
}: {
  activeSection: DataSelectorsSection;
  onChange: (next: DataSelectorsSection) => void;
}) {
  return (
    <div className="tabs mb-6">
      <button className={`tab ${activeSection === 'experts' ? 'active' : ''}`} onClick={() => onChange('experts')}>
        Experts
      </button>
      <button className={`tab ${activeSection === 'skins' ? 'active' : ''}`} onClick={() => onChange('skins')}>
        Skins
      </button>
      <button
        className={`tab ${activeSection === 'daybreakIsland' ? 'active' : ''}`}
        onClick={() => onChange('daybreakIsland')}
      >
        Daybreak Island
      </button>
      <button
        className={`tab ${activeSection === 'specialBonuses' ? 'active' : ''}`}
        onClick={() => onChange('specialBonuses')}
      >
        Special Bonuses
      </button>
    </div>
  );
}
