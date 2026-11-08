-- ==============================================================================
-- Migration 011: SILLYGER TV Full-Video AI Explanations & Shared Lesson Notes
-- ==============================================================================
-- Stores complete start-to-finish Swahili AI video explanations per YouTube
-- video_id so once analyzed, every SILLYGER member opens full notes in <100ms.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.tv_video_ai_notes (
    video_id TEXT PRIMARY KEY,
    video_title TEXT NOT NULL DEFAULT '',
    full_explanation TEXT NOT NULL,
    generated_by TEXT NOT NULL DEFAULT 'sillyger_ai',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tv_video_ai_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read tv video ai notes" ON public.tv_video_ai_notes;
CREATE POLICY "Anyone can read tv video ai notes"
    ON public.tv_video_ai_notes
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

-- RPC: Fetch cached full-video AI explanation for a specific YouTube video_id
CREATE OR REPLACE FUNCTION public.sg_get_tv_video_notes(
    p_video_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_vid TEXT := btrim(COALESCE(p_video_id, ''));
    v_row public.tv_video_ai_notes%ROWTYPE;
BEGIN
    IF v_vid = '' THEN
        RETURN jsonb_build_object('found', false);
    END IF;

    SELECT *
    INTO v_row
    FROM public.tv_video_ai_notes
    WHERE video_id = v_vid
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('found', false, 'video_id', v_vid);
    END IF;

    RETURN jsonb_build_object(
        'found', true,
        'video_id', v_row.video_id,
        'video_title', v_row.video_title,
        'full_explanation', v_row.full_explanation,
        'generated_by', v_row.generated_by,
        'updated_at', v_row.updated_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

GRANT EXECUTE ON FUNCTION public.sg_get_tv_video_notes(TEXT) TO anon, authenticated, service_role;

-- RPC: Save full-video AI explanation (authenticated members save once; admins can overwrite)
CREATE OR REPLACE FUNCTION public.sg_save_tv_video_notes(
    p_session_token TEXT,
    p_video_id TEXT,
    p_video_title TEXT,
    p_full_explanation TEXT,
    p_force_overwrite BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
    v_member public.members%ROWTYPE;
    v_vid TEXT := btrim(COALESCE(p_video_id, ''));
    v_title TEXT := btrim(COALESCE(p_video_title, ''));
    v_body TEXT := btrim(COALESCE(p_full_explanation, ''));
    v_is_admin BOOLEAN;
    v_saved public.tv_video_ai_notes%ROWTYPE;
BEGIN
    v_member := public.sg_require_session(p_session_token);

    IF v_vid = '' THEN
        RAISE EXCEPTION 'Video ID haipo.';
    END IF;
    IF length(v_body) < 20 THEN
        RAISE EXCEPTION 'Maelezo ya video ni mafupi mno kuhifadhiwa.';
    END IF;
    IF length(v_body) > 25000 THEN
        v_body := left(v_body, 25000);
    END IF;

    v_is_admin := lower(COALESCE(v_member.role, '')) LIKE '%admin%'
                  OR lower(COALESCE(v_member.username, '')) = 'willyger';

    IF p_force_overwrite AND v_is_admin THEN
        INSERT INTO public.tv_video_ai_notes (
            video_id, video_title, full_explanation, generated_by, updated_at
        ) VALUES (
            v_vid, v_title, v_body, v_member.username, NOW()
        )
        ON CONFLICT (video_id) DO UPDATE
        SET video_title = EXCLUDED.video_title,
            full_explanation = EXCLUDED.full_explanation,
            generated_by = EXCLUDED.generated_by,
            updated_at = NOW()
        RETURNING * INTO v_saved;
    ELSE
        INSERT INTO public.tv_video_ai_notes (
            video_id, video_title, full_explanation, generated_by, updated_at
        ) VALUES (
            v_vid, v_title, v_body, v_member.username, NOW()
        )
        ON CONFLICT (video_id) DO NOTHING;

        SELECT * INTO v_saved
        FROM public.tv_video_ai_notes
        WHERE video_id = v_vid
        LIMIT 1;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'video_id', v_saved.video_id,
        'video_title', v_saved.video_title,
        'full_explanation', v_saved.full_explanation,
        'generated_by', v_saved.generated_by,
        'updated_at', v_saved.updated_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

GRANT EXECUTE ON FUNCTION public.sg_save_tv_video_notes(TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO anon, authenticated, service_role;
