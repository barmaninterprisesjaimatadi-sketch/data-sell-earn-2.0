import React from 'react';
import { Sparkles, Wallet, ShieldCheck } from 'lucide-react';
import { UserProfile, TabType } from '../types';

interface HeaderProps {
  user: UserProfile;
  walletBalance: number;
  onWalletClick: () => void;
  activeTab: TabType;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  walletBalance,
  onWalletClick,
  activeTab,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand & User Greeting */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src="/logo.jpg"
              alt="Data Earn Logo"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-emerald-500/50 shadow-md shadow-emerald-500/20"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0b0f19] rounded-full" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
              <span>Data Earn</span>
            </h1>
            <p className="text-[11px] text-slate-400 truncate max-w-[140px] sm:max-w-[180px]">
              {user.gmail}
            </p>
          </div>
        </div>

        {/* Quick Wallet Balance Pill */}
        <button
          type="button"
          onClick={onWalletClick}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
            activeTab === 'wallet'
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-slate-800/80 border-slate-700/80 text-white hover:border-emerald-500/40'
          }`}
        >
          <Wallet className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-black">₹{walletBalance.toFixed(2)}</span>
        </button>
      </div>
    </header>
  );
};
