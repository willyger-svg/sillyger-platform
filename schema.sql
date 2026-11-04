-- ==============================================================================
-- SILLYGER (SG) DIGITAL MEMBERSHIP & GOVERNANCE PLATFORM (v1.4)
-- COMPLETE PRODUCTION DATABASE SCHEMA & ROW-LEVEL SECURITY (RLS) POLICIES
-- Target: Supabase (PostgreSQL 15+) — 100% Idempotent (Safe to re-run anytime)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SEQUENTIAL MEMBER ID COUNTER TABLE & ATOMIC FUNCTION
-- Ensures gapless sequential IDs: SG-000001, SG-000002, SG-000003...
CREATE TABLE IF NOT EXISTS public.sg_id_sequence (
    id INT PRIMARY KEY DEFAULT 1,
    current_val INT NOT NULL DEFAULT 0
);

INSERT INTO public.sg_id_sequence (id, current_val)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

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

-- 3. PLATFORM SETTINGS TABLE (WhatsApp Invite Link, Active Session Title, etc.)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_by TEXT DEFAULT 'SYSTEM',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. MEMBERS TABLE (Article 5, 6 & Appendix A)
-- Uses TEXT primary key for 100% compatibility between offline/hybrid & cloud records
CREATE TABLE IF NOT EXISTS public.members (
    id TEXT PRIMARY KEY DEFAULT ('usr_' || replace(uuid_generate_v4()::text, '-', '')),
    member_id TEXT UNIQUE, -- Strictly NULL while PENDING; assigned on approval
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL, -- Normalized Tanzania format +255...
    password_hash TEXT NOT NULL, -- Salted SHA-256 hash (sha256$<salt>$<digest>)
    track TEXT DEFAULT 'SG Student Community',
    learning_interest TEXT DEFAULT '',
    experience TEXT DEFAULT 'Student',
    motivation TEXT DEFAULT '',
    role TEXT NOT NULL DEFAULT 'Applicant', -- Applicant, Member, Instructor, Project Lead, Moderator, Admin, Super Administrator
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, ACTIVE, ON_HOLD, SUSPENDED, INACTIVE, TERMINATED
    agreed_constitution BOOLEAN NOT NULL DEFAULT TRUE,
    agreed_ethics BOOLEAN NOT NULL DEFAULT TRUE,
    agreed_pdpa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email);
CREATE INDEX IF NOT EXISTS idx_members_username ON public.members(username);
CREATE INDEX IF NOT EXISTS idx_members_phone ON public.members(phone);
CREATE INDEX IF NOT EXISTS idx_members_member_id ON public.members(member_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);

-- 5. OFFICIAL ANNOUNCEMENTS TABLE (Article 6.8 & 11)
CREATE TABLE IF NOT EXISTS public.announcements (
    id TEXT PRIMARY KEY DEFAULT ('anc_' || replace(uuid_generate_v4()::text, '-', '')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'NORMAL', -- NORMAL, HIGH
    author TEXT NOT NULL DEFAULT 'Super Administrator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);

-- 6. SG COMMUNITY FUND LEDGER TABLE (Article 13)
CREATE TABLE IF NOT EXISTS public.fund_ledger (
    id TEXT PRIMARY KEY DEFAULT ('tx_' || replace(uuid_generate_v4()::text, '-', '')),
    type TEXT NOT NULL DEFAULT 'INCOME', -- INCOME, EXPENSE
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'Infrastructure',
    description TEXT NOT NULL,
    actor TEXT NOT NULL DEFAULT 'Super Administrator',
    tx_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fund_ledger_created_at ON public.fund_ledger(created_at DESC);

-- 7. ATTENDANCE TABLE (Article 6.6 & 9)
CREATE TABLE IF NOT EXISTS public.attendance (
    id TEXT PRIMARY KEY DEFAULT ('att_' || replace(uuid_generate_v4()::text, '-', '')),
    member_id TEXT NOT NULL,
    session_title TEXT NOT NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_planned BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON public.attendance(member_id);

-- 8. LEAVE REQUESTS TABLE (Article 10)
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id TEXT PRIMARY KEY DEFAULT ('leave_' || replace(uuid_generate_v4()::text, '-', '')),
    member_id TEXT NOT NULL,
    category TEXT NOT NULL, -- Academic, Work, Health, Technical, Family
    duration TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, APPROVED, REJECTED
    reviewed_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_member_id ON public.leave_requests(member_id);

-- 9. SUPPORT TICKETS TABLE (Article 6.12)
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id TEXT PRIMARY KEY DEFAULT ('ticket_' || replace(uuid_generate_v4()::text, '-', '')),
    member_id TEXT NOT NULL,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, RESOLVED, CLOSED
    response TEXT,
    responded_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_member_id ON public.support_tickets(member_id);

-- 10. IMMUTABLE AUDIT LOGS TABLE (Article 7.7)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('log_' || replace(uuid_generate_v4()::text, '-', '')),
    action TEXT NOT NULL,
    actor TEXT NOT NULL,
    target TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- 11. ATOMIC APPROVAL RPC FUNCTION
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

-- Kernel-level trigger protecting Founder / Super Administrator (SG-000001)
CREATE OR REPLACE FUNCTION public.protect_sg_founder_account()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.member_id = 'SG-000001' OR lower(OLD.username) = 'willyger' THEN
            RAISE EXCEPTION 'Hauruhusiwi kufuta akaunti ya Mwanzilishi / Super Administrator (SG-000001)!';
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.member_id = 'SG-000001' OR lower(OLD.username) = 'willyger' THEN
            NEW.member_id := 'SG-000001';
            NEW.username := 'willyger';
            NEW.role := 'Super Administrator';
            NEW.status := 'ACTIVE';
        END IF;
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_founder ON public.members;
CREATE TRIGGER trg_protect_founder
BEFORE UPDATE OR DELETE ON public.members
FOR EACH ROW EXECUTE FUNCTION public.protect_sg_founder_account();

-- 12. SEED FOUNDER / SUPER ADMINISTRATOR ACCOUNT & INITIAL SETTINGS
INSERT INTO public.members (
    id, full_name, username, email, phone, password_hash, track, experience, role, status, member_id, approved_at, approved_by
)
VALUES (
    'usr_admin_001',
    'William Gerishom William',
    'willyger',
    'wshavu@gmail.com',
    '+255750449373',
    'sha256$sg_founder_v14$7720a68116abeee3a59cbb401ecdb701739d19b567a7d28031c6880d6ae8c1ac',
    'SILLYGER Systems & Architecture',
    'Advanced',
    'Super Administrator',
    'ACTIVE',
    'SG-000001',
    NOW(),
    'SYSTEM_FOUNDER'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.announcements (id, title, content, priority, author)
VALUES (
    'anc_001',
    'Uzinduzi Rasmi wa SILLYGER Community Platform v1.4',
    'Karibuni Sillygerians! Tovuti rasmi, mfumo wa uanachama na mtaala wa hatua 10 sasa vimefunguliwa rasmi. Kila mwanachama anatakiwa kupitia Katiba v1.4.',
    'HIGH',
    'William Gerishom William (Super Admin)'
)
ON CONFLICT (id) DO NOTHING;

UPDATE public.sg_id_sequence SET current_val = 1 WHERE id = 1 AND current_val < 1;


-- ==============================================================================
-- Migration 004: Server-Side Session Shield, Strict RLS & PDPA 2022 Privacy Lock
-- ==============================================================================
-- Closes critical client-side exposure vulnerabilities:
--   1. Blocks direct PostgREST SELECT/INSERT/UPDATE/DELETE on `public.members`
--      so member phone numbers, emails, and `password_hash` NEVER leak to browsers.
--   2. Moves authentication, registration, student actions, and admin RBAC
--      operations into server-verified PostgreSQL `SECURITY DEFINER` RPCs backed
--      by cryptographic session tokens (`public.auth_sessions`).
--   3. Protects `whatsapp_invite_url` in `public.platform_settings` so it is ONLY
--      returned to verified `ACTIVE` members or Administrators.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CRYPTOGRAPHIC SESSION TABLE (Server-only; zero direct PostgREST access)
CREATE TABLE IF NOT EXISTS public.auth_sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON public.auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON public.auth_sessions(expires_at);

-- Seed private WhatsApp Group invite link inside protected server settings (if not set)
INSERT INTO public.platform_settings (key, value, updated_by)
VALUES (
    'whatsapp_invite_url',
    'https://chat.whatsapp.com/KRxyaSoVcUCGLq0PdOy6Jb?s=cl&p=a&iam=2',
    'SYSTEM_FOUNDER'
)
ON CONFLICT (key) DO NOTHING;

-- 2.STRICT ROW-LEVEL SECURITY (RLS) ACROSS ALL TABLES
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sg_id_sequence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schema_migrations') THEN
        EXECUTE 'ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY';
    END IF;
END $$;

-- Drop all legacy permissive policies
DROP POLICY IF EXISTS "Platform settings access" ON public.platform_settings;
DROP POLICY IF EXISTS "Public safe platform settings read" ON public.platform_settings;

DROP POLICY IF EXISTS "Public registration allowed" ON public.members;
DROP POLICY IF EXISTS "Read member public profiles" ON public.members;
DROP POLICY IF EXISTS "Admins or self can update member profile" ON public.members;
DROP POLICY IF EXISTS "Admins can delete applicant" ON public.members;

DROP POLICY IF EXISTS "Announcements access" ON public.announcements;
DROP POLICY IF EXISTS "Public read announcements" ON public.announcements;

DROP POLICY IF EXISTS "Fund ledger access" ON public.fund_ledger;

DROP POLICY IF EXISTS "Attendance viewable by members" ON public.attendance;
DROP POLICY IF EXISTS "Members can checkin planned attendance" ON public.attendance;
DROP POLICY IF EXISTS "Attendance management access" ON public.attendance;

DROP POLICY IF EXISTS "Members can manage their leave" ON public.leave_requests;
DROP POLICY IF EXISTS "Members can manage their tickets" ON public.support_tickets;

DROP POLICY IF EXISTS "Read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Insert audit logs" ON public.audit_logs;

-- Only public announcements and non-sensitive public settings are directly readable:
CREATE POLICY "Public read announcements"
    ON public.announcements
    FOR SELECT
    USING (true);

CREATE POLICY "Public safe platform settings read"
    ON public.platform_settings
    FOR SELECT
    USING (key IN ('active_session_title'));

-- 3. INTERNAL CRYPTOGRAPHIC & RBAC HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.sg_normalize_tz_phone(p_raw TEXT)
RETURNS TEXT AS $$
DECLARE
    v_clean TEXT;
BEGIN
    IF p_raw IS NULL THEN
        RETURN '';
    END IF;
    v_clean := regexp_replace(p_raw, '[\s\-()]', '', 'g');
    IF v_clean = '' THEN
        RETURN '';
    END IF;
    IF left(v_clean, 1) = '+' THEN
        RETURN v_clean;
    ELSIF left(v_clean, 1) = '0' THEN
        RETURN '+255' || substr(v_clean, 2);
    ELSIF left(v_clean, 3) = '255' THEN
        RETURN '+' || v_clean;
    ELSIF length(v_clean) = 9 THEN
        RETURN '+255' || v_clean;
    END IF;
    RETURN '+' || v_clean;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_hash_password(p_plain TEXT)
RETURNS TEXT AS $$
DECLARE
    v_salt TEXT;
    v_digest TEXT;
BEGIN
    v_salt := 'sg_' || encode(extensions.gen_random_bytes(8), 'hex');
    v_digest := encode(
        extensions.digest(convert_to(v_salt || ':' || COALESCE(p_plain, ''), 'UTF8'), 'sha256'),
        'hex'
    );
    RETURN 'sha256$' || v_salt || '$' || v_digest;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_verify_password(p_plain TEXT, p_stored TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_parts TEXT[];
    v_salt TEXT;
    v_expected TEXT;
    v_actual TEXT;
BEGIN
    IF p_stored IS NULL OR p_plain IS NULL THEN
        RETURN FALSE;
    END IF;

    IF p_stored ~ '^sha256\$[A-Za-z0-9_]+\$[0-9a-f]{64}$' THEN
        v_parts := string_to_array(p_stored, '$');
        v_salt := v_parts[2];
        v_expected := v_parts[3];
        v_actual := encode(
            extensions.digest(convert_to(v_salt || ':' || p_plain, 'UTF8'), 'sha256'),
            'hex'
        );
        RETURN v_actual = v_expected;
    END IF;

    RETURN p_plain = p_stored;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_sanitize_member(rec public.members)
RETURNS JSONB AS $$
BEGIN
    RETURN to_jsonb(rec) - 'password_hash';
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_is_super_admin_member(rec public.members)
RETURNS BOOLEAN AS $$
BEGIN
    IF rec.id IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN (
        rec.member_id = 'SG-000001'
        OR lower(COALESCE(rec.username, '')) = 'willyger'
        OR lower(COALESCE(rec.email, '')) = 'wshavu@gmail.com'
        OR rec.role = 'Super Administrator'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_is_admin_member(rec public.members)
RETURNS BOOLEAN AS $$
BEGIN
    IF rec.id IS NULL THEN
        RETURN FALSE;
    END IF;
    IF public.sg_is_super_admin_member(rec) THEN
        RETURN TRUE;
    END IF;
    RETURN rec.role IN (
        'Administrator',
        'Membership Administrator',
        'Education Administrator',
        'Finance Administrator'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_require_session(p_session_token TEXT)
RETURNS public.members AS $$
DECLARE
    v_token TEXT;
    v_sess public.auth_sessions%ROWTYPE;
    v_member public.members%ROWTYPE;
BEGIN
    v_token := btrim(COALESCE(p_session_token, ''));
    IF v_token = '' THEN
        RAISE EXCEPTION 'SESSION_EXPIRED: Tafadhali ingia kwenye akaunti yako kwanza.';
    END IF;

    SELECT *
    INTO v_sess
    FROM public.auth_sessions
    WHERE token = v_token AND expires_at > NOW()
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SESSION_EXPIRED: Kikao chako kimekwisha muda wake. Tafadhali ingia tena.';
    END IF;

    SELECT *
    INTO v_member
    FROM public.members
    WHERE id = v_sess.user_id
    LIMIT 1;

    IF NOT FOUND THEN
        DELETE FROM public.auth_sessions WHERE token = v_token;
        RAISE EXCEPTION 'SESSION_EXPIRED: Akaunti haikupatikana.';
    END IF;

    UPDATE public.auth_sessions
    SET last_seen_at = NOW()
    WHERE token = v_token;

    RETURN v_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_require_admin(p_session_token TEXT)
RETURNS public.members AS $$
DECLARE
    v_member public.members%ROWTYPE;
BEGIN
    v_member := public.sg_require_session(p_session_token);
    IF NOT public.sg_is_admin_member(v_member) OR v_member.status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'FORBIDDEN: Kitendo hiki kinahitaji mamlaka ya Msimamizi (Administrator RBAC).';
    END IF;
    RETURN v_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 4. PUBLIC OVERVIEW RPC (Zero personal data exposed!)
CREATE OR REPLACE FUNCTION public.sg_get_public_overview()
RETURNS JSONB AS $$
DECLARE
    v_total INT;
    v_active INT;
    v_pending INT;
    v_announcements JSONB;
    v_session_title TEXT;
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

    RETURN jsonb_build_object(
        'stats', jsonb_build_object(
            'totalRegistered', COALESCE(v_total, 0),
            'activeMembers', COALESCE(v_active, 0),
            'pendingApplicants', COALESCE(v_pending, 0)
        ),
        'announcements', COALESCE(v_announcements, '[]'::jsonb),
        'active_session_title', COALESCE(v_session_title, '')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 5. REGISTRATION & AUTHENTICATION RPCS
CREATE OR REPLACE FUNCTION public.sg_register_applicant(
    p_full_name TEXT,
    p_username TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_password TEXT,
    p_learning_interest TEXT DEFAULT '',
    p_issue_session BOOLEAN DEFAULT TRUE
)
RETURNS JSONB AS $$
DECLARE
    v_name TEXT;
    v_username TEXT;
    v_email TEXT;
    v_phone TEXT;
    v_note TEXT;
    v_hash TEXT;
    v_new_id TEXT;
    v_inserted public.members%ROWTYPE;
    v_token TEXT := NULL;
BEGIN
    v_name := btrim(COALESCE(p_full_name, ''));
    v_username := lower(btrim(COALESCE(p_username, '')));
    v_email := lower(btrim(COALESCE(p_email, '')));
    v_phone := public.sg_normalize_tz_phone(p_phone);
    v_note := btrim(COALESCE(p_learning_interest, ''));

    IF length(v_name) < 3 THEN
        RAISE EXCEPTION 'Tafadhali weka jina lako kamili halisi.';
    END IF;
    IF v_username !~ '^[a-z0-9_]{3,40}$' THEN
        RAISE EXCEPTION 'Username lazima iwe na herufi au nambari pekee bila nafasi (angalau herufi 3).';
    END IF;
    IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
        RAISE EXCEPTION 'Tafadhali weka barua pepe (Email) sahihi.';
    END IF;
    IF v_phone !~ '^\+255[67][0-9]{8}$' THEN
        RAISE EXCEPTION 'Namba ya WhatsApp si sahihi kwa Tanzania. Weka muundo wa 07XXXXXXXX au +2557XXXXXXXX.';
    END IF;
    IF p_password IS NULL OR length(p_password) < 6 THEN
        RAISE EXCEPTION 'Nenosiri (Password) lazima liwe na angalau herufi 6.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.members WHERE lower(email) = v_email) THEN
        RAISE EXCEPTION 'Barua pepe hii (Email) tayari imesajiliwa. Tafadhali ingia au tumia barua pepe nyingine.';
    END IF;
    IF EXISTS (SELECT 1 FROM public.members WHERE lower(username) = v_username) THEN
        RAISE EXCEPTION 'Jina la mtumiaji (Username) hili tayari limetumika. Tafadhali chagua jina jingine.';
    END IF;
    IF EXISTS (SELECT 1 FROM public.members WHERE phone = v_phone) THEN
        RAISE EXCEPTION 'Namba hii ya WhatsApp tayari imesajiliwa. Tumia namba yako halisi au ingia kwenye Portal.';
    END IF;

    v_hash := public.sg_hash_password(p_password);
    v_new_id := 'usr_' || replace(extensions.uuid_generate_v4()::text, '-', '');

    INSERT INTO public.members (
        id, member_id, full_name, username, email, phone, password_hash,
        track, learning_interest, motivation, experience, role, status,
        agreed_constitution, agreed_ethics, agreed_pdpa
    )
    VALUES (
        v_new_id, NULL, v_name, v_username, v_email, v_phone, v_hash,
        'SG Student Community', v_note, v_note, 'Student', 'Applicant', 'PENDING',
        TRUE, TRUE, TRUE
    )
    RETURNING * INTO v_inserted;

    INSERT INTO public.audit_logs (action, actor, target, details)
    VALUES (
        'APPLICANT_REGISTERED',
        v_inserted.username,
        v_inserted.full_name,
        'New student registration received from ' || v_inserted.phone || ' (SG Student Community). Status: PENDING review.'
    );

    IF COALESCE(p_issue_session, TRUE) THEN
        v_token := 'sgs_' || encode(extensions.gen_random_bytes(24), 'hex');
        INSERT INTO public.auth_sessions (token, user_id)
        VALUES (v_token, v_inserted.id);
    END IF;

    RETURN jsonb_build_object(
        'member', public.sg_sanitize_member(v_inserted),
        'session_token', v_token
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_login(
    p_credential TEXT,
    p_password TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_search TEXT;
    v_norm_phone TEXT;
    v_digits TEXT;
    v_member public.members%ROWTYPE;
    v_token TEXT;
    v_wa_url TEXT := NULL;
    v_active_title TEXT := '';
BEGIN
    v_search := lower(btrim(COALESCE(p_credential, '')));
    IF v_search = '' OR p_password IS NULL OR p_password = '' THEN
        RAISE EXCEPTION 'Tafadhali weka taarifa za kuingia na nenosiri lako.';
    END IF;

    v_norm_phone := public.sg_normalize_tz_phone(v_search);
    v_digits := regexp_replace(v_search, '[^0-9]', '', 'g');

    SELECT *
    INTO v_member
    FROM public.members
    WHERE lower(email) = v_search
       OR lower(username) = v_search
       OR (member_id IS NOT NULL AND lower(member_id) = v_search)
       OR phone = v_norm_phone
       OR (length(v_digits) >= 9 AND regexp_replace(phone, '[^0-9]', '', 'g') = v_digits)
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Hakuna akaunti iliyopatikana kwa taarifa hizi. Hakikisha email, username au namba ya WhatsApp uliyoweka ni sahihi.';
    END IF;

    IF NOT public.sg_verify_password(p_password, v_member.password_hash) THEN
        RAISE EXCEPTION 'Nenosiri (Password) si sahihi. Tafadhali hakiki na ujaribu tena.';
    END IF;

    -- Upgrade legacy plain hash if ever encountered
    IF v_member.password_hash !~ '^sha256\$[A-Za-z0-9_]+\$[0-9a-f]{64}$' THEN
        UPDATE public.members
        SET password_hash = public.sg_hash_password(p_password)
        WHERE id = v_member.id
        RETURNING * INTO v_member;
    END IF;

    DELETE FROM public.auth_sessions WHERE expires_at <= NOW();

    v_token := 'sgs_' || encode(extensions.gen_random_bytes(24), 'hex');
    INSERT INTO public.auth_sessions (token, user_id)
    VALUES (v_token, v_member.id);

    INSERT INTO public.audit_logs (action, actor, target, details)
    VALUES (
        'MEMBER_LOGIN',
        v_member.username,
        COALESCE(v_member.member_id, 'PENDING'),
        'Authenticated login via Server Session Shield. Status: ' || v_member.status || '.'
    );

    IF v_member.status = 'ACTIVE' OR public.sg_is_admin_member(v_member) THEN
        SELECT value INTO v_wa_url FROM public.platform_settings WHERE key = 'whatsapp_invite_url' LIMIT 1;
    END IF;

    SELECT COALESCE(value, '') INTO v_active_title FROM public.platform_settings WHERE key = 'active_session_title' LIMIT 1;

    RETURN jsonb_build_object(
        'session_token', v_token,
        'member', public.sg_sanitize_member(v_member),
        'whatsapp_invite_url', v_wa_url,
        'active_session_title', COALESCE(v_active_title, '')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_logout(p_session_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_token TEXT;
    v_sess public.auth_sessions%ROWTYPE;
    v_member public.members%ROWTYPE;
BEGIN
    v_token := btrim(COALESCE(p_session_token, ''));
    IF v_token = '' THEN
        RETURN TRUE;
    END IF;

    SELECT * INTO v_sess FROM public.auth_sessions WHERE token = v_token LIMIT 1;
    IF FOUND THEN
        SELECT * INTO v_member FROM public.members WHERE id = v_sess.user_id LIMIT 1;
        IF FOUND THEN
            INSERT INTO public.audit_logs (action, actor, target, details)
            VALUES ('USER_LOGOUT', v_member.username, v_member.full_name, 'Member signed out from portal session.');
        END IF;
        DELETE FROM public.auth_sessions WHERE token = v_token;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 6. AUTHENTICATED STUDENT PORTAL RPCS (Scoped strictly to own records!)
CREATE OR REPLACE FUNCTION public.sg_get_my_portal_state(p_session_token TEXT)
RETURNS JSONB AS $$
DECLARE
    v_member public.members%ROWTYPE;
    v_wa_url TEXT := NULL;
    v_active_title TEXT := '';
    v_announcements JSONB;
    v_attendance JSONB := '[]'::jsonb;
    v_leaves JSONB := '[]'::jsonb;
    v_tickets JSONB := '[]'::jsonb;
    v_total INT;
    v_active INT;
    v_pending INT;
BEGIN
    v_member := public.sg_require_session(p_session_token);

    IF v_member.status = 'ACTIVE' OR public.sg_is_admin_member(v_member) THEN
        SELECT value INTO v_wa_url FROM public.platform_settings WHERE key = 'whatsapp_invite_url' LIMIT 1;
    END IF;

    SELECT COALESCE(value, '') INTO v_active_title FROM public.platform_settings WHERE key = 'active_session_title' LIMIT 1;

    SELECT COALESCE(jsonb_agg(to_jsonb(a)), '[]'::jsonb)
    INTO v_announcements
    FROM (SELECT * FROM public.announcements ORDER BY created_at DESC LIMIT 30) a;

    IF v_member.member_id IS NOT NULL THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(att)), '[]'::jsonb)
        INTO v_attendance
        FROM (
            SELECT * FROM public.attendance
            WHERE member_id = v_member.member_id
            ORDER BY created_at DESC
        ) att;

        SELECT COALESCE(jsonb_agg(to_jsonb(lv)), '[]'::jsonb)
        INTO v_leaves
        FROM (
            SELECT * FROM public.leave_requests
            WHERE member_id = v_member.member_id
            ORDER BY created_at DESC
        ) lv;
    END IF;

    SELECT COALESCE(jsonb_agg(to_jsonb(tk)), '[]'::jsonb)
    INTO v_tickets
    FROM (
        SELECT * FROM public.support_tickets
        WHERE member_id IN (COALESCE(v_member.member_id, ''), v_member.username, v_member.id)
        ORDER BY created_at DESC
    ) tk;

    SELECT
        COUNT(*)::INT,
        COUNT(*) FILTER (WHERE status = 'ACTIVE')::INT,
        COUNT(*) FILTER (WHERE status = 'PENDING')::INT
    INTO v_total, v_active, v_pending
    FROM public.members;

    RETURN jsonb_build_object(
        'member', public.sg_sanitize_member(v_member),
        'whatsapp_invite_url', v_wa_url,
        'active_session_title', COALESCE(v_active_title, ''),
        'announcements', COALESCE(v_announcements, '[]'::jsonb),
        'attendance', COALESCE(v_attendance, '[]'::jsonb),
        'leave_requests', COALESCE(v_leaves, '[]'::jsonb),
        'support_tickets', COALESCE(v_tickets, '[]'::jsonb),
        'stats', jsonb_build_object(
            'totalRegistered', COALESCE(v_total, 0),
            'activeMembers', COALESCE(v_active, 0),
            'pendingApplicants', COALESCE(v_pending, 0)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_change_own_password(
    p_session_token TEXT,
    p_current_password TEXT,
    p_new_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_member public.members%ROWTYPE;
    v_new_hash TEXT;
BEGIN
    v_member := public.sg_require_session(p_session_token);

    IF p_new_password IS NULL OR length(p_new_password) < 6 THEN
        RAISE EXCEPTION 'Nenosiri jipya lazima liwe na angalau herufi 6.';
    END IF;

    IF NOT public.sg_verify_password(p_current_password, v_member.password_hash) THEN
        RAISE EXCEPTION 'Nenosiri la sasa si sahihi.';
    END IF;

    v_new_hash := public.sg_hash_password(p_new_password);
    UPDATE public.members SET password_hash = v_new_hash WHERE id = v_member.id;

    -- Revoke any other sessions except current one
    DELETE FROM public.auth_sessions
    WHERE user_id = v_member.id AND token <> btrim(p_session_token);

    INSERT INTO public.audit_logs (action, actor, target, details)
    VALUES (
        'PASSWORD_CHANGED',
        v_member.username,
        COALESCE(v_member.member_id, v_member.username),
        'Account password updated securely with salted SHA-256 hash.'
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_student_checkin(
    p_session_token TEXT,
    p_session_title TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_member public.members%ROWTYPE;
    v_title TEXT;
    v_today DATE := CURRENT_DATE;
    v_rec public.attendance%ROWTYPE;
BEGIN
    v_member := public.sg_require_session(p_session_token);

    IF v_member.status <> 'ACTIVE' OR v_member.member_id IS NULL THEN
        RAISE EXCEPTION 'Wanachama walioidhinishwa (ACTIVE) pekee ndio wanaweza kufanya check-in.';
    END IF;

    v_title := COALESCE(NULLIF(btrim(p_session_title), ''), 'Kipindi cha Mafunzo ya SILLYGER');

    IF EXISTS (
        SELECT 1 FROM public.attendance
        WHERE member_id = v_member.member_id
          AND session_date = v_today
          AND lower(session_title) = lower(v_title)
    ) THEN
        RAISE EXCEPTION 'Tayari umeshafanya check-in kwenye kipindi cha "%" leo (%).', v_title, v_today;
    END IF;

    INSERT INTO public.attendance (member_id, session_title, session_date, is_planned, is_verified)
    VALUES (v_member.member_id, v_title, v_today, TRUE, FALSE)
    RETURNING * INTO v_rec;

    INSERT INTO public.audit_logs (action, actor, target, details)
    VALUES (
        'ATTENDANCE_CHECKIN',
        v_member.member_id,
        v_title,
        'Member checked-in (Planned attendance recorded for ' || v_today::text || ').'
    );

    RETURN to_jsonb(v_rec);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_submit_leave_request(
    p_session_token TEXT,
    p_category TEXT,
    p_duration TEXT,
    p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_member public.members%ROWTYPE;
    v_reason TEXT;
    v_rec public.leave_requests%ROWTYPE;
BEGIN
    v_member := public.sg_require_session(p_session_token);

    IF v_member.status <> 'ACTIVE' OR v_member.member_id IS NULL THEN
        RAISE EXCEPTION 'Wanachama walioidhinishwa pekee wanaweza kuomba ruhusa.';
    END IF;

    v_reason := btrim(COALESCE(p_reason, ''));
    IF v_reason = '' THEN
        RAISE EXCEPTION 'Tafadhali eleza sababu ya kuomba ruhusa.';
    END IF;

    INSERT INTO public.leave_requests (member_id, category, duration, reason, status)
    VALUES (
        v_member.member_id,
        COALESCE(NULLIF(btrim(p_category), ''), 'Academic'),
        COALESCE(NULLIF(btrim(p_duration), ''), 'Siku 1 - 3'),
        v_reason,
        'PENDING_REVIEW'
    )
    RETURNING * INTO v_rec;

    INSERT INTO public.audit_logs (action, actor, target, details)
    VALUES (
        'LEAVE_REQUESTED',
        v_member.member_id,
        v_rec.category,
        'Permission requested (' || v_rec.duration || '): ' || left(v_reason, 80)
    );

    RETURN to_jsonb(v_rec);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_submit_support_ticket(
    p_session_token TEXT,
    p_category TEXT,
    p_subject TEXT,
    p_message TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_member public.members%ROWTYPE;
    v_subject TEXT;
    v_message TEXT;
    v_actor_id TEXT;
    v_rec public.support_tickets%ROWTYPE;
BEGIN
    v_member := public.sg_require_session(p_session_token);

    v_subject := btrim(COALESCE(p_subject, ''));
    v_message := btrim(COALESCE(p_message, ''));
    IF v_subject = '' OR v_message = '' THEN
        RAISE EXCEPTION 'Tafadhali jaza kichwa cha ujumbe na maelezo ya tiketi.';
    END IF;

    v_actor_id := COALESCE(v_member.member_id, v_member.username);

    INSERT INTO public.support_tickets (member_id, category, subject, message, status)
    VALUES (
        v_actor_id,
        COALESCE(NULLIF(btrim(p_category), ''), 'Account & Approval'),
        v_subject,
        v_message,
        'OPEN'
    )
    RETURNING * INTO v_rec;

    INSERT INTO public.audit_logs (action, actor, target, details)
    VALUES (
        'SUPPORT_TICKET_CREATED',
        v_actor_id,
        v_subject,
        'Support ticket opened: ' || v_rec.category || '.'
    );

    RETURN to_jsonb(v_rec);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 7. AUTHENTICATED ADMINISTRATOR COMMAND RPCS
CREATE OR REPLACE FUNCTION public.sg_admin_get_full_state(p_session_token TEXT)
RETURNS JSONB AS $$
DECLARE
    v_admin public.members%ROWTYPE;
    v_members JSONB;
    v_announcements JSONB;
    v_fund JSONB;
    v_attendance JSONB;
    v_leaves JSONB;
    v_tickets JSONB;
    v_logs JSONB;
    v_settings JSONB;
BEGIN
    v_admin := public.sg_require_admin(p_session_token);

    SELECT COALESCE(jsonb_agg(public.sg_sanitize_member(m)), '[]'::jsonb)
    INTO v_members
    FROM (SELECT * FROM public.members ORDER BY created_at ASC) m;

    SELECT COALESCE(jsonb_agg(to_jsonb(a)), '[]'::jsonb)
    INTO v_announcements
    FROM (SELECT * FROM public.announcements ORDER BY created_at DESC) a;

    SELECT COALESCE(jsonb_agg(to_jsonb(f)), '[]'::jsonb)
    INTO v_fund
    FROM (SELECT * FROM public.fund_ledger ORDER BY created_at DESC) f;

    SELECT COALESCE(jsonb_agg(to_jsonb(att)), '[]'::jsonb)
    INTO v_attendance
    FROM (SELECT * FROM public.attendance ORDER BY created_at DESC) att;

    SELECT COALESCE(jsonb_agg(to_jsonb(lv)), '[]'::jsonb)
    INTO v_leaves
    FROM (SELECT * FROM public.leave_requests ORDER BY created_at DESC) lv;

    SELECT COALESCE(jsonb_agg(to_jsonb(tk)), '[]'::jsonb)
    INTO v_tickets
    FROM (SELECT * FROM public.support_tickets ORDER BY created_at DESC) tk;

    SELECT COALESCE(jsonb_agg(to_jsonb(lg)), '[]'::jsonb)
    INTO v_logs
    FROM (SELECT * FROM public.audit_logs ORDER BY timestamp DESC LIMIT 300) lg;

    SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)
    INTO v_settings
    FROM public.platform_settings;

    RETURN jsonb_build_object(
        'admin', public.sg_sanitize_member(v_admin),
        'members', v_members,
        'announcements', v_announcements,
        'fund_ledger', v_fund,
        'attendance', v_attendance,
        'leave_requests', v_leaves,
        'support_tickets', v_tickets,
        'audit_logs', v_logs,
        'settings', v_settings
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_admin_approve_member(
    p_session_token TEXT,
    p_target_user_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_admin public.members%ROWTYPE;
    v_approved JSON;
    v_rec public.members%ROWTYPE;
BEGIN
    v_admin := public.sg_require_admin(p_session_token);

    v_approved := public.approve_member_and_assign_id(p_target_user_id, v_admin.username);

    SELECT *
    INTO v_rec
    FROM public.members
    WHERE id = p_target_user_id OR lower(username) = lower(p_target_user_id)
    LIMIT 1;

    RETURN public.sg_sanitize_member(v_rec);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_admin_delete_member(
    p_session_token TEXT,
    p_target_user_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin public.members%ROWTYPE;
    v_target public.members%ROWTYPE;
BEGIN
    v_admin := public.sg_require_admin(p_session_token);

    SELECT *
    INTO v_target
    FROM public.members
    WHERE id = p_target_user_id OR lower(username) = lower(p_target_user_id)
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mwanachama hakupatikana.';
    END IF;

    IF v_target.member_id = 'SG-000001' OR lower(v_target.username) = 'willyger' THEN
        RAISE EXCEPTION 'Huwezi kufuta akaunti ya Mwanzilishi / Super Administrator!';
    END IF;

    IF public.sg_is_admin_member(v_target) AND NOT public.sg_is_super_admin_member(v_admin) THEN
        RAISE EXCEPTION 'Super Administrator pekee ndiye anayeweza kuondoa msimamizi mwingine.';
    END IF;

    DELETE FROM public.members WHERE id = v_target.id;

    INSERT INTO public.audit_logs (action, actor, target, details)
    VALUES (
        'MEMBER_DELETED',
        v_admin.username,
        v_target.username || ' (' || v_target.full_name || ')',
        'Record deleted from system by ' || v_admin.username || '.'
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_admin_update_dossier(
    p_session_token TEXT,
    p_target_user_id TEXT,
    p_member_id TEXT DEFAULT NULL,
    p_role TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_new_password TEXT DEFAULT NULL,
    p_reason TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
    v_admin public.members%ROWTYPE;
    v_target public.members%ROWTYPE;
    v_is_super BOOLEAN;
    v_custom_id TEXT;
    v_final_id TEXT;
    v_final_status TEXT;
    v_final_role TEXT;
    v_reason TEXT;
BEGIN
    v_admin := public.sg_require_admin(p_session_token);
    v_is_super := public.sg_is_super_admin_member(v_admin);
    v_reason := COALESCE(NULLIF(btrim(p_reason), ''), 'Administrative update');

    SELECT *
    INTO v_target
    FROM public.members
    WHERE id = p_target_user_id
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mwanachama hakupatikana.';
    END IF;

    -- Founder protection
    IF v_target.member_id = 'SG-000001' OR lower(v_target.username) = 'willyger' THEN
        IF p_status IS NOT NULL AND p_status <> 'ACTIVE' THEN
            RAISE EXCEPTION 'Huwezi kusimamisha au kubadili hadhi ya Mwanzilishi (SG-000001)!';
        END IF;
        IF p_role IS NOT NULL AND p_role <> 'Super Administrator' THEN
            RAISE EXCEPTION 'Huwezi kushusha cheo cha Mwanzilishi (SG-000001)!';
        END IF;
        IF p_member_id IS NOT NULL AND btrim(p_member_id) <> '' AND upper(btrim(p_member_id)) <> 'SG-000001' THEN
            RAISE EXCEPTION 'Member ID ya Mwanzilishi (SG-000001) haiwezi kubadilishwa!';
        END IF;
    END IF;

    v_final_id := v_target.member_id;
    v_final_status := COALESCE(NULLIF(btrim(p_status), ''), v_target.status);
    v_final_role := COALESCE(NULLIF(btrim(p_role), ''), v_target.role);

    IF v_final_status NOT IN ('PENDING', 'ACTIVE', 'ON_HOLD', 'SUSPENDED', 'INACTIVE', 'TERMINATED') THEN
        RAISE EXCEPTION 'Hali batili: %', v_final_status;
    END IF;

    IF v_final_role NOT IN (
        'Applicant', 'Member', 'Instructor', 'Project Lead', 'Community Moderator',
        'Membership Administrator', 'Education Administrator', 'Finance Administrator',
        'Administrator', 'Super Administrator'
    ) THEN
        RAISE EXCEPTION 'Jukumu batili: %', v_final_role;
    END IF;

    -- Only Super Admin can grant/modify Admin roles, override SG-ID, or reset passwords
    IF v_final_role <> v_target.role AND v_final_role IN (
        'Membership Administrator', 'Education Administrator', 'Finance Administrator',
        'Administrator', 'Super Administrator'
    ) AND NOT v_is_super THEN
        RAISE EXCEPTION 'Super Administrator pekee ndiye anayeweza kutoa mamlaka ya Utawala (Admin RBAC).';
    END IF;

    v_custom_id := upper(btrim(COALESCE(p_member_id, '')));
    IF v_custom_id <> '' AND v_custom_id IS DISTINCT FROM v_target.member_id THEN
        IF NOT v_is_super THEN
            RAISE EXCEPTION 'Super Administrator pekee ndiye anayeweza kubadili namba ya SG-ID kwa mkono.';
        END IF;
        IF v_custom_id !~ '^SG-[0-9]{6}$' THEN
            RAISE EXCEPTION 'Muundo wa Member ID lazima uwe SG-XXXXXX (mfano: SG-000002).';
        END IF;
        IF EXISTS (SELECT 1 FROM public.members WHERE member_id = v_custom_id AND id <> v_target.id) THEN
            RAISE EXCEPTION 'Namba ya mwanachama % tayari inatumiwa na mtu mwingine.', v_custom_id;
        END IF;
        v_final_id := v_custom_id;

        INSERT INTO public.audit_logs (action, actor, target, details)
        VALUES (
            'MEMBER_ID_OVERRIDE',
            v_admin.username,
            v_target.username,
            'Member ID changed from ' || COALESCE(v_target.member_id, 'NULL') || ' to ' || v_final_id || '. Reason: ' || v_reason
        );
    END IF;

    -- Auto-assign sequential SG-ID if promoted to ACTIVE without an ID
    IF v_final_status = 'ACTIVE' AND (v_final_id IS NULL OR btrim(v_final_id) = '') THEN
        v_final_id := public.get_next_sg_member_id();
    END IF;

    IF v_final_status = 'ACTIVE' AND v_final_role = 'Applicant' THEN
        v_final_role := 'Member';
    END IF;

    UPDATE public.members
    SET
        member_id = v_final_id,
        status = v_final_status,
        role = v_final_role,
        approved_at = CASE WHEN v_final_status = 'ACTIVE' THEN COALESCE(approved_at, NOW()) ELSE approved_at END,
        approved_by = CASE WHEN v_final_status = 'ACTIVE' THEN COALESCE(approved_by, v_admin.username) ELSE approved_by END
    WHERE id = v_target.id;

    IF v_final_status IS DISTINCT FROM v_target.status THEN
        INSERT INTO public.audit_logs (action, actor, target, details)
        VALUES (
            'STATUS_CHANGE_' || v_final_status,
            v_admin.username,
            v_target.username || ' (' || COALESCE(v_final_id, 'NO-ID') || ')',
            'Status altered from ' || v_target.status || ' to ' || v_final_status || '. Reason: ' || v_reason
        );
    END IF;

    IF v_final_role IS DISTINCT FROM v_target.role THEN
        INSERT INTO public.audit_logs (action, actor, target, details)
        VALUES (
            'ROLE_CHANGE_' || upper(regexp_replace(v_final_role, '\s+', '_', 'g')),
            v_admin.username,
            v_target.username || ' (' || COALESCE(v_final_id, 'NO-ID') || ')',
            'Role updated from ' || v_target.role || ' to ' || v_final_role || '. Reason: ' || v_reason
        );
    END IF;

    IF p_new_password IS NOT NULL AND btrim(p_new_password) <> '' THEN
        IF NOT v_is_super THEN
            RAISE EXCEPTION 'Super Administrator pekee ndiye anayeweza kuweka upya nenosiri la mwanachama.';
        END IF;
        IF length(p_new_password) < 6 THEN
            RAISE EXCEPTION 'Nenosiri jipya lazima liwe na angalau herufi 6.';
        END IF;
        UPDATE public.members
        SET password_hash = public.sg_hash_password(p_new_password)
        WHERE id = v_target.id;

        DELETE FROM public.auth_sessions
        WHERE user_id = v_target.id AND token <> btrim(p_session_token);

        INSERT INTO public.audit_logs (action, actor, target, details)
        VALUES (
            'ADMIN_PASSWORD_RESET',
            v_admin.username,
            v_target.username || ' (' || COALESCE(v_final_id, 'PENDING') || ')',
            'Password reset performed upon member verification. Reason: ' || v_reason
        );
    END IF;

    SELECT * INTO v_target FROM public.members WHERE id = p_target_user_id LIMIT 1;
    RETURN public.sg_sanitize_member(v_target);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_admin_manage_announcement(
    p_session_token TEXT,
    p_op TEXT,
    p_id TEXT DEFAULT NULL,
    p_title TEXT DEFAULT NULL,
    p_content TEXT DEFAULT NULL,
    p_priority TEXT DEFAULT 'NORMAL'
)
RETURNS JSONB AS $$
DECLARE
    v_admin public.members%ROWTYPE;
    v_rec public.announcements%ROWTYPE;
    v_author TEXT;
BEGIN
    v_admin := public.sg_require_admin(p_session_token);
    v_author := v_admin.full_name || ' (' || v_admin.role || ')';

    IF upper(COALESCE(p_op, '')) = 'CREATE' THEN
        IF btrim(COALESCE(p_title, '')) = '' OR btrim(COALESCE(p_content, '')) = '' THEN
            RAISE EXCEPTION 'Tafadhali weka kichwa cha habari na maudhui ya tangazo.';
        END IF;
        INSERT INTO public.announcements (title, content, priority, author)
        VALUES (
            btrim(p_title),
            btrim(p_content),
            CASE WHEN p_priority = 'HIGH' THEN 'HIGH' ELSE 'NORMAL' END,
            v_author
        )
        RETURNING * INTO v_rec;

        INSERT INTO public.audit_logs (action, actor, target, details)
        VALUES ('ANNOUNCEMENT_PUBLISHED', v_author, v_rec.title, 'Official announcement broadcasted to all Sillygerians.');

        RETURN to_jsonb(v_rec);
    ELSIF upper(COALESCE(p_op, '')) = 'DELETE' THEN
        SELECT * INTO v_rec FROM public.announcements WHERE id = p_id LIMIT 1;
        IF FOUND THEN
            DELETE FROM public.announcements WHERE id = p_id;
            INSERT INTO public.audit_logs (action, actor, target, details)
            VALUES ('ANNOUNCEMENT_REMOVED', v_admin.username, v_rec.title, 'Announcement removed from member feed.');
        END IF;
        RETURN jsonb_build_object('deleted', TRUE);
    END IF;

    RAISE EXCEPTION 'Kitendo cha tangazo si sahihi.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_admin_add_fund_tx(
    p_session_token TEXT,
    p_type TEXT,
    p_amount NUMERIC,
    p_category TEXT,
    p_description TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_admin public.members%ROWTYPE;
    v_tx_type TEXT;
    v_rec public.fund_ledger%ROWTYPE;
BEGIN
    v_admin := public.sg_require_admin(p_session_token);

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Kiasi cha muamala lazima kiwe kikubwa kuliko sifuri (0).';
    END IF;
    IF btrim(COALESCE(p_description, '')) = '' THEN
        RAISE EXCEPTION 'Tafadhali jaza maelezo ya muamala.';
    END IF;

    v_tx_type := CASE WHEN upper(COALESCE(p_type, '')) = 'EXPENSE' THEN 'EXPENSE' ELSE 'INCOME' END;

    INSERT INTO public.fund_ledger (type, amount, category, description, actor, tx_date)
    VALUES (
        v_tx_type,
        p_amount,
        COALESCE(NULLIF(btrim(p_category), ''), 'Infrastructure'),
        btrim(p_description),
        v_admin.username,
        CURRENT_DATE
    )
    RETURNING * INTO v_rec;

    INSERT INTO public.audit_logs (action, actor, target, details)
    VALUES (
        'FUND_TRANSACTION_' || v_tx_type,
        v_admin.username,
        'TZS ' || v_rec.amount::text || ' (' || v_rec.category || ')',
        v_rec.description
    );

    RETURN to_jsonb(v_rec);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_admin_verify_attendance(
    p_session_token TEXT,
    p_record_id TEXT DEFAULT NULL,
    p_verify_all BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
    v_admin public.members%ROWTYPE;
    v_verifier TEXT;
    v_count INT := 0;
    v_target_member TEXT := 'All Sessions';
    v_session_title TEXT := '';
BEGIN
    v_admin := public.sg_require_admin(p_session_token);
    v_verifier := v_admin.full_name || ' (' || v_admin.role || ')';

    IF COALESCE(p_verify_all, FALSE) THEN
        UPDATE public.attendance
        SET is_verified = TRUE, verified_by = v_verifier
        WHERE is_verified = FALSE;
        GET DIAGNOSTICS v_count = ROW_COUNT;

        IF v_count > 0 THEN
            INSERT INTO public.audit_logs (action, actor, target, details)
            VALUES ('MASS_ATTENDANCE_VERIFIED', v_verifier, 'All Sessions', 'Mass-verified ' || v_count::text || ' attendance check-ins.');
        END IF;
    ELSE
        UPDATE public.attendance
        SET is_verified = TRUE, verified_by = v_verifier
        WHERE id = p_record_id AND is_verified = FALSE
        RETURNING member_id, session_title INTO v_target_member, v_session_title;
        GET DIAGNOSTICS v_count = ROW_COUNT;

        IF v_count > 0 THEN
            INSERT INTO public.audit_logs (action, actor, target, details)
            VALUES ('ATTENDANCE_VERIFIED', v_verifier, v_target_member, 'Attendance verified for ' || v_session_title || '.');
        END IF;
    END IF;

    RETURN jsonb_build_object('verified_count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_admin_review_leave(
    p_session_token TEXT,
    p_leave_id TEXT,
    p_decision TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_admin public.members%ROWTYPE;
    v_dec TEXT;
    v_rec public.leave_requests%ROWTYPE;
BEGIN
    v_admin := public.sg_require_admin(p_session_token);
    v_dec := upper(btrim(COALESCE(p_decision, '')));

    IF v_dec NOT IN ('APPROVED', 'REJECTED') THEN
        RAISE EXCEPTION 'Uamuzi batili.';
    END IF;

    UPDATE public.leave_requests
    SET status = v_dec, reviewed_by = v_admin.full_name
    WHERE id = p_leave_id
    RETURNING * INTO v_rec;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ombi la ruhusa halikupatikana.';
    END IF;

    INSERT INTO public.audit_logs (action, actor, target, details)
    VALUES (
        'LEAVE_' || v_dec,
        v_admin.full_name,
        v_rec.member_id,
        'Leave request ' || lower(v_dec) || ' for category: ' || v_rec.category || '.'
    );

    RETURN to_jsonb(v_rec);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.sg_admin_reply_ticket(
    p_session_token TEXT,
    p_ticket_id TEXT,
    p_response TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_admin public.members%ROWTYPE;
    v_reply TEXT;
    v_rec public.support_tickets%ROWTYPE;
BEGIN
    v_admin := public.sg_require_admin(p_session_token);
    v_reply := btrim(COALESCE(p_response, ''));

    IF v_reply = '' THEN
        RAISE EXCEPTION 'Tafadhali andika jibu kabla ya kuhifadhi.';
    END IF;

    UPDATE public.support_tickets
    SET status = 'RESOLVED', response = v_reply, responded_by = v_admin.full_name
    WHERE id = p_ticket_id
    RETURNING * INTO v_rec;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tiketi ya msaada haikupatikana.';
    END IF;

    INSERT INTO public.audit_logs (action, actor, target, details)
    VALUES (
        'SUPPORT_TICKET_RESOLVED',
        v_admin.full_name,
        v_rec.member_id,
        'Ticket resolved: ' || v_rec.subject
    );

    RETURN to_jsonb(v_rec);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

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
        IF v_key NOT IN ('whatsapp_invite_url', 'active_session_title') THEN
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
            'PLATFORM_SETTINGS_UPDATED',
            v_admin.username,
            array_to_string(v_keys, ', '),
            'Administrator updated official platform configuration.'
        );
    END IF;

    SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)
    INTO v_settings
    FROM public.platform_settings;

    RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 8. LOCK DOWN FUNCTION EXECUTION PERMISSIONS
-- Revoke unauthenticated direct access to internal helpers & legacy raw approval RPC!
REVOKE ALL ON FUNCTION public.get_next_sg_member_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.approve_member_and_assign_id(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sg_normalize_tz_phone(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sg_hash_password(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sg_verify_password(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sg_sanitize_member(public.members) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sg_is_super_admin_member(public.members) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sg_is_admin_member(public.members) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sg_require_session(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sg_require_admin(TEXT) FROM PUBLIC, anon, authenticated;

-- Grant execute ONLY on the guarded public & session-verified RPCs
GRANT EXECUTE ON FUNCTION public.sg_get_public_overview() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_register_applicant(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_login(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_logout(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_get_my_portal_state(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_change_own_password(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_student_checkin(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_submit_leave_request(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_submit_support_ticket(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_admin_get_full_state(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_admin_approve_member(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_admin_delete_member(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_admin_update_dossier(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_admin_manage_announcement(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_admin_add_fund_tx(TEXT, TEXT, NUMERIC, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_admin_verify_attendance(TEXT, TEXT, BOOLEAN) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_admin_review_leave(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_admin_reply_ticket(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_admin_update_settings(TEXT, JSONB) TO anon, authenticated, service_role;
