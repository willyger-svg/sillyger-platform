'use client';

import React from 'react';
import { useI18n } from '../../lib/i18n';
import { BookOpen, Code, Shield, Database, Smartphone, Globe, Cloud, Bot, Terminal, Cpu } from 'lucide-react';

export default function CoursesPage() {
  const { t } = useI18n();

  const courses = [
    { title: 'Cybersecurity & Ethical Hacking', desc: 'Misingi ya ulinzi wa mitandao, penetration testing na ulinzi wa data.', icon: Shield, level: 'Advanced' },
    { title: 'Fullstack Modern Web (Next.js & React)', desc: 'Utengenezaji wa tovuti za kisasa zenye kasi ya juu na usalama wa kimataifa.', icon: Globe, level: 'All Levels' },
    { title: 'Mobile App Engineering (Flutter & Dart)', desc: 'Kujenga app za Android na iOS kwa kodi moja safi na yenye utendaji wa juu.', icon: Smartphone, level: 'Intermediate' },
    { title: 'High-Performance Backend (Go / Golang)', desc: 'Kujenga microservices na mifumo inayobeba mamilioni ya watumiaji bila kuganda.', icon: Terminal, level: 'Advanced' },
    { title: 'Database Design & PostgreSQL Mastery', desc: 'Usanifu wa hifadhidata imara, SQL normalization, na ulinzi wa RLS.', icon: Database, level: 'Intermediate' },
    { title: 'Cloud DevOps & Containerization (Docker)', desc: 'Kusambaza na kuhifadhi mifumo kwenye wingu bila gharama na kwa uimara wa 99.9%.', icon: Cloud, level: 'Intermediate' },
    { title: 'Artificial Intelligence & Data Analytics', desc: 'Kutumia Python, machine learning na mifumo ya akili mnemba kwenye biashara.', icon: Bot, level: 'Advanced' },
    { title: 'Low-Level Systems & Reverse Engineering', desc: 'Kuelewa jinsi kompyuta inavyofanya kazi kuanzia Assembly hadi RAM.', icon: Cpu, level: 'Specialist' },
  ];

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-600/10 text-blue-400 text-xs font-mono font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Mtaala Rasmi wa SILLYGER</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Mada na Masomo ya Vitendo</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Mitaala 8 ya kiteknolojia iliyoandaliwa kwa vitendo ili kuwajengea wanachama ujuzi wa kiwango cha juu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {courses.map((course) => {
          const Icon = course.icon;
          return (
            <div key={course.title} className="glass-panel p-6 rounded-3xl border border-slate-800 glass-panel-hover flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-base text-white leading-snug">{course.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{course.desc}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
                <span className="text-blue-400 font-bold">{course.level}</span>
                <span className="text-slate-500">SILLYGER Curricula</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
