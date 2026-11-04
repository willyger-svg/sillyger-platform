/**
 * SILLYGER (SG) Student Dashboard Controller (v2.1)
 * Full Multi-Panel Student Dashboard Experience:
 * - Sidebar + Mobile Tab Switching (Overview, WhatsApp, Updates, Check-in & Leave, Possible Courses, Profile & Support)
 * - 4 Real-Time KPI Cards, Digital Student ID Smart-Card, Onboarding Checklist Progress Bar
 * - WhatsApp Community Access Gate + One-Click Group Intro Copy
 * - Live Cloud Sync & Cross-Tab BroadcastChannel Refresh
 */

const _esc = (v) => (typeof SGUtils !== "undefined" ? SGUtils.escapeHtml(v) : String(v || ""));
let currentStudentTab = "overview";

document.addEventListener("DOMContentLoaded", () => {
    SGStore.init();
    handleUrlAlertBanner();
    setupStudentTabs();
    setupPortalForms();
    initMemberPortal();

    window.addEventListener("sg:synced", () => {
        const s = SGStore.getCurrentSession();
        if (s) renderMemberDashboard(s);
    });
    window.addEventListener("storage", () => {
        const s = SGStore.getCurrentSession();
        if (s) renderMemberDashboard(s);
    });
    try {
        if (typeof BroadcastChannel !== "undefined") {
            const bc = new BroadcastChannel("sg_platform_sync");
            bc.onmessage = () => {
                const s = SGStore.getCurrentSession();
                if (s) renderMemberDashboard(s);
            };
        }
    } catch (e) {}

    // Auto-sync every 8s when logged in so PENDING -> ACTIVE unlocks WhatsApp live
    setInterval(() => {
        if (SGStore.getCurrentSession()) {
            SGStore.syncWithSupabase();
        }
    }, 8000);
});

function setupStudentTabs() {
    document.querySelectorAll(".student-nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const tab = btn.getAttribute("data-student-tab") || "overview";
            switchStudentTab(tab);
        });
    });
}

window.switchStudentTab = function (tabName) {
    currentStudentTab = tabName || "overview";

    document.querySelectorAll(".student-nav-btn").forEach(btn => {
        const btnTab = btn.getAttribute("data-student-tab");
        if (btnTab === currentStudentTab) {
            btn.classList.add("btn-sg-primary", "font-bold");
            btn.classList.remove("text-slate-300", "hover:bg-slate-800/70", "font-semibold");
        } else {
            btn.classList.remove("btn-sg-primary", "font-bold");
            btn.classList.add("text-slate-300", "hover:bg-slate-800/70", "font-semibold");
        }
    });

    document.querySelectorAll(".student-tab-pane").forEach(pane => {
        pane.classList.add("hidden");
    });

    const activePane = document.getElementById(`student-pane-${currentStudentTab}`);
    if (activePane) {
        activePane.classList.remove("hidden");
    }
};

function handleUrlAlertBanner() {
    const alertBox = document.getElementById("portal-url-alert");
    if (!alertBox) return;
    const params = new URLSearchParams(window.location.search);
    const alertType = params.get("alert");

    if (alertType === "login_required") {
        alertBox.innerHTML = `
            <span>🔒 Tafadhali ingia kwanza kwenye Dashboard yako ili kufikia ukurasa huo.</span>
            <button onclick="this.parentElement.classList.add('hidden')" class="text-amber-300 hover:text-white font-bold">✕</button>
        `;
        alertBox.classList.remove("hidden");
    } else if (alertType === "admin_required") {
        alertBox.innerHTML = `
            <span>⚠️ Ukurasa wa Admin unahitaji mamlaka ya Msimamizi (Administrator RBAC).</span>
            <button onclick="this.parentElement.classList.add('hidden')" class="text-amber-300 hover:text-white font-bold">✕</button>
        `;
        alertBox.classList.remove("hidden");
    }
}

function initMemberPortal() {
    const session = SGStore.getCurrentSession();
    const loginView = document.getElementById("login-view");
    const dashboardView = document.getElementById("dashboard-view");
    const logoutBtn = document.getElementById("btn-logout-header");
    const securityBtn = document.getElementById("btn-security-header");

    if (!session) {
        if (loginView) loginView.classList.remove("hidden");
        if (dashboardView) dashboardView.classList.add("hidden");
        if (logoutBtn) {
            logoutBtn.classList.add("hidden");
            logoutBtn.classList.remove("flex");
        }
        if (securityBtn) {
            securityBtn.classList.add("hidden");
            securityBtn.classList.remove("flex");
        }
        setupLoginForm();
    } else {
        if (loginView) loginView.classList.add("hidden");
        if (dashboardView) dashboardView.classList.remove("hidden");
        if (logoutBtn) {
            logoutBtn.classList.remove("hidden");
            logoutBtn.classList.add("flex");
        }
        if (securityBtn) {
            securityBtn.classList.remove("hidden");
            securityBtn.classList.add("flex");
        }

        const isAdmin = SGStore.isAdminUser(session);
        const adminSlot = document.getElementById("admin-link-slot");
        const adminSlotDash = document.getElementById("admin-link-slot-dash");
        const adminBtn = isAdmin ? `
            <a href="admin-portal.html" class="px-3.5 py-2 rounded-xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-300 hover:text-white text-xs font-bold font-mono-sg flex items-center justify-center gap-1.5 transition">
                <span>🛠️ Admin Command</span>
            </a>
        ` : "";
        if (adminSlot) adminSlot.innerHTML = adminBtn;
        if (adminSlotDash) adminSlotDash.innerHTML = adminBtn;

        switchStudentTab(currentStudentTab);
        renderMemberDashboard(session);
    }
}

window.showForgotPasswordNotice = function () {
    const box = document.getElementById("forgot-password-box");
    if (box) box.classList.toggle("hidden");
};

window.togglePortalPassword = function (fieldId, btn) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    if (input.type === "password") {
        input.type = "text";
        btn.innerHTML = `<svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>`;
    } else {
        input.type = "password";
        btn.innerHTML = `<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
    }
};

function setupLoginForm() {
    const form = document.getElementById("member-login-form");
    const errorAlert = document.getElementById("login-error");
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();
        errorAlert.classList.add("hidden");
        errorAlert.textContent = "";

        const credential = document.getElementById("login-credential").value.trim();
        const password = document.getElementById("login-password").value;
        const submitBtn = form.querySelector('button[type="submit"]');
        const origHtml = submitBtn ? submitBtn.innerHTML : "";
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span>Inafungua Dashboard...</span>`;
        }

        try {
            await SGStore.syncWithSupabase(true);
            const member = SGStore.authenticateMember(credential, password);

            SGStore.addAuditLog({
                action: "MEMBER_LOGIN",
                actor: member.username,
                target: member.member_id || "PENDING",
                details: `Login kwenye Student Dashboard. Status: ${member.status}.`
            });

            await SGStore.flushPendingWrites();
            SGStore.setCurrentSession(member);

            if (SGStore.isAdminUser(member)) {
                window.location.href = "admin-portal.html";
                return;
            }

            initMemberPortal();
        } catch (err) {
            errorAlert.textContent = err.message || "Hitilafu imetokea.";
            errorAlert.classList.remove("hidden");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = origHtml;
            }
        }
    };
}

window.handleMemberLogout = function () {
    SGStore.logout();
    window.location.href = "member-portal.html";
};

window.refreshMemberStatusNow = async function () {
    const syncBtn = document.getElementById("btn-sync-dashboard");
    const orig = syncBtn ? syncBtn.innerHTML : "";
    if (syncBtn) syncBtn.innerHTML = `<span>⏳ Inasawazisha...</span>`;
    await SGStore.syncWithSupabase(true);
    const s = SGStore.getCurrentSession();
    if (s) renderMemberDashboard(s);
    if (syncBtn) {
        syncBtn.innerHTML = `<span class="text-emerald-400">✓ Tayari</span>`;
        setTimeout(() => { syncBtn.innerHTML = orig; }, 1200);
    }
};

window.copyStudentId = function () {
    const s = SGStore.getCurrentSession();
    if (!s || !s.member_id) {
        alert("SG-ID yako bado inasubiri uthibitisho wa Admin.");
        return;
    }
    navigator.clipboard.writeText(s.member_id).then(() => {
        alert(`✓ SG-ID imenakiliwa: ${s.member_id}`);
    }).catch(() => {});
};

window.copyWhatsAppIntro = function () {
    const el = document.getElementById("wa-intro-template");
    if (!el) return;
    navigator.clipboard.writeText(el.textContent.trim()).then(() => {
        alert("✓ Ujumbe wa utambulisho umenakiliwa! Unaweza kuubandika (Paste) ndani ya WhatsApp Group.");
    }).catch(() => {});
};

window.quickOverviewCheckin = function () {
    const s = SGStore.getCurrentSession();
    if (!s || !s.member_id) return;
    const settings = SGStore.getPlatformSettings();
    const sessionTitle = settings.active_session_title || "Kipindi cha Pamoja cha Wanafunzi";
    try {
        SGStore.recordPlannedAttendance(s.member_id, sessionTitle);
        renderMemberDashboard(s);
        alert(`✓ Check-in yako kwenye "${sessionTitle}" imerekodiwa!`);
    } catch (err) {
        alert("Taarifa: " + err.message);
    }
};

// -----------------------------------------------------------------------
// MASTER DASHBOARD RENDERER
// -----------------------------------------------------------------------
function renderMemberDashboard(session) {
    const member = SGStore.findMemberById(session.id) || SGStore.findMemberByCredential(session.username) || session;

    renderGreetingAndIdentity(member);
    renderKpiCards(member);
    renderWhatsAppGate(member);
    renderOverviewSessionWidget(member);
    renderDigitalStudentIdCard(member);
    renderOnboardingProgress(member);
    renderAnnouncements();
    renderActiveWorkspace(member);
    renderPortalCourses();
    renderProfileAndTickets(member);
}

function renderGreetingAndIdentity(member) {
    const el = (id) => document.getElementById(id);
    const firstName = (member.full_name || "Mwanafunzi").split(" ")[0];

    const hour = new Date().getHours();
    let swGreeting = "Habari";
    if (hour >= 5 && hour < 12) swGreeting = "Habari za asubuhi";
    else if (hour >= 12 && hour < 17) swGreeting = "Habari za mchana";
    else if (hour >= 17 && hour < 22) swGreeting = "Habari za jioni";
    else swGreeting = "Habari za wakati huu";

    if (el("dash-greeting-title")) {
        el("dash-greeting-title").textContent = `${swGreeting}, ${firstName}! 👋`;
    }
    if (el("dash-today-date")) {
        try {
            el("dash-today-date").textContent = "STUDENT DASHBOARD · " + new Date().toLocaleDateString("sw-TZ", {
                weekday: "long",
                year: "numeric",
                month: "short",
                day: "numeric"
            });
        } catch (e) {}
    }

    const initials = (member.full_name || "SG")
        .split(" ")
        .filter(Boolean)
        .map(w => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    if (el("dash-avatar")) el("dash-avatar").textContent = initials || "SG";
    if (el("dash-full-name")) el("dash-full-name").textContent = member.full_name || "...";
    if (el("dash-username")) el("dash-username").textContent = "@" + (member.username || "...");

    if (el("dash-member-id")) {
        el("dash-member-id").classList.remove("text-blue-400", "text-amber-400");
        if (member.member_id) {
            el("dash-member-id").textContent = member.member_id;
            el("dash-member-id").classList.add("text-blue-400");
        } else {
            el("dash-member-id").textContent = "Pending SG-ID";
            el("dash-member-id").classList.add("text-amber-400");
        }
    }

    if (el("dash-status-badge")) {
        const s = member.status || "PENDING";
        const colors = {
            ACTIVE: "badge-active",
            PENDING: "badge-pending",
            SUSPENDED: "badge-suspended",
            ON_HOLD: "badge-hold",
            TERMINATED: "badge-suspended",
            INACTIVE: "badge-suspended"
        };
        el("dash-status-badge").innerHTML = `
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono-sg font-bold uppercase ${colors[s] || "badge-pending"}">
                ${_esc(s)}
            </span>
        `;
    }
}

function renderKpiCards(member) {
    const el = (id) => document.getElementById(id);
    const isActive = member.status === "ACTIVE" && !!member.member_id;
    const attRecords = member.member_id ? SGStore.getAttendanceRecords(member.member_id) : [];
    const verifiedAtt = attRecords.filter(a => a.is_verified).length;
    const announcements = SGStore.getAnnouncements();

    if (el("kpi-member-id")) {
        el("kpi-member-id").textContent = member.member_id || "Inasubiri";
        el("kpi-member-id").className = `text-base sm:text-lg font-extrabold font-mono-sg truncate ${member.member_id ? "text-white" : "text-amber-400"}`;
    }
    if (el("kpi-member-role")) {
        el("kpi-member-role").textContent = member.role === "Applicant" ? "Mwanafunzi Mwombaji" : (member.role || "Student Member");
    }

    if (el("kpi-wa-status")) {
        el("kpi-wa-status").textContent = isActive ? "Funguliwa ✓" : "Imefungwa";
        el("kpi-wa-status").className = `text-base sm:text-lg font-extrabold ${isActive ? "text-emerald-400" : "text-amber-400"}`;
    }
    if (el("kpi-wa-sub")) {
        el("kpi-wa-sub").textContent = isActive ? "Jiunge kwenye kundi &rarr;" : "Inasubiri idhini ya Admin";
    }
    if (el("nav-wa-indicator")) {
        el("nav-wa-indicator").className = `w-2 h-2 rounded-full ${isActive ? "bg-emerald-400" : "bg-amber-400"}`;
    }

    if (el("kpi-att-count")) el("kpi-att-count").textContent = `${attRecords.length} Vipindi`;
    if (el("kpi-att-sub")) el("kpi-att-sub").textContent = `${verifiedAtt} Imethibitishwa`;

    if (el("kpi-updates-count")) el("kpi-updates-count").textContent = announcements.length;
    if (el("nav-updates-count")) el("nav-updates-count").textContent = announcements.length;
}

// -----------------------------------------------------------------------
// WHATSAPP ACCESS GATE (OVERVIEW + WHATSAPP TAB)
// -----------------------------------------------------------------------
function renderWhatsAppGate(member) {
    const overviewCard = document.getElementById("whatsapp-gate-card");
    const tabCard = document.getElementById("whatsapp-tab-card");
    const introBox = document.getElementById("wa-intro-template");

    const status = member.status;
    const safeName = _esc(member.full_name || "Mwanafunzi");
    const safeFirst = _esc((member.full_name || "Mwanafunzi").split(" ")[0]);
    const safeMemberId = _esc(member.member_id || "SG-PENDING");

    if (introBox) {
        const interest = member.learning_interest || member.motivation || "kujifunza teknolojia na wenzangu";
        introBox.textContent = `Habari wanafunzi wenzangu! Mimi ni ${member.full_name || ""} (${member.member_id || "Mwanafunzi Mpya"}), nimefurahi kujiunga na SILLYGER Student Community. Napenda ${interest}. Tujifunze pamoja!`;
    }

    let cardHtml = "";

    if (status === "ACTIVE") {
        const waLink = _esc(SG_CONFIG.privateWhatsAppInvite);
        cardHtml = `
            <div class="sg-glass p-6 sm:p-7 rounded-3xl border border-emerald-500/45 bg-gradient-to-br from-emerald-950/35 via-slate-900/90 to-slate-950 shadow-xl space-y-5">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                        <svg class="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                    </div>
                    <div>
                        <span class="inline-block px-2.5 py-0.5 rounded-full badge-active text-[10px] font-mono-sg font-bold uppercase mb-1.5">
                            ✓ WHATSAPP GATEWAY UNLOCKED
                        </span>
                        <h3 class="text-lg sm:text-xl font-extrabold text-white">Kundi Rasmi la Wanafunzi wa SILLYGER</h3>
                        <p class="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                            Hongera ${safeName} (<strong class="text-emerald-400 font-mono-sg">${safeMemberId}</strong>)! Kiungo rasmi cha kujiunga na WhatsApp Group letu la wanafunzi kiko wazi sasa.
                        </p>
                    </div>
                </div>
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-emerald-900/40">
                    <span class="text-[11px] font-mono-sg text-emerald-300/80">Official Student Learning Group</span>
                    <a href="${waLink}" target="_blank" rel="noopener noreferrer"
                        class="px-6 py-3 rounded-2xl btn-sg-emerald text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap">
                        <span>Jiunge na WhatsApp Group Sasa</span>
                        <span>&rarr;</span>
                    </a>
                </div>
            </div>
        `;
    } else if (status === "PENDING") {
        cardHtml = `
            <div class="sg-glass p-6 sm:p-7 rounded-3xl border border-amber-500/35 bg-gradient-to-br from-amber-950/15 via-slate-900/90 to-slate-950 space-y-4">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 text-lg">
                        🔒
                    </div>
                    <div>
                        <span class="inline-block px-2.5 py-0.5 rounded-full badge-pending text-[10px] font-mono-sg font-bold uppercase mb-1.5">
                            ⏳ INASUBIRI UTHIBITISHO WA ADMIN
                        </span>
                        <h3 class="text-lg font-extrabold text-white">WhatsApp Group Itafunguka Hapa Hivi Karibuni, ${safeFirst}!</h3>
                        <p class="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                            Maombi yako yako kwenye foleni ya Admin. Mara tu ukishaidhinishwa, namba yako ya <strong>SG-ID</strong> na kitufe cha kuingia WhatsApp Group vitatokea hapa kiotomatiki.
                        </p>
                    </div>
                </div>
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                    <span class="text-[11px] font-mono-sg text-slate-400">Inajisasisha kila sekunde 8</span>
                    <button onclick="refreshMemberStatusNow()" class="px-5 py-2.5 rounded-xl border border-blue-500/40 bg-blue-950/30 hover:bg-blue-900/50 text-xs text-blue-300 hover:text-white font-semibold transition">
                        🔄 Angalia Hali Mpya Sasa
                    </button>
                </div>
            </div>
        `;
    } else {
        cardHtml = `
            <div class="sg-glass p-6 rounded-3xl border border-red-500/40 bg-red-950/20 text-xs sm:text-sm text-slate-200">
                ⚠️ Akaunti yako iko kwenye hali ya <strong>${_esc(status)}</strong>. Tafadhali tuma ujumbe kwenye kichupo cha <strong>Wasifu & Msaada</strong> ili kuwasiliana na Admin.
            </div>
        `;
    }

    if (overviewCard) overviewCard.innerHTML = cardHtml;
    if (tabCard) tabCard.innerHTML = cardHtml;
}

// -----------------------------------------------------------------------
// OVERVIEW: CURRENT SESSION WIDGET, DIGITAL ID CARD & CHECKLIST
// -----------------------------------------------------------------------
function renderOverviewSessionWidget(member) {
    const box = document.getElementById("overview-session-widget");
    if (!box) return;

    const settings = SGStore.getPlatformSettings();
    const activeTitle = settings.active_session_title || "Misingi ya Teknolojia & Mafunzo ya Pamoja";
    const isActive = member.status === "ACTIVE" && !!member.member_id;

    const today = new Date().toISOString().split("T")[0];
    const alreadyCheckedIn = isActive && SGStore.getAttendanceRecords(member.member_id).some(
        a => (a.date === today || a.session_date === today)
    );

    box.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="space-y-1">
                <span class="text-[10px] font-mono-sg text-emerald-400 font-bold uppercase block">MADA / KIPINDI CHA SASA</span>
                <h3 class="text-sm sm:text-base font-bold text-white">${_esc(activeTitle)}</h3>
                <p class="text-xs text-slate-400">
                    ${isActive
                        ? (alreadyCheckedIn ? "✓ Umeshafanya check-in ya leo!" : "Bofya hapa kurekodi ushiriki wako wa leo.")
                        : "Check-in itafunguka ukishapata idhini ya SG-ID."}
                </p>
            </div>
            ${isActive ? (
                alreadyCheckedIn
                    ? `<span class="px-4 py-2 rounded-xl badge-active text-xs font-mono-sg font-bold shrink-0">✓ Checked-in Leo</span>`
                    : `<button type="button" onclick="quickOverviewCheckin()" class="px-5 py-2.5 rounded-xl btn-sg-primary text-xs shrink-0">✓ Check-in Leo</button>`
            ) : `<span class="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono-sg text-slate-500 shrink-0">Locked</span>`}
        </div>
    `;
}

function renderDigitalStudentIdCard(member) {
    const slot = document.getElementById("digital-student-id-card");
    if (!slot) return;

    const isActive = member.status === "ACTIVE" && !!member.member_id;
    const joinedDate = SGUtils.formatDateSw(member.created_at);

    slot.innerHTML = `
        <div class="p-6 rounded-3xl border ${isActive ? "border-blue-500/45 bg-gradient-to-br from-blue-950/60 via-slate-900 to-indigo-950/50" : "border-slate-700/80 bg-gradient-to-br from-slate-900 to-slate-950"} shadow-2xl relative overflow-hidden space-y-5">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-mono-sg font-black text-white text-xs">
                        SG
                    </div>
                    <div>
                        <span class="text-xs font-extrabold text-white tracking-wider block leading-none">SILLYGER</span>
                        <span class="text-[9px] font-mono-sg text-blue-300 uppercase tracking-widest">Digital Student ID</span>
                    </div>
                </div>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono-sg font-bold ${isActive ? "badge-active" : "badge-pending"}">
                    ${isActive ? "VERIFIED STUDENT" : "PENDING ID"}
                </span>
            </div>

            <div class="space-y-1 pt-1">
                <span class="text-[10px] font-mono-sg text-slate-400 uppercase block">Jina la Mwanafunzi</span>
                <p class="text-base sm:text-lg font-extrabold text-white tracking-tight truncate">${_esc(member.full_name)}</p>
                <p class="text-xs font-mono-sg text-blue-400">@${_esc(member.username)}</p>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs font-mono-sg">
                <div>
                    <span class="text-[10px] text-slate-400 block">SG-ID Number</span>
                    <span class="font-bold ${isActive ? "text-emerald-400" : "text-amber-400"}">${_esc(member.member_id || "SG-PENDING")}</span>
                </div>
                <div>
                    <span class="text-[10px] text-slate-400 block">Tarehe ya Kujiunga</span>
                    <span class="text-slate-200">${_esc(joinedDate)}</span>
                </div>
            </div>
        </div>
    `;
}

function renderOnboardingProgress(member) {
    const slot = document.getElementById("onboarding-progress-card");
    if (!slot) return;

    const isActive = member.status === "ACTIVE" && !!member.member_id;
    const hasCheckin = isActive && SGStore.getAttendanceRecords(member.member_id).length > 0;

    const steps = [
        { label: "Kufungua Akaunti ya Mwanafunzi", done: true },
        { label: "Kukubali Kanuni & PDPA 2022", done: true },
        { label: "Kuidhinishwa & Kupewa SG-ID", done: isActive },
        { label: "Kuingia WhatsApp & Check-in ya Kwanza", done: hasCheckin }
    ];
    const doneCount = steps.filter(s => s.done).length;
    const pct = Math.round((doneCount / steps.length) * 100);

    slot.innerHTML = `
        <div class="flex items-center justify-between">
            <div>
                <span class="text-[10px] font-mono-sg text-blue-400 font-bold uppercase block">HATUA ZAKO</span>
                <h3 class="text-sm font-bold text-white">Maendeleo ya Kujiunga</h3>
            </div>
            <span class="text-xs font-mono-sg font-extrabold text-emerald-400">${pct}%</span>
        </div>

        <div class="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
            <div class="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500" style="width: ${pct}%"></div>
        </div>

        <div class="space-y-2.5 pt-1 text-xs">
            ${steps.map(st => `
                <div class="flex items-center gap-2.5 ${st.done ? "text-slate-200" : "text-slate-500"}">
                    <span class="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold ${st.done ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-slate-900 text-slate-600 border border-slate-800"}">
                        ${st.done ? "✓" : "•"}
                    </span>
                    <span>${_esc(st.label)}</span>
                </div>
            `).join("")}
        </div>
    `;
}

// -----------------------------------------------------------------------
// ANNOUNCEMENTS & UPDATES FEED (OVERVIEW PREVIEW + FULL TAB)
// -----------------------------------------------------------------------
function renderAnnouncements() {
    const fullSlot = document.getElementById("member-announcements-slot");
    const previewSlot = document.getElementById("overview-updates-preview");

    const list = SGStore.getAnnouncements();

    const emptyHtml = `
        <div class="p-5 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-center text-xs text-slate-400 font-mono-sg">
            Hakuna tangazo jipya lililowekwa kwa sasa. Updates mpya zitaonekana hapa na kwenye WhatsApp Group.
        </div>
    `;

    if (!list || list.length === 0) {
        if (fullSlot) fullSlot.innerHTML = emptyHtml;
        if (previewSlot) previewSlot.innerHTML = emptyHtml;
        return;
    }

    const renderItem = (a) => {
        const isHigh = a.priority === "HIGH";
        return `
            <div class="p-4 rounded-2xl border ${isHigh ? "border-blue-500/40 bg-blue-950/20" : "border-slate-800/90 bg-slate-950/50"} flex items-start gap-3.5">
                <div class="w-8 h-8 rounded-xl ${isHigh ? "bg-blue-600/20 text-blue-300 border border-blue-500/35" : "bg-slate-800/80 text-slate-300"} flex items-center justify-center shrink-0 text-sm">
                    ${isHigh ? "📢" : "📌"}
                </div>
                <div class="min-w-0 flex-grow">
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <span class="text-[10px] font-mono-sg font-bold uppercase ${isHigh ? "text-blue-300" : "text-emerald-400"}">
                            ${isHigh ? "Update Muhimu" : "Taarifa"} · ${_esc(SGUtils.formatDateSw(a.created_at))}
                        </span>
                        <span class="text-[10px] font-mono-sg text-slate-500">${_esc(a.author || "SG Admin")}</span>
                    </div>
                    <p class="text-sm font-bold text-white">${_esc(a.title)}</p>
                    <p class="text-xs text-slate-300 mt-1 leading-relaxed whitespace-pre-line">${_esc(a.content)}</p>
                </div>
            </div>
        `;
    };

    if (fullSlot) fullSlot.innerHTML = list.map(renderItem).join("");
    if (previewSlot) previewSlot.innerHTML = list.slice(0, 2).map(renderItem).join("");
}

// -----------------------------------------------------------------------
// CHECK-IN & LEAVE REQUESTS TAB
// -----------------------------------------------------------------------
function renderActiveWorkspace(member) {
    const workspace = document.getElementById("active-member-workspace");
    const lockedNotice = document.getElementById("attendance-locked-notice");
    if (!workspace) return;

    const isActive = member.status === "ACTIVE" && !!member.member_id;

    if (!isActive) {
        workspace.classList.add("opacity-50", "pointer-events-none");
        if (lockedNotice) lockedNotice.classList.remove("hidden");
    } else {
        workspace.classList.remove("opacity-50", "pointer-events-none");
        if (lockedNotice) lockedNotice.classList.add("hidden");
    }

    const sessionInput = document.getElementById("checkin-session-input");
    const settings = SGStore.getPlatformSettings();
    if (sessionInput && !sessionInput.value && settings.active_session_title) {
        sessionInput.value = settings.active_session_title;
    }

    const attRecords = member.member_id ? SGStore.getAttendanceRecords(member.member_id) : [];
    const verifiedCount = attRecords.filter(a => a.is_verified).length;
    const summaryEl = document.getElementById("member-att-summary");
    if (summaryEl) {
        summaryEl.textContent = `${verifiedCount}/${attRecords.length} Verified`;
    }

    const attListEl = document.getElementById("member-attendance-list");
    if (attListEl) {
        if (attRecords.length === 0) {
            attListEl.innerHTML = `<div class="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center text-xs text-slate-500 font-mono-sg">Bado hujarekodi check-in ya kipindi chochote.</div>`;
        } else {
            attListEl.innerHTML = attRecords.slice(0, 10).map(a => `
                <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                    <div class="min-w-0">
                        <span class="font-semibold text-white block truncate">${_esc(a.session_title)}</span>
                        <span class="text-[11px] font-mono-sg text-slate-500">${_esc(a.date || a.session_date)}</span>
                    </div>
                    ${a.is_verified
                        ? `<span class="px-2 py-0.5 rounded badge-active font-mono-sg text-[10px] font-bold shrink-0">✓ VERIFIED</span>`
                        : `<span class="px-2 py-0.5 rounded badge-pending font-mono-sg text-[10px] font-bold shrink-0">PLANNED</span>`
                    }
                </div>
            `).join("");
        }
    }

    const leaves = member.member_id ? SGStore.getLeaveRequests(member.member_id) : [];
    const leavesListEl = document.getElementById("member-leaves-list");
    if (leavesListEl) {
        if (leaves.length === 0) {
            leavesListEl.innerHTML = `<div class="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center text-xs text-slate-500 font-mono-sg">Hakuna ombi la ruhusa ulilotuma.</div>`;
        } else {
            leavesListEl.innerHTML = leaves.slice(0, 8).map(l => {
                const badge = l.status === "APPROVED"
                    ? "badge-active"
                    : (l.status === "REJECTED" ? "badge-suspended" : "badge-pending");
                return `
                    <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1 text-xs">
                        <div class="flex items-center justify-between gap-2">
                            <span class="font-bold text-white">${_esc(l.category)} · <span class="text-blue-400 font-mono-sg text-[11px]">${_esc(l.duration)}</span></span>
                            <span class="px-2 py-0.5 rounded font-mono-sg text-[10px] font-bold ${badge}">${_esc(l.status)}</span>
                        </div>
                        <p class="text-slate-400 text-[11px] leading-snug">${_esc(l.reason)}</p>
                    </div>
                `;
            }).join("");
        }
    }
}

// -----------------------------------------------------------------------
// IN-DASHBOARD POSSIBLE COURSES EXPLORER
// -----------------------------------------------------------------------
function renderPortalCourses() {
    const grid = document.getElementById("portal-courses-grid");
    if (!grid || typeof SG_CONFIG === "undefined") return;

    grid.innerHTML = SG_CONFIG.CURRICULUM.map(c => {
        const num = String(c.level).padStart(2, "0");
        return `
            <div class="sg-glass p-5 rounded-2xl space-y-2.5">
                <div class="flex items-center justify-between gap-2">
                    <span class="px-2.5 py-0.5 rounded-md badge-future font-mono-sg text-[11px] font-bold">TOPIC ${_esc(num)}</span>
                    <span class="text-[10px] font-mono-sg uppercase text-slate-400">${_esc(c.category || "Core")}</span>
                </div>
                <h3 class="text-sm sm:text-base font-bold text-white">${_esc(c.title)}</h3>
                <p class="text-xs text-slate-400 leading-relaxed">${_esc(c.desc)}</p>
            </div>
        `;
    }).join("");
}

// -----------------------------------------------------------------------
// PROFILE DETAILS & SUPPORT TICKETS TAB
// -----------------------------------------------------------------------
function renderProfileAndTickets(member) {
    const profileGrid = document.getElementById("profile-details-grid");
    if (profileGrid) {
        const note = member.learning_interest || member.motivation || "Hakuna maelezo ya ziada";
        profileGrid.innerHTML = `
            <div class="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <span class="text-slate-500 block mb-0.5">Jina Kamili</span>
                <span class="font-bold text-white text-sm">${_esc(member.full_name)}</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <span class="text-slate-500 block mb-0.5">Username & SG-ID</span>
                <span class="font-mono-sg font-bold text-blue-400">@${_esc(member.username)} · ${_esc(member.member_id || "PENDING")}</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <span class="text-slate-500 block mb-0.5">Barua Pepe (Email)</span>
                <span class="text-slate-200 font-mono-sg">${_esc(member.email)}</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <span class="text-slate-500 block mb-0.5">Namba ya WhatsApp</span>
                <span class="text-emerald-400 font-mono-sg font-bold">${_esc(member.phone)}</span>
            </div>
            <div class="sm:col-span-2 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <span class="text-slate-500 block mb-0.5">Mada Unayopenda / Ujumbe Wako</span>
                <span class="text-slate-300">${_esc(note)}</span>
            </div>
        `;
    }

    const listEl = document.getElementById("member-tickets-list");
    if (!listEl) return;

    const identifier = member.member_id || member.username;
    const tickets = SGStore.getSupportTickets().filter(
        t => t.member_id === member.member_id || t.member_id === member.username || t.member_id === identifier
    );

    if (tickets.length === 0) {
        listEl.innerHTML = `
            <div class="p-5 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-center text-xs text-slate-500 font-mono-sg">
                Hujatuma swali au tiketi yoyote bado. Bofya "+ Tuma Swali / Ombi" ukiwa na uhitaji.
            </div>
        `;
        return;
    }

    listEl.innerHTML = tickets.map(t => `
        <div class="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs">
            <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-white">${_esc(t.subject)} <span class="text-slate-500 font-mono-sg text-[10px]">(${_esc(t.category)})</span></span>
                <span class="px-2 py-0.5 rounded font-mono-sg text-[10px] font-bold ${t.status === "RESOLVED" ? "badge-active" : "badge-pending"}">${_esc(t.status)}</span>
            </div>
            <p class="text-slate-300 text-[11px]">${_esc(t.message)}</p>
            ${t.response ? `
                <div class="mt-2 pt-2 border-t border-slate-800 text-[11px] text-emerald-300">
                    <strong>Jibu la Admin (${_esc(t.responded_by || "Admin")}):</strong> ${_esc(t.response)}
                </div>
            ` : ""}
        </div>
    `).join("");
}

// -----------------------------------------------------------------------
// INTERACTIVE FORMS
// -----------------------------------------------------------------------
function setupPortalForms() {
    const checkinForm = document.getElementById("form-member-checkin");
    if (checkinForm) {
        checkinForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const session = SGStore.getCurrentSession();
            if (!session || !session.member_id) return;
            const titleInput = document.getElementById("checkin-session-input");
            try {
                SGStore.recordPlannedAttendance(session.member_id, titleInput.value);
                titleInput.value = "";
                renderMemberDashboard(session);
                alert("✓ Check-in yako imerekodiwa! Admin ataithibitisha.");
            } catch (err) {
                alert("Taarifa: " + err.message);
            }
        });
    }

    const leaveForm = document.getElementById("form-leave-request");
    if (leaveForm) {
        leaveForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const session = SGStore.getCurrentSession();
            if (!session || !session.member_id) return;
            try {
                SGStore.submitLeaveRequest(session.member_id, {
                    category: document.getElementById("leave-category").value,
                    duration: document.getElementById("leave-duration").value,
                    reason: document.getElementById("leave-reason").value
                });
                leaveForm.reset();
                closeModal("modal-leave-request");
                renderMemberDashboard(session);
                alert("✓ Ombi lako la ruhusa limewasilishwa.");
            } catch (err) {
                alert("Hitilafu: " + err.message);
            }
        });
    }

    const ticketForm = document.getElementById("form-support-ticket");
    if (ticketForm) {
        ticketForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const session = SGStore.getCurrentSession();
            if (!session) return;
            const actorId = session.member_id || session.username;
            try {
                SGStore.submitSupportTicket(actorId, {
                    category: document.getElementById("ticket-category").value,
                    subject: document.getElementById("ticket-subject").value,
                    message: document.getElementById("ticket-message").value
                });
                ticketForm.reset();
                closeModal("modal-support-ticket");
                switchStudentTab("profile");
                renderMemberDashboard(session);
                alert("✓ Ujumbe wako umetumwa! Utapata jibu hapa kwenye Dashboard.");
            } catch (err) {
                alert("Hitilafu: " + err.message);
            }
        });
    }

    const cpForm = document.getElementById("form-change-password");
    if (cpForm) {
        cpForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const session = SGStore.getCurrentSession();
            if (!session) return;
            const cur = document.getElementById("cp-current").value;
            const next = document.getElementById("cp-new").value;
            const confirmNext = document.getElementById("cp-confirm").value;

            if (next !== confirmNext) {
                alert("Nenosiri jipya na uthibitisho wake havifanani.");
                return;
            }
            try {
                SGStore.changePassword(session.id, cur, next);
                cpForm.reset();
                closeModal("modal-change-password");
                alert("✓ Nenosiri lako limebadilishwa kikamilifu!");
            } catch (err) {
                alert("Hitilafu: " + err.message);
            }
        });
    }
}

window.openModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
};
window.closeModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
};
