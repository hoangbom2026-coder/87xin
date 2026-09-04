export interface BaseEntity {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface HomeSection {
  id: string;
  enabled: boolean;
  order: number;
  title: string;
  subtitle?: string;
  image?: string;
}

/** User contract từ backend — mở rộng tại `user.type.ts` */
export interface PlayerUser extends BaseEntity {
  username: string;
  balance: number;
  role: 'user' | 'admin';
  isActive: boolean;
}

export interface Transaction extends BaseEntity {
  userId: string;
  amount: number;
  type: 'deposit' | 'withdraw';
  status: 'pending' | 'completed' | 'cancelled';
  proofUrl?: string;
}
