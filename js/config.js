/**
 * SILLYGER (SG) Digital Membership & Governance Platform v1.4
 * Global Configuration & Constants
 */

const SG_CONFIG = {
    appName: "SILLYGER",
    officialAbbr: "SG",
    version: "1.4",
    status: "Updated Draft for Member Review",
    motto: "Learn Together. Build Together. Own the Future Together.",
    memberSingular: "Sillygerian",
    memberPlural: "Sillygerians",
    communityFundName: "SG Community Fund",
    
    // WhatsApp Private Community URL (Only revealed to ACTIVE members)
    privateWhatsAppInvite: "https://chat.whatsapp.com/KRxyaSoVcUCGLq0PdOy6Jb?s=cl&p=a&iam=2",
    
    // Storage keys for local-first testing / fallback mode
    STORAGE_KEYS: {
        APPLICANTS: "sg_applicants_v1_4",
        ACTIVE_SESSION: "sg_session_v1_4",
        SETTINGS: "sg_settings_v1_4",
        AUDIT_LOGS: "sg_audit_logs_v1_4",
        ATTENDANCE: "sg_attendance_v1_4",
        LEAVE_REQUESTS: "sg_leaves_v1_4",
        SUPPORT_TICKETS: "sg_tickets_v1_4"
    },

    // Supabase Configuration (Populated via Admin UI or directly here)
    SUPABASE: {
        url: (typeof localStorage !== 'undefined' && localStorage.getItem("sg_supabase_url")) || "",
        anonKey: (typeof localStorage !== 'undefined' && localStorage.getItem("sg_supabase_key")) || "",
        get isConfigured() {
            return !!(this.url && this.anonKey);
        }
    },

    // 11 Research & Development Divisions (Article 3)
    DIVISIONS: [
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
    ],

    // 10 Core Curriculum Levels (Article 8)
    CURRICULUM: [
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
    ]
};

// Freeze to prevent accidental mutations
Object.freeze(SG_CONFIG);

if (typeof window !== 'undefined') {
    window.SG_CONFIG = SG_CONFIG;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SG_CONFIG;
}
