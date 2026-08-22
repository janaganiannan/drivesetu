-- ====================================================================
-- DRIVESETU SINGLE TABLE RTO ARCHITECTURE SCHEMA (rto_info)
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

-- 3. Citizen Profiles Table (Untouched & Retained Separately)
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

-- 4. Applications Table (Untouched & Retained Separately)
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

-- 5. Application Documents Table (Untouched & Retained Separately)
CREATE TABLE IF NOT EXISTS public.application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id VARCHAR(100) REFERENCES public.applications(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    integrity_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Audit Logs Table (Untouched & Retained Separately)
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

-- Grant Table Permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, anon;
