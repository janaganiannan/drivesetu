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
        email: email,
        password: password,
        options: {
            data: { full_name: fullName }
        }
    });

    if (error) throw error;
    return data;
}

/**
 * Login user with Supabase Auth
 */
async function loginUser(email, password) {
    if (!supabaseClient) throw new Error("Supabase client not initialized");
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) throw error;
    return data;
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
async function uploadUserFile(file, category = 'driving_test_video') {
    if (!supabaseClient) throw new Error("Supabase client not initialized");

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("User must be logged in to upload files.");

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // 1. Upload file to Supabase Storage Bucket ('user-files')
    const { data: storageData, error: storageError } = await supabaseClient.storage
        .from('user-files')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (storageError) throw storageError;

    // 2. Get Public URL
    const { data: publicUrlData } = supabaseClient.storage
        .from('user-files')
        .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // 3. Store file metadata in Postgres table 'user_files'
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

    if (dbError) throw dbError;
    return dbData[0];
}

/**
 * Fetch files uploaded by current user (or all files if Admin)
 */
async function fetchUserFiles() {
    if (!supabaseClient) throw new Error("Supabase client not initialized");

    const { data, error } = await supabaseClient
        .from('user_files')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

// Global exports for browser usage
if (typeof window !== 'undefined') {
    window.DriveSetuSupabase = {
        client: supabaseClient,
        registerUser,
        loginUser,
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
        checkIsAdmin,
        uploadUserFile,
        fetchUserFiles,
        ADMIN_EMAILS
    };
}
