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
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
    : null;

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

        // Ensure profile entry exists linked to Auth user ID
        if (newUser && newUser.user) {
            await supabaseAdmin.from('profiles').upsert({
                id: newUser.user.id,
                email: cleanEmail,
                role: 'user',
                full_name: cleanName,
                updated_at: new Date().toISOString()
            });
        }

        return res.json({ success: true, user: newUser.user });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Server registration failed.' });
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
