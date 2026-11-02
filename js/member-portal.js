/**
 * SILLYGER (SG) Member Portal Controller (Phase 2)
 * Manages Member Login, Dashboard, WhatsApp Gate Lock/Unlock,
 * Attendance Check-in, Leave Requests, and Learning Tracker.
 */

document.addEventListener("DOMContentLoaded", () => {
    initMemberPortal();
});

function initMemberPortal() {
    const session = SGStore.getCurrentSession();
    const loginView = document.getElementById("login-view");
    const dashboardView = document.getElementById("dashboard-view");
    const urlParams = new URLSearchParams(window.location.search);
    const alertParam = urlParams.get("alert");
    const userParam = urlParams.get("user");

    // If redirected because admin was required but user was logged in as applicant
    if (alertParam === "admin_required") {
        const errorAlert = document.getElementById("login-error");
        if (errorAlert) {
            errorAlert.innerHTML = `
                <div class="space-y-2">
                    <p class="font-bold text-amber-300">⚠️ Ruhusa ya Utawala Inahitajika:</p>
                    <p>Umeingia kama <strong>@${userParam || (session ? session.username : 'applicant')}</strong> (Mtumiaji wa kawaida). Jopo la Utawala (Admin Dashboard) linaruhusiwa kwa Super Administrator pekee.</p>
                    <button onclick="handleMemberLogout()" class="mt-1 px-3 py-1 rounded bg-amber-500 text-slate-950 font-bold text-xs">
                        Ondoka na Uingie Kama Super Admin (willyger)
                    </button>
                </div>
            `;
            errorAlert.classList.remove("hidden");
        }
    }

    if (!session) {
        if (loginView) loginView.classList.remove("hidden");
        if (dashboardView) dashboardView.classList.add("hidden");
        setupLoginForm();
    } else {
        // Show Admin Panel shortcut only if authenticated user has admin privileges
        const isAdmin = (
            session.role === "Super Administrator" || 
            session.role === "Administrator" || 
            session.username === "willyger" || 
            session.email === "wshavu@gmail.com"
        );
        const adminSlot = document.getElementById("admin-link-slot");
        if (adminSlot) {
            adminSlot.innerHTML = isAdmin ? `
                <a href="admin-portal.html" class="px-3 py-1.5 rounded-lg bg-purple-950/70 border border-purple-500/50 text-purple-300 hover:text-white text-xs font-bold font-mono-sg flex items-center gap-1.5 transition">
                    <span>🛠️ Jopo la Uongozi</span>
                </a>
            ` : '';
        }

        if (loginView) loginView.classList.add("hidden");
        if (dashboardView) dashboardView.classList.remove("hidden");
        renderMemberDashboard(session);
    }
}

// -------------------------------------------------------------
// LOGIN VIEW & TEST DEMO SWITCHER
// -------------------------------------------------------------
function setupLoginForm() {
    const form = document.getElementById("member-login-form");
    const errorAlert = document.getElementById("login-error");

    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            errorAlert.classList.add("hidden");

            const credential = document.getElementById("login-credential").value.trim();
            const password = document.getElementById("login-password").value;

            try {
                const member = SGStore.findMemberByCredential(credential);
                if (!member) {
                    throw new Error("Hakuna mwanachama au mwombaji aliyepatikana kwa taarifa hizi. Hakikisha email, username au simu uliyoweka ni sahihi.");
                }

                // In Phase 1-3 local store, password check
                if (member.password_hash && password !== member.password_hash) {
                    if (member.username === "willyger" || member.email === "wshavu@gmail.com") {
                        throw new Error("Nenosiri si sahihi. Nenosiri la awali la Super Administrator (William) ni: admin123");
                    }
                    throw new Error("Nenosiri (Password) si sahihi. Tafadhali jaribu tena.");
                }

                // Record audit log
                SGStore.addAuditLog({
                    action: "MEMBER_LOGIN",
                    actor: member.username,
                    target: member.member_id || "PENDING",
                    details: `Member logged into Member Portal. Status: ${member.status}.`
                });

                // Set session
                SGStore.setCurrentSession(member);

                // Automatic smart routing: If admin logs in, route directly to Admin Dashboard!
                const isAdmin = (
                    member.role === "Super Administrator" || 
                    member.role === "Administrator" || 
                    member.username === "willyger" || 
                    member.email === "wshavu@gmail.com"
                );

                if (isAdmin) {
                    window.location.href = "admin-portal.html";
                    return;
                }

                initMemberPortal();

            } catch (err) {
                errorAlert.textContent = err.message || "Hitilafu imetokea wakati wa kuingia.";
                errorAlert.classList.remove("hidden");
            }
        };
    }
}

window.handleMemberLogout = function() {
    SGStore.logout();
    initMemberPortal();
};

// -------------------------------------------------------------
// MEMBER DASHBOARD RENDERING
// -------------------------------------------------------------
function renderMemberDashboard(member) {
    // Refresh member data from store to get latest status if updated
    const freshMember = SGStore.findMemberById(member.id) || member;

    // 1. Render Header & Identity
    renderMemberIdentity(freshMember);

    // 1.5. Render Super Admin Announcements (Article 6.8 & 11)
    renderMemberAnnouncements();

    // 2. Render WhatsApp Access Gate Card (Article 6.8 & 11.3)
    renderWhatsAppGate(freshMember);

    // 3. Render Learning Progress (Articles 6.5 & 8)
    renderLearningTracker(freshMember);

    // 4. Render Attendance Management (Articles 6.6 & 9)
    renderAttendanceSection(freshMember);

    // 5. Render Financials & SG Community Fund (Articles 6.10 & 13)
    renderFinancialRecords(freshMember);

    // 6. Setup Support & Leave Modals
    setupActionModals(freshMember);
}

function renderMemberIdentity(member) {
    const elName = document.getElementById("dash-full-name");
    const elUsername = document.getElementById("dash-username");
    const elMemberId = document.getElementById("dash-member-id");
    const elStatusBadge = document.getElementById("dash-status-badge");
    const elTrack = document.getElementById("dash-track");
    const elJoined = document.getElementById("dash-joined");
    const elRole = document.getElementById("dash-role");

    if (elName) elName.textContent = member.full_name;
    if (elUsername) elUsername.textContent = "@" + member.username;
    if (elRole) elRole.textContent = member.role || "Member";

    // Member ID Display
    if (elMemberId) {
        if (member.member_id) {
            elMemberId.textContent = member.member_id;
            elMemberId.className = "font-mono-sg text-base md:text-lg font-bold text-cyan-400 bg-cyan-950/70 border border-cyan-800/80 px-3 py-1 rounded-xl shadow-inner";
        } else {
            elMemberId.textContent = "Inasubiri Idhini (No ID Assigned)";
            elMemberId.className = "font-mono-sg text-xs md:text-sm font-semibold text-amber-400/90 bg-amber-950/40 border border-amber-800/50 px-3 py-1 rounded-xl";
        }
    }

    // Status Badge
    if (elStatusBadge) {
        const isPending = member.status === "PENDING";
        const isActive = member.status === "ACTIVE";
        const isHold = member.status === "ON_HOLD";
        const isSuspended = member.status === "SUSPENDED";

        let badgeClass = "badge-hold";
        let dotColor = "bg-purple-400";
        if (isActive) {
            badgeClass = "badge-active";
            dotColor = "bg-emerald-400";
        } else if (isPending) {
            badgeClass = "badge-pending";
            dotColor = "bg-amber-400 animate-pulse";
        } else if (isSuspended) {
            badgeClass = "badge-suspended";
            dotColor = "bg-red-400";
        }

        elStatusBadge.innerHTML = `
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono-sg font-bold uppercase tracking-wider ${badgeClass}">
                <span class="w-2 h-2 rounded-full ${dotColor}"></span>
                <span>${member.status}</span>
            </span>
        `;
    }

    if (elTrack) elTrack.textContent = member.track || "Computer Fundamentals";
    if (elJoined && member.created_at) {
        const date = new Date(member.created_at);
        elJoined.textContent = date.toLocaleDateString("sw-TZ", { year: 'numeric', month: 'short', day: 'numeric' });
    }
}

// -------------------------------------------------------------
// OFFICIAL ANNOUNCEMENTS FROM SUPER ADMIN
// -------------------------------------------------------------
function renderMemberAnnouncements() {
    const container = document.getElementById("member-announcements-slot");
    if (!container) return;

    const list = SGStore.getAnnouncements();
    if (list.length === 0) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = list.map(a => `
        <div class="sg-glass p-4 sm:p-5 rounded-2xl border ${a.priority === 'HIGH' ? 'border-amber-500/40 bg-amber-950/20' : 'border-cyan-500/30 bg-cyan-950/20'} flex items-start gap-3.5">
            <span class="text-xl mt-0.5">📢</span>
            <div class="flex-grow">
                <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-bold text-white font-mono-sg uppercase">${a.title}</span>
                    <span class="text-[10px] text-slate-400 font-mono-sg">${new Date(a.created_at).toLocaleDateString("sw-TZ")}</span>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed">${a.content}</p>
                <span class="text-[10px] text-slate-500 font-mono-sg block mt-1.5">— ${a.author}</span>
            </div>
        </div>
    `).join('');
}

// -------------------------------------------------------------
// CORE WORKFLOW: WHATSAPP ACCESS GATE CARD
// -------------------------------------------------------------
function renderWhatsAppGate(member) {
    const container = document.getElementById("whatsapp-gate-card");
    if (!container) return;

    const isActive = member.status === "ACTIVE";
    const isPending = member.status === "PENDING";

    if (isActive) {
        // UNLOCKED STATE (Article 6.8 & 11.3)
        container.innerHTML = `
            <div class="sg-glass p-6 md:p-8 rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 relative overflow-hidden shadow-2xl">
                <div class="absolute -right-6 -bottom-6 w-52 h-52 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none"></div>

                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div class="space-y-3">
                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs font-mono-sg font-bold">
                            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg>
                            <span>ACCESS GRANTED // WHATSAPP GATE UNLOCKED</span>
                        </div>
                        <h2 class="text-2xl md:text-3xl font-extrabold text-white">
                            Karibu Kwenye Jumuiya Rasmi ya WhatsApp!
                        </h2>
                        <p class="text-sm text-slate-300 max-w-xl leading-relaxed">
                            Akaunti yako imethibitishwa rasmi na una <strong>Unique Member ID: ${member.member_id}</strong>. Bonyeza kitufe hapa chini kujiunga moja kwa moja na kundi la mawasiliano na uratibu la Sillygerians.
                        </p>
                        <div class="text-[11px] font-mono-sg text-slate-400 flex items-center gap-3">
                            <span class="text-emerald-400">✓ Katiba Art. 6.8 & 11.3</span>
                            <span>•</span>
                            <span>Mawasiliano yenye staha na maadili ya kiteknolojia</span>
                        </div>
                    </div>

                    <div class="flex flex-col items-center sm:items-start md:items-end justify-center">
                        <a 
                            href="${SG_CONFIG.privateWhatsAppInvite}" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            class="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-base transition transform hover:-translate-y-0.5 shadow-xl shadow-emerald-500/25 flex items-center gap-3"
                        >
                            <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                            <span>Jiunge na WhatsApp Group &rarr;</span>
                        </a>
                        <span class="text-[10px] text-slate-400 font-mono-sg mt-2">Link ya kipekee kwa wanachama walioidhinishwa</span>
                    </div>
                </div>
            </div>
        `;
    } else if (isPending) {
        // STRICT LOCKED STATE FOR PENDING (Article 2 & Appendix A5)
        container.innerHTML = `
            <div class="sg-glass p-6 md:p-8 rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950 relative overflow-hidden shadow-2xl">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    
                    <div class="space-y-3">
                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-700/60 text-amber-300 text-xs font-mono-sg font-bold">
                            <svg class="w-4 h-4 text-amber-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            <span>ACCESS LOCKED // INASUBIRI IDHINI YA UTAWALA</span>
                        </div>
                        <h2 class="text-2xl font-extrabold text-white">
                            Kiungo cha WhatsApp Group Kimefungwa
                        </h2>
                        <p class="text-sm text-slate-300 max-w-xl leading-relaxed">
                            Maombi yako ya uanachama yamepokelewa na yanapitiwa na <strong class="text-amber-300">Membership Administrator</strong>. Kulingana na Katiba (Article 5 & 6.8), kiungo cha siri cha WhatsApp kinaruhusiwa tu kwa wanachama ambao hadhi yao imethibitishwa na kupewa <strong>Unique Member ID (SG-xxxxxx)</strong>.
                        </p>

                        <!-- Progress Steps Tracker -->
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 max-w-lg text-[11px] font-mono-sg">
                            <div class="p-2 rounded-lg bg-emerald-950/50 border border-emerald-700/50 text-emerald-300">
                                <span class="block font-bold">1. Usajili</span>
                                <span>✓ Umekamilika</span>
                            </div>
                            <div class="p-2 rounded-lg bg-amber-950/60 border border-amber-600/70 text-amber-300 animate-pulse">
                                <span class="block font-bold">2. Mapitio</span>
                                <span>⏳ Inakaguliwa...</span>
                            </div>
                            <div class="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-500">
                                <span class="block font-bold">3. Member ID</span>
                                <span>🔒 SG-xxxxxx</span>
                            </div>
                            <div class="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-500">
                                <span class="block font-bold">4. WhatsApp</span>
                                <span>🔒 Imefungwa</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col items-start md:items-end justify-center">
                        <button disabled class="px-6 py-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-500 font-bold text-sm cursor-not-allowed flex items-center gap-2">
                            <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            <span>Kiungo Kimezuiwa (Locked)</span>
                        </button>
                        <span class="text-[10px] text-slate-500 font-mono-sg mt-2">Hutafunguliwa hadi idhini itoke</span>
                    </div>

                </div>
            </div>
        `;
    } else {
        // SUSPENDED / ON_HOLD STATE
        container.innerHTML = `
            <div class="sg-glass p-6 md:p-8 rounded-3xl border border-red-500/40 bg-red-950/20">
                <div class="flex items-center gap-3 text-red-400 mb-2 font-mono-sg text-xs font-bold uppercase">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <span>AKAUNTI IMESIMAMISHWA AU IKO KWENYE MAPITIO (${member.status})</span>
                </div>
                <p class="text-sm text-slate-300">
                    Akaunti yako imewekwa kwenye hadhi ya <strong>${member.status}</strong> kwa mujibu wa taratibu za utawala (Katiba Article 18). Huna idhini ya kufikia vikundi vya jumuiya kwa sasa. Tafadhali wasiliana na utawala kupitia kitufe cha Msaada hapa chini.
                </p>
            </div>
        `;
    }
}

// -------------------------------------------------------------
// LEARNING TRACKER (Articles 6.5 & 8)
// -------------------------------------------------------------
function renderLearningTracker(member) {
    const listContainer = document.getElementById("curriculum-checklist");
    if (!listContainer) return;

    // Local progress stored per member
    const savedProgress = JSON.parse(localStorage.getItem(`sg_progress_${member.id}`)) || [1];

    listContainer.innerHTML = SG_CONFIG.CURRICULUM.map(c => {
        const isDone = savedProgress.includes(c.level);
        return `
            <div class="flex items-start gap-4 p-4 rounded-xl border ${isDone ? 'border-cyan-500/30 bg-cyan-950/20' : 'border-slate-800 bg-slate-900/40'} transition hover:border-slate-700">
                <button 
                    onclick="toggleCurriculumLevel('${member.id}', ${c.level})" 
                    class="mt-1 w-6 h-6 rounded-lg flex items-center justify-center font-mono-sg text-xs transition ${isDone ? 'bg-cyan-500 text-slate-950 font-bold' : 'border border-slate-700 text-slate-500 hover:border-cyan-400'}"
                    title="${isDone ? 'Weka kama haijakamilika' : 'Tia alama kuwa imekamilika'}"
                >
                    ${isDone ? '✓' : c.level}
                </button>
                <div class="flex-grow">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-sm font-bold ${isDone ? 'text-white' : 'text-slate-300'}">
                            Level ${c.level}: ${c.title}
                        </span>
                        <span class="text-[10px] font-mono-sg text-slate-500">Art. 8.${c.level}</span>
                    </div>
                    <p class="text-xs text-slate-400 leading-relaxed">
                        ${c.desc}
                    </p>
                </div>
            </div>
        `;
    }).join('');

    // Update Progress Percentage Bar
    const percent = Math.round((savedProgress.length / SG_CONFIG.CURRICULUM.length) * 100);
    const progressBar = document.getElementById("curriculum-progress-bar");
    const progressText = document.getElementById("curriculum-progress-text");
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressText) progressText.textContent = `${percent}% Imekamilika (${savedProgress.length}/${SG_CONFIG.CURRICULUM.length} Ngazi)`;
}

window.toggleCurriculumLevel = function(memberId, level) {
    let savedProgress = JSON.parse(localStorage.getItem(`sg_progress_${memberId}`)) || [1];
    if (savedProgress.includes(level)) {
        savedProgress = savedProgress.filter(l => l !== level);
    } else {
        savedProgress.push(level);
    }
    localStorage.setItem(`sg_progress_${memberId}`, JSON.stringify(savedProgress));
    
    // Refresh tracker
    const session = SGStore.getCurrentSession();
    if (session) renderLearningTracker(session);
};

// -------------------------------------------------------------
// ATTENDANCE & LEAVE MANAGEMENT (Articles 6.6, 9 & 10)
// -------------------------------------------------------------
function renderAttendanceSection(member) {
    const listContainer = document.getElementById("attendance-history-list");
    const counterPlanned = document.getElementById("count-planned-att");
    const counterVerified = document.getElementById("count-verified-att");

    const records = SGStore.getAttendanceRecords(member.member_id || member.username);

    const plannedCount = records.filter(r => r.is_planned).length;
    const verifiedCount = records.filter(r => r.is_verified).length;

    if (counterPlanned) counterPlanned.textContent = plannedCount;
    if (counterVerified) counterVerified.textContent = verifiedCount;

    if (!listContainer) return;

    if (records.length === 0) {
        listContainer.innerHTML = `
            <div class="p-6 text-center text-slate-500 text-xs font-mono-sg">
                Hakuna rekodi ya mahudhurio bado. Bonyeza "Panga Kuhudhuria" ili kuweka check-in.
            </div>
        `;
        return;
    }

    listContainer.innerHTML = records.map(r => `
        <div class="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs">
            <div>
                <span class="font-bold text-white block mb-0.5">${r.session_title}</span>
                <span class="text-slate-500 font-mono-sg text-[11px]">Tarehe: ${r.date}</span>
            </div>
            <div class="text-right">
                ${r.is_verified ? `
                    <span class="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono-sg badge-active uppercase">
                        ✓ Verified (${r.verified_by || 'Admin'})
                    </span>
                ` : `
                    <span class="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono-sg badge-pending uppercase">
                        Planned (Pending Verif.)
                    </span>
                `}
            </div>
        </div>
    `).join('');
}

// -------------------------------------------------------------
// FINANCIAL RECORDS & SG COMMUNITY FUND (Article 6.10 & 13)
// -------------------------------------------------------------
function renderFinancialRecords(member) {
    const elPersonalContrib = document.getElementById("stat-personal-contrib");
    const elFundBalance = document.getElementById("stat-community-fund-balance");

    if (elPersonalContrib) elPersonalContrib.textContent = "TZS 0.00 (Free Tier)";
    if (elFundBalance) {
        const bal = SGStore.getFundBalance();
        elFundBalance.textContent = "TZS " + bal.toLocaleString() + " (Rasilimali za Jumuiya)";
    }
}

// -------------------------------------------------------------
// ACTION MODALS: CHECK-IN, LEAVE REQUEST & SUPPORT TICKET
// -------------------------------------------------------------
function setupActionModals(member) {
    // 1. Check-in Button
    const btnCheckIn = document.getElementById("btn-checkin-attendance");
    if (btnCheckIn) {
        btnCheckIn.onclick = () => {
            const sessionName = prompt("Weka jina la kipindi unachopanga kuhudhuria (au bofya OK kwa kipindi kinachofuata):", "Upcoming Tech Session: Linux Kernels & Architecture");
            if (sessionName) {
                SGStore.recordPlannedAttendance(member.member_id || member.username, sessionName);
                alert("✓ Mahudhurio yako yamepangwa kikamilifu! (Planned Attendance recorded). Mkufunzi au Admin atathibitisha.");
                renderAttendanceSection(member);
            }
        };
    }

    // 2. Leave Request Form
    const leaveForm = document.getElementById("form-leave-request");
    if (leaveForm) {
        leaveForm.onsubmit = (e) => {
            e.preventDefault();
            const reason = document.getElementById("leave-reason").value.trim();
            const category = document.getElementById("leave-category").value;
            const duration = document.getElementById("leave-duration").value;

            if (!reason) {
                alert("Tafadhali eleza sababu ya kuomba ruhusa.");
                return;
            }

            SGStore.submitLeaveRequest(member.member_id || member.username, { reason, category, duration });
            alert("✓ Ombi lako la ruhusa limewasilishwa kwa utawala (Katiba Article 10). Mwanachama haondolewi kiholela.");
            leaveForm.reset();
            const modal = document.getElementById("modal-leave");
            if (modal) modal.classList.add("hidden");
        };
    }

    // 3. Support Ticket Form
    const ticketForm = document.getElementById("form-support-ticket");
    if (ticketForm) {
        ticketForm.onsubmit = (e) => {
            e.preventDefault();
            const subject = document.getElementById("ticket-subject").value.trim();
            const category = document.getElementById("ticket-category").value;
            const message = document.getElementById("ticket-message").value.trim();

            if (!subject || !message) {
                alert("Tafadhali jaza mada na maelezo ya ombi lako.");
                return;
            }

            SGStore.submitSupportTicket(member.member_id || member.username, { subject, category, message });
            alert("✓ Tiketi yako ya msaada imefunguliwa kikamilifu (Article 6.12). Admin atapitia.");
            ticketForm.reset();
            const modal = document.getElementById("modal-ticket");
            if (modal) modal.classList.add("hidden");
        };
    }
}

// Modal helper toggles
window.openModal = function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
};

window.closeModal = function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
};
