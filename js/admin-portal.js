/**
 * SILLYGER (SG) Super Administrator Control Engine (Article 7 & Appendix B)
 * Full governance: Member Dossier Inspector, RBAC Role Assignment,
 * Status Management, Sequential ID Generator, Announcements Publisher,
 * SG Community Fund Ledger, and Immutable Audit Trail.
 */

document.addEventListener("DOMContentLoaded", () => {
    initAdminPortal();
});

let currentActiveTab = "queue";
let inspectingMemberId = null;

function initAdminPortal() {
    const session = SGStore.getCurrentSession();
    const dashboardView = document.getElementById("admin-dashboard-view");

    // Check Super Administrator or Administrator privileges (Article 7.4)
    const isAdmin = session && (
        session.role === "Super Administrator" || 
        session.role === "Administrator" || 
        session.role === "Membership Administrator" ||
        session.email === "wshavu@gmail.com" ||
        session.username === "willyger"
    );

    if (!isAdmin) {
        // Restrict & bounce unauthorized visitors to unified login page
        window.location.href = "member-portal.html";
        return;
    }

    if (dashboardView) dashboardView.classList.remove("hidden");
    renderSuperAdminDashboard(session);
}

window.handleAdminLogout = function() {
    SGStore.logout();
    window.location.href = "member-portal.html";
};

// -------------------------------------------------------------
// EXECUTIVE DASHBOARD RENDERING
// -------------------------------------------------------------
function renderSuperAdminDashboard(adminUser) {
    // 1. Executive Identity Banner
    const elAdminName = document.getElementById("admin-user-name");
    const elAdminRole = document.getElementById("admin-user-role");
    const elAdminId = document.getElementById("admin-user-id");
    if (elAdminName) elAdminName.textContent = adminUser.full_name;
    if (elAdminRole) elAdminRole.textContent = adminUser.role;
    if (elAdminId) elAdminId.textContent = adminUser.member_id || "SG-000001";

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

window.switchAdminTab = function(tabName) {
    currentActiveTab = tabName;

    document.querySelectorAll(".admin-nav-tab").forEach(btn => {
        if (btn.getAttribute("data-tab") === tabName) {
            btn.className = "admin-nav-tab px-4 py-2.5 rounded-xl bg-purple-600/20 border border-purple-500/50 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-purple-500/10";
        } else {
            btn.className = "admin-nav-tab px-4 py-2.5 rounded-xl border border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60 font-semibold text-xs flex items-center gap-2 transition";
        }
    });

    document.querySelectorAll(".admin-tab-pane").forEach(pane => {
        pane.classList.add("hidden");
    });

    const targetPane = document.getElementById(`tab-pane-${tabName}`);
    if (targetPane) {
        targetPane.classList.remove("hidden");
    }

    if (tabName === "queue") renderPendingQueue();
    else if (tabName === "members") renderMembersDirectory();
    else if (tabName === "announcements") renderAnnouncementsManager();
    else if (tabName === "fund") renderFundLedger();
    else if (tabName === "attendance") renderAttendanceManager();
    else if (tabName === "leaves") renderLeavesManager();
    else if (tabName === "audit") renderAuditLogsViewer();
    else if (tabName === "database") renderDatabaseSettings();
};

// -------------------------------------------------------------
// TAB 1: PENDING APPLICATION REVIEW QUEUE
// -------------------------------------------------------------
function renderPendingQueue() {
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

    container.innerHTML = pending.map(p => `
        <tr class="border-b border-slate-800/60 hover:bg-slate-900/40 transition">
            <td class="px-4 py-4">
                <span class="font-bold text-white block">${p.full_name}</span>
                <span class="text-xs font-mono-sg text-cyan-400">@${p.username}</span>
            </td>
            <td class="px-4 py-4 text-xs font-mono-sg text-slate-300">
                <a href="https://wa.me/${p.phone.replace(/[^0-9]/g, '')}" target="_blank" class="text-emerald-400 hover:underline flex items-center gap-1 font-bold">
                    <span>${p.phone}</span>
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </a>
                <span class="text-[11px] text-slate-500">${p.email}</span>
            </td>
            <td class="px-4 py-4 text-xs text-slate-300">
                <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono-sg block mb-1">
                    ${p.track}
                </span>
                <span class="text-[10px] text-slate-500">Uzoefu: ${p.experience || 'Beginner'}</span>
            </td>
            <td class="px-4 py-4 text-xs text-slate-400 max-w-xs truncate" title="${p.motivation || ''}">
                ${p.motivation ? p.motivation : '<em class="text-slate-600">Bila maelezo</em>'}
            </td>
            <td class="px-4 py-4 text-xs font-mono-sg text-slate-400">
                ${new Date(p.created_at).toLocaleDateString("sw-TZ")}
            </td>
            <td class="px-4 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button 
                        onclick="approveApplicant('${p.id}', '${p.full_name}')"
                        class="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-md shadow-emerald-500/20 flex items-center gap-1"
                        title="Idhinisha na kutoa namba ya SG-xxxxxx"
                    >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        <span>Idhinisha (Approve)</span>
                    </button>
                    <button 
                        onclick="openMemberDossier('${p.id}')"
                        class="px-2.5 py-1.5 rounded-xl border border-slate-700 hover:border-purple-400 text-slate-300 hover:text-white text-xs transition"
                        title="Kagua maelezo kamili"
                    >
                        Dossier
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.approveApplicant = function(applicantId, applicantName) {
    const adminUser = SGStore.getCurrentSession();
    const adminActor = adminUser ? adminUser.username : "William Gerishom";

    const nextId = SGStore.getNextMemberId();
    const confirmMsg = `Thibitisha kumuidhinisha ${applicantName}?\n\nMfumo utatoa Unique Member ID: ${nextId}\nHadhi itabadilika kuwa ACTIVE na kiungo cha WhatsApp kitafunguliwa.`;

    if (confirm(confirmMsg)) {
        try {
            const approved = SGStore.approveMember(applicantId, adminActor);
            alert(`✓ ${approved.full_name} ameidhinishwa rasmi!\nUnique Member ID: ${approved.member_id}`);
            refreshAdminTelemetry();
            renderPendingQueue();
        } catch (e) {
            alert("Hitilafu: " + e.message);
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
            m.full_name.toLowerCase().includes(query) ||
            m.username.toLowerCase().includes(query) ||
            (m.member_id && m.member_id.toLowerCase().includes(query)) ||
            (m.phone && m.phone.includes(query)) ||
            (m.role && m.role.toLowerCase().includes(query))
        );
    }

    container.innerHTML = members.map(m => {
        const isActive = m.status === "ACTIVE";
        const isPending = m.status === "PENDING";
        const badgeClass = isActive ? "badge-active" : (isPending ? "badge-pending" : "badge-suspended");

        return `
            <tr class="border-b border-slate-800/60 hover:bg-slate-900/40 transition text-xs">
                <td class="px-4 py-3 font-mono-sg font-bold">
                    ${m.member_id ? `<span class="text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded">${m.member_id}</span>` : '<span class="text-slate-500 font-mono-sg">NULL</span>'}
                </td>
                <td class="px-4 py-3">
                    <span class="font-bold text-white block">${m.full_name}</span>
                    <span class="text-slate-400 font-mono-sg text-[11px]">@${m.username}</span>
                </td>
                <td class="px-4 py-3 font-mono-sg text-slate-300">
                    <a href="https://wa.me/${m.phone.replace(/[^0-9]/g, '')}" target="_blank" class="hover:text-emerald-400 hover:underline">
                        ${m.phone}
                    </a>
                </td>
                <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/50 text-purple-300 font-mono-sg text-[10px] font-bold">
                        ${m.role || 'Member'}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded uppercase font-bold text-[10px] font-mono-sg ${badgeClass}">
                        ${m.status}
                    </span>
                </td>
                <td class="px-4 py-3 text-right">
                    <button 
                        onclick="openMemberDossier('${m.id}')"
                        class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-950/60 border border-slate-700 hover:border-purple-500/50 text-cyan-300 hover:text-white font-bold text-xs transition"
                    >
                        ⚙️ Dhibiti (Inspect)
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// -------------------------------------------------------------
// DOSSIER INSPECTOR MODAL (SUPER ADMIN OVERSIGHT)
// -------------------------------------------------------------
window.openMemberDossier = function(memberId) {
    inspectingMemberId = memberId;
    const member = SGStore.findMemberById(memberId);
    if (!member) return;

    const modal = document.getElementById("modal-member-dossier");
    if (!modal) return;

    document.getElementById("dossier-name").textContent = member.full_name;
    document.getElementById("dossier-username").textContent = "@" + member.username;
    document.getElementById("dossier-email").textContent = member.email;
    document.getElementById("dossier-phone").textContent = member.phone;
    document.getElementById("dossier-whatsapp-link").href = `https://wa.me/${member.phone.replace(/[^0-9]/g, '')}`;
    document.getElementById("dossier-track").textContent = member.track;
    document.getElementById("dossier-experience").textContent = member.experience || 'Beginner';
    document.getElementById("dossier-motivation").textContent = member.motivation || 'Bila maelezo ya ziada';
    document.getElementById("dossier-joined").textContent = new Date(member.created_at).toLocaleString("sw-TZ");

    document.getElementById("dossier-member-id-input").value = member.member_id || '';
    document.getElementById("dossier-role-select").value = member.role || 'Member';
    document.getElementById("dossier-status-select").value = member.status || 'PENDING';

    modal.classList.remove("hidden");
};

window.closeMemberDossier = function() {
    const modal = document.getElementById("modal-member-dossier");
    if (modal) modal.classList.add("hidden");
    inspectingMemberId = null;
};

window.saveDossierChanges = function(e) {
    if (e) e.preventDefault();
    if (!inspectingMemberId) return;

    const member = SGStore.findMemberById(inspectingMemberId);
    if (!member) return;

    const adminUser = SGStore.getCurrentSession();
    const adminActor = adminUser ? adminUser.username : "William Gerishom";

    const newId = document.getElementById("dossier-member-id-input").value.trim();
    const newRole = document.getElementById("dossier-role-select").value;
    const newStatus = document.getElementById("dossier-status-select").value;
    const reason = document.getElementById("dossier-audit-reason").value.trim() || "Super Administrator modification";

    try {
        // 1. Check ID change
        if (newId && newId !== member.member_id) {
            SGStore.assignCustomMemberId(member.id, newId, reason, adminActor);
        }

        // 2. Check Role change
        if (newRole && newRole !== member.role) {
            SGStore.updateMemberRole(member.id, newRole, reason, adminActor);
        }

        // 3. Check Status change
        if (newStatus && newStatus !== member.status) {
            SGStore.updateMemberStatus(member.id, newStatus, reason, adminActor);
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
        <div class="sg-glass p-5 rounded-2xl border ${a.priority === 'HIGH' ? 'border-amber-500/40 bg-amber-950/10' : 'border-slate-800'} space-y-2">
            <div class="flex items-center justify-between">
                <span class="text-xs font-mono-sg font-bold uppercase tracking-wider ${a.priority === 'HIGH' ? 'text-amber-400' : 'text-cyan-400'}">
                    ● ${a.priority} PRIORITY ANNOUNCEMENT
                </span>
                <span class="text-[11px] text-slate-500 font-mono-sg">
                    ${new Date(a.created_at).toLocaleDateString("sw-TZ")}
                </span>
            </div>
            <h3 class="text-base font-bold text-white">${a.title}</h3>
            <p class="text-xs md:text-sm text-slate-300 leading-relaxed">${a.content}</p>
            <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono-sg text-slate-500">
                <span>Mwandishi: <strong class="text-slate-300">${a.author}</strong></span>
                <span>Inaonekana kwenye Member Portal</span>
            </div>
        </div>
    `).join('');
}

window.publishOfficialAnnouncement = function(e) {
    if (e) e.preventDefault();
    const title = document.getElementById("anc-title-input").value.trim();
    const content = document.getElementById("anc-content-input").value.trim();
    const priority = document.getElementById("anc-priority-input").value;

    if (!title || !content) {
        alert("Tafadhali weka kichwa cha habari na maudhui ya tangazo.");
        return;
    }

    SGStore.createAnnouncement({
        title,
        content,
        priority,
        author: "William Gerishom William (Super Admin)"
    });

    alert("✓ Tangazo rasmi limechapishwa na linapatikana kwa wanachama wote!");
    document.getElementById("form-create-announcement").reset();
    renderAnnouncementsManager();
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
            <td class="px-4 py-3 text-slate-400">${tx.date}</td>
            <td class="px-4 py-3 font-bold">
                ${tx.type === 'INCOME' ? 
                    '<span class="text-emerald-400 font-bold">+ MAPATO (INCOME)</span>' : 
                    '<span class="text-amber-400 font-bold">- MATUMIZI (EXPENSE)</span>'}
            </td>
            <td class="px-4 py-3 font-bold text-white">TZS ${tx.amount.toLocaleString()}</td>
            <td class="px-4 py-3 text-cyan-400">${tx.category}</td>
            <td class="px-4 py-3 text-slate-300 max-w-xs truncate" title="${tx.description}">${tx.description}</td>
        </tr>
    `).join('');
}

window.recordFundTransaction = function(e) {
    if (e) e.preventDefault();
    const type = document.getElementById("fund-type-select").value;
    const amount = document.getElementById("fund-amount-input").value;
    const category = document.getElementById("fund-category-input").value;
    const description = document.getElementById("fund-desc-input").value.trim();

    if (!amount || !description) {
        alert("Tafadhali jaza kiasi na maelezo ya muamala.");
        return;
    }

    SGStore.addFundTransaction({
        type,
        amount,
        category,
        description,
        actor: "William Gerishom"
    });

    alert("✓ Muamala wa SG Community Fund umerekodiwa rasmi kwenye leja!");
    document.getElementById("form-fund-transaction").reset();
    refreshAdminTelemetry();
    renderFundLedger();
};

// -------------------------------------------------------------
// TAB 5: ATTENDANCE VERIFICATIONS (Article 9)
// -------------------------------------------------------------
function renderAttendanceManager() {
    const container = document.getElementById("attendance-manager-tbody");
    if (!container) return;

    const list = SGStore.getAttendanceRecords();

    if (list.length === 0) {
        container.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500 font-mono-sg text-xs">Hakuna kumbukumbu za mahudhurio.</td></tr>`;
        return;
    }

    container.innerHTML = list.map(a => `
        <tr class="border-b border-slate-800/60 hover:bg-slate-900/40 transition text-xs">
            <td class="px-4 py-3 font-mono-sg text-cyan-400 font-bold">${a.member_id}</td>
            <td class="px-4 py-3 text-white font-semibold">${a.session_title}</td>
            <td class="px-4 py-3 font-mono-sg text-slate-400">${a.date}</td>
            <td class="px-4 py-3">
                ${a.is_verified ? `
                    <span class="px-2 py-0.5 rounded badge-active font-mono-sg text-[10px] font-bold">
                        ✓ VERIFIED (${a.verified_by || 'Admin'})
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
                        onclick="verifyAttendanceRecord('${a.id}')"
                        class="px-3 py-1 rounded bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition"
                    >
                        Thibitisha
                    </button>
                ` : '<span class="text-slate-600 text-[11px] font-mono-sg">Imethibitishwa</span>'}
            </td>
        </tr>
    `).join('');
}

window.verifyAttendanceRecord = function(recordId) {
    const list = SGStore.getAttendanceRecords();
    const idx = list.findIndex(r => r.id === recordId);
    if (idx !== -1) {
        list[idx].is_verified = true;
        list[idx].verified_by = "William Gerishom (Super Admin)";
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));
        SGStore.addAuditLog({
            action: "ATTENDANCE_VERIFIED",
            actor: "willyger",
            target: list[idx].member_id,
            details: `Attendance verified for ${list[idx].session_title}.`
        });
        renderAttendanceManager();
    }
};

window.verifyAllPendingAttendance = function() {
    const list = SGStore.getAttendanceRecords();
    let count = 0;
    list.forEach(a => {
        if (!a.is_verified) {
            a.is_verified = true;
            a.verified_by = "William Gerishom (Super Admin)";
            count++;
        }
    });
    if (count > 0) {
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));
        SGStore.addAuditLog({
            action: "MASS_ATTENDANCE_VERIFIED",
            actor: "willyger",
            target: "All Sessions",
            details: `Super Administrator mass-verified ${count} attendance check-ins.`
        });
        alert(`✓ Vipindi ${count} vya mahudhurio vimethibitishwa vyote mara moja!`);
        renderAttendanceManager();
    } else {
        alert("Hakuna mahudhurio mapya yasiyothibitishwa.");
    }
};

// -------------------------------------------------------------
// TAB 6: LEAVE REQUESTS (Article 10)
// -------------------------------------------------------------
function renderLeavesManager() {
    const container = document.getElementById("leaves-manager-tbody");
    if (!container) return;

    const list = SGStore.getLeaveRequests();

    if (list.length === 0) {
        container.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500 font-mono-sg text-xs">Hakuna maombi ya ruhusa yaliyowasilishwa.</td></tr>`;
        return;
    }

    container.innerHTML = list.map(l => `
        <tr class="border-b border-slate-800/60 hover:bg-slate-900/40 transition text-xs">
            <td class="px-4 py-3 font-mono-sg text-cyan-400 font-bold">${l.member_id}</td>
            <td class="px-4 py-3 text-slate-200">
                <span class="font-bold block">${l.category}</span>
                <span class="text-slate-400 text-[11px]">${l.duration}</span>
            </td>
            <td class="px-4 py-3 text-slate-300 max-w-xs">${l.reason}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded ${l.status === 'APPROVED' ? 'badge-active' : 'badge-pending'} font-mono-sg text-[10px] font-bold">
                    ${l.status}
                </span>
            </td>
            <td class="px-4 py-3 text-right">
                ${l.status !== 'APPROVED' ? `
                    <button onclick="approveLeave('${l.id}')" class="px-3 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition">
                        Kubali (Approve)
                    </button>
                ` : '<span class="text-slate-500 text-[11px]">Tayari</span>'}
            </td>
        </tr>
    `).join('');
}

window.approveLeave = function(leaveId) {
    const list = SGStore.getLeaveRequests();
    const idx = list.findIndex(l => l.id === leaveId);
    if (idx !== -1) {
        list[idx].status = "APPROVED";
        list[idx].reviewed_by = "William Gerishom";
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(list));
        SGStore.addAuditLog({
            action: "LEAVE_APPROVED",
            actor: "willyger",
            target: list[idx].member_id,
            details: `Leave approved for category: ${list[idx].category}.`
        });
        renderLeavesManager();
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
        logs = logs.filter(l => l.action.includes(filterType));
    }

    if (logs.length === 0) {
        container.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500 font-mono-sg text-xs">Hakuna kumbukumbu za ukaguzi zilizopatikana.</td></tr>`;
        return;
    }

    container.innerHTML = logs.map(l => {
        let actionColor = "text-cyan-400";
        if (l.action.includes("APPROVED")) actionColor = "text-emerald-400";
        else if (l.action.includes("SUSPEND") || l.action.includes("HOLD")) actionColor = "text-amber-400";
        else if (l.action.includes("ROLE") || l.action.includes("OVERRIDE")) actionColor = "text-purple-400";
        else if (l.action.includes("FUND")) actionColor = "text-teal-400";

        return `
            <tr class="border-b border-slate-800/60 hover:bg-slate-900/40 transition text-xs font-mono-sg">
                <td class="px-4 py-3 text-slate-400 text-[11px] whitespace-nowrap">
                    ${new Date(l.timestamp).toLocaleString("sw-TZ")}
                </td>
                <td class="px-4 py-3 font-bold ${actionColor}">
                    ${l.action}
                </td>
                <td class="px-4 py-3 text-slate-300">
                    ${l.actor}
                </td>
                <td class="px-4 py-3 text-slate-300 truncate max-w-[150px]">
                    ${l.target}
                </td>
                <td class="px-4 py-3 text-slate-400 text-[11px] leading-relaxed">
                    ${l.details}
                </td>
            </tr>
        `;
    }).join('');
}

// -------------------------------------------------------------
// TAB 8: DATABASE & COMPLIANCE DATA EXPORT
// -------------------------------------------------------------
function renderDatabaseSettings() {
    const statusBadge = document.getElementById("db-status-badge");
    const inputUrl = document.getElementById("supabase-url-input");
    const inputKey = document.getElementById("supabase-key-input");

    const isConnected = !!SG_CONFIG.SUPABASE.url && !!SG_CONFIG.SUPABASE.anonKey;

    if (statusBadge) {
        if (isConnected) {
            statusBadge.innerHTML = `<span class="px-3 py-1 rounded-full badge-active text-xs font-mono-sg font-bold">● CONNECTED (SUPABASE POSTGRESQL)</span>`;
        } else {
            statusBadge.innerHTML = `<span class="px-3 py-1 rounded-full badge-pending text-xs font-mono-sg font-bold">● LOCAL / HYBRID STORAGE</span>`;
        }
    }

    if (inputUrl && SG_CONFIG.SUPABASE.url) inputUrl.value = SG_CONFIG.SUPABASE.url;
    if (inputKey && SG_CONFIG.SUPABASE.anonKey) inputKey.value = SG_CONFIG.SUPABASE.anonKey;
}

window.exportCommunityDataJSON = function() {
    const exportData = {
        exported_at: new Date().toISOString(),
        exported_by: "William Gerishom William (Super Administrator)",
        compliance: "Tanzania Personal Data Protection Act, 2022 (PDPA - Article 15)",
        members: SGStore.getMembers(),
        audit_logs: SGStore.getAuditLogs(),
        attendance: SGStore.getAttendanceRecords(),
        fund_ledger: SGStore.getFundLedger(),
        announcements: SGStore.getAnnouncements()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sillyger_community_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};
