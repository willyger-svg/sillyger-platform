/**
 * SILLYGER (SG) Student Community & Governance Platform (v2.0 / Charter v1.4)
 * Global Configuration, Constants, Shared UI Helpers & Security Utilities
 */

// ============================================================================
// CLOUD DATABASE CONFIGURATION (SUPABASE POSTGRESQL)
// ============================================================================
const DEFAULT_SUPABASE_URL = "https://inxmxykulzaqxrnpbvwd.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlueG14eWt1bHphcXhybnBidndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3NDA5ODAsImV4cCI6MjEwOTMxNjk4MH0.1C_qsHrA8322rFYBXvhndhoNlU7-ekJDC-HCFi0FVZE";

/**
 * Security, Formatting, Toast Notifications & Shared Navigation Utilities (XSS Prevention)
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

    showToast(message, variant = "success") {
        if (typeof document === "undefined") return;
        let container = document.getElementById("admin-toast-container") || document.getElementById("sg-global-toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "sg-global-toast-container";
            container.className = "fixed top-20 right-4 z-[80] flex flex-col gap-2.5 max-w-sm w-[calc(100%-2rem)] pointer-events-none";
            document.body.appendChild(container);
        }

        const palette = variant === "error"
            ? "border-red-500/60 bg-red-950/95 text-red-100"
            : (variant === "info" || variant === "warning"
                ? "border-blue-500/60 bg-slate-900/95 text-blue-100"
                : "border-emerald-500/60 bg-emerald-950/95 text-emerald-100");

        const toast = document.createElement("div");
        toast.className = `pointer-events-auto p-4 rounded-2xl border shadow-2xl text-xs font-semibold leading-relaxed flex items-start justify-between gap-3 transition duration-200 ${palette}`;
        toast.innerHTML = `
            <div class="whitespace-pre-line">${this.escapeHtml(message)}</div>
            <button type="button" class="text-slate-400 hover:text-white shrink-0 font-bold" aria-label="Funga">✕</button>
        `;
        const closeBtn = toast.querySelector("button");
        if (closeBtn) closeBtn.onclick = () => toast.remove();
        container.appendChild(toast);
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 5000);
    },

    async copyText(text, successMessage = "✓ Imenakiliwa kikamilifu!") {
        if (!text) return false;
        try {
            if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
                await navigator.clipboard.writeText(String(text));
                this.showToast(successMessage, "success");
                return true;
            }
        } catch (_) {}
        if (typeof document !== "undefined") {
            try {
                const ta = document.createElement("textarea");
                ta.value = String(text);
                ta.style.position = "fixed";
                ta.style.opacity = "0";
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
                this.showToast(successMessage, "success");
                return true;
            } catch (_) {}
        }
        return false;
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
    },

    extractYouTubeId(input) {
        if (!input) return null;
        input = String(input).trim();
        if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
        const m = input.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?.*v=|live\/|shorts\/))([a-zA-Z0-9_-]{11})/i);
        if (m && m[1]) return m[1];
        try {
            const url = new URL(input.startsWith("http") ? input : "https://" + input);
            if (url.searchParams.has("v")) {
                const v = url.searchParams.get("v");
                if (/^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
            }
            const parts = url.pathname.split("/").filter(Boolean);
            const lastPart = parts[parts.length - 1];
            if (lastPart && /^[a-zA-Z0-9_-]{11}$/.test(lastPart)) {
                return lastPart;
            }
        } catch (_) {}
        return null;
    },

    getYouTubeEmbedUrl(input, options = {}) {
        const id = this.extractYouTubeId(input);
        if (!id) return "";
        const autoplay = typeof options === "object" ? (options.autoplay !== false) : !!options;
        const mute = typeof options === "object" ? !!options.mute : false;
        const params = new URLSearchParams({
            autoplay: autoplay ? "1" : "0",
            playsinline: "1",
            rel: "0",
            modestbranding: "1",
            enablejsapi: "1",
            controls: "1",
            iv_load_policy: "3",
            loop: "1",
            playlist: id
        });
        if (mute) params.set("mute", "1");
        return `https://www.youtube.com/embed/${id}?${params.toString()}`;
    },

    getYouTubeThumbnail(input, quality = "hqdefault") {
        const id = this.extractYouTubeId(input);
        if (!id) return "assets/sillyger-logo-icon.png";
        return `https://img.youtube.com/vi/${id}/${quality}.jpg`;
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

    // Server-gated getter for WhatsApp Invite (Populated ONLY by Supabase RPC when member is ACTIVE or Admin)
    get privateWhatsAppInvite() {
        try {
            if (typeof localStorage !== "undefined") {
                const rawSession = localStorage.getItem("sg_session_v1_4");
                if (rawSession) {
                    const sess = JSON.parse(rawSession);
                    if (sess && sess.whatsapp_invite_url && sess.status === "ACTIVE") {
                        return sess.whatsapp_invite_url;
                    }
                }
                const rawSettings = localStorage.getItem("sg_settings_v1_4");
                if (rawSettings) {
                    const parsed = JSON.parse(rawSettings);
                    if (parsed && parsed.whatsapp_invite_url) {
                        return parsed.whatsapp_invite_url;
                    }
                }
            }
        } catch (e) {}
        return "";
    },

    extractYouTubeId(input) {
        return typeof SGUtils !== "undefined" ? SGUtils.extractYouTubeId(input) : null;
    },

    getYouTubeEmbedUrl(input, options = {}) {
        return typeof SGUtils !== "undefined" ? SGUtils.getYouTubeEmbedUrl(input, options) : "";
    },

    getYouTubeThumbnail(input, quality = "hqdefault") {
        return typeof SGUtils !== "undefined" ? SGUtils.getYouTubeThumbnail(input, quality) : "assets/sillyger-logo-icon.png";
    },

    // Storage keys for local-first / hybrid persistence
    STORAGE_KEYS: Object.freeze({
        APPLICANTS: "sg_applicants_v1_4",
        ACTIVE_SESSION: "sg_session_v1_4",
        SETTINGS: "sg_settings_v1_4",
        PUBLIC_STATS: "sg_public_stats_v1_4",
        AUDIT_LOGS: "sg_audit_logs_v1_4",
        ATTENDANCE: "sg_attendance_v1_4",
        LEAVE_REQUESTS: "sg_leaves_v1_4",
        SUPPORT_TICKETS: "sg_tickets_v1_4",
        ANNOUNCEMENTS: "sg_announcements_v1_4",
        FUND_LEDGER: "sg_fund_ledger_v1_4",
        TV_BROADCAST: "sg_tv_broadcast_v1",
        TV_ARCHIVE: "sg_tv_archive_v1"
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

/* ==========================================================================
   SILLYGER EMERGENCY MIGRATION NOTICE & REDIRECT (Netlify -> Vercel)
   Inawajulisha wageni wanaoingia Netlify kuwa tovuti imehamia Vercel rasmi,
   ikiwa na countdown na button inayowapeleka moja kwa moja kwenye mfumo mpya.
   ========================================================================== */
(function () {
    if (typeof window === "undefined" || !window.location) return;

    var hostname = (window.location.hostname || "").toLowerCase();
    var isVercel = hostname.includes("vercel.app");
    var isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "";
    var forcePreview = window.location.search.indexOf("show_migration=1") !== -1;

    // Usionyeshe kama tayari yuko Vercel au localhost (isipokuwa show_migration=1 imetumika)
    if (isVercel && !forcePreview) {
        return;
    }
    if (isLocal && !forcePreview && hostname.indexOf("netlify") === -1) {
        return;
    }

    // Ruta lengwa kwenye jukwaa jipya la Vercel
    var targetBase = "https://sillyger-platform.vercel.app";
    var path = (window.location.pathname || "").toLowerCase();
    var search = window.location.search || "";
    
    // Ondoa query ya forcePreview kama ilikuwepo
    search = search.replace(/[?&]show_migration=1/, "").replace(/^&/, "?");

    var targetPath = "/";
    if (path.indexOf("admin") !== -1) {
        targetPath = "/admin";
    } else if (path.indexOf("member-portal") !== -1 || path.indexOf("portal") !== -1) {
        targetPath = "/portal";
    } else if (path.indexOf("register") !== -1 || path.indexOf("jiunge") !== -1) {
        targetPath = "/register";
    } else if (path.indexOf("constitution") !== -1 || path.indexOf("katiba") !== -1) {
        targetPath = "/constitution";
    } else if (path.indexOf("tv") !== -1) {
        targetPath = "/tv";
    } else if (path.indexOf("download") !== -1) {
        targetPath = "/download";
    }

    var fullTargetUrl = targetBase + targetPath + (search && search !== "?" ? search : "");

    function setupNotice() {
        if (document.getElementById("sg-migration-modal-wrap")) return;

        // 1. Ingiza Stylesheets maalum za Taarifa
        var styleEl = document.createElement("style");
        styleEl.id = "sg-migration-styles";
        styleEl.textContent = `
            #sg-migration-banner {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 999998;
                background: linear-gradient(90deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
                border-bottom: 2px solid #6366f1;
                color: #e0e7ff;
                padding: 10px 16px;
                font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
                font-size: 13px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 12px;
            }
            #sg-migration-banner .sg-banner-content {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
                min-width: 260px;
            }
            #sg-migration-banner .sg-banner-badge {
                background: #ef4444;
                color: #ffffff;
                font-size: 10px;
                font-weight: 800;
                padding: 4px 8px;
                border-radius: 9999px;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                white-space: nowrap;
                animation: sgPulse 1.8s infinite;
            }
            #sg-migration-banner .sg-banner-text {
                font-weight: 500;
                line-height: 1.4;
            }
            #sg-migration-banner .sg-banner-link {
                background: linear-gradient(135deg, #3b82f6, #4f46e5);
                color: #ffffff !important;
                font-weight: 700;
                text-decoration: none;
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 12px;
                white-space: nowrap;
                border: 1px solid rgba(255, 255, 255, 0.25);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                transition: transform 0.2s, box-shadow 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }
            #sg-migration-banner .sg-banner-link:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 16px rgba(59, 130, 246, 0.6);
            }
            @keyframes sgPulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.7; transform: scale(0.97); }
            }

            #sg-migration-modal-wrap {
                position: fixed;
                inset: 0;
                z-index: 999999;
                background: rgba(3, 7, 18, 0.88);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 16px;
                box-sizing: border-box;
                font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            }
            #sg-migration-modal {
                background: #0b1120;
                border: 1px solid rgba(99, 102, 241, 0.4);
                border-radius: 20px;
                max-width: 520px;
                width: 100%;
                color: #f8fafc;
                box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 50px rgba(99, 102, 241, 0.25);
                overflow: hidden;
                animation: sgModalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes sgModalIn {
                from { opacity: 0; transform: scale(0.92) translateY(12px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .sg-m-head {
                background: linear-gradient(135deg, rgba(30, 27, 75, 0.9), rgba(49, 46, 129, 0.6));
                padding: 24px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                text-align: center;
            }
            .sg-m-icon {
                width: 64px;
                height: 64px;
                background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                border-radius: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 14px;
                font-size: 32px;
                box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.5);
            }
            .sg-m-title {
                font-size: 21px;
                font-weight: 800;
                color: #ffffff;
                margin: 0 0 8px;
                line-height: 1.3;
            }
            .sg-m-badge {
                display: inline-block;
                background: rgba(239, 68, 68, 0.18);
                color: #f87171;
                border: 1px solid rgba(239, 68, 68, 0.35);
                font-size: 11px;
                font-weight: 700;
                padding: 3px 10px;
                border-radius: 9999px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .sg-m-body {
                padding: 22px 24px;
                font-size: 14px;
                line-height: 1.6;
                color: #cbd5e1;
            }
            .sg-m-body p {
                margin: 0 0 12px;
            }
            .sg-m-body strong {
                color: #ffffff;
            }
            .sg-m-box {
                background: rgba(15, 23, 42, 0.7);
                border: 1px solid rgba(99, 102, 241, 0.25);
                border-radius: 12px;
                padding: 12px 14px;
                margin: 14px 0;
            }
            .sg-m-box-title {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #94a3b8;
                font-weight: 700;
                margin-bottom: 4px;
            }
            .sg-m-url {
                color: #38bdf8;
                font-family: 'Fira Code', monospace, monospace;
                font-size: 12.5px;
                word-break: break-all;
                display: block;
            }
            .sg-m-timer {
                background: rgba(59, 130, 246, 0.12);
                border: 1px solid rgba(59, 130, 246, 0.3);
                color: #93c5fd;
                border-radius: 10px;
                padding: 10px 14px;
                text-align: center;
                font-weight: 600;
                font-size: 13px;
                margin-top: 14px;
            }
            .sg-m-timer span {
                color: #ffffff;
                font-weight: 800;
                font-size: 16px;
                display: inline-block;
                min-width: 14px;
            }
            .sg-m-actions {
                padding: 0 24px 24px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .sg-btn-primary {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                background: linear-gradient(135deg, #2563eb, #4f46e5);
                color: #ffffff !important;
                font-weight: 700;
                font-size: 15px;
                text-decoration: none;
                padding: 13px 20px;
                border-radius: 12px;
                box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.45);
                transition: transform 0.2s, box-shadow 0.2s;
                border: none;
                cursor: pointer;
                text-align: center;
            }
            .sg-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 15px 30px -5px rgba(37, 99, 235, 0.65);
            }
            .sg-btn-secondary {
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.16);
                color: #94a3b8;
                font-size: 13px;
                font-weight: 600;
                padding: 10px;
                border-radius: 10px;
                cursor: pointer;
                transition: background 0.2s, color 0.2s;
                font-family: inherit;
            }
            .sg-btn-secondary:hover {
                background: rgba(255, 255, 255, 0.06);
                color: #f1f5f9;
            }
        `;
        document.head.appendChild(styleEl);

        // 2. Ingiza Top Banner ya Kudumu
        var banner = document.createElement("div");
        banner.id = "sg-migration-banner";
        banner.innerHTML = `
            <div class="sg-banner-content">
                <span class="sg-banner-badge">Uhamiaji Rasmi</span>
                <span class="sg-banner-text">Tovuti ya SILLYGER imehamia mfumo mpya wa Vercel wenye maboresho yote ya hivi karibuni.</span>
            </div>
            <a href="${fullTargetUrl}" class="sg-banner-link">
                Fungua Vercel Sasa &rarr;
            </a>
        `;
        document.body.prepend(banner);
        document.body.style.paddingTop = "52px";

        // Angalia kama modal imefungwa katika session hii
        var dismissed = false;
        try {
            dismissed = sessionStorage.getItem("sg_migration_dismissed") === "1";
        } catch (e) {}

        if (dismissed) {
            return;
        }

        // 3. Ingiza Full Modal yenye Maelezo na Countdown
        var modalWrap = document.createElement("div");
        modalWrap.id = "sg-migration-modal-wrap";
        modalWrap.innerHTML = `
            <div id="sg-migration-modal" role="dialog" aria-modal="true" aria-labelledby="sg-m-title">
                <div class="sg-m-head">
                    <div class="sg-m-icon">🚀</div>
                    <span class="sg-m-badge">Tovuti Imebadilika</span>
                    <h2 class="sg-m-title" id="sg-m-title">SILLYGER Tumehamia Vercel!</h2>
                </div>
                <div class="sg-m-body">
                    <p>
                        Habari kiongozi au mwanachama! Tovuti hii ya zamani ya <strong>Netlify</strong> haitapokea tena masasisho (updates) mapya.
                    </p>
                    <p>
                        Mfumo wote umeboreshwa na kuhamishiwa jukwaa rasmi la <strong>Vercel</strong> ukiwa na muundo mpya, huduma ya kupakua Sillyger App (v1.0.9), Resource Hub ya vifaa vya maabara, na huduma zote mpya za jumuiya.
                    </p>
                    <div class="sg-m-box">
                        <div class="sg-m-box-title">Ukurasa wako kwenye mfumo mpya:</div>
                        <span class="sg-m-url">${fullTargetUrl}</span>
                    </div>
                    <div class="sg-m-timer" id="sg-countdown-box">
                        Utahamishwa kiotomatiki baada ya <span id="sg-countdown-num">6</span> sekunde...
                    </div>
                </div>
                <div class="sg-m-actions">
                    <a href="${fullTargetUrl}" class="sg-btn-primary" id="sg-redirect-now">
                        <span>Elekea Kwenye Tovuti Mpya Sasa</span>
                        <span>&rarr;</span>
                    </a>
                    <button type="button" class="sg-btn-secondary" id="sg-stay-btn">
                        Baki hapa kwa muda (Sitisha Uhamisho)
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modalWrap);

        // Countdown Timer Logic (sekunde 6 hadi auto-redirect)
        var secondsLeft = 6;
        var countdownNum = document.getElementById("sg-countdown-num");
        var timerInterval = setInterval(function () {
            secondsLeft -= 1;
            if (countdownNum) {
                countdownNum.textContent = secondsLeft;
            }
            if (secondsLeft <= 0) {
                clearInterval(timerInterval);
                window.location.href = fullTargetUrl;
            }
        }, 1000);

        // Kitufe cha kusitisha uhamisho na kubaki kwenye ukurasa
        var stayBtn = document.getElementById("sg-stay-btn");
        if (stayBtn) {
            stayBtn.addEventListener("click", function () {
                clearInterval(timerInterval);
                try {
                    sessionStorage.setItem("sg_migration_dismissed", "1");
                } catch (e) {}
                if (modalWrap && modalWrap.parentNode) {
                    modalWrap.parentNode.removeChild(modalWrap);
                }
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", setupNotice);
    } else {
        setupNotice();
    }
})();
