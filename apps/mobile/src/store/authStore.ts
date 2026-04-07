import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from '../api';

// Web-safe storage wrapper
async function getItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  } catch { return null; }
}

async function setItem(key: string, value: string) {
  try {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    await SecureStore.setItemAsync(key, value);
  } catch {}
}

async function removeItem(key: string) {
  try {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    await SecureStore.deleteItemAsync(key);
  } catch {}
}

interface AuthState {
  isAuthenticated: boolean;
  user: any;
  tenant: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  tenant: null,

  login: async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const result = data.data;
      await setItem('token', result.accessToken);
      await setItem('refreshToken', result.refreshToken);
      set({ isAuthenticated: true, user: result.user, tenant: result.tenant });
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || err?.message || 'Cannot connect to server');
    }
  },

  logout: async () => {
    await removeItem('token');
    await removeItem('refreshToken');
    set({ isAuthenticated: false, user: null, tenant: null });
  },

  loadToken: async () => {
    try {
      const token = await getItem('token');
      if (!token) { set({ isAuthenticated: false }); return; }
      const { data } = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      set({ isAuthenticated: true, user: data.data, tenant: data.data?.tenant });
    } catch {
      await removeItem('token');
      set({ isAuthenticated: false });
    }
  },
}));
