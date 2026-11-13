-- ====================================================================
-- MIGRATION 019: SILLYGER PAYMENTS & COMMUNITY FUND INTEGRATION (AzamPay)
-- ====================================================================

-- 1. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY DEFAULT ('pay_' || replace(uuid_generate_v4()::text, '-', '')),
    member_id TEXT REFERENCES public.members(member_id) ON DELETE SET NULL,
    external_id TEXT UNIQUE NOT NULL,
    transaction_id TEXT,
    amount NUMERIC(15, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'TZS',
    provider TEXT NOT NULL, -- Mpesa, Tigo, Airtel, Halopesa, Azampesa
    phone_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED
    purpose TEXT NOT NULL DEFAULT 'COMMUNITY_FUND', -- COMMUNITY_FUND, COURSE_FEE, STUDENT_ID, DONATION
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_member_id ON public.payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON public.payments(external_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read payments" ON public.payments;
CREATE POLICY "Anyone can read payments" ON public.payments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert payments" ON public.payments;
CREATE POLICY "Anyone can insert payments" ON public.payments
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update payments" ON public.payments;
CREATE POLICY "Anyone can update payments" ON public.payments
    FOR UPDATE USING (true);

-- 2. FUNCTION TO RECORD INITIATED PAYMENT
CREATE OR REPLACE FUNCTION public.sg_record_payment_initiation(
    p_member_id TEXT,
    p_external_id TEXT,
    p_transaction_id TEXT,
    p_amount NUMERIC,
    p_provider TEXT,
    p_phone_number TEXT,
    p_purpose TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_pay public.payments%ROWTYPE;
BEGIN
    INSERT INTO public.payments (
        member_id, external_id, transaction_id, amount,
        provider, phone_number, status, purpose, metadata
    ) VALUES (
        p_member_id, p_external_id, p_transaction_id, p_amount,
        p_provider, p_phone_number, 'PENDING', p_purpose, p_metadata
    )
    ON CONFLICT (external_id) DO UPDATE
    SET transaction_id = EXCLUDED.transaction_id,
        updated_at = NOW()
    RETURNING * INTO v_pay;

    RETURN to_jsonb(v_pay);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FUNCTION TO FINALIZE / CONFIRM PAYMENT (AND AUTO-UPDATE FUND LEDGER)
CREATE OR REPLACE FUNCTION public.sg_confirm_payment(
    p_external_id TEXT,
    p_transaction_id TEXT,
    p_success BOOLEAN,
    p_message TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
    v_pay public.payments%ROWTYPE;
    v_member public.members%ROWTYPE;
    v_category TEXT;
BEGIN
    SELECT * INTO v_pay FROM public.payments WHERE external_id = p_external_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Muamala haujapatikana: %', p_external_id;
    END IF;

    IF v_pay.status = 'SUCCESS' THEN
        RETURN to_jsonb(v_pay);
    END IF;

    IF p_success THEN
        UPDATE public.payments
        SET status = 'SUCCESS',
            transaction_id = COALESCE(NULLIF(p_transaction_id, ''), transaction_id),
            updated_at = NOW(),
            metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{completion_message}', to_jsonb(p_message))
        WHERE id = v_pay.id
        RETURNING * INTO v_pay;

        -- Get member details
        SELECT * INTO v_member FROM public.members WHERE member_id = v_pay.member_id;

        v_category := CASE
            WHEN v_pay.purpose = 'COURSE_FEE' THEN 'Course Fees'
            WHEN v_pay.purpose = 'STUDENT_ID' THEN 'Student ID Cards'
            ELSE 'Community Fund'
        END;

        -- Automatically add to fund_ledger!
        INSERT INTO public.fund_ledger (
            type, amount, category, description, actor, tx_date
        ) VALUES (
            'INCOME',
            v_pay.amount,
            v_category,
            'Malipo ya AzamPay (' || v_pay.provider || ' ' || v_pay.phone_number || ') na ' || COALESCE(v_member.full_name, 'Mwanachama') || ' [Ref: ' || v_pay.external_id || ']',
            COALESCE(v_member.username, 'AzamPay Gateway'),
            CURRENT_DATE
        );

        -- Audit log
        INSERT INTO public.audit_logs (action, actor, target, details)
        VALUES (
            'PAYMENT_RECEIVED',
            COALESCE(v_member.username, 'AzamPay'),
            v_pay.external_id,
            'TZS ' || v_pay.amount::text || ' via ' || v_pay.provider || ' (' || v_pay.purpose || ')'
        );
    ELSE
        UPDATE public.payments
        SET status = 'FAILED',
            updated_at = NOW(),
            metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{failure_message}', to_jsonb(p_message))
        WHERE id = v_pay.id
        RETURNING * INTO v_pay;
    END IF;

    RETURN to_jsonb(v_pay);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. UPDATE sg_get_public_overview WITH FULL APP SUITE & DYNAMIC FUND BALANCE
CREATE OR REPLACE FUNCTION public.sg_get_public_overview()
RETURNS JSONB AS $$
DECLARE
    v_total INT;
    v_active INT;
    v_pending INT;
    v_announcements JSONB;
    v_session_title TEXT;
    v_fund_balance NUMERIC;
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

    SELECT COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END), 0)
    INTO v_fund_balance
    FROM public.fund_ledger;

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
            'pendingMembers', COALESCE(v_pending, 0),
            'fundBalance', COALESCE(v_fund_balance, 0)
        ),
        'announcements', COALESCE(v_announcements, '[]'::jsonb),
        'active_session_title', COALESCE(v_session_title, 'Hakuna Kipindi Kinachoendelea Sasa'),
        'whatsapp_invite_url', COALESCE(v_wa_invite, ''),
        'tv_stream', COALESCE(v_tv_stream, '{}'::jsonb),
        'tv_archive', COALESCE(v_tv_archive, '[]'::jsonb),
        'app_release', v_app_release
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

GRANT EXECUTE ON FUNCTION public.sg_record_payment_initiation(TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_confirm_payment(TEXT, TEXT, BOOLEAN, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_get_public_overview() TO anon, authenticated, service_role;
