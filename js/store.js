/**
 * SILLYGER (SG) Secure Cloud + Local Hybrid State Engine (v2.3)
 * Security & Architecture (Katiba v1.4 & Tanzania PDPA 2022):
 * - Server-Verified Cryptographic Session Shield (`sgs_...` tokens via PostgreSQL SECURITY DEFINER RPCs)
 * - Zero `password_hash` or cross-member personal data exposure in browser LocalStorage
 * - Server-Gated WhatsApp Invite Link (unlocked strictly for ACTIVE members & Administrators)
 * - Single-RPC Role-Scoped Sync (1 lightweight request instead of 8 full-table pulls)
 * - Offline Local Fallback for pure local testing when Supabase is disconnected
 */

if (typeof SG_CONFIG === "undefined" && typeof require === "function") {
    const cfg = require("./config.js");
    global.SG_CONFIG = cfg.SG_CONFIG || cfg;
    global.SGUtils = cfg.SGUtils;
}

const _sgStorage = (typeof localStorage !== "undefined") ? localStorage : {
    _data: {},
    getItem(k) { return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
};

// Pure-JS UTF-8 SHA-256 (used only for offline local-mode fallback)
function _sha256Utf8(str) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }
    const maxWord = Math.pow(2, 32);
    let bytes;
    if (typeof TextEncoder !== "undefined") {
        bytes = Array.from(new TextEncoder().encode(String(str)));
    } else if (typeof Buffer !== "undefined") {
        bytes = Array.from(Buffer.from(String(str), "utf8"));
    } else {
        const utf8 = unescape(encodeURIComponent(String(str)));
        bytes = [];
        for (let i = 0; i < utf8.length; i++) bytes.push(utf8.charCodeAt(i));
    }

    const bitLength = bytes.length * 8;
    let hash = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
    const k = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    bytes.push(0x80);
    while ((bytes.length % 64) !== 56) bytes.push(0);

    const words = [];
    for (let i = 0; i < bytes.length; i++) {
        words[i >> 2] |= bytes[i] << ((3 - (i % 4)) * 8);
    }
    words[words.length] = Math.floor(bitLength / maxWord);
    words[words.length] = bitLength >>> 0;

    for (let j = 0; j < words.length;) {
        const w = words.slice(j, j += 16);
        const oldHash = hash.slice(0);
        for (let i = 0; i < 64; i++) {
            if (i >= 16) {
                const w15 = w[i - 15], w2 = w[i - 2];
                const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
                const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
                w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
            }
            const a = hash[0], e = hash[4];
            const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
            const ch = (e & hash[5]) ^ ((~e) & hash[6]);
            const temp1 = (hash[7] + S1 + ch + k[i] + w[i]) | 0;
            const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
            const maj = (a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]);
            const temp2 = (S0 + maj) | 0;
            hash = [(temp1 + temp2) | 0, a, hash[1], hash[2], (hash[3] + temp1) | 0, e, hash[5], hash[6]];
        }
        for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }

    let result = "";
    for (let i = 0; i < 8; i++) {
        result += (hash[i] >>> 0).toString(16).padStart(8, "0");
    }
    return result;
}

function _randomSaltHex(len = 16) {
    const chars = "0123456789abcdef";
    let out = "";
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
        const arr = new Uint8Array(len);
        crypto.getRandomValues(arr);
        for (let i = 0; i < len; i++) out += chars[arr[i] % 16];
        return out;
    }
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
    return out;
}

const _FOUNDER_INITIAL_HASH = "sha256$sg_founder_v14$7720a68116abeee3a59cbb401ecdb701739d19b567a7d28031c6880d6ae8c1ac";

let _isInitialized = false;
let _syncInFlight = null;
let _lastSyncAt = 0;
const _pendingWrites = new Set();

function _trackWrite(promiseLike) {
    if (!promiseLike || typeof promiseLike.then !== "function") return Promise.resolve();
    const tracked = Promise.resolve(promiseLike).finally(() => {
        _pendingWrites.delete(tracked);
    });
    _pendingWrites.add(tracked);
    return tracked;
}

function _isCloudConfigured() {
    return !!(typeof SG_CONFIG !== "undefined" && SG_CONFIG.SUPABASE && SG_CONFIG.SUPABASE.isConfigured && typeof fetch === "function");
}

function _cleanRpcError(rawMsg) {
    if (!rawMsg) return "Hitilafu imetokea kwenye mfumo.";
    return String(rawMsg)
        .replace(/^P0001:\s*/i, "")
        .replace(/^ERROR:\s*/i, "")
        .trim();
}

/**
 * Direct Zero-Dependency Supabase PostgREST RPC Caller.
 * Works reliably even if external CDN scripts are slow or blocked on mobile networks.
 */
async function _callCloudRpc(rpcName, params = {}) {
    if (!_isCloudConfigured()) {
        throw new Error("Supabase Cloud haijaunganishwa.");
    }
    const baseUrl = String(SG_CONFIG.SUPABASE.url || "").replace(/\/+$/, "");
    const anonKey = SG_CONFIG.SUPABASE.anonKey;
    const res = await fetch(`${baseUrl}/rest/v1/rpc/${rpcName}`, {
        method: "POST",
        headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        body: JSON.stringify(params || {})
    });

    const rawText = await res.text();
    let parsed = null;
    try {
        parsed = rawText ? JSON.parse(rawText) : null;
    } catch (_) {
        parsed = rawText;
    }

    if (!res.ok) {
        const msg = (parsed && typeof parsed === "object" && (parsed.message || parsed.error || parsed.details))
            ? (parsed.message || parsed.error || parsed.details)
            : `HTTP ${res.status}`;
        const cleaned = _cleanRpcError(msg);

        if (cleaned.includes("SESSION_EXPIRED")) {
            _clearSensitiveLocalCaches();
            _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.ACTIVE_SESSION);
            _notifyBroadcast({ type: "SESSION_EXPIRED" });
        }
        throw new Error(cleaned.replace(/^SESSION_EXPIRED:\s*/i, "").replace(/^FORBIDDEN:\s*/i, ""));
    }

    return parsed;
}

function _notifyBroadcast(payload) {
    try {
        if (typeof BroadcastChannel !== "undefined") {
            const bc = new BroadcastChannel("sg_platform_sync");
            bc.postMessage(payload);
            bc.close();
        }
    } catch (_) {}
    try {
        if (typeof window !== "undefined" && typeof CustomEvent === "function") {
            window.dispatchEvent(new CustomEvent("sg:synced", { detail: payload }));
        }
    } catch (_) {}
}

function _clearSensitiveLocalCaches(keepPublicOverview = true) {
    _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.APPLICANTS);
    _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.ATTENDANCE);
    _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.LEAVE_REQUESTS);
    _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.SUPPORT_TICKETS);
    _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.FUND_LEDGER);
    _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.AUDIT_LOGS);

    // Strip private WhatsApp link from settings cache when unauthenticated
    try {
        const rawSettings = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.SETTINGS);
        if (rawSettings) {
            const parsed = JSON.parse(rawSettings);
            if (parsed && parsed.whatsapp_invite_url) {
                delete parsed.whatsapp_invite_url;
                _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
            }
        }
    } catch (_) {}

    if (!keepPublicOverview) {
        _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.ANNOUNCEMENTS);
        _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.PUBLIC_STATS);
    }
}

const SGStore = {
    // Offline fallback cryptographic helpers
    hashPassword(plainPassword, customSalt = null) {
        const salt = customSalt || ("sg_" + _randomSaltHex(12));
        const digest = _sha256Utf8(`${salt}:${String(plainPassword)}`);
        return `sha256$${salt}$${digest}`;
    },

    isHashedPassword(stored) {
        return typeof stored === "string" && /^sha256\$[a-zA-Z0-9_]+\$[0-9a-f]{64}$/.test(stored);
    },

    verifyPassword(plainPassword, storedHash) {
        if (!storedHash) return false;
        if (this.isHashedPassword(storedHash)) {
            const parts = storedHash.split("$");
            return _sha256Utf8(`${parts[1]}:${String(plainPassword)}`) === parts[2];
        }
        return String(plainPassword) === String(storedHash);
    },

    isFounderMember(member) {
        if (!member) return false;
        return (
            member.member_id === "SG-000001" ||
            (member.username && member.username.toLowerCase() === "willyger") ||
            (member.email && member.email.toLowerCase() === "wshavu@gmail.com")
        );
    },

    isSuperAdmin(member) {
        if (!member) return false;
        return this.isFounderMember(member) || member.role === "Super Administrator";
    },

    isAdminUser(member) {
        if (!member) return false;
        if (this.isSuperAdmin(member)) return true;
        return [
            "Administrator",
            "Membership Administrator",
            "Education Administrator",
            "Finance Administrator"
        ].includes(member.role);
    },

    async flushPendingWrites() {
        if (_pendingWrites.size === 0) return;
        await Promise.allSettled(Array.from(_pendingWrites));
    },

    /**
     * Initialize Store & Enforce PDPA 2022 Browser Privacy Hygiene
     */
    init(force = false) {
        if (_isInitialized && !force) return;
        _isInitialized = true;

        if (_isCloudConfigured()) {
            // Check if pre-upgrade session exists without cryptographic server session_token
            try {
                const rawSess = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.ACTIVE_SESSION);
                if (rawSess) {
                    const parsedSess = JSON.parse(rawSess);
                    if (!parsedSess || !parsedSess.session_token) {
                        _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.ACTIVE_SESSION);
                        _sgStorage.setItem("sg_reauth_notice", "1");
                    }
                }
            } catch (_) {
                _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.ACTIVE_SESSION);
            }

            const activeSession = this.getCurrentSession();
            if (!activeSession) {
                // Unauthenticated browser: purge any legacy cached member data or hashes immediately
                _clearSensitiveLocalCaches(true);
            } else if (!this.isAdminUser(activeSession)) {
                // Regular student: never hold full members directory, fund ledger, or admin audit logs
                _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.APPLICANTS);
                _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.FUND_LEDGER);
                _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.AUDIT_LOGS);
                if (activeSession.status !== "ACTIVE") {
                    try {
                        const rawSettings = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.SETTINGS);
                        if (rawSettings) {
                            const s = JSON.parse(rawSettings);
                            delete s.whatsapp_invite_url;
                            _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(s));
                        }
                    } catch (_) {}
                }
            } else {
                // Admin session: ensure any cached member list never contains password_hash
                try {
                    const rawMembers = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.APPLICANTS);
                    if (rawMembers) {
                        const cleaned = (JSON.parse(rawMembers) || []).map(m => {
                            const copy = { ...m };
                            delete copy.password_hash;
                            return copy;
                        });
                        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.APPLICANTS, JSON.stringify(cleaned));
                    }
                } catch (_) {}
            }

            this.syncWithSupabase();
            return;
        }

        // Pure local offline fallback initialization (when Supabase URL/Key are removed)
        let members = [];
        try {
            const raw = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.APPLICANTS);
            members = raw ? JSON.parse(raw) : [];
        } catch (_) {
            members = [];
        }

        const founderTemplate = {
            id: "usr_admin_001",
            member_id: "SG-000001",
            full_name: "William Gerishom William",
            username: "willyger",
            email: "wshavu@gmail.com",
            phone: "+255750449373",
            password_hash: _FOUNDER_INITIAL_HASH,
            track: "SILLYGER Systems & Architecture",
            experience: "Advanced",
            role: "Super Administrator",
            status: "ACTIVE",
            agreed_constitution: true,
            agreed_ethics: true,
            agreed_pdpa: true,
            created_at: "2026-08-01T00:00:00.000Z",
            approved_at: "2026-08-01T00:00:00.000Z",
            approved_by: "SYSTEM_FOUNDER"
        };

        const adminIdx = members.findIndex(m => this.isFounderMember(m));
        if (adminIdx === -1) {
            members.unshift(founderTemplate);
        }
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.APPLICANTS, JSON.stringify(members));
    },

    /**
     * Role-Scoped Single-RPC Cloud Synchronization:
     * - Public Visitor -> `sg_get_public_overview` (counts + announcements only)
     * - Student Session -> `sg_get_my_portal_state` (own profile + own records + gated WhatsApp link)
     * - Admin Session   -> `sg_admin_get_full_state` (sanitized governance tables, zero password_hash)
     */
    async syncWithSupabase(force = false) {
        if (!_isCloudConfigured()) return false;

        // Skip background tab polling unless explicitly forced
        if (!force && typeof document !== "undefined" && document.visibilityState === "hidden") {
            return false;
        }

        const now = Date.now();
        if (!force && (now - _lastSyncAt < 3000)) return false;
        if (_syncInFlight) return _syncInFlight;

        _lastSyncAt = now;
        _syncInFlight = (async () => {
            try {
                await this.flushPendingWrites();
                const session = this.getCurrentSession();
                const token = session && session.session_token ? session.session_token : "";

                // 1. ADMIN FULL GOVERNANCE SYNC
                if (token && this.isAdminUser(session)) {
                    const data = await _callCloudRpc("sg_admin_get_full_state", { p_session_token: token });
                    if (data && typeof data === "object") {
                        const members = Array.isArray(data.members) ? data.members : [];
                        this.saveMembers(members);

                        const stats = {
                            totalRegistered: members.length,
                            activeMembers: members.filter(m => m.status === "ACTIVE").length,
                            pendingApplicants: members.filter(m => m.status === "PENDING").length
                        };
                        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.PUBLIC_STATS, JSON.stringify(stats));

                        if (Array.isArray(data.announcements)) {
                            _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(data.announcements));
                        }
                        if (Array.isArray(data.fund_ledger)) {
                            const normFund = data.fund_ledger.map(tx => ({
                                ...tx,
                                amount: parseFloat(tx.amount) || 0,
                                date: tx.date || tx.tx_date || (tx.created_at ? tx.created_at.split("T")[0] : "")
                            }));
                            _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.FUND_LEDGER, JSON.stringify(normFund));
                        }
                        if (Array.isArray(data.attendance)) {
                            const normAtt = data.attendance.map(a => ({
                                ...a,
                                date: a.date || a.session_date || (a.created_at ? a.created_at.split("T")[0] : "")
                            }));
                            _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ATTENDANCE, JSON.stringify(normAtt));
                        }
                        if (Array.isArray(data.leave_requests)) {
                            const normLeaves = data.leave_requests.map(l => ({
                                ...l,
                                submitted_at: l.submitted_at || l.created_at
                            }));
                            _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(normLeaves));
                        }
                        if (Array.isArray(data.support_tickets)) {
                            _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(data.support_tickets));
                        }
                        if (Array.isArray(data.audit_logs)) {
                            _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(data.audit_logs));
                        }
                        if (data.settings && typeof data.settings === "object") {
                            _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
                        }
                        if (data.admin) {
                            this.setCurrentSession({
                                ...data.admin,
                                session_token: token,
                                whatsapp_invite_url: (data.settings && data.settings.whatsapp_invite_url) || ""
                            });
                        }
                    }
                    _notifyBroadcast({ type: "CLOUD_SYNC_COMPLETE", scope: "admin" });
                    return true;
                }

                // 2. AUTHENTICATED STUDENT PORTAL SYNC
                if (token) {
                    const data = await _callCloudRpc("sg_get_my_portal_state", { p_session_token: token });
                    if (data && typeof data === "object") {
                        if (data.stats) {
                            _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.PUBLIC_STATS, JSON.stringify(data.stats));
                        }
                        if (Array.isArray(data.announcements)) {
                            _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(data.announcements));
                        }
                        if (Array.isArray(data.attendance)) {
                            const normAtt = data.attendance.map(a => ({
                                ...a,
                                date: a.date || a.session_date || (a.created_at ? a.created_at.split("T")[0] : "")
                            }));
                            _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ATTENDANCE, JSON.stringify(normAtt));
                        }
                        if (Array.isArray(data.leave_requests)) {
                            const normLeaves = data.leave_requests.map(l => ({
                                ...l,
                                submitted_at: l.submitted_at || l.created_at
                            }));
                            _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(normLeaves));
                        }
                        if (Array.isArray(data.support_tickets)) {
                            _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(data.support_tickets));
                        }

                        const nextSettings = {
                            active_session_title: data.active_session_title || ""
                        };
                        if (data.whatsapp_invite_url) {
                            nextSettings.whatsapp_invite_url = data.whatsapp_invite_url;
                        }
                        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(nextSettings));

                        if (data.member) {
                            this.setCurrentSession({
                                ...data.member,
                                session_token: token,
                                whatsapp_invite_url: data.whatsapp_invite_url || ""
                            });
                        }
                    }
                    _notifyBroadcast({ type: "CLOUD_SYNC_COMPLETE", scope: "student" });
                    return true;
                }

                // 3. PUBLIC OVERVIEW SYNC (Zero personal data)
                const pub = await _callCloudRpc("sg_get_public_overview", {});
                if (pub && typeof pub === "object") {
                    if (pub.stats) {
                        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.PUBLIC_STATS, JSON.stringify(pub.stats));
                    }
                    if (Array.isArray(pub.announcements)) {
                        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(pub.announcements));
                    }
                    if (typeof pub.active_session_title === "string") {
                        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify({
                            active_session_title: pub.active_session_title
                        }));
                    }
                }
                _notifyBroadcast({ type: "CLOUD_SYNC_COMPLETE", scope: "public" });
                return true;
            } catch (err) {
                console.warn("Supabase sync notice:", err.message || err);
                return false;
            } finally {
                _syncInFlight = null;
            }
        })();

        return _syncInFlight;
    },

    // =========================================================================
    // AUTHENTICATION & SESSION MANAGEMENT
    // =========================================================================
    async loginAsync(credential, plainPassword) {
        if (_isCloudConfigured()) {
            const res = await _callCloudRpc("sg_login", {
                p_credential: String(credential || "").trim(),
                p_password: String(plainPassword || "")
            });
            if (!res || !res.member || !res.session_token) {
                throw new Error("Imeshindikana kuthibitisha akaunti kwenye Cloud.");
            }
            const settingsObj = {
                active_session_title: res.active_session_title || ""
            };
            if (res.whatsapp_invite_url) {
                settingsObj.whatsapp_invite_url = res.whatsapp_invite_url;
            }
            _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(settingsObj));

            const sessionPayload = {
                ...res.member,
                session_token: res.session_token,
                whatsapp_invite_url: res.whatsapp_invite_url || ""
            };
            this.setCurrentSession(sessionPayload);
            _sgStorage.removeItem("sg_reauth_notice");
            return sessionPayload;
        }

        // Offline local fallback
        const member = this.authenticateMember(credential, plainPassword);
        this.setCurrentSession(member);
        return member;
    },

    authenticateMember(credential, plainPassword) {
        const member = this.findMemberByCredential(credential);
        if (!member) {
            throw new Error("Hakuna akaunti iliyopatikana kwa taarifa hizi. Hakikisha email, username au namba ya WhatsApp uliyoweka ni sahihi.");
        }
        if (!this.verifyPassword(plainPassword, member.password_hash)) {
            throw new Error("Nenosiri (Password) si sahihi. Tafadhali hakiki na ujaribu tena.");
        }
        return member;
    },

    setCurrentSession(user) {
        if (!user) {
            _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.ACTIVE_SESSION);
            return;
        }
        const safeSession = { ...user };
        delete safeSession.password_hash;
        delete safeSession._unsynced_cloud;
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(safeSession));
    },

    getCurrentSession() {
        try {
            const data = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.ACTIVE_SESSION);
            if (!data) return null;
            const parsed = JSON.parse(data);
            if (!parsed || !parsed.id) return null;

            if (_isCloudConfigured() && !parsed.session_token) {
                return null;
            }

            if (this.isAdminUser(parsed)) {
                const live = this.getMembers().find(m => m.id === parsed.id || (m.username && m.username === parsed.username));
                if (live) {
                    const merged = { ...live, session_token: parsed.session_token, whatsapp_invite_url: parsed.whatsapp_invite_url };
                    delete merged.password_hash;
                    return merged;
                }
            }
            return parsed;
        } catch (_) {
            return null;
        }
    },

    consumeReauthNotice() {
        const val = _sgStorage.getItem("sg_reauth_notice");
        if (val) {
            _sgStorage.removeItem("sg_reauth_notice");
            return true;
        }
        return false;
    },

    logout() {
        let token = "";
        try {
            const raw = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.ACTIVE_SESSION);
            if (raw) {
                const parsed = JSON.parse(raw);
                token = (parsed && parsed.session_token) || "";
            }
        } catch (_) {}

        _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.ACTIVE_SESSION);
        _clearSensitiveLocalCaches(true);

        if (_isCloudConfigured() && token) {
            _trackWrite(_callCloudRpc("sg_logout", { p_session_token: token }).catch(() => {}));
        }
        _notifyBroadcast({ type: "USER_LOGOUT" });
    },

    // =========================================================================
    // REGISTRATION & PASSWORD MANAGEMENT
    // =========================================================================
    async registerApplicantAsync(data, opts = { issueSession: true }) {
        const normalizedEmail = (data.email || "").trim().toLowerCase();
        const normalizedUsername = (data.username || "").trim().toLowerCase();
        const normalizedPhone = this.normalizePhone(data.phone);
        const interestNote = (data.learning_interest || data.motivation || "").trim();
        const shouldIssueSession = opts && opts.issueSession !== false;

        if (_isCloudConfigured()) {
            const res = await _trackWrite(
                _callCloudRpc("sg_register_applicant", {
                    p_full_name: (data.full_name || "").trim(),
                    p_username: normalizedUsername,
                    p_email: normalizedEmail,
                    p_phone: normalizedPhone,
                    p_password: String(data.password || ""),
                    p_learning_interest: interestNote,
                    p_issue_session: shouldIssueSession
                })
            );

            if (!res || !res.member) {
                throw new Error("Imeshindikana kukamilisha usajili kwenye Cloud Database.");
            }

            if (shouldIssueSession && res.session_token) {
                this.setCurrentSession({
                    ...res.member,
                    session_token: res.session_token,
                    whatsapp_invite_url: ""
                });
            }

            // Refresh stats / admin list
            await this.syncWithSupabase(true);
            _notifyBroadcast({ type: "APPLICANT_REGISTERED", applicant: { id: res.member.id, username: res.member.username } });
            return res.member;
        }

        // Offline fallback
        const localApplicant = this.registerApplicant(data);
        if (shouldIssueSession) {
            this.setCurrentSession(localApplicant);
        }
        return localApplicant;
    },

    registerApplicant(data) {
        this.init();
        const members = this.getMembers();
        const normalizedEmail = (data.email || "").trim().toLowerCase();
        const normalizedUsername = (data.username || "").trim().toLowerCase();
        const normalizedPhone = this.normalizePhone(data.phone);

        if (!normalizedEmail || !normalizedEmail.includes("@")) {
            throw new Error("Tafadhali weka barua pepe (Email) sahihi.");
        }
        if (!normalizedUsername || normalizedUsername.length < 3 || !/^[a-z0-9_]+$/.test(normalizedUsername)) {
            throw new Error("Username lazima iwe na herufi/nambari pekee bila nafasi (angalau herufi 3).");
        }
        if (!this.isValidTzPhone(normalizedPhone)) {
            throw new Error("Namba ya WhatsApp si sahihi kwa Tanzania. Weka muundo wa +2557XXXXXXXX au 07XXXXXXXX.");
        }
        if (!data.password || String(data.password).length < 6) {
            throw new Error("Nenosiri (Password) lazima liwe na angalau herufi 6.");
        }
        if (members.some(m => m.email && m.email.toLowerCase() === normalizedEmail)) {
            throw new Error("Barua pepe hii (Email) tayari imesajiliwa.");
        }
        if (members.some(m => m.username && m.username.toLowerCase() === normalizedUsername)) {
            throw new Error("Jina la mtumiaji (Username) hili tayari limetumika.");
        }
        if (members.some(m => m.phone === normalizedPhone)) {
            throw new Error("Namba hii ya WhatsApp tayari imesajiliwa.");
        }

        const interestNote = (data.learning_interest || data.motivation || "").trim();
        const newApplicant = {
            id: "usr_" + Date.now().toString(36) + "_" + _randomSaltHex(6),
            member_id: null,
            full_name: (data.full_name || "").trim(),
            username: normalizedUsername,
            email: normalizedEmail,
            phone: normalizedPhone,
            password_hash: this.hashPassword(data.password),
            track: "SG Student Community",
            experience: "Student",
            learning_interest: interestNote,
            motivation: interestNote,
            role: "Applicant",
            status: "PENDING",
            agreed_constitution: true,
            agreed_ethics: true,
            agreed_pdpa: true,
            created_at: new Date().toISOString(),
            approved_at: null,
            approved_by: null
        };
        members.push(newApplicant);
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.APPLICANTS, JSON.stringify(members));
        return newApplicant;
    },

    async changePasswordAsync(currentPassword, newPassword) {
        if (!newPassword || String(newPassword).length < 6) {
            throw new Error("Nenosiri jipya lazima liwe na angalau herufi 6.");
        }
        const session = this.getCurrentSession();
        if (!session) throw new Error("Tafadhali ingia kwanza kwenye akaunti yako.");

        if (_isCloudConfigured()) {
            await _trackWrite(
                _callCloudRpc("sg_change_own_password", {
                    p_session_token: session.session_token,
                    p_current_password: String(currentPassword || ""),
                    p_new_password: String(newPassword)
                })
            );
            return true;
        }

        return this.changePassword(session.id, currentPassword, newPassword);
    },

    changePassword(memberId, currentPassword, newPassword) {
        const members = this.getMembers();
        const idx = members.findIndex(m => m.id === memberId);
        if (idx === -1) throw new Error("Akaunti haikupatikana.");
        if (!this.verifyPassword(currentPassword, members[idx].password_hash)) {
            throw new Error("Nenosiri la sasa si sahihi.");
        }
        members[idx].password_hash = this.hashPassword(newPassword);
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.APPLICANTS, JSON.stringify(members));
        return true;
    },

    // =========================================================================
    // MEMBERS DIRECTORY & EXECUTIVE ADMIN ACTIONS
    // =========================================================================
    getMembers() {
        this.init();
        try {
            return JSON.parse(_sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.APPLICANTS)) || [];
        } catch (_) {
            return [];
        }
    },

    saveMembers(members) {
        const sanitized = (Array.isArray(members) ? members : []).map(m => {
            const copy = { ...m };
            if (_isCloudConfigured()) {
                delete copy.password_hash;
            }
            return copy;
        });
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.APPLICANTS, JSON.stringify(sanitized));
    },

    findMemberById(id) {
        if (!id) return null;
        const found = this.getMembers().find(m => m.id === id) || null;
        if (found) return found;
        try {
            const rawSess = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.ACTIVE_SESSION);
            if (rawSess) {
                const sess = JSON.parse(rawSess);
                if (sess && sess.id === id) return sess;
            }
        } catch (_) {}
        return null;
    },

    findMemberByCredential(credential) {
        const search = (credential || "").trim().toLowerCase();
        if (!search) return null;
        const normalizedPhone = this.normalizePhone(search);
        const digitsSearch = search.replace(/[\s\-+]/g, "");

        const list = this.getMembers();
        const found = list.find(m =>
            (m.email && m.email.toLowerCase() === search) ||
            (m.username && m.username.toLowerCase() === search) ||
            (m.member_id && m.member_id.toLowerCase() === search) ||
            (m.phone && m.phone === normalizedPhone) ||
            (digitsSearch.length >= 9 && m.phone && m.phone.replace(/[\s\-+]/g, "") === digitsSearch)
        );
        if (found) return found;

        try {
            const rawSess = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.ACTIVE_SESSION);
            if (rawSess) {
                const sess = JSON.parse(rawSess);
                if (sess && sess.username && sess.username.toLowerCase() === search) return sess;
            }
        } catch (_) {}
        return null;
    },

    getNextMemberId() {
        const members = this.getMembers();
        let maxNum = 0;
        members.forEach(m => {
            if (m.member_id && m.member_id.startsWith("SG-")) {
                const numPart = parseInt(m.member_id.replace("SG-", ""), 10);
                if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
            }
        });
        return "SG-" + String(maxNum + 1).padStart(6, "0");
    },

    async approveMemberAsync(applicantId) {
        const session = this.getCurrentSession();
        if (_isCloudConfigured()) {
            if (!session || !session.session_token) {
                throw new Error("Kikao cha Admin hakijapatikana. Tafadhali ingia tena.");
            }
            const approved = await _trackWrite(
                _callCloudRpc("sg_admin_approve_member", {
                    p_session_token: session.session_token,
                    p_target_user_id: applicantId
                })
            );
            if (approved && approved.id) {
                const list = this.getMembers();
                const idx = list.findIndex(m => m.id === approved.id || m.username === approved.username);
                if (idx !== -1) list[idx] = approved;
                else list.push(approved);
                this.saveMembers(list);
            }
            await this.syncWithSupabase(true);
            _notifyBroadcast({ type: "MEMBER_APPROVED", id: approved.id, member_id: approved.member_id });
            return approved;
        }

        // Offline fallback
        const members = this.getMembers();
        const idx = members.findIndex(m => m.id === applicantId || m.username === applicantId);
        if (idx === -1) throw new Error("Mwanachama hakupatikana.");
        const m = members[idx];
        if (!m.member_id) m.member_id = this.getNextMemberId();
        m.status = "ACTIVE";
        if (!m.role || m.role === "Applicant") m.role = "Member";
        m.approved_at = new Date().toISOString();
        m.approved_by = (session && session.username) || "willyger";
        members[idx] = m;
        this.saveMembers(members);
        return m;
    },

    async approveAllPendingAsync() {
        const pending = this.getMembers().filter(m => m.status === "PENDING");
        const approvedList = [];
        for (const applicant of pending) {
            const res = await this.approveMemberAsync(applicant.id);
            approvedList.push(res);
        }
        return approvedList;
    },

    async deleteMemberAsync(applicantId) {
        const session = this.getCurrentSession();
        if (_isCloudConfigured()) {
            if (!session || !session.session_token) {
                throw new Error("Kikao cha Admin hakijapatikana. Tafadhali ingia tena.");
            }
            await _trackWrite(
                _callCloudRpc("sg_admin_delete_member", {
                    p_session_token: session.session_token,
                    p_target_user_id: applicantId
                })
            );
            const remaining = this.getMembers().filter(m => m.id !== applicantId && m.username !== applicantId);
            this.saveMembers(remaining);
            await this.syncWithSupabase(true);
            _notifyBroadcast({ type: "MEMBER_DELETED", id: applicantId });
            return true;
        }

        const members = this.getMembers();
        const target = members.find(m => m.id === applicantId);
        if (target && this.isFounderMember(target)) {
            throw new Error("Huwezi kufuta akaunti ya Mwanzilishi / Super Administrator!");
        }
        this.saveMembers(members.filter(m => m.id !== applicantId));
        return true;
    },

    async updateMemberDossierAsync(targetUserId, { member_id = null, role = null, status = null, new_password = null, reason = "" }) {
        const session = this.getCurrentSession();
        if (_isCloudConfigured()) {
            if (!session || !session.session_token) {
                throw new Error("Kikao cha Admin hakijapatikana. Tafadhali ingia tena.");
            }
            const updated = await _trackWrite(
                _callCloudRpc("sg_admin_update_dossier", {
                    p_session_token: session.session_token,
                    p_target_user_id: targetUserId,
                    p_member_id: member_id || null,
                    p_role: role || null,
                    p_status: status || null,
                    p_new_password: new_password || null,
                    p_reason: reason || ""
                })
            );
            if (updated && updated.id) {
                const list = this.getMembers();
                const idx = list.findIndex(m => m.id === updated.id);
                if (idx !== -1) list[idx] = updated;
                this.saveMembers(list);
            }
            await this.syncWithSupabase(true);
            _notifyBroadcast({ type: "MEMBER_UPDATED", id: targetUserId });
            return updated;
        }

        // Offline local fallback
        const members = this.getMembers();
        const idx = members.findIndex(m => m.id === targetUserId);
        if (idx === -1) throw new Error("Mwanachama hakupatikana.");
        const m = members[idx];
        if (member_id) m.member_id = member_id.trim().toUpperCase();
        if (status) {
            m.status = status;
            if (status === "ACTIVE" && !m.member_id) m.member_id = this.getNextMemberId();
        }
        if (role) m.role = role;
        if (new_password && new_password.length >= 6) {
            m.password_hash = this.hashPassword(new_password);
        }
        members[idx] = m;
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.APPLICANTS, JSON.stringify(members));
        return m;
    },

    // =========================================================================
    // PLATFORM SETTINGS
    // =========================================================================
    getPlatformSettings() {
        try {
            const raw = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.SETTINGS);
            return raw ? JSON.parse(raw) : {};
        } catch (_) {
            return {};
        }
    },

    async updatePlatformSettingsAsync(updates) {
        const session = this.getCurrentSession();
        if (_isCloudConfigured()) {
            const settings = await _trackWrite(
                _callCloudRpc("sg_admin_update_settings", {
                    p_session_token: session ? session.session_token : "",
                    p_updates: updates
                })
            );
            if (settings && typeof settings === "object") {
                _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
                if (session && settings.whatsapp_invite_url) {
                    this.setCurrentSession({ ...session, whatsapp_invite_url: settings.whatsapp_invite_url });
                }
            }
            _notifyBroadcast({ type: "SETTINGS_UPDATED" });
            return settings;
        }

        const next = { ...this.getPlatformSettings(), ...updates };
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(next));
        return next;
    },

    // =========================================================================
    // OFFICIAL ANNOUNCEMENTS (Article 6.8 & 11)
    // =========================================================================
    getAnnouncements() {
        try {
            const raw = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.ANNOUNCEMENTS);
            if (raw) return JSON.parse(raw) || [];
            return [];
        } catch (_) {
            return [];
        }
    },

    async createAnnouncementAsync({ title, content, priority = "NORMAL" }) {
        const session = this.getCurrentSession();
        if (_isCloudConfigured()) {
            const anc = await _trackWrite(
                _callCloudRpc("sg_admin_manage_announcement", {
                    p_session_token: session ? session.session_token : "",
                    p_op: "CREATE",
                    p_id: null,
                    p_title: title,
                    p_content: content,
                    p_priority: priority
                })
            );
            await this.syncWithSupabase(true);
            _notifyBroadcast({ type: "ANNOUNCEMENT_PUBLISHED" });
            return anc;
        }

        const list = this.getAnnouncements();
        const anc = {
            id: "anc_" + Date.now().toString(36),
            title: String(title || "").trim(),
            content: String(content || "").trim(),
            priority: priority === "HIGH" ? "HIGH" : "NORMAL",
            author: session ? `${session.full_name} (${session.role})` : "Super Administrator",
            created_at: new Date().toISOString()
        };
        list.unshift(anc);
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
        return anc;
    },

    async deleteAnnouncementAsync(ancId) {
        const session = this.getCurrentSession();
        if (_isCloudConfigured()) {
            await _trackWrite(
                _callCloudRpc("sg_admin_manage_announcement", {
                    p_session_token: session ? session.session_token : "",
                    p_op: "DELETE",
                    p_id: ancId
                })
            );
            await this.syncWithSupabase(true);
            _notifyBroadcast({ type: "ANNOUNCEMENT_REMOVED" });
            return true;
        }

        const list = this.getAnnouncements().filter(a => a.id !== ancId);
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
        return true;
    },

    // =========================================================================
    // SG COMMUNITY FUND LEDGER (Article 13)
    // =========================================================================
    getFundLedger() {
        try {
            const raw = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.FUND_LEDGER);
            return raw ? (JSON.parse(raw) || []) : [];
        } catch (_) {
            return [];
        }
    },

    async addFundTransactionAsync({ type, amount, category, description }) {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            throw new Error("Kiasi cha muamala lazima kiwe kikubwa kuliko sifuri (0).");
        }
        const session = this.getCurrentSession();

        if (_isCloudConfigured()) {
            const tx = await _trackWrite(
                _callCloudRpc("sg_admin_add_fund_tx", {
                    p_session_token: session ? session.session_token : "",
                    p_type: type,
                    p_amount: parsedAmount,
                    p_category: category,
                    p_description: description
                })
            );
            await this.syncWithSupabase(true);
            _notifyBroadcast({ type: "FUND_UPDATED" });
            return tx;
        }

        const list = this.getFundLedger();
        const tx = {
            id: "tx_" + Date.now().toString(36),
            type: type === "EXPENSE" ? "EXPENSE" : "INCOME",
            amount: parsedAmount,
            category: String(category || "Infrastructure").trim(),
            description: String(description || "").trim(),
            actor: (session && session.username) || "willyger",
            date: new Date().toISOString().split("T")[0]
        };
        list.unshift(tx);
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.FUND_LEDGER, JSON.stringify(list));
        return tx;
    },

    getFundBalance() {
        return this.getFundLedger().reduce((total, tx) => {
            const amt = parseFloat(tx.amount) || 0;
            return tx.type === "INCOME" ? total + amt : total - amt;
        }, 0);
    },

    // =========================================================================
    // ATTENDANCE, LEAVE REQUESTS & SUPPORT TICKETS
    // =========================================================================
    getAttendanceRecords(memberId = null) {
        try {
            const raw = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.ATTENDANCE);
            const list = raw ? (JSON.parse(raw) || []) : [];
            return memberId ? list.filter(a => a.member_id === memberId) : list;
        } catch (_) {
            return [];
        }
    },

    async recordPlannedAttendanceAsync(sessionTitle) {
        const session = this.getCurrentSession();
        if (!session || !session.member_id) {
            throw new Error("Wanachama walioidhinishwa (ACTIVE) pekee ndio wanaweza kufanya check-in.");
        }

        if (_isCloudConfigured()) {
            const rec = await _trackWrite(
                _callCloudRpc("sg_student_checkin", {
                    p_session_token: session.session_token,
                    p_session_title: String(sessionTitle || "").trim()
                })
            );
            await this.syncWithSupabase(true);
            _notifyBroadcast({ type: "ATTENDANCE_UPDATED" });
            return rec;
        }

        const today = new Date().toISOString().split("T")[0];
        const title = String(sessionTitle || "").trim() || "Kipindi cha Mafunzo ya SILLYGER";
        const list = this.getAttendanceRecords();
        if (list.some(a => a.member_id === session.member_id && a.date === today && a.session_title.toLowerCase() === title.toLowerCase())) {
            throw new Error(`Tayari umeshafanya check-in kwenye kipindi cha "${title}" leo (${today}).`);
        }
        const record = {
            id: "att_" + Date.now().toString(36),
            member_id: session.member_id,
            session_title: title,
            date: today,
            session_date: today,
            is_planned: true,
            is_verified: false,
            created_at: new Date().toISOString()
        };
        list.unshift(record);
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));
        return record;
    },

    async verifyAttendanceAsync(recordId = null, verifyAll = false) {
        const session = this.getCurrentSession();
        if (_isCloudConfigured()) {
            const res = await _trackWrite(
                _callCloudRpc("sg_admin_verify_attendance", {
                    p_session_token: session ? session.session_token : "",
                    p_record_id: recordId,
                    p_verify_all: !!verifyAll
                })
            );
            await this.syncWithSupabase(true);
            _notifyBroadcast({ type: "ATTENDANCE_UPDATED" });
            return (res && typeof res.verified_count === "number") ? res.verified_count : 1;
        }

        const list = this.getAttendanceRecords();
        let count = 0;
        list.forEach(a => {
            if ((verifyAll || a.id === recordId) && !a.is_verified) {
                a.is_verified = true;
                a.verified_by = session ? session.full_name : "Super Admin";
                count++;
            }
        });
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));
        return count;
    },

    getLeaveRequests(memberId = null) {
        try {
            const list = JSON.parse(_sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.LEAVE_REQUESTS)) || [];
            return memberId ? list.filter(l => l.member_id === memberId) : list;
        } catch (_) {
            return [];
        }
    },

    async submitLeaveRequestAsync({ category, duration, reason }) {
        const session = this.getCurrentSession();
        if (!session || !session.member_id) {
            throw new Error("Wanachama walioidhinishwa pekee wanaweza kuomba ruhusa.");
        }

        if (_isCloudConfigured()) {
            const rec = await _trackWrite(
                _callCloudRpc("sg_submit_leave_request", {
                    p_session_token: session.session_token,
                    p_category: category,
                    p_duration: duration,
                    p_reason: reason
                })
            );
            await this.syncWithSupabase(true);
            _notifyBroadcast({ type: "LEAVE_UPDATED" });
            return rec;
        }

        const list = this.getLeaveRequests();
        const request = {
            id: "leave_" + Date.now().toString(36),
            member_id: session.member_id,
            category: category || "Academic",
            duration: duration || "Siku 1 - 3",
            reason: String(reason || "").trim(),
            status: "PENDING_REVIEW",
            created_at: new Date().toISOString()
        };
        list.unshift(request);
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(list));
        return request;
    },

    async reviewLeaveRequestAsync(leaveId, decision) {
        const session = this.getCurrentSession();
        if (_isCloudConfigured()) {
            const rec = await _trackWrite(
                _callCloudRpc("sg_admin_review_leave", {
                    p_session_token: session ? session.session_token : "",
                    p_leave_id: leaveId,
                    p_decision: decision
                })
            );
            await this.syncWithSupabase(true);
            _notifyBroadcast({ type: "LEAVE_UPDATED" });
            return rec;
        }

        const list = this.getLeaveRequests();
        const idx = list.findIndex(l => l.id === leaveId);
        if (idx !== -1) {
            list[idx].status = decision;
            list[idx].reviewed_by = session ? session.full_name : "Super Admin";
            _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(list));
        }
        return list[idx] || null;
    },

    getSupportTickets(memberId = null) {
        try {
            const list = JSON.parse(_sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.SUPPORT_TICKETS)) || [];
            return memberId ? list.filter(t => t.member_id === memberId) : list;
        } catch (_) {
            return [];
        }
    },

    async submitSupportTicketAsync({ category, subject, message }) {
        const session = this.getCurrentSession();
        if (!session) throw new Error("Tafadhali ingia kwanza kwenye akaunti yako.");

        if (_isCloudConfigured()) {
            const rec = await _trackWrite(
                _callCloudRpc("sg_submit_support_ticket", {
                    p_session_token: session.session_token,
                    p_category: category,
                    p_subject: subject,
                    p_message: message
                })
            );
            await this.syncWithSupabase(true);
            _notifyBroadcast({ type: "TICKET_UPDATED" });
            return rec;
        }

        const list = this.getSupportTickets();
        const ticket = {
            id: "ticket_" + Date.now().toString(36),
            member_id: session.member_id || session.username,
            category: category || "Account & Approval",
            subject: String(subject || "").trim(),
            message: String(message || "").trim(),
            status: "OPEN",
            created_at: new Date().toISOString()
        };
        list.unshift(ticket);
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(list));
        return ticket;
    },

    async resolveSupportTicketAsync(ticketId, responseText) {
        const session = this.getCurrentSession();
        if (_isCloudConfigured()) {
            const rec = await _trackWrite(
                _callCloudRpc("sg_admin_reply_ticket", {
                    p_session_token: session ? session.session_token : "",
                    p_ticket_id: ticketId,
                    p_response: responseText
                })
            );
            await this.syncWithSupabase(true);
            _notifyBroadcast({ type: "TICKET_UPDATED" });
            return rec;
        }

        const list = this.getSupportTickets();
        const idx = list.findIndex(t => t.id === ticketId);
        if (idx !== -1) {
            list[idx].status = "RESOLVED";
            list[idx].response = responseText;
            list[idx].responded_by = session ? session.full_name : "Super Admin";
            _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(list));
        }
        return list[idx] || null;
    },

    // =========================================================================
    // AUDIT LOGS, PHONE VALIDATION, EXPORT & STATS
    // =========================================================================
    getAuditLogs() {
        try {
            return JSON.parse(_sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.AUDIT_LOGS)) || [];
        } catch (_) {
            return [];
        }
    },

    normalizePhone(raw) {
        if (!raw) return "";
        const clean = raw.toString().replace(/[\s\-()]/g, "");
        if (clean.startsWith("+")) return clean;
        if (clean.startsWith("0")) return "+255" + clean.substring(1);
        if (clean.startsWith("255")) return "+" + clean;
        return clean.length === 9 ? "+255" + clean : "+" + clean;
    },

    isValidTzPhone(phone) {
        const norm = this.normalizePhone(phone);
        return /^\+255[67]\d{8}$/.test(norm);
    },

    resetToPristine() {
        _clearSensitiveLocalCaches(false);
        this.init(true);
    },

    getComplianceExportData(exportedBy = "William Gerishom William (Super Administrator)") {
        const safeMembers = this.getMembers().map(m => {
            const copy = { ...m };
            delete copy.password_hash;
            delete copy._unsynced_cloud;
            return copy;
        });

        return {
            exported_at: new Date().toISOString(),
            exported_by: exportedBy,
            compliance: "Tanzania Personal Data Protection Act, 2022 (PDPA - Article 15)",
            members: safeMembers,
            audit_logs: this.getAuditLogs(),
            attendance: this.getAttendanceRecords(),
            leave_requests: this.getLeaveRequests(),
            support_tickets: this.getSupportTickets(),
            fund_ledger: this.getFundLedger(),
            announcements: this.getAnnouncements()
        };
    },

    getStats() {
        if (_isCloudConfigured()) {
            const session = this.getCurrentSession();
            if (session && this.isAdminUser(session)) {
                const members = this.getMembers();
                if (members.length > 0) {
                    return {
                        totalRegistered: members.length,
                        activeMembers: members.filter(m => m.status === "ACTIVE").length,
                        pendingApplicants: members.filter(m => m.status === "PENDING").length,
                        fundBalance: this.getFundBalance(),
                        divisionsCount: SG_CONFIG.DIVISIONS.length,
                        curriculumLevels: SG_CONFIG.CURRICULUM.length
                    };
                }
            }
            try {
                const rawStats = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.PUBLIC_STATS);
                if (rawStats) {
                    const parsed = JSON.parse(rawStats);
                    return {
                        totalRegistered: parsed.totalRegistered ?? 0,
                        activeMembers: parsed.activeMembers ?? 0,
                        pendingApplicants: parsed.pendingApplicants ?? 0,
                        fundBalance: this.getFundBalance(),
                        divisionsCount: SG_CONFIG.DIVISIONS.length,
                        curriculumLevels: SG_CONFIG.CURRICULUM.length
                    };
                }
            } catch (_) {}
            return {
                totalRegistered: "—",
                activeMembers: "—",
                pendingApplicants: "—",
                fundBalance: 0,
                divisionsCount: SG_CONFIG.DIVISIONS.length,
                curriculumLevels: SG_CONFIG.CURRICULUM.length
            };
        }

        const members = this.getMembers();
        return {
            totalRegistered: members.length,
            activeMembers: members.filter(m => m.status === "ACTIVE").length,
            pendingApplicants: members.filter(m => m.status === "PENDING").length,
            fundBalance: this.getFundBalance(),
            divisionsCount: SG_CONFIG.DIVISIONS.length,
            curriculumLevels: SG_CONFIG.CURRICULUM.length
        };
    }
};

SGStore.init();

if (typeof window !== "undefined") {
    window.SGStore = SGStore;
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = SGStore;
}
