'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '../lib/i18n';
import { Play, Pause, Maximize, MessageSquare, Send, Users, Radio, ShieldCheck } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender_name: string;
  message: string;
  is_admin: boolean;
  timestamp: string;
}

export default function TvPlayer() {
  const { t } = useI18n();
  const [isPaused, setIsPaused] = useState(false);
  const [isCinema, setIsCinema] = useState(false);
  const [viewerCount, setViewerCount] = useState(24);
  const [isLive, setIsLive] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender_name: 'Uongozi wa SILLYGER',
      message: 'Karibuni sana kwenye matangazo ya SILLYGER TV Moja kwa Moja!',
      is_admin: true,
      timestamp: '19:45',
    },
    {
      id: '2',
      sender_name: 'Willyger (Mwenyekiti)',
      message: 'Leo tunajadili mfumo wa Fullstack na ulinzi thabiti wa jumuiya yetu.',
      is_admin: true,
      timestamp: '19:50',
    },
    {
      id: '3',
      sender_name: 'Baraka J.',
      message: 'Safi sana, picha na sauti inakuja safi kabisa.',
      is_admin: false,
      timestamp: '19:52',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: String(Date.now()),
      sender_name: 'Wewe (Mwanachama)',
      message: inputText.trim(),
      is_admin: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  return (
    <div className={`transition-all duration-300 ${isCinema ? 'fixed inset-0 z-50 bg-slate-950 p-4 md:p-8 overflow-y-auto' : 'w-full'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs tracking-wider">
              <Radio className="w-3.5 h-3.5 animate-pulse text-rose-500" />
              <span>{isLive ? t('tv_live_badge') : t('tv_offline_badge')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>{viewerCount} Watazamaji</span>
            </div>
          </div>

          {/* Action Buttons: Pause & Cinema */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
                isPaused
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
              }`}
              title="Sitisha video ili uweze kusoma au kujibu soga bila kupitwa"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span>{isPaused ? t('tv_resume') : t('tv_pause')}</span>
            </button>

            <button
              onClick={() => setIsCinema(!isCinema)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 text-slate-300 hover:text-white transition"
              title="Cinema Mode"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Player & Chat Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Stream Frame */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video rounded-3xl overflow-hidden border border-slate-800 bg-black shadow-2xl group">
              {isPaused ? (
                <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-4 text-amber-400">
                    <Pause className="w-8 h-8" />
                  </div>
                  <h3 className="font-extrabold text-lg text-white mb-1">
                    Matangazo Yamesitishwa (Paused)
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mb-5">
                    Unaweza kuandika na kusoma ujumbe kwenye soga kwa utulivu. Bofya hapa chini kuendelea.
                  </p>
                  <button
                    onClick={() => setIsPaused(false)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition transform hover:scale-105"
                  >
                    <Play className="w-4 h-4" />
                    <span>{t('tv_resume')}</span>
                  </button>
                </div>
              ) : (
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube-nocookie.com/embed/live_stream?channel=UC_SILLYGER_DEMO&autoplay=1&mute=0&rel=0&enablejsapi=1"
                  title="SILLYGER TV"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>

            {/* Video Title & Description Card */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800/80">
              <h2 className="text-lg md:text-xl font-black text-white">
                SILLYGER Tech Broadcast: Kipindi Rasmi cha Mafunzo
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Mawasilisho ya moja kwa moja ya programu, sayansi ya data, ujasiriamali wa kidijitali, na miongozo ya katiba ya jumuiya ya SILLYGER (SG).
              </p>
            </div>
          </div>

          {/* Realtime Live Chat Column */}
          <div className="glass-panel rounded-3xl border border-slate-800/80 flex flex-col h-[520px] overflow-hidden shadow-2xl">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span>{t('chat_title')}</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Sync
              </span>
            </div>

            {/* Chat Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-2xl text-xs transition ${
                    msg.is_admin
                      ? 'bg-blue-950/40 border border-blue-700/40'
                      : 'bg-slate-900/70 border border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`font-bold flex items-center gap-1 ${msg.is_admin ? 'text-blue-400' : 'text-slate-200'}`}>
                      {msg.is_admin && <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />}
                      {msg.sender_name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{msg.timestamp}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed break-words">{msg.message}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800/80 bg-slate-900/40 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('chat_placeholder')}
                className="flex-1 bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition font-sans"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition shadow-md shadow-blue-600/30 flex items-center justify-center"
                title={t('chat_send')}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
