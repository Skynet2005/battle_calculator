'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export type NavLink = { href: string; label: string };

export type NavSection = {
  label: string;
  items: Array<{ label: string; onClick: () => void }>;
};

interface HamburgerNavProps {
  links: NavLink[];
  sections?: NavSection[];
}

export default function HamburgerNav({ links, sections = [] }: HamburgerNavProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const closeAnd = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  const buttonAria: { 'aria-expanded': 'true' | 'false'; 'aria-controls': string } = {
    'aria-expanded': open ? 'true' : 'false',
    'aria-controls': 'hamburger-nav-menu'
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        title="Toggle navigation menu"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-md border border-slate-700/80 bg-slate-900/70 hover:bg-slate-800/80 text-white"
        aria-label="Toggle navigation menu"
        {...buttonAria}
      >
        <div className="w-5 h-0.5 bg-white mb-1" />
        <div className="w-5 h-0.5 bg-white mb-1" />
        <div className="w-5 h-0.5 bg-white" />
      </button>

      {open && (
        <div
          id="hamburger-nav-menu"
          role="menu"
          aria-label="Navigation menu"
          className="absolute left-0 mt-2 w-56 rounded-md border border-slate-700 bg-slate-900 shadow-lg z-20 max-h-[85vh] overflow-y-auto"
        >
          <div className="py-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                className="block px-4 py-2 text-sm text-slate-100 hover:bg-slate-800"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          {sections.length > 0 && (
            <>
              <div className="border-t border-slate-700 my-1" />
              {sections.map((section) => (
                <div key={section.label} className="py-1">
                  <div className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {section.label}
                  </div>
                  {section.items.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      role="menuitem"
                      className="block w-full text-left px-4 py-2 text-sm text-slate-100 hover:bg-slate-800"
                      onClick={() => closeAnd(item.onClick)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
