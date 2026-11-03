/**
 * SILLYGER (SG) Member Portal Controller (v1.4)
 * Features:
 * - Secure SHA-256 Authenticated Login & Smart Admin Routing
 * - WhatsApp Community Access Gate (Locked for PENDING, Unlocked for ACTIVE)
 * - Active Sillygerian Workspace: Attendance Check-in (Art. 9), Leave Requests (Art. 10), Support Tickets (Art. 6.12)
 * - Password Management (Art. 6.13) & Live Cloud Sync
 */

const _esc = (v) => (typeof SGUtils !== "undefined" ? SGUtils.escapeHtml(v) : String(v || ""));

document.addEventListener("DOMContentLoaded", () => {
    SGStore.init();
    handleUrlAlertBanner();
    setupPortalForms();
    initMemberPortal();

    // Live updates from Supabase sync or cross-tab Admin actions
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
});

function handleUrlAlertBanner() {
    const alertBox = document.getElementById("portal-url-alert");
    if (!alertBox) return;
    const params = new URLSearchParams(window.location.search);
    const alertType = params.get("alert");

    if (alertType === "login_required") {
        alertBox.innerHTML = `
            <span>🔒 Tafadhali ingia kwanza kwenye akaunti yako ili kufikia ukurasa huo.</span>
            <button onclick="this.parentElement.classList.add('hidden')" class="text-amber-300 hover:text-white font-bold">✕</button>
        `;
        alertBox.classList.remove("hidden");
    } else if (alertType === "admin_required") {
        alertBox.innerHTML = `
            <span>⚠️ Ukurasa wa Executive Command Center unahitaji ruhusa ya Msimamizi (Administrator RBAC — Katiba Art. 7).</span>
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

        const isAdmin = isAdminUser(session);
        const adminSlot = document.getElementById("admin-link-slot");
        const adminSlotDash = document.getElementById("admin-link-slot-dash");
        const adminBtn = isAdmin ? `
            <a href="admin-portal.html" class="px-3 py-1.5 rounded-lg bg-purple-950/70 border border-purple-500/50 text-purple-300 hover:text-white text-xs font-bold font-mono-sg flex items-center gap-1.5 transition">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                <span>Admin Command</span>
            </a>
        ` : "";
        if (adminSlot) adminSlot.innerHTML = adminBtn;
        if (adminSlotDash) adminSlotDash.innerHTML = adminBtn;

        renderMemberDashboard(session);
    }
}

function isAdminUser(u) {
    return !!(u && (
        u.role === "Super Administrator" ||
        u.role === "Administrator" ||
        u.role === "Membership Administrator" ||
        u.username === "willyger" ||
        u.email === "wshavu@gmail.com"
    ));
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
        btn.innerHTML = `<svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>`;
    } else {
        input.type = "password";
        btn.innerHTML = `<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
    }
};

// -----------------------------------------------------------------------
// LOGIN FORM
// -----------------------------------------------------------------------
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

        try {
            await SGStore.syncWithSupabase(true);
            const member = SGStore.authenticateMember(credential, password);

            SGStore.addAuditLog({
                action: "MEMBER_LOGIN",
                actor: member.username,
                target: member.member_id || "PENDING",
                details: `Login kwenye Member Portal. Status: ${member.status}.`
            });

            SGStore.setCurrentSession(member);

            if (isAdminUser(member)) {
                window.location.href = "admin-portal.html";
                return;
            }

            initMemberPortal();
        } catch (err) {
            errorAlert.textContent = err.message || "Hitilafu imetokea.";
            errorAlert.classList.remove("hidden");
        }
    };
}

window.handleMemberLogout = function () {
    SGStore.logout();
    window.location.href = "member-portal.html";
};

window.refreshMemberStatusNow = async function () {
    await SGStore.syncWithSupabase(true);
    const s = SGStore.getCurrentSession();
    if (s) renderMemberDashboard(s);
};

// -----------------------------------------------------------------------
// DASHBOARD RENDERING
// -----------------------------------------------------------------------
function renderMemberDashboard(session) {
    const member = SGStore.findMemberById(session.id) || SGStore.findMemberByCredential(session.username) || session;

    renderMemberIdentity(member);
    renderAnnouncements();
    renderWhatsAppGate(member);
    renderActiveWorkspace(member);
    renderMemberTickets(member);
    renderDivisionsAndCourses();
}

function renderMemberIdentity(member) {
    const el = (id) => document.getElementById(id);

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
    if (el("dash-track")) el("dash-track").textContent = member.track || "Haijachaguliwa";

    if (el("dash-member-id")) {
        el("dash-member-id").classList.remove("text-cyan-400", "text-amber-400");
        if (member.member_id) {
            el("dash-member-id").textContent = member.member_id;
            el("dash-member-id").classList.add("text-cyan-400");
        } else {
            el("dash-member-id").textContent = "SG-xxxxxx (Inasubiri)";
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

// -----------------------------------------------------------------------
// WHATSAPP ACCESS GATE
// -----------------------------------------------------------------------
function renderWhatsAppGate(member) {
    const container = document.getElementById("whatsapp-gate-card");
    if (!container) return;

    const status = member.status;
    const safeName = _esc(member.full_name || "");
    const safeFirst = _esc((member.full_name || "Mwanachama").split(" ")[0]);
    const safeMemberId = _esc(member.member_id || "SG-xxxxxx");

    if (status === "ACTIVE") {
        const waLink = _esc(SG_CONFIG.privateWhatsAppInvite);
        container.innerHTML = `
            <div class="sg-glass p-7 md:p-9 rounded-3xl border border-emerald-500/50 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 shadow-2xl">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div class="flex items-start gap-5">
                        <div class="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-inner">
                            <svg class="w-7 h-7 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                        </div>
                        <div>
                            <div class="inline-block px-2.5 py-0.5 rounded-full badge-active text-[10px] font-mono-sg font-bold uppercase mb-2">
                                ✓ UMEIDHINISHWA — MWANACHAMA KAMILI
                            </div>
                            <h2 class="text-xl md:text-2xl font-extrabold text-white mb-2">Karibu kwenye SILLYGER Community!</h2>
                            <p class="text-sm text-slate-300">
                                Hongera ${safeName}! Uanachama wako <strong class="text-emerald-400">(${safeMemberId})</strong> umeidhinishwa. Kiungo rasmi cha WhatsApp Group la jumuiya kimefunguliwa kwako.
                            </p>
                        </div>
                    </div>
                    <div class="flex flex-col items-center md:items-end gap-3 shrink-0">
                        <a href="${waLink}" target="_blank" rel="noopener noreferrer"
                            class="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-extrabold text-sm transition shadow-2xl shadow-emerald-500/30 flex items-center gap-3 whitespace-nowrap">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            <span>Jiunge na WhatsApp Group</span>
                        </a>
                        <span class="text-[10px] text-emerald-400/70 font-mono-sg">Kiungo rasmi cha SILLYGER Community</span>
                    </div>
                </div>
            </div>
        `;
    } else if (status === "PENDING") {
        container.innerHTML = `
            <div class="sg-glass p-7 md:p-9 rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950 shadow-xl">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div class="flex items-start gap-5">
                        <div class="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                            <svg class="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </div>
                        <div>
                            <div class="inline-block px-2.5 py-0.5 rounded-full badge-pending text-[10px] font-mono-sg font-bold uppercase mb-2">
                                ⏳ MAOMBI YANAKAGULIWA — PENDING REVIEW
                            </div>
                            <h2 class="text-xl md:text-2xl font-extrabold text-white mb-2">
                                Maombi yako yamepokelewa, ${safeFirst}!
                            </h2>
                            <p class="text-sm text-slate-300 max-w-lg leading-relaxed">
                                Uongozi wa uanachama utakagua maombi yako na kukuidhinisha. Baada ya idhini, kiungo cha WhatsApp Group na huduma za mwanachama vitafunguliwa <strong class="text-amber-300">moja kwa moja hapa</strong>.
                            </p>
                            <div class="mt-4 flex flex-wrap gap-3 text-xs font-mono-sg">
                                <div class="flex items-center gap-1.5 text-emerald-400">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                    <span>Fomu imejazwa</span>
                                </div>
                                <div class="flex items-center gap-1.5 text-emerald-400">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                    <span>Masharti yamekubaliwa</span>
                                </div>
                                <div class="flex items-center gap-1.5 text-amber-400">
                                    <svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                    <span>Inasubiri idhini ya Admin</span>
                                </div>
                                <div class="flex items-center gap-1.5 text-slate-500">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                    <span>WhatsApp Group (Imefungwa)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="shrink-0">
                        <button disabled
                            class="px-7 py-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-500 font-extrabold text-sm cursor-not-allowed flex items-center gap-3 opacity-70">
                            <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            <span>WhatsApp Group (Locked)</span>
                        </button>
                        <p class="text-[10px] text-slate-500 font-mono-sg mt-2 text-center">Itafunguliwa baada ya idhini</p>
                        <button onclick="refreshMemberStatusNow()" class="mt-3 w-full px-4 py-2 rounded-xl border border-slate-700 hover:border-cyan-500/40 text-[11px] text-slate-400 hover:text-cyan-400 transition font-mono-sg">
                            🔄 Angalia hali mpya sasa
                        </button>
                    </div>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="sg-glass p-7 rounded-3xl border border-red-500/40 bg-red-950/20">
                <div class="flex items-start gap-4 text-red-400">
                    <svg class="w-8 h-8 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <div>
                        <p class="font-bold text-white text-base mb-1">Akaunti Iko Kwenye Mapitio (${_esc(status)})</p>
                        <p class="text-sm text-slate-300">Akaunti yako iko kwenye hali ya <strong>${_esc(status)}</strong>. Wasiliana na utawala kupitia kitufe cha <strong>Msaada / Tiketi</strong> kwa maelezo zaidi.</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// -----------------------------------------------------------------------
// ACTIVE SILLYGERIAN WORKSPACE (ATTENDANCE CHECK-IN & LEAVE REQUESTS)
// -----------------------------------------------------------------------
function renderActiveWorkspace(member) {
    const workspace = document.getElementById("active-member-workspace");
    if (!workspace) return;

    if (member.status !== "ACTIVE" || !member.member_id) {
        workspace.classList.add("hidden");
        return;
    }

    workspace.classList.remove("hidden");

    // Pre-fill active session title from platform settings if Admin configured one
    const sessionInput = document.getElementById("checkin-session-input");
    const settings = SGStore.getPlatformSettings();
    if (sessionInput && !sessionInput.value && settings.active_session_title) {
        sessionInput.value = settings.active_session_title;
    }

    // 1. Attendance list
    const attRecords = SGStore.getAttendanceRecords(member.member_id);
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
            attListEl.innerHTML = attRecords.slice(0, 8).map(a => `
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

    // 2. Leave requests list
    const leaves = SGStore.getLeaveRequests(member.member_id);
    const leavesListEl = document.getElementById("member-leaves-list");
    if (leavesListEl) {
        if (leaves.length === 0) {
            leavesListEl.innerHTML = `<div class="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center text-xs text-slate-500 font-mono-sg">Hakuna ombi la ruhusa ulilotuma.</div>`;
        } else {
            leavesListEl.innerHTML = leaves.slice(0, 6).map(l => {
                const badge = l.status === "APPROVED"
                    ? "badge-active"
                    : (l.status === "REJECTED" ? "badge-suspended" : "badge-pending");
                return `
                    <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1 text-xs">
                        <div class="flex items-center justify-between gap-2">
                            <span class="font-bold text-white">${_esc(l.category)} · <span class="text-cyan-400 font-mono-sg text-[11px]">${_esc(l.duration)}</span></span>
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
// SUPPORT TICKETS SECTION
// -----------------------------------------------------------------------
function renderMemberTickets(member) {
    const section = document.getElementById("member-tickets-section");
    const listEl = document.getElementById("member-tickets-list");
    if (!section || !listEl) return;

    const identifier = member.member_id || member.username;
    const tickets = SGStore.getSupportTickets().filter(
        t => t.member_id === member.member_id || t.member_id === member.username || t.member_id === identifier
    );

    if (tickets.length === 0) {
        section.classList.add("hidden");
        return;
    }

    section.classList.remove("hidden");
    listEl.innerHTML = tickets.map(t => `
        <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs">
            <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-white">${_esc(t.subject)} <span class="text-slate-500 font-mono-sg text-[10px]">(${_esc(t.category)})</span></span>
                <span class="px-2 py-0.5 rounded font-mono-sg text-[10px] font-bold ${t.status === "RESOLVED" ? "badge-active" : "badge-pending"}">${_esc(t.status)}</span>
            </div>
            <p class="text-slate-300 text-[11px]">${_esc(t.message)}</p>
            ${t.response ? `
                <div class="mt-1.5 pt-1.5 border-t border-slate-800 text-[11px] text-emerald-300">
                    <strong>Jibu la Utawala (${_esc(t.responded_by || "Admin")}):</strong> ${_esc(t.response)}
                </div>
            ` : ""}
        </div>
    `).join("");
}

// -----------------------------------------------------------------------
// INTERACTIVE FORMS (CHECK-IN, LEAVE, SUPPORT, CHANGE PASSWORD)
// -----------------------------------------------------------------------
function setupPortalForms() {
    // 1. Attendance Check-in
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
                alert("✓ Check-in yako imerekodiwa (Planned Attendance). Utawala utaithibitisha kwenye kipindi.");
            } catch (err) {
                alert("Taarifa: " + err.message);
            }
        });
    }

    // 2. Leave Request
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
                alert("✓ Ombi lako la ruhusa limewasilishwa kwa uongozi.");
            } catch (err) {
                alert("Hitilafu: " + err.message);
            }
        });
    }

    // 3. Support Ticket
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
                renderMemberDashboard(session);
                alert("✓ Tiketi yako ya msaada imetumwa! Utapata jibu hapa kwenye Portal.");
            } catch (err) {
                alert("Hitilafu: " + err.message);
            }
        });
    }

    // 4. Change Password
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

// -----------------------------------------------------------------------
// DIVISIONS & COURSES
// -----------------------------------------------------------------------
function renderDivisionsAndCourses() {
    const divContainer = document.getElementById("divisions-list");
    if (divContainer && SG_CONFIG.DIVISIONS) {
        divContainer.innerHTML = SG_CONFIG.DIVISIONS.map((d, i) => `
            <div class="flex items-start gap-3 p-3 rounded-xl border border-slate-800/80 hover:border-cyan-500/30 hover:bg-slate-900/60 transition group">
                <div class="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center shrink-0 text-[10px] font-mono-sg font-bold text-cyan-400 group-hover:bg-cyan-500/10 transition">
                    ${_esc(d.number || (i + 1))}
                </div>
                <div class="min-w-0">
                    <span class="text-sm font-bold text-white block leading-snug truncate">${_esc(d.name)}</span>
                    <span class="text-[11px] text-slate-400 leading-tight block">${_esc(d.tagline)}</span>
                </div>
            </div>
        `).join("");
    }

    const curContainer = document.getElementById("curriculum-list");
    if (curContainer && SG_CONFIG.CURRICULUM) {
        const levelColors = ["text-cyan-400", "text-blue-400", "text-purple-400", "text-violet-400", "text-indigo-400", "text-teal-400", "text-emerald-400", "text-amber-400", "text-orange-400", "text-red-400"];
        curContainer.innerHTML = SG_CONFIG.CURRICULUM.map((c, i) => {
            const snippet = c.desc ? c.desc.substring(0, 75) + (c.desc.length > 75 ? "..." : "") : "";
            return `
                <div class="flex items-start gap-3 p-3 rounded-xl border border-slate-800/80 hover:border-purple-500/30 hover:bg-slate-900/60 transition group">
                    <div class="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-800/50 flex items-center justify-center shrink-0 text-[11px] font-mono-sg font-bold ${levelColors[i] || "text-purple-400"} group-hover:bg-purple-500/10 transition">
                        L${_esc(c.level)}
                    </div>
                    <div class="min-w-0">
                        <span class="text-sm font-bold text-white block leading-snug">${_esc(c.title)}</span>
                        <span class="text-[11px] text-slate-400 leading-tight block truncate">${_esc(snippet)}</span>
                    </div>
                </div>
            `;
        }).join("");
    }
}

// -----------------------------------------------------------------------
// ANNOUNCEMENTS
// -----------------------------------------------------------------------
function renderAnnouncements() {
    const slot = document.getElementById("member-announcements-slot");
    if (!slot) return;

    const list = SGStore.getAnnouncements();
    if (!list || list.length === 0) {
        slot.innerHTML = "";
        return;
    }

    slot.innerHTML = list.slice(0, 3).map(a => `
        <div class="p-4 rounded-2xl border ${a.priority === "HIGH" ? "border-amber-500/40 bg-amber-950/10" : "border-slate-800 bg-slate-900/40"} flex items-start gap-4">
            <div class="text-lg mt-0.5 shrink-0">${a.priority === "HIGH" ? "📢" : "📌"}</div>
            <div class="min-w-0">
                <span class="text-[10px] font-mono-sg font-bold uppercase ${a.priority === "HIGH" ? "text-amber-400" : "text-cyan-400"} block mb-0.5">${_esc(a.priority)} · ${_esc(SGUtils.formatDateSw(a.created_at))}</span>
                <p class="text-sm font-bold text-white">${_esc(a.title)}</p>
                <p class="text-xs text-slate-300 mt-0.5 leading-relaxed">${_esc(a.content)}</p>
            </div>
        </div>
    `).join("");
}

// Modal helpers
window.openModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
};
window.closeModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
};
