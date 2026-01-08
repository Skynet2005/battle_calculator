'use client';

import type { TabKey } from './TabBar';

interface TabPanelProps {
  id: TabKey;
  activeTab: TabKey;
  children: React.ReactNode;
  className?: string;
}

export default function TabPanel({
  id,
  activeTab,
  children,
  className = ''
}: TabPanelProps) {
  const isActive = id === activeTab;

  if (!isActive) return null;

  return (
    <div
      id={'panel-' + id}
      role="tabpanel"
      aria-labelledby={'tab-' + id}
      className={'animate-fade-in ' + className}
    >
      {children}
    </div>
  );
}
