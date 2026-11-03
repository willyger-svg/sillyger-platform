/**
 * SILLYGER (SG) Student Community Platform - Public Pages UI Controller (v2.0)
 * Powers:
 * - index.html (Student Onboarding Flow, Live Telemetry & Community Updates)
 * - courses.html (Possible Courses Explorer)
 * - future-divisions.html (Future Roadmap / Vitengo vya Baadaye)
 */

document.addEventListener("DOMContentLoaded", () => {
    SGUtils.bindMobileMenu("mobile-menu-btn", "mobile-menu");
    SGUtils.renderPublicSessionSlot("header-session-slot");

    renderPlatformStats();
    renderHomeAnnouncements();
    initPossibleCoursesPage();
    initFutureDivisionsPage();

    window.addEventListener("sg:synced", () => {
        SGUtils.renderPublicSessionSlot("header-session-slot");
        renderPlatformStats();
        renderHomeAnnouncements();
    });
    window.addEventListener("storage", () => {
        SGUtils.renderPublicSessionSlot("header-session-slot");
        renderPlatformStats();
        renderHomeAnnouncements();
    });
});

window.handleQuickLogout = function () {
    SGStore.logout();
    window.location.reload();
};

function renderPlatformStats() {
    if (typeof SGStore === "undefined") return;
    const stats = SGStore.getStats();

    const elTotal = document.getElementById("stat-total-registered");
    const elActive = document.getElementById("stat-active-members");
    const elPending = document.getElementById("stat-pending-review");

    if (elTotal) elTotal.textContent = stats.totalRegistered;
    if (elActive) elActive.textContent = stats.activeMembers;
    if (elPending) elPending.textContent = stats.pendingApplicants;
}

function renderHomeAnnouncements() {
    const feed = document.getElementById("home-announcements-feed");
    if (!feed || typeof SGStore === "undefined") return;

    const esc = SGUtils.escapeHtml;
    const list = SGStore.getAnnouncements();

    if (!list || list.length === 0) {
        feed.innerHTML = `
            <div class="sg-glass p-6 rounded-2xl text-center text-xs text-slate-400 font-mono-sg">
                Hakuna tangazo jipya kwa sasa. Jiunge na uingie kwenye Student Portal kupata updates za WhatsApp Group.
            </div>
        `;
        return;
    }

    feed.innerHTML = list.slice(0, 3).map(a => {
        const isHigh = a.priority === "HIGH";
        return `
            <article class="sg-glass sg-glass-hover p-5 sm:p-6 rounded-2xl border ${isHigh ? "border-blue-500/35" : "border-slate-800/80"} flex flex-col justify-between gap-3">
                <div class="space-y-2">
                    <div class="flex items-center justify-between gap-2">
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono-sg font-bold uppercase ${isHigh ? "badge-future" : "badge-active"}">
                            ${isHigh ? "Update Muhimu" : "Taarifa ya Jumuiya"}
                        </span>
                        <span class="text-[11px] font-mono-sg text-slate-500">${esc(SGUtils.formatDateSw(a.created_at))}</span>
                    </div>
                    <h3 class="text-base sm:text-lg font-bold text-white leading-snug">${esc(a.title)}</h3>
                    <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">${esc(a.content)}</p>
                </div>
                <div class="pt-3 border-t border-slate-800/70 flex items-center justify-between text-[11px] font-mono-sg text-slate-500">
                    <span>Na: <strong class="text-slate-300">${esc(a.author || "SG Admin")}</strong></span>
                    <a href="member-portal.html" class="text-blue-400 hover:text-blue-300 font-semibold">Fungua Portal &rarr;</a>
                </div>
            </article>
        `;
    }).join("");
}

function initPossibleCoursesPage() {
    const container = document.getElementById("courses-grid");
    if (!container || typeof SG_CONFIG === "undefined") return;

    const searchInput = document.getElementById("courses-search");
    const countBadge = document.getElementById("courses-count-badge");
    const esc = SGUtils.escapeHtml;
    let activeCategory = "ALL";

    function renderList() {
        const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
        const filtered = SG_CONFIG.CURRICULUM.filter(c => {
            const matchesCat = activeCategory === "ALL" || (c.category && c.category.toLowerCase() === activeCategory.toLowerCase());
            const matchesQuery = !query ||
                c.title.toLowerCase().includes(query) ||
                c.desc.toLowerCase().includes(query) ||
                (c.category && c.category.toLowerCase().includes(query));
            return matchesCat && matchesQuery;
        });

        if (countBadge) {
            countBadge.textContent = `${filtered.length} Possible Course${filtered.length === 1 ? "" : "s"}`;
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="md:col-span-2 sg-glass p-10 rounded-2xl text-center space-y-3">
                    <p class="text-sm text-slate-400">Hakuna mada iliyopatikana kwa utafutaji huo.</p>
                    <button type="button" id="reset-courses-filter" class="px-4 py-2 rounded-xl bg-slate-800 text-xs text-blue-400 hover:text-white font-semibold">
                        Onyesha Mada Zote
                    </button>
                </div>
            `;
            const resetBtn = document.getElementById("reset-courses-filter");
            if (resetBtn) {
                resetBtn.onclick = () => {
                    activeCategory = "ALL";
                    if (searchInput) searchInput.value = "";
                    updateFilterButtons();
                    renderList();
                };
            }
            return;
        }

        container.innerHTML = filtered.map(curr => {
            const num = String(curr.level).padStart(2, "0");
            return `
                <div class="sg-glass sg-glass-hover p-6 rounded-2xl flex flex-col justify-between gap-4">
                    <div class="space-y-3">
                        <div class="flex items-center justify-between gap-2">
                            <span class="px-2.5 py-1 rounded-lg badge-future font-mono-sg text-xs font-bold">
                                TOPIC ${esc(num)}
                            </span>
                            <span class="text-[11px] font-mono-sg uppercase tracking-wider text-slate-400 px-2.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-800">
                                ${esc(curr.category || "Core")}
                            </span>
                        </div>
                        <h3 class="text-lg font-bold text-white leading-snug">
                            ${esc(curr.title)}
                        </h3>
                        <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            ${esc(curr.desc)}
                        </p>
                    </div>
                    <div class="pt-3 border-t border-slate-800/70 flex items-center justify-between text-[11px] font-mono-sg text-slate-500">
                        <span>Tunajifunza pamoja (Student Cohort)</span>
                        <span class="text-emerald-400">Possible Course</span>
                    </div>
                </div>
            `;
        }).join("");
    }

    function updateFilterButtons() {
        document.querySelectorAll(".course-filter-btn").forEach(btn => {
            const cat = btn.getAttribute("data-category") || "ALL";
            if (cat === activeCategory) {
                btn.className = "course-filter-btn px-3.5 py-1.5 rounded-xl btn-sg-primary text-xs font-semibold transition";
            } else {
                btn.className = "course-filter-btn px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition";
            }
        });
    }

    document.querySelectorAll(".course-filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            activeCategory = btn.getAttribute("data-category") || "ALL";
            updateFilterButtons();
            renderList();
        });
    });

    if (searchInput) {
        searchInput.addEventListener("input", renderList);
    }

    updateFilterButtons();
    renderList();
}

function initFutureDivisionsPage() {
    const container = document.getElementById("future-divisions-grid");
    if (!container || typeof SG_CONFIG === "undefined") return;

    const esc = SGUtils.escapeHtml;

    container.innerHTML = SG_CONFIG.DIVISIONS.map(div => `
        <div class="sg-glass sg-glass-hover p-6 rounded-2xl flex flex-col justify-between gap-4">
            <div class="space-y-3">
                <div class="flex items-center justify-between gap-2">
                    <span class="px-2.5 py-1 rounded-lg badge-future font-mono-sg text-[11px] font-bold">
                        FUTURE · ${esc(div.number)}
                    </span>
                    <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-800">
                        ${esc(div.badge)}
                    </span>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-white mb-1">
                        ${esc(div.name)}
                    </h3>
                    <p class="text-xs text-blue-400 font-mono-sg">
                        ${esc(div.tagline)}
                    </p>
                </div>
                <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    ${esc(div.desc)}
                </p>
            </div>
            <div class="pt-3 border-t border-slate-800/70 flex items-center justify-between text-[11px] font-mono-sg text-slate-500">
                <span>Katiba Art. ${esc(div.number)}</span>
                <span class="text-amber-400/90">Bado Haijaanza (Dira ya Baadaye)</span>
            </div>
        </div>
    `).join("");
}
