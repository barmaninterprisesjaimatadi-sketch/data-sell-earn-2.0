export interface UserProfile {
  id?: string;
  mobile: string;
  gmail: string;
  joinedAt: string;
  kycStatus?: 'pending' | 'processing' | 'completed';
  aadhaar?: string;
  photoUrl?: string;
  utr?: string;
}

export type TabType = 'home' | 'wallet' | 'profile';

export interface LeaderboardUser {
  rank: number;
  name: string;
  amount: number;
  avatarBg: string;
  badge?: string;
}

export interface Transaction {
  id: string;
  userMobile?: string;
  type: 'claim' | 'withdraw';
  amount: number;
  coins?: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'processing';
  method?: string;
  utr?: string;
  aadhaar?: string;
}

export interface AdminSettings {
  customQrUrl: string | null;
  customUpiId: string;
}
