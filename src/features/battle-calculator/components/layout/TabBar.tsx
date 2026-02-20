'use client';

export type TabKey = 'profile' | 'opponent' | 'rally' | 'results' | 'howto';

type TabStatus = 'ready' | 'warning' | 'error' | 'idle';

export interface Tab {
  key: TabKey;
  label: string;
  icon?: React.ReactNode;
  shortLabel?: string;
}

interface TabBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  tabs?: Tab[];
  className?: string;
  statuses?: Partial<Record<TabKey, TabStatus>>;
}

const DEFAULT_TABS: Tab[] = [
  { key: 'rally', label: 'Rally Config', shortLabel: 'Rally' },
  { key: 'profile', label: 'Player', shortLabel: 'Player' },
  { key: 'opponent', label: 'Opponent', shortLabel: 'Opponent' },
  { key: 'results', label: 'Results', shortLabel: 'Results' },
  { key: 'howto', label: 'How-to-Use', shortLabel: 'Guide' }
];

export default function TabBar({
  activeTab,
  onTabChange,
  tabs = DEFAULT_TABS,
  className = '',
  statuses
}: TabBarProps) {

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
    } else if (e.key === 'Home') {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      newIndex = tabs.length - 1;
    }

    if (newIndex !== currentIndex) {
      onTabChange(tabs[newIndex].key);
    }
  };

  const renderStatusBadge = (tabKey: TabKey) => {
    const state = statuses?.[tabKey] || 'idle';
    if (state === 'idle') return null;

    const styles: Record<TabStatus, { bg: string; label: string; dot: string; shadow: string }> = {
      ready: {
        bg: 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/15 text-emerald-100 border-emerald-400/40',
        label: 'Ready',
        dot: 'bg-emerald-400',
        shadow: 'shadow-[0_0_4px_rgba(16,185,129,0.3)]'
      },
      warning: {
        bg: 'bg-gradient-to-r from-amber-500/20 to-amber-600/15 text-amber-100 border-amber-400/40',
        label: 'Pending',
        dot: 'bg-amber-400',
        shadow: 'shadow-[0_0_4px_rgba(251,191,36,0.3)]'
      },
      error: {
        bg: 'bg-gradient-to-r from-rose-500/20 to-rose-600/15 text-rose-100 border-rose-400/40',
        label: 'Needs attention',
        dot: 'bg-rose-400',
        shadow: 'shadow-[0_0_4px_rgba(244,63,94,0.3)]'
      },
      idle: { bg: '', label: '', dot: '', shadow: '' }
    };

    const style = styles[state];

    return (
      <div
        className={`mt-1.5 inline-flex items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold leading-tight ${style.bg} ${style.shadow}`}
        aria-label={`${statuses?.[tabKey]} status`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot} ${style.shadow}`} />
        <span>{style.label}</span>
      </div>
    );
  };

  return (
    <div className={'w-full ' + className}>
      <div
        className="tabs"
        role="tablist"
        aria-label="Battle calculator sections"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            data-tab={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={'panel-' + tab.key}
            tabIndex={activeTab === tab.key ? 0 : -1}
            className={`tab flex-1 min-w-0 flex flex-col items-center justify-center ${activeTab === tab.key ? 'active' : ''
              }`}
            onClick={() => onTabChange(tab.key)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            <div className="flex items-center gap-1.5">
              {tab.icon && <span className="tab-icon">{tab.icon}</span>}
              <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>
              <span className="sm:hidden whitespace-nowrap">{tab.shortLabel || tab.label}</span>
            </div>
            {renderStatusBadge(tab.key)}
          </button>
        ))}
      </div>
    </div>
  );
}
