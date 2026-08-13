// ─── MOCK DATA ───
var applications = [
    { id: 'APP-101', name: 'Rahul Sharma', type: "Learner's Licence", status: 'Pending', date: '10 Jul 2026' },
    { id: 'APP-102', name: 'Priya Singh', type: 'Permanent Licence', status: 'Approved', date: '12 Jul 2026' },
    { id: 'APP-103', name: 'Amit Kumar', type: 'Renewal', status: 'Pending', date: '14 Jul 2026' },
    { id: 'APP-104', name: 'Sunita Devi', type: 'Duplicate', status: 'Approved', date: '15 Jul 2026' },
];

// ─── CITIZEN USER ACCOUNTS ───
// Each citizen email maps to their personal profile used in the Upload Test Reports page
var citizenUsers = [
    {
        email: 'citizen@drivesetu.com',
        password: 'citizen123',
        name: 'Rahul Sharma',
        appId: 'APP-101',
        licenceType: "Learner's Licence",
        testDate: '10 Jul 2026',
        initials: 'RS',
        archivedDocs: []  // personal upload history - starts empty
    },
    {
        email: 'priya@drivesetu.com',
        password: 'priya123',
        name: 'Priya Singh',
        appId: 'APP-102',
        licenceType: 'Permanent Licence',
        testDate: '12 Jul 2026',
        initials: 'PS',
        archivedDocs: [
            { appId: 'APP-102', mp4: 'APP102_Track.mp4 (28.1MB)', pdf: 'APP102_AIReport.pdf (1.6MB)', date: '12 Jul 2026', status: 'Verified' }
        ]
    },
    {
        email: 'amit@drivesetu.com',
        password: 'amit123',
        name: 'Amit Kumar',
        appId: 'APP-103',
        licenceType: 'Renewal',
        testDate: '14 Jul 2026',
        initials: 'AK',
        archivedDocs: []
    },
];

// ─── SHARED PERSISTENCE HELPERS (citizen uploads ↔ RTO admin) ───
function getStoredReviews() {
    var saved = localStorage.getItem('drivesetu_pending_reviews');
    if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
    }
    var defaults = [
        {
            appId: 'APP-101',
            candidateName: 'Rahul Sharma',
            licenceType: "Learner's Licence",
            mp4Name: 'APP101_TrackTest_Cam01.mp4 (24.8MB)',
            pdfName: 'RTO_AI_Report_APP101.pdf (1.4MB)',
            notes: 'Parallel parking and 8-track verified',
            submittedOn: '10 Jul 2026',
            status: 'Pending Review',
            reviewedBy: null
        },
        {
            appId: 'APP-102',
            candidateName: 'Priya Singh',
            licenceType: 'Permanent Licence',
            mp4Name: 'APP102_Track.mp4 (28.1MB)',
            pdfName: 'APP102_AIReport.pdf (1.6MB)',
            notes: 'AI Track Test passed 98% clean',
            submittedOn: '12 Jul 2026',
            status: 'Approved',
            reviewedBy: 'RTO Officer'
        }
    ];
    localStorage.setItem('drivesetu_pending_reviews', JSON.stringify(defaults));
    return defaults;
}

function saveStoredReviews(reviews) {
    try {
        localStorage.setItem('drivesetu_pending_reviews', JSON.stringify(reviews));
    } catch(e) {
        // Strip heavy base64 strings to prevent QuotaExceededError while saving metadata
        var cleanReviews = reviews.map(function(r) {
            var clone = Object.assign({}, r);
            delete clone.videoDataUrl;
            delete clone.pdfDataUrl;
            return clone;
        });
        try {
            localStorage.setItem('drivesetu_pending_reviews', JSON.stringify(cleanReviews));
        } catch(e2) {}
    }
}

function getStoredApplications() {
    var saved = localStorage.getItem('drivesetu_applications');
    if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
    }
    localStorage.setItem('drivesetu_applications', JSON.stringify(applications));
    return applications;
}

function saveStoredApplications(apps) {
    localStorage.setItem('drivesetu_applications', JSON.stringify(apps));
}

// ─── MODAL STATE ───
var activeReviewModalAppId = null;
var isDeclineBoxVisible = false;

// ─── STATE ───
var currentCaptcha = '';
var otpSent = false;
var generatedOTP = '';

// ─── ROUTER ───
var appDiv = document.getElementById('app');

function render() {
    var hash = window.location.hash || '#home';
    var isRTOAll = hash === '#rto' || hash === '#rto-all';
    var isRTOApproved = hash === '#rto-approved';
    var isRTOPending = hash === '#rto-pending';
    var isRTOReports = hash === '#rto-reports';
    var isRTODocReview = hash === '#rto-docreview';
    var isRTO = isRTOAll || isRTOApproved || isRTOPending || isRTOReports || isRTODocReview;

    var isCitizen = hash === '#citizen';
    var isCitizenTrack = hash === '#citizen-track';
    var isUploadDocs = hash === '#upload-docs';
    var isCitizenLogin = hash === '#citizen-login';
    var isRTOLogin = hash === '#rto-login';
    var isHome = hash === '#home' || hash === '';

    // Sidebar nav items
    var citizenNavItems = [
        { icon: 'fa-solid fa-gauge', label: 'Dashboard', hash: '#home' },
        { icon: 'fa-solid fa-id-card', label: 'Apply for Licence', hash: '#citizen', active: isCitizen },
        { icon: 'fa-solid fa-magnifying-glass', label: 'Track Status', hash: '#citizen-track', active: isCitizenTrack },
        { icon: 'fa-solid fa-cloud-arrow-up', label: 'Upload Test Reports', hash: '#upload-docs', active: isUploadDocs },
    ];

    // Fetch fresh stored reviews & applications
    var pendingReviews = getStoredReviews();
    var storedApps = getStoredApplications();

    var rtoNavItems = [
        { icon: 'fa-solid fa-gauge', label: 'Dashboard', hash: '#home' },
        { icon: 'fa-solid fa-list-check', label: 'All Applications', hash: '#rto', active: isRTOAll },
        { icon: 'fa-solid fa-circle-check', label: 'Approved', hash: '#rto-approved', active: isRTOApproved },
        { icon: 'fa-solid fa-clock', label: 'Pending Review', hash: '#rto-pending', active: isRTOPending },
        { icon: 'fa-solid fa-chart-pie', label: 'Reports', hash: '#rto-reports', active: isRTOReports },
        { icon: 'fa-solid fa-folder-arrow-up', label: 'Document Reviews', hash: '#rto-docreview', active: isRTODocReview, badge: pendingReviews.filter(function(r){ return r.status === 'Pending Review'; }).length || null },
    ];

    var homeNavItems = [
        { icon: 'fa-solid fa-house', label: 'Home', hash: '#home', active: true },
        { icon: 'fa-solid fa-user', label: 'Citizen Portal', hash: '#citizen-login' },
        { icon: 'fa-solid fa-user-shield', label: 'RTO Portal', hash: '#rto-login' },
    ];

    var navItems = isRTO ? rtoNavItems : (isCitizen || isCitizenTrack || isUploadDocs) ? citizenNavItems : homeNavItems;
    // Inject pending badge count into nav HTML
    var _pendingBadge = pendingReviews.filter(function(r){ return r.status === 'Pending Review'; }).length;
    var _cs = sessionStorage.getItem('citizenSession') ? JSON.parse(sessionStorage.getItem('citizenSession')) : null;
    var userInfo = isRTO
        ? { initials: 'RO', name: 'RTO Officer', role: 'Admin' }
        : _cs
        ? { initials: _cs.initials, name: _cs.name, role: 'Citizen (' + _cs.appId + ')' }
        : { initials: 'CZ', name: 'Citizen', role: 'User' };
    var pageTitle = isRTODocReview ? 'Document Reviews' : isRTOReports ? 'Reports & Analytics' : isRTOApproved ? 'Approved Applications' : isRTOPending ? 'Pending Review Queue' : isRTO ? 'RTO Dashboard' : isUploadDocs ? 'Upload Driving Test Documents' : isCitizenTrack ? 'Track Status' : isCitizen ? 'Citizen Portal' : 'Home';
    var breadcrumb = isRTOReports
        ? 'Dashboard / RTO Portal / <span>Reports</span>'
        : isRTOApproved
        ? 'Dashboard / RTO Portal / <span>Approved</span>'
        : isRTOPending
        ? 'Dashboard / RTO Portal / <span>Pending Review</span>'
        : isRTO
        ? 'Dashboard / <span>RTO Portal</span>'
        : isUploadDocs
        ? 'Dashboard / Citizen Portal / <span>Upload Test Reports</span>'
        : isCitizenTrack
        ? 'Dashboard / Citizen Portal / <span>Track Status</span>'
        : isCitizen
        ? 'Dashboard / <span>Citizen Portal</span>'
        : isRTODocReview
        ? 'Dashboard / RTO Portal / <span>Document Reviews</span>'
        : '<span>Dashboard</span>';

    var navHTML = navItems.map(function(item) {
        var badgeHtml = (item.badge && item.badge > 0)
            ? ' <span style="background:#e53e3e;color:#fff;border-radius:10px;padding:1px 7px;font-size:0.68rem;font-weight:700;margin-left:4px;">' + item.badge + '</span>'
            : '';
        return '<a href="' + item.hash + '" class="nav-item ' + (item.active ? 'active' : '') + '">' +
            '<i class="' + item.icon + '"></i> ' + item.label + badgeHtml + '</a>';
    }).join('');

    // ── LOGIN PAGES (no sidebar layout) ──
    if (isCitizenLogin || isRTOLogin) {
        var loginType = isCitizenLogin ? 'Citizen' : 'RTO Admin';
        var loginIcon = isCitizenLogin ? 'ph-user' : 'ph-shield-check';
        var loginTarget = isCitizenLogin ? 'citizen' : 'rto';
        var loginColor = isCitizenLogin ? 'var(--primary)' : 'var(--primary-dark)';
        var defaultEmail = isCitizenLogin ? 'citizen@drivesetu.com' : 'admin@drivesetu.com';
        var defaultPass = isCitizenLogin ? 'citizen123' : 'admin123';

        var loginHTML = '';
        loginHTML += '<div class="login-page">';
        loginHTML += '<div class="login-container animate-in">';
        loginHTML += '<div class="login-header">';
        loginHTML += '<div class="login-brand" style="cursor:pointer;" id="loginBrandBtn">';
        loginHTML += '<div class="brand-icon" style="width:40px;height:40px;font-size:1.3rem;"><i class="ph ph-steering-wheel"></i></div>';
        loginHTML += '<span style="font-size:1.3rem;">DriveSetu</span>';
        loginHTML += '</div></div>';
        loginHTML += '<div class="login-card">';
        loginHTML += '<div class="login-avatar" style="background:' + loginColor + ';"><i class="ph ' + loginIcon + '" style="font-size:1.8rem; color:#fff;"></i></div>';
        loginHTML += '<h2 class="login-title">' + loginType + ' Login</h2>';
        loginHTML += '<p class="login-subtitle">Enter your credentials to access the ' + loginType + ' Portal</p>';
        loginHTML += '<form id="loginForm">';
        loginHTML += '<div class="form-group"><label>Email Address</label><input type="email" id="loginEmail" placeholder="Enter your email" required></div>';
        loginHTML += '<div class="form-group"><label>Password</label><input type="password" id="loginPassword" placeholder="Enter your password" required></div>';
        loginHTML += '<div class="login-options">';
        loginHTML += '<label class="remember-me"><input type="checkbox" checked> Remember me</label>';
        loginHTML += '<a href="javascript:void(0)" class="forgot-link" id="forgotBtn">Forgot password?</a>';
        loginHTML += '</div>';
        loginHTML += '<button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding:0.75rem; font-size:0.95rem;"><i class="ph ' + loginIcon + '"></i> Sign In</button>';
        loginHTML += '</form>';
        loginHTML += '<div class="login-footer"><p style="margin-top:1.25rem;">Don\'t have an account? <a href="javascript:void(0)" id="registerBtn">Register here</a></p></div>';
        loginHTML += '</div>';
        loginHTML += '<button class="btn btn-back" style="margin-top:1.25rem;" id="backHomeBtn"><i class="ph ph-arrow-left"></i> Back to Home</button>';
        loginHTML += '</div></div>';

        appDiv.innerHTML = loginHTML;

        document.getElementById('loginBrandBtn').onclick = function() { window.location.hash = 'home'; };
        document.getElementById('backHomeBtn').onclick = function() { window.location.hash = 'home'; };
        document.getElementById('forgotBtn').onclick = function() { alert('A password reset link has been sent to your registered email address.'); };
        document.getElementById('registerBtn').onclick = function() { alert('Please visit your nearest RTO office to register your account.'); };
        
        document.getElementById('loginForm').onsubmit = function(e) {
            e.preventDefault();
            var email = document.getElementById('loginEmail').value.trim();
            var password = document.getElementById('loginPassword').value.trim();

            if (loginTarget === 'citizen') {
                // Look up in citizenUsers table for personalised session
                var matchedUser = null;
                for (var i = 0; i < citizenUsers.length; i++) {
                    if (citizenUsers[i].email === email && citizenUsers[i].password === password) {
                        matchedUser = citizenUsers[i];
                        break;
                    }
                }
                if (matchedUser) {
                    // Store logged-in citizen in sessionStorage (excluding password)
                    sessionStorage.setItem('citizenSession', JSON.stringify({
                        email: matchedUser.email,
                        name: matchedUser.name,
                        appId: matchedUser.appId,
                        licenceType: matchedUser.licenceType,
                        testDate: matchedUser.testDate,
                        initials: matchedUser.initials
                    }));
                    window.location.hash = 'citizen';
                } else {
                    alert('Invalid credentials!\n\nYou can log in with:\n  citizen@drivesetu.com / citizen123\n  priya@drivesetu.com / priya123\n  amit@drivesetu.com / amit123');
                }
            } else {
                // RTO admin login
                if (email === 'admin@drivesetu.com' && password === 'admin123') {
                    sessionStorage.setItem('rtoSession', '1');
                    window.location.hash = 'rto';
                } else {
                    alert('Invalid credentials!\n\nDefault Email: admin@drivesetu.com\nDefault Password: admin123');
                }
            }
        };
        return;
    }

    // Page content
    var pageContent = '';

    if (isHome) {
        pageContent = '' +
            '<div class="home-hero animate-in">' +
                '<h1>Transparent RTO Portal</h1>' +
                '<p>Apply for your driving licence directly — no agents, no middlemen, no hidden fees. Complete transparency at every step.</p>' +
                '<div class="hero-btns">' +
                    '<button class="btn btn-hero-white" onclick="window.location.hash=\'citizen-login\'"><i class="ph ph-user"></i> Apply as Citizen</button>' +
                    '<button class="btn btn-hero-outline" onclick="window.location.hash=\'rto-login\'"><i class="ph ph-shield-check"></i> RTO Admin Login</button>' +
                '</div>' +
            '</div>' +
            '<div class="stats-row animate-in" style="animation-delay:0.05s">' +
                '<div class="stat-card"><div class="stat-icon"><i class="ph ph-files"></i></div><div><div class="stat-value">1,240</div><div class="stat-label">Total Applications</div></div></div>' +
                '<div class="stat-card"><div class="stat-icon"><i class="ph ph-check-circle"></i></div><div><div class="stat-value">986</div><div class="stat-label">Approved</div></div></div>' +
                '<div class="stat-card"><div class="stat-icon"><i class="ph ph-clock"></i></div><div><div class="stat-value">254</div><div class="stat-label">Pending Review</div></div></div>' +
                '<div class="stat-card"><div class="stat-icon"><i class="ph ph-users"></i></div><div><div class="stat-value">14</div><div class="stat-label">RTO Officers</div></div></div>' +
            '</div>' +
            '<div style="margin-bottom:0.75rem; font-size:0.85rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em;">Quick Access</div>' +
            '<div class="grid-2 animate-in" style="animation-delay:0.1s; grid-template-columns:repeat(auto-fit,minmax(200px,1fr));">' +
                '<div class="feature-card" onclick="window.location.hash=\'citizen-login\'"><div class="feature-icon"><i class="ph ph-graduation-cap"></i></div><h3>Learner\'s Licence</h3><p>Apply for a learner\'s licence to start your driving journey.</p></div>' +
                '<div class="feature-card" onclick="window.location.hash=\'citizen-login\'"><div class="feature-icon"><i class="ph ph-car"></i></div><h3>Driving Licence</h3><p>Apply for a full permanent driving licence.</p></div>' +
                '<div class="feature-card" onclick="window.location.hash=\'citizen-login\'"><div class="feature-icon"><i class="ph ph-arrows-clockwise"></i></div><h3>Renewal</h3><p>Renew your expired or expiring driving licence.</p></div>' +
                '<div class="feature-card" onclick="window.location.hash=\'citizen-login\'"><div class="feature-icon"><i class="ph ph-globe"></i></div><h3>International Permit</h3><p>Get an International Driving Permit to drive abroad.</p></div>' +
            '</div>';
    }

    else if (isCitizen) {
        pageContent = '' +
            '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'home\'"><i class="fa-solid fa-arrow-left"></i> Back to Home</button></div>' +
            '<div class="animate-in" style="max-width:720px;">' +
                '<div class="card">' +
                    '<div class="card-title">Apply for Service <span class="badge badge-active"><i class="fa-solid fa-circle" style="font-size:0.5rem"></i> Online</span></div>' +
                    '<form id="applyForm" onsubmit="submitApplication(event)">' +
                        '<div class="form-group"><label>Full Name (as per Aadhaar)</label><input type="text" id="applicantName" placeholder="e.g. Rahul Kumar" required></div>' +
                        '<div class="form-group"><label>Mobile Number</label><input type="tel" id="mainMobile" placeholder="e.g. 9876543210" required></div>' +
                        '<div class="form-group"><label>Aadhaar Number</label><input type="text" placeholder="XXXX-XXXX-XXXX" required></div>' +
                        '<div class="form-group">' +
                            '<label>Licence Type / Service</label>' +
                            '<select id="licenseTypeSelect" required onchange="toggleLearnerFields()">' +
                                '<option value="">Select Type...</option>' +
                                '<option value="Learner\'s Licence">Learner\'s Licence</option>' +
                                '<option value="Driving Licence">Driving Licence</option>' +
                                '<option value="Additions of Class">Additions of Class</option>' +
                                '<option value="Permanent Licence">Permanent Licence</option>' +
                                '<option value="International Driving Permit">International Driving Permit</option>' +
                                '<option value="Renewal">Renewal</option>' +
                                '<option value="Duplicate">Duplicate</option>' +
                            '</select>' +
                        '</div>' +

                        '<!-- LEARNER FIELDS - hidden by default -->' +
                        '<div id="learnerFields" style="display:none;">' +
                            '<div style="color:var(--primary); font-size:0.85rem; margin-bottom:1.25rem; padding:0.75rem; background:var(--primary-light); border-radius:var(--radius-sm); border-left:3px solid var(--primary);">' +
                                '<i class="fa-solid fa-circle-info" style="margin-right:0.3rem;"></i> Please select District and Test Center to book slot for learner\'s licence test.' +
                            '</div>' +
                            '<div class="form-group"><label>District <span style="color:#ef4444">*</span></label>' +
                                '<select id="districtSelect" onchange="updateTestCenters()">' +
                                    '<option value="">SELECT</option>' +
                                    '<option>Hyderabad</option><option>Rangareddy</option><option>Medchal</option>' +
                                    '<option>Warangal</option><option>Karimnagar</option><option>Nizamabad</option>' +
                                    '<option>Khammam</option><option>Nalgonda</option><option>Adilabad</option><option>Mahabubnagar</option>' +
                                '</select>' +
                            '</div>' +
                            '<div class="form-group"><label>Test Center <span style="color:#ef4444">*</span></label>' +
                                '<select id="testCenterSelect"><option value="">SELECT</option></select>' +
                            '</div>' +
                            '<div class="form-group"><label>Mobile Number <span style="color:#ef4444">*</span></label>' +
                                '<div class="otp-row">' +
                                    '<input type="tel" id="learnerMobile" placeholder="Enter 10-digit mobile number" maxlength="10">' +
                                    '<button type="button" class="btn btn-primary" onclick="requestOTP()"><i class="fa-solid fa-paper-plane"></i> REQUEST FOR OTP</button>' +
                                '</div>' +
                            '</div>' +
                            '<div class="form-group" id="otpSection" style="display:none;"><label>Please Enter OTP Received <span style="color:#ef4444">*</span></label>' +
                                '<div class="otp-row">' +
                                    '<input type="text" id="otpInput" placeholder="Enter 6-digit OTP" maxlength="6">' +
                                    '<span style="font-size:0.78rem; color:var(--text-muted); flex-shrink:0;">(If OTP not received, click REQUEST FOR OTP again)</span>' +
                                '</div>' +
                                '<div id="otpStatus" style="margin-top:0.5rem;"></div>' +
                            '</div>' +
                            '<div class="form-group"><label>Captcha <span style="color:#ef4444">*</span></label>' +
                                '<div class="captcha-box">' +
                                    '<div class="captcha-display" id="captchaDisplay"></div>' +
                                    '<button type="button" class="captcha-refresh" onclick="generateCaptcha()" title="Refresh CAPTCHA"><i class="fa-solid fa-rotate-right"></i></button>' +
                                '</div>' +
                                '<div class="otp-row" style="margin-top:0.5rem;">' +
                                    '<input type="text" id="captchaInput" placeholder="ENTER CAPTCHA">' +
                                    '<button type="button" class="btn btn-ghost" onclick="clearCaptchaInput()">CLEAR</button>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +

                        '<div class="form-group"><label>Upload Address Proof (PDF/JPG)</label><input type="file" accept=".pdf,.jpg,.png"></div>' +
                        '<button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; margin-top:0.5rem;"><i class="fa-solid fa-paper-plane"></i> Submit Application</button>' +
                    '</form>' +
                '</div>' +
            '</div>';
    }

    else if (isCitizenTrack) {
        var userAppsRows = applications.map(function(app) {
            return '<tr style="cursor:pointer;" onclick="quickTrack(\'' + app.id + '\')">' +
                '<td><strong>' + app.id + '</strong></td>' +
                '<td>' + app.type + '</td>' +
                '<td><span class="badge ' + (app.status === 'Pending' ? 'badge-pending' : 'badge-approved') + '">' +
                    (app.status === 'Pending' ? '● Pending' : '✓ Approved') + '</span></td>' +
                '<td><button class="btn btn-ghost" style="padding:0.25rem 0.6rem; font-size:0.75rem;"><i class="fa-solid fa-magnifying-glass"></i> Track</button></td>' +
            '</tr>';
        }).join('');

        pageContent = '' +
            '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-arrow-left"></i> Back to Citizen Portal</button></div>' +
            '<div class="grid-2 animate-in" style="grid-template-columns: 1fr 1fr;">' +
                '<!-- Track Input Card -->' +
                '<div class="card">' +
                    '<div class="card-title">Track Application Status <span class="badge badge-active"><i class="fa-solid fa-circle" style="font-size:0.5rem"></i> Real-time</span></div>' +
                    '<div class="form-group"><label>Application Number</label><input type="text" id="trackInput" placeholder="e.g. APP-101"></div>' +
                    '<button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="trackStatus()"><i class="fa-solid fa-magnifying-glass"></i> Check Status</button>' +
                    '<div id="trackResult" style="margin-top:1.25rem; display:none;">' +
                        '<div style="background:var(--bg); border-radius:var(--radius-sm); padding:1.25rem; border:1px solid var(--border);">' +
                            '<div class="flex-between" style="margin-bottom:1rem;">' +
                                '<div><p style="font-weight:700; font-size:1rem;" id="trackName">-</p><p style="font-size:0.8rem; color:var(--text-muted);" id="trackType">-</p></div>' +
                                '<span class="badge badge-pending" id="trackBadge">Pending</span>' +
                            '</div>' +
                            '<div class="status-timeline" id="trackTimeline"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<!-- Recent Applications List -->' +
                '<div class="card">' +
                    '<div class="card-title">Recent Applications</div>' +
                    '<div style="overflow-x:auto;">' +
                        '<table class="data-table">' +
                            '<thead><tr><th>App ID</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>' +
                            '<tbody>' + userAppsRows + '</tbody>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    else if (isUploadDocs) {
        // ── Read current logged-in citizen from session ──
        var _uploadSession = sessionStorage.getItem('citizenSession')
            ? JSON.parse(sessionStorage.getItem('citizenSession'))
            : null;

        // If somehow not logged in, show a gentle gate
        if (!_uploadSession) {
            pageContent =
                '<div class="animate-in" style="max-width:480px; margin:3rem auto; text-align:center;">' +
                    '<div style="width:70px;height:70px;border-radius:50%;background:#e8f7f1;color:#1aab74;font-size:2rem;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem auto;"><i class="fa-solid fa-lock"></i></div>' +
                    '<h3 style="margin-bottom:0.5rem;">Login Required</h3>' +
                    '<p style="color:var(--text-muted);margin-bottom:1.25rem;">Please log in as a Citizen to access your Test Report uploads.</p>' +
                    '<button class="btn btn-primary" onclick="window.location.hash=\'citizen-login\'"><i class="fa-solid fa-right-to-bracket"></i> Go to Citizen Login</button>' +
                '</div>';
        } else {
            // Build archived docs rows – ONLY for this user from stored reviews
            var allReviews = getStoredReviews();
            var _myDocs = allReviews.filter(function(r) {
                return r.appId === _uploadSession.appId || r.candidateName === _uploadSession.name;
            });
            var _archiveRows = '';
            if (_myDocs.length === 0) {
                _archiveRows = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No documents archived yet. Upload your MP4 and PDF report above.</td></tr>';
            } else {
                for (var _di = 0; _di < _myDocs.length; _di++) {
                    var _d = _myDocs[_di];
                    var _stBadge = _d.status === 'Approved'
                        ? '<span class="badge badge-approved">✓ Approved</span>'
                        : _d.status === 'Rejected'
                        ? '<span class="badge badge-rejected" style="background:#fff0f0;color:#c53030;border:1px solid #feb2b2;">✗ Declined</span>'
                        : '<span class="badge badge-pending">⏳ Pending RTO Review</span>';
                    _archiveRows +=
                        '<tr>' +
                            '<td><strong>' + _d.appId + '</strong></td>' +
                            '<td><i class="fa-solid fa-file-video" style="color:#096dd9;"></i> ' + _d.mp4Name + '</td>' +
                            '<td><i class="fa-solid fa-file-pdf" style="color:#d46b08;"></i> ' + _d.pdfName + '</td>' +
                            '<td>' + _d.submittedOn + '</td>' +
                            '<td>' + _stBadge + '</td>' +
                        '</tr>';
                }
            }

            pageContent = '' +
                '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-arrow-left"></i> Back to Citizen Portal</button></div>' +

                // ── Personalised Banner ──
                '<div class="ai-header-banner animate-in">' +
                    '<div class="ai-banner-badge"><i class="fa-solid fa-cloud-arrow-up"></i> My Driving Test Documents</div>' +
                    '<h2>Upload Your Test Video (MP4) &amp; AI Report (PDF)</h2>' +
                    '<p style="opacity:0.92;">' +
                        '<i class="fa-solid fa-user" style="margin-right:0.4rem;"></i>' +
                        '<strong>' + _uploadSession.name + '</strong>' +
                        ' &nbsp;•&nbsp; Application: <strong>' + _uploadSession.appId + '</strong>' +
                        ' &nbsp;•&nbsp; ' + _uploadSession.licenceType +
                        ' &nbsp;•&nbsp; Test Date: ' + _uploadSession.testDate +
                    '</p>' +
                '</div>' +

                // ── Dual Upload Grid ──
                '<div class="grid-2 animate-in" style="grid-template-columns: 1fr 1fr; margin-bottom:1.25rem;">' +

                    // MP4 Card
                    '<div class="card">' +
                        '<div class="card-title flex-between">' +
                            '<span><i class="fa-solid fa-file-video" style="color:var(--primary); margin-right:0.4rem;"></i> MP4 Driving Test Video</span>' +
                            '<span class="badge badge-active" id="videoStatusBadge">Ready for Upload</span>' +
                        '</div>' +
                        '<div class="qr-dropzone" id="videoDropzone" onclick="triggerVideoUpload()">' +
                            '<div class="qr-icon-box" style="background:#e6f4ff; color:#096dd9;"><i class="fa-solid fa-video"></i></div>' +
                            '<h4>Drag &amp; Drop Your MP4 Video</h4>' +
                            '<p style="font-size:0.82rem; color:var(--text-muted); margin:0.3rem 0 0.8rem 0;">Supports .MP4, .WEBM, .AVI files of your driving test track footage (max 100MB)</p>' +
                            '<button class="btn btn-primary" type="button" onclick="event.stopPropagation(); triggerVideoUpload();"><i class="fa-solid fa-upload"></i> Browse Your Video File</button>' +
                            '<input type="file" id="videoFileInput" accept="video/mp4,video/webm,video/avi" style="display:none;" onchange="handleVideoFileSelect(event)">' +
                        '</div>' +
                        '<div class="preview-video-container" id="videoPreviewBox" style="margin-top:1rem;">' +
                            '<div class="video-overlay-header">' +
                                '<span class="cam-label"><i class="fa-solid fa-camera"></i> DRIVING TEST MP4 VIDEO PLAYER</span>' +
                                '<span class="telemetry-speed" id="uploadVideoSpeed">READY</span>' +
                            '</div>' +
                            '<div style="background:#0f1715; min-height:190px; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">' +
                                '<video id="uploadedVideoPlayer" controls style="width:100%; max-height:220px; object-fit:contain; display:none; background:#000;"></video>' +
                                '<div id="videoPlaceholderBox" style="text-align:center; color:#fff; padding:1.5rem 1rem;">' +
                                    '<div style="width:50px; height:50px; border-radius:50%; background:rgba(26,171,116,0.15); color:var(--primary); font-size:1.5rem; display:flex; align-items:center; justify-content:center; margin:0 auto 0.6rem auto; cursor:pointer;" onclick="triggerVideoUpload()">' +
                                        '<i class="fa-solid fa-file-video"></i>' +
                                    '</div>' +
                                    '<p style="font-size:0.85rem; font-weight:600; margin:0 0 0.2rem 0; color:#e2e8f0;">No MP4 Video Loaded Yet</p>' +
                                    '<p style="font-size:0.75rem; color:#94a3b8; margin:0;">Click "Browse Your Video File" above to load and play your MP4 test video</p>' +
                                '</div>' +
                            '</div>' +
                            '<div style="padding:0.75rem; background:#f8faf9; border-top:1px solid var(--border); font-size:0.78rem; color:var(--text-muted);" id="videoFileInfoText">' +
                                '<i class="fa-solid fa-info-circle"></i> No MP4 video selected yet.' +
                            '</div>' +
                        '</div>' +
                    '</div>' +

                    // PDF Card
                    '<div class="card">' +
                        '<div class="card-title flex-between">' +
                            '<span><i class="fa-solid fa-file-pdf" style="color:var(--primary); margin-right:0.4rem;"></i> PDF AI Analysis Report</span>' +
                            '<span class="badge badge-pending" id="pdfStatusBadge">Awaiting Upload</span>' +
                        '</div>' +
                        '<div class="qr-dropzone" id="pdfDropzone" onclick="triggerPdfUpload()">' +
                            '<div class="qr-icon-box" style="background:#fff7e6; color:#d46b08;"><i class="fa-solid fa-file-pdf"></i></div>' +
                            '<h4>Drag &amp; Drop Your PDF AI Report</h4>' +
                            '<p style="font-size:0.82rem; color:var(--text-muted); margin:0.3rem 0 0.8rem 0;">Upload the official RTO AI Evaluation PDF issued for your driving test</p>' +
                            '<button class="btn btn-primary" type="button" onclick="event.stopPropagation(); triggerPdfUpload();"><i class="fa-solid fa-upload"></i> Browse PDF Report</button>' +
                            '<input type="file" id="pdfFileInput" accept=".pdf" style="display:none;" onchange="handlePdfFileSelect(event)">' +
                        '</div>' +
                        '<div class="pdf-summary-card" id="pdfPreviewBox" style="margin-top:1rem; padding:1rem; background:#f4fbf8; border:1px solid #c2ead8; border-radius:var(--radius-md);">' +
                            '<div class="flex-between" style="margin-bottom:0.6rem;">' +
                                '<div>' +
                                    '<h4 style="font-size:0.95rem; font-weight:700; color:var(--text-main);" id="pdfDocName">No PDF report selected</h4>' +
                                    '<p style="font-size:0.78rem; color:var(--text-muted);" id="pdfCandidateMeta">Candidate: ' + _uploadSession.name + ' (' + _uploadSession.appId + ')</p>' +
                                '</div>' +
                                '<span class="badge badge-pending" id="pdfScoreBadge">Awaiting File</span>' +
                            '</div>' +
                            '<div style="margin-top:0.5rem; border-top:1px dashed #c2ead8; padding-top:0.5rem;">' +
                                '<iframe id="citizenPdfPreviewIframe" style="width:100%; height:240px; border:1px solid #bce3d4; border-radius:6px; background:#fff; display:none;"></iframe>' +
                                '<div id="pdfPlaceholderText" style="text-align:center; padding:1.5rem 0; color:var(--text-muted); font-size:0.8rem;">' +
                                    '<i class="fa-solid fa-file-pdf" style="font-size:2.2rem; color:#d46b08; display:block; margin-bottom:0.4rem;"></i>' +
                                    'Upload your PDF report above to preview the full document here.' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +

                '</div>' +

                // ── Submission Form ──
                '<div class="card animate-in" style="margin-bottom:1.25rem;">' +
                    '<div class="card-title"><i class="fa-solid fa-paper-plane" style="color:var(--primary); margin-right:0.4rem;"></i> Submit Your Documents for RTO Verification</div>' +
                    '<div class="grid-2" style="grid-template-columns: 1fr 1fr; gap:1rem;">' +
                        '<div class="form-group"><label>Your Application ID</label>' +
                            '<input type="text" id="uploadAppIdInput" value="' + _uploadSession.appId + '" readonly style="background:#f0f9f5; cursor:not-allowed; font-weight:600;">' +
                        '</div>' +
                        '<div class="form-group"><label>Your Name (Auto-filled)</label>' +
                            '<input type="text" id="uploadNameInput" value="' + _uploadSession.name + '" readonly style="background:#f0f9f5; cursor:not-allowed; font-weight:600;">' +
                        '</div>' +
                    '</div>' +
                    '<div class="form-group" style="margin-top:0.5rem;"><label>Additional Notes (Optional)</label>' +
                        '<input type="text" id="uploadNotesInput" placeholder="e.g. Attended RTO test on schedule, no violations...">' +
                    '</div>' +
                    '<div class="report-actions-row" style="margin-top:0.75rem;">' +
                        '<button class="btn btn-primary" type="button" onclick="submitUploadedReports()"><i class="fa-solid fa-cloud-arrow-up"></i> Submit &amp; Archive My Documents</button>' +
                        '<button class="btn btn-ghost" type="button" onclick="resetUploadForm()"><i class="fa-solid fa-rotate-left"></i> Reset</button>' +
                    '</div>' +
                '</div>' +

                // ── My Archive Table ──
                '<div class="card animate-in">' +
                    '<div class="card-title flex-between">' +
                        '<span><i class="fa-solid fa-vault" style="color:var(--primary); margin-right:0.4rem;"></i> My Archived Test Documents</span>' +
                        '<span class="badge badge-active"><i class="fa-solid fa-user"></i> ' + _uploadSession.name + '</span>' +
                    '</div>' +
                    '<div style="overflow-x:auto;">' +
                        '<table class="data-table">' +
                            '<thead><tr><th>App ID</th><th>MP4 Video File</th><th>PDF AI Report</th><th>Upload Date</th><th>Status</th></tr></thead>' +
                            '<tbody id="archivedDocsTableBody">' + _archiveRows + '</tbody>' +
                        '</table>' +
                    '</div>' +
                '</div>';
        }
    }

    else if (isRTODocReview) {
        // Build table rows from pendingReviews
        var _reviewRows = '';
        var _totalPending = 0, _totalApproved = 0, _totalRejected = 0;
        for (var _ri = 0; _ri < pendingReviews.length; _ri++) {
            var _r = pendingReviews[_ri];
            if (_r.status === 'Pending Review') _totalPending++;
            else if (_r.status === 'Approved') _totalApproved++;
            else if (_r.status === 'Rejected') _totalRejected++;
            var _statusBadge = _r.status === 'Approved'
                ? '<span class="badge badge-approved">✓ Approved</span>'
                : _r.status === 'Rejected'
                ? '<span class="badge badge-rejected" style="background:#fff0f0;color:#c53030;border:1px solid #feb2b2;">✗ Declined</span>'
                : '<span class="badge badge-pending">⏳ Pending Review</span>';
            var _actionBtns = '<button class="btn btn-primary" style="padding:0.3rem 0.75rem; font-size:0.78rem;" onclick="openReviewModal(\'' + _r.appId + '\')"><i class="fa-solid fa-eye"></i> Review</button>';
            _reviewRows +=
                '<tr>' +
                    '<td><strong>' + _r.appId + '</strong></td>' +
                    '<td>' +
                        '<div style="font-weight:600;">' + _r.candidateName + '</div>' +
                        '<div style="font-size:0.75rem;color:var(--text-muted);">' + _r.licenceType + '</div>' +
                    '</td>' +
                    '<td><i class="fa-solid fa-file-video" style="color:#096dd9;"></i> ' + _r.mp4Name + '</td>' +
                    '<td><i class="fa-solid fa-file-pdf" style="color:#d46b08;"></i> ' + _r.pdfName + '</td>' +
                    '<td>' + _r.submittedOn + '</td>' +
                    '<td>' + _r.notes + '</td>' +
                    '<td>' + _statusBadge + '</td>' +
                    '<td>' + _actionBtns + '</td>' +
                '</tr>';
        }
        if (_reviewRows === '') {
            _reviewRows = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:2rem;">' +
                '<i class="fa-solid fa-inbox" style="font-size:1.5rem; display:block; margin-bottom:0.5rem;"></i>' +
                'No documents submitted by citizens yet. They will appear here after citizen upload.</td></tr>';
        }

        pageContent = '' +
            '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'rto\'"><i class="fa-solid fa-arrow-left"></i> Back to RTO Dashboard</button></div>' +

            // Stats strip
            '<div class="stats-row animate-in" style="margin-bottom:1.25rem;">' +
                '<div class="stat-card"><div class="stat-icon" style="background:#fff7e6;color:#d46b08;"><i class="fa-solid fa-hourglass-half"></i></div><div><div class="stat-value">' + _totalPending + '</div><div class="stat-label">Pending Review</div></div></div>' +
                '<div class="stat-card"><div class="stat-icon" style="background:#e8f7f1;color:#1aab74;"><i class="fa-solid fa-circle-check"></i></div><div><div class="stat-value">' + _totalApproved + '</div><div class="stat-label">Approved</div></div></div>' +
                '<div class="stat-card"><div class="stat-icon" style="background:#fff0f0;color:#c53030;"><i class="fa-solid fa-circle-xmark"></i></div><div><div class="stat-value">' + _totalRejected + '</div><div class="stat-label">Rejected</div></div></div>' +
                '<div class="stat-card"><div class="stat-icon" style="background:#e6f4ff;color:#096dd9;"><i class="fa-solid fa-layer-group"></i></div><div><div class="stat-value">' + pendingReviews.length + '</div><div class="stat-label">Total Submissions</div></div></div>' +
            '</div>' +

            // Review Table
            '<div class="card animate-in">' +
                '<div class="card-title flex-between">' +
                    '<span><i class="fa-solid fa-folder-arrow-up" style="color:var(--primary); margin-right:0.4rem;"></i> Citizen Document Submissions</span>' +
                    (_totalPending > 0 ? '<span class="badge badge-pending"><i class="fa-solid fa-bell"></i> ' + _totalPending + ' awaiting your review</span>' : '<span class="badge badge-approved">All reviewed</span>') +
                '</div>' +
                '<div style="overflow-x:auto;">' +
                    '<table class="data-table">' +
                        '<thead><tr>' +
                            '<th>App ID</th>' +
                            '<th>Citizen</th>' +
                            '<th>MP4 Video</th>' +
                            '<th>PDF AI Report</th>' +
                            '<th>Submitted On</th>' +
                            '<th>Notes</th>' +
                            '<th>Status</th>' +
                            '<th>Action</th>' +
                        '</tr></thead>' +
                        '<tbody id="docReviewTableBody">' + _reviewRows + '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';
    }

    else if (isRTO) {
        var allApps = getStoredApplications();
        var pendingList = allApps.filter(function(a) { return a.status === 'Pending'; });
        var approvedList = allApps.filter(function(a) { return a.status === 'Approved'; });
        
        if (isRTOReports) {
            pageContent = '' +
                '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'rto\'"><i class="fa-solid fa-arrow-left"></i> Back to RTO Dashboard</button></div>' +
                '<div class="stats-row animate-in">' +
                    '<div class="stat-card"><div class="stat-icon" style="background:#e8f7f1; color:#1aab74;"><i class="fa-solid fa-id-card"></i></div><div><div class="stat-value">1,240</div><div class="stat-label">Licences Issued</div></div></div>' +
                    '<div class="stat-card"><div class="stat-icon" style="background:#e6f4ff; color:#096dd9;"><i class="fa-solid fa-chart-line"></i></div><div><div class="stat-value">89.5%</div><div class="stat-label">Pass Rate</div></div></div>' +
                    '<div class="stat-card"><div class="stat-icon" style="background:#fff7e6; color:#d46b08;"><i class="fa-solid fa-business-time"></i></div><div><div class="stat-value">2.4 Days</div><div class="stat-label">Avg Processing Time</div></div></div>' +
                    '<div class="stat-card"><div class="stat-icon" style="background:#f6ffed; color:#389e0d;"><i class="fa-solid fa-indian-rupee-sign"></i></div><div><div class="stat-value">₹3,45,000</div><div class="stat-label">Monthly Revenue</div></div></div>' +
                '</div>' +

                '<div class="grid-2 animate-in" style="margin-top:1.25rem;">' +
                    '<div class="card">' +
                        '<div class="card-title"><i class="fa-solid fa-chart-column" style="color:var(--primary); margin-right:0.4rem;"></i> Licence Applications by Category</div>' +
                        '<div style="position:relative; height:260px;"><canvas id="licenseTypeChart"></canvas></div>' +
                    '</div>' +
                    '<div class="card">' +
                        '<div class="card-title"><i class="fa-solid fa-chart-pie" style="color:var(--primary); margin-right:0.4rem;"></i> Application Status Distribution</div>' +
                        '<div style="position:relative; height:260px;"><canvas id="statusPieChart"></canvas></div>' +
                    '</div>' +
                '</div>' +

                '<div class="card animate-in" style="margin-top:1.25rem;">' +
                    '<div class="card-title"><i class="fa-solid fa-file-invoice" style="color:var(--primary); margin-right:0.4rem;"></i> RTO Performance Summary</div>' +
                    '<div style="overflow-x:auto;">' +
                        '<table class="data-table">' +
                            '<thead><tr><th>Service Type</th><th>Total Received</th><th>Approved</th><th>Pending</th><th>Avg Turnaround</th></tr></thead>' +
                            '<tbody>' +
                                '<tr><td><strong>Learner\'s Licence</strong></td><td>540</td><td>480</td><td>60</td><td>1.2 Days</td></tr>' +
                                '<tr><td><strong>Driving Licence (Permanent)</strong></td><td>410</td><td>350</td><td>60</td><td>3.1 Days</td></tr>' +
                                '<tr><td><strong>Licence Renewal</strong></td><td>180</td><td>160</td><td>20</td><td>1.5 Days</td></tr>' +
                                '<tr><td><strong>International Permit</strong></td><td>60</td><td>50</td><td>10</td><td>2.0 Days</td></tr>' +
                                '<tr><td><strong>Duplicate Licence</strong></td><td>50</td><td>40</td><td>10</td><td>1.0 Days</td></tr>' +
                            '</tbody>' +
                        '</table>' +
                    '</div>' +
                '</div>';

            setTimeout(function() {
                renderReportsCharts();
            }, 100);
        }
        else {
            var listToDisplay = isRTOApproved ? approvedList : isRTOPending ? pendingList : allApps;
            var tableRows = listToDisplay.map(function(app) {
                var stBadgeClass = app.status === 'Pending' ? 'badge-pending' : app.status === 'Rejected' ? 'badge-rejected' : 'badge-approved';
                var stBadgeLabel = app.status === 'Pending' ? '● Pending' : app.status === 'Rejected' ? '✗ Declined' : '✓ Approved';
                return '<tr>' +
                    '<td><strong>' + app.id + '</strong></td>' +
                    '<td>' + app.name + '</td>' +
                    '<td>' + app.type + '</td>' +
                    '<td>' + app.date + '</td>' +
                    '<td><span class="badge ' + stBadgeClass + '">' + stBadgeLabel + '</span></td>' +
                    '<td>' +
                        '<button class="btn btn-ghost" style="padding:0.35rem 0.8rem; font-size:0.78rem;" onclick="openReviewModal(\'' + app.id + '\')"><i class="fa-solid fa-eye"></i> Review</button>' +
                    '</td></tr>';
            }).join('');

            var sectionTitle = isRTOApproved ? 'Approved Applications' : isRTOPending ? 'Pending Review Queue' : 'All Applications';

            pageContent = '' +
                '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'home\'"><i class="fa-solid fa-arrow-left"></i> Back to Home</button></div>' +
                '<div class="stats-row animate-in">' +
                    '<div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-folder-open"></i></div><div><div class="stat-value">' + allApps.length + '</div><div class="stat-label">Total Applications</div></div></div>' +
                    '<div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-clock"></i></div><div><div class="stat-value">' + pendingList.length + '</div><div class="stat-label">Pending Review</div></div></div>' +
                    '<div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-circle-check"></i></div><div><div class="stat-value">' + approvedList.length + '</div><div class="stat-label">Approved</div></div></div>' +
                    '<div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-shield-halved"></i></div><div><div class="stat-value">100%</div><div class="stat-label">Audit Logged</div></div></div>' +
                '</div>' +
                '<div class="card animate-in" style="animation-delay:0.05s;">' +
                    '<div class="card-title">' + sectionTitle + ' <span class="badge badge-active"><i class="fa-solid fa-circle" style="font-size:0.5rem"></i> Live</span></div>' +
                    '<div style="overflow-x:auto;">' +
                        '<table class="data-table" id="appTable"><thead><tr>' +
                            '<th>App ID</th><th>Applicant</th><th>Service Type</th><th>Submitted</th><th>Status</th><th>Actions</th>' +
                        '</tr></thead><tbody>' + (tableRows || '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No applications found in this category.</td></tr>') + '</tbody></table>' +
                    '</div>' +
                '</div>';
        }
    }

    // Render full layout
    var logoutTarget = isRTO ? '#rto-login' : '#citizen-login';
    var logoutBtnHTML = (isRTO || isCitizen)
        ? '<button class="btn-logout" onclick="handleLogout(\'' + logoutTarget + '\')"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>'
        : '';

    var sidebarLogoutHTML = (isRTO || isCitizen)
        ? '<div style="margin-top:0.5rem; padding-top:0.5rem; border-top:1px solid var(--border);">' +
            '<a href="javascript:void(0)" class="nav-item" onclick="handleLogout(\'' + logoutTarget + '\')" style="color:#ef4444;">' +
                '<i class="fa-solid fa-right-from-bracket"></i> Logout' +
            '</a>' +
          '</div>'
        : '';

    var modalHTML = activeReviewModalAppId ? buildReviewModalHTML(activeReviewModalAppId) : '';

    appDiv.innerHTML = '' +
        '<aside class="sidebar">' +
            '<div class="sidebar-brand"><div class="brand-icon"><i class="fa-solid fa-steering-wheel"></i></div><span>DriveSetu</span></div>' +
            '<div class="sidebar-section-label">Navigation</div>' +
            '<nav class="sidebar-nav">' + navHTML + sidebarLogoutHTML + '</nav>' +
            '<div style="padding:1rem; background:var(--primary-light); border-radius:var(--radius-md); margin-top:auto;">' +
                '<p style="font-size:0.78rem; font-weight:700; color:var(--primary-dark); margin-bottom:0.25rem;">Need Help?</p>' +
                '<p style="font-size:0.72rem; color:var(--text-muted); line-height:1.4;">Contact RTO helpline: <strong>1800-XXX-XXXX</strong></p>' +
            '</div>' +
        '</aside>' +
        '<div class="main-content">' +
            '<header class="top-header">' +
                '<div class="header-left"><div class="page-title">' + pageTitle + '</div><div class="breadcrumb">' + breadcrumb + '</div></div>' +
                '<div class="header-right">' +
                    '<div class="search-bar"><i class="fa-solid fa-magnifying-glass"></i><input type="text" placeholder="Search applications..."></div>' +
                    '<div class="header-icon-btn"><i class="fa-solid fa-bell"></i></div>' +
                    '<div class="user-chip"><div class="user-avatar">' + userInfo.initials + '</div><div><div class="user-chip-name">' + userInfo.name + '</div><div class="user-chip-role">' + userInfo.role + '</div></div></div>' +
                    logoutBtnHTML +
                '</div>' +
            '</header>' +
            '<main class="page-body">' + pageContent + '</main>' +
        '</div>' +
        modalHTML;
}

function handleLogout(target) {
    if (confirm('Are you sure you want to log out?')) {
        window.location.hash = target;
    }
}

// ─── LEARNER TOGGLE ───
function toggleLearnerFields() {
    var sel = document.getElementById('licenseTypeSelect');
    var div = document.getElementById('learnerFields');
    if (!sel || !div) return;
    if (sel.value === "Learner's Licence") {
        div.style.display = 'block';
        generateCaptcha();
    } else {
        div.style.display = 'none';
    }
}

// ─── TEST CENTERS ───
function updateTestCenters() {
    var district = document.getElementById('districtSelect').value;
    var centerSelect = document.getElementById('testCenterSelect');
    var centers = {
        'Hyderabad': ['RTA Khairatabad', 'RTA Secunderabad', 'RTA LB Nagar'],
        'Rangareddy': ['RTA Shamshabad', 'RTA Chevella', 'RTA Ibrahimpatnam'],
        'Medchal': ['RTA Medchal', 'RTA Kompally'],
        'Warangal': ['RTA Warangal Urban', 'RTA Warangal Rural'],
        'Karimnagar': ['RTA Karimnagar', 'RTA Peddapalli'],
        'Nizamabad': ['RTA Nizamabad', 'RTA Kamareddy'],
        'Khammam': ['RTA Khammam', 'RTA Kothagudem'],
        'Nalgonda': ['RTA Nalgonda', 'RTA Suryapet'],
        'Adilabad': ['RTA Adilabad', 'RTA Mancherial'],
        'Mahabubnagar': ['RTA Mahabubnagar', 'RTA Nagarkurnool'],
    };
    var list = centers[district] || [];
    var opts = '';
    for (var i = 0; i < list.length; i++) {
        opts += '<option>' + list[i] + '</option>';
    }
    centerSelect.innerHTML = '<option value="">SELECT</option>' + opts;
}

// ─── OTP ───
function requestOTP() {
    var mobile = document.getElementById('learnerMobile').value;
    if (mobile.length !== 10 || isNaN(mobile)) {
        alert('Please enter a valid 10-digit mobile number.');
        return;
    }
    generatedOTP = String(Math.floor(100000 + Math.random() * 900000));
    otpSent = true;
    document.getElementById('otpSection').style.display = 'block';
    document.getElementById('otpStatus').innerHTML =
        '<span style="color:var(--primary); font-size:0.8rem; font-weight:600;">' +
        '<i class="ph ph-check-circle"></i> OTP sent to ' + mobile.slice(0,3) + '****' + mobile.slice(7) + '. (Demo OTP: ' + generatedOTP + ')' +
        '</span>';
}

// ─── CAPTCHA ───
function generateCaptcha() {
    currentCaptcha = String(Math.floor(100000 + Math.random() * 900000));
    var display = document.getElementById('captchaDisplay');
    if (display) display.textContent = currentCaptcha;
}

function clearCaptchaInput() {
    var input = document.getElementById('captchaInput');
    if (input) input.value = '';
}

// ─── SUBMIT APPLICATION ───
function submitApplication(e) {
    e.preventDefault();
    var name = document.getElementById('applicantName').value;
    var type = document.getElementById('licenseTypeSelect').value;

    // Extra validation for Learner's Licence
    if (type === "Learner's Licence") {
        var district = document.getElementById('districtSelect').value;
        var center = document.getElementById('testCenterSelect').value;
        if (!district || !center) {
            alert('Please select a District and Test Center.');
            return;
        }
        if (!otpSent) {
            alert('Please request an OTP first.');
            return;
        }
        var enteredOTP = document.getElementById('otpInput').value;
        if (enteredOTP !== generatedOTP) {
            alert('Invalid OTP. Please enter the correct OTP.');
            return;
        }
        var enteredCaptcha = document.getElementById('captchaInput').value;
        if (enteredCaptcha !== currentCaptcha) {
            alert('Invalid CAPTCHA. Please try again.');
            generateCaptcha();
            return;
        }
    }

    var newId = 'APP-' + (100 + applications.length + 1);
    applications.push({ id: newId, name: name, type: type, status: 'Pending', date: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'}) });
    otpSent = false;
    generatedOTP = '';
    alert('Application ' + newId + ' submitted successfully!\n\nYou can track your status using this ID.');
    window.location.hash = 'home';
}

// ─── TRACK STATUS ───
function quickTrack(id) {
    var input = document.getElementById('trackInput');
    if (input) {
        input.value = id;
        trackStatus();
    }
}

function trackStatus() {
    var id = document.getElementById('trackInput').value.trim().toUpperCase();
    var app = null;
    for (var i = 0; i < applications.length; i++) {
        if (applications[i].id === id) { app = applications[i]; break; }
    }
    if (!app) { alert('Application not found. Please check the ID.'); return; }
    var resultDiv = document.getElementById('trackResult');
    resultDiv.style.display = 'block';
    document.getElementById('trackName').textContent = app.name;
    document.getElementById('trackType').textContent = app.type + ' — ' + app.id;
    var badge = document.getElementById('trackBadge');
    badge.textContent = app.status === 'Approved' ? '✓ Approved' : '● Pending';
    badge.className = 'badge ' + (app.status === 'Approved' ? 'badge-approved' : 'badge-pending');

    var steps = [
        { label: 'Application Submitted', done: true },
        { label: 'Documents Verified', done: app.status === 'Approved' },
        { label: 'RTO Officer Review', done: app.status === 'Approved' },
        { label: 'Approved & Dispatched', done: app.status === 'Approved' },
    ];
    var timelineHTML = '';
    for (var j = 0; j < steps.length; j++) {
        timelineHTML += '<div class="timeline-item">' +
            '<div class="timeline-dot ' + (steps[j].done ? 'active' : '') + '"></div>' +
            '<div class="timeline-content"><p>' + steps[j].label + '</p><small>' + (steps[j].done ? 'Completed' : 'Awaiting') + '</small></div>' +
        '</div>';
    }
    document.getElementById('trackTimeline').innerHTML = timelineHTML;
}

// ─── APPROVE ───
function approveApp(id) {
    for (var i = 0; i < applications.length; i++) {
        if (applications[i].id === id) {
            applications[i].status = 'Approved';
            render();
            break;
        }
    }
}

// ─── REPORTS CHARTS ───
function renderReportsCharts() {
    var barCtx = document.getElementById('licenseTypeChart');
    var pieCtx = document.getElementById('statusPieChart');

    if (barCtx && window.Chart) {
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['Learner\'s', 'Permanent DL', 'Renewal', 'International', 'Duplicate'],
                datasets: [{
                    label: 'Applications Received',
                    data: [540, 410, 180, 60, 50],
                    backgroundColor: ['#1aab74', '#148f60', '#36bf8d', '#63d4aa', '#9ee4cb'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#e4edea' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    if (pieCtx && window.Chart) {
        new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['Approved', 'Pending Review', 'Under Verification', 'Rejected'],
                datasets: [{
                    data: [986, 254, 120, 38],
                    backgroundColor: ['#1aab74', '#e6a23c', '#409eff', '#f56c6c']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
    }
}

// ─── UPLOAD TEST REPORTS HELPERS ───
var isSimVideoUploadPlaying = false;
var simVideoUploadInterval = null;

function triggerVideoUpload() {
    var input = document.getElementById('videoFileInput');
    if (input) input.click();
}

function triggerPdfUpload() {
    var input = document.getElementById('pdfFileInput');
    if (input) input.click();
}

var currentUploadedVideoDataUrl = localStorage.getItem('drivesetu_last_video_data') || '';
var currentUploadedPdfDataUrl = localStorage.getItem('drivesetu_last_pdf_data') || '';

function handleVideoFileSelect(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;

    var videoURL = URL.createObjectURL(file);
    window.lastUploadedVideoURL = videoURL;
    window.lastUploadedVideoName = file.name;

    // Convert file to base64 DataURL for permanent localStorage persistence
    var reader = new FileReader();
    reader.onload = function(e) {
        currentUploadedVideoDataUrl = e.target.result;
        try { localStorage.setItem('drivesetu_last_video_data', currentUploadedVideoDataUrl); } catch(err) {}
    };
    reader.readAsDataURL(file);

    var videoPlayer = document.getElementById('uploadedVideoPlayer');
    var placeholder = document.getElementById('videoPlaceholderBox');

    if (videoPlayer) {
        videoPlayer.src = videoURL;
        videoPlayer.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
        videoPlayer.play().catch(function(e) { console.log('Video autoplay prevented:', e); });
    }

    var infoText = document.getElementById('videoFileInfoText');
    if (infoText) {
        infoText.innerHTML = '<i class="fa-solid fa-file-circle-check" style="color:#148f60;"></i> Loaded MP4 Video: <code>' + file.name + '</code> &bull; Size: ' + (file.size / (1024*1024)).toFixed(1) + ' MB';
    }
    var badge = document.getElementById('videoStatusBadge');
    if (badge) {
        badge.textContent = 'MP4 Loaded';
        badge.className = 'badge badge-approved';
    }
    alert('📹 Video file "' + file.name + '" loaded into player!');
}

function handlePdfFileSelect(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;

    var pdfURL = URL.createObjectURL(file);
    window.lastUploadedPdfURL = pdfURL;
    window.lastUploadedPdfName = file.name;

    // Convert file to base64 DataURL for permanent localStorage persistence
    var reader = new FileReader();
    reader.onload = function(e) {
        currentUploadedPdfDataUrl = e.target.result;
        try { localStorage.setItem('drivesetu_last_pdf_data', currentUploadedPdfDataUrl); } catch(err) {}
    };
    reader.readAsDataURL(file);

    var docName = document.getElementById('pdfDocName');
    if (docName) docName.textContent = file.name;

    var badge = document.getElementById('pdfStatusBadge');
    if (badge) {
        badge.textContent = 'PDF Verified';
        badge.className = 'badge badge-approved';
    }

    var scoreBadge = document.getElementById('pdfScoreBadge');
    if (scoreBadge) {
        scoreBadge.textContent = 'PDF Loaded';
        scoreBadge.className = 'badge badge-approved';
    }

    // Embed PDF iframe preview in Citizen card
    var pdfIframe = document.getElementById('citizenPdfPreviewIframe');
    var pdfPlaceholder = document.getElementById('pdfPlaceholderText');
    if (pdfIframe) {
        pdfIframe.src = pdfURL;
        pdfIframe.style.display = 'block';
        if (pdfPlaceholder) pdfPlaceholder.style.display = 'none';
    }

    alert('📄 PDF Report file "' + file.name + '" loaded into PDF viewer!');
}

function loadSampleDocumentPackage(id) {
    var packages = {
        'APP-102': {
            appId: 'APP-102',
            candidate: 'Rahul Sharma (APP-102)',
            videoFile: 'APP102_TrackTest_Cam01.mp4',
            videoSize: '24.8 MB',
            pdfFile: 'RTO_AI_Report_APP102.pdf',
            score: '94/100',
            metricsHTML: '<div style="font-size:0.78rem; display:flex; justify-content:space-between; margin-bottom:0.25rem;"><span>Parallel Parking:</span> <strong>98% Pass</strong></div><div style="font-size:0.78rem; display:flex; justify-content:space-between; margin-bottom:0.25rem;"><span>8-Track Loop:</span> <strong>92% Pass</strong></div><div style="font-size:0.78rem; display:flex; justify-content:space-between; margin-bottom:0.25rem;"><span>Gradient Launch:</span> <strong>96% Pass</strong></div><div style="font-size:0.78rem; display:flex; justify-content:space-between;"><span>Traffic Stop Line:</span> <strong>100% Pass</strong></div>'
        },
        'APP-105': {
            appId: 'APP-105',
            candidate: 'Priya Singh (APP-105)',
            videoFile: 'APP105_TrackTest_Zone2.mp4',
            videoSize: '28.1 MB',
            pdfFile: 'RTO_AI_Report_APP105.pdf',
            score: '98/100',
            metricsHTML: '<div style="font-size:0.78rem; display:flex; justify-content:space-between; margin-bottom:0.25rem;"><span>Parallel Parking:</span> <strong>100% Pass</strong></div><div style="font-size:0.78rem; display:flex; justify-content:space-between; margin-bottom:0.25rem;"><span>8-Track Loop:</span> <strong>96% Pass</strong></div><div style="font-size:0.78rem; display:flex; justify-content:space-between; margin-bottom:0.25rem;"><span>Gradient Launch:</span> <strong>98% Pass</strong></div><div style="font-size:0.78rem; display:flex; justify-content:space-between;"><span>Traffic Stop Line:</span> <strong>98% Pass</strong></div>'
        },
        'APP-108': {
            appId: 'APP-108',
            candidate: 'Vikram Mehta (APP-108)',
            videoFile: 'APP108_TrackTest_Cam04.mp4',
            videoSize: '31.2 MB',
            pdfFile: 'RTO_AI_Report_APP108.pdf',
            score: '72/100 (Review Required)',
            metricsHTML: '<div style="font-size:0.78rem; display:flex; justify-content:space-between; margin-bottom:0.25rem;"><span>Parallel Parking:</span> <strong>85% Pass</strong></div><div style="font-size:0.78rem; display:flex; justify-content:space-between; margin-bottom:0.25rem;"><span>8-Track Loop:</span> <strong style="color:#d46b08;">60% Touch Warning</strong></div><div style="font-size:0.78rem; display:flex; justify-content:space-between; margin-bottom:0.25rem;"><span>Gradient Launch:</span> <strong>78% Pass</strong></div><div style="font-size:0.78rem; display:flex; justify-content:space-between;"><span>Traffic Stop Line:</span> <strong>90% Pass</strong></div>'
        }
    };

    var pkg = packages[id] || packages['APP-102'];
    
    var infoText = document.getElementById('videoFileInfoText');
    if (infoText) {
        infoText.innerHTML = '<i class="fa-solid fa-file-code"></i> File: <code>' + pkg.videoFile + '</code> • Size: ' + pkg.videoSize + ' • Duration: 02:45';
    }

    var docName = document.getElementById('pdfDocName');
    if (docName) docName.textContent = pkg.pdfFile;

    var cndMeta = document.getElementById('pdfCandidateMeta');
    if (cndMeta) cndMeta.textContent = 'Candidate: ' + pkg.candidate;

    var scoreBadge = document.getElementById('pdfScoreBadge');
    if (scoreBadge) scoreBadge.textContent = 'AI Score: ' + pkg.score;

    var metricsList = document.getElementById('pdfMetricsList');
    if (metricsList) metricsList.innerHTML = pkg.metricsHTML;

    var appIdInput = document.getElementById('uploadAppIdInput');
    if (appIdInput) appIdInput.value = pkg.appId;
}

function toggleSimVideoUpload() {
    var tracker = document.getElementById('carTrackerUpload');
    var playBtn = document.getElementById('playSimUploadBtn');
    var speed = document.getElementById('uploadVideoSpeed');

    if (isSimVideoUploadPlaying) {
        clearInterval(simVideoUploadInterval);
        isSimVideoUploadPlaying = false;
        if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i> Preview Uploaded MP4 Video';
        if (speed) speed.textContent = '0 km/h (Paused)';
    } else {
        isSimVideoUploadPlaying = true;
        if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause Preview';
        var pos = 10;
        simVideoUploadInterval = setInterval(function() {
            pos += 3;
            if (pos > 85) pos = 10;
            if (tracker) tracker.style.left = pos + '%';
            if (speed) speed.textContent = (20 + Math.floor(Math.random() * 6)) + ' km/h';
        }, 150);
    }
}

function submitUploadedReports() {
    var appId = document.getElementById('uploadAppIdInput') ? document.getElementById('uploadAppIdInput').value : '';
    var candidateName = document.getElementById('uploadNameInput') ? document.getElementById('uploadNameInput').value : 'Citizen';
    var notes = document.getElementById('uploadNotesInput') ? document.getElementById('uploadNotesInput').value.trim() : '';
    var pdfName = document.getElementById('pdfDocName') ? document.getElementById('pdfDocName').textContent : '';
    var videoInfoText = document.getElementById('videoFileInfoText') ? document.getElementById('videoFileInfoText').textContent : '';

    // Build file names based on what was selected or use defaults
    var mp4Name = (videoInfoText && videoInfoText.indexOf('No MP4') === -1)
        ? appId + '_DriveTest.mp4'
        : appId + '_Track.mp4';
    if (!pdfName || pdfName === 'No PDF report selected') pdfName = appId + '_AIReport.pdf';

    // Get the citizen's licence type from session
    var _cs = sessionStorage.getItem('citizenSession') ? JSON.parse(sessionStorage.getItem('citizenSession')) : {};
    var licenceType = _cs.licenceType || 'Licence';

    // Today's date
    var _today = new Date();
    var _months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var submittedOn = _today.getDate() + ' ' + _months[_today.getMonth()] + ' ' + _today.getFullYear();

    // ── Save to localStorage Reviews Queue ──
    var reviews = getStoredReviews();
    reviews.unshift({
        appId: appId,
        candidateName: candidateName,
        licenceType: licenceType,
        mp4Name: mp4Name,
        pdfName: pdfName,
        videoDataUrl: currentUploadedVideoDataUrl || localStorage.getItem('drivesetu_last_video_data') || '',
        pdfDataUrl: currentUploadedPdfDataUrl || localStorage.getItem('drivesetu_last_pdf_data') || '',
        notes: notes || 'Submitted by citizen for review',
        submittedOn: submittedOn,
        status: 'Pending Review',
        reviewedBy: null
    });
    saveStoredReviews(reviews);

    // ── Also sync to stored Applications list ──
    var apps = getStoredApplications();
    var foundApp = false;
    for (var a = 0; a < apps.length; a++) {
        if (apps[a].id === appId) {
            apps[a].status = 'Pending';
            foundApp = true;
            break;
        }
    }
    if (!foundApp) {
        apps.unshift({
            id: appId,
            name: candidateName,
            type: licenceType,
            status: 'Pending',
            date: submittedOn
        });
    }
    saveStoredApplications(apps);

    alert('✅ Your documents have been submitted to the RTO for review!\n\nApp ID: ' + appId + '\nStatus: Pending RTO Review');
    render();
}

function resetUploadForm() {
    var infoText = document.getElementById('videoFileInfoText');
    if (infoText) infoText.innerHTML = '<i class="fa-solid fa-info-circle"></i> No MP4 video selected yet.';

    var docName = document.getElementById('pdfDocName');
    if (docName) docName.textContent = 'No PDF report selected';

    alert('Upload form reset.');
}

// ─── RTO DOCUMENT & APPLICATION REVIEW MODAL HANDLERS ───

function openReviewModal(appId) {
    activeReviewModalAppId = appId;
    isDeclineBoxVisible = false;
    render();
}

function closeReviewModal() {
    activeReviewModalAppId = null;
    isDeclineBoxVisible = false;
    render();
}

function toggleDeclineRemarkBox() {
    isDeclineBoxVisible = !isDeclineBoxVisible;
    render();
}

function approveAppFromModal(appId) {
    var reviews = getStoredReviews();
    var apps = getStoredApplications();
    var candidateName = '';

    for (var i = 0; i < reviews.length; i++) {
        if (reviews[i].appId === appId) {
            reviews[i].status = 'Approved';
            reviews[i].reviewedBy = 'RTO Officer';
            candidateName = reviews[i].candidateName;
        }
    }
    saveStoredReviews(reviews);

    for (var j = 0; j < apps.length; j++) {
        if (apps[j].id === appId) {
            apps[j].status = 'Approved';
            if (!candidateName) candidateName = apps[j].name;
        }
    }
    saveStoredApplications(apps);

    alert('✅ Driving Licence Approved for ' + (candidateName || appId) + '!\n\nStatus updated to Approved in RTO records.');
    closeReviewModal();
}

function confirmDeclineFromModal(appId) {
    var remarkInput = document.getElementById('declineRemarkInput');
    var remark = remarkInput ? remarkInput.value.trim() : '';
    if (!remark) {
        alert('Please enter a remark explaining the reason for declination.');
        if (remarkInput) remarkInput.focus();
        return;
    }

    var reviews = getStoredReviews();
    var apps = getStoredApplications();
    var candidateName = '';

    for (var i = 0; i < reviews.length; i++) {
        if (reviews[i].appId === appId) {
            reviews[i].status = 'Rejected';
            reviews[i].notes = (reviews[i].notes ? reviews[i].notes + ' | ' : '') + 'Declination Remark: ' + remark;
            reviews[i].reviewedBy = 'RTO Officer';
            candidateName = reviews[i].candidateName;
        }
    }
    saveStoredReviews(reviews);

    for (var j = 0; j < apps.length; j++) {
        if (apps[j].id === appId) {
            apps[j].status = 'Rejected';
            if (!candidateName) candidateName = apps[j].name;
        }
    }
    saveStoredApplications(apps);

    alert('❌ Application ' + appId + ' Declined.\n\nRemark: ' + remark);
    closeReviewModal();
}

function buildReviewModalHTML(appId) {
    var reviews = getStoredReviews();
    var apps = getStoredApplications();

    var reviewObj = null;
    for (var i = 0; i < reviews.length; i++) {
        if (reviews[i].appId === appId) {
            reviewObj = reviews[i];
            break;
        }
    }

    var appObj = null;
    for (var j = 0; j < apps.length; j++) {
        if (apps[j].id === appId) {
            appObj = apps[j];
            break;
        }
    }

    var candidateName = (reviewObj && reviewObj.candidateName) ? reviewObj.candidateName : (appObj ? appObj.name : 'Applicant');
    var licenceType = (reviewObj && reviewObj.licenceType) ? reviewObj.licenceType : (appObj ? appObj.type : 'Driving Licence');
    var mp4Name = (reviewObj && reviewObj.mp4Name) ? reviewObj.mp4Name : appId + '_TrackTest_Cam01.mp4';
    var pdfName = (reviewObj && reviewObj.pdfName) ? reviewObj.pdfName : 'RTO_AI_Report_' + appId + '.pdf';
    var notes = (reviewObj && reviewObj.notes) ? reviewObj.notes : 'Candidate test track telemetry and document package submitted.';
    var submittedOn = (reviewObj && reviewObj.submittedOn) ? reviewObj.submittedOn : (appObj ? appObj.date : 'Recent');
    var status = reviewObj ? reviewObj.status : (appObj ? appObj.status : 'Pending');

    var videoDataSrc = (reviewObj && reviewObj.videoDataUrl) ? reviewObj.videoDataUrl : (window.lastUploadedVideoURL || 'https://www.w3schools.com/html/mov_bbb.mp4');
    var pdfDataSrc = window.lastUploadedPdfURL || (reviewObj && reviewObj.pdfDataUrl ? reviewObj.pdfDataUrl : null);

    var statusBadgeClass = status === 'Approved' ? 'badge-approved' : status === 'Rejected' ? 'badge-rejected' : 'badge-pending';
    var statusText = status === 'Approved' ? '✓ Approved' : status === 'Rejected' ? '✗ Declined' : '⏳ Pending Review';

    return '' +
        '<div class="modal-backdrop" id="reviewModalBackdrop" onclick="if(event.target===this) closeReviewModal();">' +
            '<div class="modal-card animate-in">' +
                '<div class="modal-header">' +
                    '<div>' +
                        '<h3 style="font-size:1.15rem; font-weight:700; margin:0; color:var(--text-main);"><i class="fa-solid fa-file-signature" style="color:var(--primary); margin-right:0.4rem;"></i> RTO Candidate Document & Track Review</h3>' +
                        '<p style="font-size:0.8rem; color:var(--text-muted); margin:0.2rem 0 0 0;">App ID: <strong>' + appId + '</strong> &bull; Candidate: <strong>' + candidateName + '</strong></p>' +
                    '</div>' +
                    '<button class="modal-close-btn" type="button" onclick="closeReviewModal()"><i class="fa-solid fa-xmark"></i></button>' +
                '</div>' +

                '<div style="background:#f8faf9; padding:0.75rem 1rem; border-radius:var(--radius-md); border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">' +
                    '<div style="font-size:0.82rem;">' +
                        '<span style="color:var(--text-muted);">Licence Type:</span> <strong>' + licenceType + '</strong>' +
                        '<span style="margin:0 0.5rem; color:var(--border);">&bull;</span>' +
                        '<span style="color:var(--text-muted);">Submitted:</span> <strong>' + submittedOn + '</strong>' +
                    '</div>' +
                    '<div><span class="badge ' + statusBadgeClass + '">' + statusText + '</span></div>' +
                '</div>' +

                '<!-- Dual Document Display (MP4 + PDF) -->' +
                '<div class="grid-2" style="grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem;">' +
                    '<!-- MP4 Card with Real Video Player -->' +
                    '<div class="card" style="padding:1rem;">' +
                        '<h4 style="font-size:0.88rem; font-weight:700; margin-bottom:0.5rem; color:var(--text-main);">' +
                            '<i class="fa-solid fa-file-video" style="color:#096dd9; margin-right:0.4rem;"></i> Submitted MP4 Video Recording' +
                        '</h4>' +
                        '<div class="preview-video-container" style="margin-top:0.4rem;">' +
                            '<div class="video-overlay-header">' +
                                '<span class="cam-label"><i class="fa-solid fa-camera"></i> TRACK FOOTAGE &ndash; ' + candidateName.toUpperCase() + '</span>' +
                                '<span class="telemetry-speed">MP4 PLAYER</span>' +
                            '</div>' +
                            '<div style="background:#000; min-height:180px; display:flex; align-items:center; justify-content:center; overflow:hidden;">' +
                                '<video controls style="width:100%; max-height:220px; object-fit:contain; background:#000;" src="' + videoDataSrc + '"></video>' +
                            '</div>' +
                            '<div style="padding:0.6rem; background:#f8faf9; font-size:0.76rem; color:var(--text-muted); border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">' +
                                '<span><i class="fa-solid fa-file-video" style="color:#096dd9;"></i> ' + mp4Name + '</span>' +
                                '<button type="button" class="btn btn-ghost" style="padding:0.2rem 0.5rem; font-size:0.74rem;" onclick="openVideoDocument(\'' + appId + '\')"><i class="fa-solid fa-arrow-up-right-from-square"></i> Open Video</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +

                    '<!-- PDF Card with Viewer & Open Button -->' +
                    '<div class="card" style="padding:1rem;">' +
                        '<h4 style="font-size:0.88rem; font-weight:700; margin-bottom:0.5rem; color:var(--text-main);">' +
                            '<i class="fa-solid fa-file-pdf" style="color:#d46b08; margin-right:0.4rem;"></i> Submitted PDF AI Evaluation Report' +
                        '</h4>' +
                        '<div style="padding:0.75rem; background:#f4fbf8; border:1px solid #c2ead8; border-radius:var(--radius-md);">' +
                            '<div class="flex-between" style="margin-bottom:0.4rem;">' +
                                '<span style="font-size:0.82rem; font-weight:700; color:var(--text-main);"><i class="fa-solid fa-file-pdf" style="color:#d46b08;"></i> ' + pdfName + '</span>' +
                                '<span class="badge badge-approved">PDF Document</span>' +
                            '</div>' +
                            '<div style="margin-top:0.5rem; border-top:1px dashed #c2ead8; padding-top:0.5rem;">' +
                                (pdfDataSrc
                                    ? '<object data="' + pdfDataSrc + '" type="application/pdf" style="width:100%; height:210px; border:1px solid #bce3d4; border-radius:6px;">' +
                                        '<embed src="' + pdfDataSrc + '" type="application/pdf" style="width:100%; height:210px;" />' +
                                      '</object>'
                                    : '<div style="background:#fff; border:1px solid #c2ead8; border-radius:6px; padding:1.25rem 1rem; text-align:center;">' +
                                        '<i class="fa-solid fa-file-pdf" style="font-size:2.4rem; color:#d46b08; display:block; margin-bottom:0.4rem;"></i>' +
                                        '<div style="font-size:0.88rem; font-weight:700; color:var(--text-main);">' + pdfName + '</div>' +
                                        '<div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.25rem;">Official PDF document package attached to candidate application.</div>' +
                                      '</div>'
                                ) +
                                '<div style="margin-top:0.5rem; text-align:center;">' +
                                    '<button type="button" class="btn btn-primary" style="width:100%; justify-content:center; padding:0.45rem; font-size:0.8rem;" onclick="viewPdfDocument(\'' + appId + '\')">' +
                                        '<i class="fa-solid fa-arrow-up-right-from-square"></i> Open / View PDF Document (' + pdfName + ')' +
                                    '</button>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div style="margin-top:0.6rem; font-size:0.78rem; color:var(--text-muted); padding:0.5rem; background:#f8faf9; border-radius:4px;">' +
                            '<strong>Remarks:</strong> ' + notes +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<!-- Decline Remark Form Box -->' +
                '<div id="declineRemarkContainer" class="decline-remark-box" style="display:' + (isDeclineBoxVisible ? 'block' : 'none') + ';">' +
                    '<div style="font-weight:700; font-size:0.88rem; color:#c53030; margin-bottom:0.25rem;">' +
                        '<i class="fa-solid fa-triangle-exclamation"></i> Declination Remark (Mandatory)' +
                    '</div>' +
                    '<p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.4rem;">' +
                        'Please enter the reason for declining this applicant\'s driving licence submission:' +
                    '</p>' +
                    '<textarea id="declineRemarkInput" placeholder="e.g. Test video showed boundary collision on 8-track curve / AI score below minimum threshold..."></textarea>' +
                    '<div style="display:flex; gap:0.5rem; justify-content:flex-end;">' +
                        '<button class="btn btn-ghost" type="button" style="padding:0.35rem 0.8rem; font-size:0.8rem;" onclick="toggleDeclineRemarkBox()">Cancel</button>' +
                        '<button class="btn btn-danger" type="button" style="background:#c53030; color:#fff; padding:0.35rem 0.8rem; font-size:0.8rem;" onclick="confirmDeclineFromModal(\'' + appId + '\')"><i class="fa-solid fa-paper-plane"></i> Confirm Declination</button>' +
                    '</div>' +
                '</div>' +

                '<!-- Bottom Actions Bar -->' +
                '<div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:1rem; margin-top:1rem;">' +
                    '<button class="btn btn-ghost" type="button" onclick="closeReviewModal()">Close</button>' +
                    '<div style="display:flex; gap:0.75rem;">' +
                        '<button class="btn btn-ghost" type="button" style="color:#c53030; border:1px solid #feb2b2; background:#fff5f5;" onclick="toggleDeclineRemarkBox()">' +
                            '<i class="fa-solid fa-xmark"></i> Decline' +
                        '</button>' +
                        '<button class="btn btn-primary" type="button" style="padding:0.6rem 1.4rem;" onclick="approveAppFromModal(\'' + appId + '\')">' +
                            '<i class="fa-solid fa-check"></i> Approve Licence' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
}

// ─── DOCUMENT OPENERS ───

function openVideoDocument(appId) {
    var vUrl = window.lastUploadedVideoURL || 'https://www.w3schools.com/html/mov_bbb.mp4';
    window.open(vUrl, '_blank');
}

function viewPdfDocument(appId) {
    if (window.lastUploadedPdfURL) {
        window.open(window.lastUploadedPdfURL, '_blank');
        return;
    }

    var reviews = getStoredReviews();
    var item = null;
    for (var i = 0; i < reviews.length; i++) {
        if (reviews[i].appId === appId) { item = reviews[i]; break; }
    }
    var name = item ? item.candidateName : 'Applicant';
    var pdfTitle = item ? item.pdfName : 'RTO_AI_Report_' + (appId || 'APP101') + '.pdf';

    var docHTML = '<!DOCTYPE html><html><head><title>' + pdfTitle + '</title>' +
        '<meta charset="utf-8"/>' +
        '<style>' +
        'body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; background: #f0f4f2; margin: 0; padding: 2rem; color: #1e293b; }' +
        '.pdf-container { background: #ffffff; max-width: 750px; margin: 0 auto; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); border: 1px solid #cbd5e1; }' +
        '.header { border-bottom: 2px solid #1aab74; padding-bottom: 1rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; }' +
        '.title { font-size: 1.4rem; font-weight: 700; color: #0f172a; margin: 0; }' +
        '.subtitle { font-size: 0.85rem; color: #64748b; margin-top: 0.25rem; }' +
        '.badge { background: #e8f7f1; color: #1aab74; padding: 0.3rem 0.8rem; border-radius: 20px; font-weight: 700; font-size: 0.8rem; }' +
        '.section { background: #f8faf9; border: 1px solid #e2e8f0; padding: 1.2rem; border-radius: 8px; margin-bottom: 1.25rem; }' +
        '.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }' +
        '.field-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }' +
        '.field-val { font-size: 0.95rem; font-weight: 600; color: #0f172a; margin-top: 0.2rem; }' +
        '.score-row { display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px dashed #cbd5e1; font-size: 0.9rem; }' +
        '.pass-badge { color: #16a34a; font-weight: 700; }' +
        '</style></head><body>' +
        '<div class="pdf-container">' +
            '<div class="header">' +
                '<div><h1 class="title">📄 RTO Driving Test AI Evaluation Report</h1><div class="subtitle">Government RTO Automated Assessment Audit Log</div></div>' +
                '<span class="badge">AI VERIFIED REPORT</span>' +
            '</div>' +
            '<div class="section grid">' +
                '<div><div class="field-label">Application ID</div><div class="field-val">' + (appId || 'APP-101') + '</div></div>' +
                '<div><div class="field-label">Candidate Name</div><div class="field-val">' + name + '</div></div>' +
                '<div><div class="field-label">Document Name</div><div class="field-val">' + pdfTitle + '</div></div>' +
                '<div><div class="field-label">Test Date</div><div class="field-val">' + (item ? item.submittedOn : '10 Jul 2026') + '</div></div>' +
            '</div>' +
            '<div class="section">' +
                '<h3 style="margin-top:0; font-size:1.05rem; color:#0f172a;">Track Telemetry Analysis</h3>' +
                '<div class="score-row"><span>Parallel Parking Accuracy:</span> <span class="pass-badge">98% Pass</span></div>' +
                '<div class="score-row"><span>8-Track Curve Navigation:</span> <span class="pass-badge">92% Pass</span></div>' +
                '<div class="score-row"><span>Gradient Stop &amp; Launch:</span> <span class="pass-badge">96% Pass</span></div>' +
                '<div class="score-row"><span>Traffic Line Stop Compliance:</span> <span class="pass-badge">100% Pass</span></div>' +
                '<div style="margin-top:1rem; padding-top:0.75rem; border-top:2px solid #1aab74; display:flex; justify-content:space-between; align-items:center;">' +
                    '<span style="font-weight:700;">Final Aggregate Score:</span>' +
                    '<span style="font-size:1.2rem; font-weight:800; color:#1aab74;">94 / 100 (PASSED)</span>' +
                '</div>' +
            '</div>' +
            '<p style="font-size:0.78rem; color:#94a3b8; text-align:center; margin-top:2rem;">This is an officially verified RTO AI document record for application ' + (appId || 'APP-101') + '.</p>' +
        '</div>' +
        '</body></html>';

    var win = window.open('', '_blank');
    if (win) {
        win.document.write(docHTML);
        win.document.close();
    } else {
        alert('Please allow popups to view the PDF report window.');
    }
}

// ─── INIT ───
window.addEventListener('hashchange', render);
render();




