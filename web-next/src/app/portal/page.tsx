'use client';

import React, { useState } from 'react';
import DigitalIdCard from '../../components/DigitalIdCard';
import { useI18n } from '../../lib/i18n';
import { User, ShieldCheck, CheckSquare, MessageCircle, ArrowUpRight, Award, Clock } from 'lucide-react';

export default function PortalPage() {
  const { t } = useI18n();
  const [checkedIn, setCheckedIn] = useState(false);

  // Current logged in member data
  const member = {
    fullName: 'Willyger (Mwenyekiti Mwanzilishi)',
    regNumber: 'SG-000001',
    phone: '+255 700 000 000',
    email: 'wshavu@gmail.com',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/10 text-blue-400 text-xs font-mono font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Wasifu Rasmi wa Mwanachama</span>
          </div>
          <h1 className="text-3xl font-black text-white">Wasifu & Kadi Mahiri</h1>
          <p className="text-xs text-slate-400 mt-1">
            Ukurasa wako wa utambulisho, mahudhurio ya vipindi, na kadi yako ya kidijitali.
          </p>
        </div>

        {/* Quick Check-in Button */}
        <button
          onClick={() => setCheckedIn(true)}
          disabled={checkedIn}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition shadow-lg ${
            checkedIn
              ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>{checkedIn ? 'Umehudhuria Leo (Check-in Verified)' : 'Fanya Check-in ya Leo'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Smart Digital ID Card */}
        <div className="space-y-4">
          <div className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-400" />
            <span>Kitambulisho Chako cha Kidijitali</span>
          </div>
          <DigitalIdCard member={member} />
        </div>

        {/* Right Column: Member Dossier & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Member Details Card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              <span>Taarifa za Mwanachama</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 font-mono text-[11px]">Jina Kamili</div>
                <div className="font-bold text-white text-sm mt-0.5">{member.fullName}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 font-mono text-[11px]">Namba ya Usajili</div>
                <div className="font-bold text-blue-400 text-sm mt-0.5 font-mono">{member.regNumber}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 font-mono text-[11px]">Namba ya Simu (WhatsApp)</div>
                <div className="font-bold text-white text-sm mt-0.5 font-mono">{member.phone}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 font-mono text-[11px]">Barua Pepe (Email)</div>
                <div className="font-bold text-white text-sm mt-0.5">{member.email}</div>
              </div>
            </div>
          </div>

          {/* Official WhatsApp Group Gateway */}
          <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-slate-900/40 to-slate-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <span>Kundi Rasmi la WhatsApp la SILLYGER</span>
              </div>
              <p className="text-xs text-slate-400">
                Jiunge na jumuiya ya wanafunzi na wakufunzi kwa ajili ya mijadala ya masomo ya kila siku.
              </p>
            </div>

            <a
              href="https://chat.whatsapp.com/SILLYGER_OFFICIAL"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/30 whitespace-nowrap self-start sm:self-auto"
            >
              <span>Fungua Kundi</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          {/* Attendance History */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Rekodi ya Mahudhurio</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Kipindi cha Usalama wa Mifumo (Cybersecurity)</div>
                  <div className="text-[11px] text-slate-400 font-mono">Leo, 20:00 EAT</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  {checkedIn ? 'Umehudhuria' : 'Hujafanya check-in'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
