/**
 * authService.ts
 * 
 * Mobile authentication client for Dankley team members (@dankley.com).
 * Manages operator session tokens, store locations, and POS affiliations.
 */

export interface DankleyUser {
  email: string;
  name: string;
  role: string;
  locationId: string;
  locationName: string;
  posType: 'dutchie' | 'blaze' | 'alleaves' | 'mock';
  allowedLocations?: string[];
  aiModel?: string;
}

let activeToken: string | null = null;
let activeUser: DankleyUser | null = {
  email: 'operator@dankley.com',
  name: 'Dankley Operator',
  role: 'operator',
  locationId: 'sandbox',
  locationName: 'Dankley Universal Sandbox',
  posType: 'mock'
};

let customApiBaseUrl: string = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const authService = {
  setApiBaseUrl(url: string) {
    customApiBaseUrl = url.replace(/\/$/, '');
  },

  getApiBaseUrl(): string {
    return customApiBaseUrl;
  },

  getToken(): string | null {
    return activeToken;
  },

  getCurrentUser(): DankleyUser | null {
    return activeUser;
  },

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': 'true',
      'ngrok-skip-browser-warning': '69420'
    };

    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }
    if (activeUser?.locationId) {
      headers['X-Dankley-Location-Id'] = activeUser.locationId;
    }

    return headers;
  },

  async login(email: string): Promise<{ success: boolean; user?: DankleyUser; error?: string }> {
    const normalized = email.trim().toLowerCase();
    if (!normalized.endsWith('@dankley.com')) {
      return { success: false, error: 'Only @dankley.com email addresses are authorized.' };
    }

    try {
      const res = await fetch(`${customApiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || `HTTP ${res.status}` };
      }

      activeToken = data.token;
      activeUser = data.user;
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login connection failed.' };
    }
  },

  logout() {
    activeToken = null;
    activeUser = null;
  }
};
