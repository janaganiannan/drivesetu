// Supabase Client Integration for DriveSetu
const SUPABASE_URL = 'https://iawqdbsejkmxtilmgztc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_0E2RZIe-_lShtIjeR_YysA_0ZNRl3rF';

// Initialize Supabase Client safely
const supabaseClient = (typeof supabase !== 'undefined' && supabase && typeof supabase.createClient === 'function') 
    ? supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) 
    : null;

const ADMIN_EMAILS = [
    'admin@drivesetu.com'
];

const OFFICIAL_ADMIN_EMAILS = [
    'admin@drivesetu.com'
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

    if (isOfficialRtoAccount(cleanEmail)) {
        throw new Error("Official RTO accounts cannot be registered as citizen accounts.");
    }

    // 1. Check local registry first for duplicate account
    const registeredMap = getRegisteredAccountsMap();
    if (registeredMap[cleanEmail]) {
        throw new Error("This email is already registered. Please sign in.");
    }

    // 2. Try server backend API endpoint if running on Express
    try {
        const resp = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password: password, fullName: cleanName })
        });
        if (resp.ok) {
            const result = await resp.json();
            if (result.success && result.user) {
                saveRegisteredAccount(cleanEmail, password, cleanName);
                return { user: result.user, session: { access_token: 'active-session' } };
            }
        } else {
            const errData = await resp.json().catch(() => ({}));
            if (errData.error && errData.error.includes('already registered')) {
                throw new Error(errData.error);
            }
        }
    } catch(fetchErr) {
        if (fetchErr.message && fetchErr.message.includes('already registered')) {
            throw fetchErr;
        }
    }

    // 3. Client-side Supabase Auth integration
    if (!supabaseClient) {
        saveRegisteredAccount(cleanEmail, password, cleanName);
        return { user: { id: 'USER-' + Date.now(), email: cleanEmail }, session: { access_token: 'local-token' } };
    }
    
    const { data, error } = await supabaseClient.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
            data: { full_name: cleanName }
        }
    });

    if (error) {
        const msg = (error.message || '').toLowerCase();
        
        // Handle duplicate account errors
        if (msg.includes('already registered') || msg.includes('already in use') || msg.includes('user_already_exists')) {
            throw new Error("This email is already registered. Please sign in.");
        }
        if (msg.includes('invalid email') || msg.includes('unable to validate email')) {
            throw new Error("Please enter a valid email address.");
        }

        // If rate limit or SMTP error occurs, ensure citizen is STILL registered in Supabase database & local registry!
        if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit') || error.status === 429) {
            const fallbackId = 'USER-' + Date.now();
            try {
                await supabaseClient.from('citizens').upsert({
                    id: fallbackId,
                    email: cleanEmail,
                    role: 'citizen',
                    account_type: 'Citizen',
                    full_name: cleanName,
                    updated_at: new Date().toISOString()
                });
            } catch(cErr) {}

            try {
                await supabaseClient.from('profiles').upsert({
                    id: fallbackId,
                    email: cleanEmail,
                    role: 'user',
                    account_type: 'Citizen',
                    full_name: cleanName,
                    updated_at: new Date().toISOString()
                });
            } catch(pErr) {}

            saveRegisteredAccount(cleanEmail, password, cleanName);
            return { user: { id: fallbackId, email: cleanEmail }, session: { access_token: 'local-session' } };
        }

        throw new Error("Registration failed. Please try again.");
    }

    // Ensure profile entry exists linked to Auth user ID in Supabase citizen_info & profiles tables
    if (data && data.user) {
        try {
            await supabaseClient.from('citizen_info').upsert({
                user_id: data.user.id,
                email: cleanEmail,
                full_name: cleanName,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        } catch(cErr) {}

        try {
            await supabaseClient.from('profiles').upsert({
                id: data.user.id,
                email: cleanEmail,
                role: ADMIN_EMAILS.includes(cleanEmail) ? 'SUPER_ADMIN' : 'CITIZEN',
                account_type: 'Citizen',
                full_name: cleanName,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
        } catch(pErr) {}

        saveRegisteredAccount(cleanEmail, password, cleanName);
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

    // 1. Upload file to Supabase Storage Bucket ('citizen-documents')
    const { data: storageData, error: storageError } = await supabaseClient.storage
        .from('citizen-documents')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
        });

    if (storageError) {
        console.error("Storage upload failed:", storageError);
        throw storageError;
    }

    // 2. Get Public URL or Storage Reference
    const { data: publicUrlData } = supabaseClient.storage
        .from('citizen-documents')
        .getPublicUrl(filePath);

    const publicUrl = publicUrlData ? publicUrlData.publicUrl : filePath;

    // 3. Store file path reference in Postgres table 'citizen_documents'
    if (user) {
        const updatePayload = {
            user_id: user.id,
            updated_at: new Date().toISOString()
        };

        if (category === 'identity' || category === 'proof_identity') {
            updatePayload.proof_identity_doc_path = filePath;
        } else if (category === 'address' || category === 'proof_address') {
            updatePayload.proof_address_doc_path = filePath;
        } else if (category === 'medical' || category === 'medical_certificate') {
            updatePayload.medical_certificate_doc_path = filePath;
        } else if (category === 'video' || category === 'test_video') {
            updatePayload.test_video_path = filePath;
        } else if (category === 'aiReport' || category === 'ai_report') {
            updatePayload.ai_report_path = filePath;
        }

        try {
            await supabaseClient
                .from('citizen_documents')
                .upsert([updatePayload], { onConflict: 'user_id' });
        } catch(dbErr) {}
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
 * Fetch citizen documents uploaded by current user (or all documents if Admin)
 */
async function fetchUserFiles() {
    if (!supabaseClient) return [];

    const { data, error } = await supabaseClient
        .from('citizen_documents')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Fetch files error:", error);
        return [];
    }
    return data;
}

/**
 * Sync Citizen Application Data & Document Storage Paths to Supabase Tables (citizen_documents & citizen_info)
 */
async function syncApplicationToSupabase(app) {
    try {
        const resp = await fetch('/api/submit-citizen-application', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ application: app })
        });
        const result = await resp.json();
        if (resp.ok && result.success) {
            console.log("✅ Application & Document Storage Paths saved to Supabase via server API");
            return result;
        }
    } catch(e) {}

    if (typeof supabaseClient === 'undefined' || !supabaseClient) return;

    try {
        const { data: authData } = await supabaseClient.auth.getUser();
        const user = authData ? authData.user : null;
        if (!user) return;

        const details = app.applicantDetails || {};
        const service = app.serviceDetails || {};
        const docs = app.documents || [];
        const evidence = app.testEvidence || {};

        let identityPath = '';
        let addressPath = '';
        let medicalPath = '';

        docs.forEach(function(d) {
            if (d.id === 'proof_identity' || d.id === 'aadhaar' || d.id === 'passport') {
                identityPath = d.fileName || d.name || ('citizen-documents/' + user.id + '/identity_proof.pdf');
            } else if (d.id === 'proof_address' || d.id === 'utility') {
                addressPath = d.fileName || d.name || ('citizen-documents/' + user.id + '/address_proof.pdf');
            } else if (d.id === 'form_1a' || d.id === 'medical') {
                medicalPath = d.fileName || d.name || ('citizen-documents/' + user.id + '/medical_certificate.pdf');
            }
        });

        let videoPath = (evidence && evidence.video) ? (evidence.video.fileName || ('citizen-documents/' + user.id + '/driving_test.mp4')) : '';
        let aiReportPath = (evidence && evidence.aiReport) ? (evidence.aiReport.fileName || ('citizen-documents/' + user.id + '/ai_analysis_report.pdf')) : '';

        // 1. Sync to public.citizen_info
        try {
            await supabaseClient.from('citizen_info').upsert({
                user_id: user.id,
                full_name: app.name || details.fullName || 'Citizen Applicant',
                email: app.citizenId || details.email || user.email,
                mobile: details.mobile || service.mobile || '',
                address: details.address || service.address || '',
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        } catch(iErr) {}

        // 2. Sync to public.citizen_documents
        try {
            await supabaseClient.from('citizen_documents').upsert({
                user_id: user.id,
                full_name: app.name || details.fullName || 'Citizen Applicant',
                email: app.citizenId || details.email || user.email,
                mobile: details.mobile || service.mobile || '',
                address: details.address || service.address || '',
                aadhaar_number: service.aadhaarNumber || '',
                application_id: app.id,
                application_type: app.type,
                application_status: app.status || 'Submitted',
                rto_code: service.rtoCode || app.allocatedRtoCode || 'TG-03',
                proof_identity_doc_path: identityPath || null,
                proof_address_doc_path: addressPath || null,
                medical_certificate_doc_path: medicalPath || null,
                test_video_path: videoPath || null,
                ai_report_path: aiReportPath || null,
                test_result: app.status === 'Approved' ? 'PASS' : (app.status === 'Rejected' ? 'FAIL' : 'Pending Review'),
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        } catch(dErr) {}

        console.log("✅ Application & Document Storage Paths synced to Supabase (citizen_documents & citizen_info)");
    } catch (e) {
        console.error("Supabase Application Sync Error:", e);
    }
}

/**
 * Official RTO Officer / Operator Authentication Handler
 * Authenticates directly with Supabase Auth and fetches role metadata from rto_officers/profiles
 */
async function authenticateOfficer(email, password) {
    const cleanEmail = email.trim().toLowerCase();

    // Check if user has a pending registration request first
    let localPending = getLocalPendingRequests();
    let pendingReq = localPending.find(r => r.email.toLowerCase() === cleanEmail);
    if (pendingReq && pendingReq.status === 'Pending') {
        throw new Error("⛔ Access Pending: Your RTO registration request is awaiting Portal Admin approval. Please contact the system administrator.");
    }
    if (pendingReq && pendingReq.status === 'Rejected') {
        throw new Error("⛔ Registration Rejected: Your RTO registration request was declined by the System Administrator.");
    }

    if (!supabaseClient) {
        throw new Error("Supabase client not initialized.");
    }

    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
        email: cleanEmail,
        password: password
    });

    if (loginError || !loginData.user) {
        throw new Error("Invalid officer credentials or unauthorized account.");
    }

    const user = loginData.user;
    let officerProfile = null;

    try {
        const { data: offRow } = await supabaseClient
            .from('rto_officers')
            .select('*')
            .eq('id', user.id)
            .single();

        if (offRow) officerProfile = offRow;
    } catch(e) {}

    if (!officerProfile) {
        try {
            const { data: profRow } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profRow) officerProfile = profRow;
        } catch(e) {}
    }

    const meta = user.user_metadata || {};
    const role = (officerProfile && officerProfile.role) || meta.role || (cleanEmail === 'admin@drivesetu.com' ? 'ADMIN' : 'REVIEWING_OFFICER');

    return {
        id: user.id,
        email: user.email,
        name: (officerProfile && officerProfile.full_name) || meta.full_name || cleanEmail.split('@')[0].toUpperCase(),
        role: role,
        rtoCode: (officerProfile && officerProfile.rto_code) || meta.rto_code || 'TG-03',
        rtoName: (officerProfile && officerProfile.rto_name) || 'RTA Telangana',
        officerId: (officerProfile && officerProfile.officer_id) || ('OFF-' + user.id.slice(-4)),
        user: user
    };
}

function getLocalPendingRequests() {
    try {
        var raw = localStorage.getItem('drivesetu_pending_rto_requests');
        return raw ? JSON.parse(raw) : [];
    } catch(e) {
        return [];
    }
}

function saveLocalPendingRequests(list) {
    try {
        localStorage.setItem('drivesetu_pending_rto_requests', JSON.stringify(list));
    } catch(e) {}
}

/**
 * Submit RTO Registration Request (Stores in Pending queue for Portal Admin approval)
 */
async function submitRTORegistrationRequest(requestData) {
    try {
        const resp = await fetch('/api/rto-registration-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        const result = await resp.json();
        if (resp.ok && result.success) {
            let list = getLocalPendingRequests();
            list.push(result.request || requestData);
            saveLocalPendingRequests(list);
            return result;
        }
    } catch(e) {}

    // Fallback: Local storage request creation
    let list = getLocalPendingRequests();
    const reqObj = {
        id: 'REQ-' + Date.now(),
        full_name: requestData.fullName,
        email: requestData.officialEmail.trim().toLowerCase(),
        password: requestData.password,
        role: requestData.role || 'REVIEWING_OFFICER',
        rto_code: requestData.rtoCode || 'TG-03',
        rto_name: requestData.officeName || ('RTA Office ' + (requestData.rtoCode || 'TG-03')),
        officer_id: requestData.officerId || ('OFF-' + Date.now().toString().slice(-4)),
        designation: requestData.designation || 'RTO Officer',
        mobile: requestData.officialMobile || '',
        status: 'Pending',
        created_at: new Date().toISOString()
    };
    list.push(reqObj);
    saveLocalPendingRequests(list);
    return { success: true, message: 'Request submitted successfully. Pending Admin approval.', request: reqObj };
}

/**
 * Fetch Pending RTO Registration Requests for Portal Admin
 */
async function fetchPendingRTORequests() {
    try {
        const resp = await fetch('/api/admin/pending-rto-requests');
        if (resp.ok) {
            const result = await resp.json();
            if (result.success && Array.isArray(result.requests)) {
                let localList = getLocalPendingRequests();
                result.requests.forEach(r => {
                    if (!localList.some(l => l.id === r.id || (l.email === r.email && l.status === r.status))) {
                        localList.push(r);
                    }
                });
                saveLocalPendingRequests(localList);
                return result.requests;
            }
        }
    } catch(e) {}

    return getLocalPendingRequests();
}

/**
 * Portal Admin Approve Request
 */
async function approveRTORegistrationRequest(requestId, email) {
    try {
        const resp = await fetch('/api/admin/approve-rto-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId, email })
        });
        const result = await resp.json();
        if (resp.ok && result.success) {
            let list = getLocalPendingRequests();
            let item = list.find(r => r.id === requestId || (email && r.email.toLowerCase() === email.toLowerCase()));
            if (item) item.status = 'Approved';
            saveLocalPendingRequests(list);
            return result;
        }
    } catch(e) {}

    // Local fallback update
    let list = getLocalPendingRequests();
    let item = list.find(r => r.id === requestId || (email && r.email.toLowerCase() === email.toLowerCase()));
    if (item) item.status = 'Approved';
    saveLocalPendingRequests(list);
    return { success: true, message: 'Request approved locally.' };
}

/**
 * Portal Admin Reject Request
 */
async function rejectRTORegistrationRequest(requestId, email) {
    try {
        const resp = await fetch('/api/admin/reject-rto-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId, email })
        });
        const result = await resp.json();
        if (resp.ok && result.success) {
            let list = getLocalPendingRequests();
            let item = list.find(r => r.id === requestId || (email && r.email.toLowerCase() === email.toLowerCase()));
            if (item) item.status = 'Rejected';
            saveLocalPendingRequests(list);
            return result;
        }
    } catch(e) {}

    let list = getLocalPendingRequests();
    let item = list.find(r => r.id === requestId || (email && r.email.toLowerCase() === email.toLowerCase()));
    if (item) item.status = 'Rejected';
    saveLocalPendingRequests(list);
    return { success: true, message: 'Request rejected.' };
}

async function registerRTOOffice(rtoOfficeData) {
    try {
        const resp = await fetch('/api/register-rto-office', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rtoOfficeData)
        });
        const result = await resp.json();
        if (resp.ok && result.success) {
            return result;
        }
        if (result.error && !result.error.includes('uninitialized')) {
            throw new Error(result.error);
        }
    } catch(err) {
        if (err.message && !err.message.includes('uninitialized') && !err.message.includes('Failed to fetch')) {
            throw err;
        }
    }

    // Direct Supabase Client Fallback
    if (!supabaseClient) {
        return { success: true, message: 'Registered locally.' };
    }

    const cleanEmail = (rtoOfficeData.officialEmail || '').trim().toLowerCase();
    const code = (rtoOfficeData.rtoCode || 'TG-03').trim().toUpperCase();
    const cleanOfficerName = rtoOfficeData.officerName || 'RTO Officer';
    const offId = rtoOfficeData.officerId || ('OFF-' + code.replace('-', ''));

    // 1. Upsert into rto_info table directly via Supabase Client
    try {
        await supabaseClient.from('rto_info').upsert({
            rto_office_name: rtoOfficeData.officeName || ('RTA Office ' + code),
            rto_code: code,
            rto_type: rtoOfficeData.rtoType || 'Regional Transport Office',
            state: rtoOfficeData.state || 'Telangana',
            district: rtoOfficeData.district || 'General',
            office_address: rtoOfficeData.officeAddress || 'RTO Office Premises',
            pin_code: rtoOfficeData.pinCode || '',
            office_phone: rtoOfficeData.officePhone || '',
            office_email: rtoOfficeData.officeEmail || cleanEmail,
            officer_full_name: cleanOfficerName,
            officer_id: offId,
            officer_designation: rtoOfficeData.designation || 'RTO Officer',
            officer_mobile: rtoOfficeData.officialMobile || '',
            officer_email: cleanEmail,
            updated_at: new Date().toISOString()
        }, { onConflict: 'rto_code' });
    } catch(e) {}

    // 2. Auth SignUp
    const { data, error } = await supabaseClient.auth.signUp({
        email: cleanEmail,
        password: rtoOfficeData.password,
        options: {
            data: { full_name: cleanOfficerName, role: 'RTO_OFFICER', rto_code: code }
        }
    });

    if (data && data.user) {
        try {
            await supabaseClient.from('profiles').upsert({
                id: data.user.id,
                email: cleanEmail,
                role: 'RTO_OFFICER',
                account_type: 'RTO Officer',
                full_name: cleanOfficerName,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
        } catch(pErr) {}
    }

    return { success: true, user: data ? data.user : { email: cleanEmail } };
}

/**
 * Create RTO Employee under an RTO Office ID
 */
async function createRTOEmployee(employeeData) {
    try {
        const resp = await fetch('/api/register-employee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });
        const result = await resp.json();
        if (!resp.ok || !result.success) {
            throw new Error(result.error || 'Employee registration failed.');
        }
        return result;
    } catch(err) {
        throw err;
    }
}

// Global exports for browser usage
if (typeof window !== 'undefined') {
    window.DriveSetuSupabase = {
        client: supabaseClient,
        registerUser,
        loginUser,
        authenticateCitizen,
        authenticateOfficer,
        registerRTOOffice,
        createRTOEmployee,
        submitRTORegistrationRequest,
        fetchPendingRTORequests,
        approveRTORegistrationRequest,
        rejectRTORegistrationRequest,
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
        authenticateOfficer,
        registerRTOOffice,
        createRTOEmployee,
        submitRTORegistrationRequest,
        fetchPendingRTORequests,
        approveRTORegistrationRequest,
        rejectRTORegistrationRequest,
        checkIsAdmin,
        uploadUserFile,
        fetchUserFiles,
        ADMIN_EMAILS
    };
}
