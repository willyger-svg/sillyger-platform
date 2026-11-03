/**
 * SILLYGER (SG) Digital Membership & Governance Platform v1.4
 * Global Configuration, Constants & Security Utilities
 */

// ============================================================================
// CLOUD DATABASE CONFIGURATION (SUPABASE FREE TIER)
// Ukishapata Project URL na Anon Key kutoka Supabase, ziweke hapa chini
// ili simu na kompyuta za wanachama wote ziunganishwe moja kwa moja:
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
 * Security & Formatting Utilities (XSS Prevention)
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
    }
};

const SG_CONFIG = {
    appName: "SILLYGER",
    officialAbbr: "SG",
    version: "1.4",
    status: "Updated Draft for Member Review",
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

    // 11 Research & Development Divisions (Article 3)
    DIVISIONS: Object.freeze([
        {
            id: "tech",
            number: "3.1",
            name: "SILLYGER Technologies",
            tagline: "Software, Hardware & Systems Engineering",
            desc: "Uhandisi wa teknolojia, software za kisasa, mifumo imara ya hardware na integration ya suluhisho thabiti.",
            badge: "Engineering",
            icon: "cpu"
        },
        {
            id: "research",
            number: "3.2",
            name: "SILLYGER Research Institute",
            tagline: "Scientific Research, Experimentation & Development",
            desc: "Tafiti za kisayansi za kina, majaribio ya kimaabara, uchunguzi wa mifumo mipya na machapisho ya kiteknolojia.",
            badge: "Deep Research",
            icon: "microscope"
        },
        {
            id: "ai",
            number: "3.3",
            name: "SILLYGER AI",
            tagline: "AI, ML, Deep Learning & Intelligent Agents",
            desc: "Utafiti na ujenzi wa Artificial Intelligence, Machine Learning, Deep Learning, AI Models, Computer Vision na NLP.",
            badge: "Intelligence",
            icon: "brain"
        },
        {
            id: "robotics",
            number: "3.4",
            name: "SILLYGER Robotics",
            tagline: "Autonomous & Embedded Systems",
            desc: "Robotics, Autonomous Systems, Embedded Systems, Sensors, Actuators, Micro-controllers na Viwanda Automation.",
            badge: "Robotics",
            icon: "bot"
        },
        {
            id: "cybersecurity",
            number: "3.5",
            name: "SILLYGER Cybersecurity",
            tagline: "Ethical Hacking & Defensive Security",
            desc: "Ethical Hacking, Penetration Testing, Digital Forensics, Defensive Security, Malware Analysis na Security Research kwa maadili.",
            badge: "Security",
            icon: "shield-check"
        },
        {
            id: "arch",
            number: "3.6",
            name: "SILLYGER Computer Architecture",
            tagline: "Digital Logic, CPUs & Chip Design",
            desc: "Logic Gates, Digital Circuits, CPUs, GPUs, Memory Systems, Processors, Instruction Sets (ISA) na Computer Architecture kutoka mwanzo.",
            badge: "Silicon & Logic",
            icon: "layers"
        },
        {
            id: "systems",
            number: "3.7",
            name: "SILLYGER Systems",
            tagline: "Kernels, Compilers & Low-level Software",
            desc: "Operating Systems, Linux Kernels, Device Drivers, Compilers, System Software na uundaji wa lugha za kiprogramu.",
            badge: "Low-Level",
            icon: "terminal"
        },
        {
            id: "data",
            number: "3.8",
            name: "SILLYGER Data Systems",
            tagline: "Databases & Big Data Infrastructure",
            desc: "Databases, Big Data Engineering, Distributed Storage, Query Engines na Miundombinu ya kuhifadhi na kuchakata data.",
            badge: "Data Infra",
            icon: "database"
        },
        {
            id: "networks",
            number: "3.9",
            name: "SILLYGER Networks & Infrastructure",
            tagline: "Cloud, Servers & Data Centers",
            desc: "Computer Networks, Servers, Cloud Computing, Protocols, Internet Technologies na usanifu wa vituo vya data (Data Centers).",
            badge: "Infrastructure",
            icon: "network"
        },
        {
            id: "electronics",
            number: "3.10",
            name: "SILLYGER Electronics",
            tagline: "Circuits, PCBs & Microelectronics",
            desc: "Electronic Circuits, Integrated Circuits (ICs), Microcontrollers, PCB Design, soldering na vifaa vya kielektroniki.",
            badge: "Hardware",
            icon: "zap"
        },
        {
            id: "innovation",
            number: "3.11",
            name: "SILLYGER Innovation & Products",
            tagline: "Ideation to Production",
            desc: "Kubadilisha mawazo, tafiti za kimaabara na miradi ya wanachama kuwa bidhaa, huduma na mifumo halisi inayotumiwa na jamii.",
            badge: "Production",
            icon: "rocket"
        }
    ]),

    // 10 Core Curriculum Levels (Article 8)
    CURRICULUM: Object.freeze([
        { level: 1, title: "Computer Fundamentals & Electronics", desc: "Misingi ya tarakilishi, vipengele vya hardware, umeme msingi, na binary logic." },
        { level: 2, title: "Digital Logic & Computer Architecture", desc: "Logic gates, flip-flops, ALUs, CPU structure, memory na instruction sets." },
        { level: 3, title: "Programming & Software Engineering", desc: "Data structures, algorithms, modular programming, memory management na clean architecture." },
        { level: 4, title: "Operating Systems & Linux", desc: "Process management, memory virtualisation, file systems, Linux kernels na system calls." },
        { level: 5, title: "Computer Networking & Internet", desc: "OSI model, TCP/IP stack, socket programming, routing protocols na internet infrastructure." },
        { level: 6, title: "Cybersecurity Fundamentals", desc: "Cryptography, network defense, threat modeling, security hygiene na vulnerability analysis." },
        { level: 7, title: "Ethical Hacking & Penetration Testing", desc: "Authorized labs, web app security, network scanning, reverse engineering na exploit research." },
        { level: 8, title: "Databases, Backend & Cloud", desc: "Relational/NoSQL databases, distributed systems, API architecture, servers na cloud deployment." },
        { level: 9, title: "Advanced Cybersecurity & Research", desc: "Malware analysis, binary exploitation, digital forensics, AI security na academic papers." },
        { level: 10, title: "Innovation & Real-world Projects", desc: "Ubunifu wa bidhaa kamili, hardware prototypes, open-source tooling na uongozi wa miradi." }
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
