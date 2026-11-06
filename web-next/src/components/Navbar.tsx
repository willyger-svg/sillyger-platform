'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import api from '../lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMember, setUserMember] = useState<any>(null);

  useEffect(() => {
    setUserMember(api.getCurrentMember());
  }, [pathname]);

  if (pathname === '/admin') {
    return (
      <header className="sticky top-0 z-50 sg-glass border-b border-purple-900/50 bg-slate-950/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group" title="Fungua Tovuti Kuu">
              <img
                src="/assets/sillyger-logo-icon.svg"
                alt="SILLYGER"
                className="w-9 h-9 rounded-xl shadow-lg shadow-purple-500/30 group-hover:scale-105 transition"
              />
              <div>
                <span className="font-extrabold text-white text-lg tracking-wider block leading-none">
                  SILLYGER
                </span>
                <span className="text-[10px] font-mono-sg text-purple-400 block tracking-widest uppercase">
                  Executive Command
                </span>
              </div>
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-800 text-[10px] font-mono-sg text-purple-300 font-bold uppercase">
              Article 7 & Appendix B Governance
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/portal"
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 transition inline-flex items-center gap-1 font-semibold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden sm:inline">Member Dashboard</span>
              <span className="sm:hidden">Portal</span>
            </Link>
            <Link href="/constitution" className="text-xs text-slate-400 hover:text-purple-300 transition hidden md:inline">
              Katiba v1.4
            </Link>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  api.clearSession();
                  window.location.href = '/portal';
                }
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 hover:border-red-500/50 hover:bg-red-950/30 text-slate-400 hover:text-red-400 transition flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Ondoka</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 sg-glass border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src="/assets/sillyger-logo-icon.svg"
            alt="SILLYGER"
            className="w-10 h-10 rounded-xl shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform"
          />
          <div>
            <span className="text-lg sm:text-xl font-extrabold tracking-wide text-white block leading-none">
              SILLYGER
            </span>
            <span className="text-[10px] font-mono-sg text-blue-400 block tracking-widest uppercase mt-0.5">
              Student Tech Community
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <Link
            href="/"
            className={`transition ${pathname === '/' ? 'text-white font-semibold' : 'hover:text-blue-400'}`}
          >
            Nyumbani
          </Link>

          <Link
            href="/tv"
            className={`flex items-center gap-1.5 transition ${
              pathname === '/tv'
                ? 'text-red-400 font-bold'
                : 'text-red-400 font-bold hover:text-red-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>SILLYGER TV</span>
          </Link>

          <Link
            href="/courses"
            className={`transition ${pathname === '/courses' ? 'text-white font-semibold' : 'hover:text-blue-400'}`}
          >
            Possible Courses
          </Link>

          <Link
            href="/future-divisions"
            className={`transition ${pathname === '/future-divisions' ? 'text-white font-semibold' : 'hover:text-blue-400'}`}
          >
            Future Vision
          </Link>

          <Link
            href="/constitution"
            className={`transition ${pathname === '/constitution' ? 'text-white font-semibold' : 'hover:text-blue-400'}`}
          >
            Katiba
          </Link>

          <Link
            href="/admin"
            className={`transition ${pathname === '/admin' ? 'text-white font-semibold' : 'text-slate-400 hover:text-blue-400'}`}
          >
            Utawala
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2.5">
            {userMember ? (
              <Link
                href="/portal"
                className="px-4 py-2 rounded-xl bg-slate-900 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition"
              >
                <span>👤</span>
                <span>{userMember.full_name?.split(' ')[0] || 'Dashboard'}</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/portal"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  Ingia Dashboard
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl btn-sg-primary text-xs font-bold shadow-md"
                >
                  Ndiyo, Nataka Kujiunga
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-300 hover:text-white p-2"
            aria-label="Fungua menyu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-sgcard/95 px-4 pt-3 pb-5 space-y-2.5 text-sm">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-white font-semibold py-1.5"
          >
            Nyumbani
          </Link>
          <Link
            href="/tv"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-red-400 font-bold py-1.5 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>SILLYGER TV (Live)</span>
          </Link>
          <Link
            href="/courses"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-300 hover:text-blue-400 py-1.5"
          >
            Possible Courses
          </Link>
          <Link
            href="/future-divisions"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-300 hover:text-blue-400 py-1.5"
          >
            Future Vision (Vitengo vya Baadaye)
          </Link>
          <Link
            href="/constitution"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-300 hover:text-blue-400 py-1.5"
          >
            Katiba v1.4
          </Link>
          <Link
            href="/portal"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-blue-400 font-semibold py-1.5"
          >
            Ingia Student Dashboard
          </Link>
          <div className="pt-2">
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center w-full py-2.5 rounded-xl btn-sg-primary text-sm font-bold"
            >
              Ndiyo, Nataka Kujifunza Nanyi
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
