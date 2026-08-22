-- ====================================================================
-- DRIVESETU FULL RELATIONAL SCHEMA & RTO EMPLOYEE FILES TABLE
-- Copy and paste this entire code into your Supabase SQL Editor and click "RUN"
-- ====================================================================

-- 1. Create rto_employfiles Table
CREATE TABLE IF NOT EXISTS public.rto_employfiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(100) DEFAULT 'RTO_EMPLOYEE',
    rto_code VARCHAR(20),
    rto_name VARCHAR(255),
    officer_id VARCHAR(50),
    employee_id VARCHAR(50),
    designation VARCHAR(100),
    mobile VARCHAR(50),
    office_address TEXT,
    account_type VARCHAR(100) DEFAULT 'RTO Profile',
    details_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create rto_offices Table
CREATE TABLE IF NOT EXISTS public.rto_offices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rto_code VARCHAR(20) UNIQUE NOT NULL,
    office_name VARCHAR(255) NOT NULL,
    rto_type VARCHAR(100) DEFAULT 'Regional Transport Office',
    state VARCHAR(100) DEFAULT 'Telangana',
    district VARCHAR(100) NOT NULL,
    office_address TEXT NOT NULL,
    pin_code VARCHAR(20),
    office_phone VARCHAR(50),
    office_email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create rto_officers Table
CREATE TABLE IF NOT EXISTS public.rto_officers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    rto_office_id UUID REFERENCES public.rto_offices(id) ON DELETE SET NULL,
    officer_id VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    designation VARCHAR(100) DEFAULT 'RTO Officer / Evaluator',
    official_email VARCHAR(255) UNIQUE NOT NULL,
    official_mobile VARCHAR(50),
    rto_code VARCHAR(20),
    rto_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'RTO_OFFICER',
    account_type VARCHAR(50) DEFAULT 'RTO Officer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create rto_employees Table
CREATE TABLE IF NOT EXISTS public.rto_employees (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    rto_office_id UUID REFERENCES public.rto_offices(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    designation VARCHAR(100) DEFAULT 'RTO Employee',
    official_email VARCHAR(255) UNIQUE NOT NULL,
    official_mobile VARCHAR(50),
    role VARCHAR(50) DEFAULT 'RTO_EMPLOYEE',
    account_status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create citizen_profiles Table
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

-- 6. Create applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id VARCHAR(100) PRIMARY KEY,
    citizen_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(100) DEFAULT 'Submitted',
    rto_office_id UUID REFERENCES public.rto_offices(id) ON DELETE SET NULL,
    service_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create application_documents Table
CREATE TABLE IF NOT EXISTS public.application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id VARCHAR(100) REFERENCES public.applications(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    integrity_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create audit_logs Table
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

-- 9. Create rto_registration_requests Table (Pending Approval Queue)
CREATE TABLE IF NOT EXISTS public.rto_registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password TEXT,
    role VARCHAR(100) DEFAULT 'REVIEWING_OFFICER',
    rto_code VARCHAR(20) DEFAULT 'TG-03',
    rto_name VARCHAR(255),
    officer_id VARCHAR(50),
    designation VARCHAR(100),
    mobile VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    details_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Seed Sample RTO Offices
INSERT INTO public.rto_offices (rto_code, office_name, district, office_address, pin_code, office_phone, office_email)
VALUES 
    ('TG-03', 'RTA Medchal / Hyderabad West', 'Medchal-Malkajgiri', 'Kukatpally, Medchal-Malkajgiri, Hyderabad', '500072', '040-23000003', 'rto.tg03@drivesetu.com'),
    ('TG-05', 'RTA Secunderabad / Hyderabad North', 'Hyderabad', 'Trimulgherry, Secunderabad', '500015', '040-23000005', 'rto.tg05@drivesetu.com'),
    ('TG-08', 'RTA Uppal / Rangareddy', 'Rangareddy', 'Uppal, Hyderabad', '500039', '040-23000008', 'rto.tg08@drivesetu.com'),
    ('TG-12', 'RTA Sangareddy', 'Sangareddy', 'Main Road, Sangareddy', '502001', '08455-230012', 'rto.tg12@drivesetu.com')
ON CONFLICT (rto_code) DO NOTHING;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated, anon;
