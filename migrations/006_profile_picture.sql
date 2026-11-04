-- ==============================================================================
-- Migration 006: Profile Picture Support (avatar_url)
-- ==============================================================================
-- Adds avatar_url to public.members and extends sg_update_own_profile
-- ==============================================================================

ALTER TABLE public.members ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;

CREATE OR REPLACE FUNCTION public.sg_update_own_profile(
    p_session_token TEXT,
    p_full_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_learning_interest TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL
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
            RAISE EXCEPTION 'Namba ya WhatsApp si sahihi kwa Tanzania. Weka muundo wa 07XXXXXXXX au +2557XXXXXXXX.';
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

    UPDATE public.members
    SET full_name = v_member.full_name,
        phone = v_member.phone,
        learning_interest = v_member.learning_interest,
        avatar_url = v_member.avatar_url
    WHERE id = v_member.id;

    INSERT INTO public.audit_logs (action, actor, target, details)
    VALUES (
        'PROFILE_UPDATED',
        v_member.username,
        COALESCE(v_member.member_id, v_member.username),
        'Mwanachama amesasisha taarifa zake za wasifu / picha.'
    );

    RETURN jsonb_build_object(
        'success', true,
        'member', public.sg_sanitize_member(v_member)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

GRANT EXECUTE ON FUNCTION public.sg_update_own_profile(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

INSERT INTO public.schema_migrations (version, applied_at)
VALUES ('006_profile_picture.sql', NOW())
ON CONFLICT (version) DO NOTHING;
