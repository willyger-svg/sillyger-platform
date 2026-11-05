'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useI18n } from '../lib/i18n';
import { ShieldCheck, Download, Printer, QrCode, CheckCircle2 } from 'lucide-react';

interface IdCardProps {
  member: {
    fullName: string;
    regNumber: string;
    phone: string;
    email: string;
    role: string;
    status: string;
    avatarUrl?: string;
  };
}

export default function DigitalIdCard({ member }: IdCardProps) {
  const { t } = useI18n();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const payload = JSON.stringify({
      reg: member.regNumber,
      name: member.fullName,
      status: member.status,
      issuer: 'SILLYGER Community Tanzania',
      verify_url: `https://sillyger.com/verify?reg=${member.regNumber}`,
    });

    QRCode.toDataURL(payload, {
      width: 160,
      margin: 1,
      color: {
        dark: '#0066FF',
        light: '#0A192F',
      },
    }).then(setQrDataUrl);
  }, [member]);

  return (
    <div className="flex flex-col items-center">
      {/* Smart Card Container */}
      <div
        id="digital-id-card"
        className="w-full max-w-sm rounded-3xl p-6 relative overflow-hidden shadow-2xl border border-blue-500/30 bg-gradient-to-b from-[#0A192F] via-[#0F172A] to-[#030712] text-white"
      >
        {/* Hologram / Decorative Accent */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-600/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-cyan-500/20 rounded-full blur-2xl" />

        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-blue-500/40">
              SG
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-wide text-white">SILLYGER</div>
              <div className="text-[9px] text-blue-400 font-mono tracking-wider">SMART STUDENT ID</div>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            {t('status_active')}
          </span>
        </div>

        {/* Card Body: Photo & Member Details */}
        <div className="flex items-center gap-4 mb-5 relative z-10">
          <div className="w-20 h-20 rounded-2xl border-2 border-blue-500/50 overflow-hidden bg-slate-900 flex-shrink-0 shadow-lg">
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt={member.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-blue-400 font-bold text-xl bg-slate-950">
                {member.fullName.charAt(0)}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h4 className="font-extrabold text-base text-white leading-tight">
              {member.fullName}
            </h4>
            <div className="font-mono text-xs font-bold text-blue-400">
              {member.regNumber || 'SG-PENDING'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">{member.phone}</div>
            <div className="text-[10px] text-slate-500 truncate max-w-[170px]">{member.email}</div>
          </div>
        </div>

        {/* Card Footer: QR Code & Security Stamp */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 relative z-10">
          <div className="space-y-0.5">
            <div className="text-[9px] text-slate-400 font-mono">UTAMBULISHO WA KISHERIA</div>
            <div className="text-[9px] text-blue-400/90 font-mono font-medium">PDPA 2022 Compliant</div>
            <div className="text-[8px] text-slate-500 font-mono">Tanzania Community Card</div>
          </div>

          {qrDataUrl ? (
            <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
              <img src={qrDataUrl} alt="QR Code" className="w-14 h-14 rounded-lg" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-slate-900 flex items-center justify-center text-slate-600">
              <QrCode className="w-6 h-6" />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 text-xs font-semibold text-slate-200 transition"
        >
          <Printer className="w-3.5 h-3.5 text-blue-400" />
          <span>{t('id_card_print')}</span>
        </button>
      </div>
    </div>
  );
}
