'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api, { Announcement } from '../lib/api';

export default function HomePage() {
  const [stats, setStats] = useState({
    registered: 18,
    active: 14,
    pending: 4,
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    // Fetch live stats & announcements from Supabase Cloud Engine
    api.getPublicOverview()
      .then((overview) => {
        if (overview) {
          setStats({
            registered: overview.stats.totalRegistered,
            active: overview.stats.activeMembers,
            pending: overview.stats.pendingApplicants,
          });
          if (overview.announcements && overview.announcements.length > 0) {
            setAnnouncements(overview.announcements);
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-0">
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
              Kama jibu lako ni <strong>&quot;Ndiyo&quot;</strong>, uko mahali sahihi kabisa. Chagua hatua yako hapa chini:
            </p>
          </div>

          {/* Interactive Student Choice Cards right at the start */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto mb-12">
            {/* Choice 1: Yes, I want to join & learn */}
            <Link
              href="/register"
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
                  &quot;Ndiyo, nataka kujiunga nijifunze nanyi!&quot;
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Jisajili kama mwanafunzi bila kuchagua taasisi wala kitengo. Utapata <strong>SG-ID</strong>, <strong>Student Dashboard</strong> na kiungo cha <strong>WhatsApp Group</strong>.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-blue-400">
                <span>Fungua Fomu ya Kujiunga</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>

            {/* Choice 2: Curious what we learn */}
            <Link
              href="/portal"
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
                  &quot;Je, tunajifunza mada gani pamoja?&quot;
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Angalia orodha ya <strong>Possible Courses (10)</strong> ambazo wanafunzi tunaweza kuzipitia pamoja hatua kwa hatua kulingana na ratiba.
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
                  &quot;Tayari nimeshajisajili, nipeleke Dashboard!&quot;
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Ingia kwenye <strong>Student Dashboard</strong> yako uone kitambulisho chako, WhatsApp Group link, updates mpya na mahudhurio.
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
              <div id="stat-total-registered" className="text-2xl sm:text-3xl font-extrabold text-white font-mono-sg">
                {stats.registered}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">Wanafunzi Waliojisajili</div>
            </div>
            <div className="p-4 rounded-2xl sg-glass text-center">
              <div id="stat-active-members" className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono-sg">
                {stats.active}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">Walioidhinishwa Kwenye Group</div>
            </div>
            <div className="p-4 rounded-2xl sg-glass text-center">
              <div id="stat-pending-review" className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono-sg">
                {stats.pending}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">Maombi Yanayokaguliwa</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. INTERACTIVE Q&A: MASWALI UNAYOJIULIZA KABLA YA KUJIUNGA     */}
      {/* ============================================================== */}
      <section id="maswali-muhimu" className="py-16 bg-slate-950/55 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Q1 */}
            <div className="sg-glass p-6 sm:p-7 rounded-2xl space-y-2.5">
              <span className="text-xs font-mono-sg text-blue-400 font-bold">SWALI LA 01</span>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Je, lazima niwe mtaalamu wa coding ndipo nijiunge?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                <strong>Hapana kabisa.</strong> Sisi sote hapa ni wanafunzi. Lengo letu ni kuanza pamoja, kueleweshana misingi hatua kwa hatua, na kukua pamoja bila mtu kuachwa nyuma.
              </p>
            </div>

            {/* Q2 */}
            <div className="sg-glass p-6 sm:p-7 rounded-2xl space-y-2.5">
              <span className="text-xs font-mono-sg text-emerald-400 font-bold">SWALI LA 02</span>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Je, nitachagua taasisi au kitengo wakati wa kujiunga?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                <strong>Hapana.</strong> Kwa sasa hakuna vitengo vilivyogawanywa — tunaingia wote kama jumuiya moja ya wanafunzi (<em>SG Student Community</em>). Vitengo 11 ni{' '}
                <Link href="/constitution" className="text-blue-400 hover:underline">
                  dira ya baadaye (Katiba v1.4)
                </Link>.
              </p>
            </div>

            {/* Q3 */}
            <div className="sg-glass p-6 sm:p-7 rounded-2xl space-y-2.5">
              <span className="text-xs font-mono-sg text-indigo-400 font-bold">SWALI LA 03</span>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Nikishajisajili na kuidhinishwa napata nini?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Utapewa namba yako rasmi ya mwanafunzi (<strong>SG-ID</strong>), utafunguliwa <strong>Student Dashboard</strong> kamili yenye kitambulisho chako cha kidijitali, na utapata link rasmi ya kuingia kwenye <strong>WhatsApp Group</strong>.
              </p>
            </div>

            {/* Q4 */}
            <div className="sg-glass p-6 sm:p-7 rounded-2xl space-y-2.5">
              <span className="text-xs font-mono-sg text-amber-400 font-bold">SWALI LA 04</span>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Ratiba za masomo na updates nazipataje?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Kila update mpya, mada tunayosoma na ratiba ya vipindi inawekwa moja kwa moja ndani ya <strong>Student Dashboard</strong> yako na kutumwa kwenye <strong>WhatsApp Group</strong> letu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. UPDATES ZA KARIBU (LIVE ANNOUNCEMENTS PREVIEW)              */}
      {/* ============================================================== */}
      <section id="community-updates" className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-mono-sg text-emerald-400 uppercase tracking-widest font-bold block mb-1">
                UPDATES ZA KARIBU
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Taarifa za Hivi Karibuni Kwenye Jumuiya
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Matangazo na ratiba zinazoendelea kwa wanafunzi sasa hivi.
              </p>
            </div>
            <Link
              href="/portal"
              className="text-xs sm:text-sm font-semibold text-blue-400 hover:text-blue-300 transition shrink-0"
            >
              Fungua Student Dashboard &rarr;
            </Link>
          </div>

          <div id="home-announcements-feed" className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {announcements.length === 0 ? (
              <div className="col-span-full sg-glass p-6 rounded-2xl text-center text-xs text-slate-400 font-mono-sg">
                Hakuna tangazo jipya kwa sasa. Jiunge na uingie kwenye Student Portal kupata updates za WhatsApp Group.
              </div>
            ) : (
              announcements.slice(0, 3).map((a) => {
                const isHigh = a.priority === 'HIGH' || a.priority === 'URGENT';
                return (
                  <article
                    key={a.id}
                    className={`sg-glass sg-glass-hover p-5 sm:p-6 rounded-2xl border ${
                      isHigh ? 'border-blue-500/35' : 'border-slate-800/80'
                    } flex flex-col justify-between gap-3`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-sg font-bold uppercase ${
                            isHigh ? 'badge-future' : 'badge-active'
                          }`}
                        >
                          {isHigh ? 'Update Muhimu' : 'Taarifa ya Jumuiya'}
                        </span>
                        <span className="text-[11px] font-mono-sg text-slate-500">
                          {a.created_at ? new Date(a.created_at).toLocaleDateString('sw-TZ') : ''}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white leading-snug">{a.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{a.content}</p>
                    </div>
                    <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between text-[11px] font-mono-sg text-slate-500">
                      <span>
                        Na: <strong className="text-slate-300">{a.author_name || 'SG Admin'}</strong>
                      </span>
                      <Link href="/portal" className="text-blue-400 hover:text-blue-300 font-semibold">
                        Fungua Portal &rarr;
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. BOTTOM INVITATION BANNER                                    */}
      {/* ============================================================== */}
      <section className="py-14 bg-slate-950/60 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="sg-glass p-8 sm:p-10 rounded-3xl border border-blue-500/35 space-y-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Uko tayari kuanza kujifunza pamoja nasi leo?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Usajili unachukua chini ya dakika 2. Fungua akaunti yako ya mwanafunzi sasa ili uingie kwenye mfumo na WhatsApp Group rasmi ya SILLYGER.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl btn-sg-primary text-sm sm:text-base flex items-center justify-center gap-2"
              >
                <span>Ndiyo, Jiunge Sasa</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link
                href="/constitution"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-slate-700 hover:border-blue-400 text-slate-200 font-semibold text-xs sm:text-sm transition"
              >
                Soma Katiba Yetu v1.4
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
