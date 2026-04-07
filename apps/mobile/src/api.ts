import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Production API — works everywhere (any WiFi, mobile data, anywhere)
const API_BASE = 'https://datalytics-easy-build.onrender.com/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 sec timeout — free tier wakes up slowly
});

api.interceptors.request.use(async (config) => {
  try {
    let token: string | null = null;
    if (Platform.OS === 'web') {
      token = localStorage.getItem('token');
    } else {
      token = await SecureStore.getItemAsync('token');
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.log('Network error: API not reachable');
    }
    return Promise.reject(error);
  }
);
