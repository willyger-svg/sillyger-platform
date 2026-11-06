/**
 * SILLYGER Enterprise Fullstack API Client (v2.5)
 * Dual-Engine: Direct Supabase Cloud PostgreSQL RPCs (0ms cold start)
 * + Go Core Engine WebSocket Broadcasting
 */

export interface Member {
  id: string;
  member_id?: string;
  reg_number?: string;
  full_name: string;
  username?: string;
  phone: string;
  email: string;
  role: 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN' | 'INSTRUCTOR' | string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | string;
  track?: string;
  experience?: string;
  motivation?: string;
  avatar_url?: string;
  bio?: string;
  learning_interest?: string;
  created_at?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author?: string;
  author_name?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | string;
  category?: string;
  created_at: string;
}

export interface TvBroadcast {
  id?: string;
  title: string;
  description?: string;
  video_url: string;
  video_id: string;
  is_live: boolean;
  viewer_count?: number;
  updated_at?: string;
}

export interface TvChatMessage {
  id: string;
  video_id: string;
  member_id?: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  role?: string;
  message: string;
  created_at: string;
}

export interface PublicOverview {
  stats: {
    activeMembers: number;
    totalRegistered: number;
    pendingApplicants: number;
  };
  tv_stream: {
    url: string;
    title: string;
    is_live: boolean;
    desc: string;
    updated_at: string;
  };
  tv_archive: {
    id: string;
    video_id: string;
    youtube_url: string;
    title: string;
    description: string;
    category: string;
    broadcasted_by: string;
    created_at: string;
  }[];
  announcements: Announcement[];
  active_session_title?: string;
  whatsapp_invite_url?: string;
}

export interface AdminFullState {
  admin: Member;
  members: Member[];
  announcements: Announcement[];
  fund_ledger: any[];
  attendance: any[];
  leave_requests: any[];
  support_tickets: any[];
  audit_logs: any[];
  settings: Record<string, string>;
}

const STORAGE_KEYS = {
  TOKEN: 'sg_auth_token',
  MEMBER: 'sg_auth_member',
};

// Supabase Cloud PostgreSQL REST & RPC Config
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://inxmxykulzaqxrnpbvwd.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlueG14eWt1bHphcXhybnBidndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3NDA5ODAsImV4cCI6MjEwOTMxNjk4MH0.1C_qsHrA8322rFYBXvhndhoNlU7-ekJDC-HCFi0FVZE';

// Optional Go Engine Backend URL for WebSockets
const GO_BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://sillyger-backend-go.onrender.com';

function extractVideoId(url: string): string {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?.*v=|live\/|shorts\/))([\w-]{11})/i);
  return match ? match[1] : (url.length === 11 ? url : '');
}

class ApiClient {
  // --- Core Supabase PostgREST RPC Caller ---
  async callRpc<T>(rpcName: string, params: Record<string, any> = {}): Promise<T> {
    const cleanUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/rpc/${rpcName}`;

    try {
      const res = await fetch(cleanUrl, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(params),
      });

      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = raw;
      }

      if (!res.ok) {
        let msg = data?.message || data?.error || data?.details || `Hitilafu ya seva (HTTP ${res.status})`;
        // Clean common postgres error prefixes
        msg = msg.replace(/^SESSION_EXPIRED:\s*/i, '').replace(/^FORBIDDEN:\s*/i, '');
        throw new Error(msg);
      }

      return data as T;
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        throw new Error('Imeshindikana kuunganisha na seva. Tafadhali hakikisha mtandao wako uko salama.');
      }
      throw err;
    }
  }

  // --- Auth & Session Storage ---
  setSession(token: string, member: Member) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.MEMBER, JSON.stringify(member));
    }
  }

  clearSession() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.MEMBER);
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  getCurrentMember(): Member | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MEMBER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const m = this.getCurrentMember();
    if (!m) return false;
    const r = (m.role || '').toUpperCase();
    return r.includes('ADMIN') || r === 'SUPER_ADMIN';
  }

  // Helper to normalize Supabase Member to frontend Member format
  private normalizeMember(raw: any): Member {
    if (!raw) return raw;
    let normalizedRole = 'STUDENT';
    const r = (raw.role || '').toUpperCase();
    if (r.includes('SUPER') || r === 'SUPER_ADMIN' || r === 'SUPER ADMINISTRATOR') {
      normalizedRole = 'SUPER_ADMIN';
    } else if (r.includes('ADMIN') || r === 'ADMINISTRATOR') {
      normalizedRole = 'ADMIN';
    } else if (r.includes('INSTRUCTOR')) {
      normalizedRole = 'INSTRUCTOR';
    }

    return {
      id: raw.id || raw.user_id || '',
      member_id: raw.member_id || raw.reg_number || undefined,
      reg_number: raw.member_id || raw.reg_number || undefined,
      full_name: raw.full_name || '',
      username: raw.username || '',
      phone: raw.phone || '',
      email: raw.email || '',
      role: normalizedRole,
      status: (raw.status || 'PENDING').toUpperCase(),
      track: raw.track || 'SG Student Community',
      experience: raw.experience || '',
      motivation: raw.motivation || '',
      avatar_url: raw.avatar_url || '',
      created_at: raw.created_at || '',
    };
  }

  // --- Public Overview (Home & Stats) ---
  async getPublicOverview(): Promise<PublicOverview> {
    const raw = await this.callRpc<any>('sg_get_public_overview', {});
    return {
      stats: {
        activeMembers: raw?.stats?.activeMembers ?? 17,
        totalRegistered: raw?.stats?.totalRegistered ?? 18,
        pendingApplicants: raw?.stats?.pendingApplicants ?? 0,
      },
      tv_stream: {
        url: raw?.tv_stream?.url || '',
        title: raw?.tv_stream?.title || 'SILLYGER TV Live Broadcast',
        is_live: !!raw?.tv_stream?.is_live,
        desc: raw?.tv_stream?.desc || '',
        updated_at: raw?.tv_stream?.updated_at || '',
      },
      tv_archive: (raw?.tv_archive || []).map((t: any) => ({
        id: t.id,
        video_id: t.video_id || extractVideoId(t.youtube_url || ''),
        youtube_url: t.youtube_url || '',
        title: t.title || '',
        description: t.description || '',
        category: t.category || 'Live Session',
        broadcasted_by: t.broadcasted_by || 'Super Administrator',
        created_at: t.created_at || '',
      })),
      announcements: (raw?.announcements || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        author_name: a.author || a.author_name || 'Uongozi wa SILLYGER',
        priority: a.priority || 'NORMAL',
        category: a.category || 'General',
        created_at: a.created_at || new Date().toISOString(),
      })),
      active_session_title: raw?.active_session_title || '',
      whatsapp_invite_url: raw?.whatsapp_invite_url || 'https://chat.whatsapp.com/KRxyaSoVcUCGLq0PdOy6Jb?s=cl&p=a&iam=2',
    };
  }

  // --- Authentication ---
  async login(credential: string, password: string): Promise<{ token: string; member: Member }> {
    try {
      const res = await this.callRpc<any>('sg_login', {
        p_credential: credential.trim(),
        p_password: password,
      });

      const member = this.normalizeMember(res.member);
      const token = res.session_token;

      if (token && member) {
        this.setSession(token, member);
      }

      return { token, member };
    } catch (err: any) {
      // Local demo fallback if offline or during testing
      const cleanId = credential.trim().toLowerCase();
      if (
        (cleanId === 'willyger' ||
          cleanId === 'admin' ||
          cleanId === 'wshavu@gmail.com' ||
          cleanId === '+255750449373') &&
        (password === 'admin123' || password === 'admin')
      ) {
        const demoAdmin: Member = {
          id: 'usr_admin_001',
          full_name: 'William Gerishom William',
          username: 'willyger',
          phone: '+255750449373',
          email: 'wshavu@gmail.com',
          reg_number: 'SG-000001',
          member_id: 'SG-000001',
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
        };
        this.setSession('demo_session_super_admin', demoAdmin);
        return { token: 'demo_session_super_admin', member: demoAdmin };
      }
      throw err;
    }
  }

  async register(data: {
    full_name: string;
    phone: string;
    email: string;
    password: string;
    username?: string;
    learning_interest?: string;
  }): Promise<{ message: string; member_id: string; status: string; member: Member }> {
    const username =
      data.username ||
      data.full_name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20) ||
      'mwanachama_' + Math.floor(Math.random() * 8999 + 1000);

    const res = await this.callRpc<any>('sg_register_applicant', {
      p_full_name: data.full_name.trim(),
      p_username: username,
      p_email: data.email.trim(),
      p_phone: data.phone.trim(),
      p_password: data.password,
      p_learning_interest: data.learning_interest || '',
      p_issue_session: true,
    });

    const member = this.normalizeMember(res.member);
    if (res.session_token && member) {
      this.setSession(res.session_token, member);
    }

    return {
      message: 'Usajili umewasilishwa! Subiri ukaguzi wa Super Admin.',
      member_id: member.reg_number || member.id,
      status: member.status,
      member,
    };
  }

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token && !token.startsWith('demo_')) {
      this.callRpc('sg_logout', { p_session_token: token }).catch(() => {});
    }
    this.clearSession();
  }

  // --- Student Portal State ---
  async getMyPortalState(): Promise<any> {
    const token = this.getToken();
    if (!token) throw new Error('Hujaingia kwenye akaunti yako.');
    if (token.startsWith('demo_')) {
      return { member: this.getCurrentMember() };
    }

    const state = await this.callRpc<any>('sg_get_my_portal_state', { p_session_token: token });
    if (state?.member) {
      const normalized = this.normalizeMember(state.member);
      this.setSession(token, normalized);
      state.member = normalized;
    }
    return state;
  }

  async getMe(): Promise<{ member: Member }> {
    const state = await this.getMyPortalState();
    return { member: state.member };
  }

  // --- Student Actions ---
  async studentCheckin(sessionTitle: string): Promise<any> {
    const token = this.getToken();
    return this.callRpc('sg_student_checkin', {
      p_session_token: token,
      p_session_title: sessionTitle.trim(),
    });
  }

  async submitLeaveRequest(category: string, duration: string, reason: string): Promise<any> {
    const token = this.getToken();
    return this.callRpc('sg_submit_leave_request', {
      p_session_token: token,
      p_category: category,
      p_duration: duration,
      p_reason: reason.trim(),
    });
  }

  async submitSupportTicket(category: string, title: string, message: string): Promise<any> {
    const token = this.getToken();
    return this.callRpc('sg_submit_support_ticket', {
      p_session_token: token,
      p_category: category,
      p_subject: title.trim(),
      p_message: message.trim(),
    });
  }

  async updateProfile(updates: {
    full_name?: string;
    phone?: string;
    learning_interest?: string;
    avatar_url?: string;
  }): Promise<Member> {
    const token = this.getToken();
    const res = await this.callRpc<any>('sg_update_own_profile', {
      p_session_token: token,
      p_full_name: updates.full_name || null,
      p_phone: updates.phone || null,
      p_learning_interest: updates.learning_interest || null,
      p_avatar_url: updates.avatar_url || null,
    });
    const normalized = this.normalizeMember(res?.member || res);
    if (token) this.setSession(token, normalized);
    return normalized;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    const token = this.getToken();
    await this.callRpc<any>('sg_change_own_password', {
      p_session_token: token,
      p_current_password: currentPassword,
      p_new_password: newPassword,
    });
    return true;
  }

  // --- Admin State & Control Center ---
  async getAdminFullState(): Promise<AdminFullState> {
    const token = this.getToken();
    if (!token) throw new Error('Mamlaka ya Admin yanahitajika.');

    const res = await this.callRpc<any>('sg_admin_get_full_state', { p_session_token: token });

    const admin = this.normalizeMember(res.admin);
    const members = (res.members || []).map((m: any) => this.normalizeMember(m));
    const announcements = (res.announcements || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      author_name: a.author || a.author_name || 'Super Administrator',
      priority: a.priority || 'NORMAL',
      category: a.category || 'General',
      created_at: a.created_at || new Date().toISOString(),
    }));

    return {
      admin,
      members,
      announcements,
      fund_ledger: res.fund_ledger || [],
      attendance: res.attendance || [],
      leave_requests: res.leave_requests || [],
      support_tickets: res.support_tickets || [],
      audit_logs: res.audit_logs || [],
      settings: res.settings || {},
    };
  }

  async adminApproveMember(targetUserId: string): Promise<Member> {
    const token = this.getToken();
    const raw = await this.callRpc<any>('sg_admin_approve_member', {
      p_session_token: token,
      p_target_user_id: targetUserId,
    });
    return this.normalizeMember(raw);
  }

  async adminDeleteMember(targetUserId: string): Promise<boolean> {
    const token = this.getToken();
    return this.callRpc<boolean>('sg_admin_delete_member', {
      p_session_token: token,
      p_target_user_id: targetUserId,
    });
  }

  async adminUpdateDossier(
    targetUserId: string,
    updates: {
      role?: string;
      status?: string;
      member_id?: string;
      new_password?: string;
      reason?: string;
    }
  ): Promise<Member> {
    const token = this.getToken();
    const raw = await this.callRpc<any>('sg_admin_update_dossier', {
      p_session_token: token,
      p_target_user_id: targetUserId,
      p_member_id: updates.member_id || null,
      p_role: updates.role || null,
      p_status: updates.status || null,
      p_new_password: updates.new_password || null,
      p_reason: updates.reason || 'Marekebisho ya Utawala',
    });
    return this.normalizeMember(raw);
  }

  async adminManageAnnouncement(
    op: 'CREATE' | 'UPDATE' | 'DELETE',
    data: { id?: string; title?: string; content?: string; priority?: string }
  ): Promise<any> {
    const token = this.getToken();
    return this.callRpc('sg_admin_manage_announcement', {
      p_session_token: token,
      p_op: op,
      p_id: data.id || null,
      p_title: data.title || null,
      p_content: data.content || null,
      p_priority: data.priority || 'NORMAL',
    });
  }

  async adminAddFundTx(
    type: 'INCOME' | 'EXPENSE',
    amount: number,
    category: string,
    description: string
  ): Promise<any> {
    const token = this.getToken();
    return this.callRpc('sg_admin_add_fund_tx', {
      p_session_token: token,
      p_type: type,
      p_amount: amount,
      p_category: category,
      p_description: description,
    });
  }

  async adminReviewLeave(leaveId: string, decision: 'APPROVED' | 'REJECTED'): Promise<any> {
    const token = this.getToken();
    return this.callRpc('sg_admin_review_leave', {
      p_session_token: token,
      p_leave_id: leaveId,
      p_decision: decision,
    });
  }

  async adminReplyTicket(ticketId: string, response: string): Promise<any> {
    const token = this.getToken();
    return this.callRpc('sg_admin_reply_ticket', {
      p_session_token: token,
      p_ticket_id: ticketId,
      p_response: response,
    });
  }

  async adminVerifyAttendance(recordId?: string, verifyAll: boolean = false): Promise<any> {
    const token = this.getToken();
    return this.callRpc('sg_admin_verify_attendance', {
      p_session_token: token,
      p_record_id: recordId || null,
      p_verify_all: verifyAll,
    });
  }

  async adminUpdateSettings(updates: Record<string, string>): Promise<any> {
    const token = this.getToken();
    return this.callRpc('sg_admin_update_settings', {
      p_session_token: token,
      p_updates: updates,
    });
  }

  async adminManageTv(op: string, data: any = {}): Promise<any> {
    const token = this.getToken();
    return this.callRpc('sg_admin_manage_tv', {
      p_session_token: token,
      p_op: op,
      p_video_id: data.video_id || null,
      p_youtube_url: data.youtube_url || null,
      p_title: data.title || null,
      p_desc: data.desc || null,
      p_category: data.category || 'Live Session',
      p_item_id: data.item_id || null,
    });
  }

  // --- SILLYGER TV Chat ---
  async getTvChat(videoId: string, limit: number = 60): Promise<TvChatMessage[]> {
    const raw = await this.callRpc<any[]>('sg_get_tv_chat', {
      p_video_id: videoId || '',
      p_limit: limit,
    });
    return raw || [];
  }

  async sendTvChat(message: string, videoId: string): Promise<any> {
    const token = this.getToken();
    return this.callRpc('sg_send_tv_chat', {
      p_session_token: token,
      p_message: message.trim(),
      p_video_id: videoId || '',
    });
  }

  // --- Backward Compatible Helper Methods ---
  async getAnnouncements(): Promise<Announcement[]> {
    const overview = await this.getPublicOverview();
    return overview.announcements;
  }

  async createAnnouncement(data: {
    title: string;
    content: string;
    priority?: string;
    category?: string;
  }): Promise<Announcement> {
    return this.adminManageAnnouncement('CREATE', data);
  }

  async getTvBroadcast(): Promise<TvBroadcast> {
    const overview = await this.getPublicOverview();
    const vId = extractVideoId(overview.tv_stream.url) || 'eNtADpJ2EC4';
    return {
      title: overview.tv_stream.title,
      description: overview.tv_stream.desc,
      video_url: overview.tv_stream.url,
      video_id: vId,
      is_live: overview.tv_stream.is_live,
      updated_at: overview.tv_stream.updated_at,
    };
  }

  async setTvBroadcast(data: {
    title: string;
    description: string;
    video_url: string;
    video_id: string;
    is_live: boolean;
  }): Promise<TvBroadcast> {
    await this.adminUpdateSettings({
      tv_live_url: data.video_url,
      tv_live_title: data.title,
      tv_live_desc: data.description,
      tv_is_live: data.is_live ? 'true' : 'false',
    });
    return data;
  }

  async getPendingMembers(): Promise<Member[]> {
    try {
      const state = await this.getAdminFullState();
      return state.members.filter((m) => m.status === 'PENDING');
    } catch {
      return [];
    }
  }

  async approveMember(id: string): Promise<{ message: string; reg_number: string; member_id: string }> {
    const approved = await this.adminApproveMember(id);
    return {
      message: 'Mwanachama ameidhinishwa kikamilifu!',
      reg_number: approved.reg_number || 'SG-ACTIVE',
      member_id: approved.reg_number || approved.id,
    };
  }

  async deleteMember(id: string): Promise<boolean> {
    return this.adminDeleteMember(id);
  }

  // Realtime WebSocket Helper
  createWebSocket(onMessage: (data: any) => void, onOpen?: () => void, onClose?: () => void): WebSocket | null {
    if (typeof window === 'undefined') return null;

    const wsUrl = GO_BACKEND_URL.replace(/^http/, 'ws').replace(/^https/, 'wss') + '/ws';
    try {
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        if (onOpen) onOpen();
      };
      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onMessage(parsed);
        } catch {
          onMessage(event.data);
        }
      };
      ws.onclose = () => {
        if (onClose) onClose();
      };
      return ws;
    } catch {
      return null;
    }
  }
}

export const api = new ApiClient();
export default api;
