'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '../lib/i18n';
import { Tv, BookOpen, ScrollText, UserCheck, Shield, Menu, X, Bell, Globe, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { t, language, setLanguage } = useI18n();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2); // Example live notification count (WhatsApp style)
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'sw' ? 'en' : 'sw');
  };

  const navLinks = [
    { href: '/', label: t('nav_home') },
    { href: '/tv', label: t('nav_tv'), icon: Tv, highlight: true },
    { href: '/courses', label: t('nav_courses'), icon: BookOpen },
    { href: '/constitution', label: t('nav_constitution'), icon: ScrollText },
    { href: '/portal', label: t('nav_portal'), icon: UserCheck },
    { href: '/admin', label: t('nav_admin'), icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                SG
              </span>
            </div>
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-wider text-white group-hover:text-blue-400 transition-colors">
              SILLYGER
            </div>
            <div className="text-[10px] text-blue-400/80 font-mono tracking-widest hidden sm:block">
              COMMUNITY v2.0
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                {Icon && <Icon className={`w-4 h-4 ${link.highlight ? 'text-rose-500 animate-pulse' : ''}`} />}
                <span>{link.label}</span>
                {link.highlight && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping ml-0.5" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls: Notifications, Language Switcher, Drawer */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* WhatsApp-style Notification Badge */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotificationPopup(!showNotificationPopup);
                setUnreadCount(0); // clear on click like WhatsApp!
              }}
              className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-emerald-500 text-slate-950 font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce shadow-md shadow-emerald-500/30">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotificationPopup && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl glass-panel p-4 shadow-2xl border border-slate-700/60 z-50">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    {t('unread_notifications')}
                  </h4>
                  <span className="text-xs text-blue-400 font-mono">Realtime</span>
                </div>
                <div className="mt-3 space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
                    <div className="font-semibold text-white">🔴 SILLYGER TV Moja kwa Moja</div>
                    <div className="text-slate-400 mt-0.5">Kipindi kipya cha teknolojia kimeanza sasa hivi. Ungana nasi!</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
                    <div className="font-semibold text-white">📢 Tangazo la Uongozi</div>
                    <div className="text-slate-400 mt-0.5">Ratiba mpya ya masomo na mfumo rasmi wa kadi za kidijitali umewashwa.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Multilingual Switcher Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-blue-500/40 text-xs font-semibold text-slate-200 transition"
            title="Badili Lugha / Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>{language === 'sw' ? 'SW' : 'EN'}</span>
          </button>

          {/* 3-Bar Hamburger Drawer Toggle */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition"
            aria-label="Toggle Menu"
          >
            {drawerOpen ? <X className="w-6 h-6 text-blue-400" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile / Slide-Over Navigation Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 top-16 bg-slate-950/95 backdrop-blur-xl z-40 p-6 flex flex-col justify-between border-t border-slate-800/80 animate-fadeIn">
          <div className="space-y-3">
            <div className="text-xs font-mono text-blue-400 uppercase tracking-widest px-3 mb-2">
              Menu Kuu
            </div>
            {navLinks.map((link) => {
              const active = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl text-base font-semibold transition ${
                    active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-5 h-5 text-blue-400" />}
                    <span>{link.label}</span>
                  </div>
                  {link.highlight && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono uppercase font-bold">
                      Live
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="pt-6 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-500 font-mono">
              SILLYGER Community Platform • Version 2.0 Fullstack
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
