import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_PLATFORM_API_URL || 'http://localhost:4000/api/v1/platform';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('platform_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('platform_token');
      localStorage.removeItem('platform_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
