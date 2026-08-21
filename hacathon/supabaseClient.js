// Supabase Client Integration for DriveSetu
const SUPABASE_URL = 'https://iawqdbsejkmxtilmgztc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_0E2RZIe-_lShtIjeR_YysA_0ZNRl3rF';

// Initialize Supabase Client safely
const supabaseClient = (typeof supabase !== 'undefined' && supabase && typeof supabase.createClient === 'function') 
    ? supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) 
    : null;

const ADMIN_EMAILS = [
    'annan@drivesetu.com',
    'srivathsav@drivesetu.com',
    'rahil@drivesetu.com',
    'admin@drivesetu.com'
];

const OFFICIAL_ADMIN_EMAILS = [
    'admin@drivesetu.com',
    'annan@drivesetu.com',
    'srivathsav@drivesetu.com',
    'rahil@drivesetu.com',
    'officer01.tg03@drivesetu.com',
    'officer09.tg05@drivesetu.com',
    'officer17.tg08@drivesetu.com',
    'officer31.tg12@drivesetu.com',
    'operator.tg03@drivesetu.com',
    'operator.tg05@drivesetu.com',
    'operator.tg08@drivesetu.com',
    'operator.tg12@drivesetu.com'
];

function isOfficialRtoAccount(email) {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    return OFFICIAL_ADMIN_EMAILS.includes(clean) || clean.endsWith('@drivesetu.com');
}

function getRegisteredAccountsMap() {
    try {
        var raw = localStorage.getItem('drivesetu_registered_citizens_map');
        return raw ? JSON.parse(raw) : {};
    } catch(e) {
        return {};
    }
}

function saveRegisteredAccount(email, password, name) {
    try {
        var map = getRegisteredAccountsMap();
        map[email.toLowerCase()] = { password: password, name: name, registeredAt: new Date().toISOString() };
        localStorage.setItem('drivesetu_registered_citizens_map', JSON.stringify(map));
    } catch(e) {}
}

/**
 * Register a new user in Supabase Auth & Profiles
 */
async function registerUser(email, password, fullName = '') {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName || cleanEmail.split('@')[0];
    const registeredMap = getRegisteredAccountsMap();

    if (isOfficialRtoAccount(cleanEmail)) {
        throw new Error("Email address " + cleanEmail + " is an Official RTO Officer / System Administrator account. Official RTO accounts cannot be registered as citizen accounts.");
    }

    if (registeredMap[cleanEmail]) {
        throw new Error("Account with email address " + cleanEmail + " is already registered. Duplicate accounts with the same email are not permitted.");
    }

    if (!supabaseClient) {
        saveRegisteredAccount(cleanEmail, password, cleanName);
        return { user: { id: 'USER-' + Date.now(), email: cleanEmail } };
    }
    
    const { data, error } = await supabaseClient.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
            data: { full_name: cleanName }
        }
    });

    if (error) {
        if (error.message.includes('already registered') || error.message.includes('already in use')) {
            throw new Error("Account with email address " + cleanEmail + " is already registered. Duplicate accounts with the same email are not permitted.");
        }
        throw error;
    }

    // Ensure profile entry exists
    if (data.user) {
        await supabaseClient.from('profiles').upsert({
            id: data.user.id,
            email: cleanEmail,
            role: ADMIN_EMAILS.includes(cleanEmail) ? 'admin' : 'user',
            full_name: cleanName,
            updated_at: new Date().toISOString()
        });
    }

    saveRegisteredAccount(cleanEmail, password, cleanName);
    return data;
}

/**
 * Login user with Supabase Auth
 */
async function loginUser(email, password) {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
    });

    if (error) throw error;
    return data;
}

/**
 * Universal Citizen Authentication Handler
 * Enforces strict email uniqueness: Each email address has exactly ONE password and ONE account!
 */
async function authenticateCitizen(email, password, fullName = '') {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName || cleanEmail.split('@')[0];

    if (isOfficialRtoAccount(cleanEmail)) {
        throw new Error("Email address " + cleanEmail + " is an Official RTO Officer / System Administrator account. Please use the RTO Officer Portal Login to sign in.");
    }

    if (!supabaseClient) {
        const registeredMap = getRegisteredAccountsMap();
        if (registeredMap[cleanEmail]) {
            if (registeredMap[cleanEmail].password !== password) {
                throw new Error("Incorrect password for registered email address " + cleanEmail + ".");
            }
            return {
                id: 'USER-' + Date.now(),
                email: cleanEmail,
                name: registeredMap[cleanEmail].name || cleanName
            };
        }
        throw new Error("Invalid login credentials.");
    }

    // Try Login with Supabase Auth
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
        email: cleanEmail,
        password: password
    });

    if (loginError || !loginData.user) {
        throw new Error("Invalid login credentials.");
    }

    saveRegisteredAccount(cleanEmail, password, loginData.user.user_metadata?.full_name || cleanName);
    return {
        id: loginData.user.id,
        email: loginData.user.email,
        name: loginData.user.user_metadata?.full_name || cleanName,
        user: loginData.user
    };
}

/**
 * Check if the currently logged-in user or given email is an admin
 */
async function checkIsAdmin(emailToCheck = null) {
    if (emailToCheck) {
        return ADMIN_EMAILS.includes(emailToCheck.toLowerCase());
    }
    
    if (!supabaseClient) return false;
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    return profile?.role === 'admin' || ADMIN_EMAILS.includes(user.email?.toLowerCase());
}

/**
 * Upload Video or PDF file to Supabase Storage and save metadata in user_files database table
 */
async function uploadUserFile(file, category = 'driving_test_video', customUserId = null) {
    if (!supabaseClient) {
        console.warn("Supabase client not initialized, returning mock file object.");
        return {
            file_name: file.name,
            file_url: URL.createObjectURL(file),
            file_type: file.type
        };
    }

    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user ? user.id : (customUserId || 'anon-user');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // 1. Upload file to Supabase Storage Bucket ('user-files')
    const { data: storageData, error: storageError } = await supabaseClient.storage
        .from('user-files')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
        });

    if (storageError) {
        console.error("Storage upload failed:", storageError);
        throw storageError;
    }

    // 2. Get Public URL
    const { data: publicUrlData } = supabaseClient.storage
        .from('user-files')
        .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // 3. Store file metadata in Postgres table 'user_files'
    if (user) {
        const { data: dbData, error: dbError } = await supabaseClient
            .from('user_files')
            .insert([{
                user_id: user.id,
                file_name: file.name,
                file_path: filePath,
                file_url: publicUrl,
                file_type: file.type || (fileExt === 'pdf' ? 'application/pdf' : 'video/mp4'),
                file_size: file.size,
                category: category
            }])
            .select();

        if (!dbError && dbData) return dbData[0];
    }

    return {
        file_name: file.name,
        file_path: filePath,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        category: category
    };
}

/**
 * Fetch files uploaded by current user (or all files if Admin)
 */
async function fetchUserFiles() {
    if (!supabaseClient) return [];

    const { data, error } = await supabaseClient
        .from('user_files')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Fetch files error:", error);
        return [];
    }
    return data;
}

// Global exports for browser usage
if (typeof window !== 'undefined') {
    window.DriveSetuSupabase = {
        client: supabaseClient,
        registerUser,
        loginUser,
        authenticateCitizen,
        checkIsAdmin,
        uploadUserFile,
        fetchUserFiles,
        ADMIN_EMAILS
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        supabaseClient,
        registerUser,
        loginUser,
        authenticateCitizen,
        checkIsAdmin,
        uploadUserFile,
        fetchUserFiles,
        ADMIN_EMAILS
    };
}
