function safeParseJSON(str, fallback) {
    if (!str || typeof str !== 'string') return fallback !== undefined ? fallback : null;
    try { return JSON.parse(str); } catch(e) { return fallback !== undefined ? fallback : null; }
}

// ─── MOCK DATA ───
var applications = [];

// ─── CITIZEN USER ACCOUNTS ───
// Dynamic citizen account store (authenticates directly with Supabase database)
var citizenUsers = [];

// ─── RTO & OFFICER SYSTEM DIRECTORY (ROLE-BASED AUTHENTICATION) ───
var rtoAccounts = [
    // Test Centre Operators (Associated with one specific RTO)
    { email: 'operator.tg03@drivesetu.com', password: 'operator123', role: 'TEST_CENTRE_OPERATOR', name: 'TG-03 Test Centre Operator', rtoCode: 'TG-03', rtoName: 'RTA Medchal / Hyderabad West', initials: 'OP3' },
    { email: 'operator.tg05@drivesetu.com', password: 'operator123', role: 'TEST_CENTRE_OPERATOR', name: 'TG-05 Test Centre Operator', rtoCode: 'TG-05', rtoName: 'RTA Secunderabad / Hyderabad North', initials: 'OP5' },
    { email: 'operator.tg08@drivesetu.com', password: 'operator123', role: 'TEST_CENTRE_OPERATOR', name: 'TG-08 Test Centre Operator', rtoCode: 'TG-08', rtoName: 'RTA Uppal / Rangareddy', initials: 'OP8' },
    { email: 'operator.tg12@drivesetu.com', password: 'operator123', role: 'TEST_CENTRE_OPERATOR', name: 'TG-12 Test Centre Operator', rtoCode: 'TG-12', rtoName: 'RTA Sangareddy', initials: 'OP12' },

    // System / Administrative Authority
    { email: 'admin@drivesetu.com', password: 'admin123', role: 'ADMIN', name: 'System Administrator', rtoCode: 'ALL', rtoName: 'Telangana Transport Department', initials: 'ADM' }
];

// Independent Cross-RTO Officers Allocation Engine
function allocateIndependentOfficer(testRtoCode, excludeOfficerIds) {
    if (!excludeOfficerIds) excludeOfficerIds = [];
    var eligible = rtoAccounts.filter(function(acc) {
        if (acc.role !== 'REVIEWING_OFFICER') return false;
        if (acc.rtoCode === testRtoCode) return false;
        if (excludeOfficerIds.indexOf(acc.officerId) !== -1) return false;
        return true;
    });

    if (eligible.length === 0) {
        var fallback = rtoAccounts.filter(function(acc) {
            return acc.role === 'REVIEWING_OFFICER' && excludeOfficerIds.indexOf(acc.officerId) === -1;
        });
        return fallback[0] || rtoAccounts[7];
    }

    if (testRtoCode === 'TG-03' && excludeOfficerIds.indexOf('OFF-17') === -1) {
        for (var k = 0; k < eligible.length; k++) {
            if (eligible[k].officerId === 'OFF-17') return eligible[k];
        }
    }
    if (testRtoCode === 'TG-03' && excludeOfficerIds.indexOf('OFF-17') !== -1 && excludeOfficerIds.indexOf('OFF-31') === -1) {
        for (var k2 = 0; k2 < eligible.length; k2++) {
            if (eligible[k2].officerId === 'OFF-31') return eligible[k2];
        }
    }

    return eligible[0];
}

// ─── IMMUTABLE AUDIT LOG SYSTEM ───
function getAuditLog() {
    var saved = localStorage.getItem('drivesetu_audit_log');
    if (saved) { try { return JSON.parse(saved); } catch(e) {} }
    var initialLog = [];
    try { localStorage.setItem('drivesetu_audit_log', JSON.stringify(initialLog)); } catch(e) {}
    return initialLog;
}

// Automatic localStorage sanitizer for active sessions
(function sanitizeStoredDataOnLoad() {
    try {
        // Clear any old mock applications from localStorage to ensure clean state
        var rawApps = localStorage.getItem('drivesetu_applications');
        if (rawApps && (rawApps.indexOf('APP-DEMO-001') !== -1 || rawApps.indexOf('LL-SUFYAN-001') !== -1 || rawApps.indexOf('APP-206500') !== -1)) {
            localStorage.removeItem('drivesetu_applications');
            localStorage.removeItem('drivesetu_audit_log');
            localStorage.removeItem('drivesetu_pending_reviews');
        }
    } catch(e) {}
})();

// Automatic localStorage sanitizer for active sessions
(function sanitizeStoredDataOnLoad() {
    try {
        var rawLog = localStorage.getItem('drivesetu_audit_log');
        if (rawLog && (rawLog.indexOf('Officer 17') !== -1 || rawLog.indexOf('Officer 31') !== -1)) {
            var log = JSON.parse(rawLog);
            log = log.map(function(ev) {
                if (ev.details) {
                    ev.details = ev.details
                        .replace(/Officer 17 \([^)]+\)/gi, 'Independent Evaluator')
                        .replace(/Officer 31 \([^)]+\)/gi, 'Independent Evaluator')
                        .replace(/Evaluator 1 allocated: Officer \d+ \([^)]+\)/gi, 'Independent evaluator automatically allocated through cross-RTO assignment.')
                        .replace(/Evaluator 2 allocated: Officer \d+ \([^)]+\)/gi, 'Independent evaluator automatically allocated through cross-RTO assignment.');
                }
                return ev;
            });
            localStorage.setItem('drivesetu_audit_log', JSON.stringify(log));
        }

        var rawRev = localStorage.getItem('drivesetu_pending_reviews');
        if (rawRev && (rawRev.indexOf('Officer 17') !== -1 || rawRev.indexOf('Officer 31') !== -1 || rawRev.indexOf('TG-08 + TG-12') !== -1)) {
            var revs = JSON.parse(rawRev);
            revs = revs.map(function(r) {
                if (r.notes) {
                    r.notes = r.notes.replace(/Allocated to Officer 17 \([^)]+\) & Officer 31 \([^)]+\)/gi, 'Allocated via Cross-RTO Evaluation Engine.');
                }
                if (r.reviewedBy) {
                    r.reviewedBy = r.reviewedBy.replace(/Dual Consensus \(TG-08 \+ TG-12\)/gi, 'Dual Independent Consensus');
                }
                return r;
            });
            localStorage.setItem('drivesetu_pending_reviews', JSON.stringify(revs));
        }
    } catch(e) {}
})();

function appendAuditEvent(appId, eventType, actor, role, details) {
    var log = getAuditLog();
    var entry = {
        id: 'AE-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
        timestampReadable: new Date().toLocaleString('en-IN'),
        appId: appId,
        eventType: eventType,
        actor: actor,
        role: role,
        details: details || '',
        hash: 'sha256:' + Math.random().toString(36).substr(2, 16) + Math.random().toString(36).substr(2, 16)
    };
    log.push(entry);
    try { localStorage.setItem('drivesetu_audit_log', JSON.stringify(log)); } catch(e) {}
    return entry;
}

// ─── DUAL EVALUATOR ALLOCATION ENGINE (Anti-Bribery Core) ───
function allocateDualEvaluators(testRtoCode) {
    var eligible = rtoAccounts.filter(function(acc) {
        return acc.role === 'REVIEWING_OFFICER' && acc.rtoCode !== testRtoCode;
    });
    if (eligible.length < 2) {
        eligible = rtoAccounts.filter(function(acc) { return acc.role === 'REVIEWING_OFFICER'; });
    }
    var eval1 = null, eval2 = null;
    // Deterministic demo: TG-03 test → OFF-17 (TG-08) + OFF-31 (TG-12)
    if (testRtoCode === 'TG-03') {
        for (var i = 0; i < eligible.length; i++) {
            if (eligible[i].officerId === 'OFF-17') eval1 = eligible[i];
            if (eligible[i].officerId === 'OFF-31') eval2 = eligible[i];
        }
    }
    if (!eval1 || !eval2) {
        var shuffled = eligible.slice().sort(function() { return 0.5 - Math.random(); });
        eval1 = shuffled[0];
        for (var j = 1; j < shuffled.length; j++) {
            if (shuffled[j].rtoCode !== eval1.rtoCode) { eval2 = shuffled[j]; break; }
        }
        if (!eval2) eval2 = shuffled[1] || shuffled[0];
    }
    return { evaluator1: eval1, evaluator2: eval2 };
}

// ─── ROLE-BASED INFORMATION SECURITY & BLINDING ENGINE ───
function getBlindedApplicationForRole(appObj, userRole, currentOfficerId) {
    if (!appObj) return appObj;

    // Deep copy to prevent mutating in-memory store
    var b = JSON.parse(JSON.stringify(appObj));

    // System Admin sees full governance audit data for oversight
    if (userRole === 'ADMIN') {
        return b;
    }

    // 1. BLIND EVALUATOR IDENTITIES & CO-EVALUATOR DATA
    var isEval1 = b.evaluator1 && currentOfficerId && (b.evaluator1.officerId === currentOfficerId || b.evaluator1.email === currentOfficerId);
    var isEval2 = b.evaluator2 && currentOfficerId && (b.evaluator2.officerId === currentOfficerId || b.evaluator2.email === currentOfficerId);

    if (userRole === 'REVIEWING_OFFICER') {
        if (isEval1) {
            b.evaluator1 = {
                officerId: currentOfficerId,
                rtoCode: 'CONFIDENTIAL',
                name: 'You (Assigned Evaluator)',
                decision: b.evaluator1.decision || null,
                reason: b.evaluator1.reason || null,
                timestamp: b.evaluator1.timestamp || null,
                timestampReadable: b.evaluator1.timestampReadable || null
            };
            delete b.evaluator2; // Blind Evaluator 2 identity completely
        } else if (isEval2) {
            b.evaluator2 = {
                officerId: currentOfficerId,
                rtoCode: 'CONFIDENTIAL',
                name: 'You (Assigned Evaluator)',
                decision: b.evaluator2.decision || null,
                reason: b.evaluator2.reason || null,
                timestamp: b.evaluator2.timestamp || null,
                timestampReadable: b.evaluator2.timestampReadable || null
            };
            delete b.evaluator1; // Blind Evaluator 1 identity completely
        } else {
            delete b.evaluator1;
            delete b.evaluator2;
        }

        if (b.adjudicator && b.adjudicator.officerId !== currentOfficerId) {
            delete b.adjudicator;
        }
    } else {
        // Test Centre Operator or Citizen: Delete ALL evaluator details
        delete b.evaluator1;
        delete b.evaluator2;
        delete b.adjudicator;
    }

    // 2. SANITIZE AUDIT TRAIL FOR NON-ADMIN ROLES
    if (b.auditTrail && Array.isArray(b.auditTrail)) {
        b.auditTrail = b.auditTrail.map(function(ev) {
            var sEv = JSON.parse(JSON.stringify(ev));

            if (sEv.eventType === 'EVALUATOR_ALLOCATED' || sEv.eventType === 'OFFICER_ALLOCATED') {
                sEv.actor = 'System Engine';
                sEv.role = 'SYSTEM';
                sEv.details = 'Independent evaluator automatically allocated through cross-RTO assignment.';
            } else if (sEv.eventType === 'EVALUATION_SUBMITTED') {
                if (currentOfficerId && (sEv.actor.indexOf(currentOfficerId) !== -1 || (userRole === 'REVIEWING_OFFICER' && (isEval1 || isEval2)))) {
                    sEv.actor = 'You (Assigned Evaluator)';
                    sEv.details = 'Your independent review decision submitted.';
                } else {
                    sEv.actor = 'Independent Evaluator';
                    sEv.details = 'Independent evaluation decision submitted.';
                }
            } else if (sEv.eventType === 'DISAGREEMENT_DETECTED') {
                sEv.actor = 'System Engine';
                sEv.details = 'Independent dual evaluation completed with conflicting decisions.';
            } else if (sEv.eventType === 'ADJUDICATION_ASSIGNED') {
                sEv.actor = 'System Engine';
                sEv.details = 'Automated adjudication assigned through cross-RTO engine.';
            }

            if (sEv.details) {
                sEv.details = sEv.details
                    .replace(/OFFICER-\d+/gi, 'Independent Evaluator')
                    .replace(/Officer \d+ \([^)]+\)/gi, 'Independent Evaluator')
                    .replace(/Officer \d+/gi, 'Independent Evaluator')
                    .replace(/OFF-[A-Z0-9]+/gi, 'Independent Evaluator')
                    .replace(/\(TG-\d+\)/gi, '')
                    .replace(/E1 \([^)]+\)/gi, 'Independent Review')
                    .replace(/E2 \([^)]+\)/gi, 'Independent Review');
            }
            return sEv;
        });
    }

    return b;
}

// ─── EVALUATOR DECISION SUBMISSION (Role-Guarded, Blind) ───
function submitEvaluatorDecision(appId, decision, reason) {
    var session = safeParseJSON(sessionStorage.getItem('rtoSession'), null);
    if (!session || session.role !== 'REVIEWING_OFFICER') {
        alert('⛔ ACCESS DENIED: Only authorized Independent Evaluators can submit decisions.'); return;
    }
    if (!reason || reason.trim() === '') {
        alert('⚠️ Mandatory: Please provide a reason/evidence reference for your decision.'); return;
    }
    var apps = getStoredApplications();
    var appObj = null;
    for (var i = 0; i < apps.length; i++) { if (apps[i].id === appId) { appObj = apps[i]; break; } }
    if (!appObj) { alert('Application not found.'); return; }

    // Check if officer is assigned evaluator or adjudicator
    var isEval1 = appObj.evaluator1 && appObj.evaluator1.officerId === session.officerId;
    var isEval2 = appObj.evaluator2 && appObj.evaluator2.officerId === session.officerId;
    var isAdjudicator = appObj.adjudicator && appObj.adjudicator.officerId === session.officerId;

    if (isAdjudicator) { submitAdjudicatorDecision(appId, decision, reason); return; }
    if (!isEval1 && !isEval2) {
        alert('⛔ ACCESS DENIED: You are not an assigned evaluator for this application.'); return;
    }
    var evalSlot = isEval1 ? 'evaluator1' : 'evaluator2';
    if (appObj[evalSlot].decision) {
        alert('⚠️ You have already submitted your evaluation. Decisions are immutable.'); return;
    }

    appObj[evalSlot].decision = decision;
    appObj[evalSlot].reason = reason;
    appObj[evalSlot].timestamp = new Date().toISOString();
    appObj[evalSlot].timestampReadable = new Date().toLocaleString('en-IN');

    appendAuditEvent(appId, 'EVALUATION_SUBMITTED', session.officerId, 'REVIEWING_OFFICER',
        'Decision: ' + decision + ' | Reason: ' + reason);

    var e1 = appObj.evaluator1, e2 = appObj.evaluator2;
    if (e1.decision && e2.decision) {
        if (e1.decision === 'PASS' && e2.decision === 'PASS') {
            appObj.evaluationStatus = 'CONSENSUS_PASS'; appObj.status = 'Approved';
            appObj.reviewStage = 'Licence Approved (Dual Independent Consensus)';
            appendAuditEvent(appId, 'CONSENSUS_REACHED', 'System Engine', 'SYSTEM', 'Independent dual evaluation completed: Consensus PASS');
            appendAuditEvent(appId, 'FINAL_DECISION', 'System Engine', 'SYSTEM', 'APPROVED');
            appendAuditEvent(appId, 'LICENCE_ISSUED', 'System Engine', 'SYSTEM', 'Licence issued via dual independent consensus');
            var reviews = getStoredReviews();
            for (var r = 0; r < reviews.length; r++) {
                if (reviews[r].appId === appId) { reviews[r].status = 'Approved'; reviews[r].reviewedBy = 'Dual Independent Consensus'; }
            }
            saveStoredReviews(reviews); saveStoredApplications(apps);
            alert('✅ CONSENSUS REACHED: Both independent evaluators agreed PASS.\n\nLicence APPROVED for ' + appObj.name);
        } else if (e1.decision === 'FAIL' && e2.decision === 'FAIL') {
            appObj.evaluationStatus = 'CONSENSUS_FAIL'; appObj.status = 'Rejected';
            appObj.reviewStage = 'Rejected (Dual Independent Consensus)';
            appendAuditEvent(appId, 'CONSENSUS_REACHED', 'System Engine', 'SYSTEM', 'Independent dual evaluation completed: Consensus FAIL');
            appendAuditEvent(appId, 'FINAL_DECISION', 'System Engine', 'SYSTEM', 'REJECTED');
            var reviews2 = getStoredReviews();
            for (var r2 = 0; r2 < reviews2.length; r2++) {
                if (reviews2[r2].appId === appId) { reviews2[r2].status = 'Rejected'; reviews2[r2].reviewedBy = 'Dual Independent Consensus'; }
            }
            saveStoredReviews(reviews2); saveStoredApplications(apps);
            alert('❌ CONSENSUS REACHED: Both independent evaluators agreed FAIL.\n\nApplication REJECTED for ' + appObj.name);
        } else {
            appObj.evaluationStatus = 'DISAGREEMENT';
            appObj.status = 'Disagreement - Adjudication Required';
            appObj.reviewStage = 'Evaluator Disagreement — Adjudication Pending';
            appendAuditEvent(appId, 'DISAGREEMENT_DETECTED', 'System Engine', 'SYSTEM',
                'Independent dual evaluation completed with conflicting decisions.');
            var testRto = (appObj.serviceDetails && appObj.serviceDetails.rtoCode) ? appObj.serviceDetails.rtoCode : 'TG-03';
            var adjEligible = rtoAccounts.filter(function(acc) {
                return acc.role === 'REVIEWING_OFFICER' && acc.rtoCode !== testRto &&
                    acc.officerId !== appObj.evaluator1.officerId && acc.officerId !== appObj.evaluator2.officerId;
            });
            if (adjEligible.length > 0) {
                var adj = adjEligible[Math.floor(Math.random() * adjEligible.length)];
                appObj.adjudicator = { officerId: adj.officerId, rtoCode: adj.rtoCode, name: adj.name, decision: null, reason: null, timestamp: null, timestampReadable: null };
                appObj.evaluationStatus = 'ADJUDICATION'; appObj.status = 'Adjudication Review';
                appObj.reviewStage = 'Adjudication Pending';
                appendAuditEvent(appId, 'ADJUDICATION_ASSIGNED', 'System Engine', 'SYSTEM', 'Automated adjudication assigned through cross-RTO engine.');
            }
            saveStoredApplications(apps);
            alert('⚠️ DISAGREEMENT DETECTED: Independent evaluation completed with conflicting decisions.\n\nCase referred to automated adjudication.');
        }
    } else {
        saveStoredApplications(apps);
        alert('✅ Evaluation recorded.\n\nDecision: ' + decision + '\n\nYour review has been submitted to the independent evaluation engine.');
    }
    closeReviewModal();
}

// ─── ADJUDICATOR DECISION SUBMISSION ───
function submitAdjudicatorDecision(appId, decision, reason) {
    var session = safeParseJSON(sessionStorage.getItem('rtoSession'), null);
    if (!session || session.role !== 'REVIEWING_OFFICER') { alert('⛔ ACCESS DENIED.'); return; }
    if (!reason || reason.trim() === '') { alert('⚠️ Mandatory reason required.'); return; }
    var apps = getStoredApplications();
    var appObj = null;
    for (var i = 0; i < apps.length; i++) { if (apps[i].id === appId) { appObj = apps[i]; break; } }
    if (!appObj || !appObj.adjudicator || appObj.adjudicator.officerId !== session.officerId) {
        alert('⛔ ACCESS DENIED: You are not the assigned adjudicator.'); return;
    }
    if (appObj.adjudicator.decision) { alert('⚠️ Adjudication already submitted. Decisions are immutable.'); return; }

    appObj.adjudicator.decision = decision;
    appObj.adjudicator.reason = reason;
    appObj.adjudicator.timestamp = new Date().toISOString();
    appObj.adjudicator.timestampReadable = new Date().toLocaleString('en-IN');
    appendAuditEvent(appId, 'EVALUATION_SUBMITTED', session.name + ' (' + session.rtoCode + ')', 'ADJUDICATOR',
        'Adjudication: ' + decision + ' | Reason: ' + reason);

    if (decision === 'PASS') {
        appObj.evaluationStatus = 'FINAL_PASS'; appObj.status = 'Approved';
        appObj.reviewStage = 'Approved (Adjudication Resolution)';
        appendAuditEvent(appId, 'FINAL_DECISION', 'System', 'SYSTEM', 'APPROVED via adjudication');
        appendAuditEvent(appId, 'LICENCE_ISSUED', 'System', 'SYSTEM', 'Licence issued after adjudication');
    } else {
        appObj.evaluationStatus = 'FINAL_FAIL'; appObj.status = 'Rejected';
        appObj.reviewStage = 'Rejected (Adjudication Resolution)';
        appendAuditEvent(appId, 'FINAL_DECISION', 'System', 'SYSTEM', 'REJECTED via adjudication');
    }
    var reviews = getStoredReviews();
    for (var r = 0; r < reviews.length; r++) {
        if (reviews[r].appId === appId) {
            reviews[r].status = decision === 'PASS' ? 'Approved' : 'Rejected';
            reviews[r].reviewedBy = 'Adjudication by ' + session.name + ' (' + session.rtoCode + ')';
        }
    }
    saveStoredReviews(reviews); saveStoredApplications(apps);
    alert((decision === 'PASS' ? '✅' : '❌') + ' ADJUDICATION COMPLETE\n\nFinal: ' + (decision === 'PASS' ? 'APPROVED' : 'REJECTED'));
    closeReviewModal();
}

// ─── ADMIN ESCALATION (Governance Only — Cannot Change Decision) ───
function adminEscalateForReview(appId) {
    var session = safeParseJSON(sessionStorage.getItem('rtoSession'), null);
    if (!session || session.role !== 'ADMIN') { alert('⛔ Only System Administrators can request independent review.'); return; }
    var reason = prompt('Enter reason for requesting an independent governance review.\n\nIMPORTANT: System Administrators CANNOT alter or override evaluator decisions.');
    if (!reason || reason.trim() === '') return;
    appendAuditEvent(appId, 'INDEPENDENT_REVIEW_REQUESTED', session.name, 'ADMIN', 'Independent Governance Review Requested: ' + reason);
    var apps = getStoredApplications();
    for (var i = 0; i < apps.length; i++) {
        if (apps[i].id === appId) {
            if (!apps[i].escalations) apps[i].escalations = [];
            apps[i].escalations.push({ reason: reason, by: session.name, timestamp: new Date().toLocaleString('en-IN') });
            break;
        }
    }
    saveStoredApplications(apps);
    alert('📋 Independent Review Request recorded in immutable audit log.\n\nNote: This flags the case for governance oversight and does NOT alter the evaluator decision.');
    render();
}

// ─── ADMIN DASHBOARD RENDERER (Monitoring Only) ───
function renderAdminDashboard() {
    var allApps = getStoredApplications();
    var auditLog = getAuditLog();
    var reviews = getStoredReviews();

    // Compute statistics
    var totalApps = allApps.length;
    var testsCompleted = allApps.filter(function(a) { return a.evidenceStatus === 'LOCKED' || a.testEvidence; }).length;
    var awaitingReview = allApps.filter(function(a) { return a.evaluationStatus === 'BOTH_PENDING' || a.evaluationStatus === 'ADJUDICATION' || a.status === 'Pending RTO Review' || a.status === 'Pending Independent Review'; }).length;
    var aiReports = allApps.filter(function(a) { return a.testEvidence || a.evidenceStatus === 'LOCKED'; }).length;
    var activeRtos = 4;
    var activeEvaluators = rtoAccounts.filter(function(a) { return a.role === 'REVIEWING_OFFICER'; }).length;
    var completedReviews = allApps.filter(function(a) { return a.status === 'Approved' || a.status === 'Rejected'; }).length;
    var auditEvents = auditLog.length;
    var licencesIssued = allApps.filter(function(a) { return a.status === 'Approved'; }).length;
    var failedCases = allApps.filter(function(a) { return a.status === 'Rejected'; }).length;
    var consensusCases = allApps.filter(function(a) { return a.evaluationStatus === 'CONSENSUS_PASS' || a.evaluationStatus === 'CONSENSUS_FAIL'; }).length;
    var disagreementCases = allApps.filter(function(a) { return a.evaluationStatus === 'DISAGREEMENT' || a.evaluationStatus === 'ADJUDICATION'; }).length;
    var escalatedCases = allApps.filter(function(a) { return a.escalations && a.escalations.length > 0; }).length;
    var eval1Pending = allApps.filter(function(a) { return a.evaluator1 && !a.evaluator1.decision && a.evaluationStatus; }).length;
    var eval2Pending = allApps.filter(function(a) { return a.evaluator2 && !a.evaluator2.decision && a.evaluationStatus; }).length;

    // Anti-bribery flow diagram
    var flowHTML = '<div class="card animate-in" style="padding:1.5rem; margin-bottom:1.25rem; background:linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%); border:1px solid #bbf7d0;">' +
        '<div class="card-title" style="margin-bottom:1rem;"><i class="fa-solid fa-shield-halved" style="color:var(--primary); margin-right:0.4rem;"></i> Anti-Bribery Architecture — Workflow Separation</div>' +
        '<div style="display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:0.4rem; font-size:0.72rem; font-weight:600; text-transform:uppercase; letter-spacing:0.04em;">' +
            '<div style="background:#fff; border:1px solid #86efac; padding:0.4rem 0.7rem; border-radius:6px; color:#166534;">Citizen</div>' +
            '<i class="fa-solid fa-arrow-right" style="color:#86efac;"></i>' +
            '<div style="background:#fff; border:1px solid #86efac; padding:0.4rem 0.7rem; border-radius:6px; color:#166534;">Application</div>' +
            '<i class="fa-solid fa-arrow-right" style="color:#86efac;"></i>' +
            '<div style="background:#fff; border:1px solid #93c5fd; padding:0.4rem 0.7rem; border-radius:6px; color:#1e40af;">RTO Test Centre</div>' +
            '<i class="fa-solid fa-arrow-right" style="color:#93c5fd;"></i>' +
            '<div style="background:#fff; border:1px solid #93c5fd; padding:0.4rem 0.7rem; border-radius:6px; color:#1e40af;">Video + Sensor</div>' +
            '<i class="fa-solid fa-arrow-right" style="color:#fbbf24;"></i>' +
            '<div style="background:#fff; border:1px solid #fbbf24; padding:0.4rem 0.7rem; border-radius:6px; color:#92400e;">AI Analysis</div>' +
            '<i class="fa-solid fa-arrow-right" style="color:#f97316;"></i>' +
            '<div style="background:#fff7ed; border:1px solid #fdba74; padding:0.4rem 0.7rem; border-radius:6px; color:#9a3412;">Auto Cross-RTO</div>' +
            '<i class="fa-solid fa-arrow-right" style="color:#f97316;"></i>' +
            '<div style="background:#fef3c7; border:1px solid #fbbf24; padding:0.4rem 0.7rem; border-radius:6px; color:#92400e;">Independent Dual Review</div>' +
            '<i class="fa-solid fa-arrow-right" style="color:#10b981;"></i>' +
            '<div style="background:#d1fae5; border:1px solid #6ee7b7; padding:0.4rem 0.7rem; border-radius:6px; color:#065f46;">Consensus</div>' +
            '<i class="fa-solid fa-arrow-right" style="color:#10b981;"></i>' +
            '<div style="background:#d1fae5; border:1px solid #34d399; padding:0.4rem 0.7rem; border-radius:6px; color:#065f46;">Licence</div>' +
        '</div>' +
        '<div style="text-align:center; margin-top:0.75rem; font-size:0.72rem; color:var(--text-muted);">' +
            '<i class="fa-solid fa-eye" style="color:#7c3aed;"></i> <strong style="color:#7c3aed;">System Admin</strong> monitors this entire flow but <strong>CANNOT</strong> approve, reject, or alter any decision.' +
        '</div>' +
    '</div>';

    // Stats row 1
    var statsRow1 = '<div class="stats-row animate-in" style="margin-bottom:0.75rem;">' +
        '<div class="stat-card"><div class="stat-icon" style="background:#eff6ff;color:#2563eb;"><i class="fa-solid fa-folder-open"></i></div><div><div class="stat-value">' + totalApps + '</div><div class="stat-label">Total Applications</div></div></div>' +
        '<div class="stat-card"><div class="stat-icon" style="background:#dbeafe;color:#2563eb;"><i class="fa-solid fa-clipboard-check"></i></div><div><div class="stat-value">' + testsCompleted + '</div><div class="stat-label">Tests Completed</div></div></div>' +
        '<div class="stat-card"><div class="stat-icon" style="background:#fff7ed;color:#ea580c;"><i class="fa-solid fa-hourglass-half"></i></div><div><div class="stat-value">' + awaitingReview + '</div><div class="stat-label">Awaiting Review</div></div></div>' +
        '<div class="stat-card"><div class="stat-icon" style="background:#fef3c7;color:#d97706;"><i class="fa-solid fa-robot"></i></div><div><div class="stat-value">' + aiReports + '</div><div class="stat-label">AI Reports</div></div></div>' +
    '</div>';

    // Stats row 2
    var statsRow2 = '<div class="stats-row animate-in" style="margin-bottom:1.25rem; animation-delay:0.05s;">' +
        '<div class="stat-card"><div class="stat-icon" style="background:#ede9fe;color:#7c3aed;"><i class="fa-solid fa-building-flag"></i></div><div><div class="stat-value">' + activeRtos + '</div><div class="stat-label">Active RTOs</div></div></div>' +
        '<div class="stat-card"><div class="stat-icon" style="background:#fce7f3;color:#db2777;"><i class="fa-solid fa-user-shield"></i></div><div><div class="stat-value">' + activeEvaluators + '</div><div class="stat-label">Active Evaluators</div></div></div>' +
        '<div class="stat-card"><div class="stat-icon" style="background:#d1fae5;color:#059669;"><i class="fa-solid fa-circle-check"></i></div><div><div class="stat-value">' + completedReviews + '</div><div class="stat-label">Completed Reviews</div></div></div>' +
        '<div class="stat-card"><div class="stat-icon" style="background:#e0e7ff;color:#4f46e5;"><i class="fa-solid fa-scroll"></i></div><div><div class="stat-value">' + auditEvents + '</div><div class="stat-label">Audit Events</div></div></div>' +
    '</div>';

    // Evaluation monitoring section
    var evalMonitorHTML = '<div class="card animate-in" style="margin-bottom:1.25rem; animation-delay:0.1s;">' +
        '<div class="card-title"><i class="fa-solid fa-chart-simple" style="color:var(--primary); margin-right:0.4rem;"></i> Evaluation Monitoring</div>' +
        '<div class="stats-row" style="margin-bottom:0;">' +
            '<div class="stat-card" style="border-left:3px solid #f59e0b;"><div><div class="stat-value" style="font-size:1.1rem;">' + eval1Pending + '</div><div class="stat-label">Awaiting Eval 1</div></div></div>' +
            '<div class="stat-card" style="border-left:3px solid #8b5cf6;"><div><div class="stat-value" style="font-size:1.1rem;">' + eval2Pending + '</div><div class="stat-label">Awaiting Eval 2</div></div></div>' +
            '<div class="stat-card" style="border-left:3px solid #10b981;"><div><div class="stat-value" style="font-size:1.1rem;">' + consensusCases + '</div><div class="stat-label">Consensus</div></div></div>' +
            '<div class="stat-card" style="border-left:3px solid #ef4444;"><div><div class="stat-value" style="font-size:1.1rem;">' + disagreementCases + '</div><div class="stat-label">Disagreement</div></div></div>' +
            '<div class="stat-card" style="border-left:3px solid #6366f1;"><div><div class="stat-value" style="font-size:1.1rem;">' + escalatedCases + '</div><div class="stat-label">Escalated</div></div></div>' +
        '</div>' +
    '</div>';

    // System Activity — All applications table (read-only, no action buttons)
    var appRows = allApps.map(function(app) {
        var evalStatus = app.evaluationStatus || (app.status === 'Approved' ? 'COMPLETE' : app.status === 'Rejected' ? 'COMPLETE' : 'PENDING');
        var statusBadge = '';
        if (app.status === 'Approved') statusBadge = '<span class="badge badge-approved">✓ Approved</span>';
        else if (app.status === 'Rejected') statusBadge = '<span class="badge badge-rejected" style="background:#fff0f0;color:#c53030;border:1px solid #feb2b2;">✗ Rejected</span>';
        else if (app.status === 'Adjudication Review') statusBadge = '<span class="badge" style="background:#fef3c7;color:#92400e;border:1px solid #fbbf24;">⚖️ Adjudication</span>';
        else if (app.status === 'Disagreement - Adjudication Required') statusBadge = '<span class="badge" style="background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;">⚠️ Disagreement</span>';
        else if (app.status === 'Pending Independent Review' || app.status === 'Pending RTO Review') statusBadge = '<span class="badge badge-pending">⏳ Under Review</span>';
        else statusBadge = '<span class="badge badge-pending">● ' + app.status + '</span>';

        var evalInfo = '';
        if (app.evaluator1) evalInfo += 'E1: ' + (app.evaluator1.name || '').split(' (')[0] + (app.evaluator1.decision ? ' (' + app.evaluator1.decision + ')' : ' (Pending)');
        if (app.evaluator2) evalInfo += ' | E2: ' + (app.evaluator2.name || '').split(' (')[0] + (app.evaluator2.decision ? ' (' + app.evaluator2.decision + ')' : ' (Pending)');

        var escalateBtn = '<button class="btn btn-ghost" style="padding:0.25rem 0.6rem; font-size:0.72rem; color:#7c3aed; border:1px solid #c4b5fd;" onclick="adminEscalateForReview(\'' + app.id + '\')"><i class="fa-solid fa-flag"></i> Request Independent Review</button>';

        return '<tr>' +
            '<td><strong>' + app.id + '</strong></td>' +
            '<td>' + app.name + '</td>' +
            '<td>' + app.type + '</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td style="font-size:0.75rem; color:var(--text-muted); max-width:200px;">' + (evalInfo || 'N/A') + '</td>' +
            '<td>' + escalateBtn + '</td>' +
        '</tr>';
    }).join('');

    var sysActivityHTML = '<div class="card animate-in" style="animation-delay:0.15s;">' +
        '<div class="card-title flex-between">' +
            '<span><i class="fa-solid fa-list-check" style="color:var(--primary); margin-right:0.4rem;"></i> System Activity — All Applications (Read-Only)</span>' +
            '<span class="badge" style="background:#ede9fe; color:#7c3aed; border:1px solid #c4b5fd;"><i class="fa-solid fa-eye"></i> Monitoring Only</span>' +
        '</div>' +
        '<div style="background:#faf5ff; border:1px solid #e9d5ff; border-radius:6px; padding:0.6rem 0.8rem; margin-bottom:1rem; font-size:0.78rem; color:#7c3aed;">' +
            '<strong><i class="fa-solid fa-info-circle"></i> Admin Notice:</strong> You can monitor applications and escalate for governance review. You <strong>CANNOT</strong> approve, reject, or modify any individual application decision.' +
        '</div>' +
        '<div style="overflow-x:auto;">' +
            '<table class="data-table"><thead><tr>' +
                '<th>App ID</th><th>Applicant</th><th>Type</th><th>Status</th><th>Evaluator Status</th><th>Admin Action</th>' +
            '</tr></thead><tbody>' + (appRows || '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No applications.</td></tr>') + '</tbody></table>' +
        '</div>' +
    '</div>';

    // Audit Log section
    var recentAudit = auditLog.slice(-15).reverse();
    var auditRows = recentAudit.map(function(e) {
        var typeColor = '#6366f1';
        if (e.eventType.indexOf('APPROVED') !== -1 || e.eventType === 'LICENCE_ISSUED' || e.eventType === 'CONSENSUS_REACHED') typeColor = '#059669';
        else if (e.eventType.indexOf('REJECTED') !== -1 || e.eventType === 'DISAGREEMENT_DETECTED') typeColor = '#dc2626';
        else if (e.eventType.indexOf('ALLOCATED') !== -1 || e.eventType.indexOf('SUBMITTED') !== -1) typeColor = '#2563eb';
        else if (e.eventType === 'ESCALATION_REQUESTED') typeColor = '#7c3aed';
        return '<tr>' +
            '<td style="font-size:0.72rem; white-space:nowrap;">' + e.timestampReadable + '</td>' +
            '<td><strong>' + (e.appId || 'N/A') + '</strong></td>' +
            '<td><span style="color:' + typeColor + '; font-weight:600; font-size:0.78rem;">' + e.eventType + '</span></td>' +
            '<td style="font-size:0.78rem;">' + e.actor + ' <span style="color:var(--text-muted);">(' + e.role + ')</span></td>' +
            '<td style="font-size:0.75rem; color:var(--text-muted); max-width:250px; overflow:hidden; text-overflow:ellipsis;">' + (e.details || '') + '</td>' +
        '</tr>';
    }).join('');
    if (!auditRows) auditRows = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No audit events recorded yet. Events will appear here as the workflow progresses.</td></tr>';

    var auditHTML = '<div class="card animate-in" style="margin-top:1.25rem; animation-delay:0.2s;">' +
        '<div class="card-title flex-between">' +
            '<span><i class="fa-solid fa-scroll" style="color:#4f46e5; margin-right:0.4rem;"></i> Immutable Audit Trail (Last 15 Events)</span>' +
            '<span class="badge" style="background:#e0e7ff; color:#4f46e5; border:1px solid #a5b4fc;"><i class="fa-solid fa-lock"></i> Read-Only</span>' +
        '</div>' +
        '<div style="overflow-x:auto;">' +
            '<table class="data-table"><thead><tr>' +
                '<th>Timestamp</th><th>App ID</th><th>Event Type</th><th>Actor</th><th>Details</th>' +
            '</tr></thead><tbody>' + auditRows + '</tbody></table>' +
        '</div>' +
    '</div>';

    // Pending RTO Registration Requests Section (Admin Approval Queue)
    var pendingReqs = [];
    try {
        var rawLocal = localStorage.getItem('drivesetu_pending_rto_requests');
        pendingReqs = rawLocal ? JSON.parse(rawLocal) : [];
    } catch(e) { pendingReqs = []; }

    var pendingReqRows = (pendingReqs || []).map(function(req) {
        var statusBadge = '';
        if (req.status === 'Approved') {
            statusBadge = '<span class="badge" style="background:#f0fff4; color:#276749; border:1px solid #9ae6b4;"><i class="fa-solid fa-check"></i> Approved</span>';
        } else if (req.status === 'Rejected') {
            statusBadge = '<span class="badge" style="background:#fff5f5; color:#c53030; border:1px solid #feb2b2;"><i class="fa-solid fa-xmark"></i> Rejected</span>';
        } else {
            statusBadge = '<span class="badge" style="background:#fffbe6; color:#b7791f; border:1px solid #ffe58f;"><i class="fa-solid fa-clock"></i> Pending Approval</span>';
        }

        var roleBadge = '<span class="badge" style="background:#eef2ff; color:#3730a3; border:1px solid #c7d2fe; font-weight:600;">' + (req.role || 'REVIEWING_OFFICER') + '</span>';

        var actionBtns = '';
        if (req.status === 'Pending') {
            actionBtns = '<button class="btn btn-primary" style="padding:0.35rem 0.7rem; font-size:0.75rem; background:#16a34a; margin-right:0.35rem; border:none;" onclick="adminApproveRtoReq(\'' + (req.id || '') + '\', \'' + (req.email || '') + '\')"><i class="fa-solid fa-user-check"></i> Accept</button>' +
                         '<button class="btn btn-secondary" style="padding:0.35rem 0.7rem; font-size:0.75rem; background:#dc2626; color:#fff; border:none;" onclick="adminRejectRtoReq(\'' + (req.id || '') + '\', \'' + (req.email || '') + '\')"><i class="fa-solid fa-user-xmark"></i> Reject</button>';
        } else {
            actionBtns = '<span style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">Action Finalized</span>';
        }

        return '<tr>' +
            '<td><strong>' + (req.full_name || req.name || 'RTO Officer') + '</strong></td>' +
            '<td>' + req.email + '</td>' +
            '<td>' + roleBadge + '</td>' +
            '<td>' + (req.rto_code || 'TG-03') + ' (' + (req.rto_name || 'RTO') + ')</td>' +
            '<td>' + (req.officer_id || req.employee_id || 'OFF-01') + '</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td>' + actionBtns + '</td>' +
        '</tr>';
    }).join('');

    var pendingCount = (pendingReqs || []).filter(function(r) { return r.status === 'Pending'; }).length;

    var pendingReqsHTML = '<div class="card animate-in" style="margin-bottom:1.25rem; border:1px solid #a7f3d0; background:linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);">' +
        '<div class="card-title flex-between">' +
            '<span><i class="fa-solid fa-user-clock" style="color:#059669; margin-right:0.4rem;"></i> Pending RTO Employee Registrations (Portal Admin Approval Queue)</span>' +
            '<span class="badge" style="background:#ecfdf5; color:#047857; border:1px solid #6ee7b7; font-weight:700;">' + pendingCount + ' Pending Requests</span>' +
        '</div>' +
        '<div style="overflow-x:auto;">' +
            '<table class="data-table"><thead><tr>' +
                '<th>Applicant Name</th><th>Email Address</th><th>Requested Role</th><th>RTO Jurisdiction</th><th>Officer ID</th><th>Status</th><th>Portal Admin Action</th>' +
            '</tr></thead><tbody>' +
                (pendingReqRows || '<tr><td colspan="7" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No pending RTO employee registration requests at this time.</td></tr>') +
            '</tbody></table>' +
        '</div>' +
    '</div>';

    return flowHTML + statsRow1 + statsRow2 + pendingReqsHTML + evalMonitorHTML + sysActivityHTML + auditHTML;
}

// Global Portal Admin approval action handlers
async function adminApproveRtoReq(requestId, email) {
    if (!confirm('Approve registration request for email ' + email + '?')) return;
    try {
        if (typeof DriveSetuSupabase !== 'undefined' && DriveSetuSupabase.approveRTORegistrationRequest) {
            await DriveSetuSupabase.approveRTORegistrationRequest(requestId, email);
        }
        alert('✓ RTO Registration Request Approved! Account is now active.');
        render();
    } catch(err) {
        alert('Approval error: ' + (err.message || 'Failed to approve request.'));
    }
}

async function adminRejectRtoReq(requestId, email) {
    if (!confirm('Reject registration request for email ' + email + '?')) return;
    try {
        if (typeof DriveSetuSupabase !== 'undefined' && DriveSetuSupabase.rejectRTORegistrationRequest) {
            await DriveSetuSupabase.rejectRTORegistrationRequest(requestId, email);
        }
        alert('RTO Registration Request Rejected.');
        render();
    } catch(err) {
        alert('Rejection error: ' + (err.message || 'Failed to reject request.'));
    }
}

// ─── SHARED PERSISTENCE HELPERS (citizen uploads ↔ RTO admin) ───
function getStoredReviews() {
    var saved = localStorage.getItem('drivesetu_pending_reviews');
    if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
    }
    return [];
}

function saveStoredReviews(reviews) {
    try {
        localStorage.setItem('drivesetu_pending_reviews', JSON.stringify(reviews));
    } catch(e) {
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
    var apps = [];
    if (saved) {
        try { apps = JSON.parse(saved); } catch(e) {}
    }
    applications = apps;
    return apps;
}

function saveStoredApplications(apps) {
    applications = apps;
    localStorage.setItem('drivesetu_applications', JSON.stringify(apps));
}

// ─── MODAL STATE ───
var activeReviewModalAppId = null;
var isDeclineBoxVisible = false;

// ─── RTO OFFICE DIRECTORY ───
var rtoDirectory = [
    {
        rtoCode: 'TG-09',
        officeName: 'RTA Hyderabad Central (Khairatabad)',
        district: 'Hyderabad',
        address: 'RTA Office Khairatabad, Central Zone, Khairatabad Road, Hyderabad, Telangana - 500004',
        testCenter: 'Khairatabad Computer Test Hall 1',
        available: true
    },
    {
        rtoCode: 'TG-11',
        officeName: 'RTA Hyderabad East (Malakpet)',
        district: 'Hyderabad',
        address: 'RTA Office Malakpet, East Zone, Moosarambagh Road, Malakpet, Hyderabad, Telangana - 500036',
        testCenter: 'Malakpet Test Hall A',
        available: true
    },
    {
        rtoCode: 'TG-03',
        officeName: 'RTA Warangal Urban (Timmapur)',
        district: 'Warangal',
        address: 'RTA Warangal, Khammam Road T-Junction, Timmapur (Sivar), Rangasaipet, Telangana - 506005',
        testCenter: 'Warangal Computerized Testing Center',
        available: true
    },
    {
        rtoCode: 'TG-21',
        officeName: 'RTA Nizamabad (Nizamabad Rural)',
        district: 'Nizamabad',
        address: 'RTA Nizamabad, bypass Road, Nizamabad Rural, Nizamabad, Telangana - 503003',
        testCenter: 'Nizamabad Main Test Lab',
        available: true
    },
    {
        rtoCode: 'TG-29',
        officeName: 'RTA Medchal-Malkajgiri (Gundlapochampally)',
        district: 'Medchal',
        address: 'RTA Office Medchal, Gundlapochampally Village, Medchal Mandir, Telangana - 500014',
        testCenter: 'Medchal Computer Test Hall 2',
        available: true
    }
];

function lookupRtoOffice() {
    var input = document.getElementById('preferredRtoCode');
    var resultDiv = document.getElementById('rtoLookupResult');
    if (!input || !resultDiv) return;
    
    var val = input.value.trim().toUpperCase().replace('TS', 'TG');
    if (!val) {
        resultDiv.innerHTML = '';
        return;
    }
    
    var found = null;
    for (var i = 0; i < rtoDirectory.length; i++) {
        if (rtoDirectory[i].rtoCode === val) {
            found = rtoDirectory[i];
            break;
        }
    }
    
    if (found) {
        resultDiv.innerHTML = '<div style="color:#148f60; font-size:0.8rem; margin-top:0.4rem; padding:0.5rem; background:#e8f7f1; border:1px solid #c2ead8; border-radius:4px;">' +
            '<strong>✓ RTO Office Found</strong><br>' +
            'Office Name: <strong>' + found.officeName + '</strong><br>' +
            'Address: <strong>' + found.address + '</strong>' +
            '</div>';
    } else {
        resultDiv.innerHTML = '<div style="color:#c53030; font-size:0.8rem; margin-top:0.4rem; padding:0.5rem; background:#fff0f0; border:1px solid #feb2b2; border-radius:4px;">' +
            'RTO office not found. Please check the office code.' +
            '</div>';
    }
}

function allocateTestSlot(dateStr, windowStr) {
    var parts = windowStr.split('-');
    if (parts.length < 2) return { date: dateStr, time: "10:30 AM" };
    var startTime = parts[0].trim();
    
    var timeParts = startTime.split(':');
    if (timeParts.length < 2) return { date: dateStr, time: "10:30 AM" };
    var hr = parseInt(timeParts[0]);
    var minParts = timeParts[1].split(' ');
    var min = parseInt(minParts[0]);
    var ampm = minParts[1] || 'AM';
    
    var allocatedMin = min + 30;
    var allocatedHr = hr;
    if (allocatedMin >= 60) {
        allocatedMin = allocatedMin - 60;
        allocatedHr = allocatedHr + 1;
        if (allocatedHr === 12) {
            ampm = (ampm === 'AM') ? 'PM' : 'AM';
        } else if (allocatedHr > 12) {
            allocatedHr = 1;
        }
    }
    
    var allocatedMinStr = allocatedMin < 10 ? '0' + allocatedMin : String(allocatedMin);
    var allocatedTime = (allocatedHr < 10 ? '0' + allocatedHr : String(allocatedHr)) + ':' + allocatedMinStr + ' ' + ampm;
    
    return {
        date: dateStr,
        time: allocatedTime
    };
}

// ─── RTO DIRECTORY MODAL ───
function showRtoDirectoryModal() {
    var modalHTML = '<div class="modal-backdrop" id="rtoDirModalBackdrop" onclick="if(event.target===this) closeRtoDirectoryModal();">' +
        '<div class="modal-card animate-in" style="max-width:550px;">' +
            '<div class="modal-header">' +
                '<h3><i class="fa-solid fa-list-check" style="color:var(--primary); margin-right:0.4rem;"></i> RTO Office Lookup Directory</h3>' +
                '<button class="modal-close-btn" type="button" onclick="closeRtoDirectoryModal()"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<div style="max-height:350px; overflow-y:auto; padding:0.5rem 0;">' +
                '<p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1rem;">Click on any RTO office below to select it for your test center preference.</p>';
                
    for (var i = 0; i < rtoDirectory.length; i++) {
        var r = rtoDirectory[i];
        modalHTML += '<div class="card" style="padding:0.75rem 1rem; margin-bottom:0.75rem; cursor:pointer; hover:background:#fcfcfc; border:1px solid var(--border);" onclick="selectRtoFromModal(\'' + r.rtoCode + '\')">' +
            '<div class="flex-between">' +
                '<strong>' + r.officeName + ' (' + r.rtoCode + ')</strong>' +
                '<span class="badge badge-approved" style="font-size:0.7rem;">Active</span>' +
            '</div>' +
            '<p style="font-size:0.78rem; color:var(--text-muted); margin-top:0.25rem;">' + r.address + '</p>' +
            '</div>';
    }
    
    modalHTML += '</div>' +
            '<div style="text-align:right; border-top:1px solid var(--border); padding-top:0.75rem; margin-top:0.5rem;">' +
                '<button class="btn btn-ghost" type="button" onclick="closeRtoDirectoryModal()">Close</button>' +
            '</div>' +
        '</div>' +
    '</div>';
    
    var div = document.createElement('div');
    div.id = 'rtoDirModalWrapper';
    div.innerHTML = modalHTML;
    document.body.appendChild(div);
}

function closeRtoDirectoryModal() {
    var wrapper = document.getElementById('rtoDirModalWrapper');
    if (wrapper) {
        document.body.removeChild(wrapper);
    }
}

function selectRtoFromModal(code) {
    var input = document.getElementById('preferredRtoCode');
    if (input) {
        input.value = code;
        lookupRtoOffice();
    }
    closeRtoDirectoryModal();
}

// ─── DOWNLOAD SUMMARY DOCX ───
// ─── DOWNLOAD SUMMARY PDF ───
function downloadAppSummaryPDF(appId) {
    const { jsPDF } = window.jspdf;
    var doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    
    var apps = getStoredApplications();
    var app = null;
    for (var i = 0; i < apps.length; i++) {
        if (apps[i].id === appId) { app = apps[i]; break; }
    }
    if (!app) return;
    
    var ad = app.applicantDetails || {};
    var sd = app.serviceDetails || {};
    
    // Formatting Helpers
    function drawFooter(pageNumber, totalPages) {
        doc.setDrawColor(220);
        doc.setLineWidth(0.2);
        doc.line(15, 282, 195, 282);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text('DriveSetu | Digital RTO Service Platform — Hackathon Prototype', 15, 287);
        doc.text('Page ' + pageNumber + ' of ' + totalPages, 180, 287);
    }
    
    // ==========================================
    // PAGE 1
    // ==========================================
    
    // Header Logo/Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(20, 143, 96); // DriveSetu Green
    doc.text('DriveSetu', 15, 20);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Digital RTO Service Platform', 15, 24);
    
    // Header Right
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(17, 17, 17);
    doc.text('LEARNER\'S LICENCE', 195, 20, { align: 'right' });
    doc.text('APPLICATION SUMMARY', 195, 24, { align: 'right' });
    
    // Divider
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(15, 28, 195, 28);
    
    // Metadata Block
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.text('Application ID: ' + app.id, 15, 36);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Application Date: ' + app.date, 85, 36);
    doc.text('Status: Test Slot Allocated', 145, 36);
    
    // Divider 2
    doc.setDrawColor(230);
    doc.setLineWidth(0.2);
    doc.line(15, 40, 195, 40);
    
    // SECTION 1: APPLICANT DETAILS
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    doc.text('1. APPLICANT DETAILS', 15, 48);
    
    // Table Grid for Applicant Details
    var gridY = 53;
    var rowHeight = 7;
    doc.setFontSize(9);
    
    var details = [
        { label: 'Full Name:', val: ad.fullName || 'N/A' },
        { label: 'Date of Birth:', val: ad.dob || 'N/A' },
        { label: 'Gender:', val: ad.gender || 'N/A' },
        { label: 'Mobile Number:', val: ad.mobile || 'N/A' },
        { label: 'Email Address:', val: ad.email || 'N/A' },
        { label: 'Residential Address:', val: ad.address || 'N/A' },
        { label: 'State:', val: sd.state || 'N/A' },
        { label: 'District:', val: sd.district || 'N/A' },
        { label: 'PIN Code:', val: sd.pin || 'N/A' }
    ];
    if (sd.parentName) {
        details.push({ label: 'Parent / Guardian:', val: sd.parentName });
    }
    
    for (var r = 0; r < details.length; r++) {
        // Shaded rows
        if (r % 2 === 0) {
            doc.setFillColor(245, 247, 246);
            doc.rect(15, gridY + (r * rowHeight) - 4.5, 180, rowHeight, 'F');
        }
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(80);
        doc.text(details[r].label, 17, gridY + (r * rowHeight));
        
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(17, 17, 17);
        doc.text(String(details[r].val), 60, gridY + (r * rowHeight));
    }
    
    var nextY = gridY + (details.length * rowHeight) + 6;
    
    // SECTION 2: VEHICLE CATEGORIES REQUESTED
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    doc.text('2. VEHICLE CATEGORIES REQUESTED', 15, nextY);
    
    nextY += 5;
    // Draw Category Table Header
    doc.setFillColor(235, 240, 238);
    doc.rect(15, nextY, 180, 7, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(50);
    doc.text('S.No.', 18, nextY + 5);
    doc.text('Vehicle Category / Class', 45, nextY + 5);
    
    var classes = sd.vehicleClasses || [];
    nextY += 7;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(17, 17, 17);
    for (var c = 0; c < classes.length; c++) {
        // Row backgrounds
        if (c % 2 === 1) {
            doc.setFillColor(248, 248, 248);
            doc.rect(15, nextY, 180, 7, 'F');
        }
        doc.text(String(c + 1), 20, nextY + 5);
        doc.text(String(classes[c]), 45, nextY + 5);
        nextY += 7;
    }
    
    nextY += 5;
    
    // SECTION 3: IDENTITY / ADDRESS / AGE DOCUMENT
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    doc.text('3. IDENTITY / ADDRESS / AGE DOCUMENT', 15, nextY);
    
    nextY += 5;
    var rawAadhaar = sd.aadhaarNumber || 'N/A';
    var maskedAadhaar = rawAadhaar;
    if (rawAadhaar !== 'N/A' && rawAadhaar.length === 12) {
        maskedAadhaar = 'XXXX XXXX ' + rawAadhaar.substring(8);
    }
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text('Document Type: ', 17, nextY + 3);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(17, 17, 17);
    doc.text('Aadhaar', 50, nextY + 3);
    
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(80);
    doc.text('Document Number: ', 17, nextY + 9);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(17, 17, 17);
    doc.text(maskedAadhaar, 50, nextY + 9);
    
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(80);
    doc.text('Verification Status: ', 17, nextY + 15);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(20, 143, 96);
    doc.text('Submitted', 50, nextY + 15);
    
    nextY += 23;
    
    // SECTION 4: DOCUMENT CHECKLIST
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    doc.text('4. DOCUMENT CHECKLIST', 15, nextY);
    
    nextY += 5;
    doc.setFillColor(235, 240, 238);
    doc.rect(15, nextY, 180, 7, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(50);
    doc.text('Document Name', 18, nextY + 5);
    doc.text('Status', 120, nextY + 5);
    
    var uploadedDocsList = [];
    if (app.documents) {
        for (var dIndex = 0; dIndex < app.documents.length; dIndex++) {
            uploadedDocsList.push({ name: app.documents[dIndex].name, status: 'Submitted' });
        }
    }
    
    nextY += 7;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(17, 17, 17);
    for (var dIdx = 0; dIdx < uploadedDocsList.length; dIdx++) {
        if (dIdx % 2 === 1) {
            doc.setFillColor(248, 248, 248);
            doc.rect(15, nextY, 180, 7, 'F');
        }
        doc.text(uploadedDocsList[dIdx].name, 18, nextY + 5);
        doc.text(uploadedDocsList[dIdx].status, 120, nextY + 5);
        nextY += 7;
    }
    
    drawFooter(1, 2);
    
    // ==========================================
    // PAGE 2
    // ==========================================
    doc.addPage();
    
    // Simplified Header Page 2
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(17, 17, 17);
    doc.text('DriveSetu — Learner\'s Licence Application Summary', 15, 20);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Application ID: ' + app.id, 15, 24);
    
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(15, 27, 195, 27);
    
    // SECTION 5: LEARNER\'S LICENCE TEST APPOINTMENT
    var p2Y = 37;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    doc.text('5. LEARNER\'S LICENCE TEST APPOINTMENT', 15, p2Y);
    
    p2Y += 5;
    // Visually prominent appointment section box
    doc.setFillColor(240, 247, 255); // Soft blue background
    doc.setDrawColor(186, 218, 255);
    doc.rect(15, p2Y, 180, 38, 'FD');
    
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.setFont('Helvetica', 'normal');
    doc.text('RTO Code:', 18, p2Y + 6);
    doc.text('RTO / Test Centre:', 18, p2Y + 12);
    doc.text('RTO Address:', 18, p2Y + 18);
    doc.text('Test Date:', 18, p2Y + 24);
    doc.text('Test Appointment Time:', 18, p2Y + 30);
    doc.text('Appointment Status:', 18, p2Y + 35);
    
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(17, 17, 17);
    doc.text(sd.rtoCode || 'N/A', 60, p2Y + 6);
    doc.text(sd.rtoOfficeName || 'N/A', 60, p2Y + 12);
    
    // Wrap address text if too long
    var splitAddress = doc.splitTextToSize(sd.rtoAddress || 'N/A', 130);
    doc.text(splitAddress, 60, p2Y + 18);
    
    var addressLinesCount = splitAddress.length;
    var shiftY = (addressLinesCount - 1) * 4.5;
    
    doc.text(sd.allocatedTestDate || 'N/A', 60, p2Y + 24 + shiftY);
    doc.text(sd.allocatedTestStartTime || 'N/A', 60, p2Y + 30 + shiftY);
    doc.text('Test Slot Allocated', 60, p2Y + 35 + shiftY);
    
    p2Y += 44 + shiftY;
    
    // Notice Box (IMPORTANT)
    doc.setFillColor(255, 251, 230); // Soft orange box
    doc.setDrawColor(255, 229, 143);
    doc.rect(15, p2Y, 180, 18, 'FD');
    
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(212, 107, 8);
    doc.text('IMPORTANT NOTICE', 18, p2Y + 5);
    
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100);
    doc.setFontSize(8);
    var splitNotice = doc.splitTextToSize('This appointment information is generated by the DriveSetu prototype. Actual appointment availability and confirmation will be determined by the official RTO scheduling system.', 174);
    doc.text(splitNotice, 18, p2Y + 9);
    
    p2Y += 24;
    
    // SECTION 6: BEFORE YOU VISIT THE RTO
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    doc.text('6. BEFORE YOU VISIT THE RTO', 15, p2Y);
    
    p2Y += 5;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80);
    var visitTips = [
        '- Arrive before the scheduled appointment time.',
        '- Carry the original identity document used for the application.',
        '- Carry the application summary/appointment details.',
        '- Carry any other original documents applicable to your application.',
        '- Review traffic signs and basic road rules.',
        '- Read each test question carefully.',
        '- Follow the instructions provided at the test centre.',
        '- Do not use unofficial agents or intermediaries.'
    ];
    for (var tIdx = 0; tIdx < visitTips.length; tIdx++) {
        doc.text(visitTips[tIdx], 18, p2Y + (tIdx * 5));
    }
    
    p2Y += (visitTips.length * 5) + 3;
    
    // SECTION 7: DOCUMENTS TO CARRY
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    doc.text('7. DOCUMENTS TO CARRY', 15, p2Y);
    
    p2Y += 5;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(80);
    
    var carryList = [
        '[ ] Original Aadhaar / identity document',
        '[ ] DriveSetu Application Summary',
        '[ ] Appointment details'
    ];
    if (app.documents) {
        for (var dIdx2 = 0; dIdx2 < app.documents.length; dIdx2++) {
            var docObj = app.documents[dIdx2];
            if (docObj.id === 'form_1a') {
                carryList.push('[ ] Original Form 1A Medical Certificate');
            }
            if (docObj.id === 'parent_declaration') {
                carryList.push('[ ] Original Parent / Guardian Declaration');
            }
        }
    }
    
    for (var cl = 0; cl < carryList.length; cl++) {
        doc.text(carryList[cl], 18, p2Y + (cl * 5));
    }
    
    p2Y += (carryList.length * 5) + 3;
    
    // SECTION 8: TEST PREPARATION
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    doc.text('8. TEST PREPARATION', 15, p2Y);
    
    p2Y += 5;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(80);
    doc.text('Prepare for your test covering the following topics: Traffic Signs, Road Rules, Road Safety, Lane Discipline, Driver Responsibilities, Basic Traffic Regulations.', 18, p2Y, { maxWidth: 174 });
    doc.setFont('Helvetica', 'oblique');
    doc.text('Use this information as preparation guidance. Follow the instructions provided by the RTO test centre.', 18, p2Y + 8, { maxWidth: 174 });
    
    p2Y += 15;
    
    // SECTION 9: APPLICATION RECORD
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    doc.text('9. APPLICATION RECORD', 15, p2Y);
    
    p2Y += 5;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(80);
    
    var recs = [
        'Application ID: ' + app.id,
        'Service: Learner\'s Licence',
        'Vehicle Categories: ' + (sd.vehicleClasses ? sd.vehicleClasses.join(', ') : 'N/A'),
        'Submission Status: Submitted',
        'Test Appointment: Allocated',
        'Generated On: ' + new Date().toLocaleString()
    ];
    for (var rc = 0; rc < recs.length; rc++) {
        doc.text(recs[rc], 18, p2Y + (rc * 4.5));
    }
    
    p2Y += (recs.length * 4.5) + 3;
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('This document is a digital application summary generated by DriveSetu for prototype demonstration purposes.', 18, p2Y, { maxWidth: 174 });
    
    p2Y += 9;
    
    // FINAL MESSAGE
    doc.setFillColor(245, 247, 246);
    doc.rect(15, p2Y, 180, 24, 'F');
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(17, 17, 17);
    doc.text('You\'re all set.', 20, p2Y + 5);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Please arrive at the assigned RTO test centre on time and carry the required original documents.', 20, p2Y + 10);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(20, 143, 96);
    doc.text('All the best for your Learner\'s Licence test!', 20, p2Y + 15);
    doc.setTextColor(100);
    doc.setFont('Helvetica', 'normal');
    doc.text('Drive Safe. Drive Responsibly.', 20, p2Y + 20);
    
    drawFooter(2, 2);
    
    doc.save('DriveSetu_Learner_Licence_Application_' + app.id + '.pdf');
}

// ─── LLR PRACTICE QUIZ MODAL ───
function showPracticeQuizModal() {
    var questions = [
        {
            q: "What does a flashing red traffic light indicate?",
            opts: ["Stop completely and proceed when safe", "Slow down and proceed with caution", "Stop only if pedestrian crossing is active"],
            ans: 0
        },
        {
            q: "Overtaking another vehicle is strictly prohibited in which scenario?",
            opts: ["On wide, multi-lane highways", "When approaching a curve, crest, or narrow bridge", "At night on well-lit urban roads"],
            ans: 1
        },
        {
            q: "What is the standard minimum age required to apply for an LLMV (car) Learner's Licence in India?",
            opts: ["16 Years", "18 Years", "21 Years"],
            ans: 1
        }
    ];
    
    var quizHTML = '<div class="modal-backdrop" id="quizModalBackdrop" onclick="if(event.target===this) closePracticeQuizModal();">' +
        '<div class="modal-card animate-in" style="max-width:550px;">' +
            '<div class="modal-header">' +
                '<h3><i class="fa-solid fa-graduation-cap" style="color:var(--primary); margin-right:0.4rem;"></i> Practice LLR Questions</h3>' +
                '<button class="modal-close-btn" type="button" onclick="closePracticeQuizModal()"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<form id="practiceQuizForm" onsubmit="event.preventDefault(); submitQuiz();" style="max-height:400px; overflow-y:auto; padding:0.5rem 0.25rem;">';
            
    for (var i = 0; i < questions.length; i++) {
        quizHTML += '<div class="card" style="padding:1rem; margin-bottom:1.25rem; border:1px solid var(--border);">' +
            '<p style="font-weight:700; font-size:0.88rem; margin-bottom:0.75rem;">Q' + (i+1) + ': ' + questions[i].q + '</p>';
        for (var o = 0; o < questions[i].opts.length; o++) {
            quizHTML += '<label style="display:block; margin:0.4rem 0; font-size:0.82rem; cursor:pointer;">' +
                '<input type="radio" name="quiz_q' + i + '" value="' + o + '" required style="margin-right:0.4rem;"> ' + questions[i].opts[o] +
                '</label>';
        }
        quizHTML += '</div>';
    }
    
    quizHTML += '<div id="quizResultBox" style="display:none; margin-top:1rem; padding:1rem; border-radius:6px; text-align:center;"></div>' +
            '</form>' +
            '<div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:0.75rem; margin-top:0.5rem;">' +
                '<button class="btn btn-ghost" type="button" onclick="closePracticeQuizModal()">Close</button>' +
                '<button class="btn btn-primary" type="submit" form="practiceQuizForm" id="quizSubmitBtn"><i class="fa-solid fa-paper-plane"></i> Submit Answers</button>' +
            '</div>' +
        '</div>' +
    '</div>';
    
    var div = document.createElement('div');
    div.id = 'quizModalWrapper';
    div.innerHTML = quizHTML;
    document.body.appendChild(div);
}

function closePracticeQuizModal() {
    var wrapper = document.getElementById('quizModalWrapper');
    if (wrapper) {
        document.body.removeChild(wrapper);
    }
}

function submitQuiz() {
    var answers = [0, 1, 1]; // Correct indexes
    var score = 0;
    for (var i = 0; i < answers.length; i++) {
        var radios = document.getElementsByName('quiz_q' + i);
        var selected = -1;
        for (var r = 0; r < radios.length; r++) {
            if (radios[r].checked) {
                selected = parseInt(radios[r].value);
                break;
            }
        }
        if (selected === answers[i]) {
            score++;
        }
    }
    
    var resultBox = document.getElementById('quizResultBox');
    var submitBtn = document.getElementById('quizSubmitBtn');
    if (resultBox) {
        resultBox.style.display = 'block';
        if (score >= 2) {
            resultBox.style.background = '#e8f7f1';
            resultBox.style.border = '1px solid #c2ead8';
            resultBox.style.color = '#148f60';
            resultBox.innerHTML = '<strong style="font-size:1rem;"><i class="fa-solid fa-circle-check"></i> Practice Test Passed!</strong><br>' +
                'Score: <strong>' + score + ' / ' + answers.length + '</strong> correct answers.<br>' +
                '<small style="font-size:0.76rem; color:var(--text-muted);">Excellent work! You meet the LLR passing standard. Real test results will vary.</small>';
        } else {
            resultBox.style.background = '#fff0f0';
            resultBox.style.border = '1px solid #feb2b2';
            resultBox.style.color = '#c53030';
            resultBox.innerHTML = '<strong style="font-size:1rem;"><i class="fa-solid fa-circle-xmark"></i> Practice Test Failed</strong><br>' +
                'Score: <strong>' + score + ' / ' + answers.length + '</strong> correct answers (Need 2 correct to pass).<br>' +
                '<small style="font-size:0.76rem; color:var(--text-muted);">Review road rules and safety signs before taking the RTO LLR exam.</small>';
        }
    }
    if (submitBtn) {
        submitBtn.style.display = 'none';
    }
}

// ─── STATE ───
var currentCaptcha = '';
var otpSent = false;
var generatedOTP = '';

// ─── ROUTER ───
var appDiv = document.getElementById('app');

window.quickRtoLogin = function(email, pass) {
    var emailInput = document.getElementById('loginEmail');
    var passInput = document.getElementById('loginPassword');
    if (emailInput) emailInput.value = email;
    if (passInput) passInput.value = pass;
    var form = document.getElementById('loginForm');
    if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
};

function render() {
    var hash = window.location.hash || '#home';
    var isRTOAll = hash === '#rto' || hash === '#rto-all';
    var isRTOApproved = hash === '#rto-approved';
    var isRTOPending = hash === '#rto-pending';
    var isRTOReports = hash === '#rto-reports';
    var isRTODocReview = hash === '#rto-docreview';
    var isRTO = isRTOAll || isRTOApproved || isRTOPending || isRTOReports || isRTODocReview;

    var isApplyLearner = hash === '#apply-learner';
    var isApplyPermanent = hash === '#apply-permanent';
    var isApplyAddition = hash === '#apply-addition';
    var isApplyIdp = hash === '#apply-idp';
    var isApplyRenewal = hash === '#apply-renewal';
    var isApplyDuplicate = hash === '#apply-duplicate';
    var isApplyDlInfo = hash === '#apply-dl-info';
    var isApplyAny = isApplyLearner || isApplyPermanent || isApplyAddition || isApplyIdp || isApplyRenewal || isApplyDuplicate || isApplyDlInfo;

    var isCitizenSelect = hash === '#citizen';
    var isCitizenTrack = hash === '#citizen-track';
    var isPendingTasks = hash === '#pending-tasks';
    var isCitizenDrivingTest = hash === '#citizen-driving-test' || hash === '#upload-docs';
    var isTestCentre = hash === '#test-centre';
    var isVerifyEvidence = hash.indexOf('#verify-evidence') === 0;
    var isCitizenLogin = hash === '#citizen-login';
    var isCitizenRegister = hash === '#citizen-register' || hash === '#register';
    var isRTOLogin = hash === '#rto-login';
    var isHome = hash === '#home' || hash === '';

    var isCitizen = isCitizenSelect || isApplyAny;

    // Fetch fresh stored reviews & applications
    var pendingReviews = getStoredReviews();
    var storedApps = getStoredApplications();

    var _csRaw = sessionStorage.getItem('citizenSession');
    var _cs = safeParseJSON(_csRaw, null);

    var _rsRaw = sessionStorage.getItem('rtoSession');
    var _rs = null;
    if (_rsRaw) {
        try {
            _rs = typeof _rsRaw === 'string' && _rsRaw.indexOf('{') === 0 ? safeParseJSON(_rsRaw, null) : { role: 'ADMIN', rtoCode: 'ALL', name: 'RTO Authority', initials: 'ADM' };
        } catch(e) {
            _rs = { role: 'ADMIN', rtoCode: 'ALL', name: 'RTO Authority', initials: 'ADM' };
        }
    }

    // Sidebar nav items (Citizen - Only citizen actions, NO Test Centre Portal)
    // Compute dynamic pending task count from citizen applications
    var _ptSession = safeParseJSON(sessionStorage.getItem('citizenSession'), null);
    var _pendingTaskCount = 0;
    if (_ptSession) {
        var _ptApps = getStoredApplications();
        for (var _pti = 0; _pti < _ptApps.length; _pti++) {
            var _pta = _ptApps[_pti];
            if (_pta.citizenId === _ptSession.email || _pta.citizenId === _ptSession.appId || _pta.name === _ptSession.name) {
                if (_pta.status === 'Submitted' || _pta.status === 'Pending') {
                    _pendingTaskCount++;
                }
            }
        }
    }
    var citizenNavItems = [
        { icon: 'fa-solid fa-gauge', label: 'Dashboard', hash: '#home', active: isHome || isCitizenSelect },
        { icon: 'fa-solid fa-magnifying-glass', label: 'Track Status', hash: '#citizen-track', active: isCitizenTrack },
        { icon: 'fa-solid fa-list-check', label: 'Pending Tasks', hash: '#pending-tasks', active: isPendingTasks, badge: _pendingTaskCount || null }
    ];

    var rtoNavItems = [];
    if (_rs && _rs.role === 'ADMIN') {
        rtoNavItems = [
            { icon: 'fa-solid fa-gauge', label: 'System Monitoring', hash: '#home', active: isHome },
            { icon: 'fa-solid fa-chart-pie', label: 'Application Statistics', hash: '#rto-reports', active: isRTOReports },
            { icon: 'fa-solid fa-folder-arrow-up', label: 'Document Reviews', hash: '#rto-docreview', active: isRTODocReview, badge: pendingReviews.filter(function(r){ return r.status === 'Pending Review'; }).length || null }
        ];
    } else {
        var myPendingCount = storedApps.filter(function(a) {
            if (!_rs) return false;
            var isPending = a.status === 'Pending RTO Review' || a.status === 'SECOND INDEPENDENT REVIEW REQUIRED' || a.status === 'Adjudication Review';
            var isAssignedToMe = (a.evaluator1 && a.evaluator1.officerId === _rs.officerId && !a.evaluator1.decision) ||
                                 (a.evaluator2 && a.evaluator2.officerId === _rs.officerId && !a.evaluator2.decision) ||
                                 (a.adjudicator && a.adjudicator.officerId === _rs.officerId && !a.adjudicator.decision);
            return isPending && isAssignedToMe;
        }).length;

        rtoNavItems = [
            { icon: 'fa-solid fa-gauge', label: 'Dashboard', hash: '#home', active: isHome },
            { icon: 'fa-solid fa-clock', label: 'My Evaluations', hash: '#rto-pending', active: isRTOPending, badge: myPendingCount || null },
            { icon: 'fa-solid fa-circle-check', label: 'Completed Reviews', hash: '#rto-approved', active: isRTOApproved }
        ];
    }

    var homeNavItems = [
        { icon: 'fa-solid fa-house', label: 'Home', hash: '#home', active: isHome },
        { icon: 'fa-solid fa-user', label: 'Citizen Portal', hash: '#citizen-login' },
        { icon: 'fa-solid fa-user-shield', label: 'RTO Portal', hash: '#rto-login' }
    ];

    var isCitizenSessionActive = !!_cs;
    var isRtoSessionActive = !!_rs;

    var navItems = isRtoSessionActive
        ? rtoNavItems
        : isCitizenSessionActive
        ? citizenNavItems
        : isRTO
        ? rtoNavItems
        : isTestCentre
        ? [{ icon: 'fa-solid fa-house', label: 'Home', hash: '#home' }, { icon: 'fa-solid fa-video', label: 'Test Centre Portal', hash: '#test-centre', active: true }]
        : (isCitizen || isCitizenTrack || isPendingTasks || isCitizenDrivingTest)
        ? citizenNavItems
        : homeNavItems;
    
    // Strict role-based profile display: Null if unauthenticated
    var userInfo = null;
    if (_rs && (isRTO || isTestCentre || isHome)) {
        userInfo = {
            initials: _rs.initials || 'RO',
            name: _rs.name || 'RTO Officer',
            role: _rs.role === 'TEST_CENTRE_OPERATOR' ? ('Test Centre Operator (' + _rs.rtoCode + ')')
                : _rs.role === 'REVIEWING_OFFICER' ? ('RTO Reviewing Officer (' + _rs.rtoCode + ')')
                : 'System Administrative Authority'
        };
    } else if (_cs) {
        userInfo = {
            initials: _cs.initials || 'CS',
            name: _cs.name || 'Citizen Applicant',
            role: 'Citizen (' + (_cs.appId || 'APP-206500') + ')'
        };
    }

    var pageTitle = isRTODocReview ? 'Document Reviews' 
        : isRTOReports ? 'Reports & Analytics' 
        : isRTOApproved ? 'Approved Applications' 
        : isRTOPending ? 'Pending Review Queue' 
        : isRTO ? 'RTO Dashboard' 
        : isTestCentre ? 'Test Centre Operator Portal'
        : isVerifyEvidence ? 'Evidence Verification Portal'
        : isPendingTasks ? 'Pending Tasks'
        : isCitizenTrack ? 'Track Status' 
        : isApplyLearner ? 'Apply for Learner\'s Licence'
        : isApplyPermanent ? 'Apply for Permanent Licence'
        : isApplyAddition ? 'Apply for Addition of Class'
        : isApplyIdp ? 'Apply for International Driving Permit'
        : isApplyRenewal ? 'Apply for Licence Renewal'
        : isApplyDuplicate ? 'Apply for Duplicate Licence'
        : isApplyDlInfo ? 'Driving Licence Information'
        : (isCitizenSelect || (isHome && isCitizenSessionActive)) ? 'Dashboard' 
        : 'Home';

    var breadcrumb = isRTOReports
        ? 'Dashboard / RTO Portal / <span>Reports</span>'
        : isRTOApproved
        ? 'Dashboard / RTO Portal / <span>Approved</span>'
        : isRTOPending
        ? 'Dashboard / RTO Portal / <span>Pending Review</span>'
        : isRTO
        ? 'Dashboard / <span>RTO Portal</span>'
        : isTestCentre
        ? 'Dashboard / <span>Test Centre Operator</span>'
        : isVerifyEvidence
        ? 'Dashboard / <span>Evidence Verification</span>'
        : isPendingTasks
        ? 'Dashboard / Citizen Portal / <span>Pending Tasks</span>'
        : isCitizenTrack
        ? 'Dashboard / Citizen Portal / <span>Track Status</span>'
        : isApplyAny
        ? 'Dashboard / Citizen Portal / <span>' + pageTitle + '</span>'
        : (isCitizenSelect || (isHome && isCitizenSessionActive))
        ? 'Dashboard / Citizen Portal / <span>Dashboard</span>'
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

    // ── LOGIN & REGISTER PAGES (no sidebar layout) ──
    if (isCitizenLogin || isRTOLogin || isCitizenRegister) {
        if ((isCitizenLogin || isCitizenRegister) && _cs) {
            window.location.hash = 'citizen';
            render();
            return;
        }
        if (isRTOLogin && _rs) {
            window.location.hash = 'rto';
            render();
            return;
        }

        // ── CITIZEN REGISTRATION PAGE ──
        // ── REGISTRATION PAGE (CITIZEN & RTO OFFICER ONBOARDING) ──
        if (isCitizenRegister) {
            var regHTML = '';
            regHTML += '<div class="login-page">';
            regHTML += '<div class="login-container animate-in" style="max-width:580px;">';
            regHTML += '<div class="login-header">';
            regHTML += '<div class="login-brand" style="cursor:pointer;" id="registerBrandBtn">';
            regHTML += '<div class="brand-icon" style="width:40px;height:40px;font-size:1.3rem;"><i class="ph ph-steering-wheel"></i></div>';
            regHTML += '<span style="font-size:1.3rem;">DriveSetu</span>';
            regHTML += '</div></div>';
            regHTML += '<div class="login-card">';
            regHTML += '<h2 class="login-title" style="margin-bottom:0.25rem;"><i class="ph ph-user" style="color:var(--primary);"></i> Citizen Registration</h2>';
            regHTML += '<p class="login-subtitle" style="margin-bottom:1.25rem;">Create a new Citizen Account to apply for & track driving licences</p>';
            regHTML += '<div id="registerAlert" style="display:none; padding:0.75rem; border-radius:6px; font-size:0.85rem; margin-bottom:1rem; text-align:left;"></div>';

            // CITIZEN REGISTRATION FORM
            regHTML += '<form id="registerForm" style="display:block;">';
            regHTML += '<div class="form-group"><label>Full Name *</label><input type="text" id="registerFullName" placeholder="Enter your full name" required></div>';
            regHTML += '<div class="form-group"><label>Email Address *</label><input type="email" id="registerEmail" placeholder="Enter your email address" required></div>';
            regHTML += '<div class="form-group"><label>Password *</label><input type="password" id="registerPassword" placeholder="Create a password (min 6 characters)" required minlength="6"></div>';
            regHTML += '<div class="form-group"><label>Confirm Password *</label><input type="password" id="registerConfirmPassword" placeholder="Confirm your password" required minlength="6"></div>';
            regHTML += '<button type="submit" class="btn btn-primary" id="submitRegisterBtn" style="width:100%; justify-content:center; padding:0.75rem; font-size:0.95rem;"><i class="ph ph-user-plus"></i> Create Citizen Account</button>';
            regHTML += '</form>';

            regHTML += '<div class="login-footer"><p style="margin-top:1.25rem;">Already have an account? <a href="#citizen-login" id="toLoginBtn">Sign in here</a></p></div>';
            regHTML += '</div>';
            regHTML += '<button class="btn btn-back" style="margin-top:1.25rem;" id="backHomeBtnReg"><i class="ph ph-arrow-left"></i> Back to Home</button>';
            regHTML += '</div></div>';

            appDiv.innerHTML = regHTML;

            document.getElementById('registerBrandBtn').onclick = function() { window.location.hash = 'home'; };
            document.getElementById('backHomeBtnReg').onclick = function() { window.location.hash = 'home'; };
            document.getElementById('toLoginBtn').onclick = function() { window.location.hash = 'citizen-login'; };

            // CITIZEN FORM SUBMIT
            document.getElementById('registerForm').onsubmit = async function(e) {
                e.preventDefault();
                var fullName = document.getElementById('registerFullName').value.trim();
                var email = document.getElementById('registerEmail').value.trim();
                var password = document.getElementById('registerPassword').value.trim();
                var confirmPassword = document.getElementById('registerConfirmPassword').value.trim();
                var alertBox = document.getElementById('registerAlert');

                function showError(msg) {
                    alertBox.style.display = 'block';
                    alertBox.style.background = '#fff5f5';
                    alertBox.style.color = '#c53030';
                    alertBox.style.border = '1px solid #feb2b2';
                    alertBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ' + msg;
                }

                function showSuccess(msg) {
                    alertBox.style.display = 'block';
                    alertBox.style.background = '#f0fff4';
                    alertBox.style.color = '#276749';
                    alertBox.style.border = '1px solid #9ae6b4';
                    alertBox.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + msg;
                }

                if (!fullName || !email || !password || !confirmPassword) {
                    showError('Please fill in all required fields.');
                    return;
                }

                if (password.length < 6) {
                    showError('Password must be at least 6 characters long.');
                    return;
                }

                if (password !== confirmPassword) {
                    showError('Passwords do not match. Please re-enter your password.');
                    return;
                }

                var cleanCheck = email.toLowerCase();
                var isRtoEmail = cleanCheck.endsWith('@drivesetu.com') || rtoAccounts.some(function(acc) { return acc.email.toLowerCase() === cleanCheck; });
                if (isRtoEmail) {
                    showError('Official RTO accounts cannot be registered as citizen accounts. Switch to the RTO Officer tab above.');
                    return;
                }

                var submitBtn = document.getElementById('submitRegisterBtn');
                if (submitBtn && submitBtn.disabled) return;
                
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';

                try {
                    var regResult = await DriveSetuSupabase.registerUser(email, password, fullName);
                    
                    if (regResult && regResult.session) {
                        showSuccess('Account registered successfully! Redirecting to Citizen Portal...');
                        var citizenData = {
                            email: email,
                            name: fullName || email.split('@')[0],
                            appId: 'APP-' + Date.now().toString().slice(-6),
                            licenceType: 'Permanent Licence',
                            testDate: new Date().toLocaleDateString('en-IN'),
                            initials: (fullName || email).slice(0, 2).toUpperCase()
                        };
                        sessionStorage.setItem('citizenSession', JSON.stringify(citizenData));
                        setTimeout(function() {
                            window.location.hash = 'citizen';
                        }, 800);
                    } else {
                        try {
                            var authResult = await DriveSetuSupabase.authenticateCitizen(email, password);
                            showSuccess('Account registered successfully! Redirecting to Citizen Portal...');
                            var citizenData = {
                                email: authResult.email,
                                name: authResult.name || fullName || email.split('@')[0],
                                appId: 'APP-' + Date.now().toString().slice(-6),
                                licenceType: 'Permanent Licence',
                                testDate: new Date().toLocaleDateString('en-IN'),
                                initials: (authResult.name || fullName || email).slice(0, 2).toUpperCase()
                            };

                            sessionStorage.setItem('citizenSession', JSON.stringify(citizenData));

                            setTimeout(function() {
                                window.location.hash = 'citizen';
                            }, 800);
                        } catch (authErr) {
                            showSuccess('Account registered successfully! Proceeding to Citizen Login...');
                            setTimeout(function() {
                                window.location.hash = 'citizen-login';
                            }, 2000);
                        }
                    }

                } catch (err) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="ph ph-user-plus"></i> Create Account';
                    var errMsg = err.message || '';
                    if (errMsg.toLowerCase().includes('rate limit') || errMsg.toLowerCase().includes('over_email_send_rate_limit')) {
                        showError('Registration emails are temporarily unavailable. Please try again later.');
                    } else {
                        showError(errMsg || 'Registration failed. Please try again.');
                    }
                }
            };

            // RTO OFFICER FORM SUBMIT
            document.getElementById('registerOfficerForm').onsubmit = async function(e) {
                e.preventDefault();
                var alertBox = document.getElementById('registerAlert');

                function showError(msg) {
                    alertBox.style.display = 'block';
                    alertBox.style.background = '#fff5f5';
                    alertBox.style.color = '#c53030';
                    alertBox.style.border = '1px solid #feb2b2';
                    alertBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ' + msg;
                }

                function showSuccess(msg) {
                    alertBox.style.display = 'block';
                    alertBox.style.background = '#f0fff4';
                    alertBox.style.color = '#276749';
                    alertBox.style.border = '1px solid #9ae6b4';
                    alertBox.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + msg;
                }

                var name = document.getElementById('offName').value.trim();
                var role = document.getElementById('offRole') ? document.getElementById('offRole').value : 'REVIEWING_OFFICER';
                var rtoCode = document.getElementById('offRtoCode').value;
                var officerId = document.getElementById('offIdNo').value.trim();
                var officeName = document.getElementById('offOfficeName').value.trim() || ('RTA Office ' + rtoCode);
                var email = document.getElementById('offEmail').value.trim();
                var password = document.getElementById('offPass').value;
                var confirmPassword = document.getElementById('offConfirmPass').value;

                if (password !== confirmPassword) {
                    showError('Passwords do not match. Please re-enter.');
                    return;
                }

                var btn = document.getElementById('submitOfficerRegisterBtn');
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting Request...';

                try {
                    var reqRes = await DriveSetuSupabase.submitRTORegistrationRequest({
                        fullName: name,
                        officialEmail: email,
                        password: password,
                        role: role,
                        rtoCode: rtoCode,
                        officeName: officeName,
                        officerId: officerId
                    });

                    showSuccess('✓ Registration Request Submitted! Your account request for role [' + role + '] at RTO ' + rtoCode + ' is pending approval by the Portal Owner / System Admin. You will be able to sign in once approved.');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Request Submitted (Pending Approval)';
                } catch(err) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit RTO Registration Request';
                    showError(err.message || 'RTO registration request submission failed.');
                }
            };

            return;
        }

        var loginType = isCitizenLogin ? 'Citizen' : 'RTO Portal';
        var loginIcon = isCitizenLogin ? 'ph-user' : 'ph-shield-check';
        var loginTarget = isCitizenLogin ? 'citizen' : 'rto';
        var loginColor = isCitizenLogin ? 'var(--primary)' : 'var(--primary-dark)';
        var defaultEmail = isCitizenLogin ? '' : 'admin@drivesetu.com';
        var defaultPass = isCitizenLogin ? '' : 'admin123';

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
        loginHTML += '<div class="form-group"><label>Email Address</label><input type="email" id="loginEmail" value="' + defaultEmail + '" placeholder="Enter your email" required></div>';
        loginHTML += '<div class="form-group"><label>Password</label><input type="password" id="loginPassword" value="' + defaultPass + '" placeholder="Enter your password" required></div>';
        loginHTML += '<div class="login-options">';
        loginHTML += '<label class="remember-me"><input type="checkbox" checked> Remember me</label>';
        loginHTML += '<a href="javascript:void(0)" class="forgot-link" id="forgotBtn">Forgot password?</a>';
        loginHTML += '</div>';
        loginHTML += '<button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding:0.75rem; font-size:0.95rem;"><i class="ph ' + loginIcon + '"></i> Sign In</button>';
        loginHTML += '</form>';
        
        if (isCitizenLogin) {
            loginHTML += '<div class="login-footer"><p style="margin-top:1.25rem;">Don\'t have a citizen account? <a href="#citizen-register" id="registerBtn">Register as Citizen</a></p></div>';
        } else {
            loginHTML += '<div class="login-footer" style="margin-top:1.25rem; text-align:center;">' +
                '<p style="margin-bottom:0.5rem; font-size:0.85rem; color:var(--text-muted);">Unregistered RTO Officer or Office?</p>' +
                '<button type="button" class="btn btn-ghost" style="color:var(--primary); font-size:0.85rem; font-weight:600;" onclick="openRtoOfficeRegistrationModal()">' +
                    '<i class="fa-solid fa-building-flag" style="margin-right:0.3rem;"></i> Register RTO Office & RTO Officer' +
                '</button>' +
            '</div>';
        }
        
        loginHTML += '</div>';
        loginHTML += '<button class="btn btn-back" style="margin-top:1.25rem;" id="backHomeBtn"><i class="ph ph-arrow-left"></i> Back to Home</button>';
        loginHTML += '</div></div>';

        appDiv.innerHTML = loginHTML;

        document.getElementById('loginBrandBtn').onclick = function() { window.location.hash = 'home'; };
        document.getElementById('backHomeBtn').onclick = function() { window.location.hash = 'home'; };
        var regBtn = document.getElementById('registerBtn');
        if (regBtn) regBtn.onclick = function() { window.location.hash = 'citizen-register'; };
        document.getElementById('forgotBtn').onclick = function() { alert('A password reset link has been sent to your registered email address.'); };

        document.getElementById('loginForm').onsubmit = async function(e) {
            e.preventDefault();
            var email = document.getElementById('loginEmail').value.trim();
            var password = document.getElementById('loginPassword').value.trim();

            if (!email || !password) {
                alert('Please enter both email address and password.');
                return;
            }

            if (loginTarget === 'citizen') {
                var cleanCheck = email.toLowerCase();
                var isRtoEmail = cleanCheck.endsWith('@drivesetu.com') || rtoAccounts.some(function(acc) { return acc.email.toLowerCase() === cleanCheck; });
                
                if (isRtoEmail) {
                    alert('Incorrect details. Please check your credentials and try again.');
                    return;
                }

                var submitBtn = document.getElementById('loginForm').querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
                }

                try {
                    var authResult = await DriveSetuSupabase.authenticateCitizen(email, password);
                    
                    var citizenData = {
                        email: authResult.email,
                        name: authResult.name || email.split('@')[0],
                        appId: 'APP-' + Date.now().toString().slice(-6),
                        licenceType: 'Permanent Licence',
                        testDate: new Date().toLocaleDateString('en-IN'),
                        initials: (authResult.name || email).slice(0, 2).toUpperCase()
                    };

                    sessionStorage.setItem('citizenSession', JSON.stringify(citizenData));
                    window.location.hash = 'citizen';
                } catch (err) {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="ph ' + loginIcon + '"></i> Sign In';
                    }
                    alert('Incorrect details. Please check your credentials and try again.');
                }
            } else {
                // Authenticate RTO Officer / Operator via Supabase Auth
                var submitBtn = document.getElementById('loginForm').querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
                }

                try {
                    var officerResult = await DriveSetuSupabase.authenticateOfficer(email, password);
                    var officerSession = {
                        email: officerResult.email,
                        name: officerResult.name,
                        role: officerResult.role,
                        rtoCode: officerResult.rtoCode,
                        rtoName: officerResult.rtoName,
                        officerId: officerResult.officerId,
                        initials: (officerResult.name || 'OFF').slice(0, 3).toUpperCase()
                    };
                    sessionStorage.setItem('rtoSession', JSON.stringify(officerSession));
                    if (officerResult.role === 'TEST_CENTRE_OPERATOR') {
                        window.location.hash = 'test-centre';
                    } else {
                        window.location.hash = 'rto';
                    }
                } catch(err) {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="ph ' + loginIcon + '"></i> Sign In';
                    }
                    if (confirm('Account not found in Supabase Auth.\n\nWould you like to register a new RTO Office & Officer account now?')) {
                        openRtoOfficeRegistrationModal();
                    }
                }
            }
        };
        return;
    }

    // Page content
    var pageContent = '';

    if (isHome) {
        if (_cs) {
            pageContent = renderServiceSelectionPage(_cs);
        } else if (_rs) {
            if (_rs.role === 'TEST_CENTRE_OPERATOR') {
                pageContent = renderTestCentrePage();
            } else {
                pageContent = renderAdminDashboard();
            }
        } else {
            pageContent = '' +
                '<div class="home-hero animate-in" style="padding: 2.75rem 2rem; margin-bottom: 2rem;">' +
                    '<h1>Transparent RTO Portal</h1>' +
                    '<p style="margin-bottom:0;">DriveSetu separates physical test conducting from independent evaluation. Complete integrity at every step.</p>' +
                '</div>' +
                '<div class="stats-row animate-in" style="animation-delay:0.05s">' +
                    '<div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-building-flag"></i></div><div><div class="stat-value" style="font-size:1.1rem;">4 RTOs</div><div class="stat-label">TG-03, TG-05, TG-08, TG-12</div></div></div>' +
                    '<div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-shuffle"></i></div><div><div class="stat-value" style="font-size:1.1rem;">Automated</div><div class="stat-label">Cross-RTO Allocation</div></div></div>' +
                    '<div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-lock"></i></div><div><div class="stat-value" style="font-size:1.1rem;">SHA-256</div><div class="stat-label">Evidence Hash Protection</div></div></div>' +
                    '<div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-user-check"></i></div><div><div class="stat-value" style="font-size:1.1rem;">Independent</div><div class="stat-label">Dual Review Consensus</div></div></div>' +
                '</div>' +
                '<div style="margin-bottom:0.75rem; font-size:0.85rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em;">Quick Access</div>' +
                '<div class="grid-2 animate-in" style="animation-delay:0.1s; grid-template-columns:repeat(auto-fit,minmax(200px,1fr));">' +
                    '<div class="feature-card" onclick="window.location.hash=\'citizen-login\'"><div class="feature-icon"><i class="ph ph-graduation-cap"></i></div><h3>Learner\'s Licence</h3><p>Apply for a learner\'s licence to start your driving journey.</p></div>' +
                    '<div class="feature-card" onclick="window.location.hash=\'citizen-login\'"><div class="feature-icon"><i class="ph ph-car"></i></div><h3>Driving Licence</h3><p>Apply for a full permanent driving licence.</p></div>' +
                    '<div class="feature-card" onclick="window.location.hash=\'citizen-login\'"><div class="feature-icon"><i class="ph ph-arrows-clockwise"></i></div><h3>Renewal</h3><p>Renew your expired or expiring driving licence.</p></div>' +
                    '<div class="feature-card" onclick="window.location.hash=\'citizen-login\'"><div class="feature-icon"><i class="ph ph-globe"></i></div><h3>International Permit</h3><p>Get an International Driving Permit to drive abroad.</p></div>' +
                '</div>';
        }
    }

    else if (isCitizen) {
        var session = safeParseJSON(sessionStorage.getItem('citizenSession'), null);
        if (!session) {
            pageContent =
                '<div class="animate-in" style="max-width:480px; margin:3rem auto; text-align:center;">' +
                    '<div style="width:70px;height:70px;border-radius:50%;background:#e8f7f1;color:#1aab74;font-size:2rem;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem auto;"><i class="fa-solid fa-lock"></i></div>' +
                    '<h3 style="margin-bottom:0.5rem;">Login Required</h3>' +
                    '<p style="color:var(--text-muted);margin-bottom:1.25rem;">Please log in as a Citizen to access the Citizen Portal services.</p>' +
                    '<button class="btn btn-primary" onclick="window.location.hash=\'citizen-login\'"><i class="fa-solid fa-right-to-bracket"></i> Go to Citizen Login</button>' +
                '</div>';
        } else {
            if (isCitizenSelect) {
                pageContent = renderServiceSelectionPage(session);
            } else if (isApplyLearner) {
                pageContent = renderLearnerPage(session);
            } else if (isApplyPermanent) {
                pageContent = renderPermanentPage(session);
            } else if (isApplyAddition) {
                pageContent = renderAdditionPage(session);
            } else if (isApplyIdp) {
                pageContent = renderIdpPage(session);
            } else if (isApplyRenewal) {
                pageContent = renderRenewalPage(session);
            } else if (isApplyDuplicate) {
                pageContent = renderDuplicatePage(session);
            } else if (isApplyDlInfo) {
                pageContent = renderPermanentPage(session);
            }
        }
    }

    else if (isCitizenTrack) {
        var _citizenSession = safeParseJSON(sessionStorage.getItem('citizenSession'), null);

        if (!_citizenSession) {
            pageContent = '<div class="animate-in" style="max-width:480px; margin:3rem auto; text-align:center;">' +
                '<div class="card" style="padding:2.5rem 2rem;">' +
                    '<div style="width:70px;height:70px;border-radius:50%;background:#e8f7f1;color:#1aab74;font-size:2rem;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem auto;"><i class="fa-solid fa-lock"></i></div>' +
                    '<h3 style="margin-bottom:0.5rem;">Citizen Login Required</h3>' +
                    '<p style="color:var(--text-muted);margin-bottom:1.25rem;">Please log in as a Citizen to track your applications and view live status details.</p>' +
                    '<button class="btn btn-primary" onclick="window.location.hash=\'citizen-login\'"><i class="fa-solid fa-right-to-bracket"></i> Go to Citizen Login</button>' +
                '</div>' +
            '</div>';
        } else {
            var currentApps = getStoredApplications();
            
            // Filter authenticated citizen's applications
            var citizenApps = currentApps.filter(function(app) {
                return app.citizenId === _citizenSession.email || app.citizenId === _citizenSession.appId || app.name === _citizenSession.name;
            });
                
            var pendingApps = citizenApps.filter(function(app) {
                return app.status === 'Pending' || app.status === 'Submitted';
            });
                
            var completedApps = citizenApps.filter(function(app) {
                return app.status === 'Approved' || app.status === 'Rejected';
            });

            var defaultSearchId = '';
            if (citizenApps.length > 0) {
                defaultSearchId = citizenApps[0].id;
            }

            var mainContentHTML = '';
            
            if (citizenApps.length > 0) {
                var rows = citizenApps.map(function(app) {
                    var stBadge = app.status === 'Approved'
                        ? '<span class="badge badge-approved">✓ Approved</span>'
                        : app.status === 'Rejected'
                        ? '<span class="badge badge-rejected" style="background:#fff0f0;color:#c53030;border:1px solid #feb2b2;">✗ Declined</span>'
                        : app.status === 'Submitted'
                        ? '<span class="badge badge-pending">Submitted</span>'
                        : '<span class="badge badge-pending">● Pending</span>';
                        
                    var stageText = app.reviewStage || 'Document Verification';
                    
                    return '<tr style="cursor:pointer;" onclick="quickTrack(\'' + app.id + '\')">' +
                        '<td><strong>' + app.id + '</strong></td>' +
                        '<td>' + app.type + '</td>' +
                        '<td>' + app.date + '</td>' +
                        '<td>' + stBadge + '</td>' +
                        '<td>' + stageText + '</td>' +
                        '<td>' +
                            '<button class="btn btn-ghost" style="padding:0.25rem 0.6rem; font-size:0.75rem; margin-right:0.3rem;" onclick="event.stopPropagation(); quickTrack(\'' + app.id + '\')"><i class="fa-solid fa-magnifying-glass"></i> View Details</button>' +
                            '<button class="btn btn-ghost" style="padding:0.25rem 0.6rem; font-size:0.75rem; color:#dc2626; border:1px solid #fca5a5;" onclick="event.stopPropagation(); deleteCitizenApplication(\'' + app.id + '\')"><i class="fa-solid fa-trash"></i> Delete</button>' +
                        '</td>' +
                        '</tr>';
                }).join('');

                mainContentHTML += '<div class="card" style="margin-bottom:1.5rem;">' +
                    '<div class="card-title">My Applications</div>' +
                    '<div style="overflow-x:auto;">' +
                        '<table class="data-table">' +
                            '<thead><tr><th>App ID</th><th>Service</th><th>Submitted Date</th><th>Current Status</th><th>Current Stage</th><th>Action</th></tr></thead>' +
                            '<tbody>' + rows + '</tbody>' +
                        '</table>' +
                    '</div>' +
                '</div>';
            } else {
                mainContentHTML += '<div class="card" style="text-align:center; padding:2.5rem 2rem;">' +
                    '<div style="width:60px; height:60px; border-radius:50%; background:#e8f7f1; color:var(--primary); font-size:1.8rem; display:flex; align-items:center; justify-content:center; margin:0 auto 1rem auto;">' +
                        '<i class="fa-solid fa-folder-open"></i>' +
                    '</div>' +
                    '<h3 style="font-size:1.1rem; font-weight:700; color:var(--text-main); margin-bottom:0.4rem;">No applications are currently pending.</h3>' +
                    '<p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:1.5rem;">You do not have any active licence applications in progress.</p>' +
                    '<button class="btn btn-primary" style="margin:0 auto;" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-id-card"></i> Apply for a Service</button>' +
                '</div>';
            }

            // If there are completed applications but NO pending applications, we also show "Your Recent Application" box
            if (pendingApps.length === 0 && completedApps.length > 0) {
                var latestComp = completedApps[0];
                var compBadge = latestComp.status === 'Approved'
                    ? '<span class="badge badge-approved">✓ Completed</span>'
                    : '<span class="badge badge-rejected" style="background:#fff0f0;color:#c53030;border:1px solid #feb2b2;">✗ Declined</span>';
                
                mainContentHTML += '<div class="card" style="margin-top:1.5rem; padding:1.25rem; background:#f8faf9; border:1px solid var(--border); max-width:550px;">' +
                    '<h4 style="font-size:0.9rem; font-weight:700; color:var(--text-main); margin-bottom:0.5rem;">Your Recent Application</h4>' +
                    '<div class="flex-between" style="padding:0.5rem 0; border-bottom:1px solid var(--border); font-size:0.88rem;">' +
                        '<span style="color:var(--text-muted);">' + latestComp.type + '</span>' +
                        '<strong>' + latestComp.id + '</strong>' +
                    '</div>' +
                    '<div class="flex-between" style="padding:0.5rem 0; font-size:0.88rem;">' +
                        '<span style="color:var(--text-muted);">Status:</span>' +
                        '<strong>' + compBadge + '</strong>' +
                    '</div>' +
                    '<div style="margin-top:1rem; text-align:right;">' +
                        '<button class="btn btn-ghost" style="font-size:0.8rem; padding:0.35rem 0.85rem;" onclick="quickTrack(\'' + latestComp.id + '\')"><i class="fa-solid fa-magnifying-glass"></i> View History</button>' +
                    '</div>' +
                '</div>';
            }

            window.deleteCitizenApplication = async function(appId) {
                if (!confirm('Are you sure you want to delete application ' + appId + '?')) return;

                var allApps = getStoredApplications();
                var filtered = allApps.filter(function(a) { return a.id !== appId; });
                saveStoredApplications(filtered);

                var allReviews = getStoredReviews();
                var filteredReviews = allReviews.filter(function(r) { return r.appId !== appId; });
                saveStoredReviews(filteredReviews);

                if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                    try {
                        await supabaseClient.from('citizen_documents').delete().eq('application_id', appId);
                    } catch(e) {}
                }

                alert('Application ' + appId + ' has been deleted.');
                renderApp();
            };

            pageContent = '' +
                '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-arrow-left"></i> Back to Citizen Portal</button></div>' +
                '<div class="grid-2 animate-in" style="grid-template-columns: 1fr 1fr; gap:1.5rem;">' +
                    '<!-- Track Input Card -->' +
                    '<div class="card" style="align-self: flex-start;">' +
                        '<div class="card-title">Track Application Status <span class="badge badge-active"><i class="fa-solid fa-circle" style="font-size:0.5rem"></i> Real-time</span></div>' +
                        '<div class="form-group"><label>Application Number</label><input type="text" id="trackInput" value="' + defaultSearchId + '" placeholder="e.g. APP-101"></div>' +
                        '<button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="trackStatus()"><i class="fa-solid fa-magnifying-glass"></i> Check Status</button>' +
                        '<div id="trackResult" style="margin-top:1.25rem; display:none;">' +
                            '<div style="background:var(--bg); border-radius:var(--radius-md); padding:1.25rem; border:1px solid var(--border);">' +
                                '<div class="flex-between" style="margin-bottom:1rem;">' +
                                    '<div><p style="font-weight:700; font-size:1rem;" id="trackName">-</p><p style="font-size:0.8rem; color:var(--text-muted);" id="trackType">-</p></div>' +
                                    '<span class="badge badge-pending" id="trackBadge">Pending</span>' +
                                '</div>' +
                                '<div class="status-timeline" id="trackTimeline"></div>' +
                                '<div id="approvalCertificateBox" style="display:none; margin-top:1.25rem; padding:1rem; background:#e8f7f1; border:1px solid #c2ead8; border-radius:var(--radius-md); text-align:center;">' +
                                    '<div style="color:#148f60; font-weight:700; font-size:0.95rem; margin-bottom:0.4rem;" id="approvalCertTitle"><i class="fa-solid fa-circle-check"></i> Congratulations! Your Driving Licence is Approved</div>' +
                                    '<p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.75rem;" id="approvalCertDesc">Your official licence document has been generated and approved by RTO Authority.</p>' +
                                    '<button class="btn btn-primary" style="font-size:0.8rem; padding:0.45rem 1rem;" id="approvalCertBtn" onclick="viewPdfDocument(\'' + defaultSearchId + '\')"><i class="fa-solid fa-download"></i> Download / Print Driving Licence</button>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +

                    '<!-- Recent Applications List -->' +
                    '<div style="display: flex; flex-direction: column; gap: 1.5rem;">' +
                        mainContentHTML +
                    '</div>' +
                '</div>';
        }
    }

    else if (isPendingTasks) {
        var _ptSess = safeParseJSON(sessionStorage.getItem('citizenSession'), null);
        if (!_ptSess) {
            pageContent = '<div class="animate-in" style="max-width:480px; margin:3rem auto; text-align:center;">' +
                '<div class="card" style="padding:2.5rem 2rem;">' +
                    '<div style="width:70px;height:70px;border-radius:50%;background:#e8f7f1;color:#1aab74;font-size:2rem;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem auto;"><i class="fa-solid fa-lock"></i></div>' +
                    '<h3 style="margin-bottom:0.5rem;">Citizen Login Required</h3>' +
                    '<p style="color:var(--text-muted);margin-bottom:1.25rem;">Please log in as a Citizen to view your pending tasks.</p>' +
                    '<button class="btn btn-primary" onclick="window.location.hash=\'citizen-login\'"><i class="fa-solid fa-right-to-bracket"></i> Go to Citizen Login</button>' +
                '</div>' +
            '</div>';
        } else {
            var _ptAllApps = getStoredApplications();
            var _ptCitizenApps = _ptAllApps.filter(function(app) {
                return app.citizenId === _ptSess.email || app.citizenId === _ptSess.appId || app.name === _ptSess.name;
            });

            // Derive pending tasks from application state
            var _pendingTaskCards = '';
            var _taskCount = 0;

            for (var _ti = 0; _ti < _ptCitizenApps.length; _ti++) {
                var _tApp = _ptCitizenApps[_ti];

                // Determine what action is pending based on application state
                var taskTitle = '';
                var taskDesc = '';
                var taskAction = '';
                var taskActionLabel = '';
                var taskBadgeClass = 'badge-pending';
                var taskBadgeText = 'Action Required';

                if (_tApp.type === 'Permanent Licence' && (_tApp.status === 'Submitted' || _tApp.status === 'Pending')) {
                    // Check if test appointment is scheduled
                    if (_tApp.serviceDetails && _tApp.serviceDetails.appointmentStatus === 'Scheduled') {
                        taskTitle = 'Permanent Licence — Attend Driving Test';
                        taskDesc = 'Your driving test has been scheduled. Please physically attend the designated RTO test centre on <strong>' +
                            (_tApp.serviceDetails.allocatedTestDate || 'your scheduled date') + '</strong> at <strong>' +
                            (_tApp.serviceDetails.allocatedTestStartTime || 'your scheduled time') + '</strong>. ' +
                            'Bring your original Learner\'s Licence, Aadhaar card, and any required documents. ' +
                            'The test centre will capture video evidence and vehicle telemetry during your test automatically.';
                        taskAction = '#citizen-track';
                        taskActionLabel = 'View Test Details';
                        taskBadgeText = 'Scheduled';
                        taskBadgeClass = 'badge-active';
                    } else {
                        taskTitle = 'Permanent Licence — Application Under Review';
                        taskDesc = 'Your permanent licence application has been submitted and is under review by the RTO authority. ' +
                            'You will be notified once your driving test appointment is scheduled.';
                        taskAction = '#citizen-track';
                        taskActionLabel = 'Track Application';
                        taskBadgeText = 'Under Review';
                        taskBadgeClass = 'badge-pending';
                    }
                    _taskCount++;
                } else if (_tApp.type === "Learner's Licence" && (_tApp.status === 'Submitted' || _tApp.status === 'Pending')) {
                    var _llSd = _tApp.serviceDetails || {};
                    var _llTestDate = _llSd.allocatedTestDate || _llSd.slotDate || 'your scheduled date';
                    var _llTestTime = _llSd.allocatedTestStartTime || _llSd.slotTime || 'your scheduled time';
                    taskTitle = 'LL Computer Test — Attend Scheduled Knowledge Test';
                    taskDesc = 'Your Learner\'s Licence computerized knowledge test is scheduled. ' +
                        'Please attend the designated RTO office on <strong>' + _llTestDate + '</strong> at <strong>' + _llTestTime + '</strong>. ' +
                        'The test covers traffic signs, road rules, and driver responsibilities. ' +
                        'Bring your original Aadhaar card and application acknowledgement.';
                    taskAction = '#citizen-track';
                    taskActionLabel = 'View Test Details';
                    taskBadgeText = 'Test Scheduled';
                    taskBadgeClass = 'badge-active';
                    _taskCount++;
                } else if ((_tApp.type === 'Renewal' || _tApp.type === 'Duplicate' || _tApp.type === 'Addition of Class' || _tApp.type === 'International Driving Permit') && (_tApp.status === 'Submitted' || _tApp.status === 'Pending')) {
                    taskTitle = _tApp.type + ' — Pending Approval';
                    taskDesc = 'Your ' + _tApp.type + ' application is currently being processed. No action is required from you at this time.';
                    taskAction = '#citizen-track';
                    taskActionLabel = 'Track Application';
                    taskBadgeText = 'Under Review';
                    taskBadgeClass = 'badge-pending';
                    _taskCount++;
                }

                if (taskTitle) {
                    _pendingTaskCards += '<div class="card animate-in" style="padding:1.5rem; margin-bottom:1rem; animation-delay:' + (_ti * 0.05) + 's;">' +
                        '<div class="flex-between" style="margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">' +
                            '<div style="display:flex; align-items:center; gap:0.5rem;">' +
                                '<div style="width:36px;height:36px;border-radius:50%;background:#fff3e0;color:#e65100;font-size:1rem;display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-exclamation"></i></div>' +
                                '<span style="font-size:0.7rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em;">Pending Action</span>' +
                            '</div>' +
                            '<span class="badge ' + taskBadgeClass + '">' + taskBadgeText + '</span>' +
                        '</div>' +
                        '<h3 style="font-size:1rem; font-weight:700; margin-bottom:0.5rem; color:var(--text-primary);">' + taskTitle + '</h3>' +
                        '<div style="display:flex; gap:1rem; margin-bottom:0.75rem; font-size:0.82rem; color:var(--text-muted); flex-wrap:wrap;">' +
                            '<span><i class="fa-solid fa-hashtag" style="margin-right:0.25rem;"></i> ' + _tApp.id + '</span>' +
                            '<span><i class="fa-solid fa-calendar" style="margin-right:0.25rem;"></i> Submitted: ' + _tApp.date + '</span>' +
                            '<span><i class="fa-solid fa-file" style="margin-right:0.25rem;"></i> ' + _tApp.type + '</span>' +
                        '</div>' +
                        '<p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6; margin-bottom:1rem;">' + taskDesc + '</p>' +
                        '<div style="text-align:right;">' +
                            '<button class="btn btn-primary" style="font-size:0.82rem; padding:0.45rem 1rem;" onclick="window.location.hash=\'' + taskAction.replace('#','') + '\'">' +
                                '<i class="fa-solid fa-arrow-right"></i> ' + taskActionLabel +
                            '</button>' +
                        '</div>' +
                    '</div>';
                }
            }

            // If no pending tasks, show professional empty state
            if (_taskCount === 0) {
                _pendingTaskCards = '<div class="card animate-in" style="padding:3rem 2rem; text-align:center;">' +
                    '<div style="width:80px;height:80px;border-radius:50%;background:#e8f7f1;color:#1aab74;font-size:2.2rem;display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem auto;"><i class="fa-solid fa-circle-check"></i></div>' +
                    '<h3 style="font-size:1.1rem; font-weight:700; margin-bottom:0.5rem; color:var(--text-primary);">No Pending Tasks</h3>' +
                    '<p style="color:var(--text-muted); font-size:0.9rem; max-width:400px; margin:0 auto 1.5rem auto; line-height:1.6;">You\'re all caught up. There are no actions required from you at this time.</p>' +
                    '<button class="btn btn-ghost" onclick="window.location.hash=\'citizen-track\'"><i class="fa-solid fa-magnifying-glass"></i> Track Your Applications</button>' +
                '</div>';
            }

            pageContent = '<div class="animate-in">' +
                '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-arrow-left"></i> Back to Citizen Portal</button></div>' +
                '<div class="ai-header-banner" style="margin-bottom:1.5rem;">' +
                    '<div class="ai-banner-badge"><i class="fa-solid fa-list-check"></i> Pending Tasks</div>' +
                    '<h2>Your Pending Tasks</h2>' +
                    '<p>Actions requiring your attention based on your current applications.</p>' +
                '</div>' +
                '<div style="margin-bottom:1rem; font-size:0.85rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em;">' +
                    (_taskCount > 0 ? _taskCount + ' Task' + (_taskCount > 1 ? 's' : '') + ' Requiring Attention' : 'All Clear') +
                '</div>' +
                _pendingTaskCards +
            '</div>';
        }
    }

    else if (isCitizenDrivingTest) {
        var _cSession = safeParseJSON(sessionStorage.getItem('citizenSession'), null);
        if (!_cSession) {
            pageContent = '<div class="animate-in" style="max-width:480px; margin:3rem auto; text-align:center;">' +
                '<div class="card" style="padding:2.5rem 2rem;">' +
                    '<div style="width:70px;height:70px;border-radius:50%;background:#e8f7f1;color:#1aab74;font-size:2rem;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem auto;"><i class="fa-solid fa-lock"></i></div>' +
                    '<h3 style="margin-bottom:0.5rem;">Citizen Login Required</h3>' +
                    '<p style="color:var(--text-muted);margin-bottom:1.25rem;">Please log in as a Citizen to view your driving test status.</p>' +
                    '<button class="btn btn-primary" onclick="window.location.hash=\'citizen-login\'"><i class="fa-solid fa-right-to-bracket"></i> Go to Citizen Login</button>' +
                '</div>' +
            '</div>';
        } else {
            pageContent = renderCitizenDrivingTestPage(_cSession);
        }
    }

    else if (isTestCentre) {
        pageContent = renderTestCentrePage();
    }

    else if (isVerifyEvidence) {
        pageContent = renderEvidenceVerificationPage();
    }

    else if (isRTODocReview) {
        var _reviewRows = '';
        var _totalPending = 0, _totalApproved = 0, _totalRejected = 0;
        var allApps = getStoredApplications();

        for (var _ri = 0; _ri < pendingReviews.length; _ri++) {
            var _r = pendingReviews[_ri];
            var _matchedApp = null;
            for (var _ai = 0; _ai < allApps.length; _ai++) {
                if (allApps[_ai].id === _r.appId) { _matchedApp = allApps[_ai]; break; }
            }

            if (_r.status === 'Pending Review') _totalPending++;
            else if (_r.status === 'Approved') _totalApproved++;
            else if (_r.status === 'Rejected') _totalRejected++;

            var _statusBadge = _r.status === 'Approved'
                ? '<span class="badge badge-approved">✓ Approved</span>'
                : _r.status === 'Rejected'
                ? '<span class="badge badge-rejected" style="background:#fff0f0;color:#c53030;border:1px solid #feb2b2;">✗ Declined</span>'
                : '<span class="badge badge-pending">⏳ Pending Review</span>';

            var _evStatusBadge = (_matchedApp && (_matchedApp.evidenceStatus === 'LOCKED' || _matchedApp.testEvidence))
                ? '<span class="badge badge-approved" style="font-size:0.75rem;"><i class="fa-solid fa-lock"></i> Locked</span>'
                : '<span class="badge badge-pending" style="font-size:0.75rem;">⏳ Pending</span>';

            var _testCentreName = (_matchedApp && _matchedApp.serviceDetails && _matchedApp.serviceDetails.rtoOfficeName)
                ? _matchedApp.serviceDetails.rtoOfficeName
                : 'TG-03 (Medchal)';

            var _actionBtns = '<button class="btn btn-primary" style="padding:0.3rem 0.75rem; font-size:0.78rem;" onclick="openReviewModal(\'' + _r.appId + '\')"><i class="fa-solid fa-eye"></i> View Evidence</button>';

            _reviewRows +=
                '<tr>' +
                    '<td><strong>' + _r.appId + '</strong></td>' +
                    '<td><div style="font-weight:600;">' + _r.candidateName + '</div></td>' +
                    '<td><span style="font-size:0.8rem; font-weight:600; color:var(--text-main);">' + _r.licenceType + '</span></td>' +
                    '<td><span style="font-size:0.78rem; color:var(--text-muted);">' + _testCentreName + '</span></td>' +
                    '<td><i class="fa-solid fa-file-video" style="color:#096dd9;"></i> ' + _r.mp4Name + '</td>' +
                    '<td><i class="fa-solid fa-file-pdf" style="color:#d46b08;"></i> ' + _r.pdfName + '</td>' +
                    '<td>' + _evStatusBadge + '</td>' +
                    '<td>' + _statusBadge + '</td>' +
                    '<td>' + _actionBtns + '</td>' +
                '</tr>';
        }
        if (_reviewRows === '') {
            _reviewRows = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:2rem;">' +
                '<i class="fa-solid fa-inbox" style="font-size:1.5rem; display:block; margin-bottom:0.5rem;"></i>' +
                'No documents submitted by citizens yet. They will appear here after citizen upload.</td></tr>';
        }

        pageContent = '' +
            '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'rto\'"><i class="fa-solid fa-arrow-left"></i> Back to RTO Dashboard</button></div>' +

            // Stats strip
            '<div class="stats-row animate-in" style="margin-bottom:1.25rem;">' +
                '<div class="stat-card"><div class="stat-icon" style="background:#fff7e6;color:#d46b08;"><i class="fa-solid fa-hourglass-half"></i></div><div><div class="stat-value">' + _totalPending + '</div><div class="stat-label">Pending Review</div></div></div>' +
                '<div class="stat-card"><div class="stat-icon" style="background:#eff6ff;color:#2563eb;"><i class="fa-solid fa-circle-check"></i></div><div><div class="stat-value">' + _totalApproved + '</div><div class="stat-label">Approved</div></div></div>' +
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
                            '<th>Applicant</th>' +
                            '<th>Licence Type</th>' +
                            '<th>Test Centre</th>' +
                            '<th>Video Evidence</th>' +
                            '<th>AI Report</th>' +
                            '<th>Evidence Status</th>' +
                            '<th>Evaluation Status</th>' +
                            '<th>Action</th>' +
                        '</tr></thead>' +
                        '<tbody id="docReviewTableBody">' + _reviewRows + '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';
    }

    else if (isRTO) {
        if (!_rs || (_rs.role !== 'REVIEWING_OFFICER' && _rs.role !== 'ADMIN')) {
            pageContent = '<div class="animate-in" style="max-width:500px; margin:3rem auto; text-align:center;">' +
                '<div class="card" style="padding:2.5rem 2rem;">' +
                    '<div style="width:70px; height:70px; border-radius:50%; background:#fff0f0; color:#c53030; font-size:2rem; display:flex; align-items:center; justify-content:center; margin:0 auto 1rem auto;"><i class="fa-solid fa-user-shield"></i></div>' +
                    '<h3 style="font-size:1.2rem; font-weight:700; color:var(--text-main); margin-bottom:0.5rem;">RTO Official Login Required</h3>' +
                    '<p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.5rem;">Please log in as an RTO Reviewing Officer or System Administrator to access this portal.</p>' +
                    '<button class="btn btn-primary" onclick="window.location.hash=\'rto-login\'"><i class="fa-solid fa-right-to-bracket"></i> Go to RTO Login</button>' +
                '</div>' +
            '</div>';
        } else if (_rs.role === 'ADMIN') {
            if (isRTOReports) {
                pageContent = '' +
                    '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'rto\'"><i class="fa-solid fa-arrow-left"></i> Back to RTO Dashboard</button></div>' +
                    '<div class="stats-row animate-in">' +
                        '<div class="stat-card"><div class="stat-icon" style="background:#eff6ff; color:#2563eb;"><i class="fa-solid fa-id-card"></i></div><div><div class="stat-value">1,240</div><div class="stat-label">Licences Issued</div></div></div>' +
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
            } else {
                pageContent = '' +
                    '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'home\'"><i class="fa-solid fa-arrow-left"></i> Back to Home</button></div>' +
                    renderAdminDashboard();
            }
        } else {
            // Logged in as reviewing officer / evaluator
            var allApps = getStoredApplications();

            // Filter applications assigned to this specific reviewer officer ONLY
            allApps = allApps.filter(function(a) {
                return (a.assignedOfficerEmail === _rs.email) ||
                       (a.assignedOfficerId === _rs.officerId) ||
                       (a.evaluator1 && a.evaluator1.officerId === _rs.officerId) ||
                       (a.evaluator2 && a.evaluator2.officerId === _rs.officerId) ||
                       (a.adjudicator && a.adjudicator.officerId === _rs.officerId);
            });

            var pendingList = allApps.filter(function(a) {
                var isPending = a.status === 'Pending RTO Review' || a.status === 'SECOND INDEPENDENT REVIEW REQUIRED' || a.status === 'Adjudication Review';
                var isMyPending = false;
                if (a.evaluator1 && a.evaluator1.officerId === _rs.officerId && !a.evaluator1.decision) isMyPending = true;
                if (a.evaluator2 && a.evaluator2.officerId === _rs.officerId && !a.evaluator2.decision) isMyPending = true;
                if (a.adjudicator && a.adjudicator.officerId === _rs.officerId && !a.adjudicator.decision) isMyPending = true;
                return isPending && isMyPending;
            });

            var approvedList = allApps.filter(function(a) {
                var isDone = false;
                if (a.evaluator1 && a.evaluator1.officerId === _rs.officerId && a.evaluator1.decision) isDone = true;
                if (a.evaluator2 && a.evaluator2.officerId === _rs.officerId && a.evaluator2.decision) isDone = true;
                if (a.adjudicator && a.adjudicator.officerId === _rs.officerId && a.adjudicator.decision) isDone = true;
                return isDone;
            });

            var listToDisplay = isRTOApproved ? approvedList : isRTOPending ? pendingList : allApps;

            var tableRows = listToDisplay.map(function(app) {
                var myRole = '';
                var myDecision = '';
                if (app.evaluator1 && app.evaluator1.officerId === _rs.officerId) {
                    myRole = 'Independent Evaluator';
                    myDecision = app.evaluator1.decision || 'Pending';
                } else if (app.evaluator2 && app.evaluator2.officerId === _rs.officerId) {
                    myRole = 'Independent Evaluator';
                    myDecision = app.evaluator2.decision || 'Pending';
                } else if (app.adjudicator && app.adjudicator.officerId === _rs.officerId) {
                    myRole = 'Independent Adjudicator';
                    myDecision = app.adjudicator.decision || 'Pending';
                }

                var myStatusBadge = '';
                if (myDecision === 'PASS') myStatusBadge = '<span class="badge badge-approved">PASS</span>';
                else if (myDecision === 'FAIL') myStatusBadge = '<span class="badge badge-rejected" style="background:#fff0f0;color:#c53030;border:1px solid #feb2b2;">FAIL</span>';
                else myStatusBadge = '<span class="badge badge-pending">⏳ Awaiting Your Review</span>';

                var globalStatusBadge = '';
                if (app.status === 'Approved') globalStatusBadge = '<span class="badge badge-approved">✓ Approved</span>';
                else if (app.status === 'Rejected') globalStatusBadge = '<span class="badge badge-rejected" style="background:#fff0f0;color:#c53030;border:1px solid #feb2b2;">✗ Declined</span>';
                else if (app.status === 'Disagreement - Adjudication Required' || app.status === 'Adjudication Review') globalStatusBadge = '<span class="badge" style="background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;">⚖️ Adjudication</span>';
                else globalStatusBadge = '<span class="badge badge-pending">⏳ In Progress</span>';

                return '<tr>' +
                    '<td><strong>' + app.id + '</strong></td>' +
                    '<td>' + app.type + '</td>' +
                    '<td>' + myRole + '</td>' +
                    '<td>' + myStatusBadge + '</td>' +
                    '<td>' + globalStatusBadge + '</td>' +
                    '<td>' + app.date + '</td>' +
                    '<td>' +
                        '<button class="btn btn-ghost" style="padding:0.35rem 0.8rem; font-size:0.78rem;" onclick="openReviewModal(\'' + app.id + '\')"><i class="fa-solid fa-eye"></i> ' + (myDecision === 'Pending' ? 'Evaluate Case' : 'View Case') + '</button>' +
                    '</td></tr>';
            }).join('');

            var sectionTitle = isRTOApproved ? 'My Completed Evaluations' : isRTOPending ? 'My Pending Independent Evaluations' : 'All My Cases';

            var modelBannerHTML = '<div style="background:#e6f4ff; border:1px solid #91caff; border-radius:var(--radius-md); padding:0.85rem 1.1rem; margin-bottom:1.25rem; font-size:0.84rem; color:#096dd9;">' +
                '<strong><i class="fa-solid fa-diagram-project"></i> Independent Evaluator Terminal:</strong> Logged in as <strong>' + _rs.name + ' (' + _rs.rtoCode + ')</strong>. You review driving test evidence and telemetry records <strong>blindly</strong> to eliminate local bias. Both evaluators must independently submit a Pass/Fail decision.' +
              '</div>';

            pageContent = '' +
                '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'home\'"><i class="fa-solid fa-arrow-left"></i> Back to Home</button></div>' +
                modelBannerHTML +
                '<div class="stats-row animate-in">' +
                    '<div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-folder-open"></i></div><div><div class="stat-value">' + allApps.length + '</div><div class="stat-label">Total Assigned Cases</div></div></div>' +
                    '<div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-clock"></i></div><div><div class="stat-value">' + pendingList.length + '</div><div class="stat-label">Awaiting Your Review</div></div></div>' +
                    '<div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-circle-check"></i></div><div><div class="stat-value">' + approvedList.length + '</div><div class="stat-label">Your Completed Reviews</div></div></div>' +
                    '<div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-shield-halved"></i></div><div><div class="stat-value">100%</div><div class="stat-label">Audit Logged</div></div></div>' +
                '</div>' +
                '<div class="card animate-in" style="animation-delay:0.05s;">' +
                    '<div class="card-title">' + sectionTitle + ' <span class="badge badge-active"><i class="fa-solid fa-circle" style="font-size:0.5rem"></i> Live queue</span></div>' +
                    '<div style="overflow-x:auto;">' +
                        '<table class="data-table" id="appTable"><thead><tr>' +
                            '<th>App ID</th><th>Service Type</th><th>Your Role</th><th>Your Decision</th><th>Overall Status</th><th>Date Assigned</th><th>Actions</th>' +
                        '</tr></thead><tbody>' + (tableRows || '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No applications found in this queue.</td></tr>') + '</tbody></table>' +
                    '</div>' +
                '</div>';
        }
    }

    // Render full layout
    var logoutTarget = _rs ? '#rto-login' : '#citizen-login';
    var isUserAuthenticated = isCitizenSessionActive || isRtoSessionActive;

    var logoutBtnHTML = isUserAuthenticated
        ? '<button class="btn-logout" onclick="handleLogout(\'' + logoutTarget + '\')"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>'
        : '';

    var sidebarLogoutHTML = isUserAuthenticated
        ? '<div style="margin-top:0.5rem; padding-top:0.5rem; border-top:1px solid var(--border);">' +
            '<a href="javascript:void(0)" class="nav-item" onclick="handleLogout(\'' + logoutTarget + '\')" style="color:#ef4444;">' +
                '<i class="fa-solid fa-right-from-bracket"></i> Logout' +
            '</a>' +
          '</div>'
        : '';

    var modalHTML = activeReviewModalAppId ? buildReviewModalHTML(activeReviewModalAppId) : '';

    var searchBarHTML = (isHome && !isUserAuthenticated)
        ? ''
        : '<div class="search-bar"><i class="fa-solid fa-magnifying-glass"></i><input type="text" placeholder="Search applications..."></div>';

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
                    searchBarHTML +
                    '<div class="header-icon-btn"><i class="fa-solid fa-bell"></i></div>' +
                    (userInfo
                        ? '<div class="user-chip"><div class="user-avatar">' + userInfo.initials + '</div><div><div class="user-chip-name">' + userInfo.name + '</div><div class="user-chip-role">' + userInfo.role + '</div></div></div>' + logoutBtnHTML
                        : '<button class="btn btn-primary" style="font-size:0.85rem; padding:0.45rem 1rem;" onclick="window.location.hash=\'citizen-login\'"><i class="fa-solid fa-right-to-bracket"></i> Sign In</button>') +
                '</div>' +
            '</header>' +
            '<main class="page-body">' + pageContent + '</main>' +
        '</div>' +
        modalHTML;

    if (isCitizenTrack) {
        setTimeout(function() {
            try { trackStatus(); } catch(e) {}
        }, 50);
    }
}

window.handleLogout = function(target) {
    if (confirm('Are you sure you want to log out?')) {
        sessionStorage.removeItem('citizenSession');
        sessionStorage.removeItem('rtoSession');
        localStorage.removeItem('citizenSession');
        localStorage.removeItem('rtoSession');

        window.location.hash = 'home';
        render();
    }
};

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

    var apps = getStoredApplications();
    var newId = 'APP-' + (100 + apps.length + 1);
    apps.push({ id: newId, name: name, type: type, status: 'Pending', date: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'}) });
    saveStoredApplications(apps);
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
    var input = document.getElementById('trackInput') || document.getElementById('trackAppIdInput');
    if (!input || !input.value) return;
    var id = String(input.value).trim().toUpperCase();
    if (!id) return;

    var apps = getStoredApplications();
    var reviews = getStoredReviews();
    var app = null;

    for (var i = 0; i < apps.length; i++) {
        if (apps[i].id === id) { app = apps[i]; break; }
    }

    var reviewObj = null;
    for (var r = 0; r < reviews.length; r++) {
        if (reviews[r].appId === id) { reviewObj = reviews[r]; break; }
    }

    if (!app && reviewObj) {
        app = { id: reviewObj.appId, name: reviewObj.candidateName, type: reviewObj.licenceType, status: reviewObj.status, date: reviewObj.submittedOn };
    }

    if (!app) { 
        alert('Application not found. Please check the ID (e.g. APP-101, APP-102).'); 
        return; 
    }

    // Security: Only allow tracking for the logged-in citizen
    var _citizenSession = safeParseJSON(sessionStorage.getItem('citizenSession'), null);
    if (_citizenSession) {
        if (app.citizenId && app.citizenId !== _citizenSession.email && app.citizenId !== _citizenSession.appId) {
            alert('Access Denied: You can only track your own applications.');
            return;
        }
    }

    var effectiveStatus = app.status;
    if (reviewObj && (reviewObj.status === 'Approved' || reviewObj.status === 'Rejected')) {
        effectiveStatus = reviewObj.status;
    }

    var resultDiv = document.getElementById('trackResult');
    if (resultDiv) resultDiv.style.display = 'block';

    var nameEl = document.getElementById('trackName');
    if (nameEl) nameEl.textContent = app.name;

    var typeEl = document.getElementById('trackType');
    if (typeEl) typeEl.textContent = app.type + ' — ' + app.id;

    var badge = document.getElementById('trackBadge');
    if (badge) {
        if (app.type === "Learner's Licence") {
            if (effectiveStatus === 'Approved') {
                badge.textContent = "Learner's Licence Issued";
                badge.className = 'badge badge-approved';
                badge.style.background = '#e8f7f1';
                badge.style.color = '#1aab74';
                badge.style.border = '1px solid #c2ead8';
            } else if (effectiveStatus === 'Rejected') {
                badge.textContent = 'Test Not Passed';
                badge.className = 'badge badge-rejected';
                badge.style.background = '#fff0f0';
                badge.style.color = '#c53030';
                badge.style.border = '1px solid #feb2b2';
            } else {
                badge.textContent = 'Application Submitted — Test Scheduled';
                badge.className = 'badge badge-pending';
                badge.style.background = '#fff7e6';
                badge.style.color = '#d46b08';
                badge.style.border = '1px solid #ffe7ba';
            }
        } else {
            if (effectiveStatus === 'Approved') {
                badge.textContent = '✓ Approved';
                badge.className = 'badge badge-approved';
                badge.style.background = '#e8f7f1';
                badge.style.color = '#1aab74';
                badge.style.border = '1px solid #c2ead8';
            } else if (effectiveStatus === 'Rejected') {
                badge.textContent = '✗ Declined';
                badge.className = 'badge badge-rejected';
                badge.style.background = '#fff0f0';
                badge.style.color = '#c53030';
                badge.style.border = '1px solid #feb2b2';
            } else {
                badge.textContent = '● Pending Review';
                badge.className = 'badge badge-pending';
                badge.style.background = '#fff7e6';
                badge.style.color = '#d46b08';
                badge.style.border = '1px solid #ffe7ba';
            }
        }
    }

    var certBox = document.getElementById('approvalCertificateBox');
    var certTitle = document.getElementById('approvalCertTitle');
    var certDesc = document.getElementById('approvalCertDesc');
    var certBtn = document.getElementById('approvalCertBtn');

    if (certBox) {
        if (effectiveStatus === 'Approved') {
            certBox.style.display = 'block';
            if (app.type === "Learner's Licence") {
                if (certTitle) certTitle.innerHTML = '<i class="fa-solid fa-circle-check"></i> Congratulations! Your Learner\'s Licence application has been successfully processed.';
                if (certDesc) certDesc.textContent = 'Your official Learner\'s Licence document has been generated and issued.';
                if (certBtn) {
                    certBtn.innerHTML = '<i class="fa-solid fa-download"></i> Download / Print Learner\'s Licence';
                    certBtn.onclick = function() { viewLearnerLicenceDoc(app.id); };
                }
            } else {
                if (certTitle) certTitle.innerHTML = '<i class="fa-solid fa-circle-check"></i> Congratulations! Your Driving Licence is Approved';
                if (certDesc) certDesc.textContent = 'Your official licence document has been generated and approved by RTO Authority.';
                if (certBtn) {
                    certBtn.innerHTML = '<i class="fa-solid fa-download"></i> Download / Print Driving Licence';
                    certBtn.onclick = function() { viewPdfDocument(app.id); };
                }
            }
        } else {
            certBox.style.display = 'none';
        }
    }

    var steps = [];
    if (app.type === "Learner's Licence") {
        var sd = app.serviceDetails || {};
        var appDate = app.date || 'Submitted';
        var testDate = sd.allocatedTestDate || sd.slotDate || appDate;
        var testTime = sd.allocatedTestStartTime || sd.slotTime || '10:00 AM';
        var rtoName = sd.rtoOfficeName || 'RTO Office';
        var rtoCodeStr = sd.rtoCode ? ('Code ' + sd.rtoCode + ' - ' + rtoName) : rtoName;

        if (effectiveStatus === 'Approved') {
            steps = [
                { label: 'Application Submitted', sub: 'Completed on ' + appDate, done: true },
                { label: 'Documents & Identity Verification', sub: 'Aadhaar, Photograph & Signature Verified', done: true },
                { label: 'LL Test Slot Scheduled', sub: 'Scheduled @ ' + rtoCodeStr, done: true },
                { label: 'Learner\'s Licence Computer Test', sub: 'Traffic Signs & Rules Exam (Passed)', done: true },
                { label: 'Learner\'s Licence Issued', sub: 'Digital LL Certificate Issued', done: true }
            ];
        } else if (effectiveStatus === 'Rejected') {
            steps = [
                { label: 'Application Submitted', sub: 'Completed on ' + appDate, done: true },
                { label: 'Documents & Identity Verification', sub: 'Aadhaar, Photograph & Signature Verified', done: true },
                { label: 'LL Test Slot Scheduled', sub: 'Scheduled @ ' + rtoCodeStr, done: true },
                { label: 'Learner\'s Licence Computer Test', sub: 'Traffic Signs & Rules Exam (Not Passed)', done: false, error: true },
                { label: 'Learner\'s Licence Issued', sub: 'Licence Not Issued', done: false, error: true }
            ];
        } else {
            steps = [
                { label: 'Application Submitted', sub: 'Completed on ' + appDate, done: true },
                { label: 'Documents & Identity Verification', sub: 'Aadhaar, Photograph & Signature Captured', done: true },
                { label: 'LL Test Slot Scheduled', sub: 'Scheduled @ ' + rtoCodeStr + ' (' + testTime + ')', done: true },
                { label: 'Learner\'s Licence Computer Test', sub: 'Computerized Knowledge Exam Scheduled for ' + testDate + ' at ' + testTime, done: false },
                { label: 'Learner\'s Licence Issued', sub: 'Pending Test Completion', done: false }
            ];
        }
    } else if (app.type === 'Permanent Licence' || app.type === 'Permanent Driving Licence') {
        var sd = app.serviceDetails || {};
        var appDate = app.date || 'Submitted';
        var testDate = sd.allocatedTestDate || sd.preferredTestDate || appDate;
        var testTime = (sd.allocatedTestStartTime && sd.allocatedTestEndTime) ? (sd.allocatedTestStartTime + ' - ' + sd.allocatedTestEndTime) : '10:00 AM - 11:00 AM';
        var localRtoCode = (sd.rtoCode || 'TG-03');
        var localRtoName = (sd.rtoOfficeName || 'RTA Medchal / Hyderabad West');
        var allocatedOfficerRto = app.allocatedRtoCode || 'TG-08';
        var crossRtoText = 'Test Centre: ' + localRtoCode + ' (' + localRtoName + ') → Independent Reviewer: ' + allocatedOfficerRto + ' (Automated Cross-RTO Random Assignment)';

        var hasEvidence = (reviewObj != null || app.testEvidence != null || app.evidenceStatus === 'LOCKED');
        var isSecondRound = (app.status === 'SECOND INDEPENDENT REVIEW REQUIRED');

        if (effectiveStatus === 'Approved') {
            steps = [
                { label: 'Permanent Licence Application Submitted', sub: 'Completed on ' + appDate, done: true },
                { label: 'Learner\'s Licence Eligibility Verified', sub: '30-Day Mandatory Learning Period Completed', done: true },
                { label: 'Physical Driving Test Centre Slot', sub: 'Attended @ ' + localRtoName + ' (' + localRtoCode + ')', done: true },
                { label: 'Applicant Identity / Attendance Verification', sub: 'Biometrics & Face Match Confirmed at Test Centre', done: true },
                { label: 'Live Multi-Angle HD Camera Stream', sub: 'Video Recording Captured & Locked', done: true },
                { label: 'Vehicle Sensor & Telemetry Data', sub: 'OBD-II & Sensor Telemetry Captured', done: true },
                { label: 'Test Evidence Package Secured', sub: 'Package EV-206500 (SHA-256 Hash Locked)', done: true },
                { label: 'AI-Assisted Evidence Analysis', sub: 'AI Scorecard Report Generated', done: true },
                { label: 'Automated Cross-RTO Random Assignment', sub: crossRtoText, done: true },
                { label: 'Independent Officer Review', sub: 'Reviewed & Approved by Cross-RTO Officer (' + allocatedOfficerRto + ')', done: true },
                { label: 'Final Approval Decision', sub: 'Permanent Driving Licence Approved', done: true },
                { label: 'Licence Issuance', sub: 'Digital & Smart Card Driving Licence Issued', done: true }
            ];
        } else if (effectiveStatus === 'Rejected') {
            steps = [
                { label: 'Permanent Licence Application Submitted', sub: 'Completed on ' + appDate, done: true },
                { label: 'Learner\'s Licence Eligibility Verified', sub: '30-Day Mandatory Period Verified', done: true },
                { label: 'Physical Driving Test Centre Slot', sub: 'Attended @ ' + localRtoName, done: true },
                { label: 'Driving Test Telemetry & Video Captured', sub: 'Video & Sensor Data Logged', done: true },
                { label: 'Test Evidence Package Secured', sub: 'Evidence Package SHA-256 Locked', done: true },
                { label: 'Automated Cross-RTO Random Assignment', sub: crossRtoText, done: true },
                { label: 'Independent Officer Review', sub: 'First Review Declined by Officer (' + allocatedOfficerRto + ')', done: false, error: true },
                { label: 'Second Independent Review', sub: 'Second Review Consensus: Declined', done: false, error: true },
                { label: 'Final Approval Decision', sub: 'Application Final Rejected', done: false, error: true },
                { label: 'Licence Issuance', sub: 'Licence Not Issued', done: false, error: true }
            ];
        } else if (isSecondRound) {
            steps = [
                { label: 'Permanent Licence Application Submitted', sub: 'Completed on ' + appDate, done: true },
                { label: 'Learner\'s Licence Eligibility Verified', sub: 'Verified', done: true },
                { label: 'Physical Driving Test Centre Slot', sub: 'Attended @ ' + localRtoName, done: true },
                { label: 'Driving Test Telemetry & Video Captured', sub: 'Correlated Video & OBD-II Logged', done: true },
                { label: 'Test Evidence Package Secured', sub: 'Evidence Package SHA-256 Locked', done: true },
                { label: 'First Cross-RTO Review (' + allocatedOfficerRto + ')', sub: 'Round 1 Rejection Logged', done: true },
                { label: 'Automatic 2nd Independent Allocation', sub: 'Re-allocated to Second Independent Reviewer Pool (TG-12)', done: true },
                { label: 'Second Independent Review (Round 2)', sub: 'Pending Round 2 Officer Decision', done: false },
                { label: 'Final Approval Decision', sub: 'Awaiting Consensus', done: false },
                { label: 'Licence Issuance', sub: 'Pending Final Approval', done: false }
            ];
        } else {
            steps = [
                { label: 'Permanent Licence Application Submitted', sub: 'Completed on ' + appDate, done: true },
                { label: 'Learner\'s Licence Eligibility Verified', sub: '30-Day Mandatory Requirement Verified', done: true },
                { label: 'Physical Driving Test Centre Slot', sub: 'Scheduled @ ' + localRtoName + ' (' + testTime + ')', done: true },
                { label: 'Applicant Identity / Attendance Verification', sub: hasEvidence ? 'Verified at Test Centre' : 'Awaiting Physical Attendance on Test Day', done: hasEvidence },
                { label: 'Driving Test Telemetry & HD Video Captured', sub: hasEvidence ? 'Completed & Logged' : 'Awaiting Driving Test at RTO Test Centre', done: hasEvidence },
                { label: 'Test Evidence Package Secured', sub: hasEvidence ? 'Secured (SHA-256 Locked)' : 'Awaiting Driving Test', done: hasEvidence },
                { label: 'AI-Assisted Evidence Analysis', sub: hasEvidence ? 'AI Scorecard Analysis Generated' : 'Awaiting Test Evidence', done: hasEvidence },
                { label: 'Automated Cross-RTO Random Assignment', sub: hasEvidence ? crossRtoText : 'Awaiting Test Completion', done: hasEvidence },
                { label: 'Independent Officer Review', sub: hasEvidence ? ('Pending Review by Independent Officer (' + allocatedOfficerRto + ')') : 'Not Started', done: false },
                { label: 'Final Decision', sub: 'Awaiting Independent Officer Decision', done: false },
                { label: 'Licence Issuance', sub: 'Pending Final Approval', done: false }
            ];
        }
    } else if (app.type === 'Renewal') {
        if (effectiveStatus === 'Approved') {
            steps = [
                { label: 'Application Submitted', sub: 'Completed on ' + app.date, done: true },
                { label: 'Document Verification', sub: 'Documents & Medical Cert Verified', done: true },
                { label: 'RTO Review if required', sub: 'Review Approved', done: true },
                { label: 'Approved', sub: 'Renewal Approved', done: true },
                { label: 'Renewed Licence Issued', sub: 'Renewed Licence Dispatched', done: true }
            ];
        } else if (effectiveStatus === 'Rejected') {
            steps = [
                { label: 'Application Submitted', sub: 'Completed on ' + app.date, done: true },
                { label: 'Document Verification', sub: 'Document Check Failed', done: false, error: true },
                { label: 'RTO Review if required', sub: 'Review Declined', done: false, error: true },
                { label: 'Approved', sub: 'Not Approved', done: false, error: true },
                { label: 'Renewed Licence Issued', sub: 'Licence Not Issued', done: false, error: true }
            ];
        } else {
            steps = [
                { label: 'Application Submitted', sub: 'Completed on ' + app.date, done: true },
                { label: 'Document Verification', sub: 'Under Verification', done: false },
                { label: 'RTO Review if required', sub: 'Pending Verification', done: false },
                { label: 'Approved', sub: 'Awaiting Approval', done: false },
                { label: 'Renewed Licence Issued', sub: 'Awaiting Decision', done: false }
            ];
        }
    } else if (app.type === 'Duplicate') {
        if (effectiveStatus === 'Approved') {
            steps = [
                { label: 'Application Submitted', sub: 'Completed on ' + app.date, done: true },
                { label: 'Document Verification', sub: 'FIR / Loss Report Verified', done: true },
                { label: 'RTO Review', sub: 'Approved by RTO', done: true },
                { label: 'Approved', sub: 'Duplicate Issuance Approved', done: true },
                { label: 'Duplicate Licence Issued', sub: 'Duplicate Licence Dispatched', done: true }
            ];
        } else if (effectiveStatus === 'Rejected') {
            steps = [
                { label: 'Application Submitted', sub: 'Completed on ' + app.date, done: true },
                { label: 'Document Verification', sub: 'Verification Failed', done: false, error: true },
                { label: 'RTO Review', sub: 'Declined by RTO', done: false, error: true },
                { label: 'Approved', sub: 'Not Approved', done: false, error: true },
                { label: 'Duplicate Licence Issued', sub: 'Licence Not Issued', done: false, error: true }
            ];
        } else {
            steps = [
                { label: 'Application Submitted', sub: 'Completed on ' + app.date, done: true },
                { label: 'Document Verification', sub: 'Under Verification', done: false },
                { label: 'RTO Review', sub: 'Awaiting Queue', done: false },
                { label: 'Approved', sub: 'Awaiting Approval', done: false },
                { label: 'Duplicate Licence Issued', sub: 'Awaiting Issuance', done: false }
            ];
        }
    }

    var timelineHTML = '';
    for (var j = 0; j < steps.length; j++) {
        var dotClass = steps[j].error ? 'dot-error' : (steps[j].done ? 'active' : '');
        var dotStyle = steps[j].error ? 'background:#ef4444; border-color:#dc2626;' : '';
        timelineHTML += '<div class="timeline-item">' +
            '<div class="timeline-dot ' + dotClass + '" style="' + dotStyle + '"></div>' +
            '<div class="timeline-content"><p style="font-weight:600;">' + steps[j].label + '</p><small style="color:var(--text-muted);">' + steps[j].sub + '</small></div>' +
        '</div>';
    }
    var timelineEl = document.getElementById('trackTimeline');
    if (timelineEl) timelineEl.innerHTML = timelineHTML;
}

// ─── APPROVE ───
function approveApp(id) {
    var apps = getStoredApplications();
    for (var i = 0; i < apps.length; i++) {
        if (apps[i].id === id) {
            apps[i].status = 'Approved';
            break;
        }
    }
    saveStoredApplications(apps);

    var reviews = getStoredReviews();
    for (var r = 0; r < reviews.length; r++) {
        if (reviews[r].appId === id) {
            reviews[r].status = 'Approved';
            reviews[r].reviewedBy = 'RTO Officer';
        }
    }
    saveStoredReviews(reviews);

    render();
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
                    backgroundColor: ['#2563eb', '#1d4ed8', '#3b82f6', '#60a5fa', '#93c5fd'],
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
    var _cs = safeParseJSON(sessionStorage.getItem('citizenSession'), {});
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
    var session = safeParseJSON(sessionStorage.getItem('rtoSession'), null);
    if (!session || session.role !== 'REVIEWING_OFFICER') {
        alert('⛔ ACCESS DENIED: Only reviewing officers can perform this action.');
        return;
    }
    var reviews = getStoredReviews();
    var apps = getStoredApplications();
    var reviewerName = session ? (session.name + ' (' + session.rtoCode + ')') : 'Officer 17 (TG-08)';
    var candidateName = '';

    for (var j = 0; j < apps.length; j++) {
        if (apps[j].id === appId) {
            apps[j].status = 'Approved';
            apps[j].reviewStage = 'Licence Approved (Officer Approval)';
            candidateName = apps[j].name;
            if (!apps[j].reviewHistory) apps[j].reviewHistory = [];
            apps[j].reviewHistory.push({
                round: (apps[j].reviewHistory.length + 1),
                officer: reviewerName,
                decision: 'APPROVED',
                timestamp: new Date().toLocaleString('en-IN')
            });
            break;
        }
    }
    saveStoredApplications(apps);

    for (var i = 0; i < reviews.length; i++) {
        if (reviews[i].appId === appId) {
            reviews[i].status = 'Approved';
            reviews[i].reviewedBy = reviewerName;
        }
    }
    saveStoredReviews(reviews);

    appendAuditEvent(appId, 'LL_APPROVED', reviewerName, 'REVIEWING_OFFICER', 'Learner\'s Licence approved');

    alert('✅ Learner\'s Licence APPROVED for ' + (candidateName || appId) + '!');
    closeReviewModal();
}

function confirmDeclineFromModal(appId) {
    var session = safeParseJSON(sessionStorage.getItem('rtoSession'), null);
    if (!session || session.role !== 'REVIEWING_OFFICER') {
        alert('⛔ ACCESS DENIED: Only reviewing officers can perform this action.');
        return;
    }
    var remarkInput = document.getElementById('declineRemarkInput');
    var remark = remarkInput ? remarkInput.value.trim() : '';
    if (!remark) {
        alert('⚠️ Mandatory Rejection Reason Required.');
        if (remarkInput) remarkInput.focus();
        return;
    }

    var reviews = getStoredReviews();
    var apps = getStoredApplications();
    var currentOfficer = session ? (session.name + ' (' + session.rtoCode + ')') : 'Officer 17 (TG-08)';
    
    for (var j = 0; j < apps.length; j++) {
        if (apps[j].id === appId) {
            apps[j].status = 'Rejected';
            apps[j].reviewStage = 'Licence Declined (Officer Rejection)';
            if (!apps[j].reviewHistory) apps[j].reviewHistory = [];
            apps[j].reviewHistory.push({
                round: apps[j].reviewHistory.length + 1,
                officer: currentOfficer,
                decision: 'REJECTED',
                reason: remark,
                timestamp: new Date().toLocaleString('en-IN')
            });
            break;
        }
    }
    saveStoredApplications(apps);

    for (var r = 0; r < reviews.length; r++) {
        if (reviews[r].appId === appId) {
            reviews[r].status = 'Rejected';
            reviews[r].reviewedBy = currentOfficer;
            reviews[r].notes = remark;
            break;
        }
    }
    saveStoredReviews(reviews);

    appendAuditEvent(appId, 'LL_REJECTED', currentOfficer, 'REVIEWING_OFFICER', 'Learner\'s Licence rejected. Reason: ' + remark);

    alert('❌ Learner\'s Licence DECLINED.');
    closeReviewModal();
}

window.openDecisionInput = function(appId, decision) {
    isDeclineBoxVisible = true;
    render();
    setTimeout(function() {
        var title = document.getElementById('decisionBoxTitle');
        var desc = document.getElementById('decisionBoxDesc');
        var btn = document.getElementById('confirmDecisionBtn');
        if (title) title.innerHTML = decision === 'PASS' ? '✅ Confirm PASS Decision' : '❌ Confirm FAIL Decision';
        if (desc) desc.textContent = decision === 'PASS' ? 'Provide positive telemetry/evidence references confirming candidate passed:' : 'Enter mandatory failure reason / boundary overrun telemetry logs:';
        if (btn) {
            btn.className = decision === 'PASS' ? 'btn btn-primary' : 'btn btn-danger';
            btn.onclick = function() {
                var reason = document.getElementById('declineRemarkInput').value.trim();
                submitEvaluatorDecision(appId, decision, reason);
            };
        }
    }, 50);
};

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

    var session = safeParseJSON(sessionStorage.getItem('rtoSession'), null);
    var isAdmin = session && session.role === 'ADMIN';
    var isReviewer = session && session.role === 'REVIEWING_OFFICER';
    var userRole = isAdmin ? 'ADMIN' : (isReviewer ? 'REVIEWING_OFFICER' : 'CITIZEN');
    var officerId = session ? session.officerId : null;

    if (appObj) {
        appObj = getBlindedApplicationForRole(appObj, userRole, officerId);
    }

    var candidateName = (reviewObj && reviewObj.candidateName) ? reviewObj.candidateName : (appObj ? appObj.name : 'Applicant');
    var licenceType = (reviewObj && reviewObj.licenceType) ? reviewObj.licenceType : (appObj ? appObj.type : 'Driving Licence');
    var mp4Name = (reviewObj && reviewObj.mp4Name) ? reviewObj.mp4Name : appId + '_TrackTest_Cam01.mp4';
    var pdfName = (reviewObj && reviewObj.pdfName) ? reviewObj.pdfName : 'RTO_AI_Report_' + appId + '.pdf';
    var notes = (reviewObj && reviewObj.notes) ? reviewObj.notes : 'Candidate test track telemetry and document package submitted.';
    var submittedOn = (reviewObj && reviewObj.submittedOn) ? reviewObj.submittedOn : (appObj ? appObj.date : 'Recent');
    var status = appObj ? appObj.status : (reviewObj ? reviewObj.status : 'Pending');

    var videoDataSrc = (reviewObj && reviewObj.videoDataUrl) ? reviewObj.videoDataUrl : (window.lastUploadedVideoURL || 'https://www.w3schools.com/html/mov_bbb.mp4');
    var pdfDataSrc = window.lastUploadedPdfURL || (reviewObj && reviewObj.pdfDataUrl ? reviewObj.pdfDataUrl : null);

    var statusBadgeClass = status === 'Approved' ? 'badge-approved' : status === 'Rejected' ? 'badge-rejected' : 'badge-pending';
    var statusText = status === 'Approved' ? '✓ Approved' : status === 'Rejected' ? '✗ Declined' : status === 'SECOND INDEPENDENT REVIEW REQUIRED' ? '⚠️ Round 2 Review Required' : '⏳ Pending Review';

    // RTO Allocation Details
    var testRtoCode = (appObj && appObj.serviceDetails && appObj.serviceDetails.rtoCode) ? appObj.serviceDetails.rtoCode : 'TG-03';
    var testRtoName = (appObj && appObj.serviceDetails && appObj.serviceDetails.rtoOfficeName) ? appObj.serviceDetails.rtoOfficeName : 'RTA Medchal / Hyderabad West';
    var assignedRtoCode = (appObj && appObj.allocatedRtoCode) ? appObj.allocatedRtoCode : 'TG-08';

    // Implement BLIND evaluation info hiding for Reviewing Officers
    if (isReviewer && licenceType !== "Learner's Licence") {
        candidateName = '[CONFIDENTIAL - BLIND REVIEW]';
        testRtoCode = '[REDACTED]';
        testRtoName = 'Test Centre [REDACTED]';
        mp4Name = appId + '_TrackTest_Cam[REDACTED].mp4';
        pdfName = 'RTO_AI_Report_' + appId + '_[REDACTED].pdf';
    }

    // History log rendered
    var historyHTML = '';
    if (appObj && appObj.reviewHistory && appObj.reviewHistory.length > 0) {
        historyHTML = appObj.reviewHistory.map(function(h) {
            var color = h.decision === 'APPROVED' || h.decision === 'PASS' ? '#148f60' : '#c53030';
            return '<div style="background:#fff; border:1px solid var(--border); border-radius:6px; padding:0.6rem 0.8rem; margin-bottom:0.4rem; font-size:0.78rem;">' +
                '<div class="flex-between"><strong>Review Round ' + h.round + ': <span style="color:' + color + ';">' + h.decision + '</span></strong><span style="color:var(--text-muted);">' + h.timestamp + '</span></div>' +
                '<div style="margin-top:0.2rem;">Officer: <strong>' + (isReviewer ? '[CONFIDENTIAL]' : h.officer) + '</strong></div>' +
                (h.reason ? '<div style="margin-top:0.2rem; color:#c53030;">Reason: <em>' + h.reason + '</em></div>' : '') +
            '</div>';
        }).join('');
    }

    if (appObj && isReviewer) {
        var myReviewStatus = 'Pending';
        var myOfficerId = session ? session.officerId : null;
        if (appObj.evaluator1 && appObj.evaluator1.officerId === myOfficerId) myReviewStatus = appObj.evaluator1.decision || 'Pending';
        if (appObj.evaluator2 && appObj.evaluator2.officerId === myOfficerId) myReviewStatus = appObj.evaluator2.decision || 'Pending';
        if (appObj.adjudicator && appObj.adjudicator.officerId === myOfficerId) myReviewStatus = appObj.adjudicator.decision || 'Pending';

        var myColor = myReviewStatus === 'PASS' ? '#148f60' : myReviewStatus === 'FAIL' ? '#c53030' : '#d46b08';
        var myStatusHtml = '<div style="background:#fff; border:1px solid var(--border); border-radius:6px; padding:0.65rem 0.85rem; margin-bottom:0.6rem; font-size:0.82rem;">' +
            '<div class="flex-between"><strong>Your Assignment: <span style="color:var(--text-main);">Independent Evaluator</span></strong><span class="badge" style="background:#f1f5f9; color:' + myColor + '; border:1px solid var(--border);">Your Review: ' + myReviewStatus + '</span></div>' +
            '<div style="margin-top:0.35rem; color:var(--text-muted); font-size:0.78rem;"><i class="fa-solid fa-shield-halved" style="color:var(--primary);"></i> Automatically allocated through the DriveSetu Cross-RTO Allocation Engine. Independent review process active.</div>' +
        '</div>';
        historyHTML = myStatusHtml + historyHTML;
    } else if (appObj && isAdmin && (appObj.evaluator1 || appObj.evaluator2)) {
        var evalHist = '';
        if (appObj.evaluator1) {
            var e1Dec = appObj.evaluator1.decision || 'Pending';
            var e1Color = e1Dec === 'PASS' ? '#148f60' : e1Dec === 'FAIL' ? '#c53030' : '#94a3b8';
            evalHist += '<div style="background:#fff; border:1px solid var(--border); border-radius:6px; padding:0.6rem 0.8rem; margin-bottom:0.4rem; font-size:0.78rem;">' +
                '<strong>Evaluator 1 Governance Record: <span style="color:' + e1Color + ';">' + e1Dec + '</span></strong>' +
                (appObj.evaluator1.reason ? '<div style="margin-top:0.2rem;">Reason: <em>' + appObj.evaluator1.reason + '</em></div>' : '') +
                '</div>';
        }
        if (appObj.evaluator2) {
            var e2Dec = appObj.evaluator2.decision || 'Pending';
            var e2Color = e2Dec === 'PASS' ? '#148f60' : e2Dec === 'FAIL' ? '#c53030' : '#94a3b8';
            evalHist += '<div style="background:#fff; border:1px solid var(--border); border-radius:6px; padding:0.6rem 0.8rem; margin-bottom:0.4rem; font-size:0.78rem;">' +
                '<strong>Evaluator 2 Governance Record: <span style="color:' + e2Color + ';">' + e2Dec + '</span></strong>' +
                (appObj.evaluator2.reason ? '<div style="margin-top:0.2rem;">Reason: <em>' + appObj.evaluator2.reason + '</em></div>' : '') +
                '</div>';
        }
        if (appObj.adjudicator) {
            var adjDec = appObj.adjudicator.decision || 'Pending';
            var adjColor = adjDec === 'PASS' ? '#148f60' : adjDec === 'FAIL' ? '#c53030' : '#94a3b8';
            evalHist += '<div style="background:#fff; border:1px solid var(--border); border-radius:6px; padding:0.6rem 0.8rem; margin-bottom:0.4rem; font-size:0.78rem;">' +
                '<strong>Round 3 Adjudicator Governance Record: <span style="color:' + adjColor + ';">' + adjDec + '</span></strong>' +
                (appObj.adjudicator.reason ? '<div style="margin-top:0.2rem;">Reason: <em>' + appObj.adjudicator.reason + '</em></div>' : '') +
                '</div>';
        }
        historyHTML = evalHist + historyHTML;
    }

    if (licenceType === "Learner's Licence") {
        var aadhaarDoc = null;
        var photoDoc = null;
        var form1aDoc = null;
        var parentDecDoc = null;
        
        if (appObj && appObj.documents) {
            for (var dIndex = 0; dIndex < appObj.documents.length; dIndex++) {
                var doc = appObj.documents[dIndex];
                if (doc.id === 'aadhaar') aadhaarDoc = doc;
                if (doc.id === 'photo') photoDoc = doc;
                if (doc.id === 'form_1a') form1aDoc = doc;
                if (doc.id === 'parent_declaration') parentDecDoc = doc;
            }
        }
        
        var stateVal = (appObj && appObj.serviceDetails) ? appObj.serviceDetails.state : 'N/A';
        var districtVal = (appObj && appObj.serviceDetails) ? appObj.serviceDetails.district : 'N/A';
        var pinVal = (appObj && appObj.serviceDetails) ? appObj.serviceDetails.pin : 'N/A';
        var aadhaarNumVal = (appObj && appObj.serviceDetails) ? appObj.serviceDetails.aadhaarNumber : 'N/A';
        var vehicleClassesVal = (appObj && appObj.serviceDetails && appObj.serviceDetails.vehicleClasses) ? appObj.serviceDetails.vehicleClasses : [];
        var parentNameVal = (appObj && appObj.serviceDetails) ? appObj.serviceDetails.parentName : '';
        var genderVal = (appObj && appObj.applicantDetails) ? appObj.applicantDetails.gender : 'N/A';
        var dobVal = (appObj && appObj.applicantDetails) ? appObj.applicantDetails.dob : 'N/A';
        var emailVal = (appObj && appObj.applicantDetails) ? appObj.applicantDetails.email : 'N/A';
        var mobileVal = (appObj && appObj.applicantDetails) ? appObj.applicantDetails.mobile : 'N/A';
        var addressVal = (appObj && appObj.applicantDetails) ? appObj.applicantDetails.address : 'N/A';
        var categoryVal = (appObj && appObj.serviceDetails) ? appObj.serviceDetails.applicantCategory : 'Adult';

        var catBadges = vehicleClassesVal.map(function(c) {
            return '<span class="badge badge-active" style="margin-right:0.3rem; margin-bottom:0.3rem;"><i class="fa-solid fa-car"></i> ' + c + '</span>';
        }).join('');
        if (!catBadges) catBadges = '<span class="text-danger">None selected</span>';

        var llActionsHTML = '';
        if (isAdmin) {
            llActionsHTML = '<button class="btn btn-ghost" type="button" onclick="closeReviewModal()">Close</button>' +
                '<button class="btn btn-ghost" style="color:#7c3aed; border:1px solid #c4b5fd;" onclick="adminEscalateForReview(\'' + appId + '\')"><i class="fa-solid fa-flag"></i> Escalate for Governance Review</button>';
        } else {
            llActionsHTML = '<button class="btn btn-ghost" type="button" onclick="closeReviewModal()">Close</button>' +
                '<div style="display:flex; gap:0.75rem;">' +
                    '<button class="btn btn-ghost" type="button" style="color:#c53030; border:1px solid #feb2b2; background:#fff5f5;" onclick="toggleDeclineRemarkBox()">' +
                        '<i class="fa-solid fa-xmark"></i> Decline' +
                    '</button>' +
                    '<button class="btn btn-primary" type="button" style="padding:0.6rem 1.4rem;" onclick="approveAppFromModal(\'' + appId + '\')">' +
                        '<i class="fa-solid fa-check"></i> Approve Licence' +
                    '</button>' +
                '</div>';
        }

        return '' +
            '<div class="modal-backdrop" id="reviewModalBackdrop" onclick="if(event.target===this) closeReviewModal();">' +
                '<div class="modal-card animate-in">' +
                    '<div class="modal-header">' +
                        '<div>' +
                            '<h3 style="font-size:1.15rem; font-weight:700; margin:0; color:var(--text-main);"><i class="fa-solid fa-file-signature" style="color:var(--primary); margin-right:0.4rem;"></i> RTO Citizen Learner\'s Licence Review</h3>' +
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

                    '<div class="grid-2" style="grid-template-columns: 1.2fr 0.8fr; gap:1.25rem; margin-bottom:1rem;">' +
                        '<div>' +
                            '<div class="card" style="padding:1.25rem; margin-bottom:1rem;">' +
                                '<h4 style="font-size:0.9rem; font-weight:700; color:var(--text-main); margin-bottom:0.75rem; border-bottom:1px solid var(--border); padding-bottom:0.25rem;"><i class="fa-solid fa-circle-info" style="color:var(--primary);"></i> Applicant Details</h4>' +
                                '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem; font-size:0.82rem;">' +
                                    '<div><span style="color:var(--text-muted);">Full Name:</span><br><strong>' + candidateName + '</strong></div>' +
                                    '<div><span style="color:var(--text-muted);">Date of Birth:</span><br><strong>' + dobVal + '</strong></div>' +
                                    '<div><span style="color:var(--text-muted);">Gender:</span><br><strong>' + genderVal + '</strong></div>' +
                                    '<div><span style="color:var(--text-muted);">Category:</span><br><strong>' + categoryVal + '</strong></div>' +
                                    '<div><span style="color:var(--text-muted);">Mobile:</span><br><strong>' + mobileVal + '</strong></div>' +
                                    '<div><span style="color:var(--text-muted);">Email:</span><br><strong>' + emailVal + '</strong></div>' +
                                '</div>' +
                                (parentNameVal ? '<div style="margin-top:0.75rem; font-size:0.82rem; border-top:1px dashed var(--border); padding-top:0.5rem;"><span style="color:var(--text-muted);">Parent/Guardian Name:</span> <strong>' + parentNameVal + '</strong></div>' : '') +
                            '</div>' +

                            '<div class="card" style="padding:1.25rem; margin-bottom:1rem;">' +
                                '<h4 style="font-size:0.9rem; font-weight:700; color:var(--text-main); margin-bottom:0.75rem; border-bottom:1px solid var(--border); padding-bottom:0.25rem;"><i class="fa-solid fa-map-location-dot" style="color:var(--primary);"></i> Address & Location</h4>' +
                                '<div style="font-size:0.82rem; line-height:1.5;">' +
                                    '<div><span style="color:var(--text-muted);">Address:</span> <strong>' + addressVal + '</strong></div>' +
                                    '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.5rem; margin-top:0.5rem;">' +
                                        '<div><span style="color:var(--text-muted);">District:</span> <strong>' + districtVal + '</strong></div>' +
                                        '<div><span style="color:var(--text-muted);">State:</span> <strong>' + stateVal + '</strong></div>' +
                                        '<div><span style="color:var(--text-muted);">PIN:</span> <strong>' + pinVal + '</strong></div>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +

                            '<div class="card" style="padding:1.25rem;">' +
                                '<h4 style="font-size:0.9rem; font-weight:700; color:var(--text-main); margin-bottom:0.75rem; border-bottom:1px solid var(--border); padding-bottom:0.25rem;"><i class="fa-solid fa-car" style="color:var(--primary);"></i> Requested Categories & Aadhaar</h4>' +
                                '<div style="font-size:0.82rem; margin-bottom:0.75rem;">' +
                                    '<div style="color:var(--text-muted); margin-bottom:0.25rem;">Vehicle Categories:</div>' +
                                    '<div style="display:flex; flex-wrap:wrap; margin-top:0.25rem;">' + catBadges + '</div>' +
                                '</div>' +
                                '<div style="font-size:0.82rem; border-top: 1px dashed var(--border); padding-top:0.5rem;">' +
                                    '<div><span style="color:var(--text-muted);">Aadhaar Number:</span> <strong>' + aadhaarNumVal + '</strong></div>' +
                                 '</div>' +
                            '</div>' +
                        '</div>' +

                        '<div>' +
                            '<div class="card" style="padding:1rem; margin-bottom:1rem; text-align:center;">' +
                                '<h4 style="font-size:0.85rem; font-weight:700; color:var(--text-main); margin-bottom:0.5rem; text-align:left;"><i class="fa-solid fa-image" style="color:var(--primary);"></i> Photograph</h4>' +
                                (photoDoc && photoDoc.dataUrl
                                    ? '<img src="' + photoDoc.dataUrl + '" style="max-width:130px; max-height:160px; border-radius:6px; border:1px solid var(--border); margin:0.5rem auto; display:block; object-fit:contain;">'
                                    : '<div style="background:#f8faf9; padding:2rem; border-radius:6px; border:1px dashed var(--border); font-size:0.78rem; color:var(--text-muted);">No photograph submitted</div>'
                                ) +
                            '</div>' +

                            '<div class="card" style="padding:1rem; margin-bottom:1rem;">' +
                                '<h4 style="font-size:0.85rem; font-weight:700; color:var(--text-main); margin-bottom:0.5rem;"><i class="fa-solid fa-id-card" style="color:var(--primary);"></i> Aadhaar Document</h4>' +
                                (aadhaarDoc && aadhaarDoc.dataUrl
                                    ? '<div style="border:1px solid var(--border); border-radius:6px; padding:0.5rem; background:#fcfcfc;">' +
                                        '<span style="font-size:0.76rem; font-weight:700; display:block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;"><i class="fa-solid fa-file-pdf" style="color:#d46b08;"></i> ' + aadhaarDoc.fileName + '</span>' +
                                        '<button type="button" class="btn btn-ghost" style="width:100%; font-size:0.75rem; margin-top:0.4rem; padding:0.3rem;" onclick="window.open(\'' + aadhaarDoc.dataUrl + '\', \'_blank\')"><i class="fa-solid fa-up-right-from-square"></i> Open Document</button>' +
                                      '</div>'
                                    : '<div style="background:#f8faf9; padding:1rem; border-radius:6px; border:1px dashed var(--border); font-size:0.78rem; color:var(--text-muted); text-align:center;">No Aadhaar document</div>'
                                ) +
                            '</div>' +
                        '</div>' +
                    '</div>' +

                    '<!-- Decline Remark Form Box -->' +
                    '<div id="declineRemarkContainer" class="decline-remark-box" style="display:' + (isDeclineBoxVisible ? 'block' : 'none') + ';">' +
                        '<div style="font-weight:700; font-size:0.88rem; color:#c53030; margin-bottom:0.25rem;">' +
                            '<i class="fa-solid fa-triangle-exclamation"></i> Declination Remark (Mandatory)' +
                        '</div>' +
                        '<p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.4rem;">' +
                            'Please enter the mandatory reason for declining this applicant\'s Learner\'s Licence:' +
                        '</p>' +
                        '<textarea id="declineRemarkInput" placeholder="e.g. Photograph unclear / Invalid Aadhaar format..."></textarea>' +
                        '<div style="display:flex; gap:0.5rem; justify-content:flex-end;">' +
                            '<button class="btn btn-ghost" type="button" style="padding:0.35rem 0.8rem; font-size:0.8rem;" onclick="toggleDeclineRemarkBox()">Cancel</button>' +
                            '<button class="btn btn-danger" type="button" style="background:#c53030; color:#fff; padding:0.35rem 0.8rem; font-size:0.8rem;" onclick="confirmDeclineFromModal(\'' + appId + '\')"><i class="fa-solid fa-paper-plane"></i> Confirm Declination</button>' +
                        '</div>' +
                    '</div>' +

                    '<!-- Bottom Actions Bar -->' +
                    '<div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:1rem; margin-top:1rem;">' +
                        llActionsHTML +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    // Permanent Licence & Other Cases Modal Structure (Dual review decision flow)
    var permActionsHTML = '';
    if (isAdmin) {
        permActionsHTML = '<button class="btn btn-ghost" type="button" onclick="closeReviewModal()">Close</button>' +
            '<button class="btn btn-ghost" style="color:#7c3aed; border:1px solid #c4b5fd;" onclick="adminEscalateForReview(\'' + appId + '\')"><i class="fa-solid fa-flag"></i> Escalate for Governance Review</button>';
    } else {
        var myDecision = '';
        if (appObj) {
            if (appObj.evaluator1 && appObj.evaluator1.officerId === session.officerId) myDecision = appObj.evaluator1.decision;
            if (appObj.evaluator2 && appObj.evaluator2.officerId === session.officerId) myDecision = appObj.evaluator2.decision;
            if (appObj.adjudicator && appObj.adjudicator.officerId === session.officerId) myDecision = appObj.adjudicator.decision;
        }

        if (myDecision) {
            permActionsHTML = '<button class="btn btn-ghost" type="button" onclick="closeReviewModal()">Close</button>' +
                '<span style="font-weight:700; color:var(--primary); font-size:0.85rem;"><i class="fa-solid fa-circle-check"></i> Your Evaluation Submitted: ' + myDecision + '</span>';
        } else {
            permActionsHTML = '<button class="btn btn-ghost" type="button" onclick="closeReviewModal()">Close</button>' +
                '<div style="display:flex; gap:0.75rem;">' +
                    '<button class="btn btn-ghost" type="button" style="color:#c53030; border:1px solid #feb2b2; background:#fff5f5;" onclick="openDecisionInput(\'' + appId + '\', \'FAIL\')">' +
                        '<i class="fa-solid fa-xmark"></i> Fail / Reject' +
                    '</button>' +
                    '<button class="btn" type="button" style="color:#b27b00; border:1px solid #ffe7ba; background:#fffbe6;" onclick="submitEvaluatorDecision(\'' + appId + '\', \'NEEDS_REVIEW\', \'Flagged for additional review by evaluator\')">' +
                        '<i class="fa-solid fa-hourglass-half"></i> Needs Review' +
                    '</button>' +
                    '<button class="btn btn-primary" type="button" style="padding:0.6rem 1.4rem;" onclick="openDecisionInput(\'' + appId + '\', \'PASS\')">' +
                        '<i class="fa-solid fa-check"></i> Pass / Approve' +
                    '</button>' +
                '</div>';
        }
    }

    return '' +
        '<div class="modal-backdrop" id="reviewModalBackdrop" onclick="if(event.target===this) closeReviewModal();">' +
            '<div class="modal-card animate-in" style="max-width:860px;">' +
                '<div class="modal-header">' +
                    '<div>' +
                        '<h3 style="font-size:1.15rem; font-weight:700; margin:0; color:var(--text-main);"><i class="fa-solid fa-file-signature" style="color:var(--primary); margin-right:0.4rem;"></i> RTO Driving Test & Telemetry Evaluation</h3>' +
                        '<p style="font-size:0.8rem; color:var(--text-muted); margin:0.2rem 0 0 0;">App ID: <strong>' + appId + '</strong> &bull; Candidate: <strong>' + candidateName + '</strong></p>' +
                    '</div>' +
                    '<button class="modal-close-btn" type="button" onclick="closeReviewModal()"><i class="fa-solid fa-xmark"></i></button>' +
                '</div>' +

                '<!-- Proposed Independent Evaluation Model Banner -->' +
                '<div style="background:#e6f4ff; border:1px solid #91caff; border-radius:var(--radius-md); padding:0.85rem 1rem; margin-bottom:1rem; font-size:0.82rem; color:#096dd9;">' +
                    '<div class="flex-between" style="margin-bottom:0.3rem;">' +
                        '<strong><i class="fa-solid fa-shield-halved"></i> Independent Review Assignment</strong>' +
                        '<span class="badge badge-approved" style="font-size:0.75rem;"><i class="fa-solid fa-lock"></i> Locked Evidence</span>' +
                    '</div>' +
                    '<div>Automatically allocated through the DriveSetu Cross-RTO Allocation Engine.</div>' +
                '</div>' +

                '<div style="background:#f8faf9; padding:0.75rem 1rem; border-radius:var(--radius-md); border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">' +
                    '<div style="font-size:0.82rem;">' +
                        '<span style="color:var(--text-muted);">Licence Type:</span> <strong>' + licenceType + '</strong>' +
                        '<span style="margin:0 0.5rem; color:var(--border);">&bull;</span>' +
                        '<span style="color:var(--text-muted);">Submitted:</span> <strong>' + submittedOn + '</strong>' +
                    '</div>' +
                    '<div><span class="badge ' + statusBadgeClass + '">' + statusText + '</span></div>' +
                '</div>' +

                (historyHTML ? ('<div style="background:#fff7e6; border:1px solid #ffe7ba; border-radius:var(--radius-md); padding:0.85rem; margin-bottom:1rem;">' +
                    '<h4 style="font-size:0.85rem; font-weight:700; color:#d46b08; margin-bottom:0.5rem;"><i class="fa-solid fa-clock-rotate-left"></i> Review & Allocation Audit History</h4>' +
                    historyHTML +
                '</div>') : '') +

                '<!-- Dual Document Display (MP4 Video + Telemetry + PDF AI Report) -->' +
                '<div class="grid-2" style="grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem;">' +
                    '<!-- MP4 Card with Real Video Player or Empty State -->' +
                    '<div class="card" style="padding:1rem;">' +
                        '<h4 style="font-size:0.88rem; font-weight:700; margin-bottom:0.5rem; color:var(--text-main);">' +
                            '<i class="fa-solid fa-file-video" style="color:#096dd9; margin-right:0.4rem;"></i> Original Test Video Recording' +
                        '</h4>' +
                        ((appObj && appObj.testEvidence && appObj.testEvidence.video && appObj.testEvidence.video.dataUrl) ? (
                            '<div class="preview-video-container" style="margin-top:0.4rem;">' +
                                '<div class="video-overlay-header">' +
                                    '<span class="cam-label"><i class="fa-solid fa-camera"></i> CAM-01 TRACK FOOTAGE</span>' +
                                    '<span class="telemetry-speed">SECURED MP4</span>' +
                                '</div>' +
                                '<div style="background:#000; min-height:180px; display:flex; align-items:center; justify-content:center; overflow:hidden;">' +
                                    '<video controls style="width:100%; max-height:220px; object-fit:contain; background:#000;" src="' + appObj.testEvidence.video.dataUrl + '"></video>' +
                                '</div>' +
                                '<div style="padding:0.6rem; background:#f8faf9; font-size:0.76rem; color:var(--text-muted); border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">' +
                                    '<span><i class="fa-solid fa-file-video" style="color:#096dd9;"></i> ' + appObj.testEvidence.video.fileName + '</span>' +
                                    '<button type="button" class="btn btn-ghost" style="padding:0.2rem 0.5rem; font-size:0.74rem;" onclick="openVideoDocument(\'' + appId + '\')"><i class="fa-solid fa-arrow-up-right-from-square"></i> Open Video</button>' +
                                '</div>' +
                            '</div>'
                        ) : (
                            '<div style="background:#f8faf9; border:1px dashed var(--border); padding:2rem 1rem; text-align:center; border-radius:6px; margin-top:0.4rem;">' +
                                '<i class="fa-solid fa-video-slash" style="font-size:2.2rem; color:#94a3b8; display:block; margin-bottom:0.5rem;"></i>' +
                                '<strong style="font-size:0.92rem; color:var(--text-main);">Test video not yet captured</strong>' +
                                '<div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.25rem;">Physical driving test session has not been conducted or submitted for application ' + appId + '.</div>' +
                            '</div>'
                        )) +
                    '</div>' +

                    '<!-- PDF Card with Viewer & Open Button or Empty State -->' +
                    '<div class="card" style="padding:1rem;">' +
                        '<h4 style="font-size:0.88rem; font-weight:700; margin-bottom:0.5rem; color:var(--text-main);">' +
                            '<i class="fa-solid fa-file-pdf" style="color:#d46b08; margin-right:0.4rem;"></i> AI Evaluation Report & Telemetry' +
                        '</h4>' +
                        ((appObj && (appObj.testEvidence || appObj.evidenceStatus === 'LOCKED')) ? (
                            '<div style="padding:0.75rem; background:#f4fbf8; border:1px solid #c2ead8; border-radius:var(--radius-md);">' +
                                '<div class="flex-between" style="margin-bottom:0.4rem;">' +
                                    '<span style="font-size:0.82rem; font-weight:700; color:var(--text-main);"><i class="fa-solid fa-file-pdf" style="color:#d46b08;"></i> ' + pdfName + '</span>' +
                                    '<span class="badge badge-approved">AI Decision Support</span>' +
                                '</div>' +
                                '<div style="margin-top:0.5rem; border-top:1px dashed #c2ead8; padding-top:0.5rem;">' +
                                    '<div style="background:#fff; border:1px solid #c2ead8; border-radius:6px; padding:1rem; text-align:center;">' +
                                        '<i class="fa-solid fa-file-pdf" style="font-size:2.2rem; color:#d46b08; display:block; margin-bottom:0.4rem;"></i>' +
                                        '<div style="font-size:0.88rem; font-weight:700; color:var(--text-main);">' + pdfName + '</div>' +
                                        '<div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.25rem;">Telemetry Score: <strong style="color:#148f60;">95 / 100 (RECOMMEND PASS)</strong></div>' +
                                    '</div>' +
                                    '<div style="margin-top:0.6rem; text-align:center;">' +
                                        '<button type="button" class="btn btn-primary" style="width:100%; justify-content:center; padding:0.45rem; font-size:0.8rem;" onclick="viewPdfDocument(\'' + appId + '\')">' +
                                            '<i class="fa-solid fa-arrow-up-right-from-square"></i> Open RTO AI Evaluation Report' +
                                        '</button>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div style="margin-top:0.6rem; font-size:0.74rem; color:#9a3412; padding:0.55rem; background:#fff7ed; border-radius:4px; border:1px solid #fed7aa;">' +
                                '<strong>Governance Safeguard:</strong> AI Evaluation Recommendation — Final licensing decision requires the configured independent government evaluation workflow.' +
                            '</div>'
                        ) : (
                            '<div style="background:#f8faf9; border:1px dashed var(--border); padding:2rem 1rem; text-align:center; border-radius:6px; margin-top:0.4rem;">' +
                                '<i class="fa-solid fa-file-circle-xmark" style="font-size:2.2rem; color:#94a3b8; display:block; margin-bottom:0.5rem;"></i>' +
                                '<strong style="font-size:0.92rem; color:var(--text-main);">AI Evaluation Report Not Available</strong>' +
                                '<div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.25rem;">AI telemetry analysis will be generated automatically upon driving test completion.</div>' +
                            '</div>'
                        )) +
                    '</div>' +
                '</div>' +

                '<!-- Decline/Pass Remark Form Box -->' +
                '<div id="declineRemarkContainer" class="decline-remark-box" style="display:' + (isDeclineBoxVisible ? 'block' : 'none') + ';">' +
                    '<div style="font-weight:700; font-size:0.88rem; color:var(--primary); margin-bottom:0.25rem;" id="decisionBoxTitle">' +
                        '<i class="fa-solid fa-triangle-exclamation"></i> Mandatory Reason & Evidence Reference' +
                    '</div>' +
                    '<p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.4rem;" id="decisionBoxDesc">' +
                        'Please enter the mandatory reason/evidence reference for your decision:' +
                    '</p>' +
                    '<textarea id="declineRemarkInput" placeholder="e.g. Completed all loops within bounds / boundary line overrun at 10:14..."></textarea>' +
                    '<div style="display:flex; gap:0.5rem; justify-content:flex-end;">' +
                        '<button class="btn btn-primary" type="button" id="confirmDecisionBtn" style="padding:0.35rem 0.8rem; font-size:0.8rem;">Confirm Submission</button>' +
                    '</div>' +
                '</div>' +

                '<!-- Bottom Actions Bar -->' +
                '<div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:1rem; margin-top:1rem;">' +
                    permActionsHTML +
                '</div>' +
            '</div>' +
        '</div>';
}

// ─── DOCUMENT & EVIDENCE OPENERS ───

function openVideoDocument(appId) {
    var targetId = appId || 'APP-206500';
    var apps = getStoredApplications();
    var appObj = null;
    for (var i = 0; i < apps.length; i++) {
        if (apps[i].id === targetId || apps[i].id === 'APP-' + targetId || targetId.indexOf(apps[i].id.replace('APP-', '')) !== -1) {
            appObj = apps[i];
            break;
        }
    }

    var videoUrl = 'pika.mp4';
    if (appObj && appObj.testEvidence && appObj.testEvidence.video && appObj.testEvidence.video.dataUrl) {
        videoUrl = appObj.testEvidence.video.dataUrl;
    } else {
        var reviews = getStoredReviews();
        for (var r = 0; r < reviews.length; r++) {
            if (reviews[r].appId === targetId && reviews[r].videoDataUrl) {
                videoUrl = reviews[r].videoDataUrl;
                break;
            }
        }
    }

    var win = window.open('', '_blank');
    if (win) {
        win.document.write('<!DOCTYPE html><html><head><title>DriveSetu Evidence Video - ' + targetId + '</title><style>body{margin:0;background:#0f172a;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;color:#fff;}.container{max-width:900px;width:95%;padding:20px;background:#1e293b;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.5);border:1px solid #334155;}video{width:100%;border-radius:8px;background:#000;}.header{display:flex;justify-content:space-between;margin-bottom:15px;font-size:0.9rem;color:#38bdf8;font-weight:bold;}</style></head><body><div class="container"><div class="header"><span>🔒 DRIVESETU SECURED EVIDENCE VIDEO</span><span>' + targetId + '</span></div><video controls autoplay loop style="max-height:500px;"><source src="' + videoUrl + '" type="video/mp4">Your browser does not support HTML5 video.</video><p style="font-size:0.8rem;color:#94a3b8;margin-top:12px;text-align:center;">Cryptographically Hashed & Locked Evidence Record • Government of Telangana RTO</p></div></body></html>');
        win.document.close();
    } else {
        window.open(videoUrl, '_blank');
    }
}

function generateDetailedAiReportHTML(appId) {
    var apps = getStoredApplications();
    var appObj = null;
    for (var i = 0; i < apps.length; i++) {
        if (apps[i].id === appId) { appObj = apps[i]; break; }
    }
    var reviews = getStoredReviews();
    var reviewObj = null;
    for (var r = 0; r < reviews.length; r++) {
        if (reviews[r].appId === appId) { reviewObj = reviews[r]; break; }
    }

    var applicantName = appObj ? appObj.name : (reviewObj ? reviewObj.candidateName : 'Demo Applicant');
    var licenceType = appObj ? appObj.type : 'Permanent Licence';
    var testCentre = (appObj && appObj.serviceDetails && appObj.serviceDetails.rtoOfficeName) ? appObj.serviceDetails.rtoOfficeName : 'RTA Medchal / Hyderabad West (TG-03)';
    var rtoCode = (appObj && appObj.serviceDetails && appObj.serviceDetails.rtoCode) ? appObj.serviceDetails.rtoCode : 'TG-03';
    var testDate = appObj ? appObj.date : '13 Aug 2026';
    var videoFile = (appObj && appObj.testEvidence && appObj.testEvidence.video) ? appObj.testEvidence.video.fileName : appId + '_TestVideo.mp4';
    var pdfFile = (appObj && appObj.testEvidence && appObj.testEvidence.aiReport) ? appObj.testEvidence.aiReport.fileName : appId + '_AI_Report.pdf';
    var hashVal = (appObj && appObj.integrityHash) ? appObj.integrityHash : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    return '<!DOCTYPE html><html><head><title>DRIVESETU RTO DRIVING TEST AI EVALUATION REPORT - ' + appId + '</title>' +
        '<meta charset="utf-8"/>' +
        '<style>' +
        'body { font-family: "Segoe UI", Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 2rem; color: #0f172a; line-height: 1.5; }' +
        '.report-container { background: #ffffff; max-width: 840px; margin: 0 auto; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #cbd5e1; }' +
        '.header { border-bottom: 3px solid #1aab74; padding-bottom: 1.25rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; }' +
        '.gov-title { font-size: 0.8rem; font-weight: 700; color: #64748b; letter-spacing: 1px; text-transform: uppercase; }' +
        '.main-title { font-size: 1.45rem; font-weight: 800; color: #0f172a; margin: 0.2rem 0; }' +
        '.badge-verified { background: #e8f7f1; color: #148f60; padding: 0.4rem 0.9rem; border-radius: 20px; font-weight: 700; font-size: 0.82rem; border: 1px solid #c2ead8; }' +
        '.sec-title { font-size: 0.95rem; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.35rem; margin: 1.5rem 0 0.85rem 0; display:flex; justify-content:space-between; align-items:center; }' +
        '.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }' +
        '.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.85rem; }' +
        '.field-card { background: #f8faf9; border: 1px solid #e2e8f0; padding: 0.75rem 1rem; border-radius: 6px; }' +
        '.field-lbl { font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 0.15rem; }' +
        '.field-val { font-size: 0.9rem; font-weight: 600; color: #0f172a; }' +
        '.table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 0.82rem; }' +
        '.table th { background: #f1f5f9; padding: 0.6rem 0.75rem; text-align: left; font-weight: 700; color: #475569; border: 1px solid #e2e8f0; }' +
        '.table td { padding: 0.55rem 0.75rem; border: 1px solid #e2e8f0; color: #1e293b; }' +
        '.pass { color: #16a34a; font-weight: 700; }' +
        '.warn { color: #d97706; font-weight: 700; }' +
        '.notice-box { background: #eff6ff; border: 1px solid #bfdbfe; padding: 0.85rem 1rem; border-radius: 6px; font-size: 0.8rem; color: #1e40af; margin-top: 1rem; }' +
        '.disclaimer-box { background: #fff7ed; border: 1px solid #fed7aa; padding: 0.85rem 1rem; border-radius: 6px; font-size: 0.8rem; color: #9a3412; margin-top: 1.5rem; }' +
        '.footer { border-top: 1px solid #e2e8f0; padding-top: 1.25rem; margin-top: 2rem; font-size: 0.76rem; color: #94a3b8; text-align: center; line-height: 1.5; }' +
        '</style></head><body>' +
        '<div class="report-container">' +
            '<div class="header">' +
                '<div>' +
                    '<div class="gov-title">Government of Telangana • Transport Department</div>' +
                    '<h1 class="main-title">DRIVESETU RTO DRIVING TEST AI EVALUATION REPORT</h1>' +
                    '<div style="font-size:0.8rem; color:#64748b;">Automated Track Telemetry & Computer Vision Analysis Record</div>' +
                '</div>' +
                '<span class="badge-verified">🔒 AI DECISION SUPPORT</span>' +
            '</div>' +

            '<!-- Section 1: Application Details -->' +
            '<div class="sec-title">1. Application Information</div>' +
            '<div class="grid-3">' +
                '<div class="field-card"><div class="field-lbl">Application ID</div><div class="field-val">' + appId + '</div></div>' +
                '<div class="field-card"><div class="field-lbl">Applicant Name</div><div class="field-val">' + applicantName + '</div></div>' +
                '<div class="field-card"><div class="field-lbl">Licence Category</div><div class="field-val">' + licenceType + ' (MCWG, LMV)</div></div>' +
                '<div class="field-card"><div class="field-lbl">Test Centre</div><div class="field-val">' + testCentre + '</div></div>' +
                '<div class="field-card"><div class="field-lbl">RTO Code</div><div class="field-val">' + rtoCode + '</div></div>' +
                '<div class="field-card"><div class="field-lbl">Test Date</div><div class="field-val">' + testDate + '</div></div>' +
            '</div>' +

            '<!-- Section 2: Identity & Session Verification -->' +
            '<div class="sec-title">2. Identity & Session Verification</div>' +
            '<div class="grid-2">' +
                '<div class="field-card"><div class="field-lbl">Biometric Identity Status</div><div class="field-val pass">VERIFIED (Face & Fingerprint Matched)</div></div>' +
                '<div class="field-card"><div class="field-lbl">Safety Helmet Compliance</div><div class="field-val pass">COMPLIANT (Helmet Detected)</div></div>' +
                '<div class="field-card"><div class="field-lbl">Test Session ID</div><div class="field-val">SESS-2026-' + appId + '</div></div>' +
                '<div class="field-card"><div class="field-lbl">Evidence ID</div><div class="field-val">EV-206500</div></div>' +
            '</div>' +
            '<div class="notice-box"><strong>Notice:</strong> Prototype Simulation — Biometric identity verification is simulated for demonstration purposes.</div>' +

            '<!-- Section 3: Test Evidence Integrity -->' +
            '<div class="sec-title">3. Test Evidence & Integrity</div>' +
            '<div class="grid-2">' +
                '<div class="field-card"><div class="field-lbl">Video Evidence Filename</div><div class="field-val">' + videoFile + '</div></div>' +
                '<div class="field-card"><div class="field-lbl">Camera Source & Duration</div><div class="field-val">CAM-01 Track Overhead HD Feed (03m:45s)</div></div>' +
                '<div class="field-card" style="grid-column: span 2;"><div class="field-lbl">Cryptographic Integrity Hash</div><div class="field-val" style="font-family:monospace; font-size:0.78rem;">sha256:' + hashVal + ' (VERIFIED)</div></div>' +
            '</div>' +

            '<!-- Section 4: Telemetry Analysis -->' +
            '<div class="sec-title">4. Measurable Driving Telemetry Metrics</div>' +
            '<table class="table">' +
                '<thead><tr><th>Metric Parameter</th><th>Observed Value</th><th>Allowed Threshold / Range</th><th>Result</th><th>Severity</th></tr></thead>' +
                '<tbody>' +
                    '<tr><td><strong>Vehicle Speed</strong></td><td>18 km/h</td><td>10 – 20 km/h</td><td class="pass">PASS</td><td>NORMAL</td></tr>' +
                    '<tr><td><strong>Acceleration Rate</strong></td><td>+0.7 m/s²</td><td>-1.5 to +1.5 m/s²</td><td class="pass">PASS</td><td>NORMAL</td></tr>' +
                    '<tr><td><strong>Braking Intensity</strong></td><td>-0.6 m/s²</td><td>-2.5 to 0 m/s²</td><td class="pass">PASS</td><td>NORMAL</td></tr>' +
                    '<tr><td><strong>Steering Smoothness</strong></td><td>0.88 (Optimal)</td><td>&gt; 0.70</td><td class="pass">PASS</td><td>NORMAL</td></tr>' +
                    '<tr><td><strong>Turning Behavior</strong></td><td>16°/sec Apex</td><td>&lt; 25°/sec</td><td class="pass">PASS</td><td>NORMAL</td></tr>' +
                    '<tr><td><strong>Lane / Track Deviation</strong></td><td>0.08 m</td><td>&lt; 0.30 m</td><td class="pass">PASS</td><td>NORMAL</td></tr>' +
                    '<tr><td><strong>Stop-Line Compliance</strong></td><td>0 Rollback / 0.12m Stop</td><td>&lt; 0.30 m</td><td class="pass">PASS</td><td>NORMAL</td></tr>' +
                    '<tr><td><strong>Start / Stop Behavior</strong></td><td>Smooth Launch</td><td>No Engine Stall</td><td class="pass">PASS</td><td>NORMAL</td></tr>' +
                    '<tr><td><strong>Parallel Parking Alignment</strong></td><td>96% Centered</td><td>&gt; 85%</td><td class="pass">PASS</td><td>NORMAL</td></tr>' +
                    '<tr><td><strong>8-Track Loop Execution</strong></td><td>Zero Line Touch</td><td>No Boundary Touch</td><td class="pass">PASS</td><td>NORMAL</td></tr>' +
                    '<tr><td><strong>Gradient Hill Stop &amp; Start</strong></td><td>0.0 m Rollback</td><td>&lt; 0.15 m</td><td class="pass">PASS</td><td>NORMAL</td></tr>' +
                    '<tr><td><strong>Helmet Detection</strong></td><td>Compliant</td><td>Mandatory</td><td class="pass">PASS</td><td>NORMAL</td></tr>' +
                    '<tr><td><strong>Sudden Movement Detection</strong></td><td>1 Precautionary Deceleration</td><td>&lt; 2 Events</td><td class="warn">WARNING</td><td>LOW</td></tr>' +
                '</tbody>' +
            '</table>' +

            '<!-- Section 5: Abnormal Movement Detection -->' +
            '<div class="sec-title">5. Abnormal Movement & Anomaly Log</div>' +
            '<table class="table">' +
                '<thead><tr><th>Timestamp</th><th>Detected Event</th><th>Observed Telemetry</th><th>Severity</th><th>AI Interpretation</th></tr></thead>' +
                '<tbody>' +
                    '<tr><td><strong>00:02:28</strong></td><td>Precautionary Deceleration</td><td>Deceleration -2.8 m/s²</td><td class="warn">LOW</td><td>Precautionary speed adjustment prior to S-Bend turn entry.</td></tr>' +
                '</tbody>' +
            '</table>' +

            '<!-- Section 6: AI Decision Support -->' +
            '<div class="sec-title">6. AI Decision Support Summary</div>' +
            '<div class="grid-2">' +
                '<div class="field-card"><div class="field-lbl">Overall Telemetry Score</div><div class="field-val pass" style="font-size:1.15rem;">95 / 100 (PASSED RECOMMENDATION)</div></div>' +
                '<div class="field-card"><div class="field-lbl">AI Recommendation</div><div class="field-val pass" style="font-size:1.15rem;">RECOMMEND PASS</div></div>' +
                '<div class="field-card"><div class="field-lbl">AI Confidence Level</div><div class="field-val">98.4% Confidence Score</div></div>' +
                '<div class="field-card"><div class="field-lbl">Evidence Completeness</div><div class="field-val">100% (MP4 Video + Telemetry Stream)</div></div>' +
            '</div>' +
            '<div style="margin-top:0.75rem; font-size:0.8rem; line-height:1.6; background:#f8faf9; padding:0.75rem; border-radius:6px; border:1px solid #e2e8f0;">' +
                '<strong>Major Strengths:</strong> Clean 8-track curve navigation, zero gradient rollback, precise parallel parking alignment.<br>' +
                '<strong>Detected Minor Issue:</strong> Minor abrupt deceleration recorded at 00:02:28 prior to S-Bend entry.' +
            '</div>' +

            '<div class="disclaimer-box">' +
                '<strong>IMPORTANT LEGAL & GOVERNANCE DISCLAIMER:</strong><br>' +
                'AI Evaluation Recommendation — Final licensing decision requires the configured independent government evaluation workflow.' +
            '</div>' +

            '<!-- Section 7: Independent Evaluation Safeguard -->' +
            '<div class="sec-title">7. Independent Evaluation Governance</div>' +
            '<div class="grid-2">' +
                '<div class="field-card"><div class="field-lbl">Physical Test Centre RTO</div><div class="field-val">' + testCentre + '</div></div>' +
                '<div class="field-card"><div class="field-lbl">Assigned Cross-RTO Review Pool</div><div class="field-val">Independent RTO Pool (TG-08 & TG-12)</div></div>' +
            '</div>' +

            '<!-- Section 8: Audit Reference -->' +
            '<div class="sec-title">8. Audit & Integrity Reference</div>' +
            '<div style="font-size:0.78rem; color:#475569;">' +
                'Audit Entry ID: <strong>AE-2026-0813-9842</strong> &bull; Generated: <strong>' + new Date().toLocaleString('en-IN') + '</strong> &bull; Hashed Chain of Custody Verified.' +
            '</div>' +

            '<div class="footer">' +
                'DriveSetu RTO Driving Test Telemetry System • AI-generated evaluation for decision support.<br>' +
                '<strong>Prototype data must not be represented as an actual government-issued record.</strong>' +
            '</div>' +
        '</div>' +
        '</body></html>';
}

function viewLearnerLicenceDoc(appId) {
    var apps = getStoredApplications();
    var app = null;
    if (appId) {
        for (var i = 0; i < apps.length; i++) {
            if (apps[i].id === appId) { app = apps[i]; break; }
        }
    }
    if (!app) {
        var citizenSession = {};
        try { citizenSession = JSON.parse(sessionStorage.getItem('citizenSession') || '{}'); } catch(e) {}
        for (var k = 0; k < apps.length; k++) {
            if (apps[k].type === "Learner's Licence" && ((citizenSession.email && apps[k].citizenId === citizenSession.email) || (citizenSession.name && apps[k].name === citizenSession.name))) {
                app = apps[k];
                break;
            }
        }
    }
    if (!app) {
        app = {
            id: appId || 'LL-SUFYAN-001',
            name: 'Sufyan',
            type: "Learner's Licence",
            status: 'Approved',
            date: '14 Jul 2026',
            citizenId: 'sufyan@gmail.com',
            vehicleClasses: ['MCWG', 'LMV'],
            serviceDetails: {
                rtoCode: 'TG-03',
                rtoOfficeName: 'RTA Medchal / Hyderabad West',
                llNumber: 'LL-SUFYAN-001',
                issueDate: '14 Jul 2026',
                validity: '14 Jul 2026 to 14 Jan 2027'
            }
        };
    }

    try {
        if (window.jspdf && window.jspdf.jsPDF) {
            downloadLearnerLicencePDF(app.id);
            return;
        }
    } catch(e) {
        console.warn("PDF generation error, opening printable window:", e);
    }

    var html = generateLearnerLicenceHTML(app);
    var win = window.open('', '_blank');
    if (win) {
        win.document.write(html);
        win.document.close();
    } else {
        alert('Please allow popups to view and print your Learner\'s Licence.');
    }
}

function downloadLearnerLicencePDF(appId) {
    var apps = getStoredApplications();
    var app = null;
    if (appId) {
        for (var i = 0; i < apps.length; i++) {
            if (apps[i].id === appId) { app = apps[i]; break; }
        }
    }
    if (!app) {
        app = {
            id: appId || 'LL-SUFYAN-001',
            name: 'Sufyan',
            type: "Learner's Licence",
            status: 'Approved',
            date: '14 Jul 2026',
            serviceDetails: {
                rtoCode: 'TG-03',
                rtoOfficeName: 'RTA Medchal / Hyderabad West',
                llNumber: 'LL-SUFYAN-001',
                issueDate: '14 Jul 2026',
                validity: '14 Jul 2026 to 14 Jan 2027'
            }
        };
    }

    const { jsPDF } = window.jspdf;
    var doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    var sd = app.serviceDetails || {};
    var llNum = sd.llNumber || app.id || 'LL-SUFYAN-001';
    var nameStr = (app.name || 'Sufyan').toUpperCase();
    var issueDate = sd.issueDate || app.date || '14 Jul 2026';
    var validityDate = sd.validity || (issueDate + ' to 14 Jan 2027');
    var rtoName = sd.rtoOfficeName || 'RTA Medchal / Hyderabad West (TG-03)';
    var vehicleClass = (sd.vehicleClasses ? sd.vehicleClasses.join(', ') : (app.vehicleClasses ? app.vehicleClasses.join(', ') : 'MCWG, LMV'));

    doc.setFillColor(20, 143, 96);
    doc.rect(0, 0, 210, 28, 'F');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('TRANSPORT DEPARTMENT - GOVERNMENT OF TELANGANA', 105, 12, { align: 'center' });

    doc.setFontSize(11);
    doc.text('FORM 3 - LEARNER\'S LICENCE CERTIFICATE', 105, 20, { align: 'center' });

    doc.setDrawColor(20, 143, 96);
    doc.setLineWidth(0.8);
    doc.rect(15, 36, 180, 185);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(17, 17, 17);
    doc.text('LEARNER\'S LICENCE NO: ' + llNum, 105, 48, { align: 'center' });

    doc.setDrawColor(220);
    doc.line(25, 53, 185, 53);

    doc.setFontSize(10);
    var startY = 62;
    var lineH = 10;

    var rows = [
        ['Licence Number:', llNum],
        ['Full Name of Holder:', nameStr],
        ['Application Number:', app.id],
        ['Issuing Authority:', rtoName],
        ['Date of Issue:', issueDate],
        ['Valid Throughout India Until:', validityDate],
        ['Authorised Vehicle Categories:', vehicleClass],
        ['Licence Status:', 'APPROVED / VALID']
    ];

    for (var r = 0; r < rows.length; r++) {
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(100);
        doc.text(rows[r][0], 25, startY + (r * lineH));

        if (rows[r][0] === 'Licence Status:') {
            doc.setTextColor(20, 143, 96);
        } else {
            doc.setTextColor(20);
        }
        doc.text(rows[r][1], 95, startY + (r * lineH));
    }

    doc.setDrawColor(220);
    doc.line(25, 148, 185, 148);

    doc.setFillColor(232, 247, 241);
    doc.rect(25, 155, 160, 35, 'F');
    doc.setDrawColor(194, 234, 216);
    doc.rect(25, 155, 160, 35, 'S');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(20, 143, 96);
    doc.text('MANDATORY DRIVING RULES & CONDITIONS:', 30, 163);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60);
    doc.text('1. The holder must display an "L" plate (red on white) on the front and rear of the vehicle.', 30, 170);
    doc.text('2. The holder must be accompanied by an instructor holding a valid permanent driving licence.', 30, 176);
    doc.text('3. Eligible to apply for a Permanent Driving Licence after completing 30 days from date of issue.', 30, 182);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Digitally Signed & Verified By:', 25, 205);
    doc.text('Licensing Authority — RTA Telangana', 25, 210);

    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(20, 143, 96);
    doc.text('✔ VERIFIED DIGITAL RECORD', 185, 210, { align: 'right' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('DriveSetu Digital RTO System — Government of Telangana Transport Department', 105, 230, { align: 'center' });

    doc.save('Learners_Licence_' + (llNum || 'TG') + '.pdf');
}

function generateLearnerLicenceHTML(app) {
    var sd = app.serviceDetails || {};
    var llNum = sd.llNumber || app.id || 'LL-SUFYAN-001';
    var nameStr = (app.name || 'Sufyan').toUpperCase();
    var issueDate = sd.issueDate || app.date || '14 Jul 2026';
    var validityDate = sd.validity || (issueDate + ' to 14 Jan 2027');
    var rtoName = sd.rtoOfficeName || 'RTA Medchal / Hyderabad West (TG-03)';
    var vehicleClass = (sd.vehicleClasses ? sd.vehicleClasses.join(', ') : (app.vehicleClasses ? app.vehicleClasses.join(', ') : 'MCWG, LMV'));

    return '<!DOCTYPE html><html><head><title>Learners Licence - ' + llNum + '</title>' +
        '<style>' +
            'body { font-family: "Segoe UI", Arial, sans-serif; background:#f4f6f8; margin:0; padding:20px; color:#1e293b; }' +
            '.cert-card { max-width:700px; margin:0 auto; background:#fff; border-radius:12px; border:2px solid #10b981; box-shadow:0 10px 25px rgba(0,0,0,0.1); overflow:hidden; }' +
            '.cert-header { background:linear-gradient(135deg, #10b981, #059669); color:#fff; padding:20px; text-align:center; }' +
            '.cert-header h1 { margin:0; font-size:1.2rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; }' +
            '.cert-header p { margin:5px 0 0 0; font-size:0.85rem; opacity:0.9; }' +
            '.cert-body { padding:25px; }' +
            '.ll-badge { display:inline-block; background:#e8f7f1; color:#059669; padding:6px 14px; border-radius:20px; font-weight:700; font-size:0.85rem; margin-bottom:15px; }' +
            '.grid-table { width:100%; border-collapse:collapse; margin-bottom:20px; }' +
            '.grid-table td { padding:10px 12px; font-size:0.9rem; border-bottom:1px solid #e2e8f0; }' +
            '.grid-table td.label { color:#64748b; font-weight:600; width:40%; }' +
            '.grid-table td.value { font-weight:700; color:#0f172a; }' +
            '.rules-box { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:15px; font-size:0.82rem; color:#166534; line-height:1.6; margin-bottom:20px; }' +
            '.cert-footer { display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:15px; font-size:0.8rem; color:#64748b; }' +
            '@media print { body { background:#fff; padding:0; } .cert-card { box-shadow:none; border:1px solid #000; } button { display:none; } }' +
        '</style></head><body>' +
        '<div style="max-width:700px; margin:0 auto 15px auto; text-align:right;">' +
            '<button onclick="window.print()" style="background:#10b981; color:#fff; border:none; padding:8px 18px; border-radius:6px; font-weight:700; cursor:pointer;">🖨️ Print / Save PDF</button>' +
        '</div>' +
        '<div class="cert-card">' +
            '<div class="cert-header">' +
                '<h1>Transport Department — Government of Telangana</h1>' +
                '<p>FORM 3 — LEARNER\'S LICENCE CERTIFICATE</p>' +
            '</div>' +
            '<div class="cert-body">' +
                '<div style="text-align:center;">' +
                    '<span class="ll-badge">✔ OFFICIAL LEARNER\'S LICENCE ISSUED</span>' +
                    '<h2 style="margin:0 0 15px 0; font-size:1.3rem; color:#0f172a;">LICENCE NO: ' + llNum + '</h2>' +
                '</div>' +
                '<table class="grid-table">' +
                    '<tr><td class="label">Full Name of Holder:</td><td class="value">' + nameStr + '</td></tr>' +
                    '<tr><td class="label">Application Number:</td><td class="value">' + app.id + '</td></tr>' +
                    '<tr><td class="label">Issuing RTO Authority:</td><td class="value">' + rtoName + '</td></tr>' +
                    '<tr><td class="label">Date of Issue:</td><td class="value">' + issueDate + '</td></tr>' +
                    '<tr><td class="label">Validity Period:</td><td class="value">' + validityDate + '</td></tr>' +
                    '<tr><td class="label">Allowed Vehicle Categories:</td><td class="value">' + vehicleClass + '</td></tr>' +
                    '<tr><td class="label">Status:</td><td class="value" style="color:#10b981;">● APPROVED & VALID</td></tr>' +
                '</table>' +
                '<div class="rules-box">' +
                    '<strong>Mandatory Learner Driving Rules:</strong><br>' +
                    '1. Display prominent red "L" plates on front and rear of vehicle.<br>' +
                    '2. Must be accompanied by a driver holding a valid permanent driving licence.<br>' +
                    '3. Eligible to apply for Permanent Driving Licence test after 30 days from issue.' +
                '</div>' +
                '<div class="cert-footer">' +
                    '<div>Digitally Signed & Certified by Licensing Authority</div>' +
                    '<div style="font-weight:700; color:#10b981;">DriveSetu Digital RTO</div>' +
                '</div>' +
            '</div>' +
        '</div></body></html>';
}

function viewPdfDocument(appId) {
    var targetId = appId || 'APP-206500';
    var docHTML = generateDetailedAiReportHTML(targetId);
    var win = window.open('', '_blank');
    if (win) {
        win.document.write(docHTML);
        win.document.close();
    } else {
        alert('Please allow popups to view the PDF report window.');
    }
}

// ─── CITIZEN ONLINE APPLICATIONS STATE & HELPERS ───
window.currentApplicationType = '';
window.currentApplicationDocs = {};
window.currentTestEvidence = {
    video: { fileName: '', fileSize: '', fileType: '', timestamp: '', dataUrl: '', status: 'Awaiting Upload' },
    aiReport: { fileName: '', fileSize: '', fileType: '', timestamp: '', dataUrl: '', status: 'Awaiting Upload' }
};

function initDocsForService(licenceType) {
    window.currentApplicationDocs = {};
    var configs = getDocumentConfigs(licenceType);
    for (var i = 0; i < configs.length; i++) {
        var doc = configs[i];
        window.currentApplicationDocs[doc.id] = {
            id: doc.id,
            name: doc.name,
            type: doc.type,
            fileName: '',
            fileSize: '',
            fileType: '',
            status: 'Awaiting Upload',
            dataUrl: ''
        };
    }
}

function initTestEvidence() {
    window.currentTestEvidence = {
        video: { fileName: '', fileSize: '', fileType: '', timestamp: '', dataUrl: '', status: 'Awaiting Upload' },
        aiReport: { fileName: '', fileSize: '', fileType: '', timestamp: '', dataUrl: '', status: 'Awaiting Upload' }
    };
}

function setupServiceDocsAndEvidence(licenceType) {
    if (window.currentApplicationType !== licenceType) {
        window.currentApplicationType = licenceType;
        initDocsForService(licenceType);
        initTestEvidence();
    }
}

function getDocumentConfigs(licenceType) {
    if (licenceType === "Learner's Licence") {
        return [
            { id: 'aadhaar', name: 'Aadhaar Document', type: 'required' },
            { id: 'photo', name: 'Recent Photograph', type: 'required' },
            { id: 'form_1a', name: 'Form 1A Medical Certificate', type: 'conditional' },
            { id: 'parent_declaration', name: 'Parent/Guardian Declaration', type: 'conditional' }
        ];
    } else if (licenceType === "Permanent Licence") {
        return [
            { id: 'learner_licence', name: 'Learner Licence', type: 'required' },
            { id: 'photo', name: 'Recent Photograph', type: 'required' },
            { id: 'form_1a', name: 'Form 1A Medical Certificate', type: 'conditional' },
            { id: 'form_5', name: 'Form 5 (Transport Category)', type: 'conditional' }
        ];
    } else if (licenceType === "Addition of Class") {
        return [
            { id: 'existing_dl', name: 'Existing Driving Licence', type: 'required' },
            { id: 'learner_licence_new', name: 'Learner Licence (New Category)', type: 'required' },
            { id: 'form_8', name: 'Form 8 Application', type: 'required' },
            { id: 'form_1', name: 'Form 1 Physical Fitness', type: 'required' },
            { id: 'form_1a', name: 'Form 1A Medical Certificate', type: 'conditional' },
            { id: 'form_5', name: 'Form 5 (Transport Category)', type: 'conditional' }
        ];
    } else if (licenceType === "International Driving Permit") {
        return [
            { id: 'indian_dl', name: 'Valid Indian Driving Licence', type: 'required' },
            { id: 'passport', name: 'Passport', type: 'required' },
            { id: 'nationality_proof', name: 'Proof of Indian Nationality', type: 'required' },
            { id: 'photo', name: 'Recent Passport-size Photograph', type: 'required' },
            { id: 'visa', name: 'Visa (where applicable)', type: 'conditional' },
            { id: 'travel_doc', name: 'Travel Document / Air Ticket', type: 'conditional' }
        ];
    } else if (licenceType === "Renewal") {
        return [
            { id: 'existing_dl', name: 'Existing Driving Licence', type: 'required' },
            { id: 'form_9', name: 'Form 9 Renewal Application', type: 'required' },
            { id: 'form_1', name: 'Form 1 Physical Fitness', type: 'required' },
            { id: 'form_1a', name: 'Form 1A Medical Certificate', type: 'conditional' },
            { id: 'photo', name: 'Recent Photograph', type: 'required' }
        ];
    } else if (licenceType === "Duplicate") {
        return [
            { id: 'defaced_dl', name: 'Upload Defaced/Torn Original DL', type: 'conditional' },
            { id: 'photo_replacement', name: 'New Photograph for Replacement', type: 'conditional' },
            { id: 'old_dl_copy', name: 'Copy of Old DL (if available)', type: 'optional' }
        ];
    }
    return [];
}

function renderDocumentChecklistTable(licenceType) {
    var configs = getDocumentConfigs(licenceType);
    
    var filteredConfigs = [];
    var category = document.getElementById('applicantCategory') ? document.getElementById('applicantCategory').value : 'Adult';
    var duplicateReason = document.getElementById('duplicateReason') ? document.getElementById('duplicateReason').value : 'Lost';
    
    for (var i = 0; i < configs.length; i++) {
        var doc = configs[i];
        var show = true;
        
        if (licenceType === "Learner's Licence") {
            if (doc.id === 'parent_declaration') {
                show = (category === 'Minor');
                doc.type = 'required';
            }
            if (doc.id === 'form_1a') {
                show = (category === 'Minor' || category === 'Transport' || category === 'Senior');
                doc.type = show ? 'required' : 'conditional';
            }
        } else if (licenceType === "Permanent Licence") {
            if (doc.id === 'form_1a') {
                show = (category === 'Senior' || category === 'Transport');
                doc.type = show ? 'required' : 'conditional';
            }
            if (doc.id === 'form_5') {
                show = (category === 'Transport');
                doc.type = show ? 'required' : 'conditional';
            }
        } else if (licenceType === "Addition of Class") {
            if (doc.id === 'form_1a') {
                show = (category === 'Senior' || category === 'Transport');
                doc.type = show ? 'required' : 'conditional';
            }
            if (doc.id === 'form_5') {
                show = (category === 'Transport');
                doc.type = show ? 'required' : 'conditional';
            }
        } else if (licenceType === "International Driving Permit") {
            if (doc.id === 'visa' || doc.id === 'travel_doc') {
                doc.type = 'conditional';
            }
        } else if (licenceType === "Renewal") {
            if (doc.id === 'form_1a') {
                show = (category === 'Senior' || category === 'Transport');
                doc.type = show ? 'required' : 'conditional';
            }
        } else if (licenceType === "Duplicate") {
            if (doc.id === 'defaced_dl') {
                show = (duplicateReason === 'Defaced');
                doc.type = 'required';
            } else if (doc.id === 'photo_replacement') {
                show = (duplicateReason === 'Photo');
                doc.type = 'required';
            } else if (doc.id === 'old_dl_copy') {
                show = (duplicateReason === 'Lost');
                doc.type = 'optional';
            }
        }
        
        if (show) {
            filteredConfigs.push(doc);
        }
    }
    
    var rows = '';
    for (var j = 0; j < filteredConfigs.length; j++) {
        var docConfig = filteredConfigs[j];
        var docState = window.currentApplicationDocs[docConfig.id] || {
            fileName: '', fileSize: '', fileType: '', status: 'Awaiting Upload', dataUrl: ''
        };
        
        var badgeClass = 'badge-optional';
        var badgeText = 'Optional';
        if (docConfig.type === 'required') {
            badgeClass = 'badge-required';
            badgeText = 'Required';
        } else if (docConfig.type === 'conditional') {
            badgeClass = 'badge-conditional';
            badgeText = 'Conditional';
        }
        
        var statusBadgeClass = 'badge-pending';
        if (docState.fileName) {
            statusBadgeClass = 'badge-uploaded';
        }
        
        var actionsHTML = '';
        if (docState.fileName) {
            actionsHTML = '<button type="button" class="btn btn-ghost" style="padding:0.25rem 0.5rem; font-size:0.75rem; color:#ef4444; border-color:#fee2e2;" onclick="removeUploadedDoc(\'' + docConfig.id + '\', window.currentApplicationType)"><i class="fa-solid fa-trash"></i> Remove</button>';
        } else {
            actionsHTML = '<div class="file-upload-wrapper">' +
                '<button type="button" class="btn btn-ghost" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-upload"></i> Upload</button>' +
                '<input type="file" class="file-upload-input" onchange="handleDocFileChange(\'' + docConfig.id + '\', event, window.currentApplicationType)">' +
                '</div>';
        }
        
        rows += '<tr>' +
            '<td><strong>' + docConfig.name + '</strong></td>' +
            '<td><span class="badge ' + badgeClass + '">' + badgeText + '</span></td>' +
            '<td>' + (docState.fileName ? '<i class="fa-solid fa-file-circle-check" style="color:var(--primary);"></i> ' + docState.fileName : '<span style="color:var(--text-muted);">No file uploaded</span>') + '</td>' +
            '<td>' + (docState.fileSize || '-') + '</td>' +
            '<td>' + (docState.fileType || '-') + '</td>' +
            '<td><span class="badge ' + statusBadgeClass + '">' + docState.status + '</span></td>' +
            '<td>' + actionsHTML + '</td>' +
            '</tr>';
    }
    
    var tableHTML = '<table class="data-table">' +
        '<thead><tr><th>Document Name</th><th>Requirement</th><th>File Name</th><th>Size</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '</table>';
        
    var container = document.getElementById('documentChecklistContainer');
    if (container) {
        container.innerHTML = tableHTML;
    }
}

async function handleDocFileChange(docId, event, licenceType) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    
    try {
        var uploadedRecord = await DriveSetuSupabase.uploadUserFile(file, 'document_' + docId);
        var publicUrl = (uploadedRecord && uploadedRecord.file_url) ? uploadedRecord.file_url : URL.createObjectURL(file);

        window.currentApplicationDocs[docId] = {
            id: docId,
            name: window.currentApplicationDocs[docId] ? window.currentApplicationDocs[docId].name : docId,
            type: window.currentApplicationDocs[docId] ? window.currentApplicationDocs[docId].type : 'required',
            fileName: file.name,
            fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            fileType: file.type.split('/')[1] ? file.type.split('/')[1].toUpperCase() : 'UNKNOWN',
            status: 'Uploaded to Supabase',
            dataUrl: publicUrl
        };
        renderDocumentChecklistTable(licenceType);
    } catch(err) {
        console.warn("File upload fallback:", err);
        var reader = new FileReader();
        reader.onload = function(e) {
            window.currentApplicationDocs[docId] = {
                id: docId,
                name: window.currentApplicationDocs[docId] ? window.currentApplicationDocs[docId].name : docId,
                type: window.currentApplicationDocs[docId] ? window.currentApplicationDocs[docId].type : 'required',
                fileName: file.name,
                fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                fileType: file.type.split('/')[1] ? file.type.split('/')[1].toUpperCase() : 'UNKNOWN',
                status: 'Uploaded',
                dataUrl: e.target.result
            };
            renderDocumentChecklistTable(licenceType);
        };
        reader.readAsDataURL(file);
    }
}

function removeUploadedDoc(docId, licenceType) {
    if (window.currentApplicationDocs[docId]) {
        window.currentApplicationDocs[docId].fileName = '';
        window.currentApplicationDocs[docId].fileSize = '';
        window.currentApplicationDocs[docId].fileType = '';
        window.currentApplicationDocs[docId].status = 'Awaiting Upload';
        window.currentApplicationDocs[docId].dataUrl = '';
    }
    renderDocumentChecklistTable(licenceType);
}

function renderTestEvidenceSection(licenceType) {
    var video = window.currentTestEvidence.video;
    var aiReport = window.currentTestEvidence.aiReport;
    
    var videoHTML = '';
    if (video.fileName) {
        videoHTML = '<div class="preview-video-container" style="margin-top:1rem;">' +
            '<div class="video-overlay-header">' +
                '<span class="cam-label"><i class="fa-solid fa-camera"></i> TEST VIDEO PLAYER</span>' +
                '<span class="telemetry-speed">READY</span>' +
            '</div>' +
            '<div style="background:#0f1715; min-height:190px; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">' +
                '<video src="' + video.dataUrl + '" controls style="width:100%; max-height:220px; object-fit:contain; background:#000;"></video>' +
            '</div>' +
            '<div style="padding:0.75rem; background:#f8faf9; border-top:1px solid var(--border); font-size:0.78rem; display:flex; justify-content:space-between; align-items:center;">' +
                '<span><i class="fa-solid fa-file-circle-check" style="color:var(--primary);"></i> Loaded: <code>' + video.fileName + '</code> (' + video.fileSize + ')</span>' +
                '<button type="button" class="btn btn-ghost" style="padding:0.2rem 0.5rem; font-size:0.74rem; color:#ef4444; border-color:#fee2e2;" onclick="removeTestEvidence(\'video\', window.currentApplicationType)"><i class="fa-solid fa-trash"></i> Remove</button>' +
            '</div>' +
        '</div>';
    } else {
        videoHTML = '<div class="qr-dropzone" onclick="document.getElementById(\'evidenceVideoInput\').click()">' +
            '<div class="qr-icon-box" style="background:#e6f4ff; color:#096dd9;"><i class="fa-solid fa-video"></i></div>' +
            '<h4>Select Driving Test Video</h4>' +
            '<p style="font-size:0.82rem; color:var(--text-muted); margin:0.3rem 0 0.8rem 0;">Supports .MP4, .MOV, .WEBM files (max 100MB)</p>' +
            '<button class="btn btn-primary" type="button" onclick="event.stopPropagation(); document.getElementById(\'evidenceVideoInput\').click();"><i class="fa-solid fa-upload"></i> Browse Video</button>' +
            '<input type="file" id="evidenceVideoInput" accept="video/mp4,video/quicktime,video/webm" style="display:none;" onchange="handleTestEvidenceFileChange(\'video\', event, window.currentApplicationType)">' +
        '</div>';
    }
    
    var pdfHTML = '';
    if (aiReport.fileName) {
        pdfHTML = '<div class="pdf-summary-card" style="margin-top:1rem; padding:1rem; background:#f4fbf8; border:1px solid #c2ead8; border-radius:var(--radius-md);">' +
            '<div class="flex-between" style="margin-bottom:0.6rem;">' +
                '<div>' +
                    '<h4 style="font-size:0.95rem; font-weight:700; color:var(--text-main);"><i class="fa-solid fa-file-pdf" style="color:#d46b08; margin-right:0.4rem;"></i> ' + aiReport.fileName + '</h4>' +
                    '<p style="font-size:0.78rem; color:var(--text-muted);">Size: ' + aiReport.fileSize + '</p>' +
                '</div>' +
                '<span class="badge badge-approved">PDF Loaded</span>' +
            '</div>' +
            '<div style="margin-top:0.5rem; border-top:1px dashed #c2ead8; padding-top:0.5rem;">' +
                '<iframe src="' + aiReport.dataUrl + '" style="width:100%; height:200px; border:1px solid #bce3d4; border-radius:6px; background:#fff;"></iframe>' +
                '<div style="margin-top:0.5rem; text-align:right;">' +
                    '<button type="button" class="btn btn-ghost" style="padding:0.2rem 0.5rem; font-size:0.74rem; color:#ef4444; border-color:#fee2e2;" onclick="removeTestEvidence(\'aiReport\', window.currentApplicationType)"><i class="fa-solid fa-trash"></i> Remove</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    } else {
        pdfHTML = '<div class="qr-dropzone" onclick="document.getElementById(\'evidencePdfInput\').click()">' +
            '<div class="qr-icon-box" style="background:#fff7e6; color:#d46b08;"><i class="fa-solid fa-file-pdf"></i></div>' +
            '<h4>Select AI Analysis Report PDF</h4>' +
            '<p style="font-size:0.82rem; color:var(--text-muted); margin:0.3rem 0 0.8rem 0;">Upload the official evaluation PDF report</p>' +
            '<button class="btn btn-primary" type="button" onclick="event.stopPropagation(); document.getElementById(\'evidencePdfInput\').click();"><i class="fa-solid fa-upload"></i> Browse PDF</button>' +
            '<input type="file" id="evidencePdfInput" accept=".pdf" style="display:none;" onchange="handleTestEvidenceFileChange(\'aiReport\', event, window.currentApplicationType)">' +
        '</div>';
    }
    
    var container = document.getElementById('testEvidenceContainer');
    if (container) {
        container.innerHTML = '<div class="grid-2" style="grid-template-columns: 1fr 1fr; gap:1.25rem;">' +
            '<div>' + videoHTML + '</div>' +
            '<div>' + pdfHTML + '</div>' +
            '</div>';
    }
}

async function handleTestEvidenceFileChange(type, event, licenceType) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    
    try {
        var uploadedRecord = await DriveSetuSupabase.uploadUserFile(file, type === 'video' ? 'driving_test_video' : 'ai_report_pdf');
        var publicUrl = (uploadedRecord && uploadedRecord.file_url) ? uploadedRecord.file_url : URL.createObjectURL(file);

        window.currentTestEvidence[type] = {
            fileName: file.name,
            fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            fileType: file.type.split('/')[1] ? file.type.split('/')[1].toUpperCase() : 'UNKNOWN',
            timestamp: new Date().toISOString(),
            dataUrl: publicUrl,
            status: 'Secured in Supabase'
        };
        renderTestEvidenceSection(licenceType);
    } catch(err) {
        console.warn("Evidence upload fallback:", err);
        var reader = new FileReader();
        reader.onload = function(e) {
            window.currentTestEvidence[type] = {
                fileName: file.name,
                fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                fileType: file.type.split('/')[1] ? file.type.split('/')[1].toUpperCase() : 'UNKNOWN',
                timestamp: new Date().toISOString(),
                dataUrl: e.target.result,
                status: 'Uploaded'
            };
            renderTestEvidenceSection(licenceType);
        };
        reader.readAsDataURL(file);
    }
}

function removeTestEvidence(type, licenceType) {
    window.currentTestEvidence[type] = {
        fileName: '', fileSize: '', fileType: '', timestamp: '', dataUrl: '', status: 'Awaiting Upload'
    };
    renderTestEvidenceSection(licenceType);
}

// ─── CITIZEN PAGES RENDERING CODE ───

function renderServiceSelectionPage(session) {
    var allApps = getStoredApplications();
    var citizenApps = allApps.filter(function(app) {
        return app.citizenId === session.email || app.citizenId === session.appId || app.name === session.name;
    });

    // Check for pending actions
    var pendingActionsCount = 0;
    for (var i = 0; i < citizenApps.length; i++) {
        var a = citizenApps[i];
        if (a.status === 'Submitted' || a.status === 'Pending') {
            pendingActionsCount++;
        }
    }

    var pendingActionHTML = '';
    if (pendingActionsCount > 0) {
        pendingActionHTML = '<div class="card animate-in" style="background:#fffbe6; border:1px solid #ffe58f; padding:1.25rem; margin-bottom:1.5rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">' +
            '<div style="display:flex; align-items:center; gap:0.85rem;">' +
                '<div style="width:40px;height:40px;border-radius:50%;background:#faad14;color:#fff;font-size:1.2rem;display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-clock"></i></div>' +
                '<div>' +
                    '<h4 style="font-size:0.95rem; font-weight:700; color:#d46b08; margin-bottom:0.15rem;">Action Required (' + pendingActionsCount + ' Active Task' + (pendingActionsCount > 1 ? 's' : '') + ')</h4>' +
                    '<p style="font-size:0.82rem; color:var(--text-muted);">You have active applications requiring attention or scheduled test appointments.</p>' +
                '</div>' +
            '</div>' +
            '<button class="btn btn-primary" style="font-size:0.82rem; padding:0.45rem 1rem;" onclick="window.location.hash=\'pending-tasks\'"><i class="fa-solid fa-list-check"></i> View Pending Tasks</button>' +
        '</div>';
    }

    // Build My Applications Rows
    var appRows = '';
    for (var k = 0; k < citizenApps.length; k++) {
        var app = citizenApps[k];
        var statusBadge = app.status === 'Approved'
            ? '<span class="badge badge-approved">✓ Approved</span>'
            : app.status === 'Rejected'
            ? '<span class="badge badge-rejected">✗ Declined</span>'
            : '<span class="badge badge-pending">⏳ Under Review</span>';
        
        var currentStage = app.serviceDetails && app.serviceDetails.appointmentStatus === 'Scheduled'
            ? 'Scheduled: ' + (app.serviceDetails.allocatedTestDate || 'Test Centre') + ' (' + (app.serviceDetails.allocatedTestStartTime || 'Slot') + ')'
            : (app.status === 'Approved' ? 'Licence Issued' : 'RTO Document Verification');

        appRows += '<tr>' +
            '<td><strong>' + app.id + '</strong></td>' +
            '<td>' + app.type + '</td>' +
            '<td>' + app.date + '</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td><span style="font-size:0.82rem; color:var(--text-secondary);"><i class="fa-solid fa-location-dot" style="color:var(--primary); margin-right:0.25rem;"></i> ' + currentStage + '</span></td>' +
            '<td><button class="btn btn-ghost" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="window.location.hash=\'citizen-track\'; setTimeout(function(){ quickTrack(\'' + app.id + '\'); }, 50);"><i class="fa-solid fa-magnifying-glass"></i> Track</button></td>' +
            '</tr>';
    }

    if (appRows === '') {
        appRows = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No application records found. Select a service below to apply.</td></tr>';
    }

    return '<div class="animate-in">' +
        '<div class="ai-header-banner" style="margin-bottom:1.5rem;">' +
            '<div class="ai-banner-badge"><i class="fa-solid fa-user"></i> Citizen Portal</div>' +
            '<h2>Welcome, ' + session.name + '</h2>' +
            '<p>Manage your driving licence services, applications, and pending actions from one place.</p>' +
        '</div>' +

        pendingActionHTML +

        '<div style="margin-bottom:1rem; font-size:0.85rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.06em;"><i class="fa-solid fa-layer-group" style="color:var(--primary); margin-right:0.3rem;"></i> Available Online Services</div>' +
        '<div class="grid-2" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:1.25rem; margin-bottom:2rem;">' +
            '<div class="feature-card" onclick="window.location.hash=\'apply-learner\'">' +
                '<div class="feature-icon"><i class="fa-solid fa-graduation-cap"></i></div>' +
                '<h3>1. Learner\'s Licence</h3>' +
                '<p>Apply for a new Learner\'s Licence to begin driving training. Slot booking & online verification included.</p>' +
            '</div>' +
            '<div class="feature-card" onclick="window.location.hash=\'apply-permanent\'">' +
                '<div class="feature-icon"><i class="fa-solid fa-id-card"></i></div>' +
                '<h3>2. Permanent Licence</h3>' +
                '<p>Apply for your full permanent driving licence after 30 days of holding a Learner\'s Licence.</p>' +
            '</div>' +
            '<div class="feature-card" onclick="window.location.hash=\'apply-addition\'">' +
                '<div class="feature-icon"><i class="fa-solid fa-circle-plus"></i></div>' +
                '<h3>3. Addition of Class</h3>' +
                '<p>Add an additional vehicle class/category (e.g. Motorcycle or LMV) to your existing licence.</p>' +
            '</div>' +
            '<div class="feature-card" onclick="window.location.hash=\'apply-idp\'">' +
                '<div class="feature-icon"><i class="fa-solid fa-globe"></i></div>' +
                '<h3>4. International Driving Permit</h3>' +
                '<p>Apply for an International Driving Permit (IDP) to drive motor vehicles in foreign countries.</p>' +
            '</div>' +
            '<div class="feature-card" onclick="window.location.hash=\'apply-renewal\'">' +
                '<div class="feature-icon"><i class="fa-solid fa-arrows-rotate"></i></div>' +
                '<h3>5. Licence Renewal</h3>' +
                '<p>Renew your driving licence prior to or after expiration.</p>' +
            '</div>' +
            '<div class="feature-card" onclick="window.location.hash=\'apply-duplicate\'">' +
                '<div class="feature-icon"><i class="fa-solid fa-copy"></i></div>' +
                '<h3>6. Duplicate</h3>' +
                '<p>Apply for a duplicate copy of your licence in case of loss, theft, or damage.</p>' +
            '</div>' +
        '</div>' +

        '<div class="card animate-in" style="margin-bottom:1.5rem;">' +
            '<div class="card-title flex-between">' +
                '<span><i class="fa-solid fa-folder-open" style="color:var(--primary); margin-right:0.4rem;"></i> My Applications</span>' +
                '<button class="btn btn-ghost" style="font-size:0.78rem; padding:0.3rem 0.75rem;" onclick="window.location.hash=\'citizen-track\'"><i class="fa-solid fa-magnifying-glass"></i> Detailed Track</button>' +
            '</div>' +
            '<div style="overflow-x:auto;">' +
                '<table class="data-table">' +
                    '<thead><tr>' +
                        '<th>Application ID</th>' +
                        '<th>Service</th>' +
                        '<th>Submitted Date</th>' +
                        '<th>Status</th>' +
                        '<th>Current Stage</th>' +
                        '<th>Action</th>' +
                    '</tr></thead>' +
                    '<tbody>' + appRows + '</tbody>' +
                '</table>' +
            '</div>' +
        '</div>' +
    '</div>';
}

function renderLearnerPage(session) {
    // Duplicate LL check: prevent second application if citizen already has an active/approved LL
    var llCheck = checkCitizenLLEligibility(session);
    if (!llCheck.isEligible && llCheck.existingApp) {
        var _existingLL = llCheck.existingApp;
        var _llStatusBadge = (_existingLL.status === 'Approved' || _existingLL.status === 'Issued')
            ? '<span class="badge badge-approved" style="background:#e8f7f1; color:#1aab74; border:1px solid #c2ead8;">● Issued</span>'
            : '<span class="badge badge-pending" style="background:#fff7e6; color:#d46b08; border:1px solid #ffe7ba;">● ' + _existingLL.status + '</span>';
        var _demoTag = (_existingLL.id === 'LL-DEMO-001')
            ? '<div style="background:#fffbe6; border:1px solid #ffe58f; border-radius:var(--radius-sm); padding:0.5rem 0.75rem; margin-bottom:1rem; font-size:0.75rem; color:#ad6800;"><i class="fa-solid fa-flask"></i> <strong>Prototype Demo Data</strong> — Not an official government record.</div>'
            : '';

        return '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-arrow-left"></i> Back to Services</button></div>' +
            '<div class="animate-in" style="max-width:680px; margin:0 auto;">' +
                '<div class="card" style="padding:2.25rem 2rem;">' +
                    _demoTag +
                    '<div style="width:64px; height:64px; border-radius:50%; background:#e8f7f1; color:var(--primary); font-size:1.8rem; display:flex; align-items:center; justify-content:center; margin:0 auto 1.25rem auto;">' +
                        '<i class="fa-solid fa-id-card"></i>' +
                    '</div>' +
                    '<h2 style="font-size:1.3rem; font-weight:700; color:var(--text-main); text-align:center; margin-bottom:0.3rem;">Active Learner\'s Licence Found</h2>' +
                    '<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; margin-bottom:1.5rem;">You\'re not eligible to apply for another Learner\'s Licence because you already have an active Learner\'s Licence.</p>' +
                    '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem;">' +
                        '<div class="flex-between" style="padding:0.4rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;"><span style="color:var(--text-muted);">Application / Licence Number:</span><strong>' + _existingLL.id + '</strong></div>' +
                        '<div class="flex-between" style="padding:0.4rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;"><span style="color:var(--text-muted);">Applicant:</span><strong>' + (_existingLL.name || session.name) + '</strong></div>' +
                        '<div class="flex-between" style="padding:0.4rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;"><span style="color:var(--text-muted);">Service:</span><strong>Learner\'s Licence</strong></div>' +
                        '<div class="flex-between" style="padding:0.4rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;"><span style="color:var(--text-muted);">Vehicle Categories:</span><strong>' + (_existingLL.vehicleClasses ? _existingLL.vehicleClasses.join(', ') : 'MCWG, LMV') + '</strong></div>' +
                        '<div class="flex-between" style="padding:0.4rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">Status:</span>' + _llStatusBadge + '</div>' +
                    '</div>' +
                    '<div style="display:flex; gap:0.75rem; justify-content:center;">' +
                        '<button class="btn btn-primary" onclick="window.location.hash=\'citizen-track\'"><i class="fa-solid fa-id-card"></i> View Existing Licence</button>' +
                        '<button class="btn btn-ghost" onclick="window.location.hash=\'apply-permanent\'"><i class="fa-solid fa-car"></i> Apply for Permanent Licence</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    setupServiceDocsAndEvidence("Learner's Licence");
    
    setTimeout(function() {
        renderDocumentChecklistTable("Learner's Licence");
    }, 50);

    return '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-arrow-left"></i> Back to Services</button></div>' +
        '<div class="animate-in" style="max-width:850px;">' +
            '<div class="card">' +
                '<div class="card-title">Application for New Learner\'s Licence</div>' +
                '<form onsubmit="event.preventDefault(); submitServiceForm(\'Learner\\\'s Licence\')">' +
                    
                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem;">Applicant Details</h4>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Full Name (as per Aadhaar)</label><input type="text" id="applicantName" value="' + session.name + '" required></div>' +
                        '<div class="form-group"><label>Email Address</label><input type="email" id="applicantEmail" value="' + session.email + '" required></div>' +
                    '</div>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Mobile Number</label><input type="tel" id="applicantMobile" placeholder="10-digit number" maxlength="10" required></div>' +
                        '<div class="form-group"><label>Date of Birth</label><input type="date" id="applicantDob" required></div>' +
                    '</div>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Gender</label>' +
                            '<select id="applicantGender" required>' +
                                '<option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>' +
                            '</select>' +
                        '</div>' +
                        '<div class="form-group"><label>Applicant Category</label>' +
                            '<select id="applicantCategory" onchange="renderDocumentChecklistTable(\'Learner\\\'s Licence\'); toggleMinorField();" required>' +
                                '<option value="Adult">General (Adult)</option>' +
                                '<option value="Minor">Minor (16-18 years)</option>' +
                                '<option value="Transport">Transport (Commercial)</option>' +
                                '<option value="Senior">Senior Citizen</option>' +
                            '</select>' +
                        '</div>' +
                    '</div>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>State <span class="text-danger">*</span></label><input type="text" id="applicantState" placeholder="e.g. Telangana" required></div>' +
                        '<div class="form-group"><label>District <span class="text-danger">*</span></label>' +
                            '<select id="applicantDistrict" required>' +
                                '<option value="">Select District...</option>' +
                                '<option value="Hyderabad">Hyderabad</option>' +
                                '<option value="Rangareddy">Rangareddy</option>' +
                                '<option value="Medchal">Medchal</option>' +
                                '<option value="Warangal">Warangal</option>' +
                                '<option value="Karimnagar">Karimnagar</option>' +
                                '<option value="Nizamabad">Nizamabad</option>' +
                                '<option value="Khammam">Khammam</option>' +
                                '<option value="Nalgonda">Nalgonda</option>' +
                                '<option value="Adilabad">Adilabad</option>' +
                                '<option value="Mahabubnagar">Mahabubnagar</option>' +
                            '</select>' +
                        '</div>' +
                    '</div>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>PIN Code <span class="text-danger">*</span></label><input type="text" id="applicantPin" placeholder="e.g. 500001" maxlength="6" required></div>' +
                        '<div class="form-group" id="minorParentField" style="display:none;">' +
                            '<label>Parent / Guardian Name <span class="text-danger">*</span></label>' +
                            '<input type="text" id="parentName" placeholder="Full name of parent/guardian">' +
                        '</div>' +
                    '</div>' +
                    '<div class="form-group"><label>Residential Address</label><input type="text" id="applicantAddress" placeholder="Full residential address" required></div>' +

                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem;">Aadhaar Verification (Simulated)</h4>' +
                    '<div class="form-group">' +
                        '<label>Aadhaar Number <span class="text-danger">*</span></label>' +
                        '<input type="text" id="aadhaarNumber" placeholder="Enter 12-digit Aadhaar number" maxlength="12" required>' +
                        '<small class="text-muted-small" style="display:block; margin-top:0.25rem;">Note: This is a prototype system. Aadhaar verification is simulated for demonstration purposes.</small>' +
                    '</div>' +

                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem;">Vehicle Categories Requested</h4>' +
                    '<div class="form-group">' +
                        '<label>Select categories (Select all that apply) <span class="text-danger">*</span></label>' +
                        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem; background: var(--bg); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border);">' +
                            '<label><input type="checkbox" name="vehicleCategory" value="MCWOG"> Motorcycle Without Gear (MCWOG)</label>' +
                            '<label><input type="checkbox" name="vehicleCategory" value="MCWG"> Motorcycle With Gear (MCWG)</label>' +
                            '<label><input type="checkbox" name="vehicleCategory" value="LMV"> Light Motor Vehicle (LMV)</label>' +
                            '<label><input type="checkbox" name="vehicleCategory" value="Transport"> Transport Vehicle</label>' +
                            '<label><input type="checkbox" name="vehicleCategory" value="E-Rickshaw"> E-Rickshaw</label>' +
                            '<label><input type="checkbox" name="vehicleCategory" value="E-Cart"> E-Cart</label>' +
                            '<label><input type="checkbox" name="vehicleCategory" value="Other"> Other</label>' +
                        '</div>' +
                    '</div>' +

                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem;">Test Availability & RTO Preference</h4>' +
                    '<div class="form-group">' +
                        '<label>When are you available for your Learner\'s Licence test? <span class="text-danger">*</span></label>' +
                        '<div class="grid-2" style="margin-top:0.4rem;">' +
                            '<div>' +
                                '<label style="font-size:0.78rem; color:var(--text-muted); display:block; margin-bottom:0.25rem;">Available Date</label>' +
                                '<input type="date" id="preferredTestDate" required>' +
                            '</div>' +
                            '<div>' +
                                '<label style="font-size:0.78rem; color:var(--text-muted); display:block; margin-bottom:0.25rem;">Available Time Window (1-Hour)</label>' +
                                '<select id="preferredTimeWindow" required>' +
                                    '<option value="">Select Time Window...</option>' +
                                    '<option value="09:00 AM - 10:00 AM">09:00 AM – 10:00 AM</option>' +
                                    '<option value="10:00 AM - 11:00 AM">10:00 AM – 11:00 AM</option>' +
                                    '<option value="11:00 AM - 12:00 PM">11:00 AM – 12:00 PM</option>' +
                                    '<option value="12:00 PM - 01:00 PM">12:00 PM – 01:00 PM</option>' +
                                    '<option value="02:00 PM - 03:00 PM">02:00 PM – 03:00 PM</option>' +
                                    '<option value="03:00 PM - 04:00 PM">03:00 PM – 04:00 PM</option>' +
                                    '<option value="04:00 PM - 05:00 PM">04:00 PM – 05:00 PM</option>' +
                                '</select>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +

                    '<div class="form-group">' +
                        '<label>Enter your preferred RTO office code <span class="text-danger">*</span></label>' +
                        '<div style="display:flex; gap:0.5rem; align-items:flex-start; margin-top:0.4rem;">' +
                            '<div style="flex-grow:1;">' +
                                '<input type="text" id="preferredRtoCode" placeholder="e.g. TG-09 or TG-03" oninput="lookupRtoOffice()" required>' +
                                '<small class="text-muted-small" style="display:block; margin-top:0.25rem;">Enter the RTO Office Code / Prototype Lookup Code where you want to take your test.</small>' +
                            '</div>' +
                            '<button type="button" class="btn btn-ghost" onclick="showRtoDirectoryModal()" style="padding:0.6rem 0.8rem; font-size:0.8rem; border-color:var(--border);"><i class="fa-solid fa-list"></i> View Directory</button>' +
                        '</div>' +
                        '<div id="rtoLookupResult" style="margin-top:0.5rem;"></div>' +
                    '</div>' +

                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem;">Required Documents Checklist</h4>' +
                    '<div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.75rem;"><i class="fa-solid fa-info-circle"></i> Please upload accepted documents. Mandatory uploads are highlighted in red.</div>' +
                    '<div id="documentChecklistContainer" style="overflow-x:auto; margin-bottom:1.5rem;"></div>' +

                    '<button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding:0.75rem;"><i class="fa-solid fa-paper-plane"></i> Submit Learner Licence Application</button>' +
                '</form>' +
            '</div>' +
        '</div>';
}

function toggleMinorField() {
    var cat = document.getElementById('applicantCategory').value;
    var field = document.getElementById('minorParentField');
    if (field) {
        field.style.display = (cat === 'Minor') ? 'block' : 'none';
        var input = document.getElementById('parentName');
        if (input) {
            if (cat === 'Minor') input.setAttribute('required', 'true');
            else input.removeAttribute('required');
        }
    }
}

function renderDlInfoPage(session) {
    return '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-arrow-left"></i> Back to Services</button></div>' +
        '<div class="animate-in" style="max-width:720px;">' +
            '<div class="card">' +
                '<div class="card-title"><i class="fa-solid fa-car" style="color:var(--primary);"></i> Permanent Driving Licence Information</div>' +
                '<div class="alert-info-box">' +
                    '<strong>Guideline:</strong> To apply for a Permanent Driving Licence, you must have held a valid Learner\'s Licence for at least 30 days.' +
                '</div>' +
                '<p style="font-size:0.9rem; line-height:1.6; margin-bottom:1rem;">' +
                    'DriveSetu offers a fully digital, sensor-based AI track test tracking environment. You can submit your track test evidence ' +
                    '(the telemetry video and the official PDF audit report) directly through our portal to receive your permanent licence without ' +
                    'visiting the RTO for manual paperwork.' +
                '</p>' +
                '<h4 style="font-size:0.95rem; margin-bottom:0.5rem;">Prerequisites:</h4>' +
                '<ul style="margin-left:1.5rem; font-size:0.88rem; line-height:1.6; margin-bottom:1.5rem;">' +
                    '<li>Active Learner\'s Licence (LL) details.</li>' +
                    '<li>Completed sensor track driving competency test.</li>' +
                    '<li>Telemetry test video recording (MP4/MOV/WEBM).</li>' +
                    '<li>RTO AI Evaluation Report (PDF).</li>' +
                '</ul>' +
                '<div style="display:flex; gap:0.75rem;">' +
                    '<button class="btn btn-primary" onclick="window.location.hash=\'apply-permanent\'"><i class="fa-solid fa-id-card"></i> Proceed to Permanent Licence Application</button>' +
                    '<button class="btn btn-ghost" onclick="window.location.hash=\'apply-learner\'"><i class="fa-solid fa-graduation-cap"></i> Apply for Learner\'s Licence First</button>' +
                '</div>' +
            '</div>' +
        '</div>';
}

// ─── PERMANENT LICENCE WORKFLOW STATE & HELPERS ───
if (!window.permanentLicenceState) {
    window.permanentLicenceState = {
        step: 'lookup', // 'lookup' | 'found' | 'not_found' | 'form'
        matchedApp: null,
        isPrefilled: false,
        isEligible: true,
        earliestEligibleDate: '',
        prefilledData: null
    };
}

function resetPermanentWorkflow() {
    window.permanentLicenceState = {
        step: 'lookup',
        matchedApp: null,
        isPrefilled: false,
        isEligible: true,
        earliestEligibleDate: '',
        prefilledData: null
    };
    render();
}

function resetDriveSetuPrototypeData() {
    localStorage.removeItem('drivesetu_applications');
    localStorage.removeItem('drivesetu_pending_reviews');
    sessionStorage.removeItem('citizenSession');
    sessionStorage.removeItem('rtoSession');
    window.location.hash = 'citizen-login';
    window.location.reload();
}

function checkCitizenLLEligibility(session, requestedClasses) {
    if (!session) return { isEligible: true };
    var apps = getStoredApplications();
    var activeLLStatuses = ['Approved', 'Issued', 'Valid', 'Pending', 'Under Review', 'Submitted', 'Test Scheduled'];
    
    for (var i = 0; i < apps.length; i++) {
        var app = apps[i];
        if (app.type === "Learner's Licence") {
            var isCitizenApp = (app.citizenId === session.email || app.citizenId === session.appId || app.name === session.name || (session.email === 'citizen@drivesetu.com' && app.id === 'LL-DEMO-001'));
            if (isCitizenApp && activeLLStatuses.indexOf(app.status) !== -1) {
                var appClasses = app.vehicleClasses || (app.serviceDetails && app.serviceDetails.vehicleClasses) || ['MCWG', 'LMV'];
                var hasClassOverlap = true;
                if (requestedClasses && Array.isArray(requestedClasses) && requestedClasses.length > 0) {
                    hasClassOverlap = requestedClasses.some(function(rc) {
                        return appClasses.indexOf(rc) !== -1;
                    });
                }
                if (hasClassOverlap) {
                    return {
                        isEligible: false,
                        existingApp: app,
                        reason: "You're not eligible to apply for another Learner's Licence because you already have an active Learner's Licence."
                    };
                }
            }
        }
    }
    return { isEligible: true };
}

function checkCitizenDLEligibility(session, requestedClasses) {
    if (!session) return { isEligible: true };
    var apps = getStoredApplications();
    
    // 1. Check existing Permanent/Driving Licence application or active licence
    var activeDLStatuses = ['Pending', 'Submitted', 'Test Scheduled', 'Under Review', 'Approved', 'Issued', 'Valid', 'SECOND INDEPENDENT REVIEW REQUIRED'];
    for (var i = 0; i < apps.length; i++) {
        var app = apps[i];
        if (app.type === 'Permanent Licence') {
            var isCitizenApp = (app.citizenId === session.email || app.citizenId === session.appId || app.name === session.name || (session.email === 'citizen@drivesetu.com' && app.id === 'APP-206500'));
            if (isCitizenApp && activeDLStatuses.indexOf(app.status) !== -1) {
                var appClasses = app.vehicleClasses || (app.serviceDetails && app.serviceDetails.vehicleClasses) || ['MCWG', 'LMV'];
                var hasClassOverlap = true;
                if (requestedClasses && Array.isArray(requestedClasses) && requestedClasses.length > 0) {
                    hasClassOverlap = requestedClasses.some(function(rc) {
                        return appClasses.indexOf(rc) !== -1;
                    });
                }
                if (hasClassOverlap) {
                    return {
                        isEligible: false,
                        hasExistingDL: true,
                        existingApp: app,
                        reason: "You already have a Permanent Driving Licence application/licence in progress or active."
                    };
                }
            }
        }
    }
    
    // 2. Check if citizen has a valid Learner's Licence
    var matchedLL = null;
    var isDemoAccount = (session.email === 'citizen@drivesetu.com' || session.email === 'demo@drivesetu.com');
    var isSufyanSession = (session.email && session.email.toLowerCase().includes('sufyan')) || (session.name && session.name.toLowerCase().includes('sufyan'));

    for (var j = 0; j < apps.length; j++) {
        var llApp = apps[j];
        if (llApp.type === "Learner's Licence" && (llApp.status === 'Approved' || llApp.status === 'Issued' || llApp.status === 'Valid' || llApp.status === 'Submitted' || llApp.status === 'Pending')) {
            var isOwner = (llApp.citizenId === session.email || llApp.citizenId === session.appId || (session.name && llApp.name === session.name));
            var isSufyanLL = isSufyanSession && (llApp.id === 'LL-SUFYAN-001' || (llApp.citizenId && llApp.citizenId.toLowerCase().includes('sufyan')));
            if (isOwner || isSufyanLL || (isDemoAccount && llApp.id === 'LL-DEMO-001')) {
                matchedLL = llApp;
                break;
            }
        }
    }
    
    if (!matchedLL) {
        return {
            isEligible: false,
            hasLL: false,
            reason: "No active Learner's Licence found. You must hold a valid Learner's Licence before applying for a Permanent Licence."
        };
    }
    
    var elInfo = getLlEligibilityInfo(matchedLL);
    if (!elInfo.isEligible) {
        return {
            isEligible: false,
            hasLL: true,
            matchedLL: matchedLL,
            eligibilityInfo: elInfo,
            reason: elInfo.reason || "Your Learner's Licence has not completed the mandatory 30-day learning period."
        };
    }
    
    return {
        isEligible: true,
        hasLL: true,
        matchedLL: matchedLL,
        eligibilityInfo: elInfo
    };
}

function getLlEligibilityInfo(app) {
    if (!app) return { isEligible: false, reason: 'No application record found.' };

    var isDemo = (app.id === 'LL-DEMO-001' || app.isPrototypeDemo);
    var isSufyan = (app.id === 'LL-SUFYAN-001' || app.id === 'APP-801439' || (app.citizenId && app.citizenId.toLowerCase().includes('sufyan')) || (app.name && app.name.toLowerCase().includes('sufyan')));

    var todayFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    var issueDateStr = isSufyan ? '14 Jul 2026' : ((app.serviceDetails && app.serviceDetails.issueDate) || app.date || app.createdAt || '14 Jul 2026');
    
    var issueDateObj = new Date(issueDateStr);
    if (isNaN(issueDateObj.getTime())) {
        issueDateObj = new Date('2026-07-14');
    }

    var minEligibleDateObj = new Date(issueDateObj.getTime() + 30 * 24 * 60 * 60 * 1000);
    var now = new Date();

    if (isDemo || isSufyan) {
        return {
            isEligible: true,
            isDemo: isDemo,
            isSufyan: isSufyan,
            daysHeld: 31,
            daysRemaining: 0,
            issueDateStr: isSufyan ? '14 Jul 2026' : '12 May 2026',
            eligibleDateStr: isSufyan ? todayFormatted : '11 Jun 2026',
            testDateStr: todayFormatted,
            message: 'Eligible for Permanent Licence (30-day learning period completed)'
        };
    }

    var elapsedMs = now.getTime() - issueDateObj.getTime();
    var daysHeld = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)));
    var diffMs = minEligibleDateObj.getTime() - now.getTime();
    var daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    if (daysHeld >= 30 || daysRemaining <= 0) {
        return {
            isEligible: true,
            isDemo: false,
            daysHeld: daysHeld,
            daysRemaining: 0,
            issueDateStr: issueDateObj.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'}),
            eligibleDateStr: minEligibleDateObj.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'}),
            message: 'Eligible for Permanent Licence (30-day learning period completed)'
        };
    } else {
        return {
            isEligible: false,
            isDemo: false,
            daysHeld: daysHeld,
            daysRemaining: daysRemaining,
            issueDateStr: issueDateObj.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'}),
            eligibleDateStr: minEligibleDateObj.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'}),
            reason: 'Learner\'s Licence issued on ' + issueDateObj.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'}) + '. Under Motor Vehicle Regulations, a 30-day mandatory learning period is required. You have completed ' + daysHeld + ' days (' + daysRemaining + ' days left).'
        };
    }
}

function searchLlForPermanent() {
    var input = document.getElementById('trackLlInput');
    if (!input) return;
    var appId = input.value.trim().toUpperCase();
    if (!appId) {
        alert('Please enter your Learner\'s Licence Application Number.');
        return;
    }

    var session = safeParseJSON(sessionStorage.getItem('citizenSession'), null);
    if (!session) {
        alert('Authentication error. Please log in again.');
        return;
    }

    var apps = getStoredApplications();
    var matched = null;

    for (var i = 0; i < apps.length; i++) {
        if (apps[i].id === appId) {
            if (apps[i].citizenId === session.email || apps[i].citizenId === session.appId || apps[i].name === session.name || appId === 'LL-DEMO-001') {
                matched = apps[i];
            }
            break;
        }
    }

    if (matched && matched.type === "Learner's Licence") {
        var elInfo = getLlEligibilityInfo(matched);
        window.permanentLicenceState.matchedApp = matched;
        window.permanentLicenceState.step = 'found';
        window.permanentLicenceState.isEligible = elInfo.isEligible;
        window.permanentLicenceState.eligibilityInfo = elInfo;
        window.permanentLicenceState.earliestEligibleDate = elInfo.eligibleDateStr;
    } else {
        window.permanentLicenceState.matchedApp = null;
        window.permanentLicenceState.step = 'not_found';
    }

    render();
}

function startPermanentManualMode() {
    window.permanentLicenceState.step = 'form';
    window.permanentLicenceState.isPrefilled = false;
    window.permanentLicenceState.matchedApp = null;
    render();
}

function startPermanentFormPrefilled() {
    window.permanentLicenceState.step = 'form';
    window.permanentLicenceState.isPrefilled = true;
    render();
}

function lookupRtoForPermanent() {
    var input = document.getElementById('preferredRtoCode');
    var container = document.getElementById('rtoMatchSummary');
    if (!input || !container) return;

    var code = input.value.trim().toUpperCase().replace('TS', 'TG');
    var foundRto = null;
    for (var r = 0; r < rtoDirectory.length; r++) {
        if (rtoDirectory[r].rtoCode === code) {
            foundRto = rtoDirectory[r];
            break;
        }
    }

    if (foundRto) {
        container.innerHTML = '<div style="background:#e8f7f1; border:1px solid #c2ead8; border-radius:var(--radius-md); padding:0.85rem; margin-top:0.6rem; font-size:0.85rem;">' +
            '<div style="color:#148f60; font-weight:700; margin-bottom:0.25rem;"><i class="fa-solid fa-circle-check"></i> RTO Office Found</div>' +
            '<div><strong>Office Name:</strong> ' + foundRto.officeName + '</div>' +
            '<div style="color:var(--text-muted); font-size:0.78rem; margin-top:0.2rem;"><strong>Address:</strong> ' + foundRto.address + '</div>' +
        '</div>';
    } else if (code.length >= 4) {
        container.innerHTML = '<div style="background:#fff0f0; border:1px solid #feb2b2; border-radius:var(--radius-md); padding:0.75rem; margin-top:0.6rem; font-size:0.82rem; color:#c53030;">' +
            '<i class="fa-solid fa-triangle-exclamation"></i> RTO Office Code not found in directory. Examples: TG-09, TG-11, TG-03.' +
        '</div>';
    } else {
        container.innerHTML = '';
    }
}

function renderPermanentPage(session) {
    setupServiceDocsAndEvidence("Permanent Licence");
    
    // Duplicate Permanent Licence check
    var dlCheck = checkCitizenDLEligibility(session);
    if (!dlCheck.isEligible && dlCheck.hasExistingDL && dlCheck.existingApp) {
        var _existingDL = dlCheck.existingApp;
        var _dlStatusBadge = (_existingDL.status === 'Approved' || _existingDL.status === 'Issued')
            ? '<span class="badge badge-approved" style="background:#e8f7f1; color:#1aab74; border:1px solid #c2ead8;">● Issued</span>'
            : '<span class="badge badge-pending" style="background:#fff7e6; color:#d46b08; border:1px solid #ffe7ba;">● ' + _existingDL.status + '</span>';
        
        return '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-arrow-left"></i> Back to Services</button></div>' +
            '<div class="animate-in" style="max-width:680px; margin:0 auto;">' +
                '<div class="card" style="padding:2.25rem 2rem;">' +
                    '<div style="width:64px; height:64px; border-radius:50%; background:#e8f7f1; color:var(--primary); font-size:1.8rem; display:flex; align-items:center; justify-content:center; margin:0 auto 1.25rem auto;">' +
                        '<i class="fa-solid fa-car"></i>' +
                    '</div>' +
                    '<h2 style="font-size:1.3rem; font-weight:700; color:var(--text-main); text-align:center; margin-bottom:0.3rem;">Permanent Driving Licence Application Found</h2>' +
                    '<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; margin-bottom:1.5rem;">You already have a Permanent Driving Licence application/licence in progress or active.</p>' +
                    '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem;">' +
                        '<div class="flex-between" style="padding:0.4rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;"><span style="color:var(--text-muted);">Application Number:</span><strong>' + _existingDL.id + '</strong></div>' +
                        '<div class="flex-between" style="padding:0.4rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;"><span style="color:var(--text-muted);">Applicant:</span><strong>' + (_existingDL.name || session.name) + '</strong></div>' +
                        '<div class="flex-between" style="padding:0.4rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;"><span style="color:var(--text-muted);">Service:</span><strong>Permanent Licence</strong></div>' +
                        '<div class="flex-between" style="padding:0.4rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;"><span style="color:var(--text-muted);">Vehicle Categories:</span><strong>' + (_existingDL.vehicleClasses ? _existingDL.vehicleClasses.join(', ') : 'MCWG, LMV') + '</strong></div>' +
                        '<div class="flex-between" style="padding:0.4rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">Status:</span>' + _dlStatusBadge + '</div>' +
                    '</div>' +
                    '<div style="display:flex; gap:0.75rem; justify-content:center;">' +
                        '<button class="btn btn-primary" onclick="window.location.hash=\'citizen-track\'"><i class="fa-solid fa-magnifying-glass"></i> Track Existing Application</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    var state = window.permanentLicenceState || { step: 'lookup' };

    if (state.step === 'lookup') {
        if (dlCheck.matchedLL) {
            var autoMatched = dlCheck.matchedLL;
            var elInfo = dlCheck.eligibilityInfo || getLlEligibilityInfo(autoMatched);
            window.permanentLicenceState.matchedApp = autoMatched;
            window.permanentLicenceState.step = 'found';
            window.permanentLicenceState.isEligible = elInfo.isEligible;
            window.permanentLicenceState.eligibilityInfo = elInfo;
            window.permanentLicenceState.earliestEligibleDate = elInfo.eligibleDateStr;
            return renderPermanentPage(session);
        }

        return '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-arrow-left"></i> Back to Services</button></div>' +
            '<div class="animate-in" style="max-width:680px; margin:0 auto;">' +
                '<div class="card" style="padding: 2.5rem 2rem; text-align:center;">' +
                    '<div style="width:70px; height:70px; border-radius:50%; background:#fff7e6; color:#d46b08; font-size:2rem; display:flex; align-items:center; justify-content:center; margin:0 auto 1.25rem auto;">' +
                        '<i class="fa-solid fa-triangle-exclamation"></i>' +
                    '</div>' +
                    '<h2 style="font-size:1.35rem; font-weight:700; color:var(--text-main); margin-bottom:0.4rem;">No Learner\'s Licence Found</h2>' +
                    '<p style="font-size:0.86rem; color:var(--text-muted); margin-bottom:1.5rem; max-width:520px; margin-left:auto; margin-right:auto; line-height:1.5;">' +
                        'Under Motor Vehicle Regulations, you must first apply for and hold an approved <strong>Learner\'s Licence (LL)</strong> for a minimum of <strong>30 days</strong> before applying for a Permanent Driving Licence.' +
                    '</p>' +
                    '<div style="display:flex; justify-content:center; margin-bottom:1.75rem;">' +
                        '<button type="button" class="btn btn-primary" style="padding:0.75rem 1.75rem; font-weight:600;" onclick="window.location.hash=\'apply-learner\'">' +
                            '<i class="fa-solid fa-id-card"></i> Apply for Learner\'s Licence First' +
                        '</button>' +
                    '</div>' +
                    '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-md); padding:1.25rem; text-align:left;">' +
                        '<label style="font-weight:700; font-size:0.85rem; color:var(--text-main); display:block; margin-bottom:0.4rem;">Already have a Learner\'s Licence number issued offline?</label>' +
                        '<div style="display:flex; gap:0.6rem;">' +
                            '<input type="text" id="trackLlInput" placeholder="e.g. LL-DEMO-001 or APP-101" style="flex:1; text-transform:uppercase;" onkeyup="if(event.key===\'Enter\') searchLlForPermanent()">' +
                            '<button type="button" class="btn btn-secondary" onclick="searchLlForPermanent()"><i class="fa-solid fa-magnifying-glass"></i> Verify LL</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    if (state.step === 'found') {
        var app = state.matchedApp;
        var sd = app.serviceDetails || {};
        var ad = app.applicantDetails || {};
        var elInfo = state.eligibilityInfo || getLlEligibilityInfo(app);

        var categoriesStr = (sd.vehicleClasses && sd.vehicleClasses.length > 0) ? sd.vehicleClasses.join(', ') : (app.vehicleClasses ? app.vehicleClasses.join(', ') : 'MCWG, LMV');
        var dobStr = ad.dob || session.dob || '15/08/1998';
        var isDemo = (app.id === 'LL-DEMO-001' || app.isPrototypeDemo);

        var cardHeaderHTML = isDemo
            ? '<div style="background:#e8f7f1; border:2px solid #1aab74; border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem;">' +
                '<div class="flex-between" style="margin-bottom:0.85rem;">' +
                    '<div style="color:#148f60; font-weight:700; font-size:1.1rem; display:flex; align-items:center; gap:0.5rem;">' +
                        '<i class="fa-solid fa-circle-check" style="font-size:1.4rem;"></i> Learner\'s Licence Verified' +
                    '</div>' +
                    '<span class="badge" style="background:#fff7e6; color:#d46b08; border:1px solid #ffe7ba; font-weight:700; font-size:0.78rem; padding:0.3rem 0.75rem;">' +
                        '<i class="fa-solid fa-flask"></i> Prototype Demo Data' +
                    '</span>' +
                '</div>' +
                '<div style="background:#fff; border:1px solid #c2ead8; border-radius:var(--radius-sm); padding:1rem; margin-bottom:0.75rem;">' +
                    '<div class="grid-2" style="gap:0.75rem; font-size:0.88rem;">' +
                        '<div><span style="color:var(--text-muted);">Application Number:</span> <strong style="font-size:0.95rem; color:var(--text-main);">' + app.id + '</strong></div>' +
                        '<div><span style="color:var(--text-muted);">Applicant Name:</span> <strong>' + (app.name || session.name) + '</strong></div>' +
                        '<div><span style="color:var(--text-muted);">Status:</span> <strong style="color:#148f60;">Issued / Approved</strong></div>' +
                        '<div><span style="color:var(--text-muted);">Issue Date:</span> <strong>' + elInfo.issueDateStr + '</strong> (Held for &gt;30 days)</div>' +
                        '<div><span style="color:var(--text-muted);">Vehicle Categories:</span> <strong>' + categoriesStr + '</strong></div>' +
                        '<div><span style="color:var(--text-muted);">Eligibility:</span> <strong style="color:#148f60;"><i class="fa-solid fa-circle-check"></i> Eligible for Permanent Licence</strong></div>' +
                    '</div>' +
                '</div>' +
                '<div style="text-align:center; font-size:0.78rem; color:#64748b; font-weight:600;">' +
                    '⚠️ Prototype Demo Data — Not an official government record' +
                '</div>' +
              '</div>'
            : (elInfo.isEligible
                ? '<div style="background:#e8f7f1; border:2px solid #1aab74; border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem;">' +
                    '<div style="color:#148f60; font-weight:700; font-size:1.1rem; margin-bottom:0.75rem; display:flex; align-items:center; gap:0.5rem;">' +
                        '<i class="fa-solid fa-circle-check" style="font-size:1.4rem;"></i> Learner\'s Licence Verified' +
                    '</div>' +
                    '<div style="background:#fff; border:1px solid #c2ead8; border-radius:var(--radius-sm); padding:1rem; font-size:0.88rem;">' +
                        '<div class="grid-2" style="gap:0.75rem;">' +
                            '<div><span style="color:var(--text-muted);">Application Number:</span> <strong>' + app.id + '</strong></div>' +
                            '<div><span style="color:var(--text-muted);">Applicant Name:</span> <strong>' + (app.name || session.name) + '</strong></div>' +
                            '<div><span style="color:var(--text-muted);">Status:</span> <strong style="color:#148f60;">Issued / Approved</strong></div>' +
                            '<div><span style="color:var(--text-muted);">Issue Date:</span> <strong>' + elInfo.issueDateStr + '</strong></div>' +
                            '<div><span style="color:var(--text-muted);">Vehicle Categories:</span> <strong>' + categoriesStr + '</strong></div>' +
                            '<div><span style="color:var(--text-muted);">Eligibility:</span> <strong style="color:#148f60;"><i class="fa-solid fa-circle-check"></i> 30-Day Period Complete</strong></div>' +
                        '</div>' +
                    '</div>' +
                  '</div>'
                : '<div style="background:#fff7e6; border:2px solid #d46b08; border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem;">' +
                    '<div class="flex-between" style="margin-bottom:0.85rem;">' +
                        '<div style="color:#d46b08; font-weight:700; font-size:1.1rem; display:flex; align-items:center; gap:0.5rem;">' +
                            '<i class="fa-solid fa-lock" style="font-size:1.3rem;"></i> Permanent Licence Application Locked' +
                        '</div>' +
                        '<span class="badge" style="background:#fff0f0; color:#c53030; border:1px solid #feb2b2; font-weight:700; font-size:0.78rem; padding:0.3rem 0.75rem;">' +
                            '<i class="fa-solid fa-clock"></i> 30-Day Rule In Effect' +
                        '</span>' +
                    '</div>' +
                    '<div style="background:#fff; border:1px solid #ffe7ba; border-radius:var(--radius-sm); padding:1rem; margin-bottom:0.85rem; font-size:0.88rem;">' +
                        '<div class="grid-2" style="gap:0.75rem;">' +
                            '<div><span style="color:var(--text-muted);">Application Number:</span> <strong>' + app.id + '</strong></div>' +
                            '<div><span style="color:var(--text-muted);">Applicant Name:</span> <strong>' + (app.name || session.name) + '</strong></div>' +
                            '<div><span style="color:var(--text-muted);">LL Issue Date:</span> <strong>' + elInfo.issueDateStr + '</strong></div>' +
                            '<div><span style="color:var(--text-muted);">Unlocks On:</span> <strong>' + elInfo.eligibleDateStr + '</strong></div>' +
                            '<div><span style="color:var(--text-muted);">Learning Period:</span> <strong style="color:#c53030;">' + elInfo.daysRemaining + ' Days Remaining</strong></div>' +
                            '<div><span style="color:var(--text-muted);">Status:</span> <strong style="color:#d46b08;">Learning Period In Progress</strong></div>' +
                        '</div>' +
                    '</div>' +
                    '<p style="font-size:0.83rem; color:#592400; margin:0; line-height:1.5;">' +
                        'Under Motor Vehicle Regulations, applicants holding a Learner\'s Licence must complete a mandatory 30-day learning period before taking the practical driving test for a Permanent Licence. This option will unlock automatically once your 30-day learning period is complete on <strong>' + elInfo.eligibleDateStr + '</strong>.' +
                    '</p>' +
                  '</div>'
            );

        var actionBtnsHTML = elInfo.isEligible
            ? '<div style="display:flex; gap:0.75rem;">' +
                '<button type="button" class="btn btn-primary" style="flex:1; justify-content:center; padding:0.75rem; font-size:0.95rem;" onclick="startPermanentFormPrefilled()"><i class="fa-solid fa-arrow-right"></i> Proceed with Permanent Licence Application</button>' +
                '<button type="button" class="btn btn-ghost" onclick="resetPermanentWorkflow()"><i class="fa-solid fa-rotate-left"></i> Search Other LL</button>' +
              '</div>'
            : '<div style="display:flex; gap:0.75rem;">' +
                '<button type="button" class="btn btn-ghost" disabled style="flex:1; justify-content:center; padding:0.75rem; opacity:0.6; cursor:not-allowed;"><i class="fa-solid fa-lock"></i> Application Locked (' + elInfo.daysRemaining + ' Days Remaining)</button>' +
                '<button type="button" class="btn btn-ghost" onclick="resetPermanentWorkflow()"><i class="fa-solid fa-rotate-left"></i> Search Other LL</button>' +
              '</div>';

        return '<div class="mb-6"><button class="btn btn-back" onclick="resetPermanentWorkflow()"><i class="fa-solid fa-arrow-left"></i> Back to Services</button></div>' +
            '<div class="animate-in" style="max-width:700px; margin:0 auto;">' +
                '<div class="card" style="padding: 2.25rem 2rem;">' +
                    cardHeaderHTML +
                    actionBtnsHTML +
                '</div>' +
            '</div>';
    }

    if (state.step === 'not_found') {
        return '<div class="mb-6"><button class="btn btn-back" onclick="resetPermanentWorkflow()"><i class="fa-solid fa-arrow-left"></i> Back to Lookup</button></div>' +
            '<div class="animate-in" style="max-width:620px; margin:0 auto;">' +
                '<div class="card" style="padding: 2.25rem 2rem; text-align:center;">' +
                    '<div style="width:60px; height:60px; border-radius:50%; background:#fff7e6; color:#d46b08; font-size:1.8rem; display:flex; align-items:center; justify-content:center; margin:0 auto 1rem auto;">' +
                        '<i class="fa-solid fa-circle-exclamation"></i>' +
                    '</div>' +
                    '<h3 style="font-size:1.2rem; font-weight:700; color:var(--text-main); margin-bottom:0.5rem;">Learner\'s Licence application not found in DriveSetu records</h3>' +
                    '<p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.5rem; line-height:1.5;">Learner\'s Licence application was not found for your account. You can continue by entering your Permanent Licence application details manually.</p>' +
                    
                    '<div style="display:flex; justify-content:center; gap:0.75rem;">' +
                        '<button type="button" class="btn btn-primary" onclick="startPermanentManualMode()"><i class="fa-solid fa-pen-to-square"></i> Continue with Manual Application</button>' +
                        '<button type="button" class="btn btn-ghost" onclick="resetPermanentWorkflow()"><i class="fa-solid fa-rotate-left"></i> Try Search Again</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    // ── STEP: FORM (Prefilled or Manual Digital Form 4) ──
    setTimeout(function() {
        renderDocumentChecklistTable("Permanent Licence");
    }, 50);

    var isPrefilled = state.isPrefilled && state.matchedApp;
    var appData = state.matchedApp || {};
    var sd = appData.serviceDetails || {};
    var ad = appData.applicantDetails || {};

    var initialName = isPrefilled ? (appData.name || session.name) : session.name;
    var initialEmail = isPrefilled ? (ad.email || session.email) : session.email;
    var initialMobile = isPrefilled ? (ad.mobile || '9876543210') : '';
    var initialDob = isPrefilled ? (ad.dob || '1998-08-15') : '';
    var initialGender = isPrefilled ? (ad.gender || 'Male') : 'Male';
    var initialParent = isPrefilled ? (ad.parentName || '') : '';
    var initialAddress = isPrefilled ? (ad.address || 'H.No 12-3, Road No 4, Banjara Hills') : '';
    var initialTempAddress = isPrefilled ? (ad.tempAddress || '') : '';
    var initialState = isPrefilled ? (ad.state || 'Telangana') : 'Telangana';
    var initialDistrict = isPrefilled ? (ad.district || 'Hyderabad') : 'Hyderabad';
    var initialPin = isPrefilled ? (ad.pin || '500034') : '';
    var initialLlNum = isPrefilled ? appData.id : '';
    var initialLlDate = isPrefilled ? (appData.date || '2026-07-10') : '';
    var initialRtoCode = isPrefilled ? (sd.rtoCode || 'TG-09') : 'TG-09';
    var initialQualification = isPrefilled ? (ad.qualification || 'Graduate') : 'Graduate';
    var initialIdMarks = isPrefilled ? (ad.idMarks || 'Mole on right wrist') : '';
    var initialBloodGroup = isPrefilled ? (ad.bloodGroup || 'O+') : 'O+';

    var prefillBadge = isPrefilled
        ? '<span class="badge badge-approved" style="font-size:0.75rem; padding:0.2rem 0.6rem; border:1px solid #c2ead8;"><i class="fa-solid fa-circle-check"></i> Fetched from your Learner\'s Licence application</span>'
        : '<span class="badge badge-pending" style="font-size:0.75rem; padding:0.2rem 0.6rem; border:1px solid #ffe7ba;"><i class="fa-solid fa-pen-to-square"></i> Manual Entry</span>';

    // Categories array
    var initialCats = (sd.vehicleClasses && sd.vehicleClasses.length > 0) ? sd.vehicleClasses : ['MCWG', 'LMV'];

    var minTestDate = state.earliestEligibleDate || new Date().toISOString().split('T')[0];

    return '<div class="mb-6"><button class="btn btn-back" onclick="resetPermanentWorkflow()"><i class="fa-solid fa-arrow-left"></i> Change Lookup Mode</button></div>' +
        '<div class="animate-in" style="max-width:850px;">' +
            '<div class="card">' +
                '<div class="flex-between" style="margin-bottom:1rem;">' +
                    '<div>' +
                        '<h2 style="font-size:1.3rem; font-weight:700; color:var(--text-main); margin:0;">Permanent Driving Licence Application</h2>' +
                        '<p style="font-size:0.8rem; color:var(--text-muted); margin:0.2rem 0 0 0;">Digital application based on applicable Form 4 information — DriveSetu Prototype</p>' +
                    '</div>' +
                    prefillBadge +
                '</div>' +

                '<form onsubmit="event.preventDefault(); submitServiceForm(\'Permanent Licence\')">' +
                    
                    '<!-- SECTION 1: Learner\'s Licence Details -->' +
                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem; color:var(--primary); font-weight:700;"><i class="fa-solid fa-graduation-cap"></i> SECTION 1: Learner\'s Licence Details</h4>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Learner\'s Licence Application Number</label><input type="text" id="llNumber" value="' + initialLlNum + '" placeholder="e.g. APP-101" ' + (isPrefilled ? 'readonly style="background:var(--bg);"' : '') + ' required></div>' +
                        '<div class="form-group"><label>Learner\'s Licence Issue Date</label><input type="date" id="llIssueDate" value="' + initialLlDate + '" ' + (isPrefilled ? 'readonly style="background:var(--bg);"' : '') + ' required></div>' +
                    '</div>' +

                    '<!-- SECTION 2: Applicant Details -->' +
                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem; color:var(--primary); font-weight:700;"><i class="fa-solid fa-user"></i> SECTION 2: Applicant Personal Details</h4>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Full Name (as per Aadhaar)</label><input type="text" id="applicantName" value="' + initialName + '" required></div>' +
                        '<div class="form-group"><label>Parent / Guardian / Spouse Name</label><input type="text" id="parentName" value="' + initialParent + '" placeholder="Full name of parent/spouse" required></div>' +
                    '</div>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Date of Birth</label><input type="date" id="applicantDob" value="' + initialDob + '" required></div>' +
                        '<div class="form-group"><label>Gender</label>' +
                            '<select id="applicantGender" required>' +
                                '<option value="Male" ' + (initialGender==='Male'?'selected':'') + '>Male</option>' +
                                '<option value="Female" ' + (initialGender==='Female'?'selected':'') + '>Female</option>' +
                                '<option value="Other" ' + (initialGender==='Other'?'selected':'') + '>Other</option>' +
                            '</select>' +
                        '</div>' +
                    '</div>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Mobile Number</label><input type="tel" id="applicantMobile" value="' + initialMobile + '" placeholder="10-digit mobile number" maxlength="10" required></div>' +
                        '<div class="form-group"><label>Email Address</label><input type="email" id="applicantEmail" value="' + initialEmail + '" required></div>' +
                    '</div>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Applicant Category</label>' +
                            '<select id="applicantCategory" onchange="renderDocumentChecklistTable(\'Permanent Licence\');" required>' +
                                '<option value="Adult">General (Adult)</option>' +
                                '<option value="Transport">Transport (Commercial)</option>' +
                                '<option value="Senior">Senior Citizen</option>' +
                            '</select>' +
                        '</div>' +
                        '<div class="form-group"><label>Educational Qualification</label>' +
                            '<select id="applicantQualification">' +
                                '<option value="Graduate">Graduate / Higher</option>' +
                                '<option value="10th Standard">10th Standard / Matriculation</option>' +
                                '<option value="12th Standard">12th Standard / Higher Secondary</option>' +
                                '<option value="Below 10th">Below 10th Standard</option>' +
                            '</select>' +
                        '</div>' +
                    '</div>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Identification Marks</label><input type="text" id="applicantIdMarks" value="' + initialIdMarks + '" placeholder="e.g. Mole on right wrist"></div>' +
                        '<div class="form-group"><label>Blood Group / Rh Factor</label>' +
                            '<select id="applicantBloodGroup">' +
                                '<option value="O+" ' + (initialBloodGroup==='O+'?'selected':'') + '>O Positive (O+)</option>' +
                                '<option value="O-" ' + (initialBloodGroup==='O-'?'selected':'') + '>O Negative (O-)</option>' +
                                '<option value="A+" ' + (initialBloodGroup==='A+'?'selected':'') + '>A Positive (A+)</option>' +
                                '<option value="A-" ' + (initialBloodGroup==='A-'?'selected':'') + '>A Negative (A-)</option>' +
                                '<option value="B+" ' + (initialBloodGroup==='B+'?'selected':'') + '>B Positive (B+)</option>' +
                                '<option value="B-" ' + (initialBloodGroup==='B-'?'selected':'') + '>B Negative (B-)</option>' +
                                '<option value="AB+" ' + (initialBloodGroup==='AB+'?'selected':'') + '>AB Positive (AB+)</option>' +
                                '<option value="AB-" ' + (initialBloodGroup==='AB-'?'selected':'') + '>AB Negative (AB-)</option>' +
                            '</select>' +
                        '</div>' +
                    '</div>' +
                    '<div class="form-group"><label>Permanent Address</label><input type="text" id="applicantAddress" value="' + initialAddress + '" placeholder="Full residential address" required></div>' +
                    '<div class="form-group"><label>Temporary / Present Address (if different)</label><input type="text" id="applicantTempAddress" value="' + initialTempAddress + '" placeholder="Leave blank if same as permanent address"></div>' +
                    '<div class="grid-3" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem;">' +
                        '<div class="form-group"><label>State</label><input type="text" id="applicantState" value="' + initialState + '" required></div>' +
                        '<div class="form-group"><label>District</label><input type="text" id="applicantDistrict" value="' + initialDistrict + '" required></div>' +
                        '<div class="form-group"><label>PIN Code</label><input type="text" id="applicantPin" value="' + initialPin + '" placeholder="6-digit PIN" maxlength="6" required></div>' +
                    '</div>' +

                    '<!-- SECTION 3: Vehicle Categories -->' +
                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem; color:var(--primary); font-weight:700;"><i class="fa-solid fa-car"></i> SECTION 3: Applied Vehicle Categories (Multiple allowed)</h4>' +
                    '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-md); padding:1rem; margin-bottom:1.5rem;">' +
                        '<label style="font-size:0.82rem; color:var(--text-muted); display:block; margin-bottom:0.75rem;">Select all vehicle categories you wish to include in your Permanent Driving Licence:</label>' +
                        '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem;">' +
                            '<label style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; font-weight:600; cursor:pointer;"><input type="checkbox" name="permanentVehicleCategory" value="MCWOG" ' + (initialCats.indexOf('MCWOG')!==-1?'checked':'') + '> Motorcycle Without Gear (MCWOG)</label>' +
                            '<label style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; font-weight:600; cursor:pointer;"><input type="checkbox" name="permanentVehicleCategory" value="MCWG" ' + (initialCats.indexOf('MCWG')!==-1?'checked':'') + '> Motorcycle With Gear (MCWG)</label>' +
                            '<label style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; font-weight:600; cursor:pointer;"><input type="checkbox" name="permanentVehicleCategory" value="LMV" ' + (initialCats.indexOf('LMV')!==-1?'checked':'') + '> Light Motor Vehicle (LMV - Car/Jeep)</label>' +
                            '<label style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; font-weight:600; cursor:pointer;"><input type="checkbox" name="permanentVehicleCategory" value="Transport Vehicle" ' + (initialCats.indexOf('Transport Vehicle')!==-1?'checked':'') + '> Transport Vehicle (Commercial)</label>' +
                            '<label style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; font-weight:600; cursor:pointer;"><input type="checkbox" name="permanentVehicleCategory" value="Other Category" ' + (initialCats.indexOf('Other Category')!==-1?'checked':'') + '> Other Category</label>' +
                        '</div>' +
                    '</div>' +

                    '<!-- SECTION 4: Declarations -->' +
                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem; color:var(--primary); font-weight:700;"><i class="fa-solid fa-clipboard-check"></i> SECTION 4: Applicable Declarations</h4>' +
                    '<div style="background:#f8faf9; border:1px solid var(--border); border-radius:var(--radius-md); padding:1rem; margin-bottom:1.5rem; font-size:0.82rem;">' +
                        '<label style="display:flex; align-items:flex-start; gap:0.5rem; margin-bottom:0.6rem; cursor:pointer;"><input type="checkbox" checked required> I hereby declare that I am physically fit to drive the requested vehicle categories and do not suffer from any disqualifying disability.</label>' +
                        '<label style="display:flex; align-items:flex-start; gap:0.5rem; margin-bottom:0.6rem; cursor:pointer;"><input type="checkbox" checked required> I confirm that I have read and agree to comply with the Rules of the Road Regulations under the Motor Vehicles Act.</label>' +
                        '<label style="display:flex; align-items:flex-start; gap:0.5rem; cursor:pointer;"><input type="checkbox" checked required> I certify that all information supplied in this digital Form 4 application is true, complete and accurate.</label>' +
                    '</div>' +

                    '<!-- SECTION 5: Required Documents -->' +
                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem; color:var(--primary); font-weight:700;"><i class="fa-solid fa-file-lines"></i> SECTION 5: Required Documents Checklist</h4>' +
                    '<div id="documentChecklistContainer" style="overflow-x:auto; margin-bottom:1.5rem;"></div>' +

                    '<!-- SECTION 6: RTO Test Appointment -->' +
                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem; color:var(--primary); font-weight:700;"><i class="fa-solid fa-calendar-check"></i> SECTION 6: RTO Test Centre & Appointment Availability</h4>' +
                    '<div class="grid-2">' +
                        '<div class="form-group">' +
                            '<label>Preferred RTO Office Code</label>' +
                            '<input type="text" id="preferredRtoCode" value="' + initialRtoCode + '" placeholder="e.g. TG-09, TG-11, TG-03" oninput="lookupRtoForPermanent()" required>' +
                            '<div id="rtoMatchSummary"></div>' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label>Preferred Test Date</label>' +
                            '<input type="date" id="preferredTestDate" min="' + minTestDate + '" required>' +
                        '</div>' +
                    '</div>' +
                    '<div class="form-group" style="margin-bottom:1.5rem;">' +
                        '<label>Preferred 1-Hour Test Slot Window</label>' +
                        '<select id="preferredTimeWindow" required>' +
                            '<option value="">Select 1-Hour Time Window...</option>' +
                            '<option value="10:00 AM - 11:00 AM">10:00 AM – 11:00 AM (Morning Slot 1)</option>' +
                            '<option value="11:00 AM - 12:00 PM">11:00 AM – 12:00 PM (Morning Slot 2)</option>' +
                            '<option value="12:00 PM - 01:00 PM">12:00 PM – 01:00 PM (Midday Slot)</option>' +
                            '<option value="02:00 PM - 03:00 PM">02:00 PM – 03:00 PM (Afternoon Slot 1)</option>' +
                            '<option value="03:00 PM - 04:00 PM">03:00 PM – 04:00 PM (Afternoon Slot 2)</option>' +
                        '</select>' +
                        '<small style="color:var(--text-muted); font-size:0.75rem; display:block; margin-top:0.2rem;">Prototype Test Appointment: Actual live availability will be allocated within this window.</small>' +
                    '</div>' +

                    '<button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding:0.8rem; font-size:1rem;"><i class="fa-solid fa-paper-plane"></i> Submit Permanent Licence Application</button>' +
                '</form>' +
            '</div>' +
        '</div>';
}

function renderPermanentSuccess(app) {
    var sd = app.serviceDetails || {};
    var ad = app.applicantDetails || {};
    var catsStr = (app.vehicleClasses && app.vehicleClasses.length > 0) ? app.vehicleClasses.join(', ') : 'MCWG, LMV';

    return '<div class="animate-in" style="max-width:700px; margin: 2rem auto;">' +
        '<div class="card" style="padding: 2.5rem 2rem;">' +
            '<div style="width:72px; height:72px; border-radius:50%; background:var(--primary-light); color:var(--primary); font-size:2.2rem; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem auto;">' +
                '<i class="fa-solid fa-circle-check"></i>' +
            '</div>' +
            '<h2 style="font-size:1.45rem; font-weight:700; color:var(--text-main); margin-bottom:0.3rem; text-align:center;">Permanent Driving Licence Application Submitted</h2>' +
            '<p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:1.5rem; text-align:center;">✓ Digital Form 4 Application Logged Successfully</p>' +
            
            '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem;">' +
                '<div class="flex-between" style="padding:0.45rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;"><span style="color:var(--text-muted);">Application ID:</span><strong>' + app.id + '</strong></div>' +
                '<div class="flex-between" style="padding:0.45rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;"><span style="color:var(--text-muted);">Service:</span><strong>Permanent Driving Licence</strong></div>' +
                '<div class="flex-between" style="padding:0.45rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;"><span style="color:var(--text-muted);">Application Source:</span><strong>' + (app.source || 'Digital Application') + '</strong></div>' +
                '<div class="flex-between" style="padding:0.45rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;"><span style="color:var(--text-muted);">Learner\'s Licence Number:</span><strong>' + (sd.llNumber || app.learnerLicenceApplicationId || 'N/A') + '</strong></div>' +
                '<div class="flex-between" style="padding:0.45rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;"><span style="color:var(--text-muted);">Selected Vehicle Categories:</span><strong>' + catsStr + '</strong></div>' +
                '<div class="flex-between" style="padding:0.45rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;"><span style="color:var(--text-muted);">RTO Test Centre:</span><strong>' + (sd.rtoOfficeName || 'RTA Hyderabad Central') + ' (' + (sd.rtoCode || 'TG-09') + ')</strong></div>' +
                '<div class="flex-between" style="padding:0.45rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;"><span style="color:var(--text-muted);">RTO Address:</span><strong style="text-align:right; max-width:60%;">' + (sd.rtoAddress || 'Khairatabad, Hyderabad') + '</strong></div>' +
                '<div class="flex-between" style="padding:0.45rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;"><span style="color:var(--text-muted);">Allocated Test Date:</span><strong>' + (sd.allocatedTestDate || sd.preferredTestDate || 'Scheduled') + '</strong></div>' +
                '<div class="flex-between" style="padding:0.45rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;"><span style="color:var(--text-muted);">Allocated Test Time Slot:</span><strong>' + (sd.allocatedTestStartTime || '10:00 AM') + ' - ' + (sd.allocatedTestEndTime || '11:00 AM') + '</strong></div>' +
                '<div class="flex-between" style="padding:0.45rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">Current Status:</span><span class="badge badge-pending">● Test Scheduled</span></div>' +
            '</div>' +

            '<div style="background:#f8faf9; border:1px solid var(--border); border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem;">' +
                '<h4 style="font-size:0.9rem; font-weight:700; color:var(--text-main); margin-bottom:0.4rem;"><i class="fa-solid fa-car-side" style="color:var(--primary);"></i> Driving Test Appointment</h4>' +
                '<p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:0.85rem; line-height:1.5;">Your driving test will be conducted at the designated test centre. The DriveSetu test-centre system will capture the test recording and vehicle/sensor data during the test.</p>' +
                '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.75rem; font-size:0.82rem; text-align:center;">' +
                    '<div style="background:#fff; border:1px solid var(--border); padding:0.65rem; border-radius:6px;">' +
                        '<div style="color:var(--text-muted); font-size:0.75rem;">Test Evidence</div>' +
                        '<strong style="color:#d46b08; display:block; margin-top:0.2rem;">○ Awaiting Driving Test</strong>' +
                    '</div>' +
                    '<div style="background:#fff; border:1px solid var(--border); padding:0.65rem; border-radius:6px;">' +
                        '<div style="color:var(--text-muted); font-size:0.75rem;">AI Analysis</div>' +
                        '<strong style="color:#d46b08; display:block; margin-top:0.2rem;">○ Awaiting Driving Test</strong>' +
                    '</div>' +
                    '<div style="background:#fff; border:1px solid var(--border); padding:0.65rem; border-radius:6px;">' +
                        '<div style="color:var(--text-muted); font-size:0.75rem;">RTO Review</div>' +
                        '<strong style="color:var(--text-muted); display:block; margin-top:0.2rem;">○ Not Started</strong>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<div style="display:flex; gap:0.75rem;">' +
                '<button type="button" class="btn btn-primary" style="flex:1; justify-content:center;" onclick="downloadPermanentApplicationPdf(\'' + app.id + '\')"><i class="fa-solid fa-file-pdf"></i> Download Application PDF</button>' +
                '<button type="button" class="btn btn-ghost" onclick="window.location.hash=\'citizen-driving-test\'"><i class="fa-solid fa-car-side"></i> View Driving Test Status</button>' +
            '</div>' +
        '</div>' +
    '</div>';
}

function renderAdditionPage(session) {
    setupServiceDocsAndEvidence("Addition of Class");
    
    setTimeout(function() {
        renderDocumentChecklistTable("Addition of Class");
        renderTestEvidenceSection("Addition of Class");
    }, 50);

    return '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-arrow-left"></i> Back to Services</button></div>' +
        '<div class="animate-in" style="max-width:850px;">' +
            '<div class="card">' +
                '<div class="card-title">Application for Addition of Class to Existing Driving Licence</div>' +
                '<form onsubmit="event.preventDefault(); submitServiceForm(\'Addition of Class\')">' +
                    
                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem;">Applicant Details</h4>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Full Name</label><input type="text" id="applicantName" value="' + session.name + '" required></div>' +
                        '<div class="form-group"><label>Email Address</label><input type="email" id="applicantEmail" value="' + session.email + '" required></div>' +
                    '</div>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Mobile Number</label><input type="tel" id="applicantMobile" placeholder="10-digit number" maxlength="10" required></div>' +
                        '<div class="form-group"><label>Date of Birth</label><input type="date" id="applicantDob" required></div>' +
                    '</div>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Gender</label>' +
                            '<select id="applicantGender" required>' +
                                '<option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>' +
                            '</select>' +
                        '</div>' +
                        '<div class="form-group"><label>Applicant Category</label>' +
                            '<select id="applicantCategory" onchange="renderDocumentChecklistTable(\'Addition of Class\');" required>' +
                                '<option value="Adult">General (Adult)</option>' +
                                '<option value="Transport">Transport (Commercial)</option>' +
                                '<option value="Senior">Senior Citizen</option>' +
                            '</select>' +
                        '</div>' +
                    '</div>' +
                    '<div class="form-group"><label>Residential Address</label><input type="text" id="applicantAddress" placeholder="Full residential address" required></div>' +

                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem;">Licence Credentials</h4>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Existing DL Number</label><input type="text" id="existingDlNumber" placeholder="e.g. TS00920210045612" required></div>' +
                        '<div class="form-group"><label>Learner Licence Number for New Category</label><input type="text" id="llNewNumber" placeholder="e.g. TS009/LL/2026/A" required></div>' +
                    '</div>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Current Vehicle Class</label>' +
                            '<select id="currentVehicleClass" required>' +
                                '<option value="">Select...</option>' +
                                '<option value="MCWG">Motor Cycle With Gear (MCWG)</option>' +
                                '<option value="LMV">Light Motor Vehicle (LMV)</option>' +
                            '</select>' +
                        '</div>' +
                        '<div class="form-group"><label>New Vehicle Class Requested</label>' +
                            '<select id="newVehicleClass" required>' +
                                '<option value="">Select...</option>' +
                                '<option value="LMV">Light Motor Vehicle (LMV)</option>' +
                                '<option value="HMV">Heavy Motor Vehicle (HMV)</option>' +
                            '</select>' +
                        '</div>' +
                    '</div>' +

                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem;">Required Documents Checklist</h4>' +
                    '<div id="documentChecklistContainer" style="overflow-x:auto; margin-bottom:1.5rem;"></div>' +

                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem;">New Category AI Test Evidence</h4>' +
                    '<div class="alert-info-box" style="margin-bottom:0.75rem;">' +
                        '<i class="fa-solid fa-circle-info"></i> Upload track telemetry video and PDF audit report validating competency on the newly requested class.' +
                    '</div>' +
                    '<div id="testEvidenceContainer" style="margin-bottom:1.5rem;"></div>' +

                    '<button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding:0.75rem;"><i class="fa-solid fa-paper-plane"></i> Submit Addition of Class Application</button>' +
                '</form>' +
            '</div>' +
        '</div>';
}

function renderIdpPage(session) {
    setupServiceDocsAndEvidence("International Driving Permit");
    
    setTimeout(function() {
        renderDocumentChecklistTable("International Driving Permit");
    }, 50);

    return '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-arrow-left"></i> Back to Services</button></div>' +
        '<div class="animate-in" style="max-width:850px;">' +
            '<div class="card">' +
                '<div class="card-title">Application for International Driving Permit (IDP)</div>' +
                '<form onsubmit="event.preventDefault(); submitServiceForm(\'International Driving Permit\')">' +
                    
                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem;">Applicant Details</h4>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Full Name</label><input type="text" id="applicantName" value="' + session.name + '" required></div>' +
                        '<div class="form-group"><label>Email Address</label><input type="email" id="applicantEmail" value="' + session.email + '" required></div>' +
                    '</div>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Mobile Number</label><input type="tel" id="applicantMobile" placeholder="10-digit number" maxlength="10" required></div>' +
                        '<div class="form-group"><label>Date of Birth</label><input type="date" id="applicantDob" required></div>' +
                    '</div>' +
                    '<div class="form-group"><label>Residential Address</label><input type="text" id="applicantAddress" placeholder="Full residential address" required></div>' +

                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem;">Permit Credentials & Travel Details</h4>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Indian DL Number</label><input type="text" id="indianDlNumber" placeholder="e.g. TS00920220045678" required></div>' +
                        '<div class="form-group"><label>Countries to be Visited</label><input type="text" id="countriesToVisit" placeholder="e.g. USA, Germany, Japan" required></div>' +
                    '</div>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Travel Information / Ticket details</label><input type="text" id="travelInfo" placeholder="e.g. Flight AI-101 / Visa details" required></div>' +
                        '<div class="form-group"><label>Vehicle Categories Requested</label>' +
                            '<select id="vehicleCategoriesRequested" required>' +
                                '<option value="Motorcycle">Motorcycle</option>' +
                                '<option value="LMV">Light Motor Vehicle (Car/LMV)</option>' +
                                '<option value="Both">Both Motorcycle and LMV</option>' +
                            '</select>' +
                        '</div>' +
                    '</div>' +

                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem;">Required Documents Checklist</h4>' +
                    '<div id="documentChecklistContainer" style="overflow-x:auto; margin-bottom:1.5rem;"></div>' +

                    '<button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding:0.75rem;"><i class="fa-solid fa-paper-plane"></i> Submit IDP Permit Application</button>' +
                '</form>' +
            '</div>' +
        '</div>';
}

function renderRenewalPage(session) {
    setupServiceDocsAndEvidence("Renewal");
    
    setTimeout(function() {
        renderDocumentChecklistTable("Renewal");
    }, 50);

    return '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-arrow-left"></i> Back to Services</button></div>' +
        '<div class="animate-in" style="max-width:850px;">' +
            '<div class="card">' +
                '<div class="card-title">Application for Driving Licence Renewal</div>' +
                '<form onsubmit="event.preventDefault(); submitServiceForm(\'Renewal\')">' +
                    
                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem;">Applicant Details</h4>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Full Name</label><input type="text" id="applicantName" value="' + session.name + '" required></div>' +
                        '<div class="form-group"><label>Email Address</label><input type="email" id="applicantEmail" value="' + session.email + '" required></div>' +
                    '</div>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Mobile Number</label><input type="tel" id="applicantMobile" placeholder="10-digit number" maxlength="10" required></div>' +
                        '<div class="form-group"><label>Date of Birth</label><input type="date" id="applicantDob" required></div>' +
                    '</div>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Gender</label>' +
                            '<select id="applicantGender" required>' +
                                '<option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>' +
                            '</select>' +
                        '</div>' +
                        '<div class="form-group"><label>Applicant Category</label>' +
                            '<select id="applicantCategory" onchange="renderDocumentChecklistTable(\'Renewal\');" required>' +
                                '<option value="Adult">General (Adult)</option>' +
                                '<option value="Transport">Transport (Commercial)</option>' +
                                '<option value="Senior">Senior Citizen</option>' +
                            '</select>' +
                        '</div>' +
                    '</div>' +
                    '<div class="form-group"><label>Residential Address</label><input type="text" id="applicantAddress" placeholder="Full residential address" required></div>' +

                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem;">Existing Licence Credentials</h4>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Driving Licence Number</label><input type="text" id="dlNumber" placeholder="e.g. TS00920200041234" required></div>' +
                        '<div class="form-group"><label>Licence Issue Date</label><input type="date" id="dlIssueDate" required></div>' +
                    '</div>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Licence Expiry Date</label><input type="date" id="dlExpiryDate" onchange="checkExpiryWarning();" required></div>' +
                        '<div class="form-group"><label>Vehicle Category</label>' +
                            '<select id="vehicleCategory" required>' +
                                '<option value="MCWG">MCWG (Motor Cycle)</option>' +
                                '<option value="LMV">LMV (Car)</option>' +
                                '<option value="HMV">HMV (Heavy/Transport)</option>' +
                            '</select>' +
                        '</div>' +
                    '</div>' +
                    
                    '<div id="expiryWarningBox" style="display:none;" class="alert-warning-box">' +
                        '<strong>Warning:</strong> Your driving licence expiry exceeds the grace period. According to RTO regulations, you may be required to pass a competency retest before licence re-issuance.' +
                    '</div>' +

                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem;">Required Documents Checklist</h4>' +
                    '<div id="documentChecklistContainer" style="overflow-x:auto; margin-bottom:1.5rem;"></div>' +

                    '<button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding:0.75rem;"><i class="fa-solid fa-paper-plane"></i> Submit Renewal Application</button>' +
                '</form>' +
            '</div>' +
        '</div>';
}

function checkExpiryWarning() {
    var exp = document.getElementById('dlExpiryDate').value;
    var warning = document.getElementById('expiryWarningBox');
    if (exp && warning) {
        var expYear = new Date(exp).getFullYear();
        var currentYear = new Date().getFullYear();
        if (expYear < currentYear - 1) {
            warning.style.display = 'block';
        } else {
            warning.style.display = 'none';
        }
    }
}

function renderDuplicatePage(session) {
    setupServiceDocsAndEvidence("Duplicate");
    
    setTimeout(function() {
        renderDocumentChecklistTable("Duplicate");
    }, 50);

    return '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-arrow-left"></i> Back to Services</button></div>' +
        '<div class="animate-in" style="max-width:850px;">' +
            '<div class="card">' +
                '<div class="card-title">Application for Duplicate Driving Licence</div>' +
                '<form onsubmit="event.preventDefault(); submitServiceForm(\'Duplicate\')">' +
                    
                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem;">Applicant Details</h4>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Full Name</label><input type="text" id="applicantName" value="' + session.name + '" required></div>' +
                        '<div class="form-group"><label>Email Address</label><input type="email" id="applicantEmail" value="' + session.email + '" required></div>' +
                    '</div>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Mobile Number</label><input type="tel" id="applicantMobile" placeholder="10-digit number" maxlength="10" required></div>' +
                        '<div class="form-group"><label>Date of Birth</label><input type="date" id="applicantDob" required></div>' +
                    '</div>' +
                    '<div class="form-group"><label>Residential Address</label><input type="text" id="applicantAddress" placeholder="Full residential address" required></div>' +

                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem;">Duplicate Request details</h4>' +
                    '<div class="grid-2">' +
                        '<div class="form-group"><label>Existing DL Number</label><input type="text" id="dlNumber" placeholder="e.g. TS00920200041234" required></div>' +
                        '<div class="form-group"><label>Reason for Duplicate</label>' +
                            '<select id="duplicateReason" onchange="renderDocumentChecklistTable(\'Duplicate\'); toggleDuplicateFields();" required>' +
                                '<option value="Lost">Lost / Destroyed</option>' +
                                '<option value="Defaced">Defaced / Torn</option>' +
                                '<option value="Photo">Photograph Replacement</option>' +
                            '</select>' +
                        '</div>' +
                    '</div>' +
                    
                    '<div id="lostCircumstancesField" class="form-group">' +
                        '<label>Circumstances of Loss/Destruction <span class="text-danger">*</span></label>' +
                        '<textarea id="circumstances" placeholder="State circumstances of loss, e.g. wallet stolen, house fire..." style="width:100%; min-height:60px; padding:0.6rem; border:1px solid var(--border); border-radius:var(--radius-sm); font-family:inherit; font-size:0.88rem;"></textarea>' +
                    '</div>' +

                    '<h4 style="margin: 1.5rem 0 0.75rem 0; font-size: 0.95rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem;">Required Documents Checklist</h4>' +
                    '<div id="documentChecklistContainer" style="overflow-x:auto; margin-bottom:1.5rem;"></div>' +

                    '<button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding:0.75rem;"><i class="fa-solid fa-paper-plane"></i> Submit Duplicate DL Application</button>' +
                '</form>' +
            '</div>' +
        '</div>';
}

function toggleDuplicateFields() {
    var reason = document.getElementById('duplicateReason').value;
    var field = document.getElementById('lostCircumstancesField');
    if (field) {
        field.style.display = (reason === 'Lost') ? 'block' : 'none';
        var textarea = document.getElementById('circumstances');
        if (textarea) {
            if (reason === 'Lost') textarea.setAttribute('required', 'true');
            else textarea.removeAttribute('required');
        }
    }
}

// ─── SERVICE FORMS SUBMISSION & SUCCESS RENDERING ───

function submitServiceForm(licenceType) {
    var session = safeParseJSON(sessionStorage.getItem('citizenSession'), null);
    if (!session) {
        alert('Authentication error. Please log in again.');
        return;
    }
    
    var name = document.getElementById('applicantName').value.trim();
    var dob = document.getElementById('applicantDob') ? document.getElementById('applicantDob').value : '';
    var gender = document.getElementById('applicantGender') ? document.getElementById('applicantGender').value : 'Male';
    var address = document.getElementById('applicantAddress') ? document.getElementById('applicantAddress').value.trim() : '';
    var mobile = document.getElementById('applicantMobile') ? document.getElementById('applicantMobile').value.trim() : '';
    var email = document.getElementById('applicantEmail') ? document.getElementById('applicantEmail').value.trim() : '';
    var category = document.getElementById('applicantCategory') ? document.getElementById('applicantCategory').value : 'Adult';
    
    if (!name) { alert('Full Name is required.'); return; }
    if (dob === '') { alert('Date of Birth is required.'); return; }
    if (address === '') { alert('Address is required.'); return; }
    if (mobile === '' || mobile.length !== 10 || isNaN(mobile)) { alert('Please enter a valid 10-digit mobile number.'); return; }
    
    var serviceDetails = {};
    var requireEvidence = false;
    
    if (licenceType === "Learner's Licence") {
        var llCheck = checkCitizenLLEligibility(session);
        if (!llCheck.isEligible) {
            alert(llCheck.reason);
            window.location.hash = 'citizen-track';
            return;
        }

        var state = document.getElementById('applicantState').value.trim();
        var district = document.getElementById('applicantDistrict').value.trim();
        var pin = document.getElementById('applicantPin').value.trim();
        var aadhaarNum = document.getElementById('aadhaarNumber').value.trim();
        
        if (!state) { alert('State is required.'); return; }
        if (!district) { alert('District is required.'); return; }
        if (!pin || pin.length !== 6 || isNaN(pin)) { alert('Please enter a valid 6-digit PIN Code.'); return; }
        if (!aadhaarNum || aadhaarNum.length !== 12 || isNaN(aadhaarNum)) {
            alert('Aadhaar number must be exactly 12 digits.');
            return;
        }
        
        var checkboxes = document.getElementsByName('vehicleCategory');
        var selectedCats = [];
        for (var c = 0; c < checkboxes.length; c++) {
            if (checkboxes[c].checked) {
                selectedCats.push(checkboxes[c].value);
            }
        }
        if (selectedCats.length === 0) {
            alert('Please select at least one Vehicle Category.');
            return;
        }
        
        var prefDate = document.getElementById('preferredTestDate').value;
        var prefWindow = document.getElementById('preferredTimeWindow').value;
        var prefRto = document.getElementById('preferredRtoCode').value.trim().toUpperCase().replace('TS', 'TG');
        
        if (!prefDate) { alert('Preferred test date is required.'); return; }
        if (!prefWindow) { alert('Preferred time window is required.'); return; }
        if (!prefRto) { alert('Preferred RTO office code is required.'); return; }
        
        var foundRto = null;
        for (var r = 0; r < rtoDirectory.length; r++) {
            if (rtoDirectory[r].rtoCode === prefRto) {
                foundRto = rtoDirectory[r];
                break;
            }
        }
        if (!foundRto) {
            alert('RTO office not found. Please check the office code.');
            return;
        }
        
        // Automatic Test Slot Allocation
        var allocated = allocateTestSlot(prefDate, prefWindow);
        
        serviceDetails.state = state;
        serviceDetails.district = district;
        serviceDetails.pin = pin;
        serviceDetails.aadhaarNumber = aadhaarNum;
        serviceDetails.vehicleClasses = selectedCats;
        serviceDetails.applicantCategory = category;
        
        serviceDetails.preferredTestDate = prefDate;
        serviceDetails.preferredTestStartTime = prefWindow.split('-')[0].trim();
        serviceDetails.preferredTestEndTime = prefWindow.split('-')[1] ? prefWindow.split('-')[1].trim() : prefWindow.split('-')[0].trim();
        
        serviceDetails.rtoCode = foundRto.rtoCode;
        serviceDetails.rtoOfficeName = foundRto.officeName;
        serviceDetails.rtoAddress = foundRto.address;
        
        serviceDetails.allocatedTestDate = allocated.date;
        serviceDetails.allocatedTestStartTime = allocated.time;
        // Deterministic allocation details
        var hrParts = allocated.time.split(':');
        var hrVal = parseInt(hrParts[0]);
        var minParts = hrParts[1].split(' ');
        var minVal = parseInt(minParts[0]) + 15; // end time is +15 minutes
        var ampmVal = minParts[1];
        if (minVal >= 60) {
            minVal = minVal - 60;
            hrVal = hrVal + 1;
            if (hrVal === 12) ampmVal = (ampmVal === 'AM') ? 'PM' : 'AM';
            else if (hrVal > 12) hrVal = 1;
        }
        serviceDetails.allocatedTestEndTime = (hrVal < 10 ? '0' + hrVal : String(hrVal)) + ':' + (minVal < 10 ? '0' + minVal : String(minVal)) + ' ' + ampmVal;
        
        serviceDetails.appointmentStatus = 'Scheduled';
        
        serviceDetails.parentName = document.getElementById('parentName') ? document.getElementById('parentName').value.trim() : '';
        if (category === 'Minor' && !serviceDetails.parentName) {
            alert('Parent/Guardian Name is required for minors.');
            return;
        }
    } else if (licenceType === "Permanent Licence") {
        var dlCheck = checkCitizenDLEligibility(session);
        if (!dlCheck.isEligible) {
            alert(dlCheck.reason);
            window.location.hash = 'citizen-track';
            return;
        }

        var llNum = document.getElementById('llNumber').value.trim();
        var llDate = document.getElementById('llIssueDate').value;
        var parentName = document.getElementById('parentName') ? document.getElementById('parentName').value.trim() : '';
        var state = document.getElementById('applicantState') ? document.getElementById('applicantState').value.trim() : 'Telangana';
        var district = document.getElementById('applicantDistrict') ? document.getElementById('applicantDistrict').value.trim() : 'Hyderabad';
        var pin = document.getElementById('applicantPin') ? document.getElementById('applicantPin').value.trim() : '500004';
        var tempAddress = document.getElementById('applicantTempAddress') ? document.getElementById('applicantTempAddress').value.trim() : '';
        var qualification = document.getElementById('applicantQualification') ? document.getElementById('applicantQualification').value : 'Graduate';
        var idMarks = document.getElementById('applicantIdMarks') ? document.getElementById('applicantIdMarks').value.trim() : '';
        var bloodGroup = document.getElementById('applicantBloodGroup') ? document.getElementById('applicantBloodGroup').value : 'O+';

        if (!llNum) { alert('Learner\'s Licence Application Number / LL Number is required.'); return; }
        if (!llDate) { alert('Learner\'s Licence Issue Date is required.'); return; }
        if (!parentName) { alert('Parent / Guardian / Spouse Name is required.'); return; }

        var checkboxes = document.getElementsByName('permanentVehicleCategory');
        var selectedCats = [];
        for (var pc = 0; pc < checkboxes.length; pc++) {
            if (checkboxes[pc].checked) {
                selectedCats.push(checkboxes[pc].value);
            }
        }
        if (selectedCats.length === 0) {
            alert('Please select at least one Applied Vehicle Category.');
            return;
        }

        var prefRto = document.getElementById('preferredRtoCode') ? document.getElementById('preferredRtoCode').value.trim().toUpperCase().replace('TS', 'TG') : 'TG-09';
        var prefDate = document.getElementById('preferredTestDate') ? document.getElementById('preferredTestDate').value : '';
        var prefWindow = document.getElementById('preferredTimeWindow') ? document.getElementById('preferredTimeWindow').value : '';

        if (!prefRto) { alert('Preferred RTO office code is required.'); return; }
        if (!prefDate) { alert('Preferred test date is required.'); return; }
        if (!prefWindow) { alert('Preferred time window is required.'); return; }

        var foundRto = null;
        for (var r = 0; r < rtoDirectory.length; r++) {
            if (rtoDirectory[r].rtoCode === prefRto) {
                foundRto = rtoDirectory[r];
                break;
            }
        }
        if (!foundRto) {
            alert('RTO office not found for code ' + prefRto + '. Please check the office code (e.g. TG-09, TG-11).');
            return;
        }

        var allocated = allocateTestSlot(prefDate, prefWindow);

        serviceDetails.llNumber = llNum;
        serviceDetails.llIssueDate = llDate;
        serviceDetails.vehicleClasses = selectedCats;
        serviceDetails.vehicleClass = selectedCats.join(', ');
        serviceDetails.applicantCategory = category;
        
        serviceDetails.parentName = parentName;
        serviceDetails.tempAddress = tempAddress;
        serviceDetails.state = state;
        serviceDetails.district = district;
        serviceDetails.pin = pin;
        serviceDetails.qualification = qualification;
        serviceDetails.idMarks = idMarks;
        serviceDetails.bloodGroup = bloodGroup;

        serviceDetails.preferredTestDate = prefDate;
        serviceDetails.preferredTestStartTime = prefWindow.split('-')[0] ? prefWindow.split('-')[0].trim() : '10:00 AM';
        serviceDetails.preferredTestEndTime = prefWindow.split('-')[1] ? prefWindow.split('-')[1].trim() : '11:00 AM';

        serviceDetails.rtoCode = foundRto.rtoCode;
        serviceDetails.rtoOfficeName = foundRto.officeName;
        serviceDetails.rtoAddress = foundRto.address;

        serviceDetails.allocatedTestDate = allocated.date;
        serviceDetails.allocatedTestStartTime = allocated.time;
        serviceDetails.allocatedTestEndTime = '11:00 AM';
        serviceDetails.appointmentStatus = 'Scheduled';
        serviceDetails.evidenceStatus = 'Awaiting Driving Test';

        requireEvidence = false;
    } else if (licenceType === "Addition of Class") {
        var existingDl = document.getElementById('existingDlNumber').value.trim();
        var currentClass = document.getElementById('currentVehicleClass').value;
        var newClass = document.getElementById('newVehicleClass').value;
        var llNewNum = document.getElementById('llNewNumber').value.trim();
        if (!existingDl) { alert('Existing Driving Licence Number is required.'); return; }
        if (!currentClass) { alert('Please select current vehicle class.'); return; }
        if (!newClass) { alert('Please select new vehicle class requested.'); return; }
        if (currentClass === newClass) { alert('New category must be different from current category.'); return; }
        if (!llNewNum) { alert('Learner Licence Number for new category is required.'); return; }
        
        serviceDetails.existingDlNumber = existingDl;
        serviceDetails.currentVehicleClass = currentClass;
        serviceDetails.newVehicleClass = newClass;
        serviceDetails.llNewNumber = llNewNum;
        serviceDetails.applicantCategory = category;
        
        requireEvidence = true;
    } else if (licenceType === "International Driving Permit") {
        var dlNum = document.getElementById('indianDlNumber').value.trim();
        var countries = document.getElementById('countriesToVisit').value.trim();
        var travelInfo = document.getElementById('travelInfo').value.trim();
        var vehicleCats = document.getElementById('vehicleCategoriesRequested').value;
        if (!dlNum) { alert('Indian Driving Licence Number is required.'); return; }
        if (!countries) { alert('Please enter countries to be visited.'); return; }
        if (!travelInfo) { alert('Please enter travel information (e.g. Visa/ticket details).'); return; }
        if (!vehicleCats) { alert('Please select vehicle categories.'); return; }
        
        serviceDetails.indianDlNumber = dlNum;
        serviceDetails.countriesToVisit = countries;
        serviceDetails.travelInfo = travelInfo;
        serviceDetails.vehicleCategoriesRequested = vehicleCats;
    } else if (licenceType === "Renewal") {
        var dlNum = document.getElementById('dlNumber').value.trim();
        var issueDate = document.getElementById('dlIssueDate').value;
        var expiryDate = document.getElementById('dlExpiryDate').value;
        var vehicleCat = document.getElementById('vehicleCategory').value;
        if (!dlNum) { alert('Driving Licence Number is required.'); return; }
        if (!issueDate) { alert('Licence Issue Date is required.'); return; }
        if (!expiryDate) { alert('Licence Expiry Date is required.'); return; }
        if (!vehicleCat) { alert('Please select a Vehicle Category.'); return; }
        
        serviceDetails.dlNumber = dlNum;
        serviceDetails.dlIssueDate = issueDate;
        serviceDetails.dlExpiryDate = expiryDate;
        serviceDetails.vehicleCategory = vehicleCat;
        serviceDetails.applicantCategory = category;
    } else if (licenceType === "Duplicate") {
        var dlNum = document.getElementById('dlNumber').value.trim();
        var reason = document.getElementById('duplicateReason').value;
        var details = document.getElementById('circumstances') ? document.getElementById('circumstances').value.trim() : '';
        if (!dlNum) { alert('Existing Driving Licence Number is required.'); return; }
        if (reason === 'Lost' && !details) {
            alert('Please describe the circumstances of loss/destruction.');
            return;
        }
        
        serviceDetails.dlNumber = dlNum;
        serviceDetails.duplicateReason = reason;
        serviceDetails.circumstances = details;
    }
    
    var docConfigs = getDocumentConfigs(licenceType);
    for (var i = 0; i < docConfigs.length; i++) {
        var doc = docConfigs[i];
        
        var active = true;
        if (licenceType === "Learner's Licence") {
            if (doc.id === 'parent_declaration') active = (category === 'Minor');
            if (doc.id === 'form_1a') active = (category === 'Minor' || category === 'Transport' || category === 'Senior');
        } else if (licenceType === "Permanent Licence") {
            if (doc.id === 'form_5') active = (category === 'Transport');
        } else if (licenceType === "Addition of Class") {
            if (doc.id === 'form_1a') active = (category === 'Senior' || category === 'Transport');
            if (doc.id === 'form_5') active = (category === 'Transport');
        } else if (licenceType === "Renewal") {
            if (doc.id === 'form_1a') active = (category === 'Senior' || category === 'Transport');
        } else if (licenceType === "Duplicate") {
            if (doc.id === 'defaced_dl') active = (reason === 'Defaced');
            if (doc.id === 'photo_replacement') active = (reason === 'Photo');
            if (doc.id === 'old_dl_copy') active = false;
        }
        
        if (active && doc.type === 'required') {
            var docState = window.currentApplicationDocs[doc.id];
            if (!docState || !docState.fileName) {
                alert('Please upload mandatory document: ' + doc.name);
                return;
            }
        }
    }
    
    var testEvidenceObj = null;
    if (requireEvidence) {
        var video = window.currentTestEvidence.video;
        var aiReport = window.currentTestEvidence.aiReport;
        if (!video.fileName) {
            alert('Please upload the Driving Test Video.');
            return;
        }
        if (!aiReport.fileName) {
            alert('Please upload the AI Driving Analysis Report PDF.');
            return;
        }
        testEvidenceObj = {
            video: {
                fileName: video.fileName,
                fileSize: video.fileSize,
                fileType: video.fileType,
                timestamp: video.timestamp,
                dataUrl: video.dataUrl,
                status: 'Uploaded'
            },
            aiReport: {
                fileName: aiReport.fileName,
                fileSize: aiReport.fileSize,
                fileType: aiReport.fileType,
                timestamp: aiReport.timestamp,
                dataUrl: aiReport.dataUrl,
                status: 'Uploaded'
            },
            locked: true
        };
    }
    
    var apps = getStoredApplications();
    var reviews = getStoredReviews();
    var newId = 'APP-' + String(Date.now()).slice(-3) + String(Math.floor(100 + Math.random() * 900));
    
    var savedDocs = [];
    var currentDocIds = Object.keys(window.currentApplicationDocs);
    for (var k = 0; k < currentDocIds.length; k++) {
        var docId = currentDocIds[k];
        var d = window.currentApplicationDocs[docId];
        if (d.fileName) {
            savedDocs.push({
                id: d.id,
                name: d.name,
                fileName: d.fileName,
                fileSize: d.fileSize,
                fileType: d.fileType,
                status: 'Submitted',
                dataUrl: d.dataUrl
            });
        }
    }
    
    var appDetailsObj = {
        fullName: name,
        dob: dob,
        gender: gender,
        address: address,
        mobile: mobile,
        email: email
    };
    
    var nextWorkflow = 'RTO Officer Document Review';
    if (licenceType === "Learner's Licence") {
        nextWorkflow = 'Document Verification';
    } else if (requireEvidence) {
        nextWorkflow = 'RTO Officer AI Track & Video Telemetry Audit';
    } else if (licenceType === "Renewal") {
        var expYear = new Date(expiryDate).getFullYear();
        var currentYear = new Date().getFullYear();
        if (expYear < currentYear - 1) {
            nextWorkflow = 'DL Retest required due to expiration period exceeding 1 year';
        }
    }
    
    var newApp = {
        id: newId,
        name: name,
        type: licenceType,
        status: (licenceType === "Learner's Licence") ? 'Submitted' : 'Pending',
        date: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'}),
        citizenId: session.email,
        applicantDetails: appDetailsObj,
        serviceDetails: serviceDetails,
        documents: savedDocs,
        testEvidence: testEvidenceObj,
        reviewStage: requireEvidence ? 'AI Track Audit' : 'Document Verification',
        assignedOfficer: '',
        reviewHistory: [],
        remarks: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'Digital Application (DriveSetu Portal)'
    };

    // Random allotment among the 3 RTO Officers: Officer Annan, Officer Rahil, and Officer Srivathsav
    var officerPool = [
        { officerId: 'OFF-ANNAN', email: 'annan@drivesetu.com', name: 'Officer Annan', rtoCode: 'TG-03' },
        { officerId: 'OFF-RAHIL', email: 'rahil@drivesetu.com', name: 'Officer Rahil', rtoCode: 'TG-05' },
        { officerId: 'OFF-SRIVATHSAV', email: 'srivathsav@drivesetu.com', name: 'Officer Srivathsav', rtoCode: 'TG-08' }
    ];
    var assignedOfficerObj = officerPool[Math.floor(Math.random() * officerPool.length)];

    newApp.assignedOfficerEmail = assignedOfficerObj.email;
    newApp.assignedOfficerId = assignedOfficerObj.officerId;
    newApp.assignedOfficerName = assignedOfficerObj.name;
    newApp.assignedOfficer = assignedOfficerObj.name;
    newApp.evaluator1 = {
        officerId: assignedOfficerObj.officerId,
        rtoCode: assignedOfficerObj.rtoCode,
        name: assignedOfficerObj.name,
        decision: null,
        reason: null
    };

    // Promote vehicleClasses to top-level for consistency
    if (serviceDetails.vehicleClasses) {
        newApp.vehicleClasses = serviceDetails.vehicleClasses;
    }

    // Permanent Licence: assign cross-RTO reviewer code
    if (licenceType === "Permanent Licence") {
        var crossRtoCodes = ['TG-01','TG-02','TG-04','TG-05','TG-06','TG-07','TG-08','TG-10','TG-12','TG-14'];
        var localCode = (serviceDetails.rtoCode || 'TG-03');
        // Filter out the local RTO to ensure independent review
        var eligibleCodes = crossRtoCodes.filter(function(c) { return c !== localCode; });
        newApp.allocatedRtoCode = eligibleCodes[Math.floor(Math.random() * eligibleCodes.length)];
        newApp.serviceType = 'Permanent Licence';
        newApp.learnerLicenceApplicationId = serviceDetails.llNumber || '';
    }

    apps.unshift(newApp);
    saveStoredApplications(apps);
    if (typeof syncApplicationToSupabase === 'function') {
        syncApplicationToSupabase(newApp);
    }
    
    var newReview = {
        appId: newId,
        candidateName: name,
        licenceType: licenceType,
        mp4Name: requireEvidence ? testEvidenceObj.video.fileName : 'N/A',
        pdfName: requireEvidence ? testEvidenceObj.aiReport.fileName : 'N/A',
        videoDataUrl: requireEvidence ? testEvidenceObj.video.dataUrl : '',
        pdfDataUrl: requireEvidence ? testEvidenceObj.aiReport.dataUrl : '',
        notes: 'Submitted for verification. Next stage: ' + nextWorkflow,
        submittedOn: newApp.date,
        status: 'Pending Review',
        reviewedBy: null
    };
    reviews.unshift(newReview);
    saveStoredReviews(reviews);
    
    window.currentApplicationDocs = {};
    window.currentTestEvidence = {};
    
    renderSubmissionSuccess(newApp, nextWorkflow);
}

function renderSubmissionSuccess(app, nextStep) {
    var appDiv = document.getElementById('app');
    var _cs = safeParseJSON(sessionStorage.getItem('citizenSession'), null);
    var userInfo = _cs ? { initials: _cs.initials, name: _cs.name, role: 'Citizen (' + _cs.appId + ')' } : null;
    var logoutBtnHTML = _cs ? '<button class="btn-logout" onclick="handleLogout(\'#citizen-login\')"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>' : '';
    
    var navHTML = [
        { icon: 'fa-solid fa-gauge', label: 'Dashboard', hash: '#home' },
        { icon: 'fa-solid fa-id-card', label: 'Apply for Licence', hash: '#citizen', active: true },
        { icon: 'fa-solid fa-magnifying-glass', label: 'Track Status', hash: '#citizen-track' },
        { icon: 'fa-solid fa-cloud-arrow-up', label: 'Upload Test Reports', hash: '#upload-docs' }
    ].map(function(item) {
        return '<a href="' + item.hash + '" class="nav-item ' + (item.active ? 'active' : '') + '">' +
            '<i class="' + item.icon + '"></i> ' + item.label + '</a>';
    }).join('');

    var successHeading = "Application Submitted Successfully";
    var successMsg = "Your digital application has been logged into the DriveSetu RTO database.";
    var categoriesHTML = '';
    
    if (app.type === "Learner's Licence") {
        successHeading = "Your Learner's Licence application has been submitted successfully.";
        successMsg = "Your digital application has been logged into the DriveSetu RTO database for document verification.";
        if (app.serviceDetails && app.serviceDetails.vehicleClasses) {
            categoriesHTML = 
                '<div class="flex-between" style="padding:0.4rem 0; border-bottom:1px solid var(--border); font-size:0.88rem;">' +
                    '<span style="color:var(--text-muted);">Selected Vehicle Categories:</span>' +
                    '<strong>' + app.serviceDetails.vehicleClasses.join(', ') + '</strong>' +
                '</div>';
        }
    }

    if (app.type === "Learner's Licence") {
        var sd = app.serviceDetails || {};
        
        // Build document carry checklist
        var carryListHTML = '';
        carryListHTML += '<label style="display:block; margin:0.35rem 0; font-size:0.82rem;"><input type="checkbox" checked disabled style="margin-right:0.4rem;"> Original Aadhaar / Identity Document</label>';
        carryListHTML += '<label style="display:block; margin:0.35rem 0; font-size:0.82rem;"><input type="checkbox" checked disabled style="margin-right:0.4rem;"> DriveSetu Application Summary (DOCX)</label>';
        carryListHTML += '<label style="display:block; margin:0.35rem 0; font-size:0.82rem;"><input type="checkbox" checked disabled style="margin-right:0.4rem;"> Appointment Details / Proof of Slot</label>';
        
        if (app.documents) {
            for (var d = 0; d < app.documents.length; d++) {
                var doc = app.documents[d];
                if (doc.id === 'form_1a') {
                    carryListHTML += '<label style="display:block; margin:0.35rem 0; font-size:0.82rem;"><input type="checkbox" checked disabled style="margin-right:0.4rem;"> Original Form 1A Medical Certificate</label>';
                }
                if (doc.id === 'parent_declaration') {
                    carryListHTML += '<label style="display:block; margin:0.35rem 0; font-size:0.82rem;"><input type="checkbox" checked disabled style="margin-right:0.4rem;"> Original Parent / Guardian Declaration</label>';
                }
            }
        }
        
        containerHTML = '<div class="animate-in" style="max-width:700px; margin: 2rem auto;">' +
            '<div class="card" style="padding: 2.5rem 2rem;">' +
                '<div style="width:72px; height:72px; border-radius:50%; background:var(--primary-light); color:var(--primary); font-size:2.2rem; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem auto;">' +
                    '<i class="fa-solid fa-circle-check"></i>' +
                '</div>' +
                '<h2 style="font-size:1.45rem; font-weight:700; color:var(--text-main); margin-bottom:0.5rem; text-align:center;">Learner\'s Licence Application Submitted</h2>' +
                '<p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:1.5rem; text-align:center;">✓ Application Submitted Successfully</p>' +
                
                '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem;">' +
                    '<div class="flex-between" style="padding:0.45rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;">' +
                        '<span style="color:var(--text-muted);">Application ID:</span>' +
                        '<strong>' + app.id + '</strong>' +
                    '</div>' +
                    '<div class="flex-between" style="padding:0.45rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;">' +
                        '<span style="color:var(--text-muted);">Service:</span>' +
                        '<strong>Learner\'s Licence</strong>' +
                    '</div>' +
                    '<div class="flex-between" style="padding:0.45rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;">' +
                        '<span style="color:var(--text-muted);">Selected Vehicle Categories:</span>' +
                        '<strong>' + (sd.vehicleClasses ? sd.vehicleClasses.join(', ') : 'N/A') + '</strong>' +
                    '</div>' +
                    '<div class="flex-between" style="padding:0.45rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;">' +
                        '<span style="color:var(--text-muted);">RTO Code:</span>' +
                        '<strong>' + sd.rtoCode + '</strong>' +
                    '</div>' +
                    '<div class="flex-between" style="padding:0.45rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;">' +
                        '<span style="color:var(--text-muted);">RTO Test Centre:</span>' +
                        '<strong>' + sd.rtoOfficeName + '</strong>' +
                    '</div>' +
                    '<div style="padding:0.45rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;">' +
                        '<span style="color:var(--text-muted); display:block; margin-bottom:0.15rem;">RTO Address:</span>' +
                        '<strong>' + sd.rtoAddress + '</strong>' +
                    '</div>' +
                    '<div class="flex-between" style="padding:0.45rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;">' +
                        '<span style="color:var(--text-muted);">Test Date:</span>' +
                        '<strong>' + sd.allocatedTestDate + '</strong>' +
                    '</div>' +
                    '<div class="flex-between" style="padding:0.45rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;">' +
                        '<span style="color:var(--text-muted);">Test Appointment Time:</span>' +
                        '<strong>' + sd.allocatedTestStartTime + '</strong>' +
                    '</div>' +
                    '<div class="flex-between" style="padding:0.45rem 0; font-size:0.85rem;">' +
                        '<span style="color:var(--text-muted);">Status:</span>' +
                        '<strong style="color:var(--primary); font-weight:700;">Test Slot Allocated</strong>' +
                    '</div>' +
                '</div>' +
                
                '<div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:1.5rem; background:#fff7e6; border:1px solid #ffe7ba; padding:0.6rem 0.8rem; border-radius:6px; line-height:1.4;">' +
                    '<i class="fa-solid fa-triangle-exclamation" style="color:#d46b08; margin-right:0.3rem;"></i> ' +
                    'Prototype appointment — actual slot availability will be determined by the official RTO scheduling system.' +
                '</div>' +
                
                '<div style="text-align:center; margin-bottom:2rem;">' +
                    '<button class="btn btn-primary" style="margin:0 auto; padding:0.6rem 1.5rem;" onclick="downloadAppSummaryPDF(\'' + app.id + '\')"><i class="fa-solid fa-file-pdf"></i> Download Application PDF</button>' +
                    '<p style="font-size:0.7rem; color:var(--text-muted); margin-top:0.35rem;">DriveSetu Application Summary — Prototype</p>' +
                '</div>' +
                
                '<div style="border-top:1px solid var(--border); padding-top:1.5rem; text-align:left;">' +
                    '<h3 style="font-size:1rem; font-weight:700; color:var(--text-main); margin-bottom:0.75rem;"><i class="fa-solid fa-calendar-day" style="color:var(--primary); margin-right:0.4rem;"></i> Before You Visit the RTO</h3>' +
                    '<p style="font-size:0.82rem; color:var(--text-muted); line-height:1.5; margin-bottom:1rem;">' +
                        'The official Telangana Transport Department states that the LLR test is a computer-based test covering road rules and traffic signs. The test consists of <strong>20 questions</strong>, and you must answer at least <strong>12 questions correctly</strong> to pass. The test duration is <strong>10 minutes</strong>. Please attend the RTO test centre at your appointed time.' +
                    '</p>' +
                    
                    '<div style="background:#f8faf9; padding:1rem; border-radius:6px; border:1px solid var(--border); margin-bottom:1.5rem;">' +
                        '<div style="font-weight:700; font-size:0.85rem; margin-bottom:0.5rem; color:var(--text-main);"><i class="fa-solid fa-clipboard-list" style="color:var(--primary);"></i> Documents to Carry:</div>' +
                        carryListHTML +
                    '</div>' +
                    
                    '<div style="margin-bottom:1.5rem;">' +
                        '<div style="font-weight:700; font-size:0.85rem; margin-bottom:0.4rem; color:var(--text-main);">Preparation Tips:</div>' +
                        '<ul style="font-size:0.82rem; color:var(--text-muted); padding-left:1.25rem; line-height:1.6;">' +
                            '<li>Arrive before your allocated appointment time.</li>' +
                            '<li>Carry the original documents associated with your application.</li>' +
                            '<li>Carry the original Aadhaar/identity document used for the application.</li>' +
                            '<li>Carry the application/appointment details.</li>' +
                            '<li>Review basic traffic signs and road safety rules.</li>' +
                            '<li>Review driver\'s responsibilities and read each test question carefully.</li>' +
                            '<li>Do not rely on agents or unofficial intermediaries.</li>' +
                        '</ul>' +
                    '</div>' +
                    
                    '<div style="background:var(--primary-light); padding:1rem; border-radius:6px; border:1px solid var(--primary-light); display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">' +
                        '<div>' +
                            '<h4 style="font-size:0.88rem; font-weight:700; color:var(--primary-dark); margin-bottom:0.2rem;">Prepare for Your Learner\'s Licence Test</h4>' +
                            '<p style="font-size:0.78rem; color:var(--text-muted); line-height:1.4;">Practice traffic signs, road rules, safe driving practices, and driver responsibilities.</p>' +
                        '</div>' +
                        '<button class="btn btn-primary" onclick="showPracticeQuizModal()" style="font-size:0.8rem; padding:0.45rem 1rem;"><i class="fa-solid fa-graduation-cap"></i> Practice LLR Questions</button>' +
                    '</div>' +
                    
                    '<div style="text-align:center; padding-top:1rem; border-top:1px dashed var(--border);">' +
                        '<h3 style="font-size:1.1rem; font-weight:700; color:var(--text-main); margin-bottom:0.25rem;">You\'re all set.</h3>' +
                        '<p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:0.75rem;">Please arrive at the assigned RTO test centre on time and carry the required original documents.</p>' +
                        '<p style="font-weight:700; color:var(--primary-dark); font-size:0.95rem; margin-bottom:0.5rem;">All the best for your Learner\'s Licence test!</p>' +
                        '<p style="font-size:0.82rem; font-weight:700; color:var(--text-muted); letter-spacing:0.5px;">DriveSafe. Drive Responsibly.</p>' +
                    '</div>' +
                '</div>' +
                
                '<div style="display:flex; gap:0.75rem; justify-content:center; margin-top:2rem; border-top:1px solid var(--border); padding-top:1.25rem;">' +
                    '<button class="btn btn-primary" onclick="window.location.hash=\'citizen-track\'; quickTrack(\'' + app.id + '\')"><i class="fa-solid fa-magnifying-glass"></i> Track Status</button>' +
                    '<button class="btn btn-ghost" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-id-card"></i> Back to Services</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    } else if (app.type === "Permanent Licence") {
        containerHTML = renderPermanentSuccess(app);
    } else {
        containerHTML = '<div class="animate-in" style="max-width:580px; margin: 2rem auto;">' +
            '<div class="card" style="text-align:center; padding: 2.5rem 2rem;">' +
                '<div style="width:72px; height:72px; border-radius:50%; background:var(--primary-light); color:var(--primary); font-size:2.2rem; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem auto;">' +
                    '<i class="fa-solid fa-circle-check"></i>' +
                '</div>' +
                '<h2 style="font-size:1.35rem; font-weight:700; color:var(--text-main); margin-bottom:0.5rem; line-height:1.4;">' + successHeading + '</h2>' +
                '<p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:1.5rem;">' + successMsg + '</p>' +
                
                '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-md); padding:1rem 1.25rem; margin-bottom:1.5rem; text-align:left;">' +
                    '<div class="flex-between" style="padding:0.4rem 0; border-bottom:1px solid var(--border); font-size:0.88rem;">' +
                        '<span style="color:var(--text-muted);">Application ID:</span>' +
                        '<strong>' + app.id + '</strong>' +
                    '</div>' +
                    '<div class="flex-between" style="padding:0.4rem 0; border-bottom:1px solid var(--border); font-size:0.88rem;">' +
                        '<span style="color:var(--text-muted);">Service / Licence:</span>' +
                        '<strong>' + app.type + '</strong>' +
                    '</div>' +
                    categoriesHTML +
                    '<div class="flex-between" style="padding:0.4rem 0; border-bottom:1px solid var(--border); font-size:0.88rem;">' +
                        '<span style="color:var(--text-muted);">Current Status:</span>' +
                        '<span class="badge badge-pending">Submitted</span>' +
                    '</div>' +
                    '<div class="flex-between" style="padding:0.4rem 0; font-size:0.88rem;">' +
                        '<span style="color:var(--text-muted);">Next Step:</span>' +
                        '<strong style="color:var(--primary-dark);">' + nextStep + '</strong>' +
                    '</div>' +
                '</div>' +
                
                '<div style="display:flex; gap:0.75rem; justify-content:center;">' +
                    '<button class="btn btn-primary" onclick="window.location.hash=\'citizen-track\'; quickTrack(\'' + app.id + '\')"><i class="fa-solid fa-magnifying-glass"></i> Track Status</button>' +
                    '<button class="btn btn-ghost" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-id-card"></i> Back to Services</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    appDiv.innerHTML = '' +
        '<aside class="sidebar">' +
            '<div class="sidebar-brand"><div class="brand-icon"><i class="fa-solid fa-steering-wheel"></i></div><span>DriveSetu</span></div>' +
            '<div class="sidebar-section-label">Navigation</div>' +
            '<nav class="sidebar-nav">' + navHTML + '</nav>' +
            '<div style="padding:1rem; background:var(--primary-light); border-radius:var(--radius-md); margin-top:auto;">' +
                '<p style="font-size:0.78rem; font-weight:700; color:var(--primary-dark); margin-bottom:0.25rem;">Need Help?</p>' +
                '<p style="font-size:0.72rem; color:var(--text-muted); line-height:1.4;">Contact RTO helpline: <strong>1800-XXX-XXXX</strong></p>' +
            '</div>' +
        '</aside>' +
        '<div class="main-content">' +
            '<header class="top-header">' +
                '<div class="header-left"><div class="page-title">Application Submitted</div><div class="breadcrumb">Dashboard / Apply / <span>Success</span></div></div>' +
                '<div class="header-right">' +
                    '<div class="search-bar"><i class="fa-solid fa-magnifying-glass"></i><input type="text" placeholder="Search applications..."></div>' +
                    '<div class="header-icon-btn"><i class="fa-solid fa-bell"></i></div>' +
                    (userInfo
                        ? '<div class="user-chip"><div class="user-avatar">' + userInfo.initials + '</div><div><div class="user-chip-name">' + userInfo.name + '</div><div class="user-chip-role">' + userInfo.role + '</div></div></div>' + logoutBtnHTML
                        : '') +
                '</div>' +
            '</header>' +
            '<header style="display:none;"></header>' + // Unused extra header safety
            '<main class="page-body">' +
                containerHTML +
            '</main>' +
        '</div>';
}

// ─── CITIZEN DRIVING TEST STATUS PAGE ───
function renderCitizenDrivingTestPage(session) {
    var apps = getStoredApplications();
    var reviews = getStoredReviews();

    var permApp = null;
    for (var i = 0; i < apps.length; i++) {
        if ((apps[i].type === "Permanent Licence" || apps[i].type === "Permanent Driving Licence") &&
            (apps[i].citizenId === session.email || apps[i].citizenId === session.appId || apps[i].name === session.name)) {
            permApp = apps[i];
            break;
        }
    }

    if (!permApp) {
        return '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-arrow-left"></i> Back to Services</button></div>' +
            '<div class="animate-in" style="max-width:620px; margin:2rem auto;">' +
                '<div class="card" style="text-align:center; padding:2.5rem 2rem;">' +
                    '<div style="width:60px; height:60px; border-radius:50%; background:#e8f7f1; color:var(--primary); font-size:1.8rem; display:flex; align-items:center; justify-content:center; margin:0 auto 1rem auto;">' +
                        '<i class="fa-solid fa-car-side"></i>' +
                    '</div>' +
                    '<h3 style="font-size:1.2rem; font-weight:700; color:var(--text-main); margin-bottom:0.4rem;">No Driving Test Scheduled</h3>' +
                    '<p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.5rem;">You do not currently have an active Permanent Driving Licence test appointment scheduled.</p>' +
                    '<button class="btn btn-primary" style="margin:0 auto;" onclick="window.location.hash=\'apply-permanent\'"><i class="fa-solid fa-id-card"></i> Apply for Permanent Licence</button>' +
                '</div>' +
            '</div>';
    }

    var sd = permApp.serviceDetails || {};
    var reviewObj = null;
    for (var r = 0; r < reviews.length; r++) {
        if (reviews[r].appId === permApp.id) { reviewObj = reviews[r]; break; }
    }

    var hasTestCompleted = (permApp.evidenceStatus === 'LOCKED' || permApp.testEvidence != null || (reviewObj && reviewObj.mp4Name && reviewObj.mp4Name !== 'N/A'));

    if (!hasTestCompleted) {
        return '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-arrow-left"></i> Back to Citizen Portal</button></div>' +
            '<div class="animate-in" style="max-width:750px; margin:0 auto;">' +
                '<div class="card" style="padding:2.25rem 2rem;">' +
                    '<div class="flex-between" style="margin-bottom:1.25rem; border-bottom:1px solid var(--border); padding-bottom:0.75rem;">' +
                        '<div>' +
                            '<h2 style="font-size:1.3rem; font-weight:700; color:var(--text-main); margin:0;">DRIVING TEST STATUS</h2>' +
                            '<p style="font-size:0.8rem; color:var(--text-muted); margin:0.2rem 0 0 0;">Telangana RTO Automated Test Track Appointment</p>' +
                        '</div>' +
                        '<span class="badge badge-approved" style="font-size:0.8rem;"><i class="fa-solid fa-calendar-check"></i> ✓ Scheduled</span>' +
                    '</div>' +

                    '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem;">' +
                        '<h4 style="font-size:0.9rem; font-weight:700; color:var(--text-main); margin-bottom:0.75rem; border-bottom:1px solid var(--border); padding-bottom:0.35rem;">Appointment Details</h4>' +
                        '<div class="flex-between" style="padding:0.35rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">Applicant Name:</span><strong>' + permApp.name + '</strong></div>' +
                        '<div class="flex-between" style="padding:0.35rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">Application Number:</span><strong>' + permApp.id + '</strong></div>' +
                        '<div class="flex-between" style="padding:0.35rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">Learner\'s Licence ID:</span><strong>' + (sd.llNumber || permApp.learnerLicenceApplicationId || 'N/A') + '</strong></div>' +
                        '<div class="flex-between" style="padding:0.35rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">Applied Vehicle Categories:</span><strong>' + ((permApp.vehicleClasses && permApp.vehicleClasses.length > 0) ? permApp.vehicleClasses.join(', ') : (sd.vehicleClass || 'MCWG, LMV')) + '</strong></div>' +
                        '<div class="flex-between" style="padding:0.35rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">RTO Test Centre:</span><strong>' + (sd.rtoOfficeName || 'RTA Hyderabad Central') + ' (' + (sd.rtoCode || 'TG-09') + ')</strong></div>' +
                        '<div class="flex-between" style="padding:0.35rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">RTO Address:</span><strong style="text-align:right; max-width:60%;">' + (sd.rtoAddress || 'Khairatabad, Hyderabad') + '</strong></div>' +
                        '<div class="flex-between" style="padding:0.35rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">Test Date:</span><strong>' + (sd.allocatedTestDate || sd.preferredTestDate || 'Scheduled') + '</strong></div>' +
                        '<div class="flex-between" style="padding:0.35rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">Time Slot Window:</span><strong>' + (sd.allocatedTestStartTime || '10:00 AM') + ' - ' + (sd.allocatedTestEndTime || '11:00 AM') + '</strong></div>' +
                    '</div>' +

                    '<div style="background:#f8faf9; border:1px solid var(--border); border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem;">' +
                        '<h4 style="font-size:0.9rem; font-weight:700; color:var(--text-main); margin-bottom:0.4rem;"><i class="fa-solid fa-shield-halved" style="color:var(--primary);"></i> Driving Test Evidence & Telemetry Status</h4>' +
                        '<p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1rem; line-height:1.5;">Your test recording and telemetry will be captured automatically by the DriveSetu Test-Centre system during your appointment. Citizens do not upload files directly.</p>' +
                        '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.75rem; font-size:0.82rem; text-align:center;">' +
                            '<div style="background:#fff; border:1px solid var(--border); padding:0.75rem; border-radius:6px;">' +
                                '<div style="color:var(--text-muted); font-size:0.75rem;">Test Evidence</div>' +
                                '<strong style="color:#d46b08; display:block; margin-top:0.25rem;">○ Awaiting Driving Test</strong>' +
                            '</div>' +
                            '<div style="background:#fff; border:1px solid var(--border); padding:0.75rem; border-radius:6px;">' +
                                '<div style="color:var(--text-muted); font-size:0.75rem;">AI Analysis</div>' +
                                '<strong style="color:#d46b08; display:block; margin-top:0.25rem;">○ Awaiting Driving Test</strong>' +
                            '</div>' +
                            '<div style="background:#fff; border:1px solid var(--border); padding:0.75rem; border-radius:6px;">' +
                                '<div style="color:var(--text-muted); font-size:0.75rem;">RTO Review</div>' +
                                '<strong style="color:var(--text-muted); display:block; margin-top:0.25rem;">○ Not Started</strong>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +

                    '<div style="text-align:center;">' +
                        '<button class="btn btn-primary" onclick="window.location.hash=\'citizen-track\'; quickTrack(\'' + permApp.id + '\')"><i class="fa-solid fa-magnifying-glass"></i> Track Application Progress</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
    } else {
        var ev = permApp.testEvidence || {};
        var videoName = (ev.video && ev.video.fileName) ? ev.video.fileName : 'APP_TrackTest_Video.mp4';
        var pdfName = (ev.aiReport && ev.aiReport.fileName) ? ev.aiReport.fileName : 'RTO_AI_Report.pdf';

        return '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-arrow-left"></i> Back to Citizen Portal</button></div>' +
            '<div class="animate-in" style="max-width:750px; margin:0 auto;">' +
                '<div class="card" style="padding:2.25rem 2rem;">' +
                    '<div class="flex-between" style="margin-bottom:1.25rem; border-bottom:1px solid var(--border); padding-bottom:0.75rem;">' +
                        '<div>' +
                            '<h2 style="font-size:1.3rem; font-weight:700; color:var(--text-main); margin:0;">DRIVING TEST</h2>' +
                            '<p style="font-size:0.8rem; color:var(--text-muted); margin:0.2rem 0 0 0;">Telangana RTO Automated Test Track — Completed</p>' +
                        '</div>' +
                        '<span class="badge badge-approved" style="font-size:0.8rem;"><i class="fa-solid fa-circle-check"></i> ✓ Completed</span>' +
                    '</div>' +

                    '<div style="background:#e8f7f1; border:1px solid #c2ead8; border-radius:var(--radius-md); padding:1rem; margin-bottom:1.5rem; color:#148f60; font-size:0.85rem;">' +
                        '<div style="font-weight:700; font-size:0.95rem; margin-bottom:0.3rem;"><i class="fa-solid fa-lock"></i> Evidence Package Secured (Read-Only)</div>' +
                        '<div>Your driving test recording and AI telemetry report have been captured and locked by the Test Centre. The original evidence cannot be altered or modified by any party.</div>' +
                    '</div>' +

                    '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem;">' +
                        '<h4 style="font-size:0.9rem; font-weight:700; color:var(--text-main); margin-bottom:0.75rem; border-bottom:1px solid var(--border); padding-bottom:0.35rem;">Secured Test Status Summary</h4>' +
                        '<div class="flex-between" style="padding:0.35rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">Driving Test Status:</span><strong style="color:#148f60;">✓ Completed</strong></div>' +
                        '<div class="flex-between" style="padding:0.35rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">Original Test Recording:</span><strong style="color:#148f60;">✓ Secured (' + videoName + ')</strong></div>' +
                        '<div class="flex-between" style="padding:0.35rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">Vehicle Sensor Data:</span><strong style="color:#148f60;">✓ Captured (OBD-II & Camera)</strong></div>' +
                        '<div class="flex-between" style="padding:0.35rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">AI Telemetry Analysis:</span><strong style="color:#148f60;">✓ Completed (' + pdfName + ')</strong></div>' +
                        '<div class="flex-between" style="padding:0.35rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">Evidence Package Status:</span><span class="badge badge-approved">🔒 Secured (Read-Only)</span></div>' +
                        '<div class="flex-between" style="padding:0.35rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">RTO Officer Review Status:</span><span class="badge badge-pending">○ Pending Officer Review</span></div>' +
                    '</div>' +

                    '<div style="display:flex; gap:0.75rem; margin-bottom:1.5rem;">' +
                        '<button type="button" class="btn btn-ghost" style="flex:1; justify-content:center;" onclick="openVideoDocument(\'' + permApp.id + '\')"><i class="fa-solid fa-file-video" style="color:#096dd9;"></i> View Test Video (Read-only)</button>' +
                        '<button type="button" class="btn btn-ghost" style="flex:1; justify-content:center;" onclick="viewPdfDocument(\'' + permApp.id + '\')"><i class="fa-solid fa-file-pdf" style="color:#d46b08;"></i> View AI Report (Read-only)</button>' +
                    '</div>' +

                    '<div style="text-align:center;">' +
                        '<button class="btn btn-primary" onclick="window.location.hash=\'citizen-track\'; quickTrack(\'' + permApp.id + '\')"><i class="fa-solid fa-magnifying-glass"></i> Track Full Application Timeline</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }
}

// ─── TEST CENTRE OPERATOR WORKFLOW ───
if (!window.testCentreState) {
    window.testCentreState = {
        step: 'search', // 'search' | 'found' | 'in_progress' | 'completed' | 'ai_generated'
        matchedApp: null,
        identityVerified: false,
        appointmentVerified: false,
        testTimerSeconds: 0,
        timerInterval: null,
        isPlaying: true,
        isMuted: false,
        eventsLog: []
    };
}

function getDeterministicTelemetry(sec) {
    if (sec <= 5) {
        return { speed: '8 km/h', accel: '+0.8 m/s²', braking: 'None', lateral: '0.00 m (SAFE)', turning: 'Straight Launch', position: 'Start Line Zone' };
    } else if (sec <= 12) {
        return { speed: '14 km/h', accel: '+0.4 m/s²', braking: 'Normal', lateral: '0.08 m (OPTIMAL)', turning: 'Track Entry', position: 'Outer Track Entry' };
    } else if (sec <= 20) {
        return { speed: '16 km/h', accel: '+0.2 m/s²', braking: 'Normal', lateral: '0.12 m (SAFE)', turning: 'Right Turn (Curve 1)', position: 'Within Track Bounds' };
    } else if (sec <= 27) {
        return { speed: '15 km/h', accel: '-0.1 m/s²', braking: 'Normal', lateral: '0.10 m (SAFE)', turning: 'Left Turn (8-Track)', position: 'Figure-8 Center Loop' };
    } else if (sec <= 34) {
        return { speed: '12 km/h', accel: '-0.4 m/s²', braking: 'Active (40%)', lateral: '0.28 m (ELEVATED)', turning: 'Sharp Right', position: 'Approaching Outer Line' };
    } else {
        return { speed: '8 km/h', accel: '-0.8 m/s²', braking: 'Active (85%)', lateral: '0.04 m (OPTIMAL)', turning: 'Straight', position: 'Stop Line / Finish Zone' };
    }
}

function getDeterministicLogs(sec) {
    var logs = [];
    if (sec >= 2) logs.push({ time: '00:02', text: '✓ Helmet & Safety Gear Confirmed', type: 'success' });
    if (sec >= 6) logs.push({ time: '00:06', text: '✓ Vehicle Ignition & Smooth Track Launch', type: 'success' });
    if (sec >= 14) logs.push({ time: '00:14', text: '✓ Curved Track Entry Detected', type: 'success' });
    if (sec >= 21) logs.push({ time: '00:21', text: '✓ Stable Vehicle Control (Figure-8 Navigation)', type: 'success' });
    if (sec >= 28) logs.push({ time: '00:28', text: '⚠ Approaching Outer Track Boundary', type: 'warning' });
    if (sec >= 36) logs.push({ time: '00:36', text: '✓ Stop-Line Pressure Sensor Activated (Zero Rollback)', type: 'success' });
    return logs;
}

function stopTestCentreTimers() {
    if (window.testCentreState.timerInterval) {
        clearInterval(window.testCentreState.timerInterval);
        window.testCentreState.timerInterval = null;
    }
}

function resetTestCentreWorkflow() {
    stopTestCentreTimers();
    window.testCentreState = {
        step: 'search',
        matchedApp: null,
        identityVerified: false,
        appointmentVerified: false,
        testTimerSeconds: 0,
        timerInterval: null,
        isPlaying: true,
        isMuted: false,
        eventsLog: []
    };
    render();
}

function testCentreSearchApp(appIdSearch) {
    var searchId = appIdSearch;
    if (!searchId) {
        var input = document.getElementById('testCentreAppInput');
        if (input) searchId = input.value.trim().toUpperCase();
    }
    if (!searchId) {
        alert('Please enter an Application ID.');
        return;
    }

    var apps = getStoredApplications();
    var matched = null;
    for (var i = 0; i < apps.length; i++) {
        if (apps[i].id === searchId && (apps[i].type === "Permanent Licence" || apps[i].type === "Permanent Driving Licence")) {
            matched = apps[i];
            break;
        }
    }

    if (!matched) {
        alert('Application ' + searchId + ' not found or is not a Permanent Driving Licence application.');
        return;
    }

    window.testCentreState.matchedApp = matched;
    window.testCentreState.step = 'found';
    window.testCentreState.identityVerified = false;
    window.testCentreState.appointmentVerified = false;
    render();
}

function testCentreVerifyIdentity() {
    window.testCentreState.identityVerified = true;
    render();
}

function testCentreVerifyAppointment() {
    window.testCentreState.appointmentVerified = true;
    render();
}

function formatTestTimer(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
}

function pad3(num) {
    var s = num + "";
    while (s.length < 3) s = "0" + s;
    return s;
}

function updateTestSessionUI(sec) {
    if (sec > 40) sec = 40;
    window.testCentreState.testTimerSeconds = sec;
    var formatted = formatTestTimer(sec);

    var recEl = document.getElementById('recTimerOverlay');
    if (recEl) recEl.textContent = formatted;

    var camRecEl = document.getElementById('cameraRecTime');
    if (camRecEl) camRecEl.textContent = formatted;

    var vTimeEl = document.getElementById('videoTimeDisplay');
    if (vTimeEl) vTimeEl.textContent = formatted + ' / 00:40';

    var sliderEl = document.getElementById('videoTimelineSlider');
    if (sliderEl) sliderEl.value = sec;

    // Sync HTML5 video currentTime
    var videoEl = document.getElementById('testCameraVideoFeed');
    if (videoEl && videoEl.duration && !isNaN(videoEl.duration)) {
        var targetTime = (sec / 40) * videoEl.duration;
        if (Math.abs(videoEl.currentTime - targetTime) > 1.5) {
            videoEl.currentTime = targetTime;
        }
    }

    // Telemetry updates
    var p = getDeterministicTelemetry(sec);
    var spEl = document.getElementById('telemetrySpeed');
    if (spEl) spEl.textContent = p.speed;

    var acEl = document.getElementById('telemetryAccel');
    if (acEl) acEl.textContent = p.accel;

    var brEl = document.getElementById('telemetryBraking');
    if (brEl) brEl.textContent = p.braking;

    var latEl = document.getElementById('telemetryLateral');
    if (latEl) latEl.textContent = p.lateral;

    var trnEl = document.getElementById('telemetryTurning');
    if (trnEl) trnEl.textContent = p.turning;

    var posEl = document.getElementById('telemetryPosition');
    if (posEl) posEl.textContent = p.position;

    // AI Logs update
    var logs = getDeterministicLogs(sec);
    var logBox = document.getElementById('aiEventLogStream');
    if (logBox) {
        logBox.innerHTML = logs.map(function(ev) {
            var colorStyle = ev.type === 'warning' ? 'color:#fbbf24;' : 'color:#34d399;';
            return '<div style="' + colorStyle + ' margin-bottom:0.4rem;"><strong style="color:#94a3b8;">[' + ev.time + ']</strong> ' + ev.text + '</div>';
        }).join('');
        logBox.scrollTop = logBox.scrollHeight;
    }

    // End of test video handling
    if (sec >= 40) {
        stopTestCentreTimers();
        window.testCentreState.isPlaying = false;
        var badgeEl = document.getElementById('recordingStatusBadge');
        if (badgeEl) {
            badgeEl.style.background = '#10b981';
            badgeEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> TEST RECORDING COMPLETE';
        }
        var playBtn = document.getElementById('videoPlayPauseBtn');
        if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i>';
        if (videoEl) videoEl.pause();
    }
}

function toggleTestVideoPlay() {
    var videoEl = document.getElementById('testCameraVideoFeed');
    if (window.testCentreState.isPlaying) {
        stopTestCentreTimers();
        window.testCentreState.isPlaying = false;
        if (videoEl) videoEl.pause();
        var playBtn = document.getElementById('videoPlayPauseBtn');
        if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    } else {
        if (window.testCentreState.testTimerSeconds >= 40) {
            window.testCentreState.testTimerSeconds = 0;
        }
        window.testCentreState.isPlaying = true;
        if (videoEl) videoEl.play();
        var playBtn2 = document.getElementById('videoPlayPauseBtn');
        if (playBtn2) playBtn2.innerHTML = '<i class="fa-solid fa-pause"></i>';
        startSessionTimer();
    }
}

function seekTestVideoTimeline(val) {
    var sec = parseInt(val, 10) || 0;
    var videoEl = document.getElementById('testCameraVideoFeed');
    if (videoEl && videoEl.duration && !isNaN(videoEl.duration)) {
        videoEl.currentTime = (sec / 40) * videoEl.duration;
    }
    updateTestSessionUI(sec);
}

function toggleTestVideoMute() {
    window.testCentreState.isMuted = !window.testCentreState.isMuted;
    var videoEl = document.getElementById('testCameraVideoFeed');
    if (videoEl) videoEl.muted = window.testCentreState.isMuted;
    var icon = document.getElementById('videoMuteIcon');
    if (icon) {
        icon.className = window.testCentreState.isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
    }
}

function toggleTestVideoFullscreen() {
    var wrapper = document.querySelector('.camera-video-wrapper');
    var videoEl = document.getElementById('testCameraVideoFeed');
    var target = wrapper || videoEl;
    if (target) {
        if (!document.fullscreenElement) {
            if (target.requestFullscreen) target.requestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    }
}

function startSessionTimer() {
    stopTestCentreTimers();
    window.testCentreState.timerInterval = setInterval(function() {
        if (window.testCentreState.step !== 'in_progress') return;
        var nextSec = window.testCentreState.testTimerSeconds + 1;
        updateTestSessionUI(nextSec);
    }, 1000);
}

function testCentreStartTest() {
    if (!window.testCentreState.identityVerified || !window.testCentreState.appointmentVerified) {
        alert('Please complete Identity Verification and Appointment Verification before starting the test.');
        return;
    }

    stopTestCentreTimers();
    window.testCentreState.step = 'in_progress';
    window.testCentreState.testTimerSeconds = 0;
    window.testCentreState.isPlaying = true;

    startSessionTimer();
    render();
}

function testCentreCompleteTest() {
    stopTestCentreTimers();
    window.testCentreState.step = 'completed';
    render();
}

function testCentreGenerateAiReport() {
    window.testCentreState.step = 'ai_generated';
    render();
}

function testCentreSendToRto() {
    var app = window.testCentreState.matchedApp;
    if (!app) return;

    var apps = getStoredApplications();
    var reviews = getStoredReviews();

    var appCode = app.id.replace('APP-', '');
    var evidenceId = 'EV-' + appCode;
    var sha256Hash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    var testRto = (app.serviceDetails && app.serviceDetails.rtoCode) ? app.serviceDetails.rtoCode : 'TG-03';
    var videoFileName = app.id + '_TestVideo.mp4';
    var pdfFileName = app.id + '_AI_Report.pdf';
    var telemetryFileName = app.id + '_Telemetry';
    var timestampStr = new Date().toISOString();

    // ── Execute Dual Randomized Allocation Engine ──
    var evals = allocateDualEvaluators(testRto);

    var evidenceObj = {
        evidenceId: evidenceId,
        integrityHash: sha256Hash,
        testCentreRto: testRto,
        evaluator1: { officerId: evals.evaluator1.officerId, rtoCode: evals.evaluator1.rtoCode, name: evals.evaluator1.name, decision: null, reason: null, timestamp: null, timestampReadable: null },
        evaluator2: { officerId: evals.evaluator2.officerId, rtoCode: evals.evaluator2.rtoCode, name: evals.evaluator2.name, decision: null, reason: null, timestamp: null, timestampReadable: null },
        verificationUrl: window.location.origin + window.location.pathname + '#verify-evidence?ev=' + evidenceId,
        video: {
            fileName: videoFileName + ' (28.4MB)',
            fileSize: '28.4MB',
            fileType: 'video/mp4',
            timestamp: timestampStr,
            dataUrl: 'pika.mp4',
            status: 'Secured & Locked'
        },
        telemetry: {
            fileName: telemetryFileName,
            fileType: 'application/json',
            status: 'Secured & Synchronized'
        },
        aiReport: {
            fileName: pdfFileName + ' (1.4MB)',
            fileSize: '1.4MB',
            fileType: 'application/pdf',
            timestamp: timestampStr,
            dataUrl: '',
            status: 'Secured & Locked'
        },
        locked: true
    };

    // Update drivesetu_applications
    for (var i = 0; i < apps.length; i++) {
        if (apps[i].id === app.id) {
            apps[i].status = 'Pending RTO Review';
            apps[i].reviewStage = 'Pending Dual Independent Review';
            apps[i].evidenceStatus = 'LOCKED';
            apps[i].evidenceId = evidenceId;
            apps[i].integrityHash = sha256Hash;
            apps[i].evaluator1 = evidenceObj.evaluator1;
            apps[i].evaluator2 = evidenceObj.evaluator2;
            apps[i].evaluationStatus = 'BOTH_PENDING';
            apps[i].testEvidence = evidenceObj;
            
            if (!apps[i].allocationLog) apps[i].allocationLog = [];
            apps[i].allocationLog.push({
                reviewRound: 1,
                testCentreRto: testRto,
                allocatedOfficerId: evals.evaluator1.officerId,
                officerName: evals.evaluator1.name,
                officerRto: evals.evaluator1.rtoCode,
                allocationMethod: 'Automated Cross-RTO Allocation',
                timestamp: new Date().toLocaleString('en-IN'),
                status: 'Assigned'
            });
            apps[i].allocationLog.push({
                reviewRound: 1,
                testCentreRto: testRto,
                allocatedOfficerId: evals.evaluator2.officerId,
                officerName: evals.evaluator2.name,
                officerRto: evals.evaluator2.rtoCode,
                allocationMethod: 'Automated Cross-RTO Allocation',
                timestamp: new Date().toLocaleString('en-IN'),
                status: 'Assigned'
            });
            break;
        }
    }
    saveStoredApplications(apps);

    // Create IMMUTABLE audit events for test completion
    appendAuditEvent(app.id, 'TEST_CONDUCTED', 'Test Centre Operator', 'TEST_CENTRE_OPERATOR', 'Driving test physically conducted at ' + testRto);
    appendAuditEvent(app.id, 'EVIDENCE_LOCKED', 'Test Centre Operator', 'TEST_CENTRE_OPERATOR', 'Evidence Package locked (' + evidenceId + ') with SHA-256 integrity hash.');
    appendAuditEvent(app.id, 'AI_REPORT_GENERATED', 'AI System', 'SYSTEM_AI', 'AI telemetry analysis completed. Telemetry score: 92/100.');
    appendAuditEvent(app.id, 'EVALUATOR_ALLOCATED', 'System Engine', 'SYSTEM', 'Independent evaluator automatically allocated through cross-RTO assignment.');

    // Update drivesetu_pending_reviews
    var reviewFound = false;
    for (var r = 0; r < reviews.length; r++) {
        if (reviews[r].appId === app.id) {
            reviews[r].status = 'Pending Review';
            reviews[r].mp4Name = evidenceObj.video.fileName;
            reviews[r].pdfName = evidenceObj.aiReport.fileName;
            reviews[r].videoDataUrl = evidenceObj.video.dataUrl;
            reviews[r].notes = 'Driving test completed at ' + testRto + '. Evidence locked (' + evidenceId + '). Allocated via Cross-RTO Evaluation Engine.';
            reviews[r].submittedOn = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'});
            reviewFound = true;
            break;
        }
    }
    if (!reviewFound) {
        reviews.unshift({
            appId: app.id,
            candidateName: app.name,
            licenceType: 'Permanent Licence',
            mp4Name: evidenceObj.video.fileName,
            pdfName: evidenceObj.aiReport.fileName,
            videoDataUrl: evidenceObj.video.dataUrl,
            pdfDataUrl: '',
            notes: 'Driving test completed at ' + testRto + '. Evidence locked (' + evidenceId + '). Allocated via Cross-RTO Evaluation Engine.',
            submittedOn: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'}),
            status: 'Pending Review',
            reviewedBy: null
        });
    }
    saveStoredReviews(reviews);

    alert('🔒 Evidence Package Locked & Independent Evaluation Assigned!\n\nEvidence ID: ' + evidenceId + '\nIntegrity Hash: ' + sha256Hash + '\n\n🎲 Independent evaluation assigned automatically through the DriveSetu Cross-RTO Allocation Engine.');
    resetTestCentreWorkflow();
}

function renderTestCentrePage() {
    var _rsRaw = sessionStorage.getItem('rtoSession');
    var _rs = null;
    if (_rsRaw) {
        try { _rs = JSON.parse(_rsRaw); } catch(e) {}
    }

    if (!_rs || _rs.role !== 'TEST_CENTRE_OPERATOR') {
        return '<div class="animate-in" style="max-width:520px; margin:3rem auto; text-align:center;">' +
            '<div class="card" style="padding:2.5rem 2rem;">' +
                '<div style="width:70px; height:70px; border-radius:50%; background:#fff0f0; color:#c53030; font-size:2rem; display:flex; align-items:center; justify-content:center; margin:0 auto 1.25rem auto;"><i class="fa-solid fa-shield-halved"></i></div>' +
                '<h3 style="font-size:1.2rem; font-weight:700; color:var(--text-main); margin-bottom:0.5rem;">Test Centre Operator Login Required</h3>' +
                '<p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.5rem; line-height:1.5;">This terminal is restricted to authorized Test Centre Operators. Please log in with your assigned Test Centre Operator credentials.</p>' +
                '<button class="btn btn-primary" onclick="window.location.hash=\'rto-login\'"><i class="fa-solid fa-right-to-bracket"></i> Go to RTO Portal Login</button>' +
            '</div>' +
        '</div>';
    }

    var operatorRtoCode = _rs.rtoCode || 'TG-03';
    var operatorRtoName = _rs.rtoName || 'RTA Medchal / Hyderabad West';

    var state = window.testCentreState || { step: 'search' };
    var apps = getStoredApplications();
    
    // Strict RTO Isolation: Only show tests scheduled at THIS physical test centre RTO!
    var scheduledApps = apps.filter(function(a) {
        if (a.type !== 'Permanent Licence' && a.type !== 'Permanent Driving Licence') return false;
        var appRto = (a.serviceDetails && a.serviceDetails.rtoCode) ? a.serviceDetails.rtoCode : 'TG-03';
        return appRto === operatorRtoCode;
    });

    if (state.step === 'search') {
        var rows = '';
        if (scheduledApps.length === 0) {
            rows = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No Permanent Licence test appointments found in queue for RTO ' + operatorRtoCode + '.</td></tr>';
        } else {
            rows = scheduledApps.map(function(a) {
                var sd = a.serviceDetails || {};
                var evSt = (a.evidenceStatus === 'LOCKED' || a.testEvidence != null)
                    ? '<span class="badge badge-approved">🔒 Evidence Secured</span>'
                    : '<span class="badge badge-pending">● Test Scheduled</span>';
                return '<tr style="cursor:pointer;" onclick="testCentreSearchApp(\'' + a.id + '\')">' +
                    '<td><strong>' + a.id + '</strong></td>' +
                    '<td>' + a.name + '</td>' +
                    '<td>' + ((a.vehicleClasses && a.vehicleClasses.length>0)?a.vehicleClasses.join(', '):(sd.vehicleClass||'MCWG, LMV')) + '</td>' +
                    '<td>' + (sd.allocatedTestDate || sd.preferredTestDate || a.date) + '</td>' +
                    '<td>' + evSt + '</td>' +
                    '<td><button type="button" class="btn btn-ghost" style="padding:0.25rem 0.6rem; font-size:0.75rem;" onclick="event.stopPropagation(); testCentreSearchApp(\'' + a.id + '\')"><i class="fa-solid fa-video"></i> Open Terminal</button></td>' +
                    '</tr>';
            }).join('');
        }

        return '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'home\'"><i class="fa-solid fa-arrow-left"></i> Home</button></div>' +
            '<div class="animate-in" style="max-width:820px; margin:0 auto;">' +
                '<div class="card" style="padding:2.25rem 2rem;">' +
                    '<div style="width:60px; height:60px; border-radius:50%; background:#e8f7f1; color:var(--primary); font-size:1.8rem; display:flex; align-items:center; justify-content:center; margin:0 auto 1rem auto;">' +
                        '<i class="fa-solid fa-video"></i>' +
                    '</div>' +
                    '<h2 style="font-size:1.35rem; font-weight:700; color:var(--text-main); text-align:center; margin-bottom:0.3rem;">DriveSetu Test Centre — RTO Code: ' + operatorRtoCode + '</h2>' +
                    '<p style="font-size:0.84rem; color:var(--text-muted); text-align:center; margin-bottom:1.5rem;">' + operatorRtoName + ' — Identity Verification & Telemetry Terminal</p>' +

                    '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-md); padding:1.5rem; margin-bottom:1.5rem;">' +
                        '<label style="font-weight:700; font-size:0.9rem; color:var(--text-main); display:block; margin-bottom:0.5rem;">Search Scheduled Applicant Appointment</label>' +
                        '<div style="display:flex; gap:0.6rem;">' +
                            '<input type="text" id="testCentreAppInput" value="APP-206500" placeholder="Enter Application ID (e.g. APP-206500)" style="flex:1; text-transform:uppercase;" onkeyup="if(event.key===\'Enter\') testCentreSearchApp()">' +
                            '<button type="button" class="btn btn-primary" onclick="testCentreSearchApp()"><i class="fa-solid fa-magnifying-glass"></i> Load Applicant</button>' +
                        '</div>' +
                    '</div>' +

                    '<div style="margin-top:1.5rem;">' +
                        '<h4 style="font-size:0.9rem; font-weight:700; color:var(--text-main); margin-bottom:0.75rem;">Scheduled Test Appointments Queue (' + operatorRtoCode + ')</h4>' +
                        '<div style="overflow-x:auto;">' +
                            '<table class="data-table">' +
                                '<thead><tr><th>App ID</th><th>Applicant Name</th><th>Vehicle Categories</th><th>Scheduled Date</th><th>Evidence Status</th><th>Action</th></tr></thead>' +
                                '<tbody>' + rows + '</tbody>' +
                            '</table>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    var app = state.matchedApp;
    var sd = app.serviceDetails || {};
    var videoName = app.id + '_TestVideo.mp4';

    if (state.step === 'found') {
        var idVerified = state.identityVerified;
        var apptVerified = state.appointmentVerified;
        var isReadyToStart = idVerified && apptVerified;

        return '<div class="mb-6"><button class="btn btn-back" onclick="resetTestCentreWorkflow()"><i class="fa-solid fa-arrow-left"></i> Search Another</button></div>' +
            '<div class="animate-in" style="max-width:840px; margin:0 auto;">' +
                '<div class="card" style="padding:2.25rem 2rem;">' +
                    '<div class="flex-between" style="margin-bottom:1.25rem; border-bottom:1px solid var(--border); padding-bottom:0.75rem;">' +
                        '<div>' +
                            '<h3 style="font-size:1.2rem; font-weight:700; color:var(--text-main); margin:0;">DriveSetu RTO Test Centre — Pre-Test Session Verification</h3>' +
                            '<p style="font-size:0.8rem; color:var(--text-muted); margin:0.2rem 0 0 0;">Physical Attendance at Test Centre: TG-03 (Medchal / Hyderabad West)</p>' +
                        '</div>' +
                        '<span class="badge badge-approved" style="font-size:0.8rem;"><i class="fa-solid fa-calendar-check"></i> Slot Confirmed</span>' +
                    '</div>' +

                    '<!-- Candidate & Appointment Overview Card -->' +
                    '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem;">' +
                        '<div class="grid-2" style="font-size:0.85rem;">' +
                            '<div><span style="color:var(--text-muted);">Applicant Name:</span> <strong>' + app.name + '</strong></div>' +
                            '<div><span style="color:var(--text-muted);">Application ID:</span> <strong>' + app.id + '</strong></div>' +
                        '</div>' +
                        '<div class="grid-2" style="font-size:0.85rem; margin-top:0.5rem;">' +
                            '<div><span style="color:var(--text-muted);">Learner Licence ID:</span> <strong>' + (sd.llNumber || 'TS009/LLR/2026/10293') + '</strong></div>' +
                            '<div><span style="color:var(--text-muted);">Vehicle Categories:</span> <strong>' + ((app.vehicleClasses && app.vehicleClasses.length>0)?app.vehicleClasses.join(', '):(sd.vehicleClass||'MCWG, LMV')) + '</strong></div>' +
                        '</div>' +
                        '<div class="grid-2" style="font-size:0.85rem; margin-top:0.5rem;">' +
                            '<div><span style="color:var(--text-muted);">Test Centre RTO:</span> <strong>RTA Medchal / Hyderabad West (TG-03)</strong></div>' +
                            '<div><span style="color:var(--text-muted);">Scheduled Date & Time:</span> <strong>' + (sd.allocatedTestDate || '15 Aug 2026') + ' (' + (sd.allocatedTestStartTime || '11:00 AM') + ' - ' + (sd.allocatedTestEndTime || '12:00 PM') + ')</strong></div>' +
                        '</div>' +
                    '</div>' +

                    '<!-- Pre-Test Verification Box -->' +
                    '<div style="background:#f8faf9; border:1px solid var(--border); border-radius:var(--radius-md); padding:1.5rem; margin-bottom:1.5rem;">' +
                        '<h4 style="font-size:0.95rem; font-weight:700; color:var(--text-main); margin-bottom:0.5rem;"><i class="fa-solid fa-user-check" style="color:var(--primary);"></i> APPLICANT PRE-TEST VERIFICATION</h4>' +
                        '<p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1.25rem;">Complete physical applicant verification prior to initializing automated track cameras and vehicle OBD-II telemetry hardware.</p>' +
                        
                        '<div class="grid-2" style="gap:1rem; margin-bottom:1.25rem;">' +
                            '<div style="background:#fff; border:1px solid var(--border); border-radius:var(--radius-sm); padding:1rem; text-align:center;">' +
                                '<div style="font-weight:700; font-size:0.85rem; margin-bottom:0.5rem;">Identity Verification</div>' +
                                (idVerified
                                    ? '<div style="color:#148f60; font-weight:700; font-size:0.84rem;"><i class="fa-solid fa-circle-check"></i> ✓ Identity Verified (Face Match 99.8%)</div>'
                                    : '<button type="button" class="btn btn-ghost" style="font-size:0.8rem; padding:0.45rem 0.85rem; border:1px solid var(--primary); color:var(--primary);" onclick="testCentreVerifyIdentity()"><i class="fa-solid fa-camera"></i> Verify Identity</button>') +
                            '</div>' +
                            '<div style="background:#fff; border:1px solid var(--border); border-radius:var(--radius-sm); padding:1rem; text-align:center;">' +
                                '<div style="font-weight:700; font-size:0.85rem; margin-bottom:0.5rem;">Appointment Verification</div>' +
                                (apptVerified
                                    ? '<div style="color:#148f60; font-weight:700; font-size:0.84rem;"><i class="fa-solid fa-circle-check"></i> ✓ Appointment Verified (Slot Confirmed)</div>'
                                    : '<button type="button" class="btn btn-ghost" style="font-size:0.8rem; padding:0.45rem 0.85rem; border:1px solid var(--primary); color:var(--primary);" onclick="testCentreVerifyAppointment()"><i class="fa-solid fa-calendar-check"></i> Verify Appointment</button>') +
                            '</div>' +
                        '</div>' +
                    '</div>' +

                    '<!-- START TEST BUTTON -->' +
                    (isReadyToStart
                        ? '<button type="button" class="btn btn-primary" style="width:100%; justify-content:center; padding:0.85rem; font-size:1rem;" onclick="testCentreStartTest()"><i class="fa-solid fa-play"></i> START DRIVING TEST</button>'
                        : '<button type="button" class="btn btn-ghost" style="width:100%; justify-content:center; padding:0.85rem; font-size:0.95rem; opacity:0.6; cursor:not-allowed;" disabled><i class="fa-solid fa-lock"></i> Verify Identity & Appointment to Enable Test</button>') +
                '</div>' +
            '</div>';
    }

    if (state.step === 'in_progress') {
        var timerStr = formatTestTimer(state.testTimerSeconds || 0);
        var initialTelemetry = getDeterministicTelemetry(state.testTimerSeconds || 0);
        var initialLogs = getDeterministicLogs(state.testTimerSeconds || 0);

        var eventsHTML = initialLogs.map(function(ev) {
            var colorStyle = ev.type === 'warning' ? 'color:#fbbf24;' : 'color:#34d399;';
            return '<div style="' + colorStyle + ' margin-bottom:0.4rem;"><strong style="color:#94a3b8;">[' + ev.time + ']</strong> ' + ev.text + '</div>';
        }).join('');

        return '<div class="mb-6"><button class="btn btn-back" onclick="resetTestCentreWorkflow()"><i class="fa-solid fa-arrow-left"></i> Abort Test</button></div>' +
            '<div class="animate-in" style="max-width:960px; margin:0 auto;">' +
                '<!-- Header & Session Overview -->' +
                '<div class="card" style="padding:1.5rem; margin-bottom:1.25rem;">' +
                    '<div class="flex-between" style="border-bottom:1px solid var(--border); padding-bottom:0.75rem; margin-bottom:0.75rem;">' +
                        '<div>' +
                            '<h2 style="font-size:1.25rem; font-weight:700; color:var(--text-main); margin:0;">DriveSetu RTO Test Centre — Live Driving Test Session</h2>' +
                            '<p style="font-size:0.8rem; color:var(--text-muted); margin:0.2rem 0 0 0;">Physical Test Centre: <strong>RTA Medchal (TG-03)</strong> &nbsp;•&nbsp; Application ID: <strong>' + app.id + '</strong> &nbsp;•&nbsp; Candidate: <strong>' + app.name + '</strong> &nbsp;•&nbsp; Vehicle: <strong>MCWG, LMV</strong></p>' +
                        '</div>' +
                        '<div style="text-align:right;">' +
                            '<span id="recordingStatusBadge" class="badge" style="background:#ef4444; color:#fff; font-size:0.8rem; padding:0.35rem 0.75rem; margin-right:0.4rem;"><i class="fa-solid fa-circle-dot animate-pulse"></i> RECORDING</span>' +
                            '<span class="badge" style="background:#10b981; color:#fff; font-size:0.8rem; padding:0.35rem 0.75rem;"><i class="fa-solid fa-wifi"></i> CONNECTED</span>' +
                        '</div>' +
                    '</div>' +

                    '<!-- Test Progress Stepper -->' +
                    '<div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); padding:0.6rem 1rem; font-size:0.75rem; font-weight:700;">' +
                        '<span style="color:#10b981;"><i class="fa-solid fa-circle-check"></i> TEST STARTED</span>' +
                        '<span style="color:#e2e8f0;">➔</span>' +
                        '<span style="color:#10b981;"><i class="fa-solid fa-video"></i> CAMERA RECORDING</span>' +
                        '<span style="color:#e2e8f0;">➔</span>' +
                        '<span style="color:#10b981;"><i class="fa-solid fa-microchip"></i> SENSOR TELEMETRY</span>' +
                        '<span style="color:#e2e8f0;">➔</span>' +
                        '<span style="color:#3b82f6;"><i class="fa-solid fa-brain"></i> AI ANALYSIS</span>' +
                        '<span style="color:#e2e8f0;">➔</span>' +
                        '<span style="color:var(--text-muted);"><i class="fa-solid fa-flag-checkered"></i> TEST COMPLETION</span>' +
                    '</div>' +
                '</div>' +

                '<!-- Grid 2: Real Camera Video Feed (pika.mp4) + Vehicle Sensor Telemetry -->' +
                '<div class="grid-2" style="grid-template-columns: 1.3fr 1fr; gap:1.25rem; margin-bottom:1.25rem;">' +
                    '<!-- 1. CAMERA PANEL (EMBEDDED UPLOADED PIKA.MP4 VIDEO FEED WITH OVERLAYS) -->' +
                    '<div class="card camera-video-wrapper" style="padding:1.25rem; background:#0f172a; color:#fff;">' +
                        '<div class="flex-between" style="border-bottom:1px solid #334155; padding-bottom:0.5rem; margin-bottom:0.75rem; font-size:0.8rem;">' +
                            '<span style="font-weight:700; color:#38bdf8;"><i class="fa-solid fa-video"></i> PROTOTYPE CAMERA SIMULATION</span>' +
                            '<span style="background:#ef4444; color:#fff; font-size:0.7rem; padding:0.2rem 0.5rem; border-radius:4px; font-weight:700;">● REC <span id="recTimerOverlay">' + timerStr + '</span></span>' +
                        '</div>' +
                        
                        '<!-- UPLOADED MOTORCYCLE TEST TRACK MP4 VIDEO DISPLAY -->' +
                        '<div style="position:relative; width:100%; height:250px; background:#000; border:1px solid #334155; border-radius:6px; overflow:hidden;">' +
                            '<video id="testCameraVideoFeed" autoplay loop muted playsinline style="width:100%; height:100%; object-fit:cover; display:block;">' +
                                '<source src="pika.mp4" type="video/mp4">' +
                                '<source src="pika-738a6366-178f-43f5-8ab3-e115a75ceaf9.mp4" type="video/mp4">' +
                            '</video>' +
                            
                            '<!-- TOP LEFT OVERLAY -->' +
                            '<div style="position:absolute; top:10px; left:10px; font-size:0.72rem; font-family:monospace; color:#38bdf8; background:rgba(15,23,42,0.85); padding:3px 8px; border-radius:4px; border:1px solid rgba(56,189,248,0.3); font-weight:bold; letter-spacing:0.5px; pointer-events:none; z-index:2;">' +
                                'CAM-01 • TEST TRACK CAMERA' +
                            '</div>' +

                            '<!-- TOP RIGHT OVERLAY -->' +
                            '<div style="position:absolute; top:10px; right:10px; font-size:0.72rem; font-family:monospace; color:#ef4444; background:rgba(0,0,0,0.75); padding:3px 8px; border-radius:4px; border:1px solid rgba(239,68,68,0.4); font-weight:bold; pointer-events:none; z-index:2;">' +
                                '<i class="fa-solid fa-circle animate-pulse" style="font-size:0.6rem; margin-right:4px;"></i> REC <span id="cameraRecTime">' + timerStr + '</span>' +
                            '</div>' +

                            '<!-- BOTTOM OVERLAY -->' +
                            '<div style="position:absolute; bottom:10px; left:10px; font-size:0.7rem; font-family:monospace; color:#94a3b8; background:rgba(15,23,42,0.85); padding:3px 8px; border-radius:4px; border:1px solid #334155; pointer-events:none; z-index:2;">' +
                                'LIVE TEST EVIDENCE • 1080p • pika.mp4' +
                            '</div>' +
                        '</div>' +

                        '<!-- PROFESSIONAL VIDEO PLAYER CONTROLS BAR -->' +
                        '<div style="background:#1e293b; border-top:1px solid #334155; border-radius:0 0 6px 6px; padding:0.6rem 0.8rem; display:flex; align-items:center; gap:0.75rem; margin-top:-1px;">' +
                            '<button type="button" id="videoPlayPauseBtn" onclick="toggleTestVideoPlay()" style="background:none; border:none; color:#38bdf8; font-size:1.1rem; cursor:pointer; padding:0 4px;" title="Play / Pause">' +
                                '<i class="fa-solid fa-pause"></i>' +
                            '</button>' +
                            '<input type="range" id="videoTimelineSlider" min="0" max="40" value="' + (state.testTimerSeconds || 0) + '" oninput="seekTestVideoTimeline(this.value)" style="flex:1; accent-color:#38bdf8; cursor:pointer; height:4px;">' +
                            '<span id="videoTimeDisplay" style="font-size:0.72rem; font-family:monospace; color:#cbd5e1; white-space:nowrap;">' + timerStr + ' / 00:40</span>' +
                            '<button type="button" onclick="toggleTestVideoMute()" style="background:none; border:none; color:#94a3b8; font-size:0.95rem; cursor:pointer;" title="Volume">' +
                                '<i id="videoMuteIcon" class="fa-solid fa-volume-high"></i>' +
                            '</button>' +
                            '<button type="button" onclick="toggleTestVideoFullscreen()" style="background:none; border:none; color:#94a3b8; font-size:0.95rem; cursor:pointer;" title="Fullscreen">' +
                                '<i class="fa-solid fa-expand"></i>' +
                            '</button>' +
                        '</div>' +
                    '</div>' +

                    '<!-- 5. LIVE VEHICLE SENSOR TELEMETRY PANEL -->' +
                    '<div class="card" style="padding:1.25rem;">' +
                        '<div style="font-size:0.82rem; font-weight:700; color:var(--text-main); margin-bottom:0.75rem; border-bottom:1px solid var(--border); padding-bottom:0.4rem;">' +
                            '<i class="fa-solid fa-gauge-high" style="color:var(--primary);"></i> PROTOTYPE VEHICLE SENSOR SIMULATION' +
                        '</div>' +
                        '<div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.82rem;">' +
                            '<div class="flex-between" style="padding:0.35rem; background:var(--bg); border-radius:4px;">' +
                                '<span style="color:var(--text-muted);">Vehicle Speed:</span>' +
                                '<strong id="telemetrySpeed" style="color:#10b981;">' + initialTelemetry.speed + '</strong>' +
                            '</div>' +
                            '<div class="flex-between" style="padding:0.35rem; background:var(--bg); border-radius:4px;">' +
                                '<span style="color:var(--text-muted);">Acceleration:</span>' +
                                '<strong id="telemetryAccel">' + initialTelemetry.accel + '</strong>' +
                            '</div>' +
                            '<div class="flex-between" style="padding:0.35rem; background:var(--bg); border-radius:4px;">' +
                                '<span style="color:var(--text-muted);">Braking Status:</span>' +
                                '<strong id="telemetryBraking">' + initialTelemetry.braking + '</strong>' +
                            '</div>' +
                            '<div class="flex-between" style="padding:0.35rem; background:var(--bg); border-radius:4px;">' +
                                '<span style="color:var(--text-muted);">Lateral Movement:</span>' +
                                '<strong id="telemetryLateral">' + initialTelemetry.lateral + '</strong>' +
                            '</div>' +
                            '<div class="flex-between" style="padding:0.35rem; background:var(--bg); border-radius:4px;">' +
                                '<span style="color:var(--text-muted);">Steering / Turning:</span>' +
                                '<strong id="telemetryTurning">' + initialTelemetry.turning + '</strong>' +
                            '</div>' +
                            '<div class="flex-between" style="padding:0.35rem; background:var(--bg); border-radius:4px;">' +
                                '<span style="color:var(--text-muted);">Vehicle Position:</span>' +
                                '<strong id="telemetryPosition">' + initialTelemetry.position + '</strong>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<!-- Grid 2: AI Live Event Stream & AI Analysis Summary -->' +
                '<div class="grid-2" style="grid-template-columns: 1.3fr 1fr; gap:1.25rem; margin-bottom:1.5rem;">' +
                    '<!-- 6. AI LIVE OBSERVATIONS TERMINAL -->' +
                    '<div class="card" style="padding:1.25rem; background:#090d16; color:#fff;">' +
                        '<div class="flex-between" style="border-bottom:1px solid #1e293b; padding-bottom:0.5rem; margin-bottom:0.75rem; font-size:0.8rem;">' +
                            '<span style="font-weight:700; color:#34d399;"><i class="fa-solid fa-bolt"></i> AI LIVE OBSERVATIONS (TIMESTAMPED LOG)</span>' +
                            '<span style="font-size:0.7rem; color:#94a3b8;">AUTO-SYNCED</span>' +
                        '</div>' +
                        '<div id="aiEventLogStream" style="background:#000; border:1px solid #1e293b; border-radius:6px; padding:0.85rem; font-family:monospace; font-size:0.75rem; max-height:140px; overflow-y:auto; line-height:1.5;">' +
                            eventsHTML +
                        '</div>' +
                    '</div>' +

                    '<!-- 7. LIVE AI ANALYSIS PANEL -->' +
                    '<div class="card" style="padding:1.25rem;">' +
                        '<div style="font-size:0.82rem; font-weight:700; color:var(--text-main); margin-bottom:0.6rem; border-bottom:1px solid var(--border); padding-bottom:0.4rem;">' +
                            '<i class="fa-solid fa-brain" style="color:var(--primary);"></i> AI ANALYSIS SUMMARY' +
                        '</div>' +
                        '<div style="font-size:0.8rem; line-height:1.6;">' +
                            '<div class="flex-between"><span>Status:</span> <strong style="color:#096dd9;">● Monitoring Test</strong></div>' +
                            '<div class="flex-between"><span>Camera Observations:</span> <strong>6 Captured</strong></div>' +
                            '<div class="flex-between"><span>Sensor Events:</span> <strong>42 Logged</strong></div>' +
                            '<div class="flex-between"><span>Potential Violations:</span> <strong style="color:#d46b08;">1 Flagged</strong></div>' +
                            '<div class="flex-between" style="margin-top:0.4rem; border-top:1px solid var(--border); padding-top:0.4rem;">' +
                                '<span>Telemetry Score:</span> <strong style="color:#148f60; font-size:0.95rem;">92 / 100 (PASSED)</strong>' +
                            '</div>' +
                            '<div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.4rem; line-height:1.3;">' +
                                '<em>Note: AI output serves as decision support. Requires final evaluation by independent RTO officer.</em>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<!-- COMPLETE DRIVING TEST BUTTON -->' +
                '<button type="button" class="btn btn-primary" style="width:100%; justify-content:center; padding:0.9rem; font-size:1rem;" onclick="testCentreCompleteTest()"><i class="fa-solid fa-flag-checkered"></i> COMPLETE DRIVING TEST</button>' +
            '</div>' +
        '</div>';
    }

    if (state.step === 'completed') {
        return '<div class="animate-in" style="max-width:760px; margin:2rem auto;">' +
            '<div class="card" style="padding:2.25rem 2rem;">' +
                '<div style="width:68px; height:68px; border-radius:50%; background:#e8f7f1; color:#148f60; font-size:2rem; display:flex; align-items:center; justify-content:center; margin:0 auto 1rem auto;">' +
                    '<i class="fa-solid fa-circle-check"></i>' +
                '</div>' +
                '<h2 style="font-size:1.35rem; font-weight:700; color:var(--text-main); margin-bottom:0.3rem; text-align:center;">Driving Test Completed</h2>' +
                '<p style="font-size:0.84rem; color:var(--text-muted); text-align:center; margin-bottom:1.5rem;">Application ID: <strong>' + app.id + '</strong> &nbsp;•&nbsp; Candidate: <strong>' + app.name + '</strong></p>' +

                '<!-- Captured Evidence Summary Cards -->' +
                '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem;">' +
                    '<h4 style="font-size:0.9rem; font-weight:700; color:var(--text-main); margin-bottom:0.75rem; border-bottom:1px solid var(--border); padding-bottom:0.35rem;">Captured Test Evidence & Telemetry</h4>' +
                    '<div class="flex-between" style="padding:0.4rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">Driving Test Result:</span><strong style="color:#148f60;">✓ Test Completed</strong></div>' +
                    '<div class="flex-between" style="padding:0.4rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">Original Camera Video:</span><strong style="color:#148f60;">✓ Captured (' + videoName + ')</strong></div>' +
                    '<div class="flex-between" style="padding:0.4rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">Vehicle Sensor Log:</span><strong style="color:#148f60;">✓ Captured (' + app.id + '_Telemetry)</strong></div>' +
                    '<div class="flex-between" style="padding:0.4rem 0; font-size:0.85rem;"><span style="color:var(--text-muted);">AI Analysis Report:</span><strong style="color:#148f60;">✓ Generated (' + app.id + '_AI_Report.pdf)</strong></div>' +
                '</div>' +

                '<button type="button" class="btn btn-primary" style="width:100%; justify-content:center; padding:0.85rem; font-size:0.95rem;" onclick="testCentreGenerateAiReport()"><i class="fa-solid fa-lock"></i> LOCK EVIDENCE & PREVIEW PACKAGE</button>' +
            '</div>' +
        '</div>';
    }

    if (state.step === 'ai_generated' || state.step === 'locked') {
        var isLocked = state.step === 'locked';
        var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(window.location.origin + window.location.pathname + '#verify-evidence?ev=EV-' + app.id.replace('APP-', ''));

        return '<div class="animate-in" style="max-width:800px; margin:2rem auto;">' +
            '<div class="card" style="padding:2.25rem 2rem;">' +
                '<div class="flex-between" style="margin-bottom:1rem; border-bottom:1px solid var(--border); padding-bottom:0.75rem;">' +
                    '<div>' +
                        '<h3 style="font-size:1.2rem; font-weight:700; color:var(--text-main); margin:0;">EVIDENCE PACKAGE & INDEPENDENT ALLOCATION</h3>' +
                        '<p style="font-size:0.78rem; color:var(--text-muted); margin:0.2rem 0 0 0;">DriveSetu Secured Evidence Package EV-' + app.id.replace('APP-', '') + '</p>' +
                    '</div>' +
                    '<span class="badge badge-approved" style="font-size:0.8rem;"><i class="fa-solid fa-lock"></i> Evidence Locked</span>' +
                '</div>' +

                '<!-- Locked Evidence Package Block -->' +
                '<div style="background:#e8f7f1; border:1px solid #c2ead8; border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem;">' +
                    '<div style="font-weight:700; font-size:0.95rem; color:#148f60; margin-bottom:0.5rem;">' +
                        '<i class="fa-solid fa-shield-halved"></i> 🔒 EVIDENCE PACKAGE LOCKED (READ-ONLY)' +
                    '</div>' +
                    '<div style="display:grid; grid-template-columns: 1fr 140px; gap:1rem; align-items:center;">' +
                        '<div style="font-size:0.82rem; color:var(--text-main); line-height:1.6;">' +
                            '<div>Application ID: <strong>' + app.id + '</strong></div>' +
                            '<div>Evidence ID: <strong>EV-' + app.id.replace('APP-', '') + '</strong></div>' +
                            '<div>Original Video: <strong style="color:#148f60;">READ ONLY (' + videoName + ')</strong></div>' +
                            '<div>Sensor Data: <strong style="color:#148f60;">READ ONLY (' + app.id + '_Telemetry)</strong></div>' +
                            '<div>AI Report: <strong style="color:#148f60;">READ ONLY (' + app.id + '_AI_Report.pdf)</strong></div>' +
                            '<div style="word-break:break-all; margin-top:0.3rem;">Integrity SHA-256 Hash: <br><code style="font-size:0.72rem; background:#fff; padding:2px 6px; border-radius:4px; color:#148f60;">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code></div>' +
                        '</div>' +
                        '<div style="text-align:center;">' +
                            '<a href="#verify-evidence?ev=EV-' + app.id.replace('APP-', '') + '"><img src="' + qrUrl + '" style="width:110px; height:110px; border-radius:6px; border:1px solid #c2ead8;" title="Scan QR Code to Verify Evidence Package"></a>' +
                            '<div style="font-size:0.68rem; color:var(--text-muted); margin-top:0.2rem;">Verification QR</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

        '</div>';
    }
}

// ─── QR EVIDENCE VERIFICATION PAGE ───
function renderEvidenceVerificationPage() {
    var hash = window.location.hash || '';
    var evMatch = hash.match(/ev=([^&]+)/);
    var rawEv = evMatch ? decodeURIComponent(evMatch[1]) : 'EV-206500';
    var appId = rawEv.replace('EV-', 'APP-');
    if (appId.indexOf('APP-') === -1) appId = 'APP-' + appId;

    var apps = getStoredApplications();
    var matchedApp = null;
    for (var i = 0; i < apps.length; i++) {
        if (apps[i].id === appId || apps[i].id.replace('APP-', '') === rawEv.replace('EV-', '')) {
            matchedApp = apps[i];
            break;
        }
    }

    var candidateName = matchedApp ? matchedApp.name : 'Rahul Sharma (' + appId + ')';
    var evidenceId = (matchedApp && matchedApp.evidenceId) ? matchedApp.evidenceId : ('EV-' + appId.replace('APP-', ''));
    var hashVal = (matchedApp && matchedApp.integrityHash) ? matchedApp.integrityHash : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    var rtoText = (matchedApp && matchedApp.serviceDetails && matchedApp.serviceDetails.rtoOfficeName) ? matchedApp.serviceDetails.rtoOfficeName : 'RTA Medchal / Hyderabad West (TG-03)';

    var evalText = 'Assigned for Dual Cross-RTO Independent Review';
    if (matchedApp && matchedApp.evaluator1 && matchedApp.evaluator2) {
        evalText = matchedApp.evaluator1.name + ' (' + matchedApp.evaluator1.rtoCode + ') & ' + matchedApp.evaluator2.name + ' (' + matchedApp.evaluator2.rtoCode + ')';
    }

    var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=' + encodeURIComponent(window.location.href);

    return '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'home\'"><i class="fa-solid fa-arrow-left"></i> Home</button></div>' +
        '<div class="animate-in" style="max-width:760px; margin:0 auto;">' +
            '<div class="card" style="padding:2.25rem 2rem;">' +
                '<div class="flex-between" style="margin-bottom:1.25rem; border-bottom:1px solid var(--border); padding-bottom:0.75rem;">' +
                    '<div>' +
                        '<h2 style="font-size:1.3rem; font-weight:700; color:var(--text-main); margin:0;">EVIDENCE VERIFICATION PORTAL</h2>' +
                        '<p style="font-size:0.8rem; color:var(--text-muted); margin:0.2rem 0 0 0;">DriveSetu Public Evidence Integrity Inspector</p>' +
                    '</div>' +
                    '<span class="badge badge-approved" style="font-size:0.8rem;"><i class="fa-solid fa-shield-check"></i> Cryptographically Verified</span>' +
                '</div>' +

                '<div style="background:#e8f7f1; border:1px solid #c2ead8; border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem;">' +
                    '<div class="flex-between" style="margin-bottom:0.5rem;">' +
                        '<span style="font-size:1rem; font-weight:700; color:#148f60;"><i class="fa-solid fa-lock"></i> Evidence ID: ' + evidenceId + '</span>' +
                        '<span class="badge badge-approved">READ-ONLY LOCKED</span>' +
                    '</div>' +
                    '<div style="font-size:0.82rem; color:var(--text-main); line-height:1.6;">' +
                        '<div>SHA-256 Integrity Hash: <code style="font-size:0.74rem; background:#fff; padding:2px 6px; border-radius:4px;">' + hashVal + '</code></div>' +
                        '<div>Candidate: <strong>' + candidateName + '</strong></div>' +
                        '<div>Physical Test Centre: <strong>' + rtoText + '</strong></div>' +
                        '<div>Independent Evaluation: <strong>Assigned automatically via Cross-RTO Allocation Engine</strong></div>' +
                        '<div>Test Status: <strong>Evidence Locked & Assigned for Cross-RTO Review</strong></div>' +
                    '</div>' +
                '</div>' +

                '<div class="grid-2" style="grid-template-columns: 1fr 160px; gap:1.25rem; margin-bottom:1.5rem; align-items:center;">' +
                    '<div>' +
                        '<h4 style="font-size:0.9rem; font-weight:700; color:var(--text-main); margin-bottom:0.5rem;">Audit & Chain of Custody Summary</h4>' +
                        '<ul style="font-size:0.82rem; color:var(--text-muted); line-height:1.6; padding-left:1.2rem;">' +
                            '<li>Biometric Identity Verification: Passed (Face & Fingerprint matched)</li>' +
                            '<li>Track Overhead Camera Feed: Recorded & Hashed (CAM-01 MP4)</li>' +
                            '<li>Vehicle OBD-II Sensor Log: Synchronized & Verified</li>' +
                            '<li>AI Telemetry Score: 92/100 (PASSED)</li>' +
                            '<li>Independent Evaluation: Assigned to Cross-RTO Officers to eliminate local bias</li>' +
                        '</ul>' +
                    '</div>' +
                    '<div style="text-align:center; background:#f8faf9; padding:0.75rem; border-radius:8px; border:1px solid var(--border);">' +
                        '<img src="' + qrUrl + '" style="width:130px; height:130px; border-radius:4px;" alt="QR Code">' +
                        '<div style="font-size:0.68rem; color:var(--text-muted); margin-top:0.3rem;">Verification QR Reference</div>' +
                    '</div>' +
                '</div>' +

                '<div style="display:flex; gap:0.75rem; justify-content:center;">' +
                    '<button type="button" class="btn btn-ghost" onclick="openVideoDocument(\'' + appId + '\')"><i class="fa-solid fa-file-video" style="color:#096dd9;"></i> View Locked Video</button>' +
                    '<button type="button" class="btn btn-ghost" onclick="viewPdfDocument(\'' + appId + '\')"><i class="fa-solid fa-file-pdf" style="color:#d46b08;"></i> View AI Report</button>' +
                '</div>' +
            '</div>' +
        '</div>';
}

// ─── PENDING TASKS HUB (USER-SCOPED) ───
function getPendingTasksForCitizen(session) {
    if (!session) return [];
    var apps = getStoredApplications();

    // Scope strictly to authenticated citizen
    var citizenApps = apps.filter(function(app) {
        if (!app) return false;
        var emailMatch = session.email && app.citizenId === session.email;
        var appIdMatch = session.appId && (app.id === session.appId || app.citizenId === session.appId);
        var nameMatch = session.name && app.name === session.name;
        return emailMatch || appIdMatch || nameMatch;
    });

    var pendingTasks = [];

    for (var i = 0; i < citizenApps.length; i++) {
        var app = citizenApps[i];
        var sd = app.serviceDetails || {};
        var evStatus = app.evidenceStatus || (app.testEvidence ? 'LOCKED' : 'Awaiting Driving Test');

        if (app.type === 'Permanent Licence' || app.type === 'Permanent Driving Licence') {
            if (app.status === 'Approved' || app.status === 'Rejected') {
                continue;
            }

            if (evStatus === 'Awaiting Driving Test' || (!app.testEvidence && (app.status === 'Pending' || app.status === 'Submitted'))) {
                // STATE 1: Before Driving Test
                pendingTasks.push({
                    id: 'task_' + app.id,
                    appId: app.id,
                    type: 'Permanent Licence Driving Test',
                    title: 'Permanent Driving Licence — Driving Test',
                    state: 1,
                    rtoOffice: sd.rtoOfficeName || 'RTA Hyderabad Central',
                    rtoCode: sd.rtoCode || 'TG-09',
                    address: sd.rtoAddress || 'Khairatabad, Hyderabad',
                    date: sd.allocatedTestDate || sd.preferredTestDate || app.date,
                    time: (sd.allocatedTestStartTime && sd.allocatedTestEndTime) ? (sd.allocatedTestStartTime + ' - ' + sd.allocatedTestEndTime) : '10:00 AM - 11:00 AM',
                    instruction: 'Attend your scheduled driving test at the designated test centre.'
                });
            } else if (evStatus === 'PROCESSING') {
                // STATE 2: After Driving Test, before AI analysis
                pendingTasks.push({
                    id: 'task_' + app.id,
                    appId: app.id,
                    type: 'Permanent Licence Evidence Processing',
                    title: 'Permanent Driving Licence — Test Evidence Processing',
                    state: 2,
                    instruction: 'Test Centre captured telemetry. AI Evaluation is processing.'
                });
            } else if (evStatus === 'LOCKED' || app.status === 'Pending RTO Review') {
                // STATE 3: After AI Analysis, RTO Review Pending
                pendingTasks.push({
                    id: 'task_' + app.id,
                    appId: app.id,
                    type: 'Permanent Licence RTO Review Pending',
                    title: 'Permanent Driving Licence — RTO Review Pending',
                    state: 3,
                    instruction: 'Test evidence and AI analysis locked. Awaiting RTO Officer decision.'
                });
            }
        } else if (app.type === "Learner's Licence") {
            if (app.status === 'Submitted' || app.status === 'Pending') {
                pendingTasks.push({
                    id: 'task_' + app.id,
                    appId: app.id,
                    type: "Learner's Licence Document Verification",
                    title: "Learner's Licence — LLR Computer Test Appointment",
                    state: 1,
                    rtoOffice: sd.rtoOfficeName || 'RTA Hyderabad Central',
                    rtoCode: sd.rtoCode || 'TG-09',
                    date: sd.allocatedTestDate || app.date,
                    time: (sd.allocatedTestStartTime && sd.allocatedTestEndTime) ? (sd.allocatedTestStartTime + ' - ' + sd.allocatedTestEndTime) : '10:00 AM - 11:00 AM',
                    instruction: 'Attend your scheduled LLR computer test at the RTO test centre.'
                });
            }
        } else if (app.type === "Renewal" || app.type === "Duplicate" || app.type === "Addition of Class" || app.type === "International Driving Permit") {
            if (app.status === 'Submitted' || app.status === 'Pending') {
                pendingTasks.push({
                    id: 'task_' + app.id,
                    appId: app.id,
                    type: app.type + " Application Verification",
                    title: app.type + " — Application Under RTO Review",
                    state: 3,
                    rtoOffice: sd.rtoOfficeName || 'RTA Hyderabad Central',
                    rtoCode: sd.rtoCode || 'TG-09',
                    date: app.date,
                    instruction: 'Your application is currently under RTO Officer review.'
                });
            }
        }
    }

    return pendingTasks;
}

function renderPendingTasksPage(session) {
    var tasks = getPendingTasksForCitizen(session);

    if (tasks.length === 0) {
        return '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-arrow-left"></i> Back to Citizen Portal</button></div>' +
            '<div class="animate-in" style="max-width:620px; margin:2rem auto;">' +
                '<div class="card" style="text-align:center; padding:2.5rem 2rem;">' +
                    '<div style="width:60px; height:60px; border-radius:50%; background:#e8f7f1; color:var(--primary); font-size:1.8rem; display:flex; align-items:center; justify-content:center; margin:0 auto 1rem auto;">' +
                        '<i class="fa-solid fa-circle-check"></i>' +
                    '</div>' +
                    '<h3 style="font-size:1.25rem; font-weight:700; color:var(--text-main); margin-bottom:0.4rem;">No pending tasks</h3>' +
                    '<p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.5rem;">Your applications currently require no action from you.</p>' +
                    '<button class="btn btn-primary" style="margin:0 auto;" onclick="window.location.hash=\'citizen-track\'"><i class="fa-solid fa-magnifying-glass"></i> View My Applications</button>' +
                '</div>' +
            '</div>';
    }

    var cardsHTML = tasks.map(function(t) {
        if (t.state === 1) {
            // STATE 1: Before Driving Test
            return '<div class="card" style="margin-bottom:1.25rem; border-left:4px solid #d46b08;">' +
                '<div class="flex-between" style="margin-bottom:0.75rem; border-bottom:1px solid var(--border); padding-bottom:0.6rem;">' +
                    '<div>' +
                        '<h3 style="font-size:1.05rem; font-weight:700; color:var(--text-main); margin:0;">' + t.title + '</h3>' +
                        '<p style="font-size:0.78rem; color:var(--text-muted); margin:0.15rem 0 0 0;">Application ID: <strong>' + t.appId + '</strong></p>' +
                    '</div>' +
                    '<span class="badge badge-pending" style="font-size:0.78rem;">● Test Scheduled</span>' +
                '</div>' +

                '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-md); padding:1rem; margin-bottom:1rem;">' +
                    '<div class="grid-2" style="font-size:0.82rem;">' +
                        '<div><span style="color:var(--text-muted);">RTO Test Centre:</span> <strong>' + t.rtoOffice + '</strong></div>' +
                        '<div><span style="color:var(--text-muted);">RTO Code:</span> <strong>' + t.rtoCode + '</strong></div>' +
                    '</div>' +
                    '<div class="grid-2" style="font-size:0.82rem; margin-top:0.4rem;">' +
                        '<div><span style="color:var(--text-muted);">Scheduled Date:</span> <strong>' + t.date + '</strong></div>' +
                        '<div><span style="color:var(--text-muted);">Slot Window:</span> <strong>' + t.time + '</strong></div>' +
                    '</div>' +
                '</div>' +

                '<div style="background:#fff7e6; border:1px solid #ffe7ba; border-radius:var(--radius-md); padding:0.75rem; font-size:0.82rem; color:#d46b08; margin-bottom:1rem;">' +
                    '<strong><i class="fa-solid fa-clock-rotate-left"></i> Action Required:</strong> ' + t.instruction +
                '</div>' +

                '<div style="display:flex; justify-content:flex-end;">' +
                    '<button class="btn btn-ghost" onclick="window.location.hash=\'citizen-track\'; quickTrack(\'' + t.appId + '\')"><i class="fa-solid fa-magnifying-glass"></i> Track Status Details</button>' +
                '</div>' +
            '</div>';
        } else if (t.state === 2) {
            // STATE 2: After Driving Test, processing AI
            return '<div class="card" style="margin-bottom:1.25rem; border-left:4px solid #10b981;">' +
                '<div class="flex-between" style="margin-bottom:0.75rem; border-bottom:1px solid var(--border); padding-bottom:0.6rem;">' +
                    '<div>' +
                        '<h3 style="font-size:1.05rem; font-weight:700; color:var(--text-main); margin:0;">' + t.title + '</h3>' +
                        '<p style="font-size:0.78rem; color:var(--text-muted); margin:0.15rem 0 0 0;">Application ID: <strong>' + t.appId + '</strong></p>' +
                    '</div>' +
                    '<span class="badge badge-approved" style="font-size:0.78rem;">✓ Test Completed</span>' +
                '</div>' +

                '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-md); padding:1rem; margin-bottom:1rem;">' +
                    '<div class="flex-between" style="padding:0.3rem 0; font-size:0.82rem;"><span style="color:var(--text-muted);">Original Camera Recording:</span><strong style="color:#148f60;">✓ Captured</strong></div>' +
                    '<div class="flex-between" style="padding:0.3rem 0; font-size:0.82rem;"><span style="color:var(--text-muted);">Vehicle Sensor Data:</span><strong style="color:#148f60;">✓ Captured</strong></div>' +
                    '<div class="flex-between" style="padding:0.3rem 0; font-size:0.82rem;"><span style="color:var(--text-muted);">AI Analysis:</span><strong style="color:#d46b08;">⏳ Processing</strong></div>' +
                    '<div class="flex-between" style="padding:0.3rem 0; font-size:0.82rem;"><span style="color:var(--text-muted);">Evidence Package:</span><strong style="color:var(--text-muted);">⏳ Pending</strong></div>' +
                '</div>' +

                '<div style="display:flex; justify-content:flex-end;">' +
                    '<button class="btn btn-ghost" onclick="window.location.hash=\'citizen-track\'; quickTrack(\'' + t.appId + '\')"><i class="fa-solid fa-magnifying-glass"></i> Track Status</button>' +
                '</div>' +
            '</div>';
        } else {
            // STATE 3: After AI Analysis, RTO Review Pending
            return '<div class="card" style="margin-bottom:1.25rem; border-left:4px solid var(--primary);">' +
                '<div class="flex-between" style="margin-bottom:0.75rem; border-bottom:1px solid var(--border); padding-bottom:0.6rem;">' +
                    '<div>' +
                        '<h3 style="font-size:1.05rem; font-weight:700; color:var(--text-main); margin:0;">' + t.title + '</h3>' +
                        '<p style="font-size:0.78rem; color:var(--text-muted); margin:0.15rem 0 0 0;">Application ID: <strong>' + t.appId + '</strong></p>' +
                    '</div>' +
                    '<span class="badge badge-approved" style="font-size:0.78rem;">🔒 Evidence Secured</span>' +
                '</div>' +

                '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-md); padding:1rem; margin-bottom:1rem;">' +
                    '<div class="flex-between" style="padding:0.3rem 0; font-size:0.82rem;"><span style="color:var(--text-muted);">Original Test Recording:</span><strong style="color:#148f60;">✓ Secured</strong></div>' +
                    '<div class="flex-between" style="padding:0.3rem 0; font-size:0.82rem;"><span style="color:var(--text-muted);">Vehicle / Sensor Data:</span><strong style="color:#148f60;">✓ Captured</strong></div>' +
                    '<div class="flex-between" style="padding:0.3rem 0; font-size:0.82rem;"><span style="color:var(--text-muted);">AI Analysis:</span><strong style="color:#148f60;">✓ Completed</strong></div>' +
                    '<div class="flex-between" style="padding:0.3rem 0; font-size:0.82rem;"><span style="color:var(--text-muted);">Evidence Package:</span><span class="badge badge-approved">🔒 Secured (Read-Only)</span></div>' +
                    '<div class="flex-between" style="padding:0.3rem 0; font-size:0.82rem;"><span style="color:var(--text-muted);">RTO Review:</span><strong style="color:#d46b08;">⏳ Pending Officer Decision</strong></div>' +
                '</div>' +

                '<div style="display:flex; justify-content:flex-end;">' +
                    '<button class="btn btn-ghost" onclick="window.location.hash=\'citizen-track\'; quickTrack(\'' + t.appId + '\')"><i class="fa-solid fa-magnifying-glass"></i> Track Status</button>' +
                '</div>' +
            '</div>';
        }
    }).join('');

    return '<div class="mb-6"><button class="btn btn-back" onclick="window.location.hash=\'citizen\'"><i class="fa-solid fa-arrow-left"></i> Back to Citizen Portal</button></div>' +
        '<div class="animate-in" style="max-width:750px; margin:0 auto;">' +
            '<div style="margin-bottom:1.5rem;">' +
                '<h2 style="font-size:1.35rem; font-weight:700; color:var(--text-main); margin-bottom:0.25rem;">Pending Tasks Hub</h2>' +
                '<p style="font-size:0.84rem; color:var(--text-muted);">Active application tasks requiring attention or currently under processing.</p>' +
            '</div>' +
            cardsHTML +
        '</div>';
}

// ─── RTO OFFICE & OFFICER REGISTRATION MODAL ───
function openRtoOfficeRegistrationModal() {
    var existingModal = document.getElementById('rtoRegModal');
    if (existingModal) existingModal.remove();

    var modalHTML = '<div id="rtoRegModal" class="modal-overlay">' +
        '<div class="executive-modal animate-in">' +
            '<div class="executive-modal-header">' +
                '<div>' +
                    '<h3><i class="fa-solid fa-building-flag" style="color:#60a5fa;"></i> Register RTO Office & Officer</h3>' +
                    '<p>Register a new RTO jurisdiction and its primary RTO Officer account.</p>' +
                '</div>' +
                '<button type="button" class="executive-modal-close" onclick="document.getElementById(\'rtoRegModal\').remove()">&times;</button>' +
            '</div>' +

            '<form id="rtoOfficeRegForm" class="executive-modal-body">' +
                '<!-- Section 1: Office Details -->' +
                '<div class="form-section-card">' +
                    '<div class="form-section-title"><i class="fa-solid fa-landmark" style="color:var(--primary);"></i> 1. RTO Office Details</div>' +
                    '<div class="form-grid-2">' +
                        '<div class="form-field-group">' +
                            '<label>RTO Office Name *</label>' +
                            '<input type="text" id="regOfficeName" class="form-field-input" placeholder="e.g. RTA Medchal / Hyderabad West" required>' +
                        '</div>' +
                        '<div class="form-field-group">' +
                            '<label>RTO Code / Number *</label>' +
                            '<input type="text" id="regRtoCode" class="form-field-input" placeholder="e.g. TG-03" required>' +
                        '</div>' +
                    '</div>' +
                    '<div class="form-grid-3">' +
                        '<div class="form-field-group">' +
                            '<label>RTO Type</label>' +
                            '<select id="regRtoType" class="form-field-select">' +
                                '<option value="Regional Transport Office">Regional Transport Office (RTO)</option>' +
                                '<option value="Unit Office">Unit Office</option>' +
                            '</select>' +
                        '</div>' +
                        '<div class="form-field-group">' +
                            '<label>State *</label>' +
                            '<input type="text" id="regState" class="form-field-input" value="Telangana" required>' +
                        '</div>' +
                        '<div class="form-field-group">' +
                            '<label>District *</label>' +
                            '<input type="text" id="regDistrict" class="form-field-input" placeholder="e.g. Medchal" required>' +
                        '</div>' +
                    '</div>' +
                    '<div class="form-field-group" style="margin-bottom:1rem;">' +
                        '<label>Office Physical Address *</label>' +
                        '<input type="text" id="regOfficeAddress" class="form-field-input" placeholder="Physical street address" required>' +
                    '</div>' +
                    '<div class="form-grid-3">' +
                        '<div class="form-field-group">' +
                            '<label>PIN Code</label>' +
                            '<input type="text" id="regPinCode" class="form-field-input" placeholder="500072">' +
                        '</div>' +
                        '<div class="form-field-group">' +
                            '<label>Office Phone</label>' +
                            '<input type="text" id="regOfficePhone" class="form-field-input" placeholder="040-23000003">' +
                        '</div>' +
                        '<div class="form-field-group">' +
                            '<label>Office Email</label>' +
                            '<input type="email" id="regOfficeEmail" class="form-field-input" placeholder="rto.tg03@drivesetu.com">' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<!-- Section 2: Officer Details -->' +
                '<div class="form-section-card">' +
                    '<div class="form-section-title"><i class="fa-solid fa-user-shield" style="color:var(--primary);"></i> 2. RTO Officer Account Details</div>' +
                    '<div class="form-grid-2">' +
                        '<div class="form-field-group">' +
                            '<label>Officer Full Name *</label>' +
                            '<input type="text" id="regOfficerName" class="form-field-input" placeholder="e.g. Officer K. Rao" required>' +
                        '</div>' +
                        '<div class="form-field-group">' +
                            '<label>Officer ID No <span class="help-text">(Auto-generated if empty)</span></label>' +
                            '<input type="text" id="regOfficerId" class="form-field-input" placeholder="e.g. OFF-TG03-01">' +
                        '</div>' +
                    '</div>' +
                    '<div class="form-grid-2">' +
                        '<div class="form-field-group">' +
                            '<label>Designation</label>' +
                            '<input type="text" id="regDesignation" class="form-field-input" value="RTO Reviewing Officer">' +
                        '</div>' +
                        '<div class="form-field-group">' +
                            '<label>Official Mobile</label>' +
                            '<input type="text" id="regOfficialMobile" class="form-field-input" placeholder="10-digit Mobile">' +
                        '</div>' +
                    '</div>' +
                    '<div class="form-field-group" style="margin-bottom:1rem;">' +
                        '<label>Official Email (Login Username) *</label>' +
                        '<input type="email" id="regOfficialEmail" class="form-field-input" placeholder="officer@drivesetu.com" required>' +
                    '</div>' +
                    '<div class="form-grid-2">' +
                        '<div class="form-field-group">' +
                            '<label>Password *</label>' +
                            '<input type="password" id="regPassword" class="form-field-input" placeholder="At least 6 characters" required minlength="6">' +
                        '</div>' +
                        '<div class="form-field-group">' +
                            '<label>Confirm Password *</label>' +
                            '<input type="password" id="regConfirmPassword" class="form-field-input" placeholder="Re-enter password" required minlength="6">' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<div class="executive-modal-footer" style="padding-left:0; padding-right:0; background:none; border:none;">' +
                    '<button type="button" class="btn btn-ghost" onclick="document.getElementById(\'rtoRegModal\').remove()">Cancel</button>' +
                    '<button type="submit" class="btn btn-primary" style="padding:0.65rem 1.4rem; font-size:0.9rem;"><i class="fa-solid fa-check-circle"></i> Complete Registration</button>' +
                '</div>' +
            '</form>' +
        '</div>' +
    '</div>';

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('rtoOfficeRegForm').onsubmit = async function(e) {
        e.preventDefault();
        var pass = document.getElementById('regPassword').value;
        var confirmPass = document.getElementById('regConfirmPassword').value;
        if (pass !== confirmPass) {
            alert('Passwords do not match. Please re-enter.');
            return;
        }

        var payload = {
            officeName: document.getElementById('regOfficeName').value.trim(),
            rtoCode: document.getElementById('regRtoCode').value.trim(),
            rtoType: document.getElementById('regRtoType').value,
            state: document.getElementById('regState').value.trim(),
            district: document.getElementById('regDistrict').value.trim(),
            officeAddress: document.getElementById('regOfficeAddress').value.trim(),
            pinCode: document.getElementById('regPinCode').value.trim(),
            officePhone: document.getElementById('regOfficePhone').value.trim(),
            officeEmail: document.getElementById('regOfficeEmail').value.trim(),

            officerName: document.getElementById('regOfficerName').value.trim(),
            officerId: document.getElementById('regOfficerId').value.trim(),
            designation: document.getElementById('regDesignation').value.trim(),
            officialEmail: document.getElementById('regOfficialEmail').value.trim(),
            officialMobile: document.getElementById('regOfficialMobile').value.trim(),
            password: pass
        };

        var btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registering...';

        try {
            var result = await DriveSetuSupabase.registerRTOOffice(payload);
            document.getElementById('rtoRegModal').remove();
            alert('✓ RTO Office & Officer account registered successfully!\n\nYou can now log in with ' + payload.officialEmail);
            
            // Auto login officer
            var officerSession = {
                email: payload.officialEmail,
                name: payload.officerName,
                role: 'RTO_OFFICER',
                rtoCode: payload.rtoCode,
                rtoName: payload.officeName,
                officerId: payload.officerId || ('OFF-' + payload.rtoCode),
                initials: payload.officerName.slice(0, 3).toUpperCase()
            };
            sessionStorage.setItem('rtoSession', JSON.stringify(officerSession));
            window.location.hash = 'rto';
            render();
        } catch(err) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Complete Registration';
            alert('Registration Failed: ' + (err.message || 'Server error.'));
        }
    };
}

// ─── CREATE RTO EMPLOYEE MODAL (FOR AUTHORIZED RTO OFFICERS) ───
function openCreateEmployeeModal(rtoCode, rtoOfficeId) {
    var existingModal = document.getElementById('empModal');
    if (existingModal) existingModal.remove();

    var modalHTML = '<div id="empModal" class="modal-overlay">' +
        '<div class="executive-modal animate-in" style="max-width:540px;">' +
            '<div class="executive-modal-header">' +
                '<div>' +
                    '<h3><i class="fa-solid fa-user-plus" style="color:#60a5fa;"></i> Add RTO Employee (' + (rtoCode || 'TG-03') + ')</h3>' +
                    '<p>Create an employee account belonging to RTO Office ' + (rtoCode || 'TG-03') + '</p>' +
                '</div>' +
                '<button type="button" class="executive-modal-close" onclick="document.getElementById(\'empModal\').remove()">&times;</button>' +
            '</div>' +

            '<form id="empAddForm" class="executive-modal-body">' +
                '<div class="form-field-group" style="margin-bottom:1rem;">' +
                    '<label>Employee Full Name *</label>' +
                    '<input type="text" id="empFullName" class="form-field-input" placeholder="e.g. Employee A" required>' +
                '</div>' +
                '<div class="form-grid-2">' +
                    '<div class="form-field-group">' +
                        '<label>Employee ID</label>' +
                        '<input type="text" id="empId" class="form-field-input" placeholder="EMP-' + (rtoCode || 'TG03') + '-01">' +
                    '</div>' +
                    '<div class="form-field-group">' +
                        '<label>Designation</label>' +
                        '<input type="text" id="empDesignation" class="form-field-input" value="Driving Test Inspector">' +
                    '</div>' +
                '</div>' +
                '<div class="form-grid-2">' +
                    '<div class="form-field-group">' +
                        '<label>Official Email *</label>' +
                        '<input type="email" id="empEmail" class="form-field-input" placeholder="employee@drivesetu.com" required>' +
                    '</div>' +
                    '<div class="form-field-group">' +
                        '<label>Official Mobile</label>' +
                        '<input type="text" id="empMobile" class="form-field-input" placeholder="Mobile Number">' +
                    '</div>' +
                '</div>' +
                '<div class="form-field-group" style="margin-bottom:1.5rem;">' +
                    '<label>Account Password *</label>' +
                    '<input type="password" id="empPassword" class="form-field-input" placeholder="At least 6 characters" required minlength="6">' +
                '</div>' +

                '<div class="executive-modal-footer" style="padding-left:0; padding-right:0; background:none; border:none;">' +
                    '<button type="button" class="btn btn-ghost" onclick="document.getElementById(\'empModal\').remove()">Cancel</button>' +
                    '<button type="submit" class="btn btn-primary" style="padding:0.65rem 1.4rem; font-size:0.9rem;"><i class="fa-solid fa-user-check"></i> Create Employee Account</button>' +
                '</div>' +
            '</form>' +
        '</div>' +
    '</div>';

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('empAddForm').onsubmit = async function(e) {
        e.preventDefault();
        var payload = {
            fullName: document.getElementById('empFullName').value.trim(),
            employeeId: document.getElementById('empId').value.trim() || ('EMP-' + Date.now().toString().slice(-4)),
            designation: document.getElementById('empDesignation').value.trim(),
            officialEmail: document.getElementById('empEmail').value.trim(),
            officialMobile: document.getElementById('empMobile').value.trim(),
            role: 'RTO_EMPLOYEE',
            rtoCode: rtoCode || 'TG-03',
            rtoOfficeId: rtoOfficeId || null,
            password: document.getElementById('empPassword').value
        };

        var btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating...';

        try {
            await DriveSetuSupabase.createRTOEmployee(payload);
            document.getElementById('empModal').remove();
            alert('✓ RTO Employee account created successfully under ' + (rtoCode || 'TG-03') + '!\n\nEmail: ' + payload.officialEmail);
            render();
        } catch(err) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-user-check"></i> Create Employee Account';
            alert('Employee Creation Failed: ' + (err.message || 'Server error.'));
        }
    };
}

// ─── INIT ───
window.addEventListener('hashchange', render);
render();




