// ─── MOCK DATA ───
var applications = [
    { id: 'APP-101', name: 'Rahul Sharma', type: "Learner's Licence", status: 'Pending', date: '10 Jul 2026' },
    { id: 'APP-102', name: 'Priya Singh', type: 'Permanent Licence', status: 'Approved', date: '12 Jul 2026' },
    { id: 'APP-103', name: 'Amit Kumar', type: 'Renewal', status: 'Pending', date: '14 Jul 2026' },
    { id: 'APP-104', name: 'Sunita Devi', type: 'Duplicate', status: 'Approved', date: '15 Jul 2026' },
];

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
    var isRTO = isRTOAll || isRTOApproved || isRTOPending || isRTOReports;

    var isCitizen = hash === '#citizen';
    var isCitizenTrack = hash === '#citizen-track';
    var isCitizenLogin = hash === '#citizen-login';
    var isRTOLogin = hash === '#rto-login';
    var isHome = hash === '#home' || hash === '';

    // Sidebar nav items
    var citizenNavItems = [
        { icon: 'fa-solid fa-gauge', label: 'Dashboard', hash: '#home' },
        { icon: 'fa-solid fa-id-card', label: 'Apply for Licence', hash: '#citizen', active: isCitizen },
        { icon: 'fa-solid fa-magnifying-glass', label: 'Track Status', hash: '#citizen-track', active: isCitizenTrack },
    ];

    var rtoNavItems = [
        { icon: 'fa-solid fa-gauge', label: 'Dashboard', hash: '#home' },
        { icon: 'fa-solid fa-list-check', label: 'All Applications', hash: '#rto', active: isRTOAll },
        { icon: 'fa-solid fa-circle-check', label: 'Approved', hash: '#rto-approved', active: isRTOApproved },
        { icon: 'fa-solid fa-clock', label: 'Pending Review', hash: '#rto-pending', active: isRTOPending },
        { icon: 'fa-solid fa-chart-pie', label: 'Reports', hash: '#rto-reports', active: isRTOReports },
    ];

    var homeNavItems = [
        { icon: 'fa-solid fa-house', label: 'Home', hash: '#home', active: true },
        { icon: 'fa-solid fa-user', label: 'Citizen Portal', hash: '#citizen-login' },
        { icon: 'fa-solid fa-user-shield', label: 'RTO Portal', hash: '#rto-login' },
    ];

    var navItems = isRTO ? rtoNavItems : (isCitizen || isCitizenTrack) ? citizenNavItems : homeNavItems;
    var userInfo = isRTO
        ? { initials: 'RO', name: 'RTO Officer', role: 'Admin' }
        : { initials: 'CZ', name: 'Citizen', role: 'User' };
    var pageTitle = isRTOReports ? 'Reports & Analytics' : isRTOApproved ? 'Approved Applications' : isRTOPending ? 'Pending Review Queue' : isRTO ? 'RTO Dashboard' : isCitizenTrack ? 'Track Status' : isCitizen ? 'Citizen Portal' : 'Home';
    var breadcrumb = isRTOReports
        ? 'Dashboard / RTO Portal / <span>Reports</span>'
        : isRTOApproved
        ? 'Dashboard / RTO Portal / <span>Approved</span>'
        : isRTOPending
        ? 'Dashboard / RTO Portal / <span>Pending Review</span>'
        : isRTO
        ? 'Dashboard / <span>RTO Portal</span>'
        : isCitizenTrack
        ? 'Dashboard / Citizen Portal / <span>Track Status</span>'
        : isCitizen
        ? 'Dashboard / <span>Citizen Portal</span>'
        : '<span>Dashboard</span>';

    var navHTML = navItems.map(function(item) {
        return '<a href="' + item.hash + '" class="nav-item ' + (item.active ? 'active' : '') + '">' +
            '<i class="' + item.icon + '"></i> ' + item.label + '</a>';
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
            
            var validEmail = (loginTarget === 'citizen') ? 'citizen@drivesetu.com' : 'admin@drivesetu.com';
            var validPass = (loginTarget === 'citizen') ? 'citizen123' : 'admin123';
            
            if (email === validEmail && password === validPass) {
                window.location.hash = loginTarget;
            } else {
                alert('Invalid credentials!\n\nDefault Email: ' + validEmail + '\nDefault Password: ' + validPass);
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

    else if (isRTO) {
        var pendingList = applications.filter(function(a) { return a.status === 'Pending'; });
        var approvedList = applications.filter(function(a) { return a.status === 'Approved'; });
        
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
            var listToDisplay = isRTOApproved ? approvedList : isRTOPending ? pendingList : applications;
            var tableRows = listToDisplay.map(function(app) {
                return '<tr>' +
                    '<td><strong>' + app.id + '</strong></td>' +
                    '<td>' + app.name + '</td>' +
                    '<td>' + app.type + '</td>' +
                    '<td>' + app.date + '</td>' +
                    '<td><span class="badge ' + (app.status === 'Pending' ? 'badge-pending' : 'badge-approved') + '">' +
                        (app.status === 'Pending' ? '● Pending' : '✓ Approved') + '</span></td>' +
                    '<td style="display:flex; gap:0.5rem;">' +
                        (app.status === 'Pending' ? '<button class="btn btn-primary" style="padding:0.35rem 0.8rem; font-size:0.78rem;" onclick="approveApp(\'' + app.id + '\')"><i class="fa-solid fa-check"></i> Approve</button>' : '') +
                        '<button class="btn btn-ghost" style="padding:0.35rem 0.8rem; font-size:0.78rem;"><i class="fa-solid fa-eye"></i> Review</button>' +
                    '</td></tr>';
            }).join('');

            var sectionTitle = isRTOApproved ? 'Approved Applications' : isRTOPending ? 'Pending Review Queue' : 'All Applications';

            pageContent = '' +
                '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'home\'"><i class="fa-solid fa-arrow-left"></i> Back to Home</button></div>' +
                '<div class="stats-row animate-in">' +
                    '<div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-folder-open"></i></div><div><div class="stat-value">' + applications.length + '</div><div class="stat-label">Total Applications</div></div></div>' +
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
        '</div>';
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

// ─── INIT ───
window.addEventListener('hashchange', render);
render();

