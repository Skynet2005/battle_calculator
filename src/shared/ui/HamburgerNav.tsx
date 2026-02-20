'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type NavLink = { href: string; label: string };

interface HamburgerNavProps {
  links: NavLink[];
}

export default function HamburgerNav({ links }: HamburgerNavProps) {
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

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-md border border-slate-700/80 bg-slate-900/70 hover:bg-slate-800/80 text-white"
        aria-label="Toggle navigation menu"
        aria-expanded={open}
        aria-controls="hamburger-nav-menu"
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
          className="absolute left-0 mt-2 w-48 rounded-md border border-slate-700 bg-slate-900 shadow-lg z-20"
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
        </div>
      )}
    </div>
  );
}
