/**
 * Shared types for frontend-web application.
 * Extends base contracts from @game/shared-types with frontend-specific definitions.
 */
import type {
  IApiResponse,
  IApiResponseList,
  IApiError,
  IUserResponse,
  IGameResponse,
} from '@game/shared-types';

export type { IApiResponse, IApiResponseList, IApiError, IUserResponse, IGameResponse };

// Type alias for backward compatibility across services
export type ApiResponse<T = any> = IApiResponse<T>;

export interface User extends IUserResponse {
  id?: string;
  phone?: string;
  balance?: number;
  lockedBalance?: number;
  vipLevel?: number;
  vipTier?: string;
  currency?: string;
  currencyId?: string;
  inviteCode?: string;
  invitorId?: string;
  avatar?: string;
  updatedAt?: string | Date;
}

export interface DepositCryptoNetwork {
  id: string;
  name: string;
  rateLine: string;
  icon: string;
  disabled?: boolean;
  comingSoon?: boolean;
}

export interface FinancialFaq {
  key: string;
  qKey: string;
  aKey: string;
}

export type PromoFilterKey =
  | 'all'
  | 'vip_return'
  | 'newbie'
  | 'deposit'
  | 'casino'
  | 'slot_fishing'
  | 'sports';

export interface PromoFilterDef {
  value: PromoFilterKey;
  label: string;
}

export interface AccountMenuChild {
  id?: string;
  label: string;
  path: string;
  icon?: any;
  badge?: string | number;
  key?: string;
}

export interface AccountMenuItem {
  id: string;
  label: string;
  icon?: any;
  path?: string;
  children?: AccountMenuChild[];
  badge?: string | number;
  disabled?: boolean;
  onClick?: () => void;
  isAction?: boolean;
  external?: boolean;
  exact?: boolean;
}

export interface GameListProps {
  games?: string[] | any[];
  cornerBadge?: React.ReactNode;
  className?: string;
  asRow?: boolean;
  category?: string;
  provider?: string;
  title?: string;
  limit?: number;
  showViewAll?: boolean;
}
