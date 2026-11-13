-- ==============================================================================
-- Migration 020: App Release v1.0.28 (AzamPay Payments & Light/Dark Theme Engine)
-- ==============================================================================

INSERT INTO public.platform_settings (key, value, updated_at)
VALUES (
    'app_release',
    '{"version":"1.0.28","build_number":30,"min_version":"1.0.0","download_url":"https://github.com/willyger-svg/sillyger-platform/releases/download/v1.0.28/sillyger-app.apk","release_notes":"Toleo v1.0.28: 1. Malipo ya Simu (AzamPay Integration): Lipia michango ya mfuko wa jumuiya, ada za kozi na kadi moja kwa moja kupitia M-Pesa, Tigo Pesa, Airtel Money, HaloPesa au AzamPesa kwa STK Push. 2. Muonekano Mpya wa Kisasa (Theme System): Uteuzi kamili wa Light Mode na Dark Mode kwenye skrini zote. 3. Dashibodi ya Moja kwa Moja: Salio la mfuko wa jumuiya linajisasisha moja kwa moja kila muamala unapokamilika.","is_mandatory":false}',
    NOW()
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO public.schema_migrations (version, applied_at)
VALUES ('020_app_release_1_0_28.sql', NOW())
ON CONFLICT (version) DO NOTHING;
