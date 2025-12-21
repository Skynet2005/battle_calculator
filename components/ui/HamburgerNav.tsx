'use client';

import Link from 'next/link';
import { useState } from 'react';

type NavLink = { href: string; label: string };

interface HamburgerNavProps {
  links: NavLink[];
}

export default function HamburgerNav({ links }: HamburgerNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-md border border-slate-700/80 bg-slate-900/70 hover:bg-slate-800/80 text-white"
        aria-label="Toggle navigation menu"
      >
        <div className="w-5 h-0.5 bg-white mb-1" />
        <div className="w-5 h-0.5 bg-white mb-1" />
        <div className="w-5 h-0.5 bg-white" />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-48 rounded-md border border-slate-700 bg-slate-900 shadow-lg z-20">
          <div className="py-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
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
