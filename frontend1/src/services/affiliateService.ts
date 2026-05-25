import api from './api'
import { ApiResponse } from '../types'

export interface AffiliateDetail {
  label: string;
  value: number;
  isMoney: boolean;
}

export interface AffiliateOverviewData {
  inviteLink: string;
  inviteCode: string;
  unclaimedBalance: number;
  details: AffiliateDetail[];
}

export const getAffiliateOverview = async (): Promise<ApiResponse<AffiliateOverviewData>> => {
  return await api.get('/user-affiliate/overview')
}

export const claimAffiliateCommission = async (): Promise<ApiResponse<{ amount: number }>> => {
  return await api.post('/user-affiliate/claim')
}
