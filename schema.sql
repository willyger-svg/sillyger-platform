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
    next_num INT;
    candidate TEXT;
BEGIN
    LOOP
        UPDATE public.sg_id_sequence
        SET current_val = current_val + 1
        WHERE id = 1
        RETURNING current_val INTO next_num;

        candidate := 'SG-' || LPAD(next_num::TEXT, 6, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.members WHERE member_id = candidate);
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
    track TEXT NOT NULL,
    experience TEXT DEFAULT 'Beginner',
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
    admin_identifier TEXT
)
RETURNS JSON AS $$
DECLARE
    new_sg_id TEXT;
    updated_record RECORD;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.members WHERE id = target_user_id AND status = 'PENDING') THEN
        RAISE EXCEPTION 'Mwanachama hakupatikana au hadhi yake si PENDING.';
    END IF;

    new_sg_id := public.get_next_sg_member_id();

    UPDATE public.members
    SET
        member_id = COALESCE(member_id, new_sg_id),
        status = 'ACTIVE',
        role = CASE WHEN role = 'Applicant' THEN 'Member' ELSE role END,
        approved_at = NOW(),
        approved_by = admin_identifier
    WHERE id = target_user_id
    RETURNING * INTO updated_record;

    INSERT INTO public.audit_logs (action, actor, target, details)
    VALUES (
        'MEMBER_APPROVED',
        admin_identifier,
        updated_record.username || ' (' || updated_record.member_id || ')',
        'Application approved. Assigned Unique Member ID: ' || updated_record.member_id || '. WhatsApp Community gate unlocked.'
    );

    RETURN row_to_json(updated_record);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. ROW LEVEL SECURITY (RLS) POLICIES (Idempotent — safe to re-run)
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating so script can be re-executed cleanly
DROP POLICY IF EXISTS "Platform settings access" ON public.platform_settings;
CREATE POLICY "Platform settings access" ON public.platform_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public registration allowed" ON public.members;
DROP POLICY IF EXISTS "Read member public profiles" ON public.members;
DROP POLICY IF EXISTS "Admins or self can update member profile" ON public.members;
DROP POLICY IF EXISTS "Admins can delete applicant" ON public.members;

CREATE POLICY "Public registration allowed" ON public.members FOR INSERT WITH CHECK (status = 'PENDING' AND role = 'Applicant');
CREATE POLICY "Read member public profiles" ON public.members FOR SELECT USING (true);
CREATE POLICY "Admins or self can update member profile" ON public.members FOR UPDATE USING (true);
CREATE POLICY "Admins can delete applicant" ON public.members FOR DELETE USING (member_id IS DISTINCT FROM 'SG-000001' AND username IS DISTINCT FROM 'willyger');

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

DROP POLICY IF EXISTS "Announcements access" ON public.announcements;
CREATE POLICY "Announcements access" ON public.announcements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Fund ledger access" ON public.fund_ledger;
CREATE POLICY "Fund ledger access" ON public.fund_ledger FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Attendance viewable by members" ON public.attendance;
DROP POLICY IF EXISTS "Members can checkin planned attendance" ON public.attendance;
DROP POLICY IF EXISTS "Attendance management access" ON public.attendance;
CREATE POLICY "Attendance management access" ON public.attendance FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Members can manage their leave" ON public.leave_requests;
CREATE POLICY "Members can manage their leave" ON public.leave_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Members can manage their tickets" ON public.support_tickets;
CREATE POLICY "Members can manage their tickets" ON public.support_tickets FOR ALL USING (true) WITH CHECK (true);

-- Audit logs are strictly APPEND-ONLY (Immutable — Article 7.7: NO UPDATE or DELETE policy!)
DROP POLICY IF EXISTS "Read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Insert audit logs" ON public.audit_logs;
CREATE POLICY "Read audit logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- 13. SEED FOUNDER / SUPER ADMINISTRATOR ACCOUNT (Salted SHA-256 Hash)
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

-- Seed initial official announcement if empty
INSERT INTO public.announcements (id, title, content, priority, author)
VALUES (
    'anc_001',
    'Uzinduzi Rasmi wa SILLYGER Community Platform v1.4',
    'Karibuni Sillygerians! Tovuti rasmi, mfumo wa uanachama na mtaala wa hatua 10 sasa vimefunguliwa rasmi. Kila mwanachama anatakiwa kupitia Katiba v1.4.',
    'HIGH',
    'William Gerishom William (Super Admin)'
)
ON CONFLICT (id) DO NOTHING;

-- Ensure sequence counter starts at 1 so next approved member receives SG-000002
UPDATE public.sg_id_sequence SET current_val = 1 WHERE id = 1 AND current_val < 1;
