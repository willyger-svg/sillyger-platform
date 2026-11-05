'use client';

import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { Shield, Users, Radio, Megaphone, CheckCircle2, XCircle, DollarSign, Sparkles } from 'lucide-react';

interface Applicant {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  date: string;
}

export default function AdminPage() {
  const { t } = useI18n();

  const [applicants, setApplicants] = useState<Applicant[]>([
    {
      id: 'app-1',
      fullName: 'Amina Hamisi',
      phone: '+255 712 345 678',
      email: 'amina.hamisi@example.com',
      date: 'Novemba 5, 2026',
    },
    {
      id: 'app-2',
      fullName: 'Kelvin Mushi',
      phone: '+255 754 987 654',
      email: 'kelvin.m@example.com',
      date: 'Novemba 5, 2026',
    },
  ]);

  const [tvTitle, setTvTitle] = useState('SILLYGER Tech Broadcast');
  const [tvUrl, setTvUrl] = useState('https://www.youtube.com/watch?v=live_stream');
  const [isLive, setIsLive] = useState(true);
  const [tvSaved, setTvSaved] = useState(false);

  const handleApprove = (id: string, name: string) => {
    alert(`Mwanachama ${name} ameidhinishwa na kupewa namba rasmi ya SG!`);
    setApplicants(applicants.filter((a) => a.id !== id));
  };

  const handleSaveTv = (e: React.FormEvent) => {
    e.preventDefault();
    setTvSaved(true);
    setTimeout(() => setTvSaved(false), 3000);
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Page Title */}
      <div className="border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/10 text-blue-400 text-xs font-mono font-semibold mb-2">
          <Shield className="w-3.5 h-3.5" />
          <span>Executive Command Center</span>
        </div>
        <h1 className="text-3xl font-black text-white">Jopo Kuu la Utawala (Admin)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Dhibiti maombi ya uanachama, matangazo ya SILLYGER TV, na taarifa rasmi za jamii.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TV Broadcast Studio */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
              <span>Studio ya SILLYGER TV</span>
            </h3>
            <span className="text-xs text-blue-400 font-mono">Control Room</span>
          </div>

          <form onSubmit={handleSaveTv} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-mono mb-1.5">Kichwa cha Kipindi</label>
              <input
                type="text"
                value={tvTitle}
                onChange={(e) => setTvTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-mono mb-1.5">Kiungo cha YouTube (URL au Video ID)</label>
              <input
                type="text"
                value={tvUrl}
                onChange={(e) => setTvUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-white font-mono"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 text-slate-300 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLive}
                  onChange={(e) => setIsLive(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 w-4 h-4"
                />
                <span>Washa Hali ya Moja kwa Moja (Live Broadcast On)</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <Radio className="w-4 h-4" />
              <span>{tvSaved ? 'Matangazo Yamesasishwa!' : 'Rusha / Sasisha TV'}</span>
            </button>
          </form>
        </div>

        {/* Member Approval Queue */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span>Foleni ya Maombi ya Usajili</span>
            </h3>
            <span className="text-xs text-amber-400 font-mono font-bold">{applicants.length} Yanayosubiri</span>
          </div>

          <div className="space-y-3">
            {applicants.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-mono">
                Hakuna maombi mapya kwa sasa. Foleni iko safi!
              </div>
            ) : (
              applicants.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-white text-sm">{app.fullName}</div>
                    <div className="text-slate-400 font-mono text-[11px] mt-0.5">{app.phone} • {app.email}</div>
                    <div className="text-slate-500 text-[10px] mt-1">{app.date}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(app.id, app.fullName)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md shadow-emerald-600/30"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Idhinisha</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
