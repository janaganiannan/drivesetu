-- ====================================================================
-- DRIVESETU PRODUCTION SCHEMA: rto_info + citizen_documents + profiles
-- Copy and paste this code into your Supabase SQL Editor and click "RUN"
-- ====================================================================

-- 1. DROP ALL UNUSED OBSOLETE TABLES & OLD CITIZEN TABLES
DROP TABLE IF EXISTS public.citizen_info CASCADE;
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

-- 2. RTO INFORMATION TABLE (rto_info)
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

-- ====================================================================
-- 3. SINGLE CITIZEN DOCUMENTS & DATA TABLE (citizen_documents)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.citizen_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Citizen Personal Information
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    mobile VARCHAR(50),
    address TEXT,
    aadhaar_number VARCHAR(50),
    
    -- Application Details
    application_id VARCHAR(100),
    application_type VARCHAR(100) DEFAULT 'Learner''s Licence',
    application_status VARCHAR(100) DEFAULT 'Submitted',
    rto_code VARCHAR(50) DEFAULT 'TG-03',
    
    -- Supabase Storage File Paths (citizen-documents/{user_id}/filename)
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

-- Policy 1: Service Role Full Access (Backend Server)
CREATE POLICY "Service role full access on citizen_documents"
    ON public.citizen_documents FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Policy 2: Citizens can view ONLY their own documents/profile
CREATE POLICY "Citizens can view own documents"
    ON public.citizen_documents FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Policy 3: Citizens can update ONLY their own documents/profile
CREATE POLICY "Citizens can update own documents"
    ON public.citizen_documents FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy 4: Citizens can insert ONLY their own documents/profile
CREATE POLICY "Citizens can insert own documents"
    ON public.citizen_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ====================================================================
-- 4. CREATE SUPABASE STORAGE BUCKET: citizen-documents
-- ====================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('citizen-documents', 'citizen-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 5. AUTH PROFILES TABLE (Links auth.users to roles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    account_type VARCHAR(50) DEFAULT 'User',
    full_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clean demo rows from rto_info and profiles except admin and employ 1
DELETE FROM public.rto_info 
WHERE LOWER(officer_email) NOT IN ('admin@drivesetu.com', 'employ1@drivesetu.com')
  AND LOWER(officer_full_name) NOT IN ('admin', 'employ 1');

DELETE FROM public.profiles 
WHERE LOWER(email) NOT IN ('admin@drivesetu.com', 'employ1@drivesetu.com');

-- Grant Permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.citizen_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated, anon;
