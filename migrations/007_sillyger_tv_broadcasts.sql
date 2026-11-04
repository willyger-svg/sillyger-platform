-- ==============================================================================
-- Migration 007: SILLYGER TV Live Stream & Video Broadcast Engine
-- ==============================================================================
-- Adds tv_broadcast_archive table, enables TV stream settings in sg_admin_update_settings,
-- and exposes live stream and video archive in sg_get_public_overview.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.tv_broadcast_archive (
    id TEXT PRIMARY KEY DEFAULT ('tv_' || replace(uuid_generate_v4()::text, '-', '')),
    video_id TEXT NOT NULL,
    youtube_url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'Live Session',
    is_live BOOLEAN DEFAULT false,
    broadcasted_by TEXT NOT NULL DEFAULT 'Super Administrator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tv_broadcast_created ON public.tv_broadcast_archive(created_at DESC);

ALTER TABLE public.tv_broadcast_archive ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read tv archive" ON public.tv_broadcast_archive;
CREATE POLICY "Public can read tv archive" ON public.tv_broadcast_archive FOR SELECT TO anon, authenticated, service_role USING (true);

-- Update sg_admin_update_settings to permit TV broadcast settings
CREATE OR REPLACE FUNCTION public.sg_admin_update_settings(
    p_session_token TEXT,
    p_updates JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_admin public.members%ROWTYPE;
    v_key TEXT;
    v_val TEXT;
    v_keys TEXT[] := ARRAY[]::TEXT[];
    v_settings JSONB;
BEGIN
    v_admin := public.sg_require_admin(p_session_token);

    IF p_updates IS NULL OR jsonb_typeof(p_updates) <> 'object' THEN
        RAISE EXCEPTION 'Mipangilio si sahihi.';
    END IF;

    FOR v_key, v_val IN SELECT * FROM jsonb_each_text(p_updates)
    LOOP
        IF v_key NOT IN ('whatsapp_invite_url', 'active_session_title', 'tv_live_url', 'tv_live_title', 'tv_is_live', 'tv_live_desc') THEN
            RAISE EXCEPTION 'Ufunguo wa mpangilio hauruhusiwi: %', v_key;
        END IF;

        IF v_key = 'whatsapp_invite_url' AND v_val !~ '^https://chat\.whatsapp\.com/' THEN
            RAISE EXCEPTION 'Kiungo cha WhatsApp lazima kianze na https://chat.whatsapp.com/';
        END IF;

        INSERT INTO public.platform_settings (key, value, updated_by, updated_at)
        VALUES (v_key, COALESCE(v_val, ''), v_admin.username, NOW())
        ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW();

        v_keys := array_append(v_keys, v_key);
    END LOOP;

    IF array_length(v_keys, 1) > 0 THEN
        INSERT INTO public.audit_logs (action, actor, target, details)
        VALUES (
            'SETTINGS_UPDATED',
            v_admin.username,
            array_to_string(v_keys, ', '),
            'Admin amesasisha mipangilio ya jumuiya: ' || array_to_string(v_keys, ', ')
        );
    END IF;

    SELECT jsonb_object_agg(key, value)
    INTO v_settings
    FROM public.platform_settings;

    RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- Update sg_get_public_overview to expose live stream & archive
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

    RETURN jsonb_build_object(
        'stats', jsonb_build_object(
            'totalRegistered', COALESCE(v_total, 0),
            'activeMembers', COALESCE(v_active, 0),
            'pendingApplicants', COALESCE(v_pending, 0)
        ),
        'announcements', COALESCE(v_announcements, '[]'::jsonb),
        'active_session_title', COALESCE(v_session_title, ''),
        'tv_stream', COALESCE(v_tv_stream, '{}'::jsonb),
        'tv_archive', COALESCE(v_tv_archive, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- Admin RPC to manage TV archive
CREATE OR REPLACE FUNCTION public.sg_admin_manage_tv(
    p_session_token TEXT,
    p_op TEXT,
    p_video_id TEXT DEFAULT NULL,
    p_youtube_url TEXT DEFAULT NULL,
    p_title TEXT DEFAULT NULL,
    p_desc TEXT DEFAULT NULL,
    p_category TEXT DEFAULT 'Live Session',
    p_item_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_admin public.members%ROWTYPE;
    v_new_id TEXT;
BEGIN
    v_admin := public.sg_require_admin(p_session_token);

    IF upper(COALESCE(p_op, '')) = 'ADD_ARCHIVE' THEN
        INSERT INTO public.tv_broadcast_archive (video_id, youtube_url, title, description, category, broadcasted_by)
        VALUES (
            COALESCE(p_video_id, ''),
            COALESCE(p_youtube_url, ''),
            COALESCE(p_title, 'SILLYGER Broadcast'),
            COALESCE(p_desc, ''),
            COALESCE(p_category, 'Live Session'),
            v_admin.full_name
        ) RETURNING id INTO v_new_id;

        RETURN jsonb_build_object('success', true, 'id', v_new_id);
    ELSIF upper(COALESCE(p_op, '')) = 'DELETE_ARCHIVE' THEN
        DELETE FROM public.tv_broadcast_archive WHERE id = p_item_id;
        RETURN jsonb_build_object('success', true);
    ELSE
        RAISE EXCEPTION 'Operesheni haijulikani: %', p_op;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

GRANT EXECUTE ON FUNCTION public.sg_admin_manage_tv(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_get_public_overview() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_admin_update_settings(TEXT, JSONB) TO anon, authenticated, service_role;

INSERT INTO public.schema_migrations (version, applied_at)
VALUES ('007_sillyger_tv_broadcasts.sql', NOW())
ON CONFLICT (version) DO NOTHING;
