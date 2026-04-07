import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  isSuperAdmin: boolean;
  language: string;
  roles: { name: string; displayName: string }[];
  permissions: string[];
}

interface Tenant {
  id: string;
  companyName: string;
  logo?: string;
  status: string;
  language: string;
  currency: string;
  lockedModules?: string;
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  theme: 'light' | 'dark';
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setLanguage: (lang: string) => void;
  toggleTheme: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  isAuthenticated: !!localStorage.getItem('buildwise_token'),
  isLoading: !!localStorage.getItem('buildwise_token'),
  theme: (localStorage.getItem('datalytics_theme') || 'light') as 'light' | 'dark',

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const result = data.data;
    localStorage.setItem('buildwise_token', result.accessToken);
    localStorage.setItem('buildwise_refresh_token', result.refreshToken);
    set({
      user: result.user,
      tenant: result.tenant,
      isAuthenticated: true,
    });
  },

  register: async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    const result = data.data;
    localStorage.setItem('buildwise_token', result.accessToken);
    localStorage.setItem('buildwise_refresh_token', result.refreshToken);
    set({
      user: result.user,
      tenant: result.tenant,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('buildwise_token');
    localStorage.removeItem('buildwise_refresh_token');
    set({ user: null, tenant: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      set({ isLoading: true });
      const { data } = await api.get('/auth/me');
      set({
        user: data.data,
        tenant: data.data.tenant,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem('buildwise_token');
      localStorage.removeItem('buildwise_refresh_token');
      set({ user: null, tenant: null, isAuthenticated: false, isLoading: false });
    }
  },

  setLanguage: (lang) => {
    localStorage.setItem('buildwise_lang', lang);
  },

  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('datalytics_theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      return { theme: newTheme };
    });
  },
}));

// Apply saved theme on load
if (localStorage.getItem('datalytics_theme') === 'dark') {
  document.documentElement.classList.add('dark');
}
