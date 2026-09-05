import api from './api';
import type { ApiResponse } from '../types';

export interface PlayerWithdrawRow {
  _id: string;
  payoutType?: string;
  data?: Record<string, unknown>;
  amount?: number;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

export const getPlayerWithdrawHistory = async (params?: any): Promise<ApiResponse<PlayerWithdrawRow[]>> => {
  return await api.post<any, ApiResponse<PlayerWithdrawRow[]>>('/transactions/withdraw-history', params || {});
};
