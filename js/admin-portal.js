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

document.addEventListener("DOMContentLoaded", () => {
    initAdminPortal();
});

function initAdminPortal() {
    const session = SGStore.getCurrentSession();
    const dashboardView = document.getElementById("admin-dashboard-view");

    const isAdmin = SGStore.isAdminUser(session);

    if (!isAdmin) {
        if (session) {
            window.location.href = `member-portal.html?alert=admin_required&user=${encodeURIComponent(session.username)}`;
        } else {
            window.location.href = "member-portal.html?alert=login_required";
        }
        return;
    }

    if (dashboardView) dashboardView.classList.remove("hidden");
    renderSuperAdminDashboard(session);
}

function rerenderCurrentAdminView() {
    refreshAdminTelemetry();
    if (currentActiveTab === "queue") renderPendingQueue();
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
}

// Cross-tab & Cloud real-time sync listeners
if (typeof window !== "undefined") {
    window.addEventListener("storage", () => rerenderCurrentAdminView());
    window.addEventListener("sg:synced", () => rerenderCurrentAdminView());

    try {
        if (typeof BroadcastChannel !== "undefined") {
            const bc = new BroadcastChannel("sg_platform_sync");
            bc.onmessage = () => rerenderCurrentAdminView();
        }
    } catch (e) {}

    // Periodic cloud & local queue poll (every 6 seconds)
    setInterval(() => {
        SGStore.syncWithSupabase();
        refreshAdminTelemetry();
        if (currentActiveTab === "queue") {
            renderPendingQueue();
        }
    }, 6000);
}

window.handleAdminLogout = function () {
    SGStore.logout();
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
    if (elInitials && adminUser.full_name) {
        elInitials.textContent = adminUser.full_name.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase() || "SG";
    }

    refreshAdminTelemetry();
    setupAdminTabs();
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

    if (elStatPending) elStatPending.textContent = pending;
    if (elStatActive) elStatActive.textContent = active;
    if (elStatTotal) elStatTotal.textContent = total;
    if (elStatFund) elStatFund.textContent = "TZS " + fundBalance.toLocaleString();
    if (elStatLogs) elStatLogs.textContent = logsCount;
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

    rerenderCurrentAdminView();
};

// -------------------------------------------------------------
// TAB 1: PENDING APPLICATION REVIEW QUEUE
// -------------------------------------------------------------
function renderPendingQueue() {
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
                    <button onclick="switchAdminTab('database')" class="shrink-0 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition whitespace-nowrap">
                        Unganisha Supabase Sasa &rarr;
                    </button>
                </div>
            `;
        }
    }

    const container = document.getElementById("pending-queue-tbody");
    if (!container) return;

    const members = SGStore.getMembers();
    const pending = members.filter(m => m.status === "PENDING");

    if (pending.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-slate-500 font-mono-sg text-xs">
                    ✓ Hakuna maombi mapya yanayosubiri ukaguzi kwa sasa (All applications reviewed).
                </td>
            </tr>
        `;
        return;
    }

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
                            onclick="approveApplicant('${safeId}')"
                            class="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-md shadow-emerald-500/20 flex items-center gap-1"
                            title="Idhinisha na kutoa namba ya SG-xxxxxx"
                        >
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            <span>Idhinisha (Approve)</span>
                        </button>
                        <button
                            onclick="openMemberDossier('${safeId}')"
                            class="px-2.5 py-1.5 rounded-xl border border-slate-700 hover:border-purple-400 text-slate-300 hover:text-white text-xs transition"
                            title="Kagua maelezo kamili"
                        >
                            Dossier
                        </button>
                        <button
                            onclick="rejectApplicant('${safeId}')"
                            class="px-2.5 py-1.5 rounded-xl border border-red-500/30 hover:border-red-500/80 hover:bg-red-950/40 text-red-400 text-xs transition"
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

window.approveApplicant = async function (applicantId) {
    const target = SGStore.findMemberById(applicantId);
    if (!target) return;

    const adminUser = SGStore.getCurrentSession();
    const adminActor = adminUser ? adminUser.username : "willyger";
    const nextId = SGStore.getNextMemberId();
    const confirmMsg = `Thibitisha kumuidhinisha ${target.full_name}?\n\nMfumo utatoa Unique Member ID: ${nextId}\nHadhi itabadilika kuwa ACTIVE na kiungo cha WhatsApp kitafunguliwa.`;

    if (confirm(confirmMsg)) {
        try {
            const approved = SGStore.approveMember(applicantId, adminActor);
            await SGStore.flushPendingWrites();
            const freshApproved = SGStore.findMemberById(applicantId) || approved;
            alert(`✓ ${freshApproved.full_name} ameidhinishwa rasmi!\nUnique Member ID: ${freshApproved.member_id}`);
            refreshAdminTelemetry();
            renderPendingQueue();
            renderMembersDirectory();
        } catch (e) {
            alert("Hitilafu: " + e.message);
        }
    }
};

window.rejectApplicant = async function (applicantId) {
    const target = SGStore.findMemberById(applicantId);
    if (!target) return;

    if (confirm(`Je, una uhakika unataka kukataa na kufuta maombi ya ${target.full_name}?\n\nRekodi hii itaondolewa kwenye mfumo.`)) {
        try {
            const adminUser = SGStore.getCurrentSession();
            const adminActor = adminUser ? adminUser.username : "willyger";
            SGStore.deleteMember(applicantId, adminActor);
            await SGStore.flushPendingWrites();
            alert(`✓ Maombi ya ${target.full_name} yameondolewa.`);
            refreshAdminTelemetry();
            renderPendingQueue();
            renderMembersDirectory();
        } catch (e) {
            alert("Hitilafu: " + e.message);
        }
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
        renderPendingQueue();
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

    document.getElementById("dossier-member-id-input").value = member.member_id || "";
    document.getElementById("dossier-role-select").value = member.role || "Member";
    document.getElementById("dossier-status-select").value = member.status || "PENDING";
    document.getElementById("dossier-new-password-input").value = "";
    document.getElementById("dossier-audit-reason").value = "";

    modal.classList.remove("hidden");
};

window.closeMemberDossier = function () {
    const modal = document.getElementById("modal-member-dossier");
    if (modal) modal.classList.add("hidden");
    inspectingMemberId = null;
};

window.saveDossierChanges = function (e) {
    if (e) e.preventDefault();
    if (!inspectingMemberId) return;

    const member = SGStore.findMemberById(inspectingMemberId);
    if (!member) return;

    const adminUser = SGStore.getCurrentSession();
    const adminActor = adminUser ? adminUser.username : "willyger";

    const newId = document.getElementById("dossier-member-id-input").value.trim();
    const newRole = document.getElementById("dossier-role-select").value;
    const newStatus = document.getElementById("dossier-status-select").value;
    const newPassword = document.getElementById("dossier-new-password-input").value;
    const reason = document.getElementById("dossier-audit-reason").value.trim() || "Super Administrator modification";

    try {
        if (newId && newId !== member.member_id) {
            SGStore.assignCustomMemberId(member.id, newId, reason, adminActor);
        }

        if (newStatus && newStatus !== member.status) {
            SGStore.updateMemberStatus(member.id, newStatus, reason, adminActor);
        }

        // Refresh member snapshot in case updateMemberStatus auto-upgraded Applicant -> Member
        const updatedAfterStatus = SGStore.findMemberById(member.id);
        if (newRole && updatedAfterStatus && newRole !== updatedAfterStatus.role) {
            SGStore.updateMemberRole(member.id, newRole, reason, adminActor);
        }

        if (newPassword && newPassword.trim().length > 0) {
            SGStore.adminResetPassword(member.id, newPassword, adminActor);
        }

        alert("✓ Taarifa za mwanachama zimesasishwa kikamilifu na kurekodiwa kwenye Audit Logs!");
        closeMemberDossier();
        refreshAdminTelemetry();
        renderMembersDirectory();
        renderPendingQueue();
    } catch (err) {
        alert("Hitilafu: " + err.message);
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

window.publishOfficialAnnouncement = function (e) {
    if (e) e.preventDefault();
    const title = document.getElementById("anc-title-input").value.trim();
    const content = document.getElementById("anc-content-input").value.trim();
    const priority = document.getElementById("anc-priority-input").value;

    if (!title || !content) {
        alert("Tafadhali weka kichwa cha habari na maudhui ya tangazo.");
        return;
    }

    const session = SGStore.getCurrentSession();
    const authorName = session ? `${session.full_name} (${session.role})` : "William Gerishom William (Super Admin)";

    SGStore.createAnnouncement({
        title,
        content,
        priority,
        author: authorName
    });

    alert("✓ Tangazo rasmi limechapishwa na linapatikana kwa wanachama wote!");
    document.getElementById("form-create-announcement").reset();
    renderAnnouncementsManager();
    refreshAdminTelemetry();
};

window.removeOfficialAnnouncement = function (ancId) {
    if (!confirm("Je, una uhakika unataka kuondoa tangazo hili?")) return;
    const session = SGStore.getCurrentSession();
    SGStore.deleteAnnouncement(ancId, session ? session.username : "willyger");
    renderAnnouncementsManager();
    refreshAdminTelemetry();
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

window.recordFundTransaction = function (e) {
    if (e) e.preventDefault();
    const type = document.getElementById("fund-type-select").value;
    const amount = document.getElementById("fund-amount-input").value;
    const category = document.getElementById("fund-category-input").value;
    const description = document.getElementById("fund-desc-input").value.trim();

    if (!amount || !description) {
        alert("Tafadhali jaza kiasi na maelezo ya muamala.");
        return;
    }

    try {
        const session = SGStore.getCurrentSession();
        SGStore.addFundTransaction({
            type,
            amount,
            category,
            description,
            actor: session ? session.username : "willyger"
        });

        alert("✓ Muamala wa SG Community Fund umerekodiwa rasmi kwenye leja!");
        document.getElementById("form-fund-transaction").reset();
        refreshAdminTelemetry();
        renderFundLedger();
    } catch (err) {
        alert("Hitilafu: " + err.message);
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

window.saveActiveSessionTitle = function () {
    const input = document.getElementById("active-session-title-input");
    if (!input) return;
    const title = input.value.trim();
    const session = SGStore.getCurrentSession();
    SGStore.updatePlatformSettings(
        { active_session_title: title },
        session ? session.username : "willyger"
    );
    alert(title ? `✓ Kipindi cha sasa kimewekwa: "${title}"` : "✓ Jina la kipindi kimefutwa.");
};

window.verifyAttendanceRecord = function (recordId) {
    const session = SGStore.getCurrentSession();
    const verifier = session ? `${session.full_name} (${session.role})` : "William Gerishom (Super Admin)";
    SGStore.verifyAttendance(recordId, verifier);
    renderAttendanceManager();
    refreshAdminTelemetry();
};

window.verifyAllPendingAttendance = function () {
    const session = SGStore.getCurrentSession();
    const verifier = session ? `${session.full_name} (${session.role})` : "William Gerishom (Super Admin)";
    const count = SGStore.verifyAllAttendance(verifier);
    if (count > 0) {
        alert(`✓ Vipindi ${count} vya mahudhurio vimethibitishwa vyote mara moja!`);
        renderAttendanceManager();
        refreshAdminTelemetry();
    } else {
        alert("Hakuna mahudhurio mapya yasiyothibitishwa.");
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

window.decideLeave = function (leaveId, decision) {
    const session = SGStore.getCurrentSession();
    const reviewer = session ? session.full_name : "William Gerishom";
    SGStore.reviewLeaveRequest(leaveId, decision, reviewer);
    renderLeavesAndTicketsManager();
    refreshAdminTelemetry();
};

window.replyToTicket = function (ticketId) {
    const ticket = SGStore.getSupportTickets().find(t => t.id === ticketId);
    if (!ticket) return;
    const reply = prompt(`Andika jibu rasmi kwa tiketi ya ${ticket.member_id} ("${ticket.subject}"):`, ticket.response || "");
    if (reply === null) return;
    if (!reply.trim()) {
        alert("Tafadhali andika jibu kabla ya kuhifadhi.");
        return;
    }
    const session = SGStore.getCurrentSession();
    SGStore.resolveSupportTicket(ticketId, reply.trim(), session ? session.full_name : "William Gerishom");
    renderLeavesAndTicketsManager();
    refreshAdminTelemetry();
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

window.saveWhatsAppLinkSetting = function (e) {
    if (e) e.preventDefault();
    const waInput = document.getElementById("admin-wa-link-input");
    if (!waInput) return;
    const url = waInput.value.trim();
    if (!url.startsWith("https://chat.whatsapp.com/")) {
        alert("Tafadhali weka kiungo halali cha WhatsApp Group kinachoanza na https://chat.whatsapp.com/");
        return;
    }
    const session = SGStore.getCurrentSession();
    SGStore.updatePlatformSettings({ whatsapp_invite_url: url }, session ? session.username : "willyger");
    alert("✓ Kiungo rasmi cha WhatsApp Group kimesasishwa kikamilifu!");
};

window.changeAdminOwnPassword = function (e) {
    if (e) e.preventDefault();
    const session = SGStore.getCurrentSession();
    if (!session) return;

    const cur = document.getElementById("admin-cp-current").value;
    const next = document.getElementById("admin-cp-new").value;
    const confirmNext = document.getElementById("admin-cp-confirm").value;

    if (next !== confirmNext) {
        alert("Nenosiri jipya na uthibitisho wake havifanani.");
        return;
    }

    try {
        SGStore.changePassword(session.id, cur, next);
        document.getElementById("form-admin-password").reset();
        alert("✓ Nenosiri la Super Administrator limebadilishwa kikamilifu!");
        refreshAdminTelemetry();
    } catch (err) {
        alert("Hitilafu: " + err.message);
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
};

window.copySqlSchemaToClipboard = async function (btn) {
    const orig = btn ? btn.innerHTML : "";
    try {
        const res = await fetch("schema.sql", { cache: "no-store" });
        if (!res.ok) throw new Error("Imeshindikana kusoma faili la schema.sql");
        const sqlText = await res.text();
        await navigator.clipboard.writeText(sqlText);
        if (btn) {
            btn.innerHTML = `<span>✓ SQL Imenakiliwa (Paste kwenye Supabase SQL Editor!)</span>`;
            setTimeout(() => { btn.innerHTML = orig; }, 3000);
        } else {
            alert("✓ schema.sql imenakiliwa! Sasa ipaste kwenye Supabase SQL Editor na ubofye Run.");
        }
    } catch (err) {
        alert("Fungua faili la schema.sql moja kwa moja kwenye mradi wako kisha nakili maandishi yake yote (" + err.message + ").");
    }
};

window.saveDatabaseCredentials = async function (e) {
    if (e) e.preventDefault();
    const url = (document.getElementById("supabase-url-input").value || "").trim();
    const key = (document.getElementById("supabase-key-input").value || "").trim();

    if (!url || !key) {
        alert("Tafadhali jaza Project URL na Public Anon Key zote mbili.");
        return;
    }

    SG_CONFIG.SUPABASE.url = url;
    SG_CONFIG.SUPABASE.anonKey = key;

    try {
        if (typeof supabase !== "undefined") {
            const client = supabase.createClient(url, key);
            const { error } = await client.from("members").select("id").limit(1);
            if (error) {
                alert(`⚠️ Imehifadhiwa, lakini Supabase imerudisha ujumbe: ${error.message}\n\nHakikisha umepandisha faili la schema.sql kwenye SQL Editor kule Supabase.`);
            } else {
                await SGStore.syncWithSupabase(true);
                alert("✓ Hongera! Supabase PostgreSQL imeunganishwa kikamilifu! Sasa data za wanachama, matangazo, leja ya fedha na mahudhurio zitasawazishwa mtandaoni.");
            }
        } else {
            alert("✓ Taarifa za Supabase zimehifadhiwa.");
        }
    } catch (err) {
        alert("Taarifa zimehifadhiwa, angalia muunganisho: " + err.message);
    }

    location.reload();
};

window.disconnectSupabaseLocal = function () {
    if (!confirm("Je, unataka kuondoa muunganisho wa Supabase kwenye kivinjari hiki na kubaki na LocalStorage?")) return;
    SG_CONFIG.SUPABASE.url = "";
    SG_CONFIG.SUPABASE.anonKey = "";
    location.reload();
};

window.resetCommunityDataToPristine = function () {
    const confirmation = prompt("ONYO: Hatua hii itafuta data zote za majaribio kwenye kifaa hiki na kurudisha mfumo katika hali safi ya uzinduzi (William Gerishom William pekee kama Super Admin).\n\nAndika neno 'FUTA' kuthibitisha:");
    if (confirmation && confirmation.trim().toUpperCase() === "FUTA") {
        SGStore.resetToPristine();
        alert("✓ Mfumo umesafishwa kikamilifu! Data zote za majaribio zimeondolewa.");
        location.reload();
    }
};
