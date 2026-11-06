'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import QRCode from 'qrcode';
import api, { Member } from '../../lib/api';

export default function PortalPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';

  const [authMode, setAuthMode] = useState<'login' | 'register'>(initialTab);
  const [member, setMember] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'idcard' | 'whatsapp' | 'updates'>('overview');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    const current = api.getCurrentMember();
    if (current) {
      setMember(current);
      generateQr(current);
      api.getMe().then((res) => {
        if (res.member) {
          setMember(res.member);
          generateQr(res.member);
        }
      }).catch(() => {});
    }
  }, []);

  const generateQr = (m: Member) => {
    const payload = JSON.stringify({
      id: m.reg_number || 'PENDING',
      name: m.full_name,
      status: m.status,
      org: 'SILLYGER Community Tanzania',
    });
    QRCode.toDataURL(payload, { width: 140, margin: 1, color: { dark: '#0066FF', light: '#0b1120' } })
      .then(setQrCodeUrl)
      .catch(() => {});
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await api.login(identifier, password);
      setMember(res.member);
      generateQr(res.member);
      setSuccessMsg('Umefanikiwa kuingia kwenye Student Dashboard!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Hitilafu wakati wa kuingia.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await api.register({
        full_name: regFullName,
        phone: regPhone,
        email: regEmail,
        password: regPassword,
      });

      setSuccessMsg('Usajili umewasilishwa! Subiri sekunde chache ili uweze kuingia.');
      setAuthMode('login');
      setIdentifier(regPhone);
    } catch (err: any) {
      setErrorMsg(err.message || 'Hitilafu wakati wa kusajili.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.clearSession();
    setMember(null);
    setSuccessMsg('Umetoka kwenye akaunti yako.');
  };

  return (
    <div className="py-8 sm:py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* ============================================================== */}
      {/* VIEW 1: AUTHENTICATION (LOGIN OR REGISTER)                     */}
      {/* ============================================================== */}
      {!member ? (
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <img
              src="/assets/sillyger-logo-icon.svg"
              alt="SILLYGER"
              className="w-14 h-14 rounded-2xl mx-auto mb-3 shadow-lg shadow-blue-600/30"
            />
            <h1 className="text-2xl font-extrabold text-white">Student Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1">
              Ingia kufikia kitambulisho, WhatsApp Group, na vipindi vya moja kwa moja.
            </p>
          </div>

          <div className="sg-glass p-6 sm:p-8 rounded-3xl border border-blue-500/35 space-y-5">
            {/* Toggle Tabs */}
            <div className="flex items-center rounded-2xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  authMode === 'login' ? 'btn-sg-primary shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Ingia Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  authMode === 'register' ? 'btn-sg-primary shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Fomu ya Kujiunga
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs">
                {successMsg}
              </div>
            )}

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Namba ya Simu, Email au SG-ID
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="07xxxxxxxx au wshavu@gmail.com"
                    className="w-full sg-input rounded-xl px-4 py-3 text-white text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Nenosiri</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Weka nenosiri lako"
                    className="w-full sg-input rounded-xl px-4 py-3 text-white text-xs"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl btn-sg-primary text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>{loading ? 'Inafungua...' : 'Fungua Dashboard Yangu'}</span>
                  <span>&rarr;</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Jina Kamili</label>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Jina lako kamili"
                    className="w-full sg-input rounded-xl px-4 py-3 text-white text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Namba ya Simu (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="07xxxxxxxx au +255..."
                    className="w-full sg-input rounded-xl px-4 py-3 text-white text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Barua Pepe (Email)</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="mfano@gmail.com"
                    className="w-full sg-input rounded-xl px-4 py-3 text-white text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Tengeneza Nenosiri (Herufi 6+)
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Weka nenosiri salama"
                    className="w-full sg-input rounded-xl px-4 py-3 text-white text-xs"
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl btn-sg-primary text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>{loading ? 'Inatuma...' : 'Ndiyo, Wasilisha Maombi Yangu'}</span>
                  <span>&rarr;</span>
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* VIEW 2: LOGGED IN MULTI-PANEL STUDENT DASHBOARD                */
        /* ============================================================== */
        <div className="space-y-6">
          {/* Top Greeting & User Bar */}
          <div className="sg-glass p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/25 overflow-hidden">
                <img
                  src="/assets/sillyger-logo-icon.svg"
                  alt="SG"
                  className="w-full h-full object-contain p-1.5"
                />
              </div>
              <div>
                <span className="text-[11px] font-mono-sg text-blue-400 uppercase font-semibold block">
                  STUDENT WORKSPACE
                </span>
                <h1 className="text-lg sm:text-xl font-extrabold text-white">
                  Karibu, {member.full_name}!
                </h1>
                <p className="text-xs text-slate-400">
                  {member.reg_number || 'Akaunti inasubiri idhini ya Super Admin'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold hover:text-white transition"
              >
                🖨️ Chapisha Kadi
              </button>
              <button
                onClick={handleLogout}
                className="px-3.5 py-2 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-bold hover:bg-red-900/50 transition"
              >
                Toka
              </button>
            </div>
          </div>

          {/* 4 KPI METRIC CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sg-glass p-4 sm:p-5 rounded-2xl space-y-1.5">
              <div className="text-xs text-slate-400">Student ID</div>
              <div className="text-base sm:text-lg font-extrabold font-mono-sg text-white truncate">
                {member.reg_number || 'Inasubiri'}
              </div>
              <div className="text-[11px] text-blue-400">SG Community</div>
            </div>

            <div
              onClick={() => setActiveTab('whatsapp')}
              className="sg-glass p-4 sm:p-5 rounded-2xl space-y-1.5 cursor-pointer hover:border-emerald-500/40 transition"
            >
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>WhatsApp Group</span>
                <span>💬</span>
              </div>
              <div className="text-base sm:text-lg font-extrabold text-emerald-400">Imefunguliwa</div>
              <div className="text-[11px] text-slate-400">Bofya kujiunga &rarr;</div>
            </div>

            <div className="sg-glass p-4 sm:p-5 rounded-2xl space-y-1.5">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Hadhi ya Uanachama</span>
                <span>🛡️</span>
              </div>
              <div className="text-base sm:text-lg font-extrabold text-white">
                {member.status === 'ACTIVE' ? 'Imethibitishwa' : 'Inakaguliwa'}
              </div>
              <div className="text-[11px] text-emerald-400">Rasmi</div>
            </div>

            <div
              onClick={() => setActiveTab('idcard')}
              className="sg-glass p-4 sm:p-5 rounded-2xl space-y-1.5 cursor-pointer hover:border-blue-500/40 transition"
            >
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Kitambulisho Mahiri</span>
                <span>🎓</span>
              </div>
              <div className="text-base sm:text-lg font-extrabold font-mono-sg text-blue-400">Digital ID</div>
              <div className="text-[11px] text-slate-400">Tazama kadi &rarr;</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 rounded-xl transition ${
                activeTab === 'overview' ? 'btn-sg-primary' : 'text-slate-400 hover:text-white'
              }`}
            >
              📊 Muhtasari (Overview)
            </button>
            <button
              onClick={() => setActiveTab('idcard')}
              className={`px-4 py-2.5 rounded-xl transition ${
                activeTab === 'idcard' ? 'btn-sg-primary' : 'text-slate-400 hover:text-white'
              }`}
            >
              👤 Kitambulisho Changu
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`px-4 py-2.5 rounded-xl transition ${
                activeTab === 'whatsapp' ? 'btn-sg-primary' : 'text-slate-400 hover:text-white'
              }`}
            >
              💬 WhatsApp Group
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* WhatsApp Card */}
              <div className="sg-glass p-6 rounded-3xl border border-emerald-500/30 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <span>💬</span>
                  <span>Kundi Rasmi la WhatsApp la SILLYGER</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Jiunge na darasa la wanafunzi na wakufunzi kwa ajili ya mijadala ya moja kwa moja na masomo ya kila siku.
                </p>
                <a
                  href="https://chat.whatsapp.com/SILLYGER_OFFICIAL"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/30"
                >
                  <span>Fungua WhatsApp Group</span>
                  <span>&rarr;</span>
                </a>
              </div>

              {/* Attendance Quick Check-in */}
              <div className="sg-glass p-6 rounded-3xl border border-blue-500/30 space-y-4">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <span>✅</span>
                  <span>Mahudhurio na Check-in ya Leo</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Thibitisha ushiriki wako katika vipindi vya masomo na matangazo ya SILLYGER TV.
                </p>
                <button
                  onClick={() => alert('Umehudhuria kipindi cha leo kikamilifu!')}
                  className="px-5 py-3 rounded-xl btn-sg-primary font-bold text-xs shadow-lg"
                >
                  Fanya Check-in ya Leo
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Digital ID Card */}
          {activeTab === 'idcard' && (
            <div className="flex flex-col items-center justify-center space-y-6">
              {/* The Printable Digital ID Card */}
              <div
                id="sg-printable-id-card"
                className="w-full max-w-sm rounded-3xl p-6 relative overflow-hidden shadow-2xl border border-blue-500/40 bg-gradient-to-b from-[#0b1120] via-[#111a2e] to-[#060a14] text-white"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <img src="/assets/sillyger-logo-icon.svg" alt="SG" className="w-9 h-9 rounded-xl shadow-md" />
                    <div>
                      <span className="font-extrabold text-sm tracking-wide block">SILLYGER</span>
                      <span className="text-[9px] font-mono-sg text-blue-400 uppercase tracking-wider block">
                        Student Tech Community
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono-sg font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-500/40">
                    Mwanachama
                  </span>
                </div>

                {/* Body Details */}
                <div className="flex items-center gap-4 py-2">
                  <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-blue-500/40 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                    <img
                      src="/assets/sillyger-logo-icon.svg"
                      alt="Avatar"
                      className="w-full h-full object-cover p-2"
                    />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="text-sm font-extrabold text-white truncate">{member.full_name}</div>
                    <div className="text-xs font-mono-sg text-blue-400 font-bold">
                      {member.reg_number || 'SG-PENDING'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{member.phone}</div>
                    <div className="text-[10px] text-slate-400 truncate">{member.email}</div>
                  </div>
                </div>

                {/* QR Code and Footer */}
                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-mono-sg text-slate-500 uppercase block">KUTHIBITISHWA NA</span>
                    <span className="text-[11px] font-bold text-slate-300">Sekretarieti ya SG</span>
                    <span className="text-[8px] font-mono-sg text-slate-500 block mt-0.5">PDPA 2022 Certified</span>
                  </div>
                  {qrCodeUrl && (
                    <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16 rounded-lg bg-white p-1 shadow-md" />
                  )}
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 rounded-2xl btn-sg-primary text-xs font-bold shadow-lg flex items-center gap-2"
              >
                <span>🖨️ Chapisha / Hifadhi Kitambulisho (PDF)</span>
              </button>
            </div>
          )}

          {/* Tab 3: WhatsApp Group */}
          {activeTab === 'whatsapp' && (
            <div className="sg-glass p-8 rounded-3xl border border-emerald-500/30 max-w-xl mx-auto text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-3xl">
                💬
              </div>
              <h3 className="text-xl font-extrabold text-white">WhatsApp Discussion Group</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Hapa ndipo wanafunzi na wakufunzi wa SILLYGER wanapokutana kujadili masomo ya programu, usalama wa mifumo (cybersecurity), na kutatua changamoto za masomo pamoja.
              </p>
              <a
                href="https://chat.whatsapp.com/SILLYGER_OFFICIAL"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xl transition transform hover:scale-105"
              >
                <span>Jiunge na Kundi la WhatsApp Moja kwa Moja</span>
                <span>&rarr;</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
