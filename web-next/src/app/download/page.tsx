'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  ShieldCheck,
  FolderOpen,
  ArrowRight,
  RefreshCw,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export default function DownloadPage() {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0);

  const APK_URL =
    'https://github.com/willyger-svg/sillyger-platform/releases/latest/download/sillyger-app.apk';

  const triggerDownload = () => {
    setDownloadStarted(true);
    setDownloadCount((prev) => prev + 1);

    // Trigger download without navigating away or opening an empty white tab
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = APK_URL;
    document.body.appendChild(iframe);

    // Clean up iframe after 30 seconds
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch (e) {
        // ignore
      }
    }, 30000);
  };

  // Trigger download automatically on first visit after 1.2s delay for smooth transition
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerDownload();
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Breadcrumb / Top Status */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/"
          className="text-xs font-mono-sg text-slate-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <span>←</span>
          <span>Rudi Mwanzo</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-mono-sg text-emerald-400 font-bold">
            Toleo Rasmi v1.0.8 (Tayari)
          </span>
        </div>
      </div>

      {/* Main Download Hero Card */}
      <div className="sg-glass rounded-3xl p-6 sm:p-10 border border-blue-500/30 shadow-2xl relative overflow-hidden mb-10">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
          {/* App Icon */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 p-1 shadow-xl flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center relative overflow-hidden">
                <img
                  src="/assets/sillyger-logo-icon.svg"
                  alt="SILLYGER App"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md"
                />
              </div>
            </div>
            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-black uppercase font-mono-sg shadow">
              APK
            </span>
          </div>

          {/* App Info & Download CTA */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SILLYGER Mobile (Android)</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
              Pakua SILLYGER App
            </h1>

            <p className="text-sm text-slate-300 mb-5 leading-relaxed max-w-xl">
              Pata taarifa za wanafunzi, masomo, matangazo ya papo hapo na vitambulisho vya dijitali moja kwa moja kwenye simu yako ya Android.
            </p>

            {/* Meta tags */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-mono-sg text-slate-400 mb-6">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                Ukubwa: <strong className="text-white">~60 MB</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                Toleo: <strong className="text-emerald-400">v1.0.8 (Auto-Update)</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                Android: <strong className="text-white">7.0 na Kuendelea</strong>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={triggerDownload}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/20 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>{downloadStarted ? 'Pakua Tena (Download Again)' : 'Pakua APK Sasa'}</span>
              </button>

              <a
                href={`https://wa.me/255750449373?text=${encodeURIComponent(
                  'Habari SILLYGER, ninaomba msaada wa kusakinisha au kupakua app kwenye simu yangu.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Msaada wa WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Live Notification Indicator */}
        {downloadStarted && (
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center gap-3 bg-blue-500/10 p-4 rounded-2xl border border-blue-500/30">
            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
            <div className="text-xs sm:text-sm text-slate-200">
              <strong className="text-white block font-bold">
                Upakuaji umeanza kiotomatiki!
              </strong>
              Tazama upau wa taarifa (Notification Bar) juu ya kioo cha simu yako au chini ya browser kuona mwendokasi wa MB.
            </div>
          </div>
        )}
      </div>

      {/* Visual Guide For Users ("Mwongozo Rahisi wa Hatua kwa Hatua") */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <span className="text-xs font-mono-sg uppercase tracking-widest text-emerald-400 font-bold block mb-1">
            Rahisi na Salama
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white">
            Jinsi ya Kusakinisha kwenye Simu Yako (Hatua 3 Tu)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-lg mx-auto">
            Hata kama hujawahi kupakua app nje ya Play Store, fuata hatua hizi fupi ili kuikamilisha:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1 */}
          <div className="sg-glass p-6 rounded-3xl border border-slate-800 flex flex-col justify-between relative group hover:border-blue-500/40 transition">
            <div className="mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-lg mb-4 font-mono-sg">
                1
              </div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Ukiona &quot;Harmful File&quot;</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Kama browser (Chrome) ikikuonyesha onyo ikisema:
                <br />
                <em className="text-amber-300/90 block mt-1 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 font-mono-sg text-[11px]">
                  &quot;File might be harmful. Download sillyger-app.apk anyway?&quot;
                </em>
                <br />
                Bonyeza <strong>&quot;Download anyway&quot;</strong> (au <strong>&quot;Pakua hata hivyo&quot;</strong>). App hii haina virusi wala hatari yoyote.
              </p>
            </div>
            <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800/80 font-mono-sg">
              ✓ Bofya &quot;Download anyway&quot;
            </div>
          </div>

          {/* Step 2 */}
          <div className="sg-glass p-6 rounded-3xl border border-slate-800 flex flex-col justify-between relative group hover:border-emerald-500/40 transition">
            <div className="mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4 font-mono-sg">
                2
              </div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-400" />
                <span>Ikifika Mwisho (60MB)</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Upakuaji ukifika <strong>60MB / 60MB</strong>, simu haifungui yenyewe. Unatakiwa kuifungua:
                <br />
                <span className="block mt-2 text-slate-200">
                  • Bonyeza <strong>&quot;Open&quot; (Fungua)</strong> chini ya kioo chako au kwenye taarifa ya juu.
                </span>
                <span className="block mt-1 text-slate-200">
                  • Au fungua app ya <strong>Files (Faili / My Files)</strong> ya simu yako, ingia folda ya <strong>Download</strong> kisha bonyeza <strong>sillyger-app.apk</strong>.
                </span>
              </p>
            </div>
            <div className="text-[11px] text-emerald-400/90 pt-3 border-t border-slate-800/80 font-mono-sg">
              ✓ Bonyeza &quot;Open&quot; au fungua Files
            </div>
          </div>

          {/* Step 3 */}
          <div className="sg-glass p-6 rounded-3xl border border-slate-800 flex flex-col justify-between relative group hover:border-teal-500/40 transition">
            <div className="mb-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center font-bold text-lg mb-4 font-mono-sg">
                3
              </div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Sakinisha (Install)</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Baada ya kubonyeza faili, kioo cha usakinishaji kitafunguka:
                <br />
                <span className="block mt-2 text-slate-200">
                  1. Bonyeza <strong>&quot;Install&quot; (Sakinisha)</strong>.
                </span>
                <span className="block mt-1 text-slate-200">
                  2. Kama simu ikikuambia ruhusu chanzo hiki, bonyeza <strong>Settings</strong> na uwashe <strong>&quot;Allow from this source&quot;</strong>.
                </span>
                <span className="block mt-1 text-slate-200">
                  3. Subiri sekunde 10, kisha bonyeza <strong>Open</strong> kuanza kutumia app!
                </span>
              </p>
            </div>
            <div className="text-[11px] text-teal-400 pt-3 border-t border-slate-800/80 font-mono-sg">
              ✓ App imekamilika!
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting / FAQ Card */}
      <div className="sg-glass rounded-3xl p-6 sm:p-8 border border-slate-800 mb-12">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-400" />
          <span>Maswali ya Mara kwa Mara & Msaada</span>
        </h3>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <strong className="text-white block mb-1">
              Q: Kwanini simu yangu imeandika 60MB / 60MB halafu haifanyi kitu?
            </strong>
            <p className="text-slate-400 leading-relaxed">
              J: Ni kawaida kwenye Android; browser haisakinishi app kiotomatiki kwa sababu za kiusalama. Unachotakiwa kufanya ni kutelezesha kidole kutoka juu ya kioo (Notification Bar) na kubonyeza ujumbe uliomaliza kupakua, au fungua app yako ya <strong>Files (Faili)</strong> na uende kwenye folda ya <strong>Download</strong> kubonyeza <strong>sillyger-app.apk</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <strong className="text-white block mb-1">
              Q: Je, nitahitaji kupakua tena kila toleo jipya likitoka?
            </strong>
            <p className="text-slate-400 leading-relaxed">
              J: <strong>Hapana!</strong> Toleo hili lina mfumo wa Auto-Updater. Toleo jipya likiwa tayari, app yenyewe itakujulisha na kujisasisha kiotomatiki bila wewe kurudi kwenye tovuti kupakua tena.
            </p>
          </div>
        </div>

        {/* WhatsApp Help Banner */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
          <div className="text-xs text-slate-300 text-center sm:text-left">
            <span className="font-bold text-white block">Je, umekwama au unahitaji usaidizi?</span>
            Tuma ujumbe WhatsApp ili timu yetu ya kiufundi ikusaidie mara moja.
          </div>
          <a
            href={`https://wa.me/255750449373?text=${encodeURIComponent(
              'Habari SILLYGER, ninaomba msaada wa kupakua au ku-install app kwenye simu yangu.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition flex-shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
