/**
 * SILLYGER (SG) Hybrid LocalStorage + Supabase Cloud State Engine (v1.4)
 * Features:
 * - Salted SHA-256 Password Hashing (Katiba Art. 6.13 & PDPA 2022 Art. 15)
 * - Sequential Atomic SG-xxxxxx Member ID Generation
 * - Full Cloud Sync with Supabase PostgreSQL (Members, Announcements, Fund, Attendance, Leaves, Tickets, Settings, Audit Logs)
 * - Cross-Tab BroadcastChannel Real-Time Sync
 */

if (typeof SG_CONFIG === "undefined" && typeof require === "function") {
    const cfg = require("./config.js");
    global.SG_CONFIG = cfg.SG_CONFIG || cfg;
    global.SGUtils = cfg.SGUtils;
}

// Safe storage abstraction (browser localStorage with in-memory fallback for headless/Node testing)
const _sgStorage = (typeof localStorage !== "undefined") ? localStorage : {
    _data: {},
    getItem(k) { return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
};

// Pure-JS UTF-8 SHA-256 (works identically on HTTPS, HTTP, file://, and Node.js)
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

// Precomputed salted SHA-256 hash for initial Super Administrator bootstrap
const _FOUNDER_INITIAL_HASH = "sha256$sg_founder_v14$7720a68116abeee3a59cbb401ecdb701739d19b567a7d28031c6880d6ae8c1ac";

let _supabaseClient = null;
let _supabaseCacheKey = "";
let _isInitialized = false;
let _syncInFlight = null;
let _lastSyncAt = 0;
const _pendingWrites = new Set();

function _trackWrite(promiseLike) {
    if (!promiseLike || typeof promiseLike.then !== "function") return Promise.resolve();
    const tracked = Promise.resolve(promiseLike)
        .catch(err => {
            console.warn("Supabase write notice:", err);
        })
        .finally(() => {
            _pendingWrites.delete(tracked);
        });
    _pendingWrites.add(tracked);
    return tracked;
}

function getSupabaseClient() {
    if (typeof supabase !== "undefined" && typeof SG_CONFIG !== "undefined" && SG_CONFIG.SUPABASE && SG_CONFIG.SUPABASE.isConfigured) {
        const key = `${SG_CONFIG.SUPABASE.url}::${SG_CONFIG.SUPABASE.anonKey}`;
        if (_supabaseClient && _supabaseCacheKey === key) {
            return _supabaseClient;
        }
        try {
            _supabaseClient = supabase.createClient(SG_CONFIG.SUPABASE.url, SG_CONFIG.SUPABASE.anonKey);
            _supabaseCacheKey = key;
            return _supabaseClient;
        } catch (e) {
            console.warn("Supabase init error:", e);
        }
    }
    return null;
}

function _notifyBroadcast(payload) {
    try {
        if (typeof BroadcastChannel !== "undefined") {
            const bc = new BroadcastChannel("sg_platform_sync");
            bc.postMessage(payload);
            bc.close();
        }
    } catch (e) {}
    try {
        if (typeof window !== "undefined" && typeof CustomEvent === "function") {
            window.dispatchEvent(new CustomEvent("sg:synced", { detail: payload }));
        }
    } catch (e) {}
}

const SGStore = {
    // Cryptographic password helpers
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
            const salt = parts[1];
            const expected = parts[2];
            const actual = _sha256Utf8(`${salt}:${String(plainPassword)}`);
            return actual === expected;
        }
        // Legacy fallback for pre-migration local entries
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
        const adminRoles = [
            "Administrator",
            "Membership Administrator",
            "Education Administrator",
            "Finance Administrator"
        ];
        return adminRoles.includes(member.role);
    },

    async flushPendingWrites() {
        if (_pendingWrites.size === 0) return;
        await Promise.allSettled(Array.from(_pendingWrites));
    },

    // Initialize clean store & upgrade any legacy plaintext hashes
    init(force = false) {
        if (_isInitialized && !force) return;
        _isInitialized = true;

        let members = [];
        try {
            const raw = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.APPLICANTS);
            members = raw ? JSON.parse(raw) : [];
        } catch (e) {
            members = [];
        }

        // 1. Purge any mock / test users
        members = members.filter(m => {
            if (!m) return false;
            const u = (m.username || "").toLowerCase();
            const e = (m.email || "").toLowerCase();
            const id = (m.id || "");
            if (u === "baraka_dev" || u === "amina_ai" || u === "test_user") return false;
            if (e === "baraka@example.com" || e === "amina@example.com" || e === "admin@sillyger.org" || e === "test@example.com") return false;
            if (id.startsWith("usr_mock")) return false;
            return true;
        });

        // 2. Auto-upgrade any legacy plaintext passwords to salted SHA-256
        members = members.map(m => {
            if (m.password_hash && !this.isHashedPassword(m.password_hash)) {
                return {
                    ...m,
                    password_hash: this.hashPassword(m.password_hash)
                };
            }
            return m;
        });

        // 3. Ensure William Gerishom William (Founder & Super Administrator) is strictly present
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
        } else {
            // Preserve custom password hash if founder changed their password!
            const existingHash = members[adminIdx].password_hash;
            members[adminIdx] = {
                ...founderTemplate,
                ...members[adminIdx],
                member_id: "SG-000001",
                username: "willyger",
                role: "Super Administrator",
                status: "ACTIVE",
                password_hash: (existingHash && this.isHashedPassword(existingHash)) ? existingHash : _FOUNDER_INITIAL_HASH
            };
        }

        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.APPLICANTS, JSON.stringify(members));

        // 4. Purge legacy mock attendance & fund records
        try {
            const rawAtt = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.ATTENDANCE);
            if (rawAtt) {
                const attList = (JSON.parse(rawAtt) || []).filter(a => a && !["att_001", "att_002", "att_003"].includes(a.id));
                _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ATTENDANCE, JSON.stringify(attList));
            }
        } catch (e) {}

        try {
            const rawFund = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.FUND_LEDGER);
            if (rawFund) {
                const fundList = (JSON.parse(rawFund) || []).filter(tx => tx && !["tx_001", "tx_002"].includes(tx.id));
                _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.FUND_LEDGER, JSON.stringify(fundList));
            }
        } catch (e) {}

        // 5. Initialize clean audit log if missing
        if (!_sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.AUDIT_LOGS)) {
            const initialAudit = [
                {
                    id: "log_001",
                    action: "SYSTEM_INITIALIZATION",
                    actor: "willyger (SG-000001)",
                    target: "SILLYGER Governance Engine v1.4",
                    details: "Initialized clean SG Community Platform with 11 Divisions and 10 Curriculum Levels under Super Administrator William Gerishom William.",
                    timestamp: new Date().toISOString()
                }
            ];
            _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialAudit));
        }

        // Trigger initial cloud sync if Supabase is configured
        this.syncWithSupabase();
    },

    // Full Bi-Directional / Pull Cloud Sync with Supabase
    async syncWithSupabase(force = false) {
        const client = getSupabaseClient();
        if (!client) return false;

        const now = Date.now();
        if (!force && (now - _lastSyncAt < 2500)) return false;
        if (_syncInFlight) return _syncInFlight;

        _lastSyncAt = now;
        _syncInFlight = (async () => {
            try {
                // Ensure any in-flight writes commit to Supabase before pulling
                await this.flushPendingWrites();

                const [mRes, aRes, fRes, attRes, lRes, tRes, logRes, sRes] = await Promise.all([
                    client.from("members").select("*").order("created_at", { ascending: true }),
                    client.from("announcements").select("*").order("created_at", { ascending: false }),
                    client.from("fund_ledger").select("*").order("created_at", { ascending: false }),
                    client.from("attendance").select("*").order("created_at", { ascending: false }),
                    client.from("leave_requests").select("*").order("created_at", { ascending: false }),
                    client.from("support_tickets").select("*").order("created_at", { ascending: false }),
                    client.from("audit_logs").select("*").order("timestamp", { ascending: false }).limit(300),
                    client.from("platform_settings").select("*")
                ]);

                if (!mRes.error && Array.isArray(mRes.data) && mRes.data.length > 0) {
                    const localBefore = this.getMembers();
                    const normalizedMembers = mRes.data.map(m => ({
                        ...m,
                        password_hash: this.isHashedPassword(m.password_hash)
                            ? m.password_hash
                            : (m.password_hash ? this.hashPassword(m.password_hash) : _FOUNDER_INITIAL_HASH)
                    }));

                    // Push & merge any local-only applicants registered before Supabase was connected
                    const cloudUsernames = new Set(normalizedMembers.map(m => (m.username || "").toLowerCase()));
                    const cloudEmails = new Set(normalizedMembers.map(m => (m.email || "").toLowerCase()));
                    const unsyncedLocals = localBefore.filter(
                        lm => lm && lm._unsynced_cloud && !cloudUsernames.has((lm.username || "").toLowerCase()) && !cloudEmails.has((lm.email || "").toLowerCase())
                    );

                    for (const lm of unsyncedLocals) {
                        const cleanRecord = { ...lm };
                        delete cleanRecord._unsynced_cloud;
                        normalizedMembers.push(cleanRecord);
                        _trackWrite(client.from("members").insert([cleanRecord]));
                    }

                    this.saveMembers(normalizedMembers);

                    // Keep current logged-in session status fresh (e.g. PENDING -> ACTIVE)
                    const cur = this.getCurrentSession();
                    if (cur) {
                        const updatedSelf = normalizedMembers.find(
                            m => m.id === cur.id || m.username === cur.username || m.email === cur.email
                        );
                        if (updatedSelf) this.setCurrentSession(updatedSelf);
                    }
                }

                if (!aRes.error && Array.isArray(aRes.data)) {
                    _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(aRes.data));
                }

                if (!fRes.error && Array.isArray(fRes.data)) {
                    const normFund = fRes.data.map(tx => ({
                        ...tx,
                        amount: parseFloat(tx.amount) || 0,
                        date: tx.date || tx.tx_date || (tx.created_at ? tx.created_at.split("T")[0] : "")
                    }));
                    _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.FUND_LEDGER, JSON.stringify(normFund));
                }

                if (!attRes.error && Array.isArray(attRes.data)) {
                    const normAtt = attRes.data.map(a => ({
                        ...a,
                        date: a.date || a.session_date || (a.created_at ? a.created_at.split("T")[0] : "")
                    }));
                    _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ATTENDANCE, JSON.stringify(normAtt));
                }

                if (!lRes.error && Array.isArray(lRes.data)) {
                    const normLeaves = lRes.data.map(l => ({
                        ...l,
                        submitted_at: l.submitted_at || l.created_at
                    }));
                    _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(normLeaves));
                }

                if (!tRes.error && Array.isArray(tRes.data)) {
                    _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(tRes.data));
                }

                if (!logRes.error && Array.isArray(logRes.data) && logRes.data.length > 0) {
                    _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logRes.data));
                }

                if (!sRes.error && Array.isArray(sRes.data) && sRes.data.length > 0) {
                    const currentSettings = this.getPlatformSettings();
                    sRes.data.forEach(row => {
                        if (row && row.key) currentSettings[row.key] = row.value;
                    });
                    _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(currentSettings));
                }

                _notifyBroadcast({ type: "CLOUD_SYNC_COMPLETE" });
                return true;
            } catch (e) {
                console.warn("Supabase sync notice:", e);
                return false;
            } finally {
                _syncInFlight = null;
            }
        })();

        return _syncInFlight;
    },

    // Platform Settings (WhatsApp Invite Link, Active Session Name, etc.)
    getPlatformSettings() {
        try {
            const raw = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.SETTINGS);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    },

    updatePlatformSettings(updates, adminActor = "willyger") {
        const current = this.getPlatformSettings();
        const next = { ...current, ...updates, updated_at: new Date().toISOString() };
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(next));

        const client = getSupabaseClient();
        if (client) {
            const rows = Object.keys(updates).map(key => ({
                key,
                value: String(updates[key]),
                updated_by: adminActor,
                updated_at: new Date().toISOString()
            }));
            _trackWrite(
                client.from("platform_settings").upsert(rows, { onConflict: "key" }).then(({ error }) => {
                    if (error) console.warn("Supabase settings upsert notice:", error);
                })
            );
        }

        this.addAuditLog({
            action: "PLATFORM_SETTINGS_UPDATED",
            actor: adminActor,
            target: Object.keys(updates).join(", "),
            details: "Super Administrator updated official platform configuration."
        });

        _notifyBroadcast({ type: "SETTINGS_UPDATED" });
        return next;
    },

    // Get all members / applicants
    getMembers() {
        this.init();
        try {
            return JSON.parse(_sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.APPLICANTS)) || [];
        } catch (e) {
            console.error("Error reading applicants store", e);
            return [];
        }
    },

    saveMembers(members) {
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.APPLICANTS, JSON.stringify(members));
    },

    // Find member by email, username, SG-ID, or phone (with auto-normalization)
    findMemberByCredential(credential) {
        const members = this.getMembers();
        const search = (credential || "").trim().toLowerCase();
        if (!search) return null;
        const normalizedPhone = this.normalizePhone(search);
        const digitsSearch = search.replace(/[\s\-+]/g, "");

        return members.find(m =>
            (m.email && m.email.toLowerCase() === search) ||
            (m.username && m.username.toLowerCase() === search) ||
            (m.member_id && m.member_id.toLowerCase() === search) ||
            (m.phone && m.phone === normalizedPhone) ||
            (digitsSearch.length >= 9 && m.phone && m.phone.replace(/[\s\-+]/g, "") === digitsSearch)
        ) || null;
    },

    // Authenticate member securely (auto-upgrades legacy hash if needed)
    authenticateMember(credential, plainPassword) {
        const member = this.findMemberByCredential(credential);
        if (!member) {
            throw new Error("Hakuna akaunti iliyopatikana kwa taarifa hizi. Hakikisha email, username au namba ya WhatsApp uliyoweka ni sahihi.");
        }
        if (!this.verifyPassword(plainPassword, member.password_hash)) {
            throw new Error("Nenosiri (Password) si sahihi. Tafadhali hakiki na ujaribu tena.");
        }

        // Upgrade legacy unhashed password if encountered
        if (!this.isHashedPassword(member.password_hash)) {
            const members = this.getMembers();
            const idx = members.findIndex(m => m.id === member.id);
            if (idx !== -1) {
                members[idx].password_hash = this.hashPassword(plainPassword);
                this.saveMembers(members);
                member.password_hash = members[idx].password_hash;
            }
        }

        return member;
    },

    // Change own password (Member or Admin)
    changePassword(memberId, currentPassword, newPassword) {
        if (!newPassword || String(newPassword).length < 6) {
            throw new Error("Nenosiri jipya lazima liwe na angalau herufi 6.");
        }
        const members = this.getMembers();
        const idx = members.findIndex(m => m.id === memberId);
        if (idx === -1) throw new Error("Akaunti haikupatikana.");

        const member = members[idx];
        if (!this.verifyPassword(currentPassword, member.password_hash)) {
            throw new Error("Nenosiri la sasa si sahihi.");
        }

        const newHash = this.hashPassword(newPassword);
        members[idx].password_hash = newHash;
        this.saveMembers(members);

        const client = getSupabaseClient();
        if (client) {
            _trackWrite(
                client.from("members").update({ password_hash: newHash }).eq("username", member.username).then(({ error }) => {
                    if (error) console.warn("Supabase password update notice:", error);
                })
            );
        }

        this.addAuditLog({
            action: "PASSWORD_CHANGED",
            actor: member.username,
            target: member.member_id || member.username,
            details: "Account password updated with salted SHA-256 hash."
        });

        return true;
    },

    // Super Administrator password reset for member support
    adminResetPassword(memberId, newPassword, adminActor = "willyger") {
        if (!newPassword || String(newPassword).length < 6) {
            throw new Error("Nenosiri jipya lazima liwe na angalau herufi 6.");
        }
        const members = this.getMembers();
        const idx = members.findIndex(m => m.id === memberId);
        if (idx === -1) throw new Error("Mwanachama hakupatikana.");

        const newHash = this.hashPassword(newPassword);
        members[idx].password_hash = newHash;
        this.saveMembers(members);

        const client = getSupabaseClient();
        if (client) {
            _trackWrite(client.from("members").update({ password_hash: newHash }).eq("username", members[idx].username));
        }

        this.addAuditLog({
            action: "ADMIN_PASSWORD_RESET",
            actor: adminActor,
            target: `${members[idx].username} (${members[idx].member_id || "PENDING"})`,
            details: "Password reset performed upon member verification."
        });

        return true;
    },

    findMemberById(id) {
        return this.getMembers().find(m => m.id === id) || null;
    },

    // Register a new Applicant (Default status = 'PENDING', member_id = null)
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
            throw new Error("Barua pepe hii (Email) tayari imesajiliwa. Tafadhali ingia au tumia barua pepe nyingine.");
        }
        if (members.some(m => m.username && m.username.toLowerCase() === normalizedUsername)) {
            throw new Error("Jina la mtumiaji (Username) hili tayari limetumika. Tafadhali chagua jina jingine.");
        }
        if (members.some(m => m.phone === normalizedPhone)) {
            throw new Error("Namba hii ya WhatsApp tayari imesajiliwa. Tumia namba yako halisi au ingia kwenye Portal.");
        }

        const passwordHash = this.hashPassword(data.password);

        const newApplicant = {
            id: "usr_" + Date.now().toString(36) + "_" + _randomSaltHex(6),
            member_id: null, // Strict null while PENDING
            full_name: (data.full_name || "").trim(),
            username: normalizedUsername,
            email: normalizedEmail,
            phone: normalizedPhone,
            password_hash: passwordHash,
            track: data.track || "Computer Fundamentals & Electronics",
            experience: data.experience || "Beginner",
            motivation: (data.motivation || "").trim(),
            role: "Applicant",
            status: "PENDING",
            agreed_constitution: !!data.agreed_constitution,
            agreed_ethics: !!data.agreed_ethics,
            agreed_pdpa: !!data.agreed_pdpa,
            created_at: new Date().toISOString(),
            approved_at: null,
            approved_by: null
        };

        const client = getSupabaseClient();
        if (!client) {
            newApplicant._unsynced_cloud = true;
        }

        members.push(newApplicant);
        this.saveMembers(members);

        if (client) {
            _trackWrite(
                client.from("members").insert([{
                    id: newApplicant.id,
                    full_name: newApplicant.full_name,
                    username: newApplicant.username,
                    email: newApplicant.email,
                    phone: newApplicant.phone,
                    password_hash: newApplicant.password_hash,
                    track: newApplicant.track,
                    experience: newApplicant.experience,
                    motivation: newApplicant.motivation,
                    role: "Applicant",
                    status: "PENDING",
                    member_id: null,
                    agreed_constitution: newApplicant.agreed_constitution,
                    agreed_ethics: newApplicant.agreed_ethics,
                    agreed_pdpa: newApplicant.agreed_pdpa,
                    created_at: newApplicant.created_at
                }]).then(({ error }) => {
                    if (error) {
                        console.error("Supabase insert error:", error);
                        const curMembers = this.getMembers();
                        const mIdx = curMembers.findIndex(x => x.id === newApplicant.id);
                        if (mIdx !== -1) {
                            curMembers[mIdx]._unsynced_cloud = true;
                            this.saveMembers(curMembers);
                        }
                    }
                })
            );
        }

        this.addAuditLog({
            action: "APPLICANT_REGISTERED",
            actor: newApplicant.username,
            target: newApplicant.full_name,
            details: `New registration received from ${newApplicant.phone} (${newApplicant.track}). Status: PENDING review.`
        });

        _notifyBroadcast({ type: "APPLICANT_REGISTERED", applicant: { id: newApplicant.id, username: newApplicant.username } });
        return newApplicant;
    },

    // Generate Next Sequential SG-xxxxxx ID
    getNextMemberId() {
        const members = this.getMembers();
        let maxNum = 0;
        members.forEach(m => {
            if (m.member_id && m.member_id.startsWith("SG-")) {
                const numPart = parseInt(m.member_id.replace("SG-", ""), 10);
                if (!isNaN(numPart) && numPart > maxNum) {
                    maxNum = numPart;
                }
            }
        });
        const nextNum = maxNum + 1;
        return "SG-" + String(nextNum).padStart(6, "0");
    },

    // Admin Approves Member (Transitions status PENDING -> ACTIVE & assigns SG-xxxxxx)
    approveMember(applicantId, adminActor = "ADMIN") {
        const members = this.getMembers();
        const index = members.findIndex(m => m.id === applicantId);
        if (index === -1) throw new Error("Mwanachama hakupatikana.");

        const member = members[index];
        if (member.status === "ACTIVE" && member.member_id) {
            throw new Error("Mwanachama huyu tayari ni ACTIVE.");
        }

        if (!member.member_id) {
            member.member_id = this.getNextMemberId();
        }

        member.status = "ACTIVE";
        member.role = member.role === "Applicant" ? "Member" : member.role;
        member.approved_at = new Date().toISOString();
        member.approved_by = adminActor;

        members[index] = member;
        this.saveMembers(members);

        const client = getSupabaseClient();
        if (client) {
            _trackWrite(
                client.rpc("approve_member_and_assign_id", {
                    target_user_id: member.id,
                    admin_identifier: adminActor
                }).then(({ data, error }) => {
                    if (!error && data && data.member_id) {
                        const latest = this.getMembers();
                        const lIdx = latest.findIndex(x => x.id === member.id);
                        if (lIdx !== -1 && latest[lIdx].member_id !== data.member_id) {
                            latest[lIdx].member_id = data.member_id;
                            this.saveMembers(latest);
                        }
                        return;
                    }
                    return client.from("members").update({
                        member_id: member.member_id,
                        status: "ACTIVE",
                        role: member.role,
                        approved_at: member.approved_at,
                        approved_by: member.approved_by
                    }).eq("username", member.username);
                })
            );
        }

        this.addAuditLog({
            action: "MEMBER_APPROVED",
            actor: adminActor,
            target: `${member.username} (${member.member_id})`,
            details: `Application approved. Assigned Unique Member ID: ${member.member_id}. WhatsApp Community gate unlocked.`
        });

        _notifyBroadcast({ type: "MEMBER_APPROVED", id: member.id, member_id: member.member_id });
        return member;
    },

    // Update status (e.g. ACTIVE, ON_HOLD, SUSPENDED, INACTIVE, TERMINATED)
    updateMemberStatus(applicantId, newStatus, reason = "", adminActor = "ADMIN") {
        const validStatuses = ["PENDING", "ACTIVE", "ON_HOLD", "SUSPENDED", "INACTIVE", "TERMINATED"];
        if (!validStatuses.includes(newStatus)) {
            throw new Error(`Hali batili: ${newStatus}`);
        }

        const members = this.getMembers();
        const index = members.findIndex(m => m.id === applicantId);
        if (index === -1) throw new Error("Mwanachama hakupatikana.");

        const member = members[index];
        if (this.isFounderMember(member) && newStatus !== "ACTIVE") {
            throw new Error("Huwezi kusimamisha au kubadili hadhi ya akaunti ya Mwanzilishi / Super Administrator!");
        }

        const oldStatus = member.status;
        member.status = newStatus;

        // Auto-assign sequential SG-ID if promoted to ACTIVE without an ID!
        if (newStatus === "ACTIVE" && !member.member_id) {
            member.member_id = this.getNextMemberId();
            if (member.role === "Applicant") member.role = "Member";
            member.approved_at = member.approved_at || new Date().toISOString();
            member.approved_by = member.approved_by || adminActor;
        }

        members[index] = member;
        this.saveMembers(members);

        const client = getSupabaseClient();
        if (client) {
            _trackWrite(
                client.from("members").update({
                    status: member.status,
                    member_id: member.member_id,
                    role: member.role,
                    approved_at: member.approved_at,
                    approved_by: member.approved_by
                }).eq("username", member.username)
            );
        }

        this.addAuditLog({
            action: `STATUS_CHANGE_${newStatus}`,
            actor: adminActor,
            target: `${member.username} (${member.member_id || "NO-ID"})`,
            details: `Status altered from ${oldStatus} to ${newStatus}. Reason: ${reason || "Administrative action"}.`
        });

        _notifyBroadcast({ type: "MEMBER_UPDATED", id: member.id });
        return member;
    },

    // SUPER ADMINISTRATOR: Role-Based Access Control (RBAC - Article 7.4 & Appendix A4)
    updateMemberRole(applicantId, newRole, reason = "", adminActor = "SUPER_ADMIN") {
        const validRoles = [
            "Applicant",
            "Member",
            "Instructor",
            "Project Lead",
            "Community Moderator",
            "Membership Administrator",
            "Education Administrator",
            "Finance Administrator",
            "Administrator",
            "Super Administrator"
        ];
        if (!validRoles.includes(newRole)) {
            throw new Error(`Jukumu batili: ${newRole}`);
        }

        const members = this.getMembers();
        const index = members.findIndex(m => m.id === applicantId);
        if (index === -1) throw new Error("Mwanachama hakupatikana.");

        const member = members[index];
        if (this.isFounderMember(member) && newRole !== "Super Administrator") {
            throw new Error("Huwezi kushusha cheo cha Mwanzilishi / Super Administrator (SG-000001)!");
        }

        const oldRole = member.role;
        member.role = newRole;
        members[index] = member;
        this.saveMembers(members);

        const client = getSupabaseClient();
        if (client) {
            _trackWrite(client.from("members").update({ role: newRole }).eq("username", member.username));
        }

        this.addAuditLog({
            action: `ROLE_CHANGE_${newRole.toUpperCase().replace(/\s+/g, "_")}`,
            actor: adminActor,
            target: `${member.username} (${member.member_id || "NO-ID"})`,
            details: `Role updated from ${oldRole} to ${newRole}. Reason: ${reason || "Executive assignment"}.`
        });

        _notifyBroadcast({ type: "MEMBER_UPDATED", id: member.id });
        return member;
    },

    // SUPER ADMINISTRATOR: Full Member Record Editor
    updateMemberFullRecord(applicantId, updates, adminActor = "SUPER_ADMIN") {
        const members = this.getMembers();
        const index = members.findIndex(m => m.id === applicantId);
        if (index === -1) throw new Error("Mwanachama hakupatikana.");

        const member = members[index];
        const safeUpdates = { ...updates };
        delete safeUpdates.password_hash;
        if (this.isFounderMember(member)) {
            delete safeUpdates.role;
            delete safeUpdates.status;
            delete safeUpdates.member_id;
        }

        Object.assign(member, safeUpdates);
        members[index] = member;
        this.saveMembers(members);

        const client = getSupabaseClient();
        if (client) {
            _trackWrite(client.from("members").update(safeUpdates).eq("username", member.username));
        }

        this.addAuditLog({
            action: "MEMBER_DOSSIER_UPDATED",
            actor: adminActor,
            target: `${member.username} (${member.member_id || "NO-ID"})`,
            details: "Super Administrator updated dossier parameters."
        });

        return member;
    },

    // SUPER ADMINISTRATOR: Manual or Regenerated Member ID
    assignCustomMemberId(applicantId, customId, reason = "", adminActor = "SUPER_ADMIN") {
        const members = this.getMembers();
        const index = members.findIndex(m => m.id === applicantId);
        if (index === -1) throw new Error("Mwanachama hakupatikana.");

        const member = members[index];
        const formattedId = (customId || "").trim().toUpperCase();
        if (this.isFounderMember(member) && formattedId !== "SG-000001") {
            throw new Error("Member ID ya Mwanzilishi (SG-000001) haiwezi kubadilishwa!");
        }
        if (!/^SG-\d{6}$/.test(formattedId)) {
            throw new Error("Muundo wa Member ID lazima uwe SG-XXXXXX (mfano: SG-000002).");
        }
        if (members.some((m, idx) => idx !== index && m.member_id === formattedId)) {
            throw new Error(`Namba ya mwanachama ${formattedId} tayari inatumiwa na mtu mwingine.`);
        }

        const oldId = member.member_id;
        member.member_id = formattedId;
        members[index] = member;
        this.saveMembers(members);

        const client = getSupabaseClient();
        if (client) {
            _trackWrite(client.from("members").update({ member_id: formattedId }).eq("username", member.username));
        }

        this.addAuditLog({
            action: "MEMBER_ID_OVERRIDE",
            actor: adminActor,
            target: member.username,
            details: `Member ID changed from ${oldId || "NULL"} to ${formattedId}. Reason: ${reason || "Administrative adjustment"}.`
        });

        return member;
    },

    // SUPER ADMINISTRATOR: Reject / Delete Member or Applicant
    deleteMember(applicantId, adminActor = "SUPER_ADMIN") {
        const members = this.getMembers();
        const index = members.findIndex(m => m.id === applicantId);
        if (index === -1) throw new Error("Mwanachama hakupatikana.");

        const member = members[index];
        if (this.isFounderMember(member)) {
            throw new Error("Huwezi kufuta akaunti ya Mwanzilishi / Super Administrator!");
        }

        members.splice(index, 1);
        this.saveMembers(members);

        const client = getSupabaseClient();
        if (client) {
            _trackWrite(client.from("members").delete().eq("username", member.username));
        }

        this.addAuditLog({
            action: "MEMBER_DELETED",
            actor: adminActor,
            target: `${member.username} (${member.full_name})`,
            details: `Record deleted from system by ${adminActor}.`
        });

        _notifyBroadcast({ type: "MEMBER_DELETED", id: applicantId });
        return true;
    },

    // Factory Reset: Clean all stored caches and keep strictly William Gerishom William as Super Admin
    resetToPristine() {
        _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.APPLICANTS);
        _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.ATTENDANCE);
        _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.FUND_LEDGER);
        _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.LEAVE_REQUESTS);
        _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.SUPPORT_TICKETS);
        _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.ANNOUNCEMENTS);
        _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.AUDIT_LOGS);
        this.init(true);
    },

    // OFFICIAL ANNOUNCEMENTS (Article 6.8 & 11)
    getAnnouncements() {
        try {
            const raw = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.ANNOUNCEMENTS);
            if (raw) return JSON.parse(raw) || [];
            return [
                {
                    id: "anc_001",
                    title: "Uzinduzi Rasmi wa SILLYGER Community Platform v1.4",
                    content: "Karibuni Sillygerians! Tovuti rasmi, mfumo wa uanachama na mtaala wa hatua 10 sasa vimefunguliwa rasmi. Kila mwanachama anatakiwa kupitia Katiba v1.4.",
                    priority: "HIGH",
                    author: "William Gerishom William (Super Admin)",
                    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
                }
            ];
        } catch (e) {
            return [];
        }
    },

    createAnnouncement({ title, content, priority = "NORMAL", author = "Super Administrator" }) {
        const list = this.getAnnouncements();
        const anc = {
            id: "anc_" + Date.now().toString(36) + "_" + _randomSaltHex(4),
            title: String(title || "").trim(),
            content: String(content || "").trim(),
            priority: priority === "HIGH" ? "HIGH" : "NORMAL",
            author,
            created_at: new Date().toISOString()
        };
        list.unshift(anc);
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));

        const client = getSupabaseClient();
        if (client) {
            _trackWrite(
                client.from("announcements").insert([anc]).then(({ error }) => {
                    if (error) console.warn("Supabase announcement insert notice:", error);
                })
            );
        }

        this.addAuditLog({
            action: "ANNOUNCEMENT_PUBLISHED",
            actor: author,
            target: anc.title,
            details: "Official announcement broadcasted to all Sillygerians."
        });

        _notifyBroadcast({ type: "ANNOUNCEMENT_PUBLISHED" });
        return anc;
    },

    deleteAnnouncement(ancId, adminActor = "willyger") {
        const list = this.getAnnouncements();
        const idx = list.findIndex(a => a.id === ancId);
        if (idx === -1) return false;
        const removed = list[idx];
        list.splice(idx, 1);
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));

        const client = getSupabaseClient();
        if (client) {
            _trackWrite(client.from("announcements").delete().eq("id", ancId));
        }

        this.addAuditLog({
            action: "ANNOUNCEMENT_REMOVED",
            actor: adminActor,
            target: removed.title,
            details: "Announcement removed from member feed."
        });

        _notifyBroadcast({ type: "ANNOUNCEMENT_REMOVED" });
        return true;
    },

    // SG COMMUNITY FUND LEDGER (Article 13)
    getFundLedger() {
        try {
            const raw = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.FUND_LEDGER);
            const list = raw ? JSON.parse(raw) : [];
            return list.filter(tx => tx && !["tx_001", "tx_002"].includes(tx.id));
        } catch (e) {
            return [];
        }
    },

    addFundTransaction({ type, amount, category, description, actor = "willyger" }) {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            throw new Error("Kiasi cha muamala lazima kiwe kikubwa kuliko sifuri (0).");
        }

        const list = this.getFundLedger();
        const txDate = new Date().toISOString().split("T")[0];
        const tx = {
            id: "tx_" + Date.now().toString(36) + "_" + _randomSaltHex(4),
            type: type === "INCOME" ? "INCOME" : "EXPENSE",
            amount: parsedAmount,
            category: String(category || "Infrastructure").trim(),
            description: String(description || "").trim(),
            actor,
            date: txDate
        };
        list.unshift(tx);
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.FUND_LEDGER, JSON.stringify(list));

        const client = getSupabaseClient();
        if (client) {
            _trackWrite(
                client.from("fund_ledger").insert([{
                    id: tx.id,
                    type: tx.type,
                    amount: tx.amount,
                    category: tx.category,
                    description: tx.description,
                    actor: tx.actor,
                    tx_date: txDate
                }]).then(({ error }) => {
                    if (error) console.warn("Supabase fund insert notice:", error);
                })
            );
        }

        this.addAuditLog({
            action: `FUND_TRANSACTION_${tx.type}`,
            actor,
            target: `TZS ${tx.amount.toLocaleString()} (${tx.category})`,
            details: tx.description
        });

        _notifyBroadcast({ type: "FUND_UPDATED" });
        return tx;
    },

    getFundBalance() {
        const list = this.getFundLedger();
        return list.reduce((total, tx) => {
            const amt = parseFloat(tx.amount) || 0;
            return tx.type === "INCOME" ? total + amt : total - amt;
        }, 0);
    },

    // IMMUTABLE AUDIT LOGS (Article 7.7)
    getAuditLogs() {
        this.init();
        try {
            return JSON.parse(_sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.AUDIT_LOGS)) || [];
        } catch (e) {
            return [];
        }
    },

    addAuditLog({ action, actor, target, details }) {
        const logs = this.getAuditLogs();
        const entry = {
            id: "log_" + Date.now().toString(36) + "_" + _randomSaltHex(4),
            action: String(action || "EVENT"),
            actor: String(actor || "SYSTEM"),
            target: String(target || "N/A"),
            details: String(details || ""),
            timestamp: new Date().toISOString()
        };
        logs.unshift(entry);
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 500)));

        const client = getSupabaseClient();
        if (client) {
            _trackWrite(
                client.from("audit_logs").insert([entry]).then(({ error }) => {
                    if (error) console.warn("Supabase audit insert notice:", error);
                })
            );
        }

        return entry;
    },

    // SESSION MANAGEMENT
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
            // Always hydrate latest member state if present in store
            if (parsed && parsed.id) {
                const live = this.getMembers().find(m => m.id === parsed.id || (m.username && m.username === parsed.username));
                if (live) {
                    const fresh = { ...live };
                    delete fresh.password_hash;
                    return fresh;
                }
            }
            return parsed;
        } catch (e) {
            return null;
        }
    },

    logout() {
        const user = this.getCurrentSession();
        if (user) {
            this.addAuditLog({
                action: "USER_LOGOUT",
                actor: user.username,
                target: user.full_name,
                details: "Member signed out from portal session."
            });
        }
        _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.ACTIVE_SESSION);
    },

    // TANZANIA PHONE NORMALIZATION & VALIDATION
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

    // ATTENDANCE RECORDS (Article 6.6 & 9)
    getAttendanceRecords(memberId = null) {
        this.init();
        try {
            const raw = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.ATTENDANCE);
            const list = (raw ? JSON.parse(raw) : []).filter(a => a && !["att_001", "att_002", "att_003"].includes(a.id));
            if (memberId) {
                return list.filter(a => a.member_id === memberId);
            }
            return list;
        } catch (e) {
            return [];
        }
    },

    recordPlannedAttendance(memberId, sessionTitle) {
        if (!memberId) throw new Error("Wanachama walioidhinishwa (ACTIVE) pekee ndio wanaweza kufanya check-in.");
        const title = String(sessionTitle || "").trim() || "Kipindi cha Mafunzo ya SILLYGER";
        const today = new Date().toISOString().split("T")[0];

        const list = this.getAttendanceRecords();
        const duplicate = list.find(
            a => a.member_id === memberId && (a.date === today || a.session_date === today) && a.session_title.toLowerCase() === title.toLowerCase()
        );
        if (duplicate) {
            throw new Error(`Tayari umeshafanya check-in kwenye kipindi cha "${title}" leo (${today}).`);
        }

        const record = {
            id: "att_" + Date.now().toString(36) + "_" + _randomSaltHex(4),
            member_id: memberId,
            session_title: title,
            date: today,
            session_date: today,
            is_planned: true,
            is_verified: false, // Article 9.3: Planned != Verified
            verified_by: null,
            created_at: new Date().toISOString()
        };
        list.unshift(record);
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));

        const client = getSupabaseClient();
        if (client) {
            _trackWrite(
                client.from("attendance").insert([{
                    id: record.id,
                    member_id: record.member_id,
                    session_title: record.session_title,
                    session_date: today,
                    is_planned: true,
                    is_verified: false,
                    created_at: record.created_at
                }]).then(({ error }) => {
                    if (error) console.warn("Supabase attendance insert notice:", error);
                })
            );
        }

        this.addAuditLog({
            action: "ATTENDANCE_CHECKIN",
            actor: memberId,
            target: record.session_title,
            details: `Member checked-in (Planned attendance recorded for ${today}).`
        });

        _notifyBroadcast({ type: "ATTENDANCE_UPDATED" });
        return record;
    },

    verifyAttendance(recordId, verifier = "William Gerishom (Super Admin)") {
        const list = this.getAttendanceRecords();
        const idx = list.findIndex(r => r.id === recordId);
        if (idx === -1) return null;

        list[idx].is_verified = true;
        list[idx].verified_by = verifier;
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));

        const client = getSupabaseClient();
        if (client) {
            _trackWrite(client.from("attendance").update({ is_verified: true, verified_by: verifier }).eq("id", recordId));
        }

        this.addAuditLog({
            action: "ATTENDANCE_VERIFIED",
            actor: verifier,
            target: list[idx].member_id,
            details: `Attendance verified for ${list[idx].session_title}.`
        });

        _notifyBroadcast({ type: "ATTENDANCE_UPDATED" });
        return list[idx];
    },

    verifyAllAttendance(verifier = "William Gerishom (Super Admin)") {
        const list = this.getAttendanceRecords();
        const unverifiedIds = [];
        list.forEach(a => {
            if (!a.is_verified) {
                a.is_verified = true;
                a.verified_by = verifier;
                unverifiedIds.push(a.id);
            }
        });

        if (unverifiedIds.length > 0) {
            _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));
            const client = getSupabaseClient();
            if (client) {
                _trackWrite(client.from("attendance").update({ is_verified: true, verified_by: verifier }).in("id", unverifiedIds));
            }
            this.addAuditLog({
                action: "MASS_ATTENDANCE_VERIFIED",
                actor: verifier,
                target: "All Sessions",
                details: `Mass-verified ${unverifiedIds.length} attendance check-ins.`
            });
            _notifyBroadcast({ type: "ATTENDANCE_UPDATED" });
        }
        return unverifiedIds.length;
    },

    // LEAVE & PERMISSION REQUESTS (Article 10)
    getLeaveRequests(memberId = null) {
        try {
            const list = JSON.parse(_sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.LEAVE_REQUESTS)) || [];
            return memberId ? list.filter(l => l.member_id === memberId) : list;
        } catch (e) {
            return [];
        }
    },

    submitLeaveRequest(memberId, { reason, category, duration }) {
        if (!memberId) throw new Error("Wanachama walioidhinishwa pekee wanaweza kuomba ruhusa.");
        const cleanReason = String(reason || "").trim();
        if (!cleanReason) throw new Error("Tafadhali eleza sababu ya kuomba ruhusa.");

        const list = this.getLeaveRequests();
        const nowIso = new Date().toISOString();
        const request = {
            id: "leave_" + Date.now().toString(36) + "_" + _randomSaltHex(4),
            member_id: memberId,
            category: category || "Personal",
            duration: duration || "Siku 1 - 3",
            reason: cleanReason,
            status: "PENDING_REVIEW",
            reviewed_by: null,
            submitted_at: nowIso,
            created_at: nowIso
        };
        list.unshift(request);
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(list));

        const client = getSupabaseClient();
        if (client) {
            _trackWrite(
                client.from("leave_requests").insert([{
                    id: request.id,
                    member_id: request.member_id,
                    category: request.category,
                    duration: request.duration,
                    reason: request.reason,
                    status: request.status,
                    created_at: nowIso
                }]).then(({ error }) => {
                    if (error) console.warn("Supabase leave insert notice:", error);
                })
            );
        }

        this.addAuditLog({
            action: "LEAVE_REQUESTED",
            actor: memberId,
            target: request.category,
            details: `Permission requested (${request.duration}): ${cleanReason.substring(0, 60)}`
        });

        _notifyBroadcast({ type: "LEAVE_UPDATED" });
        return request;
    },

    reviewLeaveRequest(leaveId, decision = "APPROVED", reviewer = "William Gerishom") {
        const valid = ["APPROVED", "REJECTED"];
        if (!valid.includes(decision)) throw new Error("Uamuzi batili.");

        const list = this.getLeaveRequests();
        const idx = list.findIndex(l => l.id === leaveId);
        if (idx === -1) return null;

        list[idx].status = decision;
        list[idx].reviewed_by = reviewer;
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(list));

        const client = getSupabaseClient();
        if (client) {
            _trackWrite(client.from("leave_requests").update({ status: decision, reviewed_by: reviewer }).eq("id", leaveId));
        }

        this.addAuditLog({
            action: `LEAVE_${decision}`,
            actor: reviewer,
            target: list[idx].member_id,
            details: `Leave request ${decision.toLowerCase()} for category: ${list[idx].category}.`
        });

        _notifyBroadcast({ type: "LEAVE_UPDATED" });
        return list[idx];
    },

    // SUPPORT TICKETS (Article 6.12)
    getSupportTickets(memberId = null) {
        try {
            const list = JSON.parse(_sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.SUPPORT_TICKETS)) || [];
            return memberId ? list.filter(t => t.member_id === memberId) : list;
        } catch (e) {
            return [];
        }
    },

    submitSupportTicket(memberId, { subject, category, message }) {
        const cleanSubject = String(subject || "").trim();
        const cleanMessage = String(message || "").trim();
        if (!cleanSubject || !cleanMessage) {
            throw new Error("Tafadhali jaza kichwa cha ujumbe na maelezo ya tiketi.");
        }

        const list = this.getSupportTickets();
        const ticket = {
            id: "ticket_" + Date.now().toString(36) + "_" + _randomSaltHex(4),
            member_id: memberId || "APPLICANT",
            subject: cleanSubject,
            category: category || "Account Support",
            message: cleanMessage,
            status: "OPEN",
            response: null,
            responded_by: null,
            created_at: new Date().toISOString()
        };
        list.unshift(ticket);
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(list));

        const client = getSupabaseClient();
        if (client) {
            _trackWrite(
                client.from("support_tickets").insert([ticket]).then(({ error }) => {
                    if (error) console.warn("Supabase ticket insert notice:", error);
                })
            );
        }

        this.addAuditLog({
            action: "SUPPORT_TICKET_CREATED",
            actor: ticket.member_id,
            target: ticket.subject,
            details: `Support ticket opened: ${ticket.category}.`
        });

        _notifyBroadcast({ type: "TICKET_UPDATED" });
        return ticket;
    },

    resolveSupportTicket(ticketId, responseText, responder = "William Gerishom") {
        const list = this.getSupportTickets();
        const idx = list.findIndex(t => t.id === ticketId);
        if (idx === -1) return null;

        list[idx].status = "RESOLVED";
        list[idx].response = String(responseText || "").trim() || "Imeshughulikiwa na utawala.";
        list[idx].responded_by = responder;
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(list));

        const client = getSupabaseClient();
        if (client) {
            _trackWrite(
                client.from("support_tickets").update({
                    status: "RESOLVED",
                    response: list[idx].response,
                    responded_by: responder
                }).eq("id", ticketId)
            );
        }

        this.addAuditLog({
            action: "SUPPORT_TICKET_RESOLVED",
            actor: responder,
            target: list[idx].member_id,
            details: `Ticket resolved: ${list[idx].subject}`
        });

        _notifyBroadcast({ type: "TICKET_UPDATED" });
        return list[idx];
    },

    // PDPA 2022 Safe Backup Payload (excludes password_hash!)
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

    // Platform statistics
    getStats() {
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

// Auto-run init
SGStore.init();

if (typeof window !== "undefined") {
    window.SGStore = SGStore;
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = SGStore;
}
