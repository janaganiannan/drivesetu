-- ====================================================================
-- DRIVESETU SINGLE TABLE RTO ARCHITECTURE SCHEMA & RLS SECURITY (rto_info)
-- Copy and paste this code into your Supabase SQL Editor and click "RUN"
-- ====================================================================

-- 1. DROP OLD RTO TABLES ONLY (Citizen tables remain untouched)
DROP TABLE IF EXISTS public.rto_registration_requests CASCADE;
DROP TABLE IF EXISTS public.rto_employfiles CASCADE;
DROP TABLE IF EXISTS public.rto_employees CASCADE;
DROP TABLE IF EXISTS public.rto_officers CASCADE;
DROP TABLE IF EXISTS public.rto_offices CASCADE;

-- 2. CREATE ONLY THE NEW SINGLE TABLE: rto_info
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

-- ====================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS) & ACCESS CONTROL
-- ====================================================================

-- Enable RLS on public.rto_info
ALTER TABLE public.rto_info ENABLE ROW LEVEL SECURITY;

-- Revoke ALL permissions from unauthenticated / anonymous users
REVOKE ALL ON TABLE public.rto_info FROM anon;
REVOKE ALL ON TABLE public.rto_info FROM public;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role full access on rto_info" ON public.rto_info;
DROP POLICY IF EXISTS "Authenticated RTO officers can view rto_info" ON public.rto_info;

-- Policy 1: Service Role has full access (Used by backend server supabaseAdmin)
CREATE POLICY "Service role full access on rto_info"
    ON public.rto_info
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy 2: Authenticated RTO Officers can view RTO office information
CREATE POLICY "Authenticated RTO officers can view rto_info"
    ON public.rto_info
    FOR SELECT
    TO authenticated
    USING (
        auth.jwt() ->> 'email' = officer_email
        OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('RTO_OFFICER', 'SUPER_ADMIN', 'ADMIN')
    );

-- 4. Delete demo/test row containing "officer01"
DELETE FROM public.rto_info WHERE officer_id = 'officer01' OR officer_email LIKE '%officer01%';

-- 5. Citizen Tables (Untouched & Retained Separately)
CREATE TABLE IF NOT EXISTS public.citizen_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(50),
    address TEXT,
    aadhaar_number VARCHAR(50),
    role VARCHAR(50) DEFAULT 'CITIZEN',
    account_type VARCHAR(50) DEFAULT 'Citizen',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.applications (
    id VARCHAR(100) PRIMARY KEY,
    citizen_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(100) DEFAULT 'Submitted',
    rto_code VARCHAR(20),
    service_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id VARCHAR(100) REFERENCES public.applications(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    integrity_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id VARCHAR(100),
    event_type VARCHAR(100) NOT NULL,
    actor_id UUID,
    actor_name VARCHAR(255),
    role VARCHAR(50),
    details TEXT,
    integrity_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant permissions for service_role & postgres
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
