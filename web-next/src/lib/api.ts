/**
 * SILLYGER Enterprise Fullstack API Client (v2.0)
 * Communicates directly with the Go Core Engine Backend
 */

export interface Member {
  id: string;
  reg_number?: string;
  full_name: string;
  phone: string;
  email: string;
  role: 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN' | 'INSTRUCTOR';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  avatar_url?: string;
  bio?: string;
  created_at?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_name: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category: string;
  created_at: string;
}

export interface TvBroadcast {
  id: string;
  title: string;
  description: string;
  video_url: string;
  video_id: string;
  is_live: boolean;
  viewer_count?: number;
  updated_at: string;
}

const STORAGE_KEYS = {
  TOKEN: 'sg_auth_token',
  MEMBER: 'sg_auth_member',
};

// API Base URL (configured via NEXT_PUBLIC_API_URL or defaults to Go port 8080)
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8080'
    : 'https://sillyger-backend-go.onrender.com');

class ApiClient {
  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = this.getHeaders(options.headers as Record<string, string>);

    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg = data?.error || `Server responded with status ${res.status}`;
        throw new Error(errorMsg);
      }

      return data as T;
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        throw new Error('Imeshindikana kuwasiliana na seva ya Go. Hakikisha seva ipo hewani.');
      }
      throw err;
    }
  }

  // --- Auth & Session ---
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

  // --- Endpoints ---

  async health(): Promise<{ service: string; status: string; version: string; timestamp: string }> {
    return this.request('/api/health');
  }

  async register(data: { full_name: string; phone: string; email: string; password: string }) {
    return this.request<{ message: string; member_id: string; status: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(identifier: string, password: string) {
    const res = await this.request<{ token: string; member: Member }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });

    if (res.token && res.member) {
      this.setSession(res.token, res.member);
    }

    return res;
  }

  async getMe(): Promise<{ member: Member }> {
    const res = await this.request<{ member: Member }>('/api/auth/me');
    if (res.member) {
      this.setSession(this.getToken() || '', res.member);
    }
    return res;
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return this.request<Announcement[]>('/api/announcements');
  }

  async createAnnouncement(data: {
    title: string;
    content: string;
    priority?: string;
    category?: string;
  }): Promise<Announcement> {
    return this.request<Announcement>('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTvBroadcast(): Promise<TvBroadcast> {
    return this.request<TvBroadcast>('/api/tv/broadcast');
  }

  async setTvBroadcast(data: {
    title: string;
    description: string;
    video_url: string;
    video_id: string;
    is_live: boolean;
  }): Promise<TvBroadcast> {
    return this.request<TvBroadcast>('/api/tv/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPendingMembers(): Promise<Member[]> {
    return this.request<Member[]>('/api/admin/pending');
  }

  async approveMember(id: string): Promise<{ message: string; reg_number: string; member_id: string }> {
    return this.request<{ message: string; reg_number: string; member_id: string }>(
      `/api/admin/approve?id=${encodeURIComponent(id)}`,
      { method: 'POST' }
    );
  }

  // Realtime WebSocket Helper
  createWebSocket(onMessage: (data: any) => void, onOpen?: () => void, onClose?: () => void): WebSocket | null {
    if (typeof window === 'undefined') return null;

    const wsUrl =
      API_BASE.replace(/^http/, 'ws').replace(/^https/, 'wss') + '/ws';

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      if (onOpen) onOpen();
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onMessage(parsed);
      } catch (e) {
        onMessage(event.data);
      }
    };

    ws.onclose = () => {
      if (onClose) onClose();
    };

    return ws;
  }
}

export const api = new ApiClient();
export default api;
