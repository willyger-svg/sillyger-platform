'use client';

import React from 'react';
import TvPlayer from '../../components/TvPlayer';
import { useI18n } from '../../lib/i18n';
import { Video, Clock, CheckCircle } from 'lucide-react';

export default function TvPage() {
  const { t } = useI18n();

  const archivedVideos = [
    {
      id: 'v1',
      title: 'Misingi ya Ulinzi wa Mifumo na Usalama wa Mitandao (Cybersecurity 101)',
      date: 'Novemba 2026',
      duration: '45 mins',
      speaker: 'Willyger',
    },
    {
      id: 'v2',
      title: 'Kuanza na Utengenezaji wa Programu za Kisasa za Simu (Flutter & Go)',
      date: 'Oktoba 2026',
      duration: '52 mins',
      speaker: 'Kitengo cha Uhandisi',
    },
    {
      id: 'v3',
      title: 'Uchambuzi wa Katiba ya SILLYGER v1.4 na Haki za Wanachama',
      date: 'Oktoba 2026',
      duration: '38 mins',
      speaker: 'Sekretarieti Kuu',
    },
  ];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Live Stream & Chat */}
      <TvPlayer />

      {/* Video Archive Section */}
      <section className="space-y-6 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-400" />
            <span>Kumbukumbu za Masomo ya Nyuma (Archive)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">3 Vipindi Vilivyorekodiwa</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {archivedVideos.map((vid) => (
            <div
              key={vid.id}
              className="glass-panel p-5 rounded-3xl border border-slate-800 glass-panel-hover flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    {vid.date}
                  </span>
                  <span className="text-blue-400 font-bold">{vid.duration}</span>
                </div>
                <h4 className="font-bold text-sm text-white leading-snug">
                  {vid.title}
                </h4>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Mkufunzi: {vid.speaker}</span>
                <span className="text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Imethibitishwa
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
