/**
 * SILLYGER (SG) Local Storage & State Management Layer
 * Provides zero-dependency, free client-side persistence for Phase 1-3 testing,
 * architected for seamless transition to Supabase in Phase 4.
 */

// Safe storage abstraction (browser localStorage with in-memory fallback for headless/Node testing)
const _sgStorage = (typeof localStorage !== 'undefined') ? localStorage : {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
};

let _supabaseClient = null;
function getSupabaseClient() {
    if (_supabaseClient) return _supabaseClient;
    if (typeof supabase !== 'undefined' && typeof SG_CONFIG !== 'undefined' && SG_CONFIG.SUPABASE && SG_CONFIG.SUPABASE.isConfigured) {
        try {
            _supabaseClient = supabase.createClient(SG_CONFIG.SUPABASE.url, SG_CONFIG.SUPABASE.anonKey);
        } catch (e) {
            console.warn("Supabase init error:", e);
        }
    }
    return _supabaseClient;
}

const SGStore = {
    // Initialize default seed data if local storage is empty
    init() {
        if (!_sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.APPLICANTS)) {
            const initialMembers = [
                {
                    id: "usr_admin_001",
                    member_id: "SG-000001",
                    full_name: "Willyger Admin",
                    username: "willyger",
                    email: "admin@sillyger.org",
                    phone: "+255712345678",
                    password_hash: "admin123",
                    track: "Computer Systems & OS",
                    experience: "Advanced",
                    role: "Super Administrator",
                    status: "ACTIVE", // Super Administrator
                    agreed_constitution: true,
                    agreed_ethics: true,
                    agreed_pdpa: true,
                    created_at: new Date().toISOString(),
                    approved_at: new Date().toISOString(),
                    approved_by: "SYSTEM_FOUNDER"
                }
            ];
            _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.APPLICANTS, JSON.stringify(initialMembers));
        }

        if (!_sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.AUDIT_LOGS)) {
            const initialAudit = [
                {
                    id: "log_001",
                    action: "SYSTEM_INITIALIZATION",
                    actor: "SYSTEM",
                    target: "Constitution v1.4 Engine",
                    details: "Initialized SG Community Platform with 11 Divisions and 10 Curriculum Levels.",
                    timestamp: new Date().toISOString()
                }
            ];
            _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialAudit));
        }

        // Trigger background sync if Supabase is connected
        this.syncWithSupabase();
    },

    async syncWithSupabase() {
        const client = getSupabaseClient();
        if (!client) return;

        try {
            const { data: dbMembers, error: mErr } = await client.from('members').select('*');
            if (!mErr && dbMembers && dbMembers.length > 0) {
                this.saveMembers(dbMembers);
            }

            const { data: dbLogs, error: lErr } = await client.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200);
            if (!lErr && dbLogs && dbLogs.length > 0) {
                _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(dbLogs));
            }
        } catch (e) {
            console.warn("Supabase sync notice:", e);
        }
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

    // Save members array
    saveMembers(members) {
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.APPLICANTS, JSON.stringify(members));
    },

    // Find member by email or username
    findMemberByCredential(credential) {
        const members = this.getMembers();
        const search = (credential || "").trim().toLowerCase();
        return members.find(m => 
            (m.email && m.email.toLowerCase() === search) || 
            (m.username && m.username.toLowerCase() === search) ||
            (m.phone && m.phone.replace(/[\s\-\+]/g, '') === search.replace(/[\s\-\+]/g, ''))
        );
    },

    // Find member by ID
    findMemberById(id) {
        return this.getMembers().find(m => m.id === id);
    },

    // Register a new Applicant (Default status = 'PENDING', member_id = null)
    registerApplicant(data) {
        this.init();
        const members = this.getMembers();

        // Check duplicates
        const normalizedEmail = data.email.trim().toLowerCase();
        const normalizedUsername = data.username.trim().toLowerCase();
        const normalizedPhone = this.normalizePhone(data.phone);

        if (members.some(m => m.email.toLowerCase() === normalizedEmail)) {
            throw new Error("Barua pepe hii (Email) tayari imesajiliwa. Tafadhali ingia au tumia barua pepe nyingine.");
        }

        if (members.some(m => m.username.toLowerCase() === normalizedUsername)) {
            throw new Error("Jina la mtumiaji (Username) hili tayari limetumika. Tafadhali chagua jina jingine.");
        }

        if (members.some(m => m.phone === normalizedPhone)) {
            throw new Error("Namba hii ya WhatsApp tayari imesajiliwa. Tumia namba yako halisi au wasiliana na utawala.");
        }

        const newApplicant = {
            id: "usr_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 5),
            member_id: null, // SPEC: Strict null for PENDING
            full_name: data.full_name.trim(),
            username: normalizedUsername,
            email: normalizedEmail,
            phone: normalizedPhone,
            password_hash: data.password, // Plain for local demo; Supabase auth will manage salt/hash in Phase 4
            track: data.track || "Computer Fundamentals & Electronics",
            experience: data.experience || "Beginner",
            motivation: data.motivation || "",
            role: "Applicant",
            status: "PENDING", // SPEC: Strict PENDING status upon registration
            agreed_constitution: !!data.agreed_constitution,
            agreed_ethics: !!data.agreed_ethics,
            agreed_pdpa: !!data.agreed_pdpa,
            created_at: new Date().toISOString(),
            approved_at: null,
            approved_by: null
        };

        members.push(newApplicant);
        this.saveMembers(members);

        // Async write to Supabase if connected
        const client = getSupabaseClient();
        if (client) {
            client.from('members').insert([{
                full_name: newApplicant.full_name,
                username: newApplicant.username,
                email: newApplicant.email,
                phone: newApplicant.phone,
                password_hash: newApplicant.password_hash,
                track: newApplicant.track,
                experience: newApplicant.experience,
                motivation: newApplicant.motivation,
                role: 'Applicant',
                status: 'PENDING',
                member_id: null,
                agreed_constitution: true,
                agreed_ethics: true,
                agreed_pdpa: true
            }]).then(({ error }) => {
                if (error) console.error("Supabase insert error:", error);
            });
        }

        // Audit Log
        this.addAuditLog({
            action: "APPLICANT_REGISTERED",
            actor: newApplicant.username,
            target: newApplicant.full_name,
            details: `New registration received from ${newApplicant.phone} (${newApplicant.track}). Status: PENDING review.`
        });

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
        return "SG-" + String(nextNum).padStart(6, '0');
    },

    // Admin Approves Member (Transitions status PENDING -> ACTIVE & assigns SG-xxxxxx)
    approveMember(applicantId, adminActor = "ADMIN") {
        const members = this.getMembers();
        const index = members.findIndex(m => m.id === applicantId);
        if (index === -1) throw new Error("Mwanachama hakupatikana.");

        const member = members[index];
        if (member.status === "ACTIVE") {
            throw new Error("Mwanachama huyu tayari ni ACTIVE.");
        }

        // Assign sequential ID if not present
        if (!member.member_id) {
            member.member_id = this.getNextMemberId();
        }

        member.status = "ACTIVE";
        member.role = member.role === "Applicant" ? "Member" : member.role;
        member.approved_at = new Date().toISOString();
        member.approved_by = adminActor;

        members[index] = member;
        this.saveMembers(members);

        // Async write to Supabase if connected
        const client = getSupabaseClient();
        if (client) {
            client.from('members').update({
                member_id: member.member_id,
                status: 'ACTIVE',
                role: member.role,
                approved_at: member.approved_at,
                approved_by: member.approved_by
            }).eq('username', member.username).then(({ error }) => {
                if (error) console.error("Supabase approve error:", error);
            });
        }

        this.addAuditLog({
            action: "MEMBER_APPROVED",
            actor: adminActor,
            target: `${member.username} (${member.member_id})`,
            details: `Application approved. Assigned Unique Member ID: ${member.member_id}. WhatsApp Community gate unlocked.`
        });

        return member;
    },

    // Update status (e.g. ON_HOLD, SUSPENDED, INACTIVE, TERMINATED)
    updateMemberStatus(applicantId, newStatus, reason = "", adminActor = "ADMIN") {
        const validStatuses = ["PENDING", "ACTIVE", "ON_HOLD", "SUSPENDED", "INACTIVE", "TERMINATED"];
        if (!validStatuses.includes(newStatus)) {
            throw new Error(`Hali batili: ${newStatus}`);
        }

        const members = this.getMembers();
        const index = members.findIndex(m => m.id === applicantId);
        if (index === -1) throw new Error("Mwanachama hakupatikana.");

        const oldStatus = members[index].status;
        members[index].status = newStatus;
        this.saveMembers(members);

        this.addAuditLog({
            action: `STATUS_CHANGE_${newStatus}`,
            actor: adminActor,
            target: `${members[index].username} (${members[index].member_id || 'NO-ID'})`,
            details: `Status altered from ${oldStatus} to ${newStatus}. Reason: ${reason || 'Administrative action'}.`
        });

        return members[index];
    },

    // Audit Log Helpers
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
            id: "log_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 4),
            action,
            actor: actor || "SYSTEM",
            target: target || "N/A",
            details: details || "",
            timestamp: new Date().toISOString()
        };
        logs.unshift(entry); // newest first
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 500))); // keep 500 recent

        const client = getSupabaseClient();
        if (client) {
            client.from('audit_logs').insert([{
                action: entry.action,
                actor: entry.actor,
                target: entry.target,
                details: entry.details,
                timestamp: entry.timestamp
            }]).then(({ error }) => {
                if (error) console.error("Supabase audit insert error:", error);
            });
        }

        return entry;
    },

    // Session Management (Local demo)
    setCurrentSession(user) {
        if (!user) {
            _sgStorage.removeItem(SG_CONFIG.STORAGE_KEYS.ACTIVE_SESSION);
            return;
        }
        // Exclude plain password from active session representation
        const safeSession = { ...user };
        delete safeSession.password_hash;
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(safeSession));
    },

    getCurrentSession() {
        try {
            const data = _sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.ACTIVE_SESSION);
            return data ? JSON.parse(data) : null;
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

    // Phone normalizer (Converts 07xx, 2557xx, etc. to +2557xxxxxxxx)
    normalizePhone(raw) {
        if (!raw) return "";
        let clean = raw.toString().replace(/[\s\-\(\)]/g, "");
        if (clean.startsWith("+")) {
            return clean;
        }
        if (clean.startsWith("0")) {
            return "+255" + clean.substring(1);
        }
        if (clean.startsWith("255")) {
            return "+" + clean;
        }
        return clean.length === 9 ? "+255" + clean : "+" + clean;
    },

    // Validate phone number strictly for Tanzania format (+255 followed by 9 digits)
    isValidTzPhone(phone) {
        const norm = this.normalizePhone(phone);
        return /^\+255[67]\d{8}$/.test(norm);
    },

    // Attendance Records (Article 6.6 & 9)
    getAttendanceRecords(memberId = null) {
        this.init();
        try {
            const list = JSON.parse(_sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.ATTENDANCE)) || [
                {
                    id: "att_001",
                    member_id: "SG-000001",
                    session_title: "Week 4: Logic Gates & ALU Construction",
                    date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
                    is_planned: true,
                    is_verified: true,
                    verified_by: "SYSTEM"
                },
                {
                    id: "att_002",
                    member_id: "SG-000002",
                    session_title: "Week 4: Logic Gates & ALU Construction",
                    date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
                    is_planned: true,
                    is_verified: true,
                    verified_by: "willyger (SG-000001)"
                },
                {
                    id: "att_003",
                    member_id: "SG-000002",
                    session_title: "Week 5: Operating System Syscalls & Linux Shell",
                    date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
                    is_planned: true,
                    is_verified: false, // Planned but pending instructor verification
                    verified_by: null
                }
            ];
            if (!_sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.ATTENDANCE)) {
                _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));
            }
            if (memberId) {
                return list.filter(a => a.member_id === memberId);
            }
            return list;
        } catch (e) {
            return [];
        }
    },

    recordPlannedAttendance(memberId, sessionTitle) {
        const list = this.getAttendanceRecords();
        const record = {
            id: "att_" + Date.now().toString(36),
            member_id: memberId,
            session_title: sessionTitle || "Upcoming Sillygerian Tech Session",
            date: new Date().toISOString().split('T')[0],
            is_planned: true,
            is_verified: false, // Article 9.3: Planned attendance != Verified attendance
            verified_by: null,
            created_at: new Date().toISOString()
        };
        list.unshift(record);
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));

        this.addAuditLog({
            action: "ATTENDANCE_CHECKIN",
            actor: memberId,
            target: record.session_title,
            details: `Member checked-in (Planned attendance recorded for ${record.date}).`
        });

        return record;
    },

    // Leave & Permission Requests (Article 10)
    getLeaveRequests(memberId = null) {
        try {
            const list = JSON.parse(_sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.LEAVE_REQUESTS)) || [];
            return memberId ? list.filter(l => l.member_id === memberId) : list;
        } catch (e) {
            return [];
        }
    },

    submitLeaveRequest(memberId, { reason, category, duration }) {
        const list = this.getLeaveRequests();
        const request = {
            id: "leave_" + Date.now().toString(36),
            member_id: memberId,
            category: category || "Personal",
            duration: duration || "1-3 siku",
            reason,
            status: "PENDING_REVIEW",
            submitted_at: new Date().toISOString()
        };
        list.unshift(request);
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(list));

        this.addAuditLog({
            action: "LEAVE_REQUESTED",
            actor: memberId,
            target: request.category,
            details: `Permission requested: ${reason.substring(0, 50)}...`
        });

        return request;
    },

    // Support Requests (Article 6.12)
    getSupportTickets(memberId = null) {
        try {
            const list = JSON.parse(_sgStorage.getItem(SG_CONFIG.STORAGE_KEYS.SUPPORT_TICKETS)) || [];
            return memberId ? list.filter(t => t.member_id === memberId) : list;
        } catch (e) {
            return [];
        }
    },

    submitSupportTicket(memberId, { subject, category, message }) {
        const list = this.getSupportTickets();
        const ticket = {
            id: "ticket_" + Date.now().toString(36),
            member_id: memberId,
            subject,
            category: category || "Account Support",
            message,
            status: "OPEN",
            created_at: new Date().toISOString()
        };
        list.unshift(ticket);
        _sgStorage.setItem(SG_CONFIG.STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(list));

        this.addAuditLog({
            action: "SUPPORT_TICKET_CREATED",
            actor: memberId,
            target: ticket.subject,
            details: `Support ticket opened: ${ticket.category}.`
        });

        return ticket;
    },

    // Platform statistics
    getStats() {
        const members = this.getMembers();
        return {
            totalRegistered: members.length,
            activeMembers: members.filter(m => m.status === "ACTIVE").length,
            pendingApplicants: members.filter(m => m.status === "PENDING").length,
            divisionsCount: SG_CONFIG.DIVISIONS.length,
            curriculumLevels: SG_CONFIG.CURRICULUM.length
        };
    }
};

// Auto-run init
SGStore.init();

if (typeof window !== 'undefined') {
    window.SGStore = SGStore;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SGStore;
}
