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

const ACCOUNTS_CONFIG = [
    { email: 'admin@drivesetu.com', password: 'admin123', role: 'admin' }
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

    console.log('\n--- 2. Ensuring Admin & Officer Accounts Exist ---');
    for (const acc of ACCOUNTS_CONFIG) {
        let userId;
        const email = acc.email;
        if (!existingEmails.has(email.toLowerCase())) {
            console.log(`Creating user: ${email}...`);
            const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
                email: email,
                password: acc.password,
                email_confirm: true,
                user_metadata: { full_name: email.split('@')[0].toUpperCase() }
            });

            if (createErr) {
                console.error(`Failed to create user ${email}:`, createErr.message);
                continue;
            }
            userId = newUser.user.id;
            console.log(`Created account ${email} (ID: ${userId})`);
        } else {
            const user = usersData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
            userId = user.id;
            console.log(`Updating password to '${acc.password}' for user ${email}...`);
            await supabase.auth.admin.updateUserById(userId, { password: acc.password });
        }

        // Upsert into profiles table
        const { error: profileErr } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: email,
                role: acc.role,
                full_name: email.split('@')[0].toUpperCase(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (profileErr) {
            console.error(`Error updating profile for ${email}:`, profileErr.message);
        } else {
            console.log(`Successfully verified profile in database for ${email} (${acc.role})`);
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
