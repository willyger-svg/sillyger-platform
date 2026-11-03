/**
 * SILLYGER (SG) Student Community & Governance Platform (v2.0 / Charter v1.4)
 * Global Configuration, Constants, Shared UI Helpers & Security Utilities
 */

// ============================================================================
// CLOUD DATABASE CONFIGURATION (SUPABASE POSTGRESQL)
// ============================================================================
const DEFAULT_SUPABASE_URL = "https://inxmxykulzaqxrnpbvwd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlueG14eWt1bHphcXhybnBidndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3NDA5ODAsImV4cCI6MjEwOTMxNjk4MH0.1C_qsHrA8322rFYBXvhndhoNlU7-ekJDC-HCFi0FVZE";

// Encoded official community invite fallback (can be rotated anytime via Admin Portal)
const _OFFICIAL_WA_ENCODED = "aHR0cHM6Ly9jaGF0LndoYXRzYXBwLmNvbS9LUnh5YVNvVmNVQ0dMcTBQZE95NkpiP3M9Y2wmcD1hJmlhbT0y";

function _decodeBase64(b64) {
    try {
        if (typeof atob === "function") return atob(b64);
        if (typeof Buffer !== "undefined") return Buffer.from(b64, "base64").toString("utf8");
    } catch (e) {}
    return "";
}

/**
 * Security, Formatting & Shared Navigation Utilities (XSS Prevention)
 */
const SGUtils = {
    escapeHtml(value) {
        if (value === null || value === undefined) return "";
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    },

    formatDateSw(isoStr, includeTime = false) {
        if (!isoStr) return "—";
        try {
            const d = new Date(isoStr);
            if (isNaN(d.getTime())) return String(isoStr);
            return includeTime ? d.toLocaleString("sw-TZ") : d.toLocaleDateString("sw-TZ");
        } catch (e) {
            return String(isoStr);
        }
    },

    renderPublicSessionSlot(slotId = "header-session-slot") {
        if (typeof document === "undefined" || typeof SGStore === "undefined") return;
        const sessionSlot = document.getElementById(slotId);
        if (!sessionSlot) return;

        const esc = this.escapeHtml;
        const currentSession = SGStore.getCurrentSession();

        if (currentSession) {
            const isApproved = currentSession.status === "ACTIVE";
            const isAdmin = SGStore.isAdminUser(currentSession);
            const label = esc(currentSession.member_id || "@" + currentSession.username);
            const statusLabel = esc(currentSession.status);

            sessionSlot.innerHTML = `
                <div class="flex items-center gap-2">
                    ${isAdmin ? `
                        <a href="admin-portal.html" class="px-2.5 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold font-mono-sg flex items-center gap-1 transition">
                            <span>Admin</span>
                        </a>
                    ` : ""}
                    <a href="member-portal.html" class="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-950/40 hover:bg-blue-900/50 transition text-xs">
                        <span class="w-2 h-2 rounded-full ${isApproved ? "bg-emerald-400" : "bg-amber-400"}"></span>
                        <span class="font-mono-sg text-blue-200 font-semibold">${label}</span>
                        <span class="px-1.5 py-0.5 rounded ${isApproved ? "badge-active" : "badge-pending"} text-[10px] uppercase font-bold hidden sm:inline">${statusLabel}</span>
                    </a>
                    <button onclick="if(window.SGStore){SGStore.logout(); window.location.reload();}" title="Ondoka kwenye akaunti" class="text-xs text-slate-400 hover:text-red-400 p-1.5 transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    </button>
                </div>
            `;
        } else {
            sessionSlot.innerHTML = `
                <a href="member-portal.html" class="text-xs md:text-sm font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 transition">Ingia</a>
                <a href="register.html" class="text-xs md:text-sm px-4 py-2 rounded-xl btn-sg-primary">
                    Jiunge Sasa
                </a>
            `;
        }
    },

    bindMobileMenu(btnId = "mobile-menu-btn", menuId = "mobile-menu") {
        if (typeof document === "undefined") return;
        const mobileBtn = document.getElementById(btnId);
        const mobileMenu = document.getElementById(menuId);
        if (mobileBtn && mobileMenu) {
            mobileBtn.addEventListener("click", () => {
                mobileMenu.classList.toggle("hidden");
            });
            mobileMenu.querySelectorAll("a").forEach(link => {
                link.addEventListener("click", () => {
                    mobileMenu.classList.add("hidden");
                });
            });
        }
    }
};

const SG_CONFIG = {
    appName: "SILLYGER",
    officialAbbr: "SG",
    version: "1.4",
    communityTrackLabel: "SG Student Community",
    status: "Active Student Learning Community",
    motto: "Learn Together. Build Together. Own the Future Together.",
    memberSingular: "Sillygerian",
    memberPlural: "Sillygerians",
    communityFundName: "SG Community Fund",

    // Dynamic getter for WhatsApp Invite (supports live rotation via Admin Portal / Supabase)
    get privateWhatsAppInvite() {
        try {
            if (typeof localStorage !== "undefined") {
                const rawSettings = localStorage.getItem("sg_settings_v1_4");
                if (rawSettings) {
                    const parsed = JSON.parse(rawSettings);
                    if (parsed && parsed.whatsapp_invite_url) {
                        return parsed.whatsapp_invite_url;
                    }
                }
            }
        } catch (e) {}
        return _decodeBase64(_OFFICIAL_WA_ENCODED);
    },

    // Storage keys for local-first / hybrid persistence
    STORAGE_KEYS: Object.freeze({
        APPLICANTS: "sg_applicants_v1_4",
        ACTIVE_SESSION: "sg_session_v1_4",
        SETTINGS: "sg_settings_v1_4",
        AUDIT_LOGS: "sg_audit_logs_v1_4",
        ATTENDANCE: "sg_attendance_v1_4",
        LEAVE_REQUESTS: "sg_leaves_v1_4",
        SUPPORT_TICKETS: "sg_tickets_v1_4",
        ANNOUNCEMENTS: "sg_announcements_v1_4",
        FUND_LEDGER: "sg_fund_ledger_v1_4"
    }),

    // Supabase Configuration (Reads from Admin localStorage override OR file constants above)
    SUPABASE: {
        get url() {
            return (typeof localStorage !== "undefined" && localStorage.getItem("sg_supabase_url")) || DEFAULT_SUPABASE_URL;
        },
        set url(val) {
            if (typeof localStorage !== "undefined") {
                if (val) localStorage.setItem("sg_supabase_url", String(val).trim());
                else localStorage.removeItem("sg_supabase_url");
            }
        },
        get anonKey() {
            return (typeof localStorage !== "undefined" && localStorage.getItem("sg_supabase_key")) || DEFAULT_SUPABASE_ANON_KEY;
        },
        set anonKey(val) {
            if (typeof localStorage !== "undefined") {
                if (val) localStorage.setItem("sg_supabase_key", String(val).trim());
                else localStorage.removeItem("sg_supabase_key");
            }
        },
        get isConfigured() {
            return !!(this.url && this.anonKey);
        }
    },

    // Future Vision: 11 Planned Research & Development Divisions (Article 3 — Future Roadmap)
    DIVISIONS: Object.freeze([
        {
            id: "tech",
            number: "3.1",
            name: "SILLYGER Technologies",
            tagline: "Software, Hardware & Systems Engineering",
            desc: "Dira ya baadaye ya kuunda software za kisasa, mifumo imara ya hardware na suluhisho za kihandisi.",
            badge: "Engineering",
            icon: "cpu"
        },
        {
            id: "research",
            number: "3.2",
            name: "SILLYGER Research Institute",
            tagline: "Scientific Research, Experimentation & Development",
            desc: "Dira ya kuanzisha maabara za tafiti za kisayansi, majaribio ya kina na machapisho ya kiteknolojia.",
            badge: "Deep Research",
            icon: "microscope"
        },
        {
            id: "ai",
            number: "3.3",
            name: "SILLYGER AI",
            tagline: "AI, ML, Deep Learning & Intelligent Agents",
            desc: "Utafiti na ujenzi wa baadaye wa Artificial Intelligence, Machine Learning, Computer Vision na NLP.",
            badge: "Intelligence",
            icon: "brain"
        },
        {
            id: "robotics",
            number: "3.4",
            name: "SILLYGER Robotics",
            tagline: "Autonomous & Embedded Systems",
            desc: "Maabara tarajiwa ya Robotics, Embedded Systems, Sensors, Actuators na Micro-controllers.",
            badge: "Robotics",
            icon: "bot"
        },
        {
            id: "cybersecurity",
            number: "3.5",
            name: "SILLYGER Cybersecurity",
            tagline: "Ethical Hacking & Defensive Security",
            desc: "Kitengo tarajiwa cha ulinzi wa mifumo, Ethical Hacking kwenye maabara rasmi, na Digital Forensics.",
            badge: "Security",
            icon: "shield-check"
        },
        {
            id: "arch",
            number: "3.6",
            name: "SILLYGER Computer Architecture",
            tagline: "Digital Logic, CPUs & Chip Design",
            desc: "Utafiti wa muda mrefu wa Logic Gates, Digital Circuits, CPUs, Memory Systems na Instruction Sets (ISA).",
            badge: "Silicon & Logic",
            icon: "layers"
        },
        {
            id: "systems",
            number: "3.7",
            name: "SILLYGER Systems",
            tagline: "Kernels, Compilers & Low-level Software",
            desc: "Maendeleo ya baadaye ya Operating Systems, Linux Kernels, Device Drivers na Compilers.",
            badge: "Low-Level",
            icon: "terminal"
        },
        {
            id: "data",
            number: "3.8",
            name: "SILLYGER Data Systems",
            tagline: "Databases & Big Data Infrastructure",
            desc: "Ujenzi wa mifumo ya Databases, Distributed Storage na miundombinu ya kuchakata data kubwa.",
            badge: "Data Infra",
            icon: "database"
        },
        {
            id: "networks",
            number: "3.9",
            name: "SILLYGER Networks & Infrastructure",
            tagline: "Cloud, Servers & Data Centers",
            desc: "Dira ya kujenga miundombinu ya Computer Networks, Servers, Cloud Computing na vituo vya data.",
            badge: "Infrastructure",
            icon: "network"
        },
        {
            id: "electronics",
            number: "3.10",
            name: "SILLYGER Electronics",
            tagline: "Circuits, PCBs & Microelectronics",
            desc: "Maabara tarajiwa ya Electronic Circuits, Microcontrollers, PCB Design na vifaa vya kielektroniki.",
            badge: "Hardware",
            icon: "zap"
        },
        {
            id: "innovation",
            number: "3.11",
            name: "SILLYGER Innovation & Products",
            tagline: "Ideation to Production",
            desc: "Hatua ya baadaye ya kubadilisha miradi ya wanafunzi na tafiti kuwa bidhaa halisi kwa jamii.",
            badge: "Production",
            icon: "rocket"
        }
    ]),

    // Possible Courses: 10 Learning Areas Students Can Explore Together (Article 8)
    CURRICULUM: Object.freeze([
        { level: 1, category: "Misingi", title: "Computer Fundamentals & Electronics", desc: "Misingi ya kompyuta inavyofanya kazi ndani, hardware msingi, umeme wa awali na binary logic." },
        { level: 2, category: "Misingi", title: "Digital Logic & Computer Architecture", desc: "Logic gates, flip-flops, ALUs, muundo wa CPU, memory na jinsi maelekezo yanavyochakatwa." },
        { level: 3, category: "Software", title: "Programming & Software Engineering", desc: "Kujifunza kuandika kodi safi, data structures, algorithms na ujenzi wa programu hatua kwa hatua." },
        { level: 4, category: "Systems", title: "Operating Systems & Linux", desc: "Matumizi na misingi ya Linux, process management, file systems, terminal na mifumo ya uendeshaji." },
        { level: 5, category: "Networks", title: "Computer Networking & Internet", desc: "Jinsi intaneti na mitandao inavyofanya kazi: TCP/IP, DNS, HTTP, routing na socket programming." },
        { level: 6, category: "Security", title: "Cybersecurity Fundamentals", desc: "Misingi ya ulinzi wa mifumo, cryptography, usalama wa mitandao na utambuzi wa udhaifu kwa maadili." },
        { level: 7, category: "Security", title: "Ethical Hacking & Security Labs", desc: "Mazoezi ya kiusalama kwenye maabara zilizoidhinishwa (CTFs), web security na ukaguzi wa mifumo." },
        { level: 8, category: "Backend & Cloud", title: "Databases, Backend & Cloud", desc: "SQL/PostgreSQL, ujenzi wa APIs, servers, na kuweka mifumo hewani (cloud deployment)." },
        { level: 9, category: "Advanced", title: "AI, Data & Systems Research", desc: "Misingi ya Artificial Intelligence, uchambuzi wa data, na utafiti wa mada za juu kwa pamoja." },
        { level: 10, category: "Projects", title: "Collaborative Student Projects", desc: "Kuunda miradi ya pamoja ya wanafunzi (open-source tools, tovuti na mifumo halisi ya kujifunzia)." }
    ])
};

Object.freeze(SG_CONFIG);
Object.freeze(SGUtils);

if (typeof window !== "undefined") {
    window.SG_CONFIG = SG_CONFIG;
    window.SGUtils = SGUtils;
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = { SG_CONFIG, SGUtils };
}
