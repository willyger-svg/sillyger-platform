/**
 * SILLYGER (SG) Administration Portal Controller (Phase 3 & Production Engine)
 * Manages RBAC, Member Approval Queue, Sequential SG-ID Generation,
 * Attendance Verifications, Leave Management, and Audit Logs Viewer.
 */

document.addEventListener("DOMContentLoaded", () => {
    initAdminPortal();
});

let currentActiveTab = "queue";

function initAdminPortal() {
    const session = SGStore.getCurrentSession();
    const loginView = document.getElementById("admin-login-view");
    const dashboardView = document.getElementById("admin-dashboard-view");

    // Check if logged in user has administrative privileges (Article 7.4)
    const isAdmin = session && (
        session.role === "Super Administrator" || 
        session.role === "Administrator" || 
        session.role === "Membership Administrator" ||
        session.email === "admin@sillyger.org" ||
        session.username === "willyger"
    );

    if (!isAdmin) {
        if (loginView) loginView.classList.remove("hidden");
        if (dashboardView) dashboardView.classList.add("hidden");
        setupAdminLoginForm();
    } else {
        if (loginView) loginView.classList.add("hidden");
        if (dashboardView) dashboardView.classList.remove("hidden");
        renderAdminDashboard(session);
    }
}

// -------------------------------------------------------------
// ADMIN LOGIN SETUP
// -------------------------------------------------------------
function setupAdminLoginForm() {
    const form = document.getElementById("admin-login-form");
    const errorAlert = document.getElementById("admin-login-error");

    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            errorAlert.classList.add("hidden");

            const credential = document.getElementById("admin-credential").value.trim();
            const password = document.getElementById("admin-password").value;

            try {
                const member = SGStore.findMemberByCredential(credential);
                if (!member) {
                    throw new Error("Akaunti ya msimamizi haikupatikana.");
                }

                // Check admin password
                if (member.password_hash && password !== member.password_hash) {
                    throw new Error("Nenosiri si sahihi.");
                }

                // Check administrative role (Article 7.4)
                if (member.role !== "Super Administrator" && member.role !== "Administrator" && member.username !== "willyger") {
                    throw new Error("Akaunti hii haina mamlaka ya kiutawala (Administrative Privileges).");
                }

                // Log audit
                SGStore.addAuditLog({
                    action: "ADMIN_LOGIN",
                    actor: member.username,
                    target: "Administration Portal",
                    details: `Administrator session started for ${member.full_name} (${member.role}).`
                });

                SGStore.setCurrentSession(member);
                initAdminPortal();

            } catch (err) {
                errorAlert.textContent = err.message || "Hitilafu imetokea.";
                errorAlert.classList.remove("hidden");
            }
        };
    }
}

window.handleAdminLogout = function() {
    SGStore.logout();
    initAdminPortal();
};

// -------------------------------------------------------------
// ADMIN DASHBOARD RENDERING
// -------------------------------------------------------------
function renderAdminDashboard(adminUser) {
    // 1. Render Admin Profile & Stats
    const elAdminName = document.getElementById("admin-user-name");
    const elAdminRole = document.getElementById("admin-user-role");
    if (elAdminName) elAdminName.textContent = adminUser.full_name;
    if (elAdminRole) elAdminRole.textContent = adminUser.role;

    refreshAdminStats();

    // 2. Setup Tab Switching
    setupAdminTabs();

    // 3. Render Initial Tab Content
    switchAdminTab(currentActiveTab);
}

function refreshAdminStats() {
    const members = SGStore.getMembers();
    const pending = members.filter(m => m.status === "PENDING").length;
    const active = members.filter(m => m.status === "ACTIVE").length;
    const total = members.length;
    const logsCount = SGStore.getAuditLogs().length;

    const elStatPending = document.getElementById("admin-stat-pending");
    const elStatActive = document.getElementById("admin-stat-active");
    const elStatTotal = document.getElementById("admin-stat-total");
    const elStatLogs = document.getElementById("admin-stat-logs");

    if (elStatPending) elStatPending.textContent = pending;
    if (elStatActive) elStatActive.textContent = active;
    if (elStatTotal) elStatTotal.textContent = total;
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

    // Highlight active button
    document.querySelectorAll(".admin-nav-tab").forEach(btn => {
        if (btn.getAttribute("data-tab") === tabName) {
            btn.className = "admin-nav-tab px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center gap-2 transition";
        } else {
            btn.className = "admin-nav-tab px-4 py-2 rounded-xl border border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60 font-semibold text-xs flex items-center gap-2 transition";
        }
    });

    // Hide all tab panes
    document.querySelectorAll(".admin-tab-pane").forEach(pane => {
        pane.classList.add("hidden");
    });

    // Show target pane
    const targetPane = document.getElementById(`tab-pane-${tabName}`);
    if (targetPane) {
        targetPane.classList.remove("hidden");
    }

    // Render corresponding data
    if (tabName === "queue") renderPendingQueue();
    else if (tabName === "members") renderMembersDirectory();
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
                    ✓ Hakuna maombi yanayosubiri ukaguzi kwa sasa (All applications reviewed).
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
                <span class="block">${p.phone}</span>
                <span class="text-[11px] text-slate-500">${p.email}</span>
            </td>
            <td class="px-4 py-4 text-xs text-slate-300">
                <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono-sg block mb-1">
                    ${p.track}
                </span>
                <span class="text-[10px] text-slate-500">Uzoefu: ${p.experience || 'Beginner'}</span>
            </td>
            <td class="px-4 py-4 text-xs text-slate-400 max-w-xs truncate" title="${p.motivation || ''}">
                ${p.motivation ? p.motivation.substring(0, 50) + '...' : '<em class="text-slate-600">Bila maelezo</em>'}
            </td>
            <td class="px-4 py-4 text-xs font-mono-sg text-slate-400">
                ${new Date(p.created_at).toLocaleDateString("sw-TZ")}
            </td>
            <td class="px-4 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button 
                        onclick="approveApplicant('${p.id}', '${p.full_name}')"
                        class="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-sm flex items-center gap-1"
                        title="Idhinisha na kutoa namba ya SG-xxxxxx"
                    >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        <span>Idhinisha (Approve)</span>
                    </button>
                    <button 
                        onclick="holdApplicant('${p.id}')"
                        class="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-amber-500 text-slate-400 hover:text-amber-400 text-xs transition"
                        title="Weka kwenye mapitio zaidi"
                    >
                        Hold
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.approveApplicant = function(applicantId, applicantName) {
    const adminUser = SGStore.getCurrentSession();
    const adminActor = adminUser ? adminUser.username : "SUPER_ADMIN";

    const nextId = SGStore.getNextMemberId();
    const confirmMsg = `Thibitisha kumuidhinisha ${applicantName}?\n\nMfumo utatoa namba ya kipekee: ${nextId}\nHadhi itabadilika kuwa ACTIVE na kiungo cha WhatsApp kitafunguliwa.`;

    if (confirm(confirmMsg)) {
        try {
            const approved = SGStore.approveMember(applicantId, adminActor);
            alert(`✓ ${approved.full_name} ameidhinishwa kikamilifu!\nNamba ya Mwanachama: ${approved.member_id}`);
            refreshAdminStats();
            renderPendingQueue();
        } catch (e) {
            alert("Hitilafu: " + e.message);
        }
    }
};

window.holdApplicant = function(applicantId) {
    const reason = prompt("Weka sababu ya kuweka maombi haya ON_HOLD:");
    if (reason) {
        SGStore.updateMemberStatus(applicantId, "ON_HOLD", reason, "ADMIN");
        alert("Maombi yamewekwa ON_HOLD.");
        refreshAdminStats();
        renderPendingQueue();
    }
};

// -------------------------------------------------------------
// TAB 2: MEMBERS DIRECTORY
// -------------------------------------------------------------
function renderMembersDirectory(searchFilter = "") {
    const container = document.getElementById("members-directory-tbody");
    if (!container) return;

    let members = SGStore.getMembers();
    const query = searchFilter.toLowerCase().trim();

    if (query) {
        members = members.filter(m => 
            m.full_name.toLowerCase().includes(query) ||
            m.username.toLowerCase().includes(query) ||
            (m.member_id && m.member_id.toLowerCase().includes(query)) ||
            (m.phone && m.phone.includes(query))
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
                    ${m.phone}
                </td>
                <td class="px-4 py-3 text-slate-300 truncate max-w-[180px]">
                    ${m.track}
                </td>
                <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded uppercase font-bold text-[10px] font-mono-sg ${badgeClass}">
                        ${m.status}
                    </span>
                </td>
                <td class="px-4 py-3 text-right">
                    <select 
                        onchange="changeMemberStatusDirectly('${m.id}', this.value)"
                        class="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] rounded px-2 py-1"
                    >
                        <option value="" disabled selected>Badili Hali...</option>
                        <option value="ACTIVE" ${m.status === 'ACTIVE' ? 'disabled' : ''}>Weka ACTIVE</option>
                        <option value="ON_HOLD" ${m.status === 'ON_HOLD' ? 'disabled' : ''}>Weka ON_HOLD</option>
                        <option value="SUSPENDED" ${m.status === 'SUSPENDED' ? 'disabled' : ''}>Weka SUSPENDED</option>
                    </select>
                </td>
            </tr>
        `;
    }).join('');
}

window.changeMemberStatusDirectly = function(memberId, newStatus) {
    if (!newStatus) return;
    const reason = prompt(`Weka sababu ya kubadilisha hadhi kuwa ${newStatus}:`, "Administrative review");
    if (reason !== null) {
        SGStore.updateMemberStatus(memberId, newStatus, reason, "SUPER_ADMIN");
        refreshAdminStats();
        renderMembersDirectory();
    }
};

// -------------------------------------------------------------
// TAB 3: ATTENDANCE MANAGER (VERIFICATIONS)
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
                        class="px-2.5 py-1 rounded bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition"
                    >
                        Thibitisha (Verify)
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
        list[idx].verified_by = "willyger (Super Admin)";
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

// -------------------------------------------------------------
// TAB 4: LEAVE REQUESTS
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
                    <button onclick="approveLeave('${l.id}')" class="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition">
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
        list[idx].reviewed_by = "willyger";
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
// TAB 5: IMMUTABLE AUDIT LOGS VIEWER (Article 7.7)
// -------------------------------------------------------------
function renderAuditLogsViewer() {
    const container = document.getElementById("audit-logs-tbody");
    if (!container) return;

    const logs = SGStore.getAuditLogs();

    if (logs.length === 0) {
        container.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500 font-mono-sg text-xs">Hakuna kumbukumbu za ukaguzi.</td></tr>`;
        return;
    }

    container.innerHTML = logs.map(l => {
        let actionColor = "text-cyan-400";
        if (l.action.includes("APPROVED")) actionColor = "text-emerald-400";
        else if (l.action.includes("SUSPEND")) actionColor = "text-red-400";
        else if (l.action.includes("LOGIN")) actionColor = "text-blue-400";

        return `
            <tr class="border-b border-slate-800/60 hover:bg-slate-900/40 transition text-xs font-mono-sg">
                <td class="px-4 py-3 text-slate-400 text-[11px]">
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
// TAB 6: DATABASE & SYSTEM SETTINGS
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
            statusBadge.innerHTML = `<span class="px-3 py-1 rounded-full badge-pending text-xs font-mono-sg font-bold">● LOCAL FALLBACK MODE</span>`;
        }
    }

    if (inputUrl && SG_CONFIG.SUPABASE.url) inputUrl.value = SG_CONFIG.SUPABASE.url;
    if (inputKey && SG_CONFIG.SUPABASE.anonKey) inputKey.value = SG_CONFIG.SUPABASE.anonKey;
}

window.saveDatabaseCredentials = function(e) {
    if (e) e.preventDefault();
    const url = document.getElementById("supabase-url-input").value.trim();
    const key = document.getElementById("supabase-key-input").value.trim();

    if (!url || !key) {
        alert("Tafadhali weka Supabase URL na Public Anon Key.");
        return;
    }

    // Persist to local config settings
    localStorage.setItem("sg_supabase_url", url);
    localStorage.setItem("sg_supabase_key", key);

    alert("✓ Mipangilio ya Supabase imehifadhiwa! Mfumo unaunganisha moja kwa moja.");
    window.location.reload();
};
