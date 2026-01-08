'use client';

import { type ReactNode } from 'react';

interface PageShellProps {
  header: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function PageShell({
  header,
  children,
  className = ''
}: PageShellProps) {
  return (
    <div className={`container ${className}`}>
      {header}
      <main className="main-content">{children}</main>
    </div>
  );
}
