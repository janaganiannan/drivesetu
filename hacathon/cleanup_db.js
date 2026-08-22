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

async function cleanupDatabase() {
    console.log('====================================================');
    console.log('   DRIVESETU SUPABASE USER CLEANUP & FRESH RESET    ');
    console.log('====================================================\n');

    // 1. Fetch all users from Supabase Auth
    console.log('--- 1. Fetching current Supabase Auth Users ---');
    const { data: usersData, error: listErr } = await supabase.auth.admin.listUsers();
    
    if (listErr) {
        console.error('Failed to list Auth users:', listErr.message);
        process.exit(1);
    }

    const allUsers = usersData.users || [];
    console.log(`Found total ${allUsers.length} user(s) in Auth.\n`);

    let adminUserId = null;
    let deletedCount = 0;

    // 2. Delete non-admin users from Supabase Auth
    console.log('--- 2. Purging non-admin users from Supabase Auth ---');
    for (const user of allUsers) {
        const email = (user.email || '').toLowerCase();
        if (email === ADMIN_EMAIL.toLowerCase()) {
            adminUserId = user.id;
            console.log(`[KEEP] Admin user found: ${user.email} (ID: ${user.id})`);
            // Ensure admin password is updated/set
            await supabase.auth.admin.updateUserById(adminUserId, { password: ADMIN_PASSWORD, email_confirm: true });
        } else {
            console.log(`[DELETE] Removing user: ${user.email} (ID: ${user.id})...`);
            const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
            if (delErr) {
                console.error(`  -> Failed to delete ${user.email}:`, delErr.message);
            } else {
                deletedCount++;
                console.log(`  -> Successfully deleted ${user.email}`);
            }
        }
    }

    // If admin@drivesetu.com does not exist yet, create it!
    if (!adminUserId) {
        console.log(`\nCreating main admin account (${ADMIN_EMAIL})...`);
        const { data: newAdmin, error: createAdminErr } = await supabase.auth.admin.createUser({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: 'System Admin' }
        });
        if (createAdminErr) {
            console.error('Failed to create admin user:', createAdminErr.message);
        } else {
            adminUserId = newAdmin.user.id;
            console.log(`Admin account created! (ID: ${adminUserId})`);
        }
    }

    console.log(`\nSummary: Removed ${deletedCount} non-admin user(s) from Supabase Auth.\n`);

    // 3. Clean up Database Tables (delete non-admin rows)
    console.log('--- 3. Cleaning up Database Table Rows ---');

    // Clean 'profiles' table
    try {
        console.log('Cleaning table "profiles"...');
        const { error: profDelErr } = await supabase
            .from('profiles')
            .delete()
            .neq('email', ADMIN_EMAIL);
        
        if (profDelErr) console.log('  -> profiles cleanup note:', profDelErr.message);
        
        // Ensure Admin row exists in profiles
        if (adminUserId) {
            await supabase.from('profiles').upsert({
                id: adminUserId,
                email: ADMIN_EMAIL,
                role: 'admin',
                full_name: 'SYSTEM ADMIN',
                account_type: 'Admin',
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
            console.log(`  -> Verified admin profile row in "profiles" table.`);
        }
    } catch (err) {
        console.log('profiles table cleanup info:', err.message);
    }

    // Clean 'citizens' table
    try {
        console.log('Cleaning table "citizens"...');
        const { error: citDelErr } = await supabase
            .from('citizens')
            .delete()
            .neq('email', ADMIN_EMAIL);

        if (citDelErr) console.log('  -> citizens cleanup note:', citDelErr.message);
        else console.log('  -> Cleared non-admin records from "citizens" table.');
    } catch (err) {
        console.log('citizens table cleanup info:', err.message);
    }

    // Clean 'rto_officers' table
    try {
        console.log('Cleaning table "rto_officers"...');
        const { error: rtoDelErr } = await supabase
            .from('rto_officers')
            .delete()
            .neq('email', ADMIN_EMAIL);

        if (rtoDelErr) console.log('  -> rto_officers cleanup note:', rtoDelErr.message);
        else console.log('  -> Cleared non-admin records from "rto_officers" table.');
    } catch (err) {
        console.log('rto_officers table cleanup info:', err.message);
    }

    // Clean 'operators' table (if exists)
    try {
        await supabase.from('operators').delete().neq('email', ADMIN_EMAIL);
    } catch (err) {}

    // Clean 'applications' table (if exists)
    try {
        await supabase.from('applications').delete().neq('applicant_email', ADMIN_EMAIL);
    } catch (err) {}

    // 4. Verify remaining users, profiles, and rto_officers
    console.log('\n--- 4. Verification ---');
    const { data: finalAuthUsers } = await supabase.auth.admin.listUsers();
    console.log('Remaining Auth Users:');
    console.table((finalAuthUsers.users || []).map(u => ({ id: u.id, email: u.email, role: u.role })));

    const { data: finalProfiles } = await supabase.from('profiles').select('id, email, role, full_name');
    console.log('\nRemaining Profiles in Database:');
    console.table(finalProfiles || []);

    const { data: finalRtoOfficers } = await supabase.from('rto_officers').select('id, email, role, full_name');
    console.log('\nRemaining RTO Officers in Database:');
    console.table(finalRtoOfficers || []);

    console.log('\n====================================================');
    console.log('   CLEANUP COMPLETE: Fresh state ready!             ');
    console.log('====================================================');
}

cleanupDatabase();
