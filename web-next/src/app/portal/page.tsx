'use client';

import React, { useState, useEffect } from 'react';
import DigitalIdCard from '../../components/DigitalIdCard';
import { useI18n } from '../../lib/i18n';
import api, { Member } from '../../lib/api';
import {
  User,
  ShieldCheck,
  CheckSquare,
  MessageCircle,
  ArrowUpRight,
  Award,
  Clock,
  LogIn,
  UserPlus,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export default function PortalPage() {
  const { t } = useI18n();
  const [member, setMember] = useState<Member | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    // Check local session
    const current = api.getCurrentMember();
    if (current) {
      setMember(current);
      // Optionally verify with Go backend
      api.getMe().then((res) => {
        if (res.member) setMember(res.member);
      }).catch(() => {});
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await api.login(identifier, password);
      setMember(res.member);
      setSuccessMsg('Umefanikiwa kuingia kikamilifu!');
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

      setSuccessMsg(
        'Usajili umewasilishwa kwenye seva ya Go! Ombi lako likiidhinishwa na Uongozi, utapokea namba yako rasmi ya SG.'
      );
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
    setSuccessMsg('Umetoka kwenye mfumo.');
  };

  // Convert Member to DigitalIdCard prop format
  const cardMemberData = member
    ? {
        fullName: member.full_name,
        regNumber: member.reg_number || 'INASUBIRI (PENDING)',
        phone: member.phone,
        email: member.email,
        role: member.role || 'STUDENT',
        status: member.status || 'PENDING',
        avatarUrl: member.avatar_url,
      }
    : null;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/10 text-blue-400 text-xs font-mono font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Go Engine Identity Portal</span>
          </div>
          <h1 className="text-3xl font-black text-white">Wasifu & Kadi Mahiri</h1>
          <p className="text-xs text-slate-400 mt-1">
            Ukurasa wako wa utambulisho, mahudhurio ya vipindi, na kadi yako ya kidijitali.
          </p>
        </div>

        {member && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCheckedIn(true)}
              disabled={checkedIn}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition shadow-lg ${
                checkedIn
                  ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>{checkedIn ? 'Umehudhuria Leo' : 'Check-in ya Leo'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:bg-rose-900/50 text-xs font-bold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Toka</span>
            </button>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      {member && cardMemberData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Smart Digital ID Card */}
          <div className="space-y-4">
            <div className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-400" />
              <span>Kitambulisho Chako cha Kidijitali</span>
            </div>
            <DigitalIdCard member={cardMemberData} />
          </div>

          {/* Right Column: Member Details & Actions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  <span>Taarifa za Mwanachama</span>
                </h3>
                <span
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold uppercase ${
                    member.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {member.status === 'ACTIVE' ? 'Imethibitishwa' : 'Inasubiri Idhini'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 font-mono text-[11px]">Jina Kamili</div>
                  <div className="font-bold text-white text-sm mt-0.5">{member.full_name}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 font-mono text-[11px]">Namba ya Usajili</div>
                  <div className="font-bold text-blue-400 text-sm mt-0.5 font-mono">
                    {member.reg_number || 'Bado haijatolewa'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 font-mono text-[11px]">Namba ya Simu</div>
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
          </div>
        </div>
      ) : (
        /* Login / Register Card when not authenticated */
        <div className="max-w-md mx-auto glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl">
          {/* Tabs */}
          <div className="flex items-center rounded-2xl bg-slate-900/80 p-1 mb-6 border border-slate-800">
            <button
              onClick={() => {
                setAuthMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                authMode === 'login' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Ingia (Login)</span>
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                authMode === 'register' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Jiunge (Register)</span>
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1.5">
                  Namba ya Simu, Email au Namba ya SG
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="mfano: 0712345678 au wshavu@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-3 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1.5">Nenosiri (Password)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Weka nenosiri lako"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-3 text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-sm mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                <span>Ingia Kwenye Wasifu</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1.5">Jina Kamili</label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Jina lako kamili"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-3 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1.5">Namba ya Simu (Tanzania)</label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="07XXXXXXXX au +255..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-3 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1.5">Barua Pepe (Email)</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="mfano@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-3 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1.5">Tengeneza Nenosiri (Herufi 6+)</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Weka nenosiri salama"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-3 text-white"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-sm mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>Kamilisha Usajili</span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
