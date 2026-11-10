-- ==============================================================================
-- Migration 016: App Release v1.0.26 (SILLYGER C Mastery Course, Drawer & Home Banner)
-- ==============================================================================

INSERT INTO public.platform_settings (key, value, updated_at)
VALUES (
    'app_release',
    '{"version":"1.0.26","build_number":27,"min_version":"1.0.0","download_url":"https://github.com/willyger-svg/sillyger-platform/releases/download/v1.0.26/sillyger-app.apk","release_notes":"Toleo v1.0.26: Kozi Kamili ya C Mastery sasa inaonekana kila sehemu! Kwenye Menyu Kuu (Drawer ☰), Kwenye Dashibodi Kuu (Nyumbani), na Kwenye Viarama Vitatu (3-dots ⋮ juu). Msaidizi wa AI Mwalimu wa C na Masomo 70 yote tayari!","is_mandatory":false}',
    NOW()
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();
