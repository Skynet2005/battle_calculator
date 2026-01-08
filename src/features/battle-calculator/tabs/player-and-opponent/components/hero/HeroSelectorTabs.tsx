import type { ActiveSection } from './HeroSelector.utils';

export default function HeroSelectorTabs({
  activeSection,
  onChange
}: {
  activeSection: ActiveSection;
  onChange: (next: ActiveSection) => void;
}) {
  return (
    <div className="tabs mb-4">
      <button
        className={`tab ${activeSection === 'heroes' ? 'active' : ''}`}
        onClick={() => onChange('heroes')}
        aria-label="Heroes"
      >
        Heroes
      </button>
      <button
        className={`tab ${activeSection === 'heroGear' ? 'active' : ''}`}
        onClick={() => onChange('heroGear')}
      >
        Hero Gear
      </button>
    </div>
  );
}

