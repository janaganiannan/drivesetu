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

function getApiBaseUrl() {
    if (typeof window === 'undefined') return '';
    if (window.DRIVESETU_API_URL) return window.DRIVESETU_API_URL;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        if (window.location.port !== '3000' && window.location.port !== '') {
            return 'http://' + window.location.hostname + ':3000';
        }
    }
    return '';
}

/**
 * Sync Citizen Application Data & Document Storage Paths to Supabase Tables (citizen_documents & citizen_info)
 */
async function syncApplicationToSupabase(app) {
    if (!app || !app.id) return { success: false, error: 'No application provided' };
    
    var details = app.applicantDetails || {};
    var service = app.serviceDetails || {};
    var docs = app.documents || [];
    var evidence = app.testEvidence || {};

    var cleanEmail = (app.citizenId || details.email || '').trim().toLowerCase();
    var cleanName = (app.name || details.fullName || 'Citizen Applicant').trim();
    var cleanMobile = (details.mobile || service.mobile || app.mobile || '').trim();
    var cleanAddress = (details.address || service.address || app.address || '').trim();
    var cleanAadhaar = (service.aadhaarNumber || details.aadhaarNumber || app.aadhaarNumber || '').trim();
    var cleanRto = (service.rtoCode || app.allocatedRtoCode || 'TG-03').trim();

    var identityPath = '';
    var addressPath = '';
    var medicalPath = '';

    docs.forEach(function(d) {
        var fileName = d.fileName || d.name || '';
        if (d.id === 'proof_identity' || d.id === 'aadhaar' || d.id === 'passport' || d.id === 'defaced_dl') {
            identityPath = fileName;
        } else if (d.id === 'proof_address' || d.id === 'utility' || d.id === 'photo' || d.id === 'recent_photo' || d.id === 'photo_replacement') {
            addressPath = fileName;
        } else if (d.id === 'form_1a' || d.id === 'medical' || d.id === 'form_1' || d.id === 'form_5') {
            medicalPath = fileName;
        } else if (!identityPath) {
            identityPath = fileName;
        } else if (!addressPath) {
            addressPath = fileName;
        } else if (!medicalPath) {
            medicalPath = fileName;
        }
    });

    var videoPath = (evidence && evidence.video) ? (evidence.video.fileName || '') : '';
    var rawAiReport = (evidence && evidence.aiReport) ? (evidence.aiReport.fileName || '') : '';

    // Encode all application fields losslessly into metadata
    var metaPayload = {
        fullName: cleanName,
        dob: details.dob || app.dob || '',
        gender: details.gender || app.gender || '',
        category: details.applicantCategory || service.applicantCategory || app.category || '',
        parentName: details.parentName || service.parentName || app.parentName || '',
        state: details.state || service.state || app.state || '',
        district: details.district || service.district || app.district || '',
        pin: details.pin || service.pin || app.pin || '',
        vehicleClasses: service.vehicleClasses || app.vehicleClasses || [],
        allocatedTestDate: service.allocatedTestDate || service.preferredTestDate || '',
        allocatedTestStartTime: service.allocatedTestStartTime || service.preferredTestStartTime || '',
        allocatedTestEndTime: service.allocatedTestEndTime || service.preferredTestEndTime || '',
        preferredTestDate: service.preferredTestDate || '',
        preferredTestStartTime: service.preferredTestStartTime || '',
        preferredTestEndTime: service.preferredTestEndTime || '',
        rtoOfficeName: service.rtoOfficeName || '',
        rtoAddress: service.rtoAddress || '',
        qualification: service.qualification || '',
        idMarks: service.idMarks || '',
        bloodGroup: service.bloodGroup || '',
        tempAddress: service.tempAddress || '',
        llNumber: service.llNumber || service.llNewNumber || app.learnerLicenceApplicationId || '',
        llIssueDate: service.llIssueDate || '',
        existingDlNumber: service.existingDlNumber || service.dlNumber || service.indianDlNumber || '',
        dlIssueDate: service.dlIssueDate || '',
        dlExpiryDate: service.dlExpiryDate || '',
        duplicateReason: service.duplicateReason || '',
        circumstances: service.circumstances || '',
        countriesToVisit: service.countriesToVisit || '',
        travelInfo: service.travelInfo || '',
        vehicleCategoriesRequested: service.vehicleCategoriesRequested || '',
        documents: docs,
        testEvidence: evidence,
        assignedOfficerName: app.assignedOfficerName || app.assignedOfficer || '',
        assignedOfficerEmail: app.assignedOfficerEmail || '',
        assignedOfficerId: app.assignedOfficerId || '',
        reviewStage: app.reviewStage || '',
        remarks: app.remarks || ''
    };

    var encodedAiReportPath = (rawAiReport || '') + '|||' + JSON.stringify(metaPayload);

    var docPayload = {
        full_name: cleanName,
        email: cleanEmail || 'citizen1@gmail.com',
        mobile: cleanMobile || null,
        address: cleanAddress || null,
        aadhaar_number: cleanAadhaar || null,
        application_id: app.id,
        application_type: app.type || "Learner's Licence",
        application_status: app.status || 'Submitted',
        rto_code: cleanRto,
        proof_identity_doc_path: identityPath || null,
        proof_address_doc_path: addressPath || null,
        medical_certificate_doc_path: medicalPath || null,
        test_video_path: videoPath || null,
        ai_report_path: encodedAiReportPath,
        test_result: app.status === 'Approved' ? 'PASS' : (app.status === 'Rejected' ? 'FAIL' : 'Pending Review'),
        updated_at: new Date().toISOString()
    };

    console.log("🚀 Syncing Comprehensive Application Data directly to Supabase citizen_documents:", docPayload);

    // 1. Primary Sync via Backend API (Service Role)
    try {
        const apiUrl = getApiBaseUrl() + '/api/submit-citizen-application';
        const resp = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ application: app, docPayload: docPayload })
        });
        if (resp.ok) {
            const result = await resp.json();
            if (result.success) {
                console.log("✅ Application & Documents successfully stored in Supabase citizen_documents via server API");
                return { success: true, applicationId: app.id, syncedToLiveDb: true };
            }
        }
    } catch(apiErr) {
        console.warn("Backend API sync warning:", apiErr);
    }

    // 2. Direct Browser Client Fallback
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const { data: existing } = await supabaseClient
                .from('citizen_documents')
                .select('id')
                .eq('application_id', app.id)
                .maybeSingle();

            if (existing && existing.id) {
                await supabaseClient.from('citizen_documents').update(docPayload).eq('id', existing.id);
            } else {
                await supabaseClient.from('citizen_documents').insert([docPayload]);
            }
            console.log("✅ Application & Documents saved to Supabase citizen_documents table directly from client");
            return { success: true, applicationId: app.id, syncedToLiveDb: true };
        } catch(clientErr) {
            console.error("Direct Supabase insert error:", clientErr);
        }
    }

    return { success: true, applicationId: app.id, syncedToLiveDb: false };
}

/**
 * Fetch Live Applications from Supabase (Backend API or Supabase Client)
 * Maps DB records into complete application objects and syncs to localStorage
 */
async function fetchLiveApplications(filterEmail = null) {
    var cleanEmail = filterEmail ? filterEmail.trim().toLowerCase() : null;
    var fetchedApps = [];

    // 1. Fetch via Backend API
    try {
        var queryParam = cleanEmail ? '?email=' + encodeURIComponent(cleanEmail) : '';
        var apiUrl = getApiBaseUrl() + '/api/citizen-applications' + queryParam;
        var resp = await fetch(apiUrl);
        if (resp.ok) {
            var data = await resp.json();
            if (data.success && Array.isArray(data.applications)) {
                fetchedApps = data.applications;
            }
        }
    } catch(e) {
        console.warn("Backend fetch applications warning:", e);
    }

    // 2. Fallback to Supabase direct client if needed
    if (fetchedApps.length === 0 && typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            var q = supabaseClient.from('citizen_documents').select('*').order('created_at', { ascending: false });
            if (cleanEmail) q = q.eq('email', cleanEmail);
            var { data: dbData } = await q;
            if (dbData && Array.isArray(dbData)) fetchedApps = dbData;
        } catch(e) {}
    }

    if (fetchedApps.length === 0) return [];

    // Convert Supabase DB rows into full application objects
    var mappedApps = fetchedApps.map(function(row) {
        var createdDate = row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'}) : new Date().toLocaleDateString('en-IN');
        
        var rawAiReport = row.ai_report_path || '';
        var meta = {};
        if (rawAiReport && rawAiReport.indexOf('|||') !== -1) {
            var parts = rawAiReport.split('|||');
            rawAiReport = parts[0] || '';
            try {
                meta = JSON.parse(parts.slice(1).join('|||')) || {};
            } catch(e) {}
        }

        var docs = (meta.documents && Array.isArray(meta.documents) && meta.documents.length > 0) ? meta.documents : [];
        if (docs.length === 0) {
            if (row.proof_identity_doc_path) docs.push({ id: 'proof_identity', name: 'Identity Proof', fileName: row.proof_identity_doc_path, status: 'Submitted' });
            if (row.proof_address_doc_path) docs.push({ id: 'proof_address', name: 'Address Proof', fileName: row.proof_address_doc_path, status: 'Submitted' });
            if (row.medical_certificate_doc_path) docs.push({ id: 'form_1a', name: 'Medical Certificate', fileName: row.medical_certificate_doc_path, status: 'Submitted' });
        }

        var vehicleClasses = (meta.vehicleClasses && meta.vehicleClasses.length > 0) ? meta.vehicleClasses : ['MCWG', 'LMV'];

        return {
            id: row.application_id || ('APP-' + (row.id || '').substring(0, 6)),
            name: row.full_name || meta.fullName || 'Citizen Applicant',
            type: row.application_type || "Learner's Licence",
            status: row.application_status || 'Submitted',
            date: createdDate,
            citizenId: row.email,
            mobile: row.mobile || meta.mobile || '',
            address: row.address || meta.address || '',
            aadhaarNumber: row.aadhaar_number || meta.aadhaarNumber || '',
            dob: meta.dob || '2005-08-24',
            gender: meta.gender || 'Male',
            vehicleClasses: vehicleClasses,
            applicantDetails: {
                fullName: row.full_name || meta.fullName,
                email: row.email,
                mobile: row.mobile || meta.mobile,
                dob: meta.dob || '2005-08-24',
                gender: meta.gender || 'Male',
                parentName: meta.parentName || '',
                category: meta.category || 'Adult',
                address: row.address || meta.address,
                state: meta.state || 'Telangana',
                district: meta.district || 'Warangal',
                pin: meta.pin || '506005'
            },
            serviceDetails: {
                rtoCode: row.rto_code || 'TG-03',
                rtoOfficeName: meta.rtoOfficeName || ('RTA Office (' + (row.rto_code || 'TG-03') + ')'),
                rtoAddress: meta.rtoAddress || '',
                state: meta.state || 'Telangana',
                district: meta.district || 'Warangal',
                pin: meta.pin || '506005',
                parentName: meta.parentName || '',
                aadhaarNumber: row.aadhaar_number || meta.aadhaarNumber || '',
                vehicleClasses: vehicleClasses,
                vehicleClass: Array.isArray(vehicleClasses) ? vehicleClasses.join(', ') : 'MCWG, LMV',
                applicantCategory: meta.category || 'Adult',
                preferredTestDate: meta.preferredTestDate || createdDate,
                preferredTestStartTime: meta.preferredTestStartTime || '10:00 AM',
                preferredTestEndTime: meta.preferredTestEndTime || '11:00 AM',
                allocatedTestDate: meta.allocatedTestDate || meta.preferredTestDate || createdDate,
                allocatedTestStartTime: meta.allocatedTestStartTime || '10:00 AM',
                allocatedTestEndTime: meta.allocatedTestEndTime || '11:00 AM',
                appointmentStatus: 'Scheduled',
                qualification: meta.qualification || '',
                idMarks: meta.idMarks || '',
                bloodGroup: meta.bloodGroup || '',
                tempAddress: meta.tempAddress || '',
                llNumber: meta.llNumber || '',
                llIssueDate: meta.llIssueDate || '',
                existingDlNumber: meta.existingDlNumber || '',
                dlIssueDate: meta.dlIssueDate || '',
                dlExpiryDate: meta.dlExpiryDate || '',
                duplicateReason: meta.duplicateReason || '',
                circumstances: meta.circumstances || '',
                countriesToVisit: meta.countriesToVisit || '',
                travelInfo: meta.travelInfo || '',
                vehicleCategoriesRequested: meta.vehicleCategoriesRequested || ''
            },
            documents: docs,
            testEvidence: (row.test_video_path || rawAiReport || meta.testEvidence) ? {
                video: { fileName: row.test_video_path || (meta.testEvidence?.video?.fileName || '') },
                aiReport: { fileName: rawAiReport || (meta.testEvidence?.aiReport?.fileName || '') }
            } : null,
            testResult: row.test_result || 'Pending Review',
            assignedOfficerName: meta.assignedOfficerName || '',
            assignedOfficerEmail: meta.assignedOfficerEmail || '',
            assignedOfficerId: meta.assignedOfficerId || '',
            reviewStage: meta.reviewStage || 'Document Verification',
            remarks: meta.remarks || '',
            isLiveDatabaseRecord: true
        };
    });

    // Merge into localStorage drivesetu_applications safely
    try {
        var existingApps = [];
        var rawLocal = localStorage.getItem('drivesetu_applications');
        if (rawLocal) existingApps = JSON.parse(rawLocal) || [];

        // Prepend new apps from live DB that aren't in localStorage, or update existing ones
        mappedApps.forEach(function(liveApp) {
            var idx = existingApps.findIndex(function(a) { return a.id === liveApp.id; });
            if (idx !== -1) {
                existingApps[idx] = Object.assign({}, existingApps[idx], liveApp);
            } else {
                existingApps.unshift(liveApp);
            }
        });

        localStorage.setItem('drivesetu_applications', JSON.stringify(existingApps));
    } catch(err) {}

    return mappedApps;
}

/**
 * Update Application Status directly in Supabase Database in Real-Time
 */
async function updateLiveApplicationStatus(applicationId, status, testResult = null) {
    if (!applicationId) return;
    try {
        const apiUrl = getApiBaseUrl() + '/api/update-application-status';
        const resp = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId, status, testResult })
        });
        if (resp.ok) {
            console.log(`✅ Application ${applicationId} status updated live in Supabase to: ${status}`);
        }
    } catch(e) {
        console.warn("Live status update warning:", e);
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

    try {
        const { data: rtoInfoRow } = await supabaseClient
            .from('rto_info')
            .select('*')
            .eq('officer_email', cleanEmail)
            .maybeSingle();

        if (rtoInfoRow) {
            if (!officerProfile) officerProfile = {};
            officerProfile.full_name = officerProfile.full_name || rtoInfoRow.officer_full_name;
            officerProfile.rto_code = officerProfile.rto_code || rtoInfoRow.rto_code;
            officerProfile.rto_name = officerProfile.rto_name || rtoInfoRow.rto_office_name;
            officerProfile.designation = officerProfile.designation || rtoInfoRow.officer_designation;
        }
    } catch(e) {}

    const meta = user.user_metadata || {};
    let rawRole = (officerProfile && officerProfile.role) || meta.role || '';
    let des = ((officerProfile && officerProfile.designation) || meta.designation || '').toUpperCase();
    
    let normalizedRole = 'REVIEWING_OFFICER';
    if (cleanEmail === 'admin@drivesetu.com' || rawRole === 'SUPER_ADMIN' || rawRole === 'ADMIN') {
        normalizedRole = 'SUPER_ADMIN';
    } else if (rawRole === 'TEST_CENTRE_OPERATOR' || rawRole.indexOf('OPERATOR') !== -1 || des.indexOf('OPERATOR') !== -1 || des.indexOf('TEST_CENTRE') !== -1 || des.indexOf('CAMERA') !== -1) {
        normalizedRole = 'TEST_CENTRE_OPERATOR';
    } else {
        normalizedRole = 'REVIEWING_OFFICER';
    }

    return {
        id: user.id,
        email: user.email,
        name: (officerProfile && officerProfile.full_name) || meta.full_name || cleanEmail.split('@')[0].toUpperCase(),
        role: normalizedRole,
        designation: (officerProfile && officerProfile.designation) || meta.designation || (normalizedRole === 'TEST_CENTRE_OPERATOR' ? 'Test Centre Operator' : 'RTO Reviewing Officer'),
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
        syncApplicationToSupabase,
        fetchLiveApplications,
        updateLiveApplicationStatus,
        getApiBaseUrl,
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
        syncApplicationToSupabase,
        fetchLiveApplications,
        updateLiveApplicationStatus,
        getApiBaseUrl,
        ADMIN_EMAILS
    };
}
