import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ADMIN_BASE } from '../constants/apiConfig';

const adminApi: AxiosInstance = axios.create({
  baseURL: ADMIN_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

adminApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (response) => ({
    success: true,
    data: response.data,
    message: 'Success'
  } as any),
  (error) => {
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Admin API Error'
    } as any;
  }
);

export default adminApi;
