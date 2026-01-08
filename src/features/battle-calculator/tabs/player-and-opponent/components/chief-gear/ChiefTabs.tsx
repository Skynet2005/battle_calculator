import type { ChiefActiveSection } from './ChiefSection.model';

export default function ChiefTabs({
  activeSection,
  onChange,
}: {
  activeSection: ChiefActiveSection;
  onChange: (next: ChiefActiveSection) => void;
}) {
  return (
    <div className="tabs mb-6">
      <button className={`tab ${activeSection === 'gear' ? 'active' : ''}`} onClick={() => onChange('gear')}>
        Chief Gear
      </button>
      <button className={`tab ${activeSection === 'charms' ? 'active' : ''}`} onClick={() => onChange('charms')}>
        Charms
      </button>
      <button
        className={`tab ${activeSection === 'commandCenter' ? 'active' : ''}`}
        onClick={() => onChange('commandCenter')}
      >
        Command Center
      </button>
    </div>
  );
}
