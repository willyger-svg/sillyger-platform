'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'sw' | 'en';

export const translations = {
  sw: {
    brand_name: "SILLYGER",
    tagline: "Learn Together. Build Together. Own the Future Together.",
    nav_home: "Mwanzo",
    nav_tv: "SILLYGER TV",
    nav_courses: "Masomo",
    nav_divisions: "Vitengo",
    nav_constitution: "Katiba",
    nav_portal: "Wasifu & Kadi",
    nav_admin: "Uongozi",
    nav_register: "Jiunge Sasa",
    nav_login: "Ingia",
    nav_logout: "Toka",
    nav_settings: "Mipangilio",
    nav_ads: "Matangazo & Ratiba",
    tv_title: "SILLYGER TV - Matangazo ya Moja kwa Moja",
    tv_pause: "Sitisha (Pause)",
    tv_resume: "Endelea (Play)",
    tv_cinema: "Hali ya Cinema",
    tv_live_badge: "LIVE MOJA KWA MOJA",
    tv_offline_badge: "KIPINDI KILICHOREKODIWA",
    chat_title: "Soga ya Moja kwa Moja",
    chat_placeholder: "Andika ujumbe wako hapa...",
    chat_send: "Tuma",
    id_card_title: "Kitambulisho Mahiri cha Mwanafunzi",
    id_card_scan: "Changanua QR kuthibitisha mwanachama",
    id_card_download: "Pakua Kadi (PNG)",
    id_card_print: "Chapa (Print)",
    status_active: "MWANACHAMA HAI",
    status_pending: "INASUBIRI IDHINI",
    unread_notifications: "Arifa Mpya",
  },
  en: {
    brand_name: "SILLYGER",
    tagline: "Learn Together. Build Together. Own the Future Together.",
    nav_home: "Home",
    nav_tv: "SILLYGER TV",
    nav_courses: "Courses",
    nav_divisions: "Divisions",
    nav_constitution: "Constitution",
    nav_portal: "Profile & ID Card",
    nav_admin: "Admin",
    nav_register: "Join Now",
    nav_login: "Sign In",
    nav_logout: "Sign Out",
    nav_settings: "Settings",
    nav_ads: "Announcements & Schedule",
    tv_title: "SILLYGER TV - Live Broadcast",
    tv_pause: "Pause Stream",
    tv_resume: "Resume Stream",
    tv_cinema: "Cinema Mode",
    tv_live_badge: "LIVE BROADCAST",
    tv_offline_badge: "RECORDED ARCHIVE",
    chat_title: "Live Chat Stream",
    chat_placeholder: "Type your message here...",
    chat_send: "Send",
    id_card_title: "Smart Student ID Card",
    id_card_scan: "Scan QR to verify membership",
    id_card_download: "Download Card (PNG)",
    id_card_print: "Print Card",
    status_active: "ACTIVE MEMBER",
    status_pending: "PENDING APPROVAL",
    unread_notifications: "New Alerts",
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['sw']) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'sw',
  setLanguage: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('sw');

  useEffect(() => {
    const saved = localStorage.getItem('sillyger_lang') as Language;
    if (saved && (saved === 'sw' || saved === 'en')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sillyger_lang', lang);
  };

  const t = (key: keyof typeof translations['sw']) => {
    return translations[language][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
