-- ==============================================================================
-- Migration 010: SILLYGER TV AI Assistant & Live Debate Solver (Fact Referee)
-- ==============================================================================
-- 1. Stores Gemini AI configuration securely in RLS-protected platform_settings.
-- 2. Exposes sg_get_ai_config(p_session_token) only to authenticated members.
-- 3. Adds sg_send_tv_ai_chat(...) to persist & deduplicate AI replies and Solve
--    verdicts inside public.tv_chat_messages for real-time community viewing.
-- ==============================================================================

INSERT INTO public.platform_settings (key, value, updated_by, updated_at)
VALUES
    ('gemini_api_key', 'SET_VIA_SUPABASE_OR_ADMIN_PANEL', 'system', NOW()),
    ('ai_tv_enabled', 'true', 'system', NOW())
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();

-- Expand admin settings whitelist to support app_resources & AI settings
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
        IF v_key NOT IN (
            'whatsapp_invite_url',
            'active_session_title',
            'tv_live_url',
            'tv_live_title',
            'tv_is_live',
            'tv_live_desc',
            'app_resources',
            'gemini_api_key',
            'ai_tv_enabled'
        ) THEN
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

-- Authenticated-only RPC to fetch AI configuration (never exposed to public anon overview)
CREATE OR REPLACE FUNCTION public.sg_get_ai_config(
    p_session_token TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_member public.members%ROWTYPE;
    v_api_key TEXT;
    v_enabled BOOLEAN;
BEGIN
    v_member := public.sg_require_session(p_session_token);

    SELECT COALESCE(value, '') INTO v_api_key
    FROM public.platform_settings
    WHERE key = 'gemini_api_key'
    LIMIT 1;

    SELECT COALESCE(value = 'true', true) INTO v_enabled
    FROM public.platform_settings
    WHERE key = 'ai_tv_enabled'
    LIMIT 1;

    RETURN jsonb_build_object(
        'enabled', COALESCE(v_enabled, true),
        'api_key', COALESCE(v_api_key, ''),
        'primary_model', 'gemini-3.5-flash-lite',
        'fallback_model', 'gemini-3.1-flash-lite'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

GRANT EXECUTE ON FUNCTION public.sg_get_ai_config(TEXT) TO anon, authenticated, service_role;

-- Authenticated RPC to persist AI chat reply or Solve verdict into tv_chat_messages
CREATE OR REPLACE FUNCTION public.sg_send_tv_ai_chat(
    p_session_token TEXT,
    p_message TEXT,
    p_video_id TEXT DEFAULT '',
    p_mode TEXT DEFAULT 'chat'
)
RETURNS JSONB AS $$
DECLARE
    v_member public.members%ROWTYPE;
    v_clean TEXT;
    v_vid TEXT := btrim(COALESCE(p_video_id, ''));
    v_mode TEXT := lower(btrim(COALESCE(p_mode, 'chat')));
    v_existing RECORD;
    v_new_id TEXT;
    v_member_id TEXT;
    v_full_name TEXT;
    v_role TEXT;
    v_created_at TIMESTAMPTZ := NOW();
BEGIN
    v_member := public.sg_require_session(p_session_token);

    v_clean := btrim(COALESCE(p_message, ''));
    IF length(v_clean) < 1 THEN
        RAISE EXCEPTION 'Jibu la AI haliwezi kuwa tupu.';
    END IF;
    IF length(v_clean) > 2500 THEN
        v_clean := left(v_clean, 2497) || '...';
    END IF;

    IF v_vid = '' THEN
        SELECT COALESCE(value, '') INTO v_vid
        FROM public.platform_settings
        WHERE key = 'tv_live_url'
        LIMIT 1;

        IF length(v_vid) > 11 THEN
            v_vid := COALESCE(
                (regexp_match(v_vid, '(?:youtu\.be/|youtube\.com/(?:embed/|v/|watch\?.*v=|live/|shorts/))([a-zA-Z0-9_-]{11})'))[1],
                ''
            );
        END IF;
    END IF;

    -- Prevent simultaneous duplicate Solve verdicts within 12 seconds on the same video
    IF v_mode = 'solve' THEN
        SELECT id, video_id, member_id, username, full_name, avatar_url, role, message, created_at
        INTO v_existing
        FROM public.tv_chat_messages
        WHERE video_id = COALESCE(v_vid, '')
          AND role = 'AI_SOLVER'
          AND created_at > (NOW() - INTERVAL '12 seconds')
        ORDER BY created_at DESC
        LIMIT 1;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', true,
                'deduplicated', true,
                'message', to_jsonb(v_existing)
            );
        END IF;

        v_member_id := 'SG-AI-SOLVER';
        v_full_name := 'SILLYGER AI • Jaji wa Ukweli';
        v_role := 'AI_SOLVER';
    ELSE
        v_member_id := 'SG-AI-BOT';
        v_full_name := 'SILLYGER AI';
        v_role := 'AI_BOT';
    END IF;

    v_new_id := 'msg_ai_' || replace(uuid_generate_v4()::text, '-', '');

    INSERT INTO public.tv_chat_messages (
        id, video_id, member_id, username, full_name, avatar_url, role, message, created_at
    ) VALUES (
        v_new_id,
        COALESCE(v_vid, ''),
        v_member_id,
        'sillyger_ai',
        v_full_name,
        NULL,
        v_role,
        v_clean,
        v_created_at
    );

    RETURN jsonb_build_object(
        'success', true,
        'deduplicated', false,
        'message', jsonb_build_object(
            'id', v_new_id,
            'video_id', COALESCE(v_vid, ''),
            'member_id', v_member_id,
            'username', 'sillyger_ai',
            'full_name', v_full_name,
            'avatar_url', NULL,
            'role', v_role,
            'message', v_clean,
            'created_at', v_created_at
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

GRANT EXECUTE ON FUNCTION public.sg_send_tv_ai_chat(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
