-- ==============================================================================
-- Migration 016: App Release v1.0.25 (SILLYGER C Mastery Course & AI Mwalimu)
-- ==============================================================================

INSERT INTO public.platform_settings (key, value, updated_at)
VALUES (
    'app_release',
    '{"version":"1.0.25","build_number":26,"min_version":"1.0.0","download_url":"https://github.com/willyger-svg/sillyger-platform/releases/download/v1.0.25/sillyger-app.apk","release_notes":"Toleo v1.0.25: Kozi Kamili ya C Mastery (Moduli 12 & Masomo 70) kwenye Menyu ya Viarama Vitatu! Msaidizi wa AI Mwalimu wa C (Chati & Maswali ya Somo), Injini ya Utafutaji wa Mada za C, na Ufuatiliaji wa Maendeleo hata ukiwa Offline.","is_mandatory":false}',
    NOW()
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();
