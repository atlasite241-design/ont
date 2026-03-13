import { User, ONTRecord, ConnectionLog } from '../types';
import { API_BASE_URL } from '../config';

const SESSION_KEY = 'ont_finder_current_user';

export const dbService = {
  // --- User Persistence (via API) ---
  
  getUser: async (username: string) => {
    const users = await dbService.getAllUsers();
    return users.find(u => u.username === username) || null;
  },

  getAllUsers: async (): Promise<User[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  createUser: async (username: string, pass: string, role: string = 'User', securityQuestion?: string, securityAnswer?: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass, role, securityQuestion, securityAnswer })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  getSecurityQuestion: async (username: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/recovery/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.question || null;
    } catch (e) {
      return null;
    }
  },

  verifySecurityAnswer: async (username: string, answer: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/recovery/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, answer })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  deleteUser: async (username: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(username)}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  updateUserRole: async (username: string, newRole: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(username)}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  updateUserPassword: async (username: string, newPass: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/recovery/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: newPass })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  changePassword: async (username: string, currentPassword: string, newPass: string): Promise<{success: boolean, message?: string}> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, currentPassword, newPassword: newPass })
      });
      const data = await res.json();
      return { success: res.ok, message: data.message };
    } catch (e) {
      return { success: false, message: "Erreur de connexion" };
    }
  },

  // --- Session Persistence (still in localStorage for client state) ---

  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  },

  getCurrentUser: (): User | null => {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  },

  // --- ONT Data Persistence (via API) ---

  saveONTData: async (data: ONTRecord[]) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ont-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: data })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  getONTData: async (): Promise<{ records: ONTRecord[], lastUpdated: string | null }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ont-data`);
      if (!res.ok) return { records: [], lastUpdated: null };
      return await res.json();
    } catch (e) {
      return { records: [], lastUpdated: null };
    }
  },

  clearAllData: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ont-data`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  getLogs: async (): Promise<ConnectionLog[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/logs`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      return [];
    }
  }
};
