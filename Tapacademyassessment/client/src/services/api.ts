import axios from 'axios';
import { useAuthStore } from '../store/auth';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const AuthApi = {
  login: (email: string, password: string) => api.post('/api/auth/login', { email, password }),
  register: (body: any) => api.post('/api/auth/register', body),
  me: () => api.get('/api/auth/me'),
};

export const AttendanceApi = {
  checkin: () => api.post('/api/attendance/checkin'),
  checkout: () => api.post('/api/attendance/checkout'),
  myHistory: (month?: string) => api.get('/api/attendance/my-history', { params: { month } }),
  mySummary: (month?: string) => api.get('/api/attendance/my-summary', { params: { month } }),
  today: () => api.get('/api/attendance/today'),
};

export const ManagerApi = {
  all: (params: any) => api.get('/api/attendance/all', { params }),
  todayStatus: () => api.get('/api/attendance/today-status'),
  users: () => api.get('/api/users'),
  export: (params: any) => api.get('/api/attendance/export', { params, responseType: 'text' }),
  employee: (id: string, params: any) => api.get(`/api/attendance/employee/${id}`, { params }),
  summary: (params: any) => api.get('/api/attendance/summary', { params }),
};

export const DashboardApi = {
  employee: () => api.get('/api/dashboard/employee'),
  manager: () => api.get('/api/dashboard/manager'),
};
