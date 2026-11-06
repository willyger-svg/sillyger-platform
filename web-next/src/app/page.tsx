'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../lib/api';

export default function HomePage() {
  const [stats, setStats] = useState({
    registered: 18,
    active: 14,
    pending: 4,
  });

  useEffect(() => {
    // Optionally fetch live pending stats from Go backend
    api.getPendingMembers().then((pending) => {
      if (pending) {
        setStats((prev) => ({
          ...prev,
          pending: pending.length,
          registered: prev.active + pending.length,
        }));
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-16">
      {/* ============================================================== */}
      {/* 1. CONVERSATIONAL ENTRY: QUESTION-DRIVEN HERO                  */}
      {/* ============================================================== */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full badge-future text-xs font-mono-sg font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>SWALI KWA MWANAFUNZI MWENZETU</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight mb-5">
              Je, unataka <span className="text-gradient-brand">kujifunza teknolojia</span> kwa vitendo pamoja nasi?
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-4">
              Unatamani kuelewa jinsi kompyuta, kodi, Linux, mitandao na usalama wa mifumo vinavyofanya kazi — ukiwa kwenye jumuiya ya wanafunzi wenzako badala ya kuhangaika peke yako?
            </p>

            <p className="text-xs sm:text-sm text-blue-400 font-mono-sg mb-10">
              Kama jibu lako ni <strong>"Ndiyo"</strong>, uko mahali sahihi kabisa. Chagua hatua yako hapa chini:
            </p>
          </div>

          {/* Interactive Student Choice Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto mb-12">
            {/* Choice 1: Yes, I want to join & learn */}
            <Link
              href="/portal?tab=register"
              className="sg-glass sg-glass-hover p-6 rounded-3xl border border-blue-500/45 bg-gradient-to-b from-blue-950/35 to-slate-950/60 flex flex-col justify-between gap-5 group relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-11 h-11 rounded-2xl bg-blue-600/25 border border-blue-500/40 text-xl flex items-center justify-center">
                    🙋‍♂️
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full badge-active text-[10px] font-mono-sg font-bold uppercase">
                    Anza Hapa
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-white group-hover:text-blue-300 transition">
                  "Ndiyo, nataka kujiunga nijifunze nanyi!"
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Jisajili kama mwanafunzi. Utapata <strong>SG-ID</strong>, <strong>Student Dashboard</strong> na kiungo cha <strong>WhatsApp Group</strong>.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-blue-400">
                <span>Fungua Fomu ya Kujiunga</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>

            {/* Choice 2: Curious what we learn */}
            <Link
              href="/courses"
              className="sg-glass sg-glass-hover p-6 rounded-3xl flex flex-col justify-between gap-5 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/35 text-xl flex items-center justify-center">
                    🤔
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full badge-future text-[10px] font-mono-sg font-bold uppercase">
                    Tazama Mada
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-white group-hover:text-blue-300 transition">
                  "Je, tunajifunza mada gani pamoja?"
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Angalia orodha ya <strong>Possible Courses</strong> ambazo wanafunzi tunazipitia pamoja hatua kwa hatua kulingana na ratiba.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-indigo-300">
                <span>Angalia Possible Courses</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>

            {/* Choice 3: Already registered -> Go to Dashboard */}
            <Link
              href="/portal"
              className="sg-glass sg-glass-hover p-6 rounded-3xl flex flex-col justify-between gap-5 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/35 text-xl flex items-center justify-center">
                    💻
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full badge-hold text-[10px] font-mono-sg font-bold uppercase">
                    Mwanachama
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-white group-hover:text-emerald-300 transition">
                  "Tayari nimeshajisajili, nipeleke Dashboard!"
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Ingia kwenye <strong>Student Dashboard</strong> yako uone kitambulisho chako, WhatsApp Group link, updates na mahudhurio.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-400">
                <span>Ingia Student Dashboard</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>
          </div>

          {/* Clean Live Community Pulse Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-6 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl sg-glass text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono-sg">
                {stats.registered}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">Wanafunzi Waliojisajili</div>
            </div>
            <div className="p-4 rounded-2xl sg-glass text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono-sg">
                {stats.active}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">Walioidhinishwa Kwenye Group</div>
            </div>
            <div className="p-4 rounded-2xl sg-glass text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono-sg">
                {stats.pending}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">Maombi Yanayokaguliwa</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. INTERACTIVE Q&A: MASWALI YA MWANZO                          */}
      {/* ============================================================== */}
      <section className="py-16 bg-slate-950/55 border-y border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono-sg text-blue-400 uppercase tracking-widest font-bold block mb-2">
              MASWALI YA MWANZO
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Je, Unajiuliza Mfumo Huu Unafanyaje Kazi?
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Majibu mafupi na ya wazi kabla hujaanza safari yako ndani ya SILLYGER.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-6 rounded-3xl sg-glass space-y-2">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span className="text-blue-400">❓</span>
                <span>Mfumo huu ni wa nani na nani anaruhusiwa?</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Ni jumuiya huru ya wanafunzi wanaopenda teknolojia nchini Tanzania. Mwanafunzi yeyote anayeanza au mwenye uzoefu anakaribishwa kujifunza nasi bila ubaguzi.
              </p>
            </div>

            <div className="p-6 rounded-3xl sg-glass space-y-2">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span className="text-emerald-400">💰</span>
                <span>Je, kuna ada au gharama za kujiunga?</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Hapana! Kujiunga, kupokea kitambulisho cha SG, na kushiriki kwenye vipindi vya SILLYGER TV ni <strong>bure 100%</strong> kwa wanachama wote.
              </p>
            </div>

            <div className="p-6 rounded-3xl sg-glass space-y-2">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span className="text-indigo-400">🎓</span>
                <span>Kitambulisho (Digital ID) kinatumika vipi?</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Kila mwanachama anayeidhinishwa anapewa namba rasmi ya utambulisho (mfano: SG-000001) na kadi mahiri yenye QR Code inayoweza kuthibitishwa mtandaoni.
              </p>
            </div>

            <div className="p-6 rounded-3xl sg-glass space-y-2">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span className="text-rose-400">📺</span>
                <span>SILLYGER TV inafanyaje kazi?</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Ni kituo chetu cha matangazo ya video na madarasa ya moja kwa moja. Unaweza kutazama moja kwa moja, kusitisha (pause) unapoandika soga, na kurudia masomo yaliyopita.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. READY TO START CTA                                          */}
      {/* ============================================================== */}
      <section className="py-16 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sg-glass p-8 sm:p-10 rounded-3xl border border-blue-500/35 space-y-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Uko tayari kuanza kujifunza pamoja nasi leo?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Usajili unachukua chini ya dakika 2. Fungua akaunti yako ya mwanafunzi sasa ili uingie kwenye mfumo na WhatsApp Group rasmi ya SILLYGER.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/portal?tab=register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl btn-sg-primary text-sm sm:text-base font-bold flex items-center justify-center gap-2"
              >
                <span>Ndiyo, Jiunge Sasa</span>
                <span>&rarr;</span>
              </Link>
              <Link
                href="/courses"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-slate-700 hover:border-blue-400 text-slate-200 font-semibold text-xs sm:text-sm transition"
              >
                Tazama Possible Courses
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
