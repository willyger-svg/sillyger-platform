-- ==============================================================================
-- Migration 018: App Release v1.0.27 (SILLYGER Live Classroom & Clean Drawer UI)
-- ==============================================================================

INSERT INTO public.platform_settings (key, value, updated_at)
VALUES (
    'app_release',
    '{"version":"1.0.27","build_number":28,"min_version":"1.0.0","download_url":"https://github.com/willyger-svg/sillyger-platform/releases/download/v1.0.27/sillyger-app.apk","release_notes":"Toleo v1.0.27: 1. Muundo Safi: Tumeondoa duplications zote! Kozi ya C ipo rasmi sehemu moja tulivu kwenye Menyu Kuu ya Kushoto (☰). 2. Kipengele Kipya: SILLYGER Live Classroom! Jiunge na madarasa ya moja kwa moja ya Mwalimu, slides zinazobadilika papo hapo kwa ubora wa HD, sauti ya moja kwa moja (live audio), kioo cha mwalimu (screen share), na sehemu ya kuuliza maswali darasani.","is_mandatory":false}',
    NOW()
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO public.schema_migrations (version, applied_at)
VALUES ('018_app_release_1_0_27.sql', NOW())
ON CONFLICT (version) DO NOTHING;
