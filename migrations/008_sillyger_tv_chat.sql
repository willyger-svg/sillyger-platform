-- ==============================================================================
-- Migration 008: SILLYGER TV In-App Live Chat & Community Discussion Engine
-- ==============================================================================
-- Enables real-time student and member live discussions under SILLYGER TV broadcasts.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.tv_chat_messages (
    id TEXT PRIMARY KEY DEFAULT ('msg_' || replace(uuid_generate_v4()::text, '-', '')),
    member_id TEXT NOT NULL,
    username TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT DEFAULT NULL,
    role TEXT NOT NULL DEFAULT 'Member',
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tv_chat_created ON public.tv_chat_messages(created_at DESC);

ALTER TABLE public.tv_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read tv chat" ON public.tv_chat_messages;
CREATE POLICY "Anyone can read tv chat" ON public.tv_chat_messages FOR SELECT TO anon, authenticated, service_role USING (true);

-- RPC: Fetch recent chat messages for SILLYGER TV
CREATE OR REPLACE FUNCTION public.sg_get_tv_chat(
    p_limit INT DEFAULT 40
)
RETURNS JSONB AS $$
DECLARE
    v_messages JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(to_jsonb(m)), '[]'::jsonb)
    INTO v_messages
    FROM (
        SELECT id, member_id, username, full_name, avatar_url, role, message, created_at
        FROM public.tv_chat_messages
        ORDER BY created_at DESC
        LIMIT LEAST(p_limit, 100)
    ) m;

    RETURN v_messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- RPC: Send a live chat message from an authenticated member
CREATE OR REPLACE FUNCTION public.sg_send_tv_chat(
    p_session_token TEXT,
    p_message TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_member public.members%ROWTYPE;
    v_clean TEXT;
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

    v_new_id := 'msg_' || replace(uuid_generate_v4()::text, '-', '');

    INSERT INTO public.tv_chat_messages (
        id, member_id, username, full_name, avatar_url, role, message, created_at
    ) VALUES (
        v_new_id,
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
