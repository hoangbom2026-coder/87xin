import { 
  Plus, 
  Trash2, 
  Eye, 
  RefreshCw, 
  ChevronRight, 
  Copy, 
  Check, 
  CreditCard,
  Wallet,
  Smartphone,
  Coins,
  History,
  ShieldCheck
} from 'lucide-react';

/**
 * Danh sách Icon chuẩn dùng cho toàn bộ dự án để đảm bảo sự đồng bộ.
 * Khi cần thay đổi icon cho một hành động, chỉ cần chỉnh tại đây.
 */
export const UI_ICONS = {
  // Actions
  add: Plus,
  delete: Trash2,
  view: Eye,
  refresh: RefreshCw,
  chevronRight: ChevronRight,
  copy: Copy,
  checked: Check,
  
  // Financial
  bank: CreditCard,
  wallet: Wallet,
  phone: Smartphone,
  coins: Coins,
  history: History,
  security: ShieldCheck
} as const;
