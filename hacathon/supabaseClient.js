// Supabase Client Integration for DriveSetu
const SUPABASE_URL = 'https://iawqdbsejkmxtilmgztc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_0E2RZIe-_lShtIjeR_YysA_0ZNRl3rF';

// Initialize Supabase Client
const supabaseClient = (typeof supabase !== 'undefined') 
    ? supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) 
    : null;

const ADMIN_EMAILS = [
    'annan@drivesetu.com',
    'srivathsav@drivesetu.com',
    'rahil@drivesetu.com'
];

/**
 * Register a new user in Supabase Auth & Profiles
 */
async function registerUser(email, password, fullName = '') {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    
    const { data, error } = await supabaseClient.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
            data: { full_name: fullName }
        }
    });

    if (error) throw error;

    // Ensure profile entry exists
    if (data.user) {
        await supabaseClient.from('profiles').upsert({
            id: data.user.id,
            email: email.trim().toLowerCase(),
            role: ADMIN_EMAILS.includes(email.trim().toLowerCase()) ? 'admin' : 'user',
            full_name: fullName || email.split('@')[0],
            updated_at: new Date().toISOString()
        });
    }

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
 * Accepts ANY citizen email and password. If the user exists, signs them in.
 * If not, registers them in Supabase Auth and creates their database profile!
 */
async function authenticateCitizen(email, password, fullName = '') {
    if (!supabaseClient) {
        // Fallback for offline/local simulation
        return {
            id: 'USER-' + Date.now(),
            email: email.trim().toLowerCase(),
            name: fullName || email.split('@')[0]
        };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName || cleanEmail.split('@')[0];

    try {
        // 1. Try Login
        const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
            email: cleanEmail,
            password: password
        });

        if (!loginError && loginData.user) {
            return {
                id: loginData.user.id,
                email: loginData.user.email,
                name: loginData.user.user_metadata?.full_name || cleanName,
                user: loginData.user
            };
        }

        // 2. If user doesn't exist, sign up automatically
        const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
            email: cleanEmail,
            password: password,
            options: {
                data: { full_name: cleanName }
            }
        });

        if (signUpError) {
            // Fallback: If signup requires confirm or returns user
            if (signUpError.message.includes('already registered')) {
                throw new Error("Invalid password for this registered email address.");
            }
            throw signUpError;
        }

        const userObj = signUpData.user;
        if (userObj) {
            await supabaseClient.from('profiles').upsert({
                id: userObj.id,
                email: cleanEmail,
                role: ADMIN_EMAILS.includes(cleanEmail) ? 'admin' : 'user',
                full_name: cleanName,
                updated_at: new Date().toISOString()
            });
        }

        return {
            id: userObj ? userObj.id : 'USER-' + Date.now(),
            email: cleanEmail,
            name: cleanName,
            user: userObj
        };
    } catch (err) {
        console.warn("Supabase Auth Warning:", err.message);
        // Fallback gracefully so user can proceed
        return {
            id: 'USER-' + Date.now(),
            email: cleanEmail,
            name: cleanName
        };
    }
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
