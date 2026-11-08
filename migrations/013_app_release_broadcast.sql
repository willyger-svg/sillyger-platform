-- ==============================================================================
-- Migration 013: Fast In-App Auto-Update via Supabase Overview
-- ==============================================================================
-- Exposes app_release in sg_get_public_overview() to eliminate GitHub rate-limiting
-- and ensure reliable 0.1s in-app update checks on mobile networks.
-- ==============================================================================

-- 1. Insert or update the active app_release configuration
INSERT INTO public.platform_settings (key, value, updated_at)
VALUES (
    'app_release',
    '{"version":"1.0.21","build_number":22,"min_version":"1.0.0","download_url":"https://github.com/willyger-svg/sillyger-platform/releases/download/v1.0.21/sillyger-app.apk","release_notes":"Toleo v1.0.21: Usimamizi kamili wa Wasifu & Akaunti! Uwezo wa kubadili nenosiri kwa usalama wa hali ya juu, kuhariri namba ya simu/WhatsApp, kubadili Njia ya Mafunzo (Track), Lengo la Kujifunza na Wasifu (Bio).","is_mandatory":false}',
    NOW()
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();

-- 2. Upgrade sg_get_public_overview to expose app_release
CREATE OR REPLACE FUNCTION public.sg_get_public_overview()
RETURNS JSONB AS $$
DECLARE
    v_total INT;
    v_active INT;
    v_pending INT;
    v_announcements JSONB;
    v_session_title TEXT;
    v_tv_stream JSONB;
    v_tv_archive JSONB;
    v_app_release JSONB;
    v_wa_invite TEXT;
BEGIN
    SELECT
        COUNT(*)::INT,
        COUNT(*) FILTER (WHERE status = 'ACTIVE')::INT,
        COUNT(*) FILTER (WHERE status = 'PENDING')::INT
    INTO v_total, v_active, v_pending
    FROM public.members;

    SELECT COALESCE(jsonb_agg(to_jsonb(a)), '[]'::jsonb)
    INTO v_announcements
    FROM (
        SELECT *
        FROM public.announcements
        ORDER BY created_at DESC
        LIMIT 10
    ) a;

    SELECT value
    INTO v_session_title
    FROM public.platform_settings
    WHERE key = 'active_session_title'
    LIMIT 1;

    SELECT value
    INTO v_wa_invite
    FROM public.platform_settings
    WHERE key = 'whatsapp_invite_url'
    LIMIT 1;

    SELECT jsonb_build_object(
        'url', COALESCE((SELECT value FROM public.platform_settings WHERE key = 'tv_live_url' LIMIT 1), ''),
        'title', COALESCE((SELECT value FROM public.platform_settings WHERE key = 'tv_live_title' LIMIT 1), 'SILLYGER TV Live Broadcast'),
        'is_live', COALESCE((SELECT value = 'true' FROM public.platform_settings WHERE key = 'tv_is_live' LIMIT 1), false),
        'desc', COALESCE((SELECT value FROM public.platform_settings WHERE key = 'tv_live_desc' LIMIT 1), ''),
        'updated_at', COALESCE((SELECT updated_at FROM public.platform_settings WHERE key = 'tv_live_url' LIMIT 1), NOW())
    ) INTO v_tv_stream;

    SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
    INTO v_tv_archive
    FROM (
        SELECT *
        FROM public.tv_broadcast_archive
        ORDER BY created_at DESC
        LIMIT 20
    ) t;

    BEGIN
        SELECT value::jsonb
        INTO v_app_release
        FROM public.platform_settings
        WHERE key = 'app_release'
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        v_app_release := NULL;
    END;

    RETURN jsonb_build_object(
        'stats', jsonb_build_object(
            'totalRegistered', COALESCE(v_total, 0),
            'activeMembers', COALESCE(v_active, 0),
            'pendingApplicants', COALESCE(v_pending, 0)
        ),
        'announcements', COALESCE(v_announcements, '[]'::jsonb),
        'active_session_title', COALESCE(v_session_title, ''),
        'whatsapp_invite_url', COALESCE(v_wa_invite, ''),
        'tv_stream', COALESCE(v_tv_stream, '{}'::jsonb),
        'tv_archive', COALESCE(v_tv_archive, '[]'::jsonb),
        'app_release', v_app_release
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

GRANT EXECUTE ON FUNCTION public.sg_get_public_overview() TO anon, authenticated, service_role;

INSERT INTO public.schema_migrations (version, applied_at)
VALUES ('013_app_release_broadcast.sql', NOW())
ON CONFLICT (version) DO NOTHING;
