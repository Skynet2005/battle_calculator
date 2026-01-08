import type { SubTab } from '../../../PlayerTab.model';

export default function PlayerSubTabs({
  active,
  onChange
}: {
  active: SubTab;
  onChange: (tab: SubTab) => void;
}) {
  return (
    <div className="tabs mb-4">
      <button className={`tab ${active === 'info' ? 'active' : ''}`} onClick={() => onChange('info')}>
        Profile Info
      </button>
      <button className={`tab ${active === 'heroes' ? 'active' : ''}`} onClick={() => onChange('heroes')}>
        Heroes
      </button>
      <button className={`tab ${active === 'basic' ? 'active' : ''}`} onClick={() => onChange('basic')}>
        Basic Bonuses
      </button>
      <button className={`tab ${active === 'research' ? 'active' : ''}`} onClick={() => onChange('research')}>
        Research
      </button>
      <button className={`tab ${active === 'chief' ? 'active' : ''}`} onClick={() => onChange('chief')}>
        Chief
      </button>
      <button className={`tab ${active === 'pets' ? 'active' : ''}`} onClick={() => onChange('pets')}>
        Pets
      </button>
    </div>
  );
}
