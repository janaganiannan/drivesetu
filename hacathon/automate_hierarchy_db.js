require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://iawqdbsejkmxtilmgztc.supabase.co';
const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SECRET_KEY) {
    console.error("Error: Missing SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const ADMIN_EMAIL = 'admin@drivesetu.com';
const ADMIN_PASSWORD = 'admin123';

async function setupHierarchyTables() {
    console.log('====================================================');
    console.log('   DRIVESETU RELATIONAL DATABASE SCHEMA INITIALIZER ');
    console.log('====================================================\n');

    // 1. Ensure Super Admin user exists in Auth
    console.log('--- 1. Verifying Super Admin Account ---');
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const existingAdmin = (usersData?.users || []).find(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());

    let adminUserId = null;
    if (existingAdmin) {
        adminUserId = existingAdmin.id;
        console.log(`Super Admin user exists: ${ADMIN_EMAIL} (ID: ${adminUserId})`);
        await supabase.auth.admin.updateUserById(adminUserId, { password: ADMIN_PASSWORD, email_confirm: true });
    } else {
        const { data: newAdmin, error: adminCreateErr } = await supabase.auth.admin.createUser({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: 'SYSTEM SUPER ADMIN', role: 'SUPER_ADMIN' }
        });
        if (adminCreateErr) {
            console.error('Failed to create Super Admin:', adminCreateErr.message);
        } else {
            adminUserId = newAdmin.user.id;
            console.log(`Super Admin account created: ${ADMIN_EMAIL} (ID: ${adminUserId})`);
        }
    }

    // Upsert into profiles table
    if (adminUserId) {
        await supabase.from('profiles').upsert({
            id: adminUserId,
            email: ADMIN_EMAIL,
            role: 'SUPER_ADMIN',
            account_type: 'Super Admin',
            full_name: 'SYSTEM SUPER ADMIN',
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    }

    // 2. Verify or seed sample RTO offices structure in rto_offices
    console.log('\n--- 2. Initializing RTO Offices Table (rto_offices) ---');
    const defaultRtoOffices = [
        {
            rto_code: 'TG-03',
            office_name: 'RTA Medchal / Hyderabad West',
            rto_type: 'Regional Transport Office',
            state: 'Telangana',
            district: 'Medchal-Malkajgiri',
            office_address: 'Kukatpally, Medchal-Malkajgiri, Hyderabad',
            pin_code: '500072',
            office_phone: '040-23000003',
            office_email: 'rto.tg03@drivesetu.com',
            is_active: true
        },
        {
            rto_code: 'TG-05',
            office_name: 'RTA Secunderabad / Hyderabad North',
            rto_type: 'Regional Transport Office',
            state: 'Telangana',
            district: 'Hyderabad',
            office_address: 'Trimulgherry, Secunderabad',
            pin_code: '500015',
            office_phone: '040-23000005',
            office_email: 'rto.tg05@drivesetu.com',
            is_active: true
        },
        {
            rto_code: 'TG-08',
            office_name: 'RTA Uppal / Rangareddy',
            rto_type: 'Regional Transport Office',
            state: 'Telangana',
            district: 'Rangareddy',
            office_address: 'Uppal, Hyderabad',
            pin_code: '500039',
            office_phone: '040-23000008',
            office_email: 'rto.tg08@drivesetu.com',
            is_active: true
        },
        {
            rto_code: 'TG-12',
            office_name: 'RTA Sangareddy',
            rto_type: 'Regional Transport Office',
            state: 'Telangana',
            district: 'Sangareddy',
            office_address: 'Main Road, Sangareddy',
            pin_code: '502001',
            office_phone: '08455-230012',
            office_email: 'rto.tg12@drivesetu.com',
            is_active: true
        }
    ];

    for (const rto of defaultRtoOffices) {
        try {
            const { error: rtoErr } = await supabase
                .from('rto_offices')
                .upsert(rto, { onConflict: 'rto_code' });
            if (rtoErr) {
                console.log(`  Note for ${rto.rto_code}:`, rtoErr.message);
            } else {
                console.log(`  ✓ RTO Office initialized: ${rto.rto_code} (${rto.office_name})`);
            }
        } catch (e) {
            console.log(`  Info for ${rto.rto_code}:`, e.message);
        }
    }

    // 3. Inspect existing tables
    console.log('\n--- 3. Verifying Relational Tables Status ---');
    const tableList = ['rto_offices', 'rto_officers', 'rto_employees', 'rto_employfiles', 'citizen_profiles', 'applications', 'application_documents', 'audit_logs'];
    for (const tbl of tableList) {
        try {
            const { data, error } = await supabase.from(tbl).select('*').limit(1);
            if (error) {
                console.log(`  Table "${tbl}": Notice - ${error.message}`);
            } else {
                console.log(`  Table "${tbl}": Ready! (${data ? data.length : 0} existing row sample)`);
            }
        } catch (e) {
            console.log(`  Table "${tbl}": Info - ${e.message}`);
        }
    }

    console.log('\n====================================================');
    console.log('   SCHEMA INITIALIZATION & VERIFICATION COMPLETE    ');
    console.log('====================================================');
}

setupHierarchyTables();
