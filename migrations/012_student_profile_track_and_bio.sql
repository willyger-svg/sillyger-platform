-- ==============================================================================
-- Migration 012: Student Profile Track & Bio Self-Management
-- ==============================================================================
-- Consolidates and upgrades sg_update_own_profile to support updating full_name,
-- phone number, track, learning_interest, motivation (bio), and avatar_url.
-- ==============================================================================

DROP FUNCTION IF EXISTS public.sg_update_own_profile(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.sg_update_own_profile(TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.sg_update_own_profile(
    p_session_token TEXT,
    p_full_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_learning_interest TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL,
    p_track TEXT DEFAULT NULL,
    p_motivation TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_member public.members%ROWTYPE;
    v_norm_phone TEXT;
BEGIN
    v_member := public.sg_require_session(p_session_token);

    IF p_full_name IS NOT NULL AND length(btrim(p_full_name)) >= 3 THEN
        v_member.full_name := btrim(p_full_name);
    END IF;

    IF p_phone IS NOT NULL AND btrim(p_phone) <> '' THEN
        v_norm_phone := public.sg_normalize_tz_phone(p_phone);
        IF v_norm_phone !~ '^\+255(6[125-9]|7[1-9])[0-9]{7}$' THEN
            RAISE EXCEPTION 'Namba ya simu / WhatsApp si sahihi kwa Tanzania. Weka muundo wa 07XXXXXXXX au +255XXXXXXXXX.';
        END IF;

        IF EXISTS (SELECT 1 FROM public.members WHERE phone = v_norm_phone AND id <> v_member.id) THEN
            RAISE EXCEPTION 'Namba hii ya simu tayari inatumiwa na mwanachama mwingine.';
        END IF;

        v_member.phone := v_norm_phone;
    END IF;

    IF p_learning_interest IS NOT NULL THEN
        v_member.learning_interest := btrim(p_learning_interest);
    END IF;

    IF p_avatar_url IS NOT NULL THEN
        IF btrim(p_avatar_url) = '' THEN
            v_member.avatar_url := NULL;
        ELSE
            v_member.avatar_url := btrim(p_avatar_url);
        END IF;
    END IF;

    IF p_track IS NOT NULL AND btrim(p_track) <> '' THEN
        v_member.track := btrim(p_track);
    END IF;

    IF p_motivation IS NOT NULL THEN
        v_member.motivation := btrim(p_motivation);
    END IF;

    UPDATE public.members
    SET full_name = v_member.full_name,
        phone = v_member.phone,
        learning_interest = v_member.learning_interest,
        avatar_url = v_member.avatar_url,
        track = v_member.track,
        motivation = v_member.motivation
    WHERE id = v_member.id;

    INSERT INTO public.audit_logs (action, actor, target, details)
    VALUES (
        'PROFILE_UPDATED',
        v_member.username,
        COALESCE(v_member.member_id, v_member.username),
        'Mwanachama amesasisha wasifu wake (jina, simu, track, maslahi, bio).'
    );

    RETURN jsonb_build_object(
        'success', true,
        'member', public.sg_sanitize_member(v_member)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

GRANT EXECUTE ON FUNCTION public.sg_update_own_profile(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

INSERT INTO public.schema_migrations (version, applied_at)
VALUES ('012_student_profile_track_and_bio.sql', NOW())
ON CONFLICT (version) DO NOTHING;
