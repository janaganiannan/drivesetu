-- ====================================================================
-- DRIVESETU ROLE ASSIGNMENT & SEPARATION SCRIPT
-- Copy and paste this code into your Supabase SQL Editor and click "RUN"
-- ====================================================================

-- 1. Update Admin Role in profiles
UPDATE public.profiles 
SET role = 'SUPER_ADMIN', account_type = 'Portal Admin' 
WHERE LOWER(email) = 'admin@drivesetu.com';

-- 2. Update RTO Officer / Evaluator Roles in profiles (employ1)
UPDATE public.profiles 
SET role = 'REVIEWING_OFFICER', account_type = 'RTO Reviewing Officer' 
WHERE LOWER(email) IN ('employ1@drivesetu.com', 'annanjanagani003@gmail.com')
   OR email LIKE '%drivesetu.com%';

-- 3. Update Citizen Roles in profiles (citizen1)
UPDATE public.profiles 
SET role = 'CITIZEN', account_type = 'Citizen' 
WHERE LOWER(email) NOT LIKE '%drivesetu.com%'
  AND LOWER(email) != 'admin@drivesetu.com';

-- Grant Permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated, anon;
