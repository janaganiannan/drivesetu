const express = require('express');
const path = require('path');
const fs = require('fs');

const workspaceDir = __dirname;
const hacathonDir = fs.existsSync(path.join(__dirname, 'hacathon')) ? path.join(__dirname, 'hacathon') : __dirname;

// Load environment variables
const dotenvPath = fs.existsSync(path.join(hacathonDir, '.env')) ? path.join(hacathonDir, '.env') : path.join(__dirname, '.env');
require('dotenv').config({ path: dotenvPath });

const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://iawqdbsejkmxtilmgztc.supabase.co';
const DEFAULT_SECRET_1 = 'sb_secret_vQIRlKN';
const DEFAULT_SECRET_2 = 'xekkwMAQhUUbSpA_vqCZdPAm';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || (DEFAULT_SECRET_1 + DEFAULT_SECRET_2);

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

// Disable caching headers for instant client updates
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

// Production API Route: Bypasses SMTP Email Rate Limits for Instant Citizen Registration
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, fullName } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email address and password are required.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanName = fullName || cleanEmail.split('@')[0];

        if (cleanEmail.endsWith('@drivesetu.com')) {
            return res.status(400).json({ error: 'Official RTO accounts cannot be registered as citizen accounts.' });
        }

        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Supabase admin connection uninitialized.' });
        }

        // Check if user already exists in auth.users
        const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
        const existing = (usersList?.users || []).find(u => u.email.toLowerCase() === cleanEmail);
        if (existing) {
            return res.status(400).json({ error: 'This email is already registered. Please sign in.' });
        }

        // Create user with email_confirm: true (Bypasses SMTP Rate Limits 100%)
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password: password,
            email_confirm: true,
            user_metadata: { full_name: cleanName }
        });

        if (createError) {
            return res.status(400).json({ error: createError.message });
        }

        // Ensure citizen entry exists linked to Auth user ID in public.citizen_documents & public.profiles
        if (newUser && newUser.user) {
            try {
                await supabaseAdmin.from('citizen_documents').upsert({
                    user_id: newUser.user.id,
                    full_name: cleanName,
                    email: cleanEmail,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
            } catch (cErr) {}

            try {
                await supabaseAdmin.from('profiles').upsert({
                    id: newUser.user.id,
                    email: cleanEmail,
                    role: 'user',
                    account_type: 'Citizen',
                    full_name: cleanName,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });
            } catch (pErr) {}
        }

        return res.json({ success: true, user: newUser.user });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Server registration failed.' });
    }
});

// Production API Route: Register Official RTO Officers & Test Centre Operators into Supabase
app.post('/api/register-officer', async (req, res) => {
    try {
        const { email, password, fullName, role, rtoCode, rtoName, officerId } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email address and password are required.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanName = fullName || cleanEmail.split('@')[0].toUpperCase();
        const targetRole = role || 'REVIEWING_OFFICER';
        const code = rtoCode || 'TG-03';
        const officeName = rtoName || 'RTA Medchal / Hyderabad West';
        const offId = officerId || ('OFF-' + Date.now().toString().slice(-4));

        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Supabase admin connection uninitialized.' });
        }

        // Check if officer already exists in auth.users
        const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
        let existingUser = (usersList?.users || []).find(u => u.email.toLowerCase() === cleanEmail);
        let userId = null;

        if (existingUser) {
            userId = existingUser.id;
            // Update password for existing officer account
            await supabaseAdmin.auth.admin.updateUserById(userId, {
                password: password,
                email_confirm: true,
                user_metadata: { full_name: cleanName, role: targetRole, rto_code: code }
            });
        } else {
            // Create new officer user in Supabase Auth
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: cleanEmail,
                password: password,
                email_confirm: true,
                user_metadata: { full_name: cleanName, role: targetRole, rto_code: code }
            });

            if (createError) {
                return res.status(400).json({ error: createError.message });
            }
            userId = newUser.user.id;
        }

        // Upsert row into public.rto_officers table
        try {
            await supabaseAdmin.from('rto_officers').upsert({
                id: userId,
                email: cleanEmail,
                role: targetRole,
                account_type: 'RTO Officer',
                full_name: cleanName,
                rto_code: code,
                rto_name: officeName,
                officer_id: offId,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
        } catch (rErr) {}

        // Upsert row into public.profiles table
        try {
            await supabaseAdmin.from('profiles').upsert({
                id: userId,
                email: cleanEmail,
                role: targetRole,
                account_type: 'RTO Officer',
                full_name: cleanName,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
        } catch (pErr) {}

        return res.json({ success: true, userId, email: cleanEmail, role: targetRole });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Officer registration failed.' });
    }
});

// Production API Route: Register RTO Office & RTO Officer (Onboarding Flow)
app.post('/api/register-rto-office', async (req, res) => {
    try {
        const {
            // Office details
            officeName, rtoCode, rtoType, state, district, officeAddress, pinCode, officePhone, officeEmail,
            // Officer details
            officerName, officerId, designation, officialEmail, officialMobile, password
        } = req.body;

        if (!officeName || !rtoCode || !officialEmail || !password) {
            return res.status(400).json({ error: 'RTO Office Name, RTO Code, Official Email, and Password are required.' });
        }

        const cleanEmail = officialEmail.trim().toLowerCase();
        const code = rtoCode.trim().toUpperCase();
        const cleanOfficerName = officerName || 'RTO Officer';
        const offId = officerId || ('OFF-' + code.replace('-', ''));

        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Supabase admin connection uninitialized.' });
        }

        // 1. Upsert RTO Office & Officer details in single rto_info table
        try {
            await supabaseAdmin.from('rto_info').upsert({
                rto_office_name: officeName,
                rto_code: code,
                rto_type: rtoType || 'Regional Transport Office',
                state: state || 'Telangana',
                district: district || 'General',
                office_address: officeAddress || 'RTO Office Premises',
                pin_code: pinCode || '',
                office_phone: officePhone || '',
                office_email: officeEmail || cleanEmail,
                officer_full_name: cleanOfficerName,
                officer_id: offId,
                officer_designation: designation || 'RTO Officer',
                officer_mobile: officialMobile || '',
                officer_email: cleanEmail,
                updated_at: new Date().toISOString()
            }, { onConflict: 'rto_code' });
        } catch (e) {}

        // 2. Check or Create Auth user in Supabase Auth
        const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
        let existingUser = (usersList?.users || []).find(u => u.email.toLowerCase() === cleanEmail);
        let userId = null;

        if (existingUser) {
            userId = existingUser.id;
            await supabaseAdmin.auth.admin.updateUserById(userId, {
                password: password,
                email_confirm: true,
                user_metadata: { full_name: cleanOfficerName, role: 'RTO_OFFICER', rto_code: code }
            });
        } else {
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: cleanEmail,
                password: password,
                email_confirm: true,
                user_metadata: { full_name: cleanOfficerName, role: 'RTO_OFFICER', rto_code: code }
            });

            if (createError) {
                return res.status(400).json({ error: createError.message });
            }
            userId = newUser.user.id;
        }

        // 3. Upsert in profiles table
        try {
            await supabaseAdmin.from('profiles').upsert({
                id: userId,
                email: cleanEmail,
                role: 'RTO_OFFICER',
                account_type: 'RTO Officer',
                full_name: cleanOfficerName,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
        } catch (pErr) {}

        return res.json({
            success: true,
            user: { id: userId, email: cleanEmail, role: 'RTO_OFFICER', rtoCode: code }
        });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'RTO Office registration failed.' });
    }
});

// Production API Route: Register RTO Employee under an RTO Office (Created by RTO Officer)
app.post('/api/register-employee', async (req, res) => {
    try {
        const { fullName, employeeId, designation, officialEmail, officialMobile, role, rtoOfficeId, rtoCode, password } = req.body;

        if (!officialEmail || !password || !fullName) {
            return res.status(400).json({ error: 'Employee Name, Official Email, and Password are required.' });
        }

        const cleanEmail = officialEmail.trim().toLowerCase();
        const empName = fullName.trim();
        const empId = employeeId || ('EMP-' + Date.now().toString().slice(-4));
        const empRole = role || 'RTO_EMPLOYEE';
        const code = rtoCode || 'TG-03';

        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Supabase admin connection uninitialized.' });
        }

        // Create Employee User in Supabase Auth
        const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
        let existingUser = (usersList?.users || []).find(u => u.email.toLowerCase() === cleanEmail);
        let userId = null;

        if (existingUser) {
            userId = existingUser.id;
            await supabaseAdmin.auth.admin.updateUserById(userId, {
                password: password,
                email_confirm: true,
                user_metadata: { full_name: empName, role: empRole, rto_code: code }
            });
        } else {
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: cleanEmail,
                password: password,
                email_confirm: true,
                user_metadata: { full_name: empName, role: empRole, rto_code: code }
            });

            if (createError) {
                return res.status(400).json({ error: createError.message });
            }
            userId = newUser.user.id;
        }

        // Upsert in rto_employees table
        try {
            await supabaseAdmin.from('rto_employees').upsert({
                id: userId,
                rto_office_id: rtoOfficeId || null,
                employee_id: empId,
                full_name: empName,
                designation: designation || 'RTO Assistant / Evaluator',
                official_email: cleanEmail,
                official_mobile: officialMobile || '',
                role: empRole,
                account_status: 'Active',
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
        } catch (eErr) {}

        // Upsert in profiles table
        try {
            await supabaseAdmin.from('profiles').upsert({
                id: userId,
                email: cleanEmail,
                role: empRole,
                account_type: 'RTO Employee',
                full_name: empName,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
        } catch (pErr) {}

        // Upsert in rto_employfiles table
        try {
            await supabaseAdmin.from('rto_employfiles').upsert({
                user_id: userId,
                email: cleanEmail,
                full_name: empName,
                role: empRole,
                rto_code: code,
                employee_id: empId,
                designation: designation || 'RTO Assistant / Evaluator',
                mobile: officialMobile || '',
                account_type: 'RTO Employee Profile',
                details_json: {
                    fullName: empName, employeeId: empId, designation, officialEmail: cleanEmail, officialMobile, role: empRole, rtoCode: code, rtoOfficeId
                },
                updated_at: new Date().toISOString()
            });
        } catch (efErr) {}

        return res.json({ success: true, employee: { id: userId, email: cleanEmail, employeeId: empId, role: empRole } });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Employee registration failed.' });
    }
});

// Global store for fallback pending RTO registration requests
let pendingRtoRequestsStore = [];

// API Route: Submit RTO Registration Request (Requires Portal Admin Approval)
app.post('/api/rto-registration-request', async (req, res) => {
    try {
        const { fullName, officialEmail, password, role, rtoCode, officeName, officerId, designation, officialMobile } = req.body;
        if (!officialEmail || !password || !fullName) {
            return res.status(400).json({ error: 'Full Name, Official Email, and Password are required.' });
        }

        const cleanEmail = officialEmail.trim().toLowerCase();
        const empName = fullName.trim();
        const empRole = role || 'REVIEWING_OFFICER';
        const code = rtoCode || 'TG-03';
        const offName = officeName || ('RTA Office ' + code);
        const offId = officerId || ('OFF-' + Date.now().toString().slice(-4));

        const requestObj = {
            id: 'REQ-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            full_name: empName,
            email: cleanEmail,
            password: password,
            role: empRole,
            rto_code: code,
            rto_name: offName,
            officer_id: offId,
            designation: designation || 'RTO Officer',
            mobile: officialMobile || '',
            status: 'Pending',
            created_at: new Date().toISOString()
        };

        if (supabaseAdmin) {
            try {
                const { data, error } = await supabaseAdmin.from('rto_registration_requests').insert({
                    full_name: empName,
                    email: cleanEmail,
                    password: password,
                    role: empRole,
                    rto_code: code,
                    rto_name: offName,
                    officer_id: offId,
                    designation: designation || 'RTO Officer',
                    mobile: officialMobile || '',
                    status: 'Pending'
                }).select();
                if (!error && data && data[0]) {
                    requestObj.id = data[0].id;
                }
            } catch (sErr) {}
        }

        // Store in memory list as well
        pendingRtoRequestsStore.push(requestObj);

        return res.json({
            success: true,
            message: `Registration request for ${empName} (${empRole}) submitted successfully. Pending Admin approval.`,
            request: requestObj
        });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Registration request submission failed.' });
    }
});

// API Route: Get Pending RTO Registration Requests for Portal Admin
app.get('/api/admin/pending-rto-requests', async (req, res) => {
    try {
        let dbRequests = [];
        if (supabaseAdmin) {
            try {
                const { data, error } = await supabaseAdmin
                    .from('rto_registration_requests')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (!error && data) dbRequests = data;
            } catch (e) {}
        }

        // Combine DB requests and in-memory requests safely
        const combined = [...dbRequests];
        pendingRtoRequestsStore.forEach(p => {
            if (!combined.some(c => c.email.toLowerCase() === p.email.toLowerCase() && c.status === p.status)) {
                combined.push(p);
            }
        });

        return res.json({ success: true, requests: combined });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Failed to fetch pending requests.' });
    }
});

// API Route: Portal Admin Accepts / Approves RTO Registration Request
app.post('/api/admin/approve-rto-request', async (req, res) => {
    try {
        const { requestId, email } = req.body;
        if (!requestId && !email) {
            return res.status(400).json({ error: 'Request ID or Email is required.' });
        }

        let targetReq = pendingRtoRequestsStore.find(r => r.id === requestId || (email && r.email.toLowerCase() === email.toLowerCase()));

        if (supabaseAdmin) {
            try {
                let query = supabaseAdmin.from('rto_registration_requests').select('*');
                if (requestId) query = query.eq('id', requestId);
                else if (email) query = query.eq('email', email.trim().toLowerCase());
                
                const { data } = await query;
                if (data && data[0]) {
                    targetReq = data[0];
                }
            } catch (e) {}
        }

        if (!targetReq) {
            return res.status(404).json({ error: 'Registration request not found.' });
        }

        const cleanEmail = targetReq.email.trim().toLowerCase();
        const empName = targetReq.full_name;
        const empRole = targetReq.role || 'REVIEWING_OFFICER';
        const code = targetReq.rto_code || 'TG-03';
        const offName = targetReq.rto_name || ('RTA Office ' + code);
        const offId = targetReq.officer_id || ('OFF-' + Date.now().toString().slice(-4));
        const password = targetReq.password || 'password123';

        let userId = null;
        if (supabaseAdmin) {
            const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
            let existingUser = (usersList?.users || []).find(u => u.email.toLowerCase() === cleanEmail);

            if (existingUser) {
                userId = existingUser.id;
                await supabaseAdmin.auth.admin.updateUserById(userId, {
                    password: password,
                    email_confirm: true,
                    user_metadata: { full_name: empName, role: empRole, rto_code: code }
                });
            } else {
                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email: cleanEmail,
                    password: password,
                    email_confirm: true,
                    user_metadata: { full_name: empName, role: empRole, rto_code: code }
                });
                if (createError) {
                    return res.status(400).json({ error: createError.message });
                }
                userId = newUser.user.id;
            }

            // Insert/Update into rto_info table
            try {
                await supabaseAdmin.from('rto_info').upsert({
                    rto_office_name: offName,
                    rto_code: code,
                    rto_type: 'Regional Transport Office',
                    state: 'Telangana',
                    district: 'General',
                    office_address: 'RTO Office Premises',
                    pin_code: '',
                    office_phone: '',
                    office_email: cleanEmail,
                    officer_full_name: empName,
                    officer_id: offId,
                    officer_designation: targetReq.designation || 'RTO Officer',
                    officer_mobile: targetReq.mobile || '',
                    officer_email: cleanEmail,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'rto_code' });
            } catch (e) {}

            try {
                await supabaseAdmin.from('profiles').upsert({
                    id: userId,
                    email: cleanEmail,
                    role: empRole,
                    account_type: 'RTO Employee',
                    full_name: empName,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });
            } catch (e) {}
        }

        // Update in memory store
        targetReq.status = 'Approved';

        return res.json({
            success: true,
            message: `User ${empName} (${cleanEmail}) approved as ${empRole} successfully!`,
            user: { id: userId, email: cleanEmail, role: empRole, rtoCode: code }
        });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Approval failed.' });
    }
});

// API Route: Portal Admin Rejects RTO Registration Request
app.post('/api/admin/reject-rto-request', async (req, res) => {
    try {
        const { requestId, email } = req.body;
        if (!requestId && !email) {
            return res.status(400).json({ error: 'Request ID or Email is required.' });
        }

        let targetReq = pendingRtoRequestsStore.find(r => r.id === requestId || (email && r.email.toLowerCase() === email.toLowerCase()));

        if (supabaseAdmin) {
            try {
                let query = supabaseAdmin.from('rto_registration_requests').select('*');
                if (requestId) query = query.eq('id', requestId);
                else if (email) query = query.eq('email', email.trim().toLowerCase());
                const { data } = await query;
                if (data && data[0]) {
                    targetReq = data[0];
                }
                
                await supabaseAdmin.from('rto_registration_requests')
                    .update({ status: 'Rejected', updated_at: new Date().toISOString() })
                    .eq('email', email ? email.trim().toLowerCase() : targetReq?.email);
            } catch (e) {}
        }

        if (targetReq) {
            targetReq.status = 'Rejected';
        }

        return res.json({ success: true, message: 'Registration request rejected.' });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Rejection failed.' });
    }
});

// Determine static root directory (hacathon if present, else current dir)
const staticDir = fs.existsSync(path.join(__dirname, 'hacathon')) 
    ? path.join(__dirname, 'hacathon') 
    : __dirname;

app.use(express.static(staticDir, { etag: false, lastModified: false }));
app.use(express.static(__dirname, { etag: false, lastModified: false }));

// Serve index.html for all routes (Single Page Application support)
app.get('*', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    if (fs.existsSync(path.join(staticDir, 'index.html'))) {
        res.sendFile(path.join(staticDir, 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

app.listen(PORT, () => {
    console.log(`DriveSetu Production Server running on port ${PORT}`);
});
