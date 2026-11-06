'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import api from '../../lib/api';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [motivation, setMotivation] = useState('');

  const [agreeConstitution, setAgreeConstitution] = useState(false);
  const [agreeEthics, setAgreeEthics] = useState(false);
  const [agreePdpa, setAgreePdpa] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredApplicant, setRegisteredApplicant] = useState<{
    fullName: string;
    username: string;
    phone: string;
  } | null>(null);

  // Phone normalization & validation preview
  const normalizePhone = (raw: string) => {
    let clean = raw.replace(/[^0-9+]/g, '');
    if (clean.startsWith('0')) {
      clean = '+255' + clean.slice(1);
    } else if (clean.startsWith('255')) {
      clean = '+' + clean;
    }
    return clean;
  };

  const isValidTzPhone = (norm: string) => {
    return /^\+255[67]\d{8}$/.test(norm);
  };

  const normalizedPhone = normalizePhone(phone);
  const phoneIsValid = isValidTzPhone(normalizedPhone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!agreeConstitution || !agreeEthics || !agreePdpa) {
      setErrorMsg('Tafadhali weka alama kwenye kanuni zote tatu za jumuiya ili kuendelea.');
      return;
    }

    if (!fullName || fullName.trim().length < 3) {
      setErrorMsg('Tafadhali weka jina lako kamili halisi.');
      return;
    }

    if (!username || username.trim().length < 3 || !/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setErrorMsg('Username lazima iwe na herufi au nambari pekee bila nafasi (angalau herufi 3).');
      return;
    }

    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMsg('Tafadhali weka barua pepe (Email) sahihi.');
      return;
    }

    if (!phoneIsValid) {
      setErrorMsg('Namba ya WhatsApp si sahihi kwa Tanzania. Weka muundo wa 07XXXXXXXX au +2557XXXXXXXX.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Nenosiri (Password) lazima liwe na angalau herufi 6.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Manenosiri (Passwords) hayafanani. Hakiki tena.');
      return;
    }

    setLoading(true);

    try {
      await api.register({
        full_name: fullName.trim(),
        phone: normalizedPhone,
        email: email.trim().toLowerCase(),
        password,
      });

      setRegisteredApplicant({
        fullName: fullName.trim(),
        username: username.trim(),
        phone: normalizedPhone,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Hitilafu imetokea wakati wa usajili. Jaribu tena.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* SUCCESS SCREEN */}
        {registeredApplicant ? (
          <div className="sg-glass p-8 md:p-10 rounded-3xl border border-blue-500/35 text-center space-y-6">
            <img
              src="/assets/sillyger-logo-icon.svg"
              alt="SILLYGER"
              className="w-16 h-16 rounded-2xl mx-auto shadow-xl shadow-blue-600/30"
            />

            <div>
              <span className="inline-block px-3 py-1 rounded-full badge-future text-xs font-mono-sg font-bold uppercase mb-3">
                HATUA YA 2 KATI YA 3 · INASUBIRI UTHIBITISHO WA ADMIN
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                Hongera, {registeredApplicant.fullName}!
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
                Akaunti yako ya mwanafunzi ndani ya <strong className="text-blue-400">SILLYGER</strong> imesajiliwa kikamilifu.
              </p>
            </div>

            <div className="max-w-md mx-auto p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs font-mono-sg space-y-2.5">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-500">Username:</span>
                <span className="text-white font-bold">@{registeredApplicant.username}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-500">WhatsApp:</span>
                <span className="text-blue-400">{registeredApplicant.phone}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-500">Jumuiya:</span>
                <span className="text-emerald-400">SG Student Community</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">WhatsApp Group:</span>
                <span className="text-amber-400 font-bold">Itafunguka Ukishaidhinishwa</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-950/25 border border-blue-500/30 text-slate-200 text-xs text-left max-w-lg mx-auto leading-relaxed">
              <strong className="text-blue-300 block mb-1">Hatua Inayofuata:</strong>
              Ingia kwenye <strong>Student Dashboard</strong> yako sasa hivi. Huko utaona <strong>Kitambulisho chako cha Mwanafunzi</strong>, maendeleo ya idhini yako, na mara tu Admin akikuidhinisha, kitufe cha <strong>WhatsApp Group</strong> kitafunguka hapo hapo.
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/portal"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl btn-sg-primary text-sm flex items-center justify-center gap-2"
              >
                <span>Fungua Student Dashboard Sasa</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </Link>
              <Link href="/" className="text-xs text-slate-400 hover:text-white">
                Rudi Mwanzo
              </Link>
            </div>
          </div>
        ) : (
          /* REGISTRATION FORM CARD */
          <div className="sg-glass p-6 sm:p-10 rounded-3xl shadow-2xl">
            <div className="text-center mb-8 space-y-2.5">
              <span className="inline-block font-mono-sg text-[11px] font-bold badge-future uppercase tracking-wider px-3 py-1 rounded-full">
                JUMUIYA MOJA YA WANAFUNZI · HAKUNA KUCHAGUA TAASISI
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Jiunge na SILLYGER Student Community
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                Tunajifunza teknolojia wote kwa pamoja. Jaza taarifa zako hapa ili uidhinishwe, upewe <strong>SG-ID</strong> na ufunguliwe kiungo cha <strong>WhatsApp Group Rasmi</strong>.
              </p>
            </div>

            {/* Error Container */}
            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs sm:text-sm font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. TAARIFA ZA MWANAFUNZI */}
              <div className="space-y-4">
                <h2 className="text-xs font-mono-sg font-bold uppercase tracking-wider text-blue-400 pb-1.5 border-b border-slate-800">
                  1. Taarifa za Mwanafunzi
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="reg-name">
                      Jina Kamili (Full Name) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="reg-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs sm:text-sm"
                      placeholder="mf. Jina Lako Kamili"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="reg-username">
                      Username <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono-sg">@</span>
                      <input
                        type="text"
                        id="reg-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full sg-input pl-8 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono-sg"
                        placeholder="jina_lako"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="reg-email">
                      Barua Pepe (Email) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      id="reg-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs sm:text-sm"
                      placeholder="mfano@gmail.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="reg-phone">
                      Namba ya WhatsApp (Tanzania) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="reg-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono-sg"
                      placeholder="07XXXXXXXX au +255..."
                      required
                    />
                    <div
                      className={`text-[11px] font-mono-sg mt-1 ${
                        !phone
                          ? 'text-slate-500'
                          : phoneIsValid
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {!phone
                        ? 'Format: +255XXXXXXXXX'
                        : phoneIsValid
                        ? `✓ Namba itasajiliwa kama: ${normalizedPhone}`
                        : `Format sahihi: +2557XXXXXXXX au 07XXXXXXXX (${normalizedPhone})`}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. NENOSIRI LA AKAUNTI */}
              <div className="space-y-4">
                <h2 className="text-xs font-mono-sg font-bold uppercase tracking-wider text-blue-400 pb-1.5 border-b border-slate-800">
                  2. Nenosiri la Kuingia Student Portal
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="reg-password">
                      Nenosiri (Password) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="reg-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full sg-input pr-10 pl-3.5 py-2.5 rounded-xl text-xs sm:text-sm"
                        placeholder="Angalau herufi 6"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                        aria-label="Onyesha nenosiri"
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="reg-confirm-password">
                      Rudia Nenosiri <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="reg-confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full sg-input pr-10 pl-3.5 py-2.5 rounded-xl text-xs sm:text-sm"
                        placeholder="Thibitisha nenosiri"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                        aria-label="Onyesha nenosiri"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. MAELEZO MAFUPI (HIARI) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="reg-motivation">
                  Unapenda kujifunza nini zaidi au una ujumbe mfupi? <span className="text-slate-500 font-normal">(Hiari)</span>
                </label>
                <textarea
                  id="reg-motivation"
                  rows={2}
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  className="w-full sg-input px-3.5 py-2.5 rounded-xl text-xs sm:text-sm"
                  placeholder="mf. Napenda kujifunza programming, Linux na mitandao pamoja na wenzangu..."
                ></textarea>
              </div>

              {/* 4. KANUNI ZA JUMUIYA & PDPA 2022 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/75 border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-xs font-mono-sg font-bold uppercase tracking-wider text-blue-300">
                    3. Kanuni za Jumuiya ya Wanafunzi
                  </span>
                  <Link href="/constitution" target="_blank" className="text-[11px] text-blue-400 hover:underline">
                    Soma Katiba &rarr;
                  </Link>
                </div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreeConstitution}
                    onChange={(e) => setAgreeConstitution(e.target.checked)}
                    className="mt-0.5 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    required
                  />
                  <span className="text-xs text-slate-300 leading-relaxed group-hover:text-white transition">
                    <strong className="text-white">Ushirikiano & Katiba v1.4:</strong> Nakubali kushiriki kwa nidhamu na heshima kama mwanafunzi mwenzangu katika jumuiya ya SILLYGER.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreeEthics}
                    onChange={(e) => setAgreeEthics(e.target.checked)}
                    className="mt-0.5 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    required
                  />
                  <span className="text-xs text-slate-300 leading-relaxed group-hover:text-white transition">
                    <strong className="text-white">Maadili ya Teknolojia (Art. 14):</strong> Ninaahidi kutumia ujuzi tutakaojifunza kujenga na kulinda, na si kufanya udukuzi haramu.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreePdpa}
                    onChange={(e) => setAgreePdpa(e.target.checked)}
                    className="mt-0.5 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    required
                  />
                  <span className="text-xs text-slate-300 leading-relaxed group-hover:text-white transition">
                    <strong className="text-white">Faragha & Tanzania PDPA 2022 (Art. 15):</strong> Ninaridhia taarifa zangu za uanachama kuhifadhiwa kwa usalama kwa ajili ya utambuzi wa jumuiya.
                  </span>
                </label>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl btn-sg-primary text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Inahifadhi usajili wako...' : 'Jiunge na SILLYGER & Omba WhatsApp Access'}</span>
                {!loading && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                )}
              </button>

              <div className="text-center text-xs text-slate-400">
                Tayari una akaunti?
                <Link href="/portal?tab=login" className="text-blue-400 hover:underline font-semibold ml-1">
                  Ingia kwenye Student Portal &rarr;
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
