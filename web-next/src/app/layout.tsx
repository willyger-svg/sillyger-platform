import './globals.css';
import { ReactNode } from 'react';
import Navbar from '../components/Navbar';
import { I18nProvider } from '../lib/i18n';

export const metadata = {
  title: 'SILLYGER Community Platform | Fullstack v2.0',
  description: 'Mfumo rasmi wa kidijitali wa uanachama, mtaala na utawala wa jumuiya ya SILLYGER Tanzania.',
  icons: {
    icon: '/sillyger-logo-icon.svg',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sw" className="dark">
      <body className="min-h-screen bg-[#030712] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
        <I18nProvider>
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
          <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-center text-xs text-slate-500 font-mono">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>© 2026 SILLYGER (SG) Community. Haki zote zimehifadhiwa.</div>
              <div className="text-blue-500/80">Sheria ya Ulinzi wa Taarifa Binafsi (PDPA 2022)</div>
            </div>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
