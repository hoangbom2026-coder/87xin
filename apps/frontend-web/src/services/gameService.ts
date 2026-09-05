/**
 * Game history, bets, and transaction query services.
 */
import api from './api';
import type { ApiResponse } from '../types';

export const getWagerList = async (params?: any): Promise<ApiResponse<any>> => {
  return await api.post<any, ApiResponse<any>>('/transactions/bets', params || {});
};

export const getGameHistory = async (params?: any): Promise<ApiResponse<any>> => {
  return await api.post<any, ApiResponse<any>>('/transactions/list', params || {});
};
