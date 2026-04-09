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
  refreshTenant: () => Promise<void>;
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
      await setItem('user_data', JSON.stringify(result.user));
      await setItem('tenant_data', JSON.stringify(result.tenant));
      set({ isAuthenticated: true, user: result.user, tenant: result.tenant });
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || err?.message || 'Cannot connect to server');
    }
  },

  logout: async () => {
    await removeItem('token');
    await removeItem('refreshToken');
    await removeItem('user_data');
    await removeItem('tenant_data');
    set({ isAuthenticated: false, user: null, tenant: null });
  },

  loadToken: async () => {
    try {
      const token = await getItem('token');
      if (!token) { set({ isAuthenticated: false }); return; }

      // Restore saved user data IMMEDIATELY — no waiting for API
      const savedUser = await getItem('user_data');
      const savedTenant = await getItem('tenant_data');

      // Set authenticated instantly with cached data
      set({
        isAuthenticated: true,
        user: savedUser ? JSON.parse(savedUser) : null,
        tenant: savedTenant ? JSON.parse(savedTenant) : null,
      });

      // Refresh from API silently in background — don't block the app
      api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(({ data }) => {
          const user = data.data;
          const tenant = data.data?.tenant;
          set({ isAuthenticated: true, user, tenant });
          setItem('user_data', JSON.stringify(user));
          setItem('tenant_data', JSON.stringify(tenant));
        })
        .catch(() => {
          // API unreachable — stay logged in with cached data
        });
    } catch {
      set({ isAuthenticated: false });
    }
  },

  refreshTenant: async () => {
    try {
      const token = await getItem('token');
      if (!token) return;
      const { data } = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      const user = data.data;
      const tenant = data.data?.tenant;
      set({ user, tenant });
      await setItem('user_data', JSON.stringify(user));
      await setItem('tenant_data', JSON.stringify(tenant));
    } catch {
      // Silently ignore — don't logout on background refresh failure
    }
  },
}));
