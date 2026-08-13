require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://iawqdbsejkmxtilmgztc.supabase.co';
const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SECRET_KEY) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const ADMIN_EMAILS = [
    'annan@drivesetu.com',
    'srivathsav@drivesetu.com',
    'rahil@drivesetu.com'
];

async function automateDatabase() {
    console.log('--- 1. Fetching existing Auth Users ---');
    const { data: usersData, error: uErr } = await supabase.auth.admin.listUsers();
    if (uErr) {
        console.error('Error fetching users:', uErr);
        return;
    }
    
    const existingEmails = new Set(usersData.users.map(u => u.email.toLowerCase()));
    console.log('Existing users count:', usersData.users.length);
    console.log('Existing emails:', Array.from(existingEmails));

    console.log('\n--- 2. Ensuring Admin Accounts Exist ---');
    for (const email of ADMIN_EMAILS) {
        let userId;
        if (!existingEmails.has(email.toLowerCase())) {
            console.log(`Creating admin user: ${email}...`);
            const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
                email: email,
                password: 'admin123',
                email_confirm: true,
                user_metadata: { full_name: email.split('@')[0].toUpperCase() }
            });

            if (createErr) {
                console.error(`Failed to create admin user ${email}:`, createErr.message);
                continue;
            }
            userId = newUser.user.id;
            console.log(`Created admin account ${email} (ID: ${userId})`);
        } else {
            const user = usersData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
            userId = user.id;
            console.log(`Updating password to admin123 for existing admin ${email} (ID: ${userId})...`);
            await supabase.auth.admin.updateUserById(userId, { password: 'admin123' });
        }

        // Upsert into profiles table with correct roles
        const targetRole = (email.toLowerCase() === 'annan@drivesetu.com') ? 'admin' : 'user';
        const { error: profileErr } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: email,
                role: targetRole,
                full_name: email.split('@')[0].toUpperCase(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (profileErr) {
            console.error(`Error updating profile for ${email}:`, profileErr.message);
        } else {
            console.log(`Successfully verified admin profile in database for ${email}`);
        }
    }

    console.log('\n--- 3. Verifying All Profiles in Database ---');
    const { data: profiles } = await supabase.from('profiles').select('*');
    console.log('Current profiles in database:');
    console.table(profiles);

    console.log('\n--- 4. Verifying Storage Buckets ---');
    const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
    if (bErr) {
        console.error('Bucket list error:', bErr.message);
    } else {
        const userFilesBucket = buckets.find(b => b.id === 'user-files');
        if (!userFilesBucket) {
            console.log('Creating "user-files" storage bucket...');
            await supabase.storage.createBucket('user-files', { public: true });
            console.log('"user-files" bucket created.');
        } else {
            console.log('"user-files" bucket exists and is ready.');
        }
    }
}

automateDatabase();
