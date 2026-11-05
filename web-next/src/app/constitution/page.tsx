'use client';

import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { ScrollText, Search, ShieldCheck } from 'lucide-react';

export default function ConstitutionPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');

  const articles = [
    {
      num: 'Ibara ya 1',
      title: 'Jina na Hadhi ya Kisheria ya Jumuiya',
      content: 'Jumuiya itajulikana kama SILLYGER (SG) Community, ikiwa ni jukwaa huru la kitaaluma, kiteknolojia na kijamii lililoundwa kukuza maarifa na ubunifu.',
    },
    {
      num: 'Ibara ya 2',
      title: 'Dhamira na Maono ya Jumuiya',
      content: 'Dhamira yetu ni "Learn Together. Build Together. Own the Future Together." Tunalenga kuwajengea uwezo wanachama kuwa wamiliki na viongozi wa teknolojia za kesho.',
    },
    {
      num: 'Ibara ya 6',
      title: 'Haki na Wajibu wa Wanachama',
      content: 'Kila mwanachama aliyesajiliwa ana haki ya kupata mafunzo, kushiriki kwenye mikutano, kupokea kitambulisho cha kidijitali, na kulindwa chini ya PDPA 2022.',
    },
    {
      num: 'Ibara ya 9',
      title: 'Mahudhurio na Ushiriki wa Vipindi',
      content: 'Wanachama wanatakiwa kufanya check-in ya mahudhurio katika vipindi rasmi vya mafunzo kupitia mfumo wa kidijitali wa SG Portal.',
    },
    {
      num: 'Ibara ya 13',
      title: 'Mfuko wa Jamii (SG Community Fund)',
      content: 'Mapato yote na michango ya hiari itasimamiwa kwa uwazi wa asilimia 100 kupitia leja ya kidijitali inayoonekana kwa wanachama wote.',
    },
  ];

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()) ||
      a.num.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-600/10 text-blue-400 text-xs font-mono font-semibold">
          <ScrollText className="w-3.5 h-3.5" />
          <span>Katiba Rasmi ya SILLYGER v1.4</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">Katiba ya Jumuiya</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Mwongozo rasmi wa uendeshaji, utawala, sheria, haki na wajibu wa wanachama wa SILLYGER (SG).
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-xl mx-auto">
        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tafuta ibara, kifungu au neno kuu kwenye katiba..."
          className="w-full bg-slate-900/90 border border-slate-800 focus:border-blue-500 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-xl"
        />
      </div>

      {/* Articles List */}
      <div className="space-y-4 pt-4">
        {filtered.map((item) => (
          <div key={item.num} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-600/10 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                {item.num}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Toleo la 1.4</span>
            </div>
            <h3 className="font-extrabold text-base text-white">{item.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
