/**
 * SILLYGER (SG) Digital Membership Platform - Main UI Script
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Mobile Menu Toggle
    const mobileBtn = document.getElementById("mobile-menu-btn");
    const mobileMenu = document.getElementById("mobile-menu");
    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener("click", () => {
            mobileMenu.classList.toggle("hidden");
        });
    }

    // 2. Render Header Session Status & Stats
    renderHeaderSession();
    renderPlatformStats();

    // 3. Render 11 R&D Divisions (Article 3) & 10 Curriculum Levels (Article 8)
    renderDivisions();
    renderCurriculum();

    // 4. Re-render automatically on cloud / cross-tab sync
    window.addEventListener("sg:synced", () => {
        renderHeaderSession();
        renderPlatformStats();
    });
    window.addEventListener("storage", () => {
        renderHeaderSession();
        renderPlatformStats();
    });
});

function renderHeaderSession() {
    const sessionSlot = document.getElementById("header-session-slot");
    const esc = (v) => (typeof SGUtils !== "undefined" ? SGUtils.escapeHtml(v) : String(v || ""));
    if (!sessionSlot) return;

    const currentSession = SGStore.getCurrentSession();
    if (currentSession) {
        const isApproved = currentSession.status === "ACTIVE";
        const isAdmin = (
            currentSession.role === "Super Administrator" ||
            currentSession.role === "Administrator" ||
            currentSession.role === "Membership Administrator" ||
            currentSession.username === "willyger" ||
            currentSession.email === "wshavu@gmail.com"
        );
        const label = esc(currentSession.member_id || currentSession.username);
        const statusLabel = esc(currentSession.status);

        sessionSlot.innerHTML = `
            <div class="flex items-center gap-2">
                ${isAdmin ? `
                    <a href="admin-portal.html" class="px-2.5 py-1 rounded-lg bg-purple-950/70 border border-purple-500/50 text-purple-300 hover:text-white text-xs font-bold font-mono-sg flex items-center gap-1 transition">
                        <span>🛠️ Admin</span>
                    </a>
                ` : ""}
                <a href="member-portal.html" class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/60 transition text-sm">
                    <span class="w-2 h-2 rounded-full ${isApproved ? "bg-emerald-400 animate-ping" : "bg-amber-400"}"></span>
                    <span class="font-mono-sg text-xs text-cyan-300 font-semibold">${label}</span>
                    <span class="text-xs px-1.5 py-0.5 rounded ${isApproved ? "badge-active" : "badge-pending"} text-[10px] uppercase font-bold">${statusLabel}</span>
                </a>
                <button onclick="handleQuickLogout()" title="Ondoka kwenye akaunti" class="text-xs text-slate-400 hover:text-red-400 p-1.5 transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                </button>
            </div>
        `;
    } else {
        sessionSlot.innerHTML = `
            <a href="member-portal.html" class="text-xs md:text-sm font-semibold text-slate-300 hover:text-cyan-400 transition">Ingia Portal</a>
            <a href="register.html" class="text-xs md:text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold transition shadow-lg shadow-cyan-500/20">
                Jiunge Sasa
            </a>
        `;
    }
}

function handleQuickLogout() {
    SGStore.logout();
    window.location.reload();
}

function renderPlatformStats() {
    const stats = SGStore.getStats();

    const elTotal = document.getElementById("stat-total-registered");
    const elActive = document.getElementById("stat-active-members");
    const elPending = document.getElementById("stat-pending-review");
    const elDivisions = document.getElementById("stat-divisions");

    if (elTotal) elTotal.textContent = stats.totalRegistered;
    if (elActive) elActive.textContent = stats.activeMembers;
    if (elPending) elPending.textContent = stats.pendingApplicants;
    if (elDivisions) elDivisions.textContent = stats.divisionsCount;
}

function renderDivisions() {
    const container = document.getElementById("divisions-grid");
    if (!container) return;
    const esc = (v) => SGUtils.escapeHtml(v);

    container.innerHTML = SG_CONFIG.DIVISIONS.map(div => `
        <div class="sg-glass sg-glass-hover p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between group">
            <div>
                <div class="flex items-center justify-between mb-4">
                    <span class="font-mono-sg text-xs text-cyan-400 font-bold tracking-wider px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-800/50">
                        SEC ${esc(div.number)}
                    </span>
                    <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded bg-slate-800/70">
                        ${esc(div.badge)}
                    </span>
                </div>
                <h3 class="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors mb-1">
                    ${esc(div.name)}
                </h3>
                <p class="text-xs text-cyan-500/90 font-mono-sg mb-3">
                    // ${esc(div.tagline)}
                </p>
                <p class="text-sm text-slate-400 leading-relaxed mb-4">
                    ${esc(div.desc)}
                </p>
            </div>
            <div class="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                <span>Katiba Art. 3.${esc(div.number.split(".")[1])}</span>
                <a href="register.html?track=${encodeURIComponent(div.name)}" class="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Chagua Track &rarr;
                </a>
            </div>
        </div>
    `).join("");
}

function renderCurriculum() {
    const container = document.getElementById("curriculum-timeline");
    if (!container) return;
    const esc = (v) => SGUtils.escapeHtml(v);

    container.innerHTML = SG_CONFIG.CURRICULUM.map(curr => `
        <div class="relative pl-8 pb-8 border-l border-slate-800 last:border-0 last:pb-0">
            <div class="absolute -left-[17px] top-0 w-8 h-8 rounded-xl bg-slate-900 border border-cyan-500/40 flex items-center justify-center font-mono-sg text-xs font-bold text-cyan-400 shadow-md">
                ${esc(curr.level)}
            </div>
            <div class="sg-glass p-5 rounded-xl border border-slate-800/70 hover:border-slate-700 transition">
                <div class="flex items-center justify-between mb-1">
                    <h4 class="text-base font-bold text-slate-100">
                        Level ${esc(curr.level)}: ${esc(curr.title)}
                    </h4>
                    <span class="text-[10px] font-mono-sg text-slate-500">Art. 8.${esc(curr.level)}</span>
                </div>
                <p class="text-xs md:text-sm text-slate-400 leading-relaxed">
                    ${esc(curr.desc)}
                </p>
            </div>
        </div>
    `).join("");
}
