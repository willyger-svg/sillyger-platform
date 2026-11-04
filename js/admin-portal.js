/**
 * SILLYGER (SG) Super Administrator Control Engine (Article 7 & Appendix B)
 * Full governance: Member Dossier Inspector, RBAC Role Assignment,
 * Status Management, Sequential ID Generator, Announcements Publisher,
 * SG Community Fund Ledger, Attendance & Leave Oversight, Support Tickets,
 * Platform Settings, and Immutable Audit Trail (XSS-Hardened).
 */

const _escAdmin = (v) => (typeof SGUtils !== "undefined" ? SGUtils.escapeHtml(v) : String(v || ""));

let currentActiveTab = "queue";
let inspectingMemberId = null;
let _lastPendingQueueSig = "";
const _busyApprovals = new Set();
let _confirmResolver = null;
let _promptResolver = null;

// Non-blocking Toast Banner (Immune to browser alert/confirm dialog suppression)
window.showAdminToast = function (message, variant = "success") {
    const container = document.getElementById("admin-toast-container");
    if (!container) return;

    const palette = variant === "error"
        ? "border-red-500/60 bg-red-950/95 text-red-100"
        : (variant === "info"
            ? "border-blue-500/60 bg-slate-900/95 text-blue-100"
            : "border-emerald-500/60 bg-emerald-950/95 text-emerald-100");

    const toast = document.createElement("div");
    toast.className = `pointer-events-auto p-4 rounded-2xl border shadow-2xl text-xs font-semibold leading-relaxed flex items-start justify-between gap-3 transition duration-200 ${palette}`;
    toast.innerHTML = `
        <div class="whitespace-pre-line">${_escAdmin(message)}</div>
        <button type="button" class="text-slate-400 hover:text-white shrink-0 font-bold">✕</button>
    `;
    toast.querySelector("button").onclick = () => toast.remove();
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 5500);
};

// In-Page Confirmation Dialog (Replaces native window.confirm which browsers/WebViews can silently block)
window.askAdminConfirm = function ({ title = "Thibitisha Kitendo", message = "", confirmText = "Thibitisha", danger = false }) {
    const modal = document.getElementById("modal-admin-confirm");
    const elTitle = document.getElementById("admin-confirm-title");
    const elMsg = document.getElementById("admin-confirm-message");
    const elOk = document.getElementById("admin-confirm-ok-btn");

    if (!modal || !elTitle || !elMsg || !elOk) {
        return Promise.resolve(true);
    }

    elTitle.textContent = title;
    elMsg.textContent = message;
    elOk.textContent = confirmText;
    elOk.className = danger
        ? "px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold transition shadow-lg"
        : "px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition shadow-lg";

    modal.classList.remove("hidden");

    return new Promise(resolve => {
        _confirmResolver = resolve;
    });
};

window.resolveAdminConfirm = function (accepted) {
    const modal = document.getElementById("modal-admin-confirm");
    if (modal) modal.classList.add("hidden");
    if (_confirmResolver) {
        const fn = _confirmResolver;
        _confirmResolver = null;
        fn(!!accepted);
    }
};

// In-Page Text Input Prompt Dialog (Replaces native window.prompt which WebViews block)
window.askAdminPrompt = function ({
    title = "Ingiza Taarifa",
    message = "",
    placeholder = "",
    initialValue = "",
    confirmText = "Thibitisha",
    danger = false,
    rows = 3
}) {
    const modal = document.getElementById("modal-admin-prompt");
    const elTitle = document.getElementById("admin-prompt-title");
    const elMsg = document.getElementById("admin-prompt-message");
    const elInput = document.getElementById("admin-prompt-input");
    const elOk = document.getElementById("admin-prompt-ok-btn");

    if (!modal || !elTitle || !elMsg || !elInput || !elOk) {
        return Promise.resolve(null);
    }

    elTitle.textContent = title;
    elMsg.textContent = message;
    elInput.placeholder = placeholder || "";
    elInput.value = initialValue || "";
    elInput.rows = rows || 3;
    elOk.textContent = confirmText;
    elOk.className = danger
        ? "px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold transition shadow-lg"
        : "px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold transition shadow-lg";

    modal.classList.remove("hidden");
    setTimeout(() => {
        try { elInput.focus(); } catch (_) {}
    }, 50);

    return new Promise(resolve => {
        _promptResolver = resolve;
    });
};

window.resolveAdminPrompt = function (accepted) {
    const modal = document.getElementById("modal-admin-prompt");
    const elInput = document.getElementById("admin-prompt-input");
    if (modal) modal.classList.add("hidden");
    if (_promptResolver) {
        const fn = _promptResolver;
        _promptResolver = null;
        fn(accepted && elInput ? elInput.value : null);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    initAdminPortal();
});

function initAdminPortal() {
    const session = SGStore.getCurrentSession();
    const dashboardView = document.getElementById("admin-dashboard-view");

    const isAdmin = SGStore.isAdminUser(session);

    if (!isAdmin) {
        if (SGStore.consumeReauthNotice()) {
            window.location.href = "member-portal.html?alert=session_expired";
        } else if (session) {
            window.location.href = `member-portal.html?alert=admin_required&user=${encodeURIComponent(session.username)}`;
        } else {
            window.location.href = "member-portal.html?alert=login_required";
        }
        return;
    }

    if (dashboardView) dashboardView.classList.remove("hidden");
    renderSuperAdminDashboard(session);

    SGStore.syncWithSupabase(true).then(async () => {
        if (SGStore.syncTvState) await SGStore.syncTvState();
        const fresh = SGStore.getCurrentSession();
        if (fresh) {
            rerenderCurrentAdminView(true);
        }
    });
}

function rerenderCurrentAdminView(force = false) {
    refreshAdminTelemetry();
    if (currentActiveTab === "queue") renderPendingQueue(force);
    else if (currentActiveTab === "members") {
        const searchEl = document.getElementById("search-members-input");
        renderMembersDirectory(searchEl ? searchEl.value : "");
    }
    else if (currentActiveTab === "announcements") renderAnnouncementsManager();
    else if (currentActiveTab === "fund") renderFundLedger();
    else if (currentActiveTab === "attendance") renderAttendanceManager();
    else if (currentActiveTab === "leaves") renderLeavesAndTicketsManager();
    else if (currentActiveTab === "audit") renderAuditLogsViewer();
    else if (currentActiveTab === "database") renderDatabaseSettings();
    else if (currentActiveTab === "tv") renderAdminTvStudio();
}

// Cross-tab & Cloud real-time sync listeners
if (typeof window !== "undefined") {
    window.addEventListener("storage", () => {
        if (!SGStore.getCurrentSession()) {
            window.location.href = "member-portal.html";
            return;
        }
        rerenderCurrentAdminView(false);
    });
    window.addEventListener("sg:synced", (e) => {
        if (e && e.detail && e.detail.type === "SESSION_EXPIRED") {
            window.location.href = "member-portal.html?alert=session_expired";
            return;
        }
        if (e && e.detail && e.detail.type === "USER_LOGOUT") {
            window.location.href = "member-portal.html";
            return;
        }
        rerenderCurrentAdminView(false);
    });

    try {
        if (typeof BroadcastChannel !== "undefined") {
            const bc = new BroadcastChannel("sg_platform_sync");
            bc.onmessage = (ev) => {
                if (ev && ev.data && ev.data.type === "SESSION_EXPIRED") {
                    window.location.href = "member-portal.html?alert=session_expired";
                    return;
                }
                if (ev && ev.data && ev.data.type === "USER_LOGOUT") {
                    window.location.href = "member-portal.html";
                    return;
                }
                rerenderCurrentAdminView(false);
            };
        }
    } catch (e) {}

    // Periodic cloud & local queue poll (every 10 seconds when visible — non-destructive diffed render)
    setInterval(() => {
        if (_busyApprovals.size > 0) return;
        if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
        SGStore.syncWithSupabase();
        refreshAdminTelemetry();
        if (currentActiveTab === "queue") {
            renderPendingQueue(false);
        }
    }, 10000);
}

window.handleAdminLogout = async function () {
    SGStore.logout();
    await SGStore.flushPendingWrites();
    window.location.href = "member-portal.html";
};

// -------------------------------------------------------------
// EXECUTIVE DASHBOARD RENDERING
// -------------------------------------------------------------
function renderSuperAdminDashboard(adminUser) {
    const elAdminName = document.getElementById("admin-user-name");
    const elAdminRole = document.getElementById("admin-user-role");
    const elAdminId = document.getElementById("admin-user-id");
    const elInitials = document.getElementById("admin-avatar-initials");

    if (elAdminName) elAdminName.textContent = adminUser.full_name;
    if (elAdminRole) elAdminRole.textContent = adminUser.role;
    if (elAdminId) elAdminId.textContent = adminUser.member_id || "SG-000001";
    if (elInitials) {
        if (adminUser.avatar_url) {
            elInitials.innerHTML = `<img src="${_esc(adminUser.avatar_url)}" alt="Avatar" class="w-full h-full object-cover rounded-xl">`;
        } else {
            elInitials.innerHTML = `<img src="assets/sillyger-logo-icon.svg" alt="SG Logo" class="w-full h-full object-contain p-1">`;
        }
    }

    refreshAdminTelemetry();
    setupAdminTabs();

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const requestedTab = urlParams.get("tab") || window.location.hash.replace("#", "").replace("tab-pane-", "").replace("admin-pane-", "");
        if (requestedTab && document.getElementById(`tab-pane-${requestedTab}`)) {
            currentActiveTab = requestedTab;
        }
    } catch (_) {}

    switchAdminTab(currentActiveTab);
}

function refreshAdminTelemetry() {
    const members = SGStore.getMembers();
    const pending = members.filter(m => m.status === "PENDING").length;
    const active = members.filter(m => m.status === "ACTIVE").length;
    const total = members.length;
    const fundBalance = SGStore.getFundBalance();
    const logsCount = SGStore.getAuditLogs().length;

    const elStatPending = document.getElementById("admin-stat-pending");
    const elStatActive = document.getElementById("admin-stat-active");
    const elStatTotal = document.getElementById("admin-stat-total");
    const elStatFund = document.getElementById("admin-stat-fund");
    const elStatLogs = document.getElementById("admin-stat-logs");
    const elTabBadgePending = document.getElementById("tab-badge-pending");

    if (elStatPending) elStatPending.textContent = pending;
    if (elStatActive) elStatActive.textContent = active;
    if (elStatTotal) elStatTotal.textContent = total;
    if (elStatFund) elStatFund.textContent = "TZS " + fundBalance.toLocaleString();
    if (elStatLogs) elStatLogs.textContent = logsCount;

    if (elTabBadgePending) {
        elTabBadgePending.textContent = pending;
        if (pending > 0) elTabBadgePending.classList.remove("hidden");
        else elTabBadgePending.classList.add("hidden");
    }

    const tvBroadcast = typeof SGStore !== "undefined" ? SGStore.getTvBroadcast() : null;
    const elTabBadgeTv = document.getElementById("tab-badge-tv-live");
    if (elTabBadgeTv) {
        if (tvBroadcast && tvBroadcast.is_live) elTabBadgeTv.classList.remove("hidden");
        else elTabBadgeTv.classList.add("hidden");
    }
}

function setupAdminTabs() {
    const tabBtns = document.querySelectorAll(".admin-nav-tab");
    tabBtns.forEach(btn => {
        btn.onclick = () => {
            const tab = btn.getAttribute("data-tab");
            switchAdminTab(tab);
        };
    });
}

window.switchAdminTab = function (tabName) {
    currentActiveTab = tabName;

    document.querySelectorAll(".admin-nav-tab").forEach(btn => {
        if (btn.getAttribute("data-tab") === tabName) {
            btn.className = "admin-nav-tab px-4 py-2.5 rounded-xl bg-purple-600/20 border border-purple-500/50 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-purple-500/10 whitespace-nowrap";
        } else {
            btn.className = "admin-nav-tab px-4 py-2.5 rounded-xl border border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60 font-semibold text-xs flex items-center gap-2 transition whitespace-nowrap";
        }
    });

    document.querySelectorAll(".admin-tab-pane").forEach(pane => {
        pane.classList.add("hidden");
    });

    const targetPane = document.getElementById(`tab-pane-${tabName}`);
    if (targetPane) {
        targetPane.classList.remove("hidden");
    }

    rerenderCurrentAdminView(true);
};

// -------------------------------------------------------------
// TAB 1: PENDING APPLICATION REVIEW QUEUE (1-CLICK CLOUD VERIFIED)
// -------------------------------------------------------------
function showApprovedFeedbackBanner(approvedMember) {
    const banner = document.getElementById("queue-action-feedback");
    if (!banner || !approvedMember) return;

    const waDigits = String(approvedMember.phone || "").replace(/[^0-9]/g, "");
    const welcomeText = encodeURIComponent(
        `Hongera ${approvedMember.full_name}! 🎉 Maombi yako ya kujiunga na SILLYGER Student Community yameidhinishwa rasmi.\n\nUnique Student ID yako ni: *${approvedMember.member_id}*\n\nIngia sasa kwenye Student Dashboard yako kufungua kiungo cha WhatsApp Group:\nhttps://willyger-svg.github.io/sillyger-platform/member-portal.html`
    );

    banner.classList.remove("hidden");
    banner.innerHTML = `
        <div class="p-4 sm:p-5 rounded-2xl border border-emerald-500/50 bg-emerald-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div class="space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                    <span class="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-mono-sg text-[10px] font-black uppercase">✓ IMEIDHINISHWA KWENYE CLOUD</span>
                    <span class="font-mono-sg text-xs font-bold text-cyan-300">${_escAdmin(approvedMember.member_id)}</span>
                </div>
                <p class="text-sm font-bold text-white">
                    ${_escAdmin(approvedMember.full_name)} <span class="text-xs font-mono-sg text-slate-400">(@${_escAdmin(approvedMember.username)})</span> sasa ni ACTIVE!
                </p>
                <p class="text-xs text-slate-300">
                    Akiingia kwenye Dashboard yake sasa hivi ataona kitufe cha kuingia WhatsApp Group moja kwa moja.
                </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
                ${waDigits ? `
                    <a
                        href="https://wa.me/${waDigits}?text=${welcomeText}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition flex items-center gap-1.5 shadow-md"
                    >
                        <span>💬 Mjulishe WhatsApp</span>
                    </a>
                ` : ""}
                <button
                    type="button"
                    onclick="document.getElementById('queue-action-feedback').classList.add('hidden')"
                    class="px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs"
                >
                    Funga
                </button>
            </div>
        </div>
    `;
}

function renderPendingQueue(force = false) {
    // Do not wipe DOM buttons while an approval request is actively running
    if (!force && _busyApprovals.size > 0) return;

    const modeBanner = document.getElementById("queue-cloud-mode-banner");
    if (modeBanner) {
        if (SG_CONFIG.SUPABASE.isConfigured) {
            modeBanner.classList.add("hidden");
            modeBanner.innerHTML = "";
        } else {
            modeBanner.classList.remove("hidden");
            modeBanner.innerHTML = `
                <div class="p-4 rounded-2xl border border-amber-500/40 bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div class="text-slate-300 leading-relaxed">
                        <strong class="text-amber-400 font-mono-sg uppercase block mb-0.5">⚡ LOCAL MODE (Kifaa Hiki Pekee)</strong>
                        Kwa sasa maombi yanayotumwa kwenye kivinjari hiki pekee ndiyo yanaonekana hapa. Ili kupokea maombi kutoka kwenye <strong>simu za watu wote mtandaoni</strong>, unganisha <strong>Supabase (Bure 100%)</strong>.
                    </div>
                    <button type="button" onclick="switchAdminTab('database')" class="shrink-0 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition whitespace-nowrap">
                        Unganisha Supabase Sasa &rarr;
                    </button>
                </div>
            `;
        }
    }

    const container = document.getElementById("pending-queue-tbody");
    const mobileContainer = document.getElementById("pending-queue-mobile-cards");
    const approveAllBtn = document.getElementById("btn-approve-all-pending");
    const approveAllCount = document.getElementById("approve-all-count");
    if (!container) return;

    const members = SGStore.getMembers();
    const pending = members.filter(m => m.status === "PENDING");

    if (approveAllBtn && approveAllCount) {
        approveAllCount.textContent = pending.length;
        if (pending.length > 1) approveAllBtn.classList.remove("hidden");
        else approveAllBtn.classList.add("hidden");
    }

    // Compute signature so background 6-second sync NEVER destroys buttons unless queue actually changed
    const currentSig = JSON.stringify(pending.map(p => [p.id, p.username, p.status, p.phone, p.created_at]));
    if (!force && currentSig === _lastPendingQueueSig && container.children.length > 0) {
        return;
    }
    _lastPendingQueueSig = currentSig;

    if (pending.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-slate-500 font-mono-sg text-xs">
                    ✓ Hakuna maombi mapya yanayosubiri ukaguzi kwa sasa (All applications reviewed).
                </td>
            </tr>
        `;
        if (mobileContainer) {
            mobileContainer.innerHTML = `
                <div class="sg-glass p-8 rounded-2xl border border-slate-800 text-center text-slate-500 font-mono-sg text-xs">
                    ✓ Hakuna maombi mapya yanayosubiri ukaguzi kwa sasa.
                </div>
            `;
        }
        return;
    }

    // 1. Mobile Cards View
    if (mobileContainer) {
        mobileContainer.innerHTML = pending.map(p => {
            const safeId = _escAdmin(p.id);
            const waDigits = String(p.phone || "").replace(/[^0-9]/g, "");
            const noteText = p.learning_interest || p.motivation || "";
            return `
                <div class="sg-glass p-4 rounded-2xl border border-slate-800 space-y-3 shadow-lg">
                    <div class="flex items-start justify-between gap-2">
                        <div>
                            <span class="font-bold text-white text-sm block">${_escAdmin(p.full_name)}</span>
                            <span class="text-xs font-mono-sg text-blue-400">@${_escAdmin(p.username)}</span>
                        </div>
                        <span class="px-2 py-0.5 rounded badge-pending text-[10px] font-mono-sg font-bold uppercase">PENDING</span>
                    </div>
                    <div class="text-xs space-y-1 text-slate-300">
                        <div class="flex items-center justify-between">
                            <span class="text-slate-500">WhatsApp:</span>
                            <a href="https://wa.me/${waDigits}" target="_blank" rel="noopener noreferrer" class="font-mono-sg text-emerald-400 font-bold hover:underline">${_escAdmin(p.phone)}</a>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-slate-500">Email:</span>
                            <span class="font-mono-sg text-slate-300 truncate max-w-[200px]">${_escAdmin(p.email)}</span>
                        </div>
                        ${noteText ? `<p class="pt-1 text-slate-400 italic text-[11px]">"${_escAdmin(noteText)}"</p>` : ""}
                    </div>
                    <div class="grid grid-cols-12 gap-2 pt-2 border-t border-slate-800/70">
                        <button
                            type="button"
                            onclick="approveApplicant('${safeId}', this)"
                            class="col-span-7 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                        >
                            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                            <span>Idhinisha Sasa</span>
                        </button>
                        <button
                            type="button"
                            onclick="openMemberDossier('${safeId}')"
                            class="col-span-3 py-2.5 px-2 rounded-xl border border-slate-700 hover:border-purple-400 text-slate-200 text-xs font-semibold transition text-center"
                        >
                            Dossier
                        </button>
                        <button
                            type="button"
                            onclick="rejectApplicant('${safeId}')"
                            class="col-span-2 py-2.5 px-2 rounded-xl border border-red-500/40 hover:bg-red-950/40 text-red-400 text-xs font-semibold transition text-center"
                            title="Futa"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    }

    // 2. Desktop Table View
    container.innerHTML = pending.map(p => {
        const safeId = _escAdmin(p.id);
        const waDigits = String(p.phone || "").replace(/[^0-9]/g, "");
        const noteText = p.learning_interest || p.motivation || "";
        return `
            <tr class="border-b border-slate-800/60 hover:bg-slate-900/40 transition">
                <td class="px-4 py-4">
                    <span class="font-bold text-white block">${_escAdmin(p.full_name)}</span>
                    <span class="text-xs font-mono-sg text-blue-400">@${_escAdmin(p.username)}</span>
                </td>
                <td class="px-4 py-4 text-xs font-mono-sg text-slate-300">
                    <a href="https://wa.me/${waDigits}" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:underline flex items-center gap-1 font-bold">
                        <span>${_escAdmin(p.phone)}</span>
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </a>
                    <span class="text-[11px] text-slate-500">${_escAdmin(p.email)}</span>
                </td>
                <td class="px-4 py-4 text-xs text-slate-300">
                    <span class="px-2.5 py-0.5 rounded-md badge-future text-[11px] font-mono-sg inline-block">
                        ${_escAdmin(p.track || "SG Student Community")}
                    </span>
                </td>
                <td class="px-4 py-4 text-xs text-slate-300 max-w-xs truncate" title="${_escAdmin(noteText)}">
                    ${noteText ? _escAdmin(noteText) : '<em class="text-slate-500">Mwanafunzi mpya (bila ujumbe wa ziada)</em>'}
                </td>
                <td class="px-4 py-4 text-xs font-mono-sg text-slate-400">
                    ${_escAdmin(SGUtils.formatDateSw(p.created_at))}
                </td>
                <td class="px-4 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onclick="approveApplicant('${safeId}', this)"
                            class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition shadow-md shadow-emerald-500/20 flex items-center gap-1.5 whitespace-nowrap"
                            title="Idhinisha moja kwa moja na kutoa namba ya SG-xxxxxx"
                        >
                            <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                            <span>Idhinisha Sasa</span>
                        </button>
                        <button
                            type="button"
                            onclick="openMemberDossier('${safeId}')"
                            class="px-2.5 py-2 rounded-xl border border-slate-700 hover:border-purple-400 text-slate-300 hover:text-white text-xs transition"
                            title="Kagua maelezo kamili"
                        >
                            Dossier
                        </button>
                        <button
                            type="button"
                            onclick="rejectApplicant('${safeId}')"
                            class="px-2.5 py-2 rounded-xl border border-red-500/30 hover:border-red-500/80 hover:bg-red-950/40 text-red-400 text-xs transition"
                            title="Kataa au futa maombi haya"
                        >
                            Futa
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

window.approveApplicant = async function (applicantId, btnEl = null) {
    if (!applicantId || _busyApprovals.has(applicantId)) return;

    const adminUser = SGStore.getCurrentSession();
    const adminActor = adminUser ? adminUser.username : "willyger";

    _busyApprovals.add(applicantId);
    const origHtml = btnEl ? btnEl.innerHTML : "";
    if (btnEl) {
        btnEl.disabled = true;
        btnEl.classList.add("opacity-80", "cursor-wait");
        btnEl.innerHTML = `<span>⏳ Inaidhinisha...</span>`;
    }

    try {
        const freshApproved = await SGStore.approveMemberAsync(applicantId, adminActor);
        _busyApprovals.delete(applicantId);

        showApprovedFeedbackBanner(freshApproved);
        showAdminToast(
            `✓ ${freshApproved.full_name} ameidhinishwa rasmi!\nMember ID: ${freshApproved.member_id}`,
            "success"
        );

        refreshAdminTelemetry();
        renderPendingQueue(true);
        renderMembersDirectory();
    } catch (e) {
        _busyApprovals.delete(applicantId);
        if (btnEl) {
            btnEl.disabled = false;
            btnEl.classList.remove("opacity-80", "cursor-wait");
            btnEl.innerHTML = origHtml;
        }
        showAdminToast("Hitilafu wakati wa kuidhinisha: " + (e.message || e), "error");
    }
};

window.approveAllPendingApplicants = async function () {
    const pending = SGStore.getMembers().filter(m => m.status === "PENDING");
    if (pending.length === 0) return;

    const ok = await askAdminConfirm({
        title: `Idhinisha Wanafunzi Wote (${pending.length})?`,
        message: `Mfumo utawapa namba rasmi za SG-XXXXXX wanafunzi wote ${pending.length} wanaosubiri na kuwafungulia WhatsApp Group mara moja.`,
        confirmText: `✓ Idhinisha Wote (${pending.length})`,
        danger: false
    });
    if (!ok) return;

    const btn = document.getElementById("btn-approve-all-pending");
    const origHtml = btn ? btn.innerHTML : "";
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span>⏳ Inaidhinisha wote...</span>`;
    }

    const adminUser = SGStore.getCurrentSession();
    const adminActor = adminUser ? adminUser.username : "willyger";

    try {
        _busyApprovals.add("__ALL__");
        const approvedList = await SGStore.approveAllPendingAsync(adminActor);
        _busyApprovals.delete("__ALL__");

        if (approvedList.length > 0) {
            showApprovedFeedbackBanner(approvedList[approvedList.length - 1]);
            showAdminToast(`✓ Wanafunzi ${approvedList.length} wameidhinishwa kikamilifu!`, "success");
        }
        refreshAdminTelemetry();
        renderPendingQueue(true);
        renderMembersDirectory();
    } catch (e) {
        _busyApprovals.delete("__ALL__");
        showAdminToast("Hitilafu: " + (e.message || e), "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = origHtml;
        }
    }
};

window.rejectApplicant = async function (applicantId) {
    const target = SGStore.findMemberById(applicantId);
    if (!target) return;

    const ok = await askAdminConfirm({
        title: "Kataa na Futa Maombi?",
        message: `Je, una uhakika unataka kukataa na kufuta maombi ya ${target.full_name} (@${target.username})?\n\nRekodi hii itaondolewa kwenye mfumo.`,
        confirmText: "Ndiyo, Futa Maombi",
        danger: true
    });
    if (!ok) return;

    try {
        _busyApprovals.add(applicantId);
        const adminUser = SGStore.getCurrentSession();
        const adminActor = adminUser ? adminUser.username : "willyger";
        await SGStore.deleteMemberAsync(applicantId, adminActor);
        _busyApprovals.delete(applicantId);

        showAdminToast(`✓ Maombi ya ${target.full_name} yameondolewa.`, "info");
        refreshAdminTelemetry();
        renderPendingQueue(true);
        renderMembersDirectory();
    } catch (e) {
        _busyApprovals.delete(applicantId);
        showAdminToast("Hitilafu: " + (e.message || e), "error");
    }
};

window.manualRefreshQueue = async function () {
    const btn = document.getElementById("btn-manual-refresh-queue");
    const origHtml = btn ? btn.innerHTML : "";
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span>Inasawazisha...</span>`;
    }
    try {
        await SGStore.syncWithSupabase(true);
        refreshAdminTelemetry();
        renderPendingQueue(true);
        renderMembersDirectory();
        if (btn) {
            btn.innerHTML = `<span class="text-emerald-300">✓ Imesawazishwa</span>`;
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = origHtml;
            }, 1200);
        }
    } catch (e) {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = origHtml;
        }
    }
};

// -------------------------------------------------------------
// TAB 2: MEMBERS DIRECTORY & DOSSIER INSPECTOR
// -------------------------------------------------------------
function renderMembersDirectory(searchFilter = "") {
    const container = document.getElementById("members-directory-tbody");
    if (!container) return;

    let members = SGStore.getMembers();
    const query = (searchFilter || "").toLowerCase().trim();

    if (query) {
        members = members.filter(m =>
            (m.full_name && m.full_name.toLowerCase().includes(query)) ||
            (m.username && m.username.toLowerCase().includes(query)) ||
            (m.member_id && m.member_id.toLowerCase().includes(query)) ||
            (m.phone && m.phone.includes(query)) ||
            (m.role && m.role.toLowerCase().includes(query))
        );
    }

    container.innerHTML = members.map(m => {
        const isActive = m.status === "ACTIVE";
        const isPending = m.status === "PENDING";
        const badgeClass = isActive ? "badge-active" : (isPending ? "badge-pending" : "badge-suspended");
        const waDigits = String(m.phone || "").replace(/[^0-9]/g, "");

        return `
            <tr class="border-b border-slate-800/60 hover:bg-slate-900/40 transition text-xs">
                <td class="px-4 py-3 font-mono-sg font-bold">
                    ${m.member_id
                        ? `<span class="text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded">${_escAdmin(m.member_id)}</span>`
                        : '<span class="text-slate-500 font-mono-sg">NULL</span>'}
                </td>
                <td class="px-4 py-3">
                    <span class="font-bold text-white block">${_escAdmin(m.full_name)}</span>
                    <span class="text-slate-400 font-mono-sg text-[11px]">@${_escAdmin(m.username)}</span>
                </td>
                <td class="px-4 py-3 font-mono-sg text-slate-300">
                    <a href="https://wa.me/${waDigits}" target="_blank" rel="noopener noreferrer" class="hover:text-emerald-400 hover:underline">
                        ${_escAdmin(m.phone)}
                    </a>
                </td>
                <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/50 text-purple-300 font-mono-sg text-[10px] font-bold">
                        ${_escAdmin(m.role || "Member")}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded uppercase font-bold text-[10px] font-mono-sg ${badgeClass}">
                        ${_escAdmin(m.status)}
                    </span>
                </td>
                <td class="px-4 py-3 text-right">
                    <button
                        onclick="openMemberDossier('${_escAdmin(m.id)}')"
                        class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-950/60 border border-slate-700 hover:border-purple-500/50 text-cyan-300 hover:text-white font-bold text-xs transition"
                    >
                        ⚙️ Dhibiti (Inspect)
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

// -------------------------------------------------------------
// DOSSIER INSPECTOR MODAL
// -------------------------------------------------------------
window.openMemberDossier = function (memberId) {
    inspectingMemberId = memberId;
    const member = SGStore.findMemberById(memberId);
    if (!member) return;

    const modal = document.getElementById("modal-member-dossier");
    if (!modal) return;

    document.getElementById("dossier-name").textContent = member.full_name;
    document.getElementById("dossier-username").textContent = "@" + member.username;
    document.getElementById("dossier-email").textContent = member.email;
    document.getElementById("dossier-phone").textContent = member.phone;
    document.getElementById("dossier-whatsapp-link").href = `https://wa.me/${String(member.phone || "").replace(/[^0-9]/g, "")}`;
    document.getElementById("dossier-track").textContent = member.track || "SG Student Community";
    document.getElementById("dossier-experience").textContent = member.experience || "Student";
    document.getElementById("dossier-motivation").textContent = member.learning_interest || member.motivation || "Mwanafunzi wa SILLYGER (bila maelezo ya ziada)";
    document.getElementById("dossier-joined").textContent = SGUtils.formatDateSw(member.created_at, true);

    const pendingBanner = document.getElementById("dossier-pending-banner");
    if (pendingBanner) {
        if (member.status === "PENDING") pendingBanner.classList.remove("hidden");
        else pendingBanner.classList.add("hidden");
    }

    document.getElementById("dossier-member-id-input").value = member.member_id || "";
    document.getElementById("dossier-role-select").value = member.role || "Member";
    document.getElementById("dossier-status-select").value = member.status || "PENDING";
    document.getElementById("dossier-new-password-input").value = "";
    document.getElementById("dossier-audit-reason").value = "";

    modal.classList.remove("hidden");
};

window.quickApproveFromDossier = async function () {
    if (!inspectingMemberId) return;
    const targetId = inspectingMemberId;
    const btn = document.getElementById("btn-dossier-quick-approve");
    await approveApplicant(targetId, btn);
    closeMemberDossier();
};

window.closeMemberDossier = function () {
    const modal = document.getElementById("modal-member-dossier");
    if (modal) modal.classList.add("hidden");
    inspectingMemberId = null;
};

window.saveDossierChanges = async function (e) {
    if (e) e.preventDefault();
    if (!inspectingMemberId) return;

    const member = SGStore.findMemberById(inspectingMemberId);
    if (!member) return;

    const originalStatus = member.status;
    const originalRole = member.role;

    const newId = document.getElementById("dossier-member-id-input").value.trim();
    const selectedRole = document.getElementById("dossier-role-select").value;
    const newStatus = document.getElementById("dossier-status-select").value;
    const newPassword = document.getElementById("dossier-new-password-input").value;
    const reason = document.getElementById("dossier-audit-reason").value.trim() || "Imeidhinishwa / kusasishwa na Super Administrator";

    const effectiveTargetRole = (newStatus === "ACTIVE" && selectedRole === "Applicant" && originalRole === "Applicant")
        ? "Member"
        : selectedRole;

    const saveBtn = document.getElementById("btn-dossier-save");
    const origBtnText = saveBtn ? saveBtn.textContent : "";
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "⏳ Inahifadhi...";
    }

    try {
        if (
            originalStatus === "PENDING" &&
            newStatus === "ACTIVE" &&
            !newId &&
            effectiveTargetRole === "Member" &&
            (!newPassword || !newPassword.trim())
        ) {
            const approved = await SGStore.approveMemberAsync(member.id);
            showApprovedFeedbackBanner(approved);
        } else {
            const updated = await SGStore.updateMemberDossierAsync(member.id, {
                member_id: newId || null,
                role: effectiveTargetRole,
                status: newStatus,
                new_password: newPassword && newPassword.trim() ? newPassword : null,
                reason
            });
            if (originalStatus === "PENDING" && updated && updated.status === "ACTIVE") {
                showApprovedFeedbackBanner(updated);
            }
        }

        await SGStore.flushPendingWrites();

        showAdminToast("✓ Taarifa za mwanachama zimesasishwa kikamilifu!", "success");
        closeMemberDossier();
        refreshAdminTelemetry();
        renderMembersDirectory();
        renderPendingQueue(true);
    } catch (err) {
        showAdminToast("Hitilafu: " + (err.message || err), "error");
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = origBtnText;
        }
    }
};

// -------------------------------------------------------------
// TAB 3: OFFICIAL ANNOUNCEMENTS PUBLISHER (Article 6.8 & 11)
// -------------------------------------------------------------
function renderAnnouncementsManager() {
    const container = document.getElementById("announcements-feed-container");
    if (!container) return;

    const list = SGStore.getAnnouncements();

    if (list.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-slate-500 font-mono-sg text-xs">Hakuna matangazo yaliyochapishwa bado.</div>`;
        return;
    }

    container.innerHTML = list.map(a => `
        <div class="sg-glass p-5 rounded-2xl border ${a.priority === "HIGH" ? "border-amber-500/40 bg-amber-950/10" : "border-slate-800"} space-y-2">
            <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-mono-sg font-bold uppercase tracking-wider ${a.priority === "HIGH" ? "text-amber-400" : "text-cyan-400"}">
                    ● ${_escAdmin(a.priority)} PRIORITY ANNOUNCEMENT
                </span>
                <div class="flex items-center gap-3">
                    <span class="text-[11px] text-slate-500 font-mono-sg">
                        ${_escAdmin(SGUtils.formatDateSw(a.created_at))}
                    </span>
                    <button onclick="removeOfficialAnnouncement('${_escAdmin(a.id)}')" class="text-[11px] text-red-400 hover:underline font-mono-sg">Futa</button>
                </div>
            </div>
            <h3 class="text-base font-bold text-white">${_escAdmin(a.title)}</h3>
            <p class="text-xs md:text-sm text-slate-300 leading-relaxed">${_escAdmin(a.content)}</p>
            <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono-sg text-slate-500">
                <span>Mwandishi: <strong class="text-slate-300">${_escAdmin(a.author)}</strong></span>
                <span>Inaonekana kwenye Member Portal</span>
            </div>
        </div>
    `).join("");
}

window.publishOfficialAnnouncement = async function (e) {
    if (e) e.preventDefault();
    const title = document.getElementById("anc-title-input").value.trim();
    const content = document.getElementById("anc-content-input").value.trim();
    const priority = document.getElementById("anc-priority-input").value;

    if (!title || !content) {
        showAdminToast("Tafadhali weka kichwa cha habari na maudhui ya tangazo.", "error");
        return;
    }

    const form = document.getElementById("form-create-announcement");
    const btn = form ? form.querySelector('button[type="submit"]') : null;
    const orig = btn ? btn.innerHTML : "";
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "⏳ Inachapisha...";
    }

    try {
        await SGStore.createAnnouncementAsync({ title, content, priority });
        showAdminToast("✓ Tangazo rasmi limechapishwa na linapatikana kwa wanachama wote!", "success");
        if (form) form.reset();
        renderAnnouncementsManager();
        refreshAdminTelemetry();
    } catch (err) {
        showAdminToast("Hitilafu: " + (err.message || err), "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = orig;
        }
    }
};

window.removeOfficialAnnouncement = async function (ancId) {
    const ok = await askAdminConfirm({
        title: "Futa Tangazo Rasmi?",
        message: "Je, una uhakika unataka kuondoa tangazo hili kwenye Dashboard za wanafunzi?",
        confirmText: "Ndiyo, Futa",
        danger: true
    });
    if (!ok) return;
    try {
        await SGStore.deleteAnnouncementAsync(ancId);
        showAdminToast("✓ Tangazo limeondolewa.", "info");
        renderAnnouncementsManager();
        refreshAdminTelemetry();
    } catch (err) {
        showAdminToast("Hitilafu: " + (err.message || err), "error");
    }
};

// -------------------------------------------------------------
// TAB 4: SG COMMUNITY FUND LEDGER (Article 13)
// -------------------------------------------------------------
function renderFundLedger() {
    const container = document.getElementById("fund-ledger-tbody");
    const elLedgerBalance = document.getElementById("fund-ledger-balance-display");
    if (!container) return;

    const list = SGStore.getFundLedger();
    const balance = SGStore.getFundBalance();

    if (elLedgerBalance) {
        elLedgerBalance.textContent = "TZS " + balance.toLocaleString();
    }

    if (list.length === 0) {
        container.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500 font-mono-sg text-xs">Hakuna miamala iliyorekodiwa bado.</td></tr>`;
        return;
    }

    container.innerHTML = list.map(tx => `
        <tr class="border-b border-slate-800/60 hover:bg-slate-900/40 transition text-xs font-mono-sg">
            <td class="px-4 py-3 text-slate-400">${_escAdmin(tx.date || tx.tx_date)}</td>
            <td class="px-4 py-3 font-bold">
                ${tx.type === "INCOME"
                    ? '<span class="text-emerald-400 font-bold">+ MAPATO (INCOME)</span>'
                    : '<span class="text-amber-400 font-bold">- MATUMIZI (EXPENSE)</span>'}
            </td>
            <td class="px-4 py-3 font-bold text-white">TZS ${(parseFloat(tx.amount) || 0).toLocaleString()}</td>
            <td class="px-4 py-3 text-cyan-400">${_escAdmin(tx.category)}</td>
            <td class="px-4 py-3 text-slate-300 max-w-xs truncate" title="${_escAdmin(tx.description)}">${_escAdmin(tx.description)}</td>
        </tr>
    `).join("");
}

window.recordFundTransaction = async function (e) {
    if (e) e.preventDefault();
    const type = document.getElementById("fund-type-select").value;
    const amount = document.getElementById("fund-amount-input").value;
    const category = document.getElementById("fund-category-input").value;
    const description = document.getElementById("fund-desc-input").value.trim();

    if (!amount || !description) {
        showAdminToast("Tafadhali jaza kiasi na maelezo ya muamala.", "error");
        return;
    }

    const form = document.getElementById("form-fund-transaction");
    const btn = form ? form.querySelector('button[type="submit"]') : null;
    const orig = btn ? btn.innerHTML : "";
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "⏳ Inarekodi...";
    }

    try {
        await SGStore.addFundTransactionAsync({
            type,
            amount,
            category,
            description
        });

        showAdminToast("✓ Muamala wa SG Community Fund umerekodiwa rasmi kwenye leja!", "success");
        if (form) form.reset();
        refreshAdminTelemetry();
        renderFundLedger();
    } catch (err) {
        showAdminToast("Hitilafu: " + (err.message || err), "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = orig;
        }
    }
};

// -------------------------------------------------------------
// TAB 5: ATTENDANCE VERIFICATIONS (Article 9)
// -------------------------------------------------------------
function renderAttendanceManager() {
    const container = document.getElementById("attendance-manager-tbody");
    const sessionInput = document.getElementById("active-session-title-input");
    if (sessionInput) {
        const settings = SGStore.getPlatformSettings();
        if (settings.active_session_title && !sessionInput.matches(":focus")) {
            sessionInput.value = settings.active_session_title;
        }
    }
    if (!container) return;

    const list = SGStore.getAttendanceRecords();

    if (list.length === 0) {
        container.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500 font-mono-sg text-xs">Hakuna kumbukumbu za mahudhurio bado.</td></tr>`;
        return;
    }

    container.innerHTML = list.map(a => `
        <tr class="border-b border-slate-800/60 hover:bg-slate-900/40 transition text-xs">
            <td class="px-4 py-3 font-mono-sg text-cyan-400 font-bold">${_escAdmin(a.member_id)}</td>
            <td class="px-4 py-3 text-white font-semibold">${_escAdmin(a.session_title)}</td>
            <td class="px-4 py-3 font-mono-sg text-slate-400">${_escAdmin(a.date || a.session_date)}</td>
            <td class="px-4 py-3">
                ${a.is_verified ? `
                    <span class="px-2 py-0.5 rounded badge-active font-mono-sg text-[10px] font-bold">
                        ✓ VERIFIED (${_escAdmin(a.verified_by || "Admin")})
                    </span>
                ` : `
                    <span class="px-2 py-0.5 rounded badge-pending font-mono-sg text-[10px] font-bold">
                        PLANNED (UNVERIFIED)
                    </span>
                `}
            </td>
            <td class="px-4 py-3 text-right">
                ${!a.is_verified ? `
                    <button
                        onclick="verifyAttendanceRecord('${_escAdmin(a.id)}')"
                        class="px-3 py-1 rounded bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition"
                    >
                        Thibitisha
                    </button>
                ` : '<span class="text-slate-600 text-[11px] font-mono-sg">Imethibitishwa</span>'}
            </td>
        </tr>
    `).join("");
}

window.saveActiveSessionTitle = async function () {
    const input = document.getElementById("active-session-title-input");
    if (!input) return;
    const title = input.value.trim();
    try {
        await SGStore.updatePlatformSettingsAsync({ active_session_title: title });
        showAdminToast(title ? `✓ Kipindi cha sasa kimewekwa: "${title}"` : "✓ Jina la kipindi kimefutwa.", "success");
    } catch (err) {
        showAdminToast("Hitilafu: " + (err.message || err), "error");
    }
};

window.verifyAttendanceRecord = async function (recordId) {
    try {
        await SGStore.verifyAttendanceAsync(recordId, false);
        showAdminToast("✓ Mahudhurio yamethibitishwa!", "success");
        renderAttendanceManager();
        refreshAdminTelemetry();
    } catch (err) {
        showAdminToast("Hitilafu: " + (err.message || err), "error");
    }
};

window.verifyAllPendingAttendance = async function () {
    try {
        const count = await SGStore.verifyAttendanceAsync(null, true);
        if (count > 0) {
            showAdminToast(`✓ Vipindi ${count} vya mahudhurio vimethibitishwa vyote mara moja!`, "success");
            renderAttendanceManager();
            refreshAdminTelemetry();
        } else {
            showAdminToast("Hakuna mahudhurio mapya yasiyothibitishwa.", "info");
        }
    } catch (err) {
        showAdminToast("Hitilafu: " + (err.message || err), "error");
    }
};

// -------------------------------------------------------------
// TAB 6: LEAVE REQUESTS (Art. 10) & SUPPORT TICKETS (Art. 6.12)
// -------------------------------------------------------------
function renderLeavesAndTicketsManager() {
    // 1. Leaves
    const leavesContainer = document.getElementById("leaves-manager-tbody");
    if (leavesContainer) {
        const list = SGStore.getLeaveRequests();
        if (list.length === 0) {
            leavesContainer.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500 font-mono-sg text-xs">Hakuna maombi ya ruhusa yaliyowasilishwa.</td></tr>`;
        } else {
            leavesContainer.innerHTML = list.map(l => {
                const badge = l.status === "APPROVED"
                    ? "badge-active"
                    : (l.status === "REJECTED" ? "badge-suspended" : "badge-pending");
                return `
                    <tr class="border-b border-slate-800/60 hover:bg-slate-900/40 transition text-xs">
                        <td class="px-4 py-3 font-mono-sg text-cyan-400 font-bold">${_escAdmin(l.member_id)}</td>
                        <td class="px-4 py-3 text-slate-200">
                            <span class="font-bold block">${_escAdmin(l.category)}</span>
                            <span class="text-slate-400 text-[11px]">${_escAdmin(l.duration)}</span>
                        </td>
                        <td class="px-4 py-3 text-slate-300 max-w-xs">${_escAdmin(l.reason)}</td>
                        <td class="px-4 py-3">
                            <span class="px-2 py-0.5 rounded ${badge} font-mono-sg text-[10px] font-bold">
                                ${_escAdmin(l.status)}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-right">
                            ${l.status === "PENDING_REVIEW" ? `
                                <div class="flex items-center justify-end gap-1.5">
                                    <button onclick="decideLeave('${_escAdmin(l.id)}', 'APPROVED')" class="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition">
                                        Kubali
                                    </button>
                                    <button onclick="decideLeave('${_escAdmin(l.id)}', 'REJECTED')" class="px-2.5 py-1 rounded border border-red-500/40 text-red-400 hover:bg-red-950/40 text-xs transition">
                                        Kataa
                                    </button>
                                </div>
                            ` : `<span class="text-slate-500 text-[11px]">Imekaguliwa</span>`}
                        </td>
                    </tr>
                `;
            }).join("");
        }
    }

    // 2. Support Tickets
    const ticketsContainer = document.getElementById("tickets-manager-tbody");
    if (ticketsContainer) {
        const tickets = SGStore.getSupportTickets();
        if (tickets.length === 0) {
            ticketsContainer.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500 font-mono-sg text-xs">Hakuna tiketi za msaada zilizowasilishwa.</td></tr>`;
        } else {
            ticketsContainer.innerHTML = tickets.map(t => `
                <tr class="border-b border-slate-800/60 hover:bg-slate-900/40 transition text-xs">
                    <td class="px-4 py-3 font-mono-sg text-cyan-400 font-bold">${_escAdmin(t.member_id)}</td>
                    <td class="px-4 py-3 text-slate-200">
                        <span class="font-bold block">${_escAdmin(t.subject)}</span>
                        <span class="text-slate-400 text-[11px]">${_escAdmin(t.category)}</span>
                    </td>
                    <td class="px-4 py-3 text-slate-300 max-w-xs">
                        <div>${_escAdmin(t.message)}</div>
                        ${t.response ? `<div class="mt-1 text-[11px] text-emerald-400">↳ Jibu: ${_escAdmin(t.response)}</div>` : ""}
                    </td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-0.5 rounded ${t.status === "RESOLVED" ? "badge-active" : "badge-pending"} font-mono-sg text-[10px] font-bold">
                            ${_escAdmin(t.status)}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                        <button onclick="replyToTicket('${_escAdmin(t.id)}')" class="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition">
                            ${t.status === "RESOLVED" ? "Hariri Jibu" : "Jibu (Reply)"}
                        </button>
                    </td>
                </tr>
            `).join("");
        }
    }
}

window.decideLeave = async function (leaveId, decision) {
    try {
        await SGStore.reviewLeaveRequestAsync(leaveId, decision);
        showAdminToast(decision === "APPROVED" ? "✓ Ombi la ruhusa limekubaliwa." : "✓ Ombi la ruhusa limekataliwa.", "success");
        renderLeavesAndTicketsManager();
        refreshAdminTelemetry();
    } catch (err) {
        showAdminToast("Hitilafu: " + (err.message || err), "error");
    }
};

window.replyToTicket = async function (ticketId) {
    const ticket = SGStore.getSupportTickets().find(t => t.id === ticketId);
    if (!ticket) return;
    const reply = await askAdminPrompt({
        title: `Jibu Tiketi ya ${ticket.member_id}`,
        message: `Kichwa: "${ticket.subject}"\nUjumbe: ${ticket.message}`,
        placeholder: "Andika jibu rasmi la Admin hapa...",
        initialValue: ticket.response || "",
        confirmText: "Tuma Jibu Rasmi",
        danger: false,
        rows: 4
    });
    if (reply === null) return;
    if (!reply.trim()) {
        showAdminToast("Tafadhali andika jibu kabla ya kuhifadhi.", "error");
        return;
    }
    try {
        await SGStore.resolveSupportTicketAsync(ticketId, reply.trim());
        showAdminToast("✓ Jibu la tiketi limetumwa na kuhifadhiwa!", "success");
        renderLeavesAndTicketsManager();
        refreshAdminTelemetry();
    } catch (err) {
        showAdminToast("Hitilafu: " + (err.message || err), "error");
    }
};

// -------------------------------------------------------------
// TAB 7: IMMUTABLE AUDIT LOGS VIEWER (Article 7.7)
// -------------------------------------------------------------
function renderAuditLogsViewer(filterType = "") {
    const container = document.getElementById("audit-logs-tbody");
    if (!container) return;

    let logs = SGStore.getAuditLogs();
    if (filterType) {
        logs = logs.filter(l => l.action && l.action.includes(filterType));
    }

    if (logs.length === 0) {
        container.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500 font-mono-sg text-xs">Hakuna kumbukumbu za ukaguzi zilizopatikana.</td></tr>`;
        return;
    }

    container.innerHTML = logs.map(l => {
        let actionColor = "text-cyan-400";
        if (l.action.includes("APPROVED") || l.action.includes("VERIFIED")) actionColor = "text-emerald-400";
        else if (l.action.includes("SUSPEND") || l.action.includes("HOLD") || l.action.includes("DELETED") || l.action.includes("REJECTED")) actionColor = "text-amber-400";
        else if (l.action.includes("ROLE") || l.action.includes("OVERRIDE") || l.action.includes("PASSWORD")) actionColor = "text-purple-400";
        else if (l.action.includes("FUND")) actionColor = "text-teal-400";

        return `
            <tr class="border-b border-slate-800/60 hover:bg-slate-900/40 transition text-xs font-mono-sg">
                <td class="px-4 py-3 text-slate-400 text-[11px] whitespace-nowrap">
                    ${_escAdmin(SGUtils.formatDateSw(l.timestamp, true))}
                </td>
                <td class="px-4 py-3 font-bold ${actionColor}">
                    ${_escAdmin(l.action)}
                </td>
                <td class="px-4 py-3 text-slate-300">
                    ${_escAdmin(l.actor)}
                </td>
                <td class="px-4 py-3 text-slate-300 truncate max-w-[150px]">
                    ${_escAdmin(l.target)}
                </td>
                <td class="px-4 py-3 text-slate-400 text-[11px] leading-relaxed">
                    ${_escAdmin(l.details)}
                </td>
            </tr>
        `;
    }).join("");
}

// -------------------------------------------------------------
// TAB 8: DATABASE, SECURITY & SETTINGS
// -------------------------------------------------------------
function renderDatabaseSettings() {
    const statusBadge = document.getElementById("db-status-badge");
    const inputUrl = document.getElementById("supabase-url-input");
    const inputKey = document.getElementById("supabase-key-input");
    const waInput = document.getElementById("admin-wa-link-input");

    const isConnected = SG_CONFIG.SUPABASE.isConfigured;

    if (statusBadge) {
        if (isConnected) {
            statusBadge.innerHTML = `<span class="px-3 py-1 rounded-full badge-active text-xs font-mono-sg font-bold">● CONNECTED (SUPABASE POSTGRESQL)</span>`;
        } else {
            statusBadge.innerHTML = `<span class="px-3 py-1 rounded-full badge-pending text-xs font-mono-sg font-bold">● LOCAL / HYBRID MODE (SUBIRI SUPABASE)</span>`;
        }
    }

    if (inputUrl && SG_CONFIG.SUPABASE.url) inputUrl.value = SG_CONFIG.SUPABASE.url;
    if (inputKey && SG_CONFIG.SUPABASE.anonKey) inputKey.value = SG_CONFIG.SUPABASE.anonKey;
    if (waInput && !waInput.matches(":focus")) {
        waInput.value = SG_CONFIG.privateWhatsAppInvite;
    }
}

window.saveWhatsAppLinkSetting = async function (e) {
    if (e) e.preventDefault();
    const waInput = document.getElementById("admin-wa-link-input");
    if (!waInput) return;
    const url = waInput.value.trim();
    if (!url.startsWith("https://chat.whatsapp.com/")) {
        showAdminToast("Tafadhali weka kiungo halali cha WhatsApp Group kinachoanza na https://chat.whatsapp.com/", "error");
        return;
    }
    try {
        await SGStore.updatePlatformSettingsAsync({ whatsapp_invite_url: url });
        showAdminToast("✓ Kiungo rasmi cha WhatsApp Group kimesasishwa kikamilifu!", "success");
    } catch (err) {
        showAdminToast("Hitilafu: " + (err.message || err), "error");
    }
};

window.changeAdminOwnPassword = async function (e) {
    if (e) e.preventDefault();
    const session = SGStore.getCurrentSession();
    if (!session) return;

    const cur = document.getElementById("admin-cp-current").value;
    const next = document.getElementById("admin-cp-new").value;
    const confirmNext = document.getElementById("admin-cp-confirm").value;

    if (next !== confirmNext) {
        showAdminToast("Nenosiri jipya na uthibitisho wake havifanani.", "error");
        return;
    }

    try {
        await SGStore.changePasswordAsync(cur, next);
        document.getElementById("form-admin-password").reset();
        showAdminToast("✓ Nenosiri la Super Administrator limebadilishwa kikamilifu!", "success");
        refreshAdminTelemetry();
    } catch (err) {
        showAdminToast("Hitilafu: " + (err.message || err), "error");
    }
};

window.exportCommunityDataJSON = function () {
    const session = SGStore.getCurrentSession();
    const exportedBy = session ? `${session.full_name} (${session.role})` : "William Gerishom William (Super Administrator)";
    const exportData = SGStore.getComplianceExportData(exportedBy);

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sillyger_community_backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showAdminToast("✓ Faili la Backup (PDPA 2022 JSON) limepakuliwa.", "success");
};

window.copySqlSchemaToClipboard = async function (btn) {
    const orig = btn ? btn.innerHTML : "";
    try {
        const res = await fetch("schema.sql", { cache: "no-store" });
        if (!res.ok) throw new Error("Imeshindikana kusoma faili la schema.sql");
        const sqlText = await res.text();
        await SGUtils.copyText(sqlText, "✓ schema.sql imenakiliwa! Sasa ipaste kwenye Supabase SQL Editor na ubofye Run.");
        if (btn) {
            btn.innerHTML = `<span>✓ SQL Imenakiliwa (Paste kwenye Supabase SQL Editor!)</span>`;
            setTimeout(() => { btn.innerHTML = orig; }, 3000);
        }
    } catch (err) {
        showAdminToast("Fungua faili la schema.sql moja kwa moja kwenye mradi wako kisha nakili maandishi yake yote (" + (err.message || err) + ").", "error");
    }
};

window.saveDatabaseCredentials = async function (e) {
    if (e) e.preventDefault();
    const url = (document.getElementById("supabase-url-input").value || "").trim();
    const key = (document.getElementById("supabase-key-input").value || "").trim();

    if (!url || !key) {
        showAdminToast("Tafadhali jaza Project URL na Public Anon Key zote mbili.", "error");
        return;
    }

    SG_CONFIG.SUPABASE.url = url;
    SG_CONFIG.SUPABASE.anonKey = key;

    try {
        const cleanUrl = url.replace(/\/+$/, "");
        const testRes = await fetch(`${cleanUrl}/rest/v1/rpc/sg_get_public_overview`, {
            method: "POST",
            headers: {
                apikey: key,
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: "{}"
        });
        if (!testRes.ok) {
            showAdminToast("⚠️ Imehifadhiwa, lakini hakikisha umepandisha faili la schema.sql kwenye SQL Editor kule Supabase.", "info");
        } else {
            await SGStore.syncWithSupabase(true);
            showAdminToast("✓ Hongera! Supabase PostgreSQL imeunganishwa na kulindwa kikamilifu!", "success");
        }
    } catch (err) {
        showAdminToast("Taarifa zimehifadhiwa, angalia muunganisho: " + (err.message || err), "info");
    }

    setTimeout(() => location.reload(), 900);
};

window.disconnectSupabaseLocal = async function () {
    const ok = await askAdminConfirm({
        title: "Ondoa Muunganisho wa Kifaa Hiki?",
        message: "Je, unataka kuondoa muunganisho maalum wa Supabase uliowekwa kwenye kivinjari hiki?",
        confirmText: "Ndiyo, Ondoa",
        danger: true
    });
    if (!ok) return;
    SG_CONFIG.SUPABASE.url = "";
    SG_CONFIG.SUPABASE.anonKey = "";
    location.reload();
};

window.resetCommunityDataToPristine = async function () {
    const confirmation = await askAdminPrompt({
        title: "Safisha Data za Majaribio (Kifaa Hiki)",
        message: "Hatua hii itafuta cache za majaribio kwenye kivinjari hiki na kusawazisha upya na Cloud.\n\nAndika neno 'FUTA' kuthibitisha:",
        placeholder: "Andika FUTA hapa...",
        initialValue: "",
        confirmText: "Safisha Sasa",
        danger: true,
        rows: 2
    });
    if (confirmation === null) return;
    if (confirmation.trim().toUpperCase() === "FUTA") {
        SGStore.resetToPristine();
        showAdminToast("✓ Cache ya kifaa hiki imesafishwa kikamilifu!", "success");
        setTimeout(() => location.reload(), 800);
    } else {
        showAdminToast("Uthibitisho haujafanana na neno 'FUTA'. Hakuna kilichofutwa.", "info");
    }
};

// =========================================================================
// TAB 9: SILLYGER TV LIVE BROADCAST STUDIO
// =========================================================================
function renderAdminTvStudio() {
    const broadcast = typeof SGStore !== "undefined" ? SGStore.getTvBroadcast() : {};
    const urlInput = document.getElementById("admin-tv-input-url");
    const titleInput = document.getElementById("admin-tv-input-title");
    const descInput = document.getElementById("admin-tv-input-desc");
    const isLiveInput = document.getElementById("admin-tv-input-islive");

    // Populate inputs if currently blank
    if (urlInput && !urlInput.value) {
        urlInput.value = broadcast.url || "";
    }
    if (titleInput && !titleInput.value) {
        titleInput.value = broadcast.title || "";
    }
    if (descInput && !descInput.value) {
        descInput.value = broadcast.desc || "";
    }
    if (isLiveInput && !isLiveInput.dataset.initialized) {
        isLiveInput.checked = true; // default: publishing = go live
        isLiveInput.dataset.initialized = "1";
    }

    renderAdminTvPreview(urlInput ? urlInput.value : broadcast.url, broadcast.is_live);
    renderAdminTvArchiveList();
}

function renderAdminTvPreview(urlOrId, isLive) {
    const previewSlot = document.getElementById("admin-tv-preview-slot");
    const previewStatus = document.getElementById("admin-tv-preview-status");
    if (!previewSlot) return;

    const videoId = typeof SGUtils !== "undefined" ? SGUtils.extractYouTubeId(urlOrId) : null;

    if (previewStatus) {
        if (isLive && videoId) {
            previewStatus.className = "px-2.5 py-0.5 rounded text-[10px] font-mono-sg font-bold bg-red-600 text-white animate-pulse";
            previewStatus.textContent = "🔴 ON AIR — LIVE";
        } else if (videoId) {
            previewStatus.className = "px-2.5 py-0.5 rounded text-[10px] font-mono-sg font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40";
            previewStatus.textContent = "⏸️ STANDBY (TAYARI)";
        } else {
            previewStatus.className = "px-2 py-0.5 rounded text-[10px] font-mono-sg font-bold bg-slate-800 text-slate-400";
            previewStatus.textContent = "OFFLINE";
        }
    }

    if (videoId) {
        // Do NOT rebuild the iframe if this exact video is already showing —
        // rebuilding on every sync tick is what made the preview stutter/restart.
        const existing = previewSlot.querySelector("iframe[data-video-id]");
        if (existing && existing.getAttribute("data-video-id") === videoId) return;

        previewSlot.innerHTML = `
            <iframe class="w-full h-full border-0 rounded-xl"
                    data-video-id="${videoId}"
                    src="https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&playsinline=1"
                    title="SILLYGER TV Preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="strict-origin-when-cross-origin"
                    allowfullscreen>
            </iframe>
        `;
    } else {
        previewSlot.innerHTML = `
            <div class="text-center p-5 space-y-2 text-slate-400">
                <div class="text-3xl">📺</div>
                <p class="text-xs">Weka kiungo cha YouTube kushoto ili kuona hakikisho hapa.</p>
            </div>
        `;
    }
}

window.handleAdminTvUrlChange = function (val) {
    const isLive = document.getElementById("admin-tv-input-islive")?.checked;
    renderAdminTvPreview(val, isLive);
};

window.handleAdminTvPublish = async function (e) {
    e.preventDefault();
    const url = document.getElementById("admin-tv-input-url")?.value;
    const title = document.getElementById("admin-tv-input-title")?.value;
    const desc = document.getElementById("admin-tv-input-desc")?.value;
    const isLive = document.getElementById("admin-tv-input-islive")?.checked;

    const btn = document.getElementById("btn-admin-tv-publish");
    const textEl = document.getElementById("btn-admin-tv-publish-text");
    const origText = textEl ? textEl.textContent : "Rusha Live Kwenye SILLYGER TV";

    if (btn) btn.disabled = true;
    if (textEl) textEl.textContent = "⏳ Inarusha Live...";

    try {
        await SGStore.setTvLiveStreamAsync({
            url,
            title,
            desc,
            isLive: !!isLive
        });

        // Confirm with Supabase that the broadcast really landed in the cloud
        if (SGStore.syncTvState) await SGStore.syncTvState();
        const confirmed = SGStore.getTvBroadcast();
        const wantedId = SGUtils.extractYouTubeId(url);
        if (isLive && wantedId && SGUtils.extractYouTubeId(confirmed.url) !== wantedId) {
            throw new Error("Video haijafika Supabase. Ondoka (logout) kisha uingie tena, halafu urushe upya.");
        }

        renderAdminTvStudio();
        showAdminToast(
            isLive
                ? "✓ Hongera! Video sasa iko LIVE kwenye SILLYGER TV kuanzia mwanzo hadi mwisho! 🔴"
                : "✓ SILLYGER TV imewekwa katika hali ya Standby.",
            "success"
        );
    } catch (err) {
        showAdminToast("Hitilafu: " + (err.message || err), "error");
    } finally {
        if (btn) btn.disabled = false;
        if (textEl) textEl.textContent = origText;
    }
};

window.handleAdminTvStopLive = async function () {
    try {
        const broadcast = SGStore.getTvBroadcast();
        await SGStore.setTvLiveStreamAsync({
            url: broadcast.url || "",
            title: broadcast.title || "SILLYGER TV",
            desc: broadcast.desc || "",
            isLive: false
        });
        const isLiveInput = document.getElementById("admin-tv-input-islive");
        if (isLiveInput) isLiveInput.checked = false;
        renderAdminTvStudio();
        showAdminToast("✓ Matangazo ya Live yamesimamishwa. SILLYGER TV iko Standby.", "info");
    } catch (err) {
        showAdminToast("Hitilafu: " + (err.message || err), "error");
    }
};

function renderAdminTvArchiveList() {
    const listEl = document.getElementById("admin-tv-archive-list");
    if (!listEl) return;

    const archive = typeof SGStore !== "undefined" ? SGStore.getTvArchive() : [];
    if (!archive || archive.length === 0) {
        listEl.innerHTML = `
            <div class="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-500 font-mono-sg text-center">
                Hakuna video zilizohifadhiwa kwenye maktaba bado.
            </div>
        `;
        return;
    }

    listEl.innerHTML = archive.map((item) => {
        const videoId = SGUtils.extractYouTubeId(item.youtube_url || item.video_id);
        const safeTitle = _escAdmin(item.title || "Kipindi");
        const safeUrl = _escAdmin(item.youtube_url || "");
        const safeId = _escAdmin(item.id);
        const dateStr = SGUtils.formatDateSw(item.created_at || new Date().toISOString());

        return `
            <div class="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-16 h-10 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 relative">
                        <img src="${SGUtils.getYouTubeThumbnail(videoId)}" alt="" class="w-full h-full object-cover">
                    </div>
                    <div class="min-w-0">
                        <h4 class="font-bold text-white truncate">${safeTitle}</h4>
                        <div class="flex items-center gap-2 text-[11px] font-mono-sg text-slate-400">
                            <span class="text-blue-400 truncate">${safeUrl}</span>
                            <span>•</span>
                            <span>${dateStr}</span>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                    <button type="button" data-url="${safeUrl}" data-title="${safeTitle}" onclick="quickPlayTvArchive(this.dataset.url, this.dataset.title)" class="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 font-bold text-xs flex items-center gap-1 transition">
                        <span>▶</span>
                        <span>Rusha Hii Live</span>
                    </button>
                    <button type="button" onclick="deleteAdminTvArchive('${safeId}')" class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-slate-800 text-xs transition" title="Futa">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

window.quickPlayTvArchive = function (url, title) {
    const urlInput = document.getElementById("admin-tv-input-url");
    const titleInput = document.getElementById("admin-tv-input-title");
    const isLiveInput = document.getElementById("admin-tv-input-islive");
    if (urlInput) urlInput.value = url;
    if (titleInput) titleInput.value = title;
    if (isLiveInput) isLiveInput.checked = true;
    renderAdminTvPreview(url, true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    showAdminToast("Taarifa zimepakiwa. Bofya 'Rusha Live Kwenye SILLYGER TV' kuthibitisha.", "info");
};

window.deleteAdminTvArchive = async function (id) {
    if (!confirm("Je, una uhakika unataka kufuta video hii kwenye maktaba?")) return;
    try {
        await SGStore.deleteTvArchiveItemAsync(id);
        renderAdminTvArchiveList();
        showAdminToast("✓ Video imefutwa kwenye maktaba.", "info");
    } catch (err) {
        showAdminToast("Hitilafu: " + (err.message || err), "error");
    }
};
