'use client';

import React from 'react';
import Link from 'next/link';

export default function FutureDivisionsPage() {
  const divisions = [
    {
      id: "tech",
      number: "3.1",
      name: "SILLYGER Technologies",
      tagline: "Software, Hardware & Systems Engineering",
      desc: "Dira ya baadaye ya kuunda software za kisasa, mifumo imara ya hardware na suluhisho za kihandisi.",
      badge: "Engineering"
    },
    {
      id: "research",
      number: "3.2",
      name: "SILLYGER Research Institute",
      tagline: "Scientific Research, Experimentation & Development",
      desc: "Dira ya kuanzisha maabara za tafiti za kisayansi, majaribio ya kina na machapisho ya kiteknolojia.",
      badge: "Deep Research"
    },
    {
      id: "ai",
      number: "3.3",
      name: "SILLYGER AI",
      tagline: "AI, ML, Deep Learning & Intelligent Agents",
      desc: "Utafiti na ujenzi wa baadaye wa Artificial Intelligence, Machine Learning, Computer Vision na NLP.",
      badge: "Intelligence"
    },
    {
      id: "robotics",
      number: "3.4",
      name: "SILLYGER Robotics",
      tagline: "Autonomous & Embedded Systems",
      desc: "Maabara tarajiwa ya Robotics, Embedded Systems, Sensors, Actuators na Micro-controllers.",
      badge: "Robotics"
    },
    {
      id: "cybersecurity",
      number: "3.5",
      name: "SILLYGER Cybersecurity",
      tagline: "Ethical Hacking & Defensive Security",
      desc: "Kitengo tarajiwa cha ulinzi wa mifumo, Ethical Hacking kwenye maabara rasmi, na Digital Forensics.",
      badge: "Security"
    },
    {
      id: "arch",
      number: "3.6",
      name: "SILLYGER Computer Architecture",
      tagline: "Digital Logic, CPUs & Chip Design",
      desc: "Utafiti wa muda mrefu wa Logic Gates, Digital Circuits, CPUs, Memory Systems na Instruction Sets (ISA).",
      badge: "Silicon & Logic"
    },
    {
      id: "systems",
      number: "3.7",
      name: "SILLYGER Systems",
      tagline: "Kernels, Compilers & Low-level Software",
      desc: "Maendeleo ya baadaye ya Operating Systems, Linux Kernels, Device Drivers na Compilers.",
      badge: "Low-Level"
    },
    {
      id: "data",
      number: "3.8",
      name: "SILLYGER Data Systems",
      tagline: "Databases & Big Data Infrastructure",
      desc: "Ujenzi wa mifumo ya Databases, Distributed Storage na miundombinu ya kuchakata data kubwa.",
      badge: "Data Infra"
    },
    {
      id: "networks",
      number: "3.9",
      name: "SILLYGER Networks & Infrastructure",
      tagline: "Cloud, Servers & Data Centers",
      desc: "Dira ya kujenga miundombinu ya Computer Networks, Servers, Cloud Computing na vituo vya data.",
      badge: "Infrastructure"
    },
    {
      id: "electronics",
      number: "3.10",
      name: "SILLYGER Electronics",
      tagline: "Circuits, PCBs & Microelectronics",
      desc: "Maabara tarajiwa ya Electronic Circuits, Microcontrollers, PCB Design na vifaa vya kielektroniki.",
      badge: "Hardware"
    },
    {
      id: "innovation",
      number: "3.11",
      name: "SILLYGER Innovation & Products",
      tagline: "Ideation to Production",
      desc: "Hatua ya baadaye ya kubadilisha miradi ya wanafunzi na tafiti kuwa bidhaa halisi kwa jamii.",
      badge: "Production"
    }
  ];

  return (
    <div className="py-12 md:py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Page Intro */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full badge-pending text-xs font-mono-sg font-bold uppercase">
          FUTURE ROADMAP · DIRA YA MUDA MREFU
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Vitengo Tarajiwa vya Baadaye (Future Vision)
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Ukurasa huu unaonyesha picha kubwa ya mahali tunapoelekea kama jumuiya kadri uwezo na idadi ya wanafunzi vitakavyoongezeka.
        </p>
      </div>

      {/* Transparent Status Callout */}
      <div className="sg-glass p-6 sm:p-7 rounded-2xl border border-amber-500/35 bg-amber-950/10 flex flex-col sm:flex-row items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-400 flex items-center justify-center shrink-0 font-mono-sg font-bold">
          !
        </div>
        <div className="space-y-1 text-xs sm:text-sm text-slate-200 leading-relaxed">
          <p className="font-bold text-white text-sm sm:text-base">Ufafanuzi Muhimu Kwa Sasa:</p>
          <p className="text-slate-300">
            <strong>Kwa sasa hakuna kitengo chochote wala taasisi iliyogawanywa.</strong> Wanachama wote wanaojiunga na SILLYGER wanaingia kama <strong>wanafunzi wanaojifunza kwa pamoja</strong> kwenye kundi moja. Vitengo hivi 11 (Katiba Article 3) vimehifadhiwa hapa kama malengo ya baadaye (Future Roadmap) tutakapoanza rasmi maabara za kisekta.
          </p>
        </div>
      </div>

      {/* 11 Future Divisions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {divisions.map((div) => (
          <div
            key={div.id}
            className="sg-glass sg-glass-hover p-6 rounded-2xl flex flex-col justify-between gap-4 border border-slate-800/80 hover:border-blue-500/40 transition"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-lg badge-future font-mono-sg text-[11px] font-bold">
                  FUTURE · {div.number}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-800">
                  {div.badge}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{div.name}</h3>
                <p className="text-xs text-blue-400 font-mono-sg">{div.tagline}</p>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{div.desc}</p>
            </div>
            <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between text-[11px] font-mono-sg text-slate-500">
              <span>Status: Roadmap Target</span>
              <span>Katiba Art. 3</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Student CTA */}
      <div className="sg-glass p-7 sm:p-9 rounded-3xl border border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Tunaanza Leo Kama Wanafunzi Wanaojifunza Pamoja
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Msingi wa vitengo vyote vya baadaye unajengwa sasa kupitia kujifunza pamoja. Jiunge na mfumo kupata WhatsApp Group access na kuanza safari hii nasi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/courses"
            className="px-5 py-3 rounded-2xl border border-slate-700 hover:border-blue-400 text-xs sm:text-sm font-semibold text-slate-200 transition"
          >
            Angalia Possible Courses
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 rounded-2xl btn-sg-primary text-xs sm:text-sm font-bold shadow-lg"
          >
            Jiunge Sasa &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
