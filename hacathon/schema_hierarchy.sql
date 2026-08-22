-- ====================================================================
-- DRIVESETU COMPLETE DATABASE ARCHITECTURE
-- Copy and paste this code into your Supabase SQL Editor and click "RUN"
-- ====================================================================

-- 1. DROP OBSOLETE TEMPORARY TABLES ONLY
DROP TABLE IF EXISTS public.application_documents CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.citizen_profiles CASCADE;
DROP TABLE IF EXISTS public.citizens CASCADE;
DROP TABLE IF EXISTS public.user_files CASCADE;
DROP TABLE IF EXISTS public.rto_registration_requests CASCADE;
DROP TABLE IF EXISTS public.rto_employfiles CASCADE;
DROP TABLE IF EXISTS public.rto_employees CASCADE;
DROP TABLE IF EXISTS public.rto_officers CASCADE;
DROP TABLE IF EXISTS public.rto_offices CASCADE;

-- ====================================================================
-- 2. RTO INFORMATION TABLE (rto_info)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.rto_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- RTO Office Details
    rto_office_name VARCHAR(255) NOT NULL,
    rto_code VARCHAR(50) UNIQUE NOT NULL,
    rto_type VARCHAR(100) DEFAULT 'Regional Transport Office',
    state VARCHAR(100) DEFAULT 'Telangana',
    district VARCHAR(100) NOT NULL,
    office_address TEXT NOT NULL,
    pin_code VARCHAR(20),
    office_phone VARCHAR(50),
    office_email VARCHAR(255),

    -- RTO Officer Details
    officer_full_name VARCHAR(255) NOT NULL,
    officer_id VARCHAR(50) UNIQUE NOT NULL,
    officer_designation VARCHAR(100) DEFAULT 'RTO Officer / Evaluator',
    officer_mobile VARCHAR(50),
    officer_email VARCHAR(255) UNIQUE NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on rto_info
ALTER TABLE public.rto_info ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rto_info FROM anon;
REVOKE ALL ON TABLE public.rto_info FROM public;

DROP POLICY IF EXISTS "Service role full access on rto_info" ON public.rto_info;
DROP POLICY IF EXISTS "Authenticated RTO officers can view rto_info" ON public.rto_info;

CREATE POLICY "Service role full access on rto_info"
    ON public.rto_info FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated RTO officers can view rto_info"
    ON public.rto_info FOR SELECT TO authenticated
    USING (
        auth.jwt() ->> 'email' = officer_email
        OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('RTO_OFFICER', 'SUPER_ADMIN', 'ADMIN')
    );

-- Restore Default RTO Officers in rto_info
INSERT INTO public.rto_info (
    rto_office_name, rto_code, rto_type, state, district, office_address, pin_code, office_phone, office_email,
    officer_full_name, officer_id, officer_designation, officer_mobile, officer_email
) VALUES 
(
    'RTA Telangana (Medchal)', 'TG-03', 'Regional Transport Office', 'Telangana', 'Medchal-Malkajgiri',
    'RTO Office Premises, Medchal', '500043', '040-23456789', 'annanjanagani003@gmail.com',
    'Annan Janagani', 'OFF-TG03-01', 'RTO Reviewing Officer', '8125531017', 'annanjanagani003@gmail.com'
),
(
    'RTA Secunderabad', 'TG-05', 'Regional Transport Office', 'Telangana', 'Hyderabad',
    'RTO Office Premises, Secunderabad', '500003', '040-23456780', 'employ1@drivesetu.com',
    'Employ 1', 'EMP-001', 'RTO Evaluator', '9876543210', 'employ1@drivesetu.com'
) 
ON CONFLICT (rto_code) DO UPDATE SET 
    officer_email = EXCLUDED.officer_email,
    officer_full_name = EXCLUDED.officer_full_name;

-- ====================================================================
-- 3. CITIZEN PROFILE INFORMATION TABLE (citizen_info)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.citizen_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(50),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on citizen_info
ALTER TABLE public.citizen_info ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.citizen_info FROM anon;
REVOKE ALL ON TABLE public.citizen_info FROM public;

DROP POLICY IF EXISTS "Service role full access on citizen_info" ON public.citizen_info;
DROP POLICY IF EXISTS "Citizens can view own profile" ON public.citizen_info;
DROP POLICY IF EXISTS "Citizens can update own profile" ON public.citizen_info;
DROP POLICY IF EXISTS "Citizens can insert own profile" ON public.citizen_info;

CREATE POLICY "Service role full access on citizen_info"
    ON public.citizen_info FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Citizens can view own profile"
    ON public.citizen_info FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Citizens can update own profile"
    ON public.citizen_info FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Citizens can insert own profile"
    ON public.citizen_info FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ====================================================================
-- 4. CITIZEN UPLOADED DOCUMENTS TABLE (citizen_documents)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.citizen_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Supabase Storage File Paths (Format: citizen-documents/{user_id}/filename)
    proof_identity_doc_path TEXT,
    proof_address_doc_path TEXT,
    medical_certificate_doc_path TEXT,
    test_video_path TEXT,
    ai_report_path TEXT,
    
    -- Driving Test Result
    test_result VARCHAR(50) DEFAULT 'Pending Review',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on citizen_documents
ALTER TABLE public.citizen_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.citizen_documents FROM anon;
REVOKE ALL ON TABLE public.citizen_documents FROM public;

DROP POLICY IF EXISTS "Service role full access on citizen_documents" ON public.citizen_documents;
DROP POLICY IF EXISTS "Citizens can view own documents" ON public.citizen_documents;
DROP POLICY IF EXISTS "Citizens can update own documents" ON public.citizen_documents;
DROP POLICY IF EXISTS "Citizens can insert own documents" ON public.citizen_documents;

CREATE POLICY "Service role full access on citizen_documents"
    ON public.citizen_documents FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Citizens can view own documents"
    ON public.citizen_documents FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Citizens can update own documents"
    ON public.citizen_documents FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Citizens can insert own documents"
    ON public.citizen_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ====================================================================
-- 5. AUTH PROFILES TABLE (Links auth.users to roles)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    account_type VARCHAR(50) DEFAULT 'User',
    full_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Private Supabase Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('citizen-documents', 'citizen-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Grant Table Permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.citizen_info TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.citizen_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated, anon;
