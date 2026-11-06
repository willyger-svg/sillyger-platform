'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  if (pathname === '/admin') {
    return null;
  }
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90 text-slate-400 text-xs py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <img
            src="/assets/sillyger-logo-icon.svg"
            alt="SILLYGER"
            className="w-8 h-8 rounded-lg shadow-md"
          />
          <div>
            <span className="text-sm font-extrabold text-white tracking-wide block">
              SILLYGER Student Community
            </span>
            <span className="text-[11px] text-slate-500">
              Learn Together. Build Together. Own the Future Together.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-400">
          <Link href="/register" className="hover:text-white transition">
            Jiunge
          </Link>
          <Link href="/portal" className="hover:text-white transition">
            Student Dashboard
          </Link>
          <Link href="/constitution" className="hover:text-white transition">
            Katiba v1.4
          </Link>
          <Link href="/admin" className="hover:text-white transition text-slate-500">
            Utawala
          </Link>
        </div>

        <div className="text-[11px] text-slate-500 font-mono-sg">
          &copy; 2026 SILLYGER (SG) · PDPA 2022
        </div>
      </div>
    </footer>
  );
}
