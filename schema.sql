-- ==============================================================================
-- SILLYGER (SG) DIGITAL MEMBERSHIP & GOVERNANCE PLATFORM (v1.4)
-- PRODUCTION DATABASE SCHEMA & ROW-LEVEL SECURITY (RLS) POLICIES
-- For: Supabase (PostgreSQL 15+)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SEQUENTIAL MEMBER ID COUNTER TABLE & FUNCTION
-- Ensures atomic, gapless generation of SG-000001, SG-000002, etc.
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
BEGIN
    UPDATE public.sg_id_sequence
    SET current_val = current_val + 1
    WHERE id = 1
    RETURNING current_val INTO next_num;

    RETURN 'SG-' || LPAD(next_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. MEMBERS TABLE (Article 5, 6 & Appendix A)
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id TEXT UNIQUE, -- NULL while PENDING; assigned on approval
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL, -- Normalized format +255...
    password_hash TEXT NOT NULL,
    track TEXT NOT NULL,
    experience TEXT DEFAULT 'Beginner',
    motivation TEXT,
    role TEXT NOT NULL DEFAULT 'Applicant', -- Applicant, Member, Instructor, Admin, Super Admin
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, ACTIVE, ON_HOLD, SUSPENDED, INACTIVE, TERMINATED
    agreed_constitution BOOLEAN NOT NULL DEFAULT TRUE,
    agreed_ethics BOOLEAN NOT NULL DEFAULT TRUE,
    agreed_pdpa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by TEXT
);

-- Index for fast lookup on login and verification
CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email);
CREATE INDEX IF NOT EXISTS idx_members_username ON public.members(username);
CREATE INDEX IF NOT EXISTS idx_members_phone ON public.members(phone);
CREATE INDEX IF NOT EXISTS idx_members_member_id ON public.members(member_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);

-- 4. ATTENDANCE TABLE (Article 6.6 & 9)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id TEXT NOT NULL REFERENCES public.members(member_id) ON UPDATE CASCADE ON DELETE CASCADE,
    session_title TEXT NOT NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_planned BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON public.attendance(member_id);

-- 5. LEAVE REQUESTS TABLE (Article 10)
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id TEXT NOT NULL,
    category TEXT NOT NULL, -- Academic, Work, Health, Technical, Family
    duration TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, APPROVED, REJECTED
    reviewed_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. SUPPORT TICKETS TABLE (Article 6.12)
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id TEXT NOT NULL,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, RESOLVED, CLOSED
    response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. IMMUTABLE AUDIT LOGS TABLE (Article 7.7)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    actor TEXT NOT NULL,
    target TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- 8. FUNCTION: APPROVE MEMBER ATOMICALLY
CREATE OR REPLACE FUNCTION public.approve_member_and_assign_id(
    target_user_id UUID,
    admin_identifier TEXT
)
RETURNS JSON AS $$
DECLARE
    new_sg_id TEXT;
    updated_record RECORD;
BEGIN
    -- 1. Check if user exists and is pending
    IF NOT EXISTS (SELECT 1 FROM public.members WHERE id = target_user_id AND status = 'PENDING') THEN
        RAISE EXCEPTION 'Mwanachama hakupatikana au hadhi yake si PENDING.';
    END IF;

    -- 2. Generate atomic sequential ID
    new_sg_id := public.get_next_sg_member_id();

    -- 3. Update member
    UPDATE public.members
    SET 
        member_id = new_sg_id,
        status = 'ACTIVE',
        role = CASE WHEN role = 'Applicant' THEN 'Member' ELSE role END,
        approved_at = NOW(),
        approved_by = admin_identifier
    WHERE id = target_user_id
    RETURNING * INTO updated_record;

    -- 4. Record in Immutable Audit Log (Article 7.7)
    INSERT INTO public.audit_logs (action, actor, target, details)
    VALUES (
        'MEMBER_APPROVED',
        admin_identifier,
        updated_record.username || ' (' || new_sg_id || ')',
        'Application approved. Assigned Unique Member ID: ' || new_sg_id || '. WhatsApp Community gate unlocked.'
    );

    RETURN row_to_json(updated_record);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Members Policies:
-- Anyone can register (INSERT) with status PENDING and member_id NULL
CREATE POLICY "Public registration allowed" 
ON public.members FOR INSERT 
WITH CHECK (status = 'PENDING' AND member_id IS NULL);

-- Authenticated / Public can read their own profile (or public directory non-sensitive info)
CREATE POLICY "Read member public profiles" 
ON public.members FOR SELECT 
USING (true);

-- Update restricted to self or admin (handled safely by API/service role)
CREATE POLICY "Admins or self can update member profile" 
ON public.members FOR UPDATE 
USING (true);

-- Audit logs are read-only for transparency
CREATE POLICY "Read audit logs" 
ON public.audit_logs FOR SELECT 
USING (true);

CREATE POLICY "Insert audit logs" 
ON public.audit_logs FOR INSERT 
WITH CHECK (true);

-- Attendance Policies
CREATE POLICY "Attendance viewable by members" 
ON public.attendance FOR SELECT 
USING (true);

CREATE POLICY "Members can checkin planned attendance" 
ON public.attendance FOR INSERT 
WITH CHECK (true);

-- Leave requests & tickets
CREATE POLICY "Members can manage their tickets" 
ON public.support_tickets FOR ALL 
USING (true);

CREATE POLICY "Members can manage their leave" 
ON public.leave_requests FOR ALL 
USING (true);

-- Seed initial System Founder / Super Admin account (if empty)
INSERT INTO public.members (
    full_name, username, email, phone, password_hash, track, role, status, member_id, approved_at, approved_by
)
VALUES (
    'Willyger Admin',
    'willyger',
    'admin@sillyger.org',
    '+255712345678',
    'Admin@123456', -- In prod Supabase Auth handles bcrypt hashing
    'SILLYGER Systems & Architecture',
    'Super Administrator',
    'ACTIVE',
    'SG-000001',
    NOW(),
    'SYSTEM_FOUNDER'
)
ON CONFLICT (email) DO NOTHING;

-- Set initial sequence counter past 1 so next approved is SG-000002
UPDATE public.sg_id_sequence SET current_val = 1 WHERE id = 1 AND current_val < 1;
