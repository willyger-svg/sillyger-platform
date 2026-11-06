'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function CoursesPage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const courses = [
    { level: 1, category: "Misingi", title: "Computer Fundamentals & Electronics", desc: "Misingi ya kompyuta inavyofanya kazi ndani, hardware msingi, umeme wa awali na binary logic." },
    { level: 2, category: "Misingi", title: "Digital Logic & Computer Architecture", desc: "Logic gates, flip-flops, ALUs, muundo wa CPU, memory na jinsi maelekezo yanavyochakatwa." },
    { level: 3, category: "Software", title: "Programming & Software Engineering", desc: "Kujifunza kuandika kodi safi, data structures, algorithms na ujenzi wa programu hatua kwa hatua." },
    { level: 4, category: "Systems", title: "Operating Systems & Linux", desc: "Matumizi na misingi ya Linux, process management, file systems, terminal na mifumo ya uendeshaji." },
    { level: 5, category: "Networks", title: "Computer Networking & Internet", desc: "Jinsi intaneti na mitandao inavyofanya kazi: TCP/IP, DNS, HTTP, routing na socket programming." },
    { level: 6, category: "Security", title: "Cybersecurity Fundamentals", desc: "Misingi ya ulinzi wa mifumo, cryptography, usalama wa mitandao na utambuzi wa udhaifu kwa maadili." },
    { level: 7, category: "Security", title: "Ethical Hacking & Security Labs", desc: "Mazoezi ya kiusalama kwenye maabara zilizoidhinishwa (CTFs), web security na ukaguzi wa mifumo." },
    { level: 8, category: "Backend & Cloud", title: "Databases, Backend & Cloud", desc: "SQL/PostgreSQL, ujenzi wa APIs, servers, na kuweka mifumo hewani (cloud deployment)." },
    { level: 9, category: "Advanced", title: "AI, Data & Systems Research", desc: "Misingi ya Artificial Intelligence, uchambuzi wa data, na utafiti wa mada za juu kwa pamoja." },
    { level: 10, category: "Projects", title: "Collaborative Student Projects", desc: "Kuunda miradi ya pamoja ya wanafunzi (open-source tools, tovuti na mifumo halisi ya kujifunzia)." }
  ];

  const filtered = courses.filter((c) => {
    const matchCat = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.desc.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="py-12 md:py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Page Intro */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full badge-active text-xs font-mono-sg font-bold uppercase">
          POSSIBLE COURSES · MASOMO TUNAYOWEZA KUSOMA PAMOJA
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Possible Courses za Wanafunzi
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Katika SILLYGER hakuna mwanafunzi anayetengwa kwa taasisi au kozi yake peke yake — <strong>sote tunajifunza kwa pamoja hatua kwa hatua</strong>. Mada hizi 10 ni mwongozo wa maeneo tunayoweza kuyapitia pamoja kupitia vipindi na updates za WhatsApp Group.
        </p>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="sg-glass p-4 sm:p-5 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'Misingi', 'Software', 'Systems', 'Networks', 'Security'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'btn-sg-primary'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat === 'ALL' ? 'Zote (10)' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full lg:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tafuta mada (mf. Linux, networks)..."
            className="w-full sg-input px-3.5 py-2 rounded-xl text-xs sm:text-sm"
          />
          <span className="hidden sm:inline-block shrink-0 text-[11px] font-mono-sg text-blue-400 font-semibold">
            {filtered.length} Possible Courses
          </span>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((course) => (
          <div
            key={course.level}
            className="sg-glass p-6 rounded-3xl border border-slate-800/80 space-y-3 relative overflow-hidden group hover:border-blue-500/40 transition"
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-mono-sg font-bold text-xs flex items-center justify-center">
                #{course.level}
              </span>
              <span className="px-2.5 py-0.5 rounded-full badge-future text-[10px] font-mono-sg font-bold">
                {course.category}
              </span>
            </div>

            <h3 className="text-base font-extrabold text-white group-hover:text-blue-300 transition">
              {course.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {course.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom Student Onboarding Callout */}
      <div className="sg-glass p-7 sm:p-9 rounded-3xl border border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">Je, uko tayari kujifunza pamoja nasi?</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Huhitaji kuchagua kozi moja wakati wa kujiunga. Jisajili sasa kama mwanafunzi wa SILLYGER ili upate ufikivu wa WhatsApp Group na ratiba ya mada tunayoanza nayo.
          </p>
        </div>
        <Link
          href="/register"
          className="shrink-0 px-7 py-3.5 rounded-2xl btn-sg-primary text-sm font-bold flex items-center gap-2"
        >
          <span>Jiunge na SILLYGER Sasa</span>
          <span>&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
