import React, { useState, useRef } from 'react';
import {
  Mail,
  Phone,
  Calendar,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile } from '../types';
import { KycModal } from './KycModal';

interface ProfileScreenProps {
  user: UserProfile;
  totalEarned: number;
  walletBalance: number;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onKycComplete: (details: {
    aadhaar: string;
    photoUrl: string;
    utr: string;
    amount: number;
  }) => void;
  customQrUrl?: string | null;
  customUpiId?: string;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  totalEarned,
  walletBalance,
  onLogout,
  onOpenAdmin,
  onKycComplete,
  customQrUrl,
  customUpiId,
}) => {
  const [showKycModal, setShowKycModal] = useState(false);

  // 10-second hold logic for Admin panel
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100%
  const [secondsRemaining, setSecondsRemaining] = useState(10);
  const holdStartRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const triggeredAdminRef = useRef<boolean>(false);

  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const clearHold = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    touchStartPosRef.current = null;
    setIsHolding(false);
    setHoldProgress(0);
    setSecondsRemaining(10);
  };

  const handleHoldStart = () => {
    triggeredAdminRef.current = false;
    holdStartRef.current = Date.now();
    setIsHolding(true);
    setHoldProgress(0);
    setSecondsRemaining(10);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(100, (elapsed / 10000) * 100);
      const remaining = Math.max(0, Math.ceil((10000 - elapsed) / 1000));

      setHoldProgress(progress);
      setSecondsRemaining(remaining);

      if (elapsed >= 10000) {
        triggeredAdminRef.current = true;
        clearHold();
        onOpenAdmin();
      }
    }, 100);
  };

  const handleHoldEnd = () => {
    const elapsed = Date.now() - holdStartRef.current;
    const wasTriggered = triggeredAdminRef.current;
    clearHold();

    // If it was a quick tap (< 800ms) and Admin was not triggered, trigger normal logout
    if (!wasTriggered && elapsed < 800 && elapsed > 50) {
      onLogout();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartPosRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
    handleHoldStart();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current || e.touches.length === 0) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y);
    if (dx > 30 || dy > 30) {
      clearHold();
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Profile Card */}
      <div className="bg-[#121a2e] border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-emerald-500/20">
            {user.gmail.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {user.id || `UID-${user.mobile}`}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  user.kycStatus === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                }`}
              >
                {user.kycStatus === 'completed' ? '✓ KYC Completed' : '⏳ KYC Processing'}
              </span>
            </div>
            <h2 className="text-base font-bold text-white truncate">{user.gmail}</h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>+91 {user.mobile}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>Joined: {user.joinedAt || 'Today'}</span>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-[#0a0f1d] p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400">Total Earned</span>
            <p className="text-lg font-black text-emerald-400 mt-0.5">
              ₹{totalEarned.toFixed(2)}
            </p>
          </div>
          <div className="bg-[#0a0f1d] p-3 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400">Wallet Balance</span>
            <p className="text-lg font-black text-white mt-0.5">
              ₹{walletBalance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Account Info Details */}
      <div className="bg-[#121a2e] border border-slate-800 rounded-2xl p-4 divide-y divide-slate-800/80 text-xs">
        <div className="flex items-center justify-between py-2.5">
          <span className="text-slate-400 flex items-center gap-2">
            <img
              src="/logo.jpg"
              alt="Data Earn Logo"
              referrerPolicy="no-referrer"
              className="w-4 h-4 rounded-full object-cover"
            />
            Application
          </span>
          <span className="text-white font-bold">Data Earn</span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-slate-400">User ID</span>
          <span className="text-amber-300 font-mono font-bold">
            {user.id || `UID-${user.mobile}`}
          </span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-slate-400 flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            Gmail
          </span>
          <span className="text-white font-medium">{user.gmail}</span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-slate-400 flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            Mobile Number
          </span>
          <span className="text-white font-medium">+91 {user.mobile}</span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            KYC Status
          </span>
          <span
            className={`font-bold ${
              user.kycStatus === 'completed'
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}
          >
            {user.kycStatus === 'completed' ? 'Completed' : 'Processing'}
          </span>
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="space-y-3 pt-1">
        {/* 
          1. KYC Complete Button in ORANGE COLOR right above the Logout button:
          "लॉगआउट का जो बटन रहेगा, उसके ऊपर में KYC कंप्लीट करके एक बटन ऐड कर दो जो कि ऑरेंज कलर का होना चाहिए।"
        */}
        <button
          type="button"
          onClick={() => setShowKycModal(true)}
          className={`w-full py-3.5 px-4 rounded-xl active:scale-[0.98] text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            user.kycStatus === 'completed'
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'
              : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span>
            {user.kycStatus === 'completed'
              ? 'KYC Completed (View Details)'
              : 'KYC Complete'}
          </span>
        </button>

        {/* 
          2. Logout Button:
          "लॉगआउट वाले बटन पर 10 सेकंड क्लिक करके होल्ड करेंगे, टैप करके 10 सेकंड। तो 10 सेकंड बाद एक न्यू स्क्रीन ओपन होना चाहिए।"
        */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={handleHoldStart}
            onMouseUp={handleHoldEnd}
            onMouseLeave={handleHoldEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleHoldEnd}
            onTouchCancel={handleHoldEnd}
            onContextMenu={(e) => e.preventDefault()}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all select-none cursor-pointer relative overflow-hidden border touch-none ${
              isHolding
                ? 'bg-amber-950/50 text-amber-300 border-amber-500/60 shadow-lg shadow-amber-500/20 scale-[0.99]'
                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30 active:scale-[0.99]'
            }`}
          >
            {/* Hold progress bar */}
            {isHolding && (
              <div
                className="absolute left-0 top-0 bottom-0 bg-amber-500/30 transition-all pointer-events-none"
                style={{ width: `${holdProgress}%` }}
              />
            )}

            <div className="relative z-10 flex items-center justify-center gap-2">
              {isHolding ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping inline-block" />
                  <span className="font-mono text-base font-black tracking-wider text-amber-300">
                    {secondsRemaining}s
                  </span>
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* KYC Complete Modal for Profile screen */}
      <KycModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        user={user}
        walletBalance={walletBalance}
        onKycComplete={onKycComplete}
        customQrUrl={customQrUrl}
        customUpiId={customUpiId}
      />
    </div>
  );
};

