'use client';

import React, { useState, useEffect } from 'react';
import { useI18n } from '../../lib/i18n';
import api, { Member, TvBroadcast } from '../../lib/api';
import { Shield, Users, Radio, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminPage() {
  const { t } = useI18n();

  const [applicants, setApplicants] = useState<Member[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const [tvTitle, setTvTitle] = useState('SILLYGER Tech Broadcast');
  const [tvUrl, setTvUrl] = useState('https://www.youtube.com/watch?v=live_stream');
  const [isLive, setIsLive] = useState(true);
  const [tvSaving, setTvSaving] = useState(false);
  const [tvSaved, setTvSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load live data from Go Core Engine
  const loadData = async () => {
    try {
      setErrorMessage(null);
      // Fetch Pending Members from Go Backend
      const pending = await api.getPendingMembers();
      setApplicants(pending || []);

      // Fetch Current TV Broadcast from Go Backend
      const tv = await api.getTvBroadcast();
      if (tv) {
        setTvTitle(tv.title || 'SILLYGER Tech Broadcast');
        setTvUrl(tv.video_url || 'https://www.youtube.com/watch?v=live_stream');
        setIsLive(!!tv.is_live);
      }
    } catch (err: any) {
      console.error('Hitilafu:', err);
      setErrorMessage(err.message || 'Hitilafu ya kuwasiliana na seva ya Go.');
    } finally {
      setLoadingApplicants(false);
    }
  };

  useEffect(() => {
    loadData();

    // Setup Realtime WebSocket updates for live admin reactions
    const ws = api.createWebSocket((msg) => {
      if (msg.type === 'notification' || msg.type === 'live_status') {
        loadData();
      }
    });

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleApprove = async (id: string, name: string) => {
    try {
      setApprovingId(id);
      const res = await api.approveMember(id);
      alert(`Mwanachama ${name} ameidhinishwa! Namba Rasmi: ${res.reg_number}`);
      setApplicants((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(`Hitilafu wakati wa kuidhinisha: ${err.message}`);
    } finally {
      setApprovingId(null);
    }
  };

  const handleSaveTv = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setTvSaving(true);
      setErrorMessage(null);

      // Extract youtube id
      let videoId = tvUrl.trim();
      const match = tvUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
      if (match && match[1]) {
        videoId = match[1];
      }

      await api.setTvBroadcast({
        title: tvTitle,
        description: 'Matangazo rasmi ya SILLYGER TV',
        video_url: tvUrl,
        video_id: videoId,
        is_live: isLive,
      });

      setTvSaved(true);
      setTimeout(() => setTvSaved(false), 3000);
    } catch (err: any) {
      alert(`Imeshindikana kusasisha TV: ${err.message}`);
    } finally {
      setTvSaving(false);
    }
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Page Title */}
      <div className="border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/10 text-blue-400 text-xs font-mono font-semibold mb-2">
          <Shield className="w-3.5 h-3.5" />
          <span>Go Engine Executive Command</span>
        </div>
        <h1 className="text-3xl font-black text-white">Jopo Kuu la Utawala (Admin)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Dhibiti maombi ya uanachama, matangazo ya SILLYGER TV, na taarifa rasmi kupitia Go Backend Engine.
        </p>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage} (Hakikisha seva ya Go inafanya kazi).</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TV Broadcast Studio */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
              <span>Studio ya SILLYGER TV</span>
            </h3>
            <span className="text-xs text-blue-400 font-mono">Go Realtime Studio</span>
          </div>

          <form onSubmit={handleSaveTv} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-mono mb-1.5">Kichwa cha Kipindi</label>
              <input
                type="text"
                value={tvTitle}
                onChange={(e) => setTvTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-mono mb-1.5">Kiungo cha YouTube (URL au Video ID)</label>
              <input
                type="text"
                value={tvUrl}
                onChange={(e) => setTvUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-white font-mono"
                required
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
              disabled={tvSaving}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              {tvSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
              <span>{tvSaved ? 'Matangazo Yamesasishwa Moja kwa Moja!' : 'Rusha / Sasisha TV'}</span>
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
            <span className="text-xs text-amber-400 font-mono font-bold">
              {loadingApplicants ? 'Inapakia...' : `${applicants.length} Yanayosubiri`}
            </span>
          </div>

          <div className="space-y-3">
            {loadingApplicants ? (
              <div className="flex items-center justify-center py-10 text-slate-500 text-xs font-mono gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Inavuta maombi kutoka Go Backend...</span>
              </div>
            ) : applicants.length === 0 ? (
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
                    <div className="font-bold text-white text-sm">{app.full_name}</div>
                    <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                      {app.phone} • {app.email}
                    </div>
                    {app.created_at && (
                      <div className="text-slate-500 text-[10px] mt-1">
                        {new Date(app.created_at).toLocaleString('sw-TZ')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(app.id, app.full_name)}
                      disabled={approvingId === app.id}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold transition shadow-md shadow-emerald-600/30"
                    >
                      {approvingId === app.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
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
