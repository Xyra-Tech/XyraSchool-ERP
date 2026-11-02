import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_SCHOOL_API_URL || 'http://localhost:5001/api/v1/school';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('school_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const schoolCode = localStorage.getItem('school_code') || 'XYRA-DEMO-001';
  config.headers['x-school-code'] = schoolCode;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes('/login') &&
      !window.location.pathname.includes('/activate')
    ) {
      localStorage.removeItem('school_token');
      localStorage.removeItem('school_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
