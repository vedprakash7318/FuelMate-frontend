import axios from 'axios';

// Normalize API Base URL (handles trailing slashes, missing /api, etc.)
const formatBaseURL = (url) => {
  if (!url) return '/api';
  const trimmed = url.trim().replace(/\/+$/, '');
  if (trimmed === '' || trimmed === '/api') return '/api';
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const api = axios.create({
  baseURL: formatBaseURL(import.meta.env.VITE_API_BASE_URL),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('petrol_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('petrol_token');
      localStorage.removeItem('petrol_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
