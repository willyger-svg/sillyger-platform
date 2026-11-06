'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ConstitutionPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const articles = [
    {
      num: 'Ibara ya 1',
      title: 'Jina na Hadhi ya Kisheria ya Jumuiya',
      content:
        'Jumuiya itajulikana kama SILLYGER (SG) Community, ikiwa ni jukwaa huru la kitaaluma, kiteknolojia na kijamii lililoundwa kukuza maarifa na ubunifu miongoni mwa wanafunzi nchini Tanzania.',
    },
    {
      num: 'Ibara ya 2',
      title: 'Dhamira na Maono ya Jumuiya',
      content:
        'Dhamira yetu kuu ni "Learn Together. Build Together. Own the Future Together." Tunalenga kuwajengea uwezo wanafunzi kuwa wataalamu na wamiliki wa teknolojia kwa kujifunza mifumo kwa vitendo.',
    },
    {
      num: 'Ibara ya 3',
      title: 'Haki na Wajibu wa Wanachama',
      content:
        'Kila mwanafunzi aliyesajiliwa ana haki ya kupata mafunzo bure, kupokea kitambulisho cha SG (Digital ID), kushiriki kwenye vipindi vya SILLYGER TV, na kulindwa chini ya Sheria ya Ulinzi wa Taarifa Binafsi (PDPA 2022).',
    },
    {
      num: 'Ibara ya 4',
      title: 'Maadili ya Jumuiya na Nidhamu ya Kujifunza',
      content:
        'Wanachama wanatakiwa kuheshimiana, kusaidiana kwenye changamoto za masomo, na kutumia ujuzi wa kiteknolojia (hasa cybersecurity) kwa manufaa ya kisheria na kimaadili pekee.',
    },
    {
      num: 'Ibara ya 5',
      title: 'Ulinzi wa Faragha na Data (PDPA 2022)',
      content:
        'Taarifa zote za wanachama (namba za simu, barua pepe, na nenosiri lililosimbwa kwa njia salama) zinalindwa kwa mujibu wa Sheria ya Tanzania ya Ulinzi wa Taarifa Binafsi ya mwaka 2022 na hazitashirikishwa kwa mtu yeyote bila idhini.',
    },
  ];

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="py-12 md:py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Header Banner */}
      <div className="sg-glass p-6 sm:p-8 rounded-3xl border border-blue-500/35 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-sg text-blue-400 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md badge-future font-bold">OFFICIAL CHARTER</span>
            <span>VERSION 1.4</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Katiba, Kanuni za Wanachama & Faragha ya Data
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Motto:{' '}
            <span className="text-blue-300 font-semibold font-mono-sg">
              Learn Together. Build Together. Own the Future Together.
            </span>
          </p>
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tafuta kifungu (mf. faragha, PDPA)..."
            className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Notice Banner */}
      <div className="sg-glass p-5 rounded-2xl border border-blue-500/30 bg-blue-950/15 flex items-start gap-4">
        <div className="text-blue-400 text-xl">ℹ️</div>
        <div className="text-xs md:text-sm text-slate-300 leading-relaxed">
          <p className="font-bold text-white mb-1">Mwongozo kwa Wanafunzi Wanaojiunga:</p>
          Wanachama wote wanajifunza kwa pamoja kama jumuiya moja ya wanafunzi. Katiba hii inaeleza maadili ya pamoja, ulinzi wa taarifa binafsi (<strong>PDPA 2022</strong>), na haki za kila mwanachama.
        </div>
      </div>

      {/* Articles */}
      <div className="space-y-4">
        {filtered.map((item, idx) => (
          <div key={idx} className="sg-glass p-6 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-sg font-bold badge-future">
                {item.num}
              </span>
              <h2 className="text-base font-bold text-white">{item.title}</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-1">
              {item.content}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="sg-glass p-8 rounded-3xl border border-blue-500/35 text-center space-y-4">
        <h3 className="text-xl md:text-2xl font-bold text-white">
          Uko Tayari Kujiunga na Jumuiya ya SILLYGER?
        </h3>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Jisajili sasa kama mwanafunzi ili kupata idhini ya kuingia kwenye WhatsApp Group rasmi na kufuatilia masomo yetu ya pamoja.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/portal?tab=register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl btn-sg-primary text-sm font-bold"
          >
            Jiunge Sasa &rarr;
          </Link>
          <Link href="/" className="text-xs text-slate-400 hover:text-white">
            Rudi Mwanzo
          </Link>
        </div>
      </div>
    </div>
  );
}
