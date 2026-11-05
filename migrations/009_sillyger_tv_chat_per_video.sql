-- ==============================================================================
-- Migration 009: Scope TV Chat to Broadcast Video (Fresh chat per video)
-- ==============================================================================

ALTER TABLE public.tv_chat_messages ADD COLUMN IF NOT EXISTS video_id TEXT DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_tv_chat_video_created ON public.tv_chat_messages(video_id, created_at DESC);

-- Update sg_get_tv_chat to accept p_video_id
CREATE OR REPLACE FUNCTION public.sg_get_tv_chat(
    p_video_id TEXT DEFAULT '',
    p_limit INT DEFAULT 60
)
RETURNS JSONB AS $$
DECLARE
    v_messages JSONB;
    v_target_vid TEXT := btrim(COALESCE(p_video_id, ''));
BEGIN
    -- If no video_id provided, fetch current live video from platform settings
    IF v_target_vid = '' THEN
        SELECT COALESCE(value, '') INTO v_target_vid
        FROM public.platform_settings
        WHERE key = 'tv_live_url'
        LIMIT 1;
        -- If it's a full URL or ID, grab 11 chars
        IF length(v_target_vid) > 11 THEN
            v_target_vid := substring(v_target_vid from '([a-zA-Z0-9_-]{11})$');
        END IF;
    END IF;

    SELECT COALESCE(jsonb_agg(to_jsonb(m)), '[]'::jsonb)
    INTO v_messages
    FROM (
        SELECT id, video_id, member_id, username, full_name, avatar_url, role, message, created_at
        FROM public.tv_chat_messages
        WHERE video_id = COALESCE(v_target_vid, '')
        ORDER BY created_at ASC
        LIMIT LEAST(p_limit, 100)
    ) m;

    RETURN v_messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- Update sg_send_tv_chat to accept p_video_id
CREATE OR REPLACE FUNCTION public.sg_send_tv_chat(
    p_session_token TEXT,
    p_message TEXT,
    p_video_id TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
    v_member public.members%ROWTYPE;
    v_clean TEXT;
    v_vid TEXT := btrim(COALESCE(p_video_id, ''));
    v_new_id TEXT;
    v_created_at TIMESTAMPTZ := NOW();
BEGIN
    v_member := public.sg_require_session(p_session_token);

    v_clean := btrim(COALESCE(p_message, ''));
    IF length(v_clean) < 1 THEN
        RAISE EXCEPTION 'Ujumbe hauwezi kuwa mtupu.';
    END IF;
    IF length(v_clean) > 500 THEN
        RAISE EXCEPTION 'Ujumbe ni mrefu mno (kikomo ni herufi 500).';
    END IF;

    IF v_vid = '' THEN
        SELECT COALESCE(value, '') INTO v_vid
        FROM public.platform_settings
        WHERE key = 'tv_live_url'
        LIMIT 1;
        IF length(v_vid) > 11 THEN
            v_vid := substring(v_vid from '([a-zA-Z0-9_-]{11})$');
        END IF;
    END IF;

    v_new_id := 'msg_' || replace(uuid_generate_v4()::text, '-', '');

    INSERT INTO public.tv_chat_messages (
        id, video_id, member_id, username, full_name, avatar_url, role, message, created_at
    ) VALUES (
        v_new_id,
        COALESCE(v_vid, ''),
        COALESCE(v_member.member_id, 'SG-MEMBER'),
        v_member.username,
        v_member.full_name,
        v_member.avatar_url,
        COALESCE(v_member.role, 'Member'),
        v_clean,
        v_created_at
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', jsonb_build_object(
            'id', v_new_id,
            'video_id', COALESCE(v_vid, ''),
            'member_id', COALESCE(v_member.member_id, 'SG-MEMBER'),
            'username', v_member.username,
            'full_name', v_member.full_name,
            'avatar_url', v_member.avatar_url,
            'role', COALESCE(v_member.role, 'Member'),
            'message', v_clean,
            'created_at', v_created_at
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;
