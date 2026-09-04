/**
 * Base HTTP client for frontend-web.
 * Configured with baseURL, timeout, token injection, and unified response unboxing.
 */
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res: AxiosResponse) => {
    return {
      success: true,
      data: res.data?.data !== undefined ? res.data.data : res.data,
      message: res.data?.message || 'OK',
    } as any;
  },
  (err) => {
    const message = err.response?.data?.message || err.message || 'Request failed';
    return {
      success: false,
      data: null,
      message,
    } as any;
  }
);

export default api;
