import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'campusstash_access_token';

export const tokenStore = {
  get() {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },
  set(token) {
    if (typeof token !== 'string' || token.trim() === '') {
      this.clear();
      return;
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  },
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const unwrap = async (requestPromise) => {
  const { data } = await requestPromise;
  return data;
};

export const getApiErrorMessage = (error, fallback = 'Request failed') =>
  error?.response?.data?.message || error?.message || fallback;

export const getHealthStatus = () => unwrap(api.get('/health'));
export const login = (payload) => unwrap(api.post('/auth/login', payload));
export const signup = (payload) => unwrap(api.post('/auth/signup', payload));
export const verifyEmail = (token) => unwrap(api.post('/auth/verify-email', { token }));
export const resendCode = (email) => unwrap(api.post('/auth/resend-verification', { email }));
export const forgotPassword = (email) => unwrap(api.post('/auth/forgot-password', { email }));
export const resetPassword = (token, newPassword) =>
  unwrap(api.post('/auth/reset-password', { token, newPassword }));
export const getMe = () => unwrap(api.get('/auth/me'));

export default api;