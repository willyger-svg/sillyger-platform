'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api, { Member } from '../../lib/api';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'tv' | 'announcements'>('pending');
  const [pendingMembers, setPendingMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // TV Controls State
  const [tvTitle, setTvTitle] = useState('SILLYGER Tech Broadcast');
  const [tvUrl, setTvUrl] = useState('https://www.youtube.com/watch?v=live_stream');
  const [isLive, setIsLive] = useState(true);
  const [tvSaving, setTvSaving] = useState(false);
  const [tvSuccess, setTvSuccess] = useState(false);

  // Announcements State
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annSaving, setAnnSaving] = useState(false);
  const [annSuccess, setAnnSuccess] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const pending = await api.getPendingMembers();
      setPendingMembers(pending || []);

      const tv = await api.getTvBroadcast();
      if (tv) {
        setTvTitle(tv.title || 'SILLYGER Tech Broadcast');
        setTvUrl(tv.video_url || 'https://www.youtube.com/watch?v=live_stream');
        setIsLive(!!tv.is_live);
      }
    } catch (e) {
      console.warn('Error loading admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
      alert(`Mwanachama ${name} ameidhinishwa kikamilifu! Namba Rasmi: ${res.reg_number}`);
      setPendingMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (e: any) {
      alert(`Hitilafu: ${e.message}`);
    } finally {
      setApprovingId(null);
    }
  };

  const handleSaveTv = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setTvSaving(true);
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

      setTvSuccess(true);
      setTimeout(() => setTvSuccess(false), 3000);
    } catch (e: any) {
      alert(`Hitilafu wakati wa kurusha TV: ${e.message}`);
    } finally {
      setTvSaving(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    try {
      setAnnSaving(true);
      await api.createAnnouncement({
        title: annTitle,
        content: annContent,
        priority: 'HIGH',
        category: 'Taarifa Rasmi',
      });
      setAnnTitle('');
      setAnnContent('');
      setAnnSuccess(true);
      setTimeout(() => setAnnSuccess(false), 3000);
      alert('Tangazo limechapishwa na kutumwa kwa wanachama wote!');
    } catch (e: any) {
      alert(`Hitilafu ya tangazo: ${e.message}`);
    } finally {
      setAnnSaving(false);
    }
  };

  return (
    <div className="py-8 sm:py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Admin Header Bar */}
      <div className="sg-glass p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-500/35">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-blue-500/40 flex items-center justify-center shrink-0 shadow-lg text-2xl">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-white">Jopo Kuu la Utawala (Admin)</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono-sg font-bold bg-blue-600/20 text-blue-300 border border-blue-500/40 uppercase">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Udhibiti wa uanachama, matangazo ya SILLYGER TV, na taarifa rasmi za jumuiya.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/tv"
            className="px-3.5 py-2 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-bold hover:bg-red-900/50 transition flex items-center gap-1.5"
          >
            <span>📺</span>
            <span>Tazama TV</span>
          </Link>
          <Link
            href="/portal"
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold hover:text-white transition"
          >
            Student Portal
          </Link>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'pending' ? 'btn-sg-primary shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>📥</span>
          <span>Maombi Mapya (Foleni)</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-900 text-[10px] font-mono-sg text-amber-400 font-bold border border-amber-500/30">
            {pendingMembers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tv')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'tv' ? 'btn-sg-primary shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>📺</span>
          <span>SILLYGER TV Live Control</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'announcements' ? 'btn-sg-primary shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>📢</span>
          <span>Matangazo Rasmi</span>
        </button>
      </div>

      {/* Tab 1: Pending Members Queue */}
      {activeTab === 'pending' && (
        <div className="sg-glass p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-extrabold text-white">Maombi Yanayosubiri Idhini</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Kagua taarifa za mwanafunzi na ubofye "Idhinisha" ili apewe namba rasmi ya SG.
              </p>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono-sg text-slate-300 hover:text-white transition"
            >
              🔄 Sasisha
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs font-mono-sg">
              Inapakia maombi kutoka seva ya Go...
            </div>
          ) : pendingMembers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-mono-sg">
              Hakuna maombi mapya yanayosubiri. Foleni iko safi kabisa!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingMembers.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-extrabold text-white text-sm">{m.full_name}</div>
                    <div className="text-slate-400 font-mono-sg text-[11px]">
                      {m.phone} • {m.email}
                    </div>
                    {m.created_at && (
                      <div className="text-slate-500 text-[10px]">
                        Tarehe: {new Date(m.created_at).toLocaleDateString('sw-TZ')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(m.id, m.full_name)}
                      disabled={approvingId === m.id}
                      className="px-4 py-2 rounded-xl btn-sg-emerald text-xs font-bold shadow-md transition disabled:opacity-50"
                    >
                      {approvingId === m.id ? 'Inaidhinisha...' : 'Idhinisha Mwanachama'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: TV Broadcast Studio */}
      {activeTab === 'tv' && (
        <div className="sg-glass p-6 sm:p-8 rounded-3xl border border-blue-500/35 max-w-2xl mx-auto space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>📺</span>
              <span>Studio ya SILLYGER TV</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Weka kiungo cha video ya YouTube ya moja kwa moja au somo lolote la teknolojia.
            </p>
          </div>

          {tvSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs">
              Matangazo ya TV yamesasishwa kikamilifu!
            </div>
          )}

          <form onSubmit={handleSaveTv} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Kichwa cha Kipindi</label>
              <input
                type="text"
                value={tvTitle}
                onChange={(e) => setTvTitle(e.target.value)}
                className="w-full sg-input rounded-xl px-4 py-3 text-white text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Kiungo cha YouTube (URL au Video ID)
              </label>
              <input
                type="text"
                value={tvUrl}
                onChange={(e) => setTvUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full sg-input rounded-xl px-4 py-3 text-white text-xs font-mono"
                required
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2 text-slate-200 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLive}
                  onChange={(e) => setIsLive(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 w-4 h-4"
                />
                <span>Washa Hali ya Moja kwa Moja (Live Stream On)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={tvSaving}
              className="w-full py-3.5 rounded-2xl btn-sg-primary text-xs font-bold shadow-lg"
            >
              {tvSaving ? 'Inasasisha...' : 'Rusha / Sasisha TV Moja kwa Moja'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Announcements */}
      {activeTab === 'announcements' && (
        <div className="sg-glass p-6 sm:p-8 rounded-3xl border border-blue-500/35 max-w-2xl mx-auto space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>📢</span>
              <span>Chapisha Tangazo Rasmi</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Tangazo hili litaonekana kwenye Student Dashboard ya wanachama wote.
            </p>
          </div>

          {annSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs">
              Tangazo limechapishwa kikamilifu!
            </div>
          )}

          <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Kichwa cha Tangazo</label>
              <input
                type="text"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="mfano: Ratiba Mpya ya Kipindi cha Usalama wa Mifumo"
                className="w-full sg-input rounded-xl px-4 py-3 text-white text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Maelezo Kamili ya Tangazo</label>
              <textarea
                rows={4}
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                placeholder="Andika taarifa kamili hapa..."
                className="w-full sg-input rounded-xl px-4 py-3 text-white text-xs"
                required
              />
            </div>

            <button
              type="submit"
              disabled={annSaving}
              className="w-full py-3.5 rounded-2xl btn-sg-primary text-xs font-bold shadow-lg"
            >
              {annSaving ? 'Inachapisha...' : 'Chapisha Tangazo Rasmi'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
