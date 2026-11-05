'use client';

import React from 'react';
import Link from 'next/link';
import { useI18n } from '../lib/i18n';
import { Tv, Sparkles, Shield, ArrowRight, Calendar, Bell, Users, Cpu, Code2 } from 'lucide-react';

export default function HomePage() {
  const { t } = useI18n();

  const adsAndSchedules = [
    {
      id: '1',
      title: 'Kipindi Maalum cha Live TV: Usalama wa Mifumo (Cybersecurity)',
      time: 'Jumamosi, 02:00 Usiku (EAT)',
      speaker: 'Willyger (Mwenyekiti)',
      tag: 'SILLYGER TV',
      status: 'Inakuja',
    },
    {
      id: '2',
      title: 'Zoezi la Uidhinishaji wa Vitambulisho vya Kidijitali',
      time: 'Kila Siku, 24/7 Moja kwa Moja',
      speaker: 'Sekretarieti ya SILLYGER',
      tag: 'Kadi Mahiri',
      status: 'Inaendelea',
    },
    {
      id: '3',
      title: 'Mtaala wa Programu: Kuanza na Go (Golang) & Flutter 2026',
      time: 'Jumatano ijayo',
      speaker: 'Kitengo cha Uhandisi wa Programu',
      tag: 'Mafunzo',
      status: 'Mpya',
    },
  ];

  return (
    <div className="space-y-16 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative text-center space-y-6 pt-6 pb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 font-mono text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Mfumo Rasmi wa Kidijitali v2.0 Enterprise</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Learn Together. Build Together.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">
            Own the Future Together.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Mfumo wa kidijitali wa jumuiya ya SILLYGER (SG) nchini Tanzania unaounganisha wanafunzi, masomo ya vitendo, kadi mahiri za kidijitali, na matangazo ya moja kwa moja.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/tv"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5"
          >
            <Tv className="w-4 h-4 text-cyan-300" />
            <span>Tazama SILLYGER TV</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/portal"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl glass-panel hover:bg-slate-900/90 text-slate-200 font-bold text-sm transition"
          >
            <Shield className="w-4 h-4 text-blue-400" />
            <span>Wasifu & Kadi Yangu</span>
          </Link>
        </div>
      </section>

      {/* Ads & Schedules Section (Matangazo na Ratiba) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
              <Calendar className="w-6 h-6 text-blue-400" />
              <span>{t('nav_ads')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Ratiba ya vipindi vya TV, mafunzo ya pamoja, na matangazo rasmi ya uongozi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {adsAndSchedules.map((item) => (
            <div
              key={item.id}
              className="glass-panel p-6 rounded-3xl border border-slate-800/80 glass-panel-hover flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold">
                    {item.tag}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    {item.status}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-white leading-snug">
                  {item.title}
                </h3>
              </div>

              <div className="pt-4 border-t border-slate-800/80 space-y-1 text-xs">
                <div className="text-slate-400 font-mono flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>{item.time}</span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Mtoa mada: <span className="text-slate-300 font-medium">{item.speaker}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community Pillars Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-4">
            <Cpu className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-lg text-white mb-2">High-Tech Architecture</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Imejengwa kwa Go (Golang) Core Engine, Next.js, na WebSockets kwa kasi ya juu na usalama wa data.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-lg text-white mb-2">Ulinzi wa PDPA 2022</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Taarifa zote za wanachama zinalindwa kwa mujibu wa sheria ya Tanzania na viwango vya kimataifa vya usalama.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-lg text-white mb-2">Smart Digital ID Cards</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Kila mwanachama anapata namba rasmi na kitambulisho cha QR kinachoweza kuthibitishwa papo hapo.
          </p>
        </div>
      </section>
    </div>
  );
}
