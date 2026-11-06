import './globals.css';
import { ReactNode } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'SILLYGER (SG) — Je, Unataka Kujifunza Teknolojia Pamoja Nasi?',
  description: 'SILLYGER (SG) Student Tech Community Tanzania — Jukwaa la wanafunzi kujifunza teknolojia kwa vitendo.',
  icons: {
    icon: '/assets/sillyger-logo-icon.svg',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sw" className="dark scroll-smooth">
      <body className="bg-sgbg text-slate-100 min-h-screen bg-cyber-grid flex flex-col selection:bg-blue-600 selection:text-white">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
