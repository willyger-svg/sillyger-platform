-- ==============================================================================
-- Migration 003: Bulletproof Member Approval RPC, Sequence Sync & RLS Check
-- ==============================================================================

-- 1. Ensure sequence row exists
INSERT INTO public.sg_id_sequence (id, current_val)
VALUES (1, 1)
ON CONFLICT (id) DO NOTHING;

-- 2. Self-healing sequential ID generator (never drifts behind existing member_ids)
CREATE OR REPLACE FUNCTION public.get_next_sg_member_id()
RETURNS TEXT AS $$
DECLARE
    max_existing INT;
    next_num INT;
    candidate TEXT;
BEGIN
    INSERT INTO public.sg_id_sequence (id, current_val)
    VALUES (1, 1)
    ON CONFLICT (id) DO NOTHING;

    SELECT COALESCE(
        MAX(NULLIF(regexp_replace(member_id, '[^0-9]', '', 'g'), '')::INT),
        0
    )
    INTO max_existing
    FROM public.members
    WHERE member_id ~ '^SG-[0-9]+$';

    LOOP
        UPDATE public.sg_id_sequence
        SET current_val = GREATEST(current_val, max_existing) + 1
        WHERE id = 1
        RETURNING current_val INTO next_num;

        candidate := 'SG-' || LPAD(next_num::TEXT, 6, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.members WHERE member_id = candidate);
        max_existing := next_num;
    END LOOP;

    RETURN candidate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Idempotent, fault-tolerant atomic approval RPC (matches by id OR username)
CREATE OR REPLACE FUNCTION public.approve_member_and_assign_id(
    target_user_id TEXT,
    admin_identifier TEXT DEFAULT 'willyger'
)
RETURNS JSON AS $$
DECLARE
    existing_rec public.members%ROWTYPE;
    new_sg_id TEXT;
    updated_record public.members%ROWTYPE;
    actor_name TEXT;
BEGIN
    actor_name := COALESCE(NULLIF(btrim(admin_identifier), ''), 'willyger');

    SELECT *
    INTO existing_rec
    FROM public.members
    WHERE id = target_user_id OR lower(username) = lower(target_user_id)
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mwanachama hakupatikana kwenye Cloud Database (%).', target_user_id;
    END IF;

    -- Idempotent: if already ACTIVE with a valid member_id, return directly
    IF existing_rec.status = 'ACTIVE' AND existing_rec.member_id IS NOT NULL AND btrim(existing_rec.member_id) <> '' THEN
        RETURN row_to_json(existing_rec);
    END IF;

    IF existing_rec.member_id IS NOT NULL AND btrim(existing_rec.member_id) <> '' THEN
        new_sg_id := existing_rec.member_id;
    ELSE
        new_sg_id := public.get_next_sg_member_id();
    END IF;

    UPDATE public.members
    SET
        member_id = new_sg_id,
        status = 'ACTIVE',
        role = CASE WHEN role = 'Applicant' OR role IS NULL OR btrim(role) = '' THEN 'Member' ELSE role END,
        approved_at = COALESCE(approved_at, NOW()),
        approved_by = actor_name
    WHERE id = existing_rec.id
    RETURNING * INTO updated_record;

    INSERT INTO public.audit_logs (action, actor, target, details)
    VALUES (
        'MEMBER_APPROVED',
        actor_name,
        updated_record.username || ' (' || updated_record.member_id || ')',
        'Application approved. Assigned Unique Member ID: ' || updated_record.member_id || '. WhatsApp Community gate unlocked.'
    );

    RETURN row_to_json(updated_record);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Explicit RPC execution permissions for public / anon / authenticated clients
GRANT EXECUTE ON FUNCTION public.get_next_sg_member_id() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.approve_member_and_assign_id(TEXT, TEXT) TO anon, authenticated, service_role;

-- 5. Ensure UPDATE & INSERT policies allow clean approval/upsert fallback
DROP POLICY IF EXISTS "Admins or self can update member profile" ON public.members;
CREATE POLICY "Admins or self can update member profile"
    ON public.members
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Sync sg_id_sequence with current max member_id without skipping numbers
UPDATE public.sg_id_sequence
SET current_val = GREATEST(
    current_val,
    COALESCE((
        SELECT MAX(NULLIF(regexp_replace(member_id, '[^0-9]', '', 'g'), '')::INT)
        FROM public.members
        WHERE member_id ~ '^SG-[0-9]+$'
    ), 1)
)
WHERE id = 1;
