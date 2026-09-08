import React from 'react';
import { Home, Wallet, User } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  walletBadge?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  walletBadge,
}) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'wallet' as TabType, label: 'Wallet', icon: Wallet, badge: walletBadge },
    { id: 'profile' as TabType, label: 'Profile', icon: User },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d1424]/95 backdrop-blur-lg border-t border-slate-800/90 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
    >
      <div className="max-w-md mx-auto px-6 py-2.5 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              {/* Active subtle background pill */}
              {isActive && (
                <span className="absolute inset-0 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 pointer-events-none" />
              )}

              <div className="relative mb-1">
                <Icon
                  className={`w-6 h-6 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'scale-100 stroke-[1.8]'
                  }`}
                />
                {tab.id === 'wallet' && typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#0d1424] animate-pulse" />
                )}
              </div>

              <span className="text-xs tracking-wide">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
