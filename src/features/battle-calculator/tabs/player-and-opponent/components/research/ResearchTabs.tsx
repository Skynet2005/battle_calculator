import type { ResearchActiveSection } from './ResearchSection.model';

// ============================================================================
// Types
// ============================================================================

interface ResearchTabsProps {
  activeSection: ResearchActiveSection;
  onChange: (next: ResearchActiveSection) => void;
}

// ============================================================================
// Constants
// ============================================================================

const TABS = [
  { id: 'research' as const, label: 'Research', panelId: 'research-panel' },
  { id: 'warAcademy' as const, label: 'War Academy', panelId: 'war-academy-panel' },
] as const;

// ============================================================================
// Main Component
// ============================================================================

export default function ResearchTabs({ activeSection, onChange }: ResearchTabsProps) {
  return (
    <div className="tabs mb-6" role="tablist" aria-label="Research sections">
      {TABS.map(({ id, label, panelId }) => (
        <button
          key={id}
          className={`tab ${activeSection === id ? 'active' : ''}`}
          onClick={() => onChange(id)}
          role="tab"
          aria-selected={activeSection === id}
          aria-controls={panelId}
          aria-label={`${label} section`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
