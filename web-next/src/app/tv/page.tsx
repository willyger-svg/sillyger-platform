'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../lib/api';

export default function TvPage() {
  const [tvData, setTvData] = useState<any>({
    title: 'SILLYGER TV Live Broadcast',
    description: 'Karibu kwenye kituo rasmi cha matangazo ya video na madarasa ya moja kwa moja ya wanafunzi wa SILLYGER Community.',
    video_id: 'live_stream',
    is_live: true,
    updated_at: '',
  });

  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(100);
  const [isAdmin, setIsAdmin] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('https://chat.whatsapp.com/KRxyaSoVcUCGLq0PdOy6Jb?s=cl&p=a&iam=2');

  const loadTvData = async () => {
    try {
      const overview = await api.getPublicOverview();
      if (overview?.whatsapp_invite_url) {
        setWhatsappUrl(overview.whatsapp_invite_url);
      }
      const data = await api.getTvBroadcast();
      if (data) {
        setTvData(data);
      }
    } catch (e) {
      console.warn('Failed to fetch TV data:', e);
    }
  };

  useEffect(() => {
    loadTvData();
    const currentMember = api.getCurrentMember();
    if (currentMember?.role === 'SUPER_ADMIN' || currentMember?.role === 'ADMIN') {
      setIsAdmin(true);
    }

    const ws = api.createWebSocket((msg) => {
      if (msg.type === 'live_status') {
        loadTvData();
      }
    });

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const videoSrc = tvData.video_id
    ? `https://www.youtube-nocookie.com/embed/${tvData.video_id}?autoplay=1&mute=${isMuted ? '1' : '0'}&rel=0&enablejsapi=1`
    : 'https://www.youtube-nocookie.com/embed/live_stream?autoplay=1&mute=1&rel=0&enablejsapi=1';

  const toggleAudio = () => {
    setIsMuted(!isMuted);
  };

  const copyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      alert('Kiungo cha SILLYGER TV kimenakiliwa!');
    }
  };

  return (
    <div className="py-8 sm:py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* TV Page Header & Live Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono-sg font-bold uppercase flex items-center gap-2 border ${
                tvData.is_live
                  ? 'bg-red-950/60 border-red-500/50 text-red-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${tvData.is_live ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}
              ></span>
              <span>{tvData.is_live ? 'LIVE BROADCAST CHANNEL' : 'KIPINDI CHA MAKTABA'}</span>
            </span>
            <span className="text-xs text-slate-400 font-mono-sg hidden sm:inline">
              SILLYGER Live Stream Channel
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mt-2 flex items-center gap-3">
            <span>SILLYGER TV</span>
            <span className="text-xs font-mono-sg font-normal px-2.5 py-0.5 rounded-lg bg-blue-950/80 border border-blue-500/30 text-blue-300">
              Free Community Broadcast
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadTvData}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
            title="Sasisha Matangazo ya Sasa"
          >
            <span>🔄</span>
            <span>Sasisha Stream</span>
          </button>
          <Link
            href="/portal"
            className="px-4 py-2 rounded-xl btn-sg-primary text-xs font-bold flex items-center gap-1.5 shadow-md"
          >
            <span>🎓</span>
            <span>Student Portal</span>
          </Link>
        </div>
      </div>

      {/* ========================================================== */}
      {/* MAIN CINEMA SCREEN (16:9 THEATER PLAYER)                  */}
      {/* ========================================================== */}
      <div className="sg-glass p-3 sm:p-5 rounded-3xl border border-blue-500/40 shadow-2xl relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        {/* Background Ambient Glow */}
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-blue-600/15 blur-3xl pointer-events-none"></div>

        {/* Video Player Container */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
          {isPaused ? (
            <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl text-amber-400">
                ⏸️
              </div>
              <h3 className="font-extrabold text-lg text-white">Matangazo Yamesitishwa (Paused)</h3>
              <p className="text-xs text-slate-300 max-w-sm">
                Unaweza kusoma taarifa au kujibu bila kupitwa. Bofya kitufe cha chini kuendelea kutazama.
              </p>
              <button
                onClick={() => setIsPaused(false)}
                className="px-6 py-2.5 rounded-2xl btn-sg-primary text-xs font-bold shadow-xl transition transform hover:scale-105"
              >
                ▶ Endelea Kutazama (Play)
              </button>
            </div>
          ) : (
            <iframe
              className="w-full h-full"
              src={videoSrc}
              title="SILLYGER TV"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}

          {/* TV Watermark Bug */}
          <div className="absolute top-3.5 right-3.5 z-20 pointer-events-none select-none flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono-sg font-bold text-white shadow-xl">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="tracking-wider">SILLYGER TV · CH-1</span>
          </div>

          {/* Floating Unmute Button */}
          {isMuted && !isPaused && (
            <div className="absolute bottom-4 left-4 z-20">
              <button
                type="button"
                onClick={toggleAudio}
                className="px-4 py-2 rounded-full bg-blue-600/95 hover:bg-blue-500 text-white font-bold text-xs shadow-2xl backdrop-blur flex items-center gap-2 transition hover:scale-105 active:scale-95 border border-blue-400/40"
              >
                <span className="animate-pulse">🔊</span>
                <span>Bofya Hapa Kuwasha Sauti</span>
              </button>
            </div>
          )}
        </div>

        {/* Stream Meta Info & TV Broadcast Controls Toolbar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-sg font-bold uppercase ${
                  tvData.is_live ? 'bg-red-950/60 text-red-400 border border-red-500/40' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {tvData.is_live ? 'LIVE' : 'OFFLINE'}
              </span>
              <span className="text-xs font-mono-sg text-blue-400">Live Station</span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] font-mono-sg text-slate-400">
                {tvData.updated_at ? new Date(tvData.updated_at).toLocaleTimeString('sw-TZ') : 'Leo'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight break-words">
              {tvData.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {tvData.description}
            </p>
          </div>

          {/* Direct TV Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-amber-600/30 active:scale-95"
            >
              <span>{isPaused ? '▶' : '⏸️'}</span>
              <span>{isPaused ? 'Endelea (Play)' : 'Sitisha (Pause)'}</span>
            </button>

            {/* Mute/Unmute */}
            <button
              type="button"
              onClick={toggleAudio}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-blue-600/30 active:scale-95"
            >
              <span>{isMuted ? '🔊' : '🔇'}</span>
              <span>{isMuted ? 'Washa Sauti' : 'Zima Sauti'}</span>
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs shadow-inner">
              <span className="text-slate-400 text-[11px] font-mono-sg">🎚️ Sauti</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-16 sm:w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="font-mono-sg text-[10px] text-blue-400 font-bold w-7 text-right">
                {volume}%
              </span>
            </div>

            {/* WhatsApp Discuss */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-95"
            >
              <span>💬</span>
              <span>Jadili WhatsApp</span>
            </a>

            {/* Share */}
            <button
              type="button"
              onClick={copyLink}
              className="px-3 py-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              <span>🔗</span>
              <span>Shiriki</span>
            </button>
          </div>
        </div>
      </div>

      {/* SILLYGER TV CHANNEL GUIDE */}
      <div className="sg-glass p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950/80 via-sgcard/60 to-slate-950/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              <span className="font-mono-sg text-xs font-bold text-blue-400 uppercase tracking-widest">
                Kituo Rasmi cha SILLYGER TV (Channel 1)
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-white">Matangazo Moja kwa Moja ya Jumuiya</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              SILLYGER TV inarusha vipindi vya teknolojia, madarasa ya coding, cybersecurity, mifumo na mihadhara ya wanafunzi moja kwa moja. Matangazo haya yanadhibitiwa na msimamizi na wanachama wote wanatazama kipindi kimoja kwa wakati mmoja bila kuingiliwa na video nyingine.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 shrink-0 text-center font-mono-sg text-xs">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80">
              <span className="text-slate-400 block text-[10px] uppercase">Mfumo</span>
              <span className="text-emerald-400 font-bold">Synchronized Live</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80">
              <span className="text-slate-400 block text-[10px] uppercase">Ubora</span>
              <span className="text-blue-400 font-bold">1080p HD Ready</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80">
              <span className="text-slate-400 block text-[10px] uppercase">Ufikiaji</span>
              <span className="text-purple-400 font-bold">Bure & Wazi</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80">
              <span className="text-slate-400 block text-[10px] uppercase">Miongozo</span>
              <span className="text-amber-400 font-bold">Katiba v1.4</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Notice Callout */}
      {isAdmin && (
        <div className="sg-glass p-5 rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h4 className="text-sm font-bold text-white">Wewe ni Msimamizi (Super Administrator)</h4>
              <p className="text-xs text-slate-300">
                Unaweza kurusha video mpya au kuanzisha Live Stream mpya wakati wowote kutoka Admin Command.
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition whitespace-nowrap shadow-md"
          >
            Fungua TV Broadcast Studio &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
