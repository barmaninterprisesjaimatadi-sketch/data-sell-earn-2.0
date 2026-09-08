import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Coins,
  Trophy,
  Zap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { LeaderboardUser } from '../types';

interface HomeScreenProps {
  isMiningActive: boolean;
  onToggleMining: () => void;
  unclaimedRupees: number;
  unclaimedCoins: number;
  onClaim: () => void;
  onAddTestBonus?: (amount: number) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  isMiningActive,
  onToggleMining,
  unclaimedRupees,
  unclaimedCoins,
  onClaim,
  onAddTestBonus,
}) => {
  const [claimToast, setClaimToast] = useState<string | null>(null);

  // Top 3 Users as explicitly specified:
  const topUsers: LeaderboardUser[] = [
    {
      rank: 1,
      name: 'Rahul Sharma',
      amount: 28450.5,
      avatarBg: 'from-amber-400 to-yellow-500',
      badge: '#1 Rank',
    },
    {
      rank: 2,
      name: 'Amit Kumar',
      amount: 21920.0,
      avatarBg: 'from-slate-300 to-slate-400',
      badge: '#2 Rank',
    },
    {
      rank: 3,
      name: 'Priya Verma',
      amount: 17650.0,
      avatarBg: 'from-amber-600 to-orange-600',
      badge: '#3 Rank',
    },
  ];

  const minClaimAmount = 50;
  const canClaim = unclaimedRupees >= minClaimAmount;
  const progressPercent = Math.min(100, (unclaimedRupees / minClaimAmount) * 100);

  const handleClaimClick = () => {
    if (!canClaim) {
      setClaimToast(`Minimum ₹50 required to claim. Current: ₹${unclaimedRupees.toFixed(2)}`);
      setTimeout(() => setClaimToast(null), 3000);
      return;
    }

    const claimedVal = unclaimedRupees;
    onClaim();
    setClaimToast(`₹${claimedVal.toFixed(2)} successfully claimed to your wallet!`);
    setTimeout(() => setClaimToast(null), 3500);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Toast Notification */}
      <AnimatePresence>
        {claimToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xl border ${
              claimToast.includes('successfully')
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : 'bg-amber-950/90 border-amber-500/50 text-amber-200'
            }`}
          >
            {claimToast.includes('successfully') ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{claimToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Mining Circle Section */}
      <div className="flex flex-col items-center justify-center pt-2">
        {/* Status Chip */}
        <div className="flex items-center gap-2 mb-5">
          <div
            className={`px-3.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isMiningActive
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-400 border border-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isMiningActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <span>{isMiningActive ? 'Mining Active' : 'Tap to Start'}</span>
          </div>

          {isMiningActive && (
            <span className="text-[11px] font-medium text-emerald-400/90 flex items-center gap-1 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/40">
              <Zap className="w-3 h-3 text-emerald-400" />
              +50 Coins (50 Paisa) / sec
            </span>
          )}
        </div>

        {/* 
          The Circle strictly per user prompt:
          - White circle, "Tap to earn" in black text
          - When clicked: black circle, "Tap to earn" in white text, green light glowing around
          - When clicked again: turns off light, returns to white
        */}
        <div className="relative flex items-center justify-center p-4">
          {isMiningActive && (
            <>
              <div className="absolute w-64 h-64 rounded-full border-2 border-emerald-400/40 animate-ping pointer-events-none" />
              <div className="absolute w-72 h-72 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
            </>
          )}

          <button
            id="tap-to-earn-button"
            type="button"
            onClick={onToggleMining}
            aria-label="Tap to earn"
            className={`w-56 h-56 rounded-full flex flex-col items-center justify-center select-none cursor-pointer transition-all duration-300 relative z-10 active:scale-95 ${
              isMiningActive
                ? 'bg-black text-white active-green-glow border-[5px] border-emerald-500 shadow-[0_0_40px_10px_rgba(34,197,94,0.65)]'
                : 'bg-white text-black border-[5px] border-slate-200 shadow-2xl hover:shadow-white/20'
            }`}
          >
            <div className="flex flex-col items-center justify-center text-center p-4">
              <div className="mb-2">
                <Coins
                  className={`w-10 h-10 transition-transform duration-300 ${
                    isMiningActive ? 'text-emerald-400 animate-bounce' : 'text-slate-800'
                  }`}
                />
              </div>

              <span
                className={`text-2xl font-black tracking-tight leading-tight transition-colors duration-300 ${
                  isMiningActive ? 'text-white' : 'text-black'
                }`}
              >
                Tap to earn
              </span>

              <span
                className={`text-[11px] font-semibold mt-1.5 transition-colors duration-300 ${
                  isMiningActive ? 'text-emerald-400' : 'text-slate-600'
                }`}
              >
                {isMiningActive ? 'Running' : 'Tap to Start'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 
        Amount Accumulation & Claim Section:
        - Left: Live Amount
        - Right: Claim Button
      */}
      <div
        id="live-earnings-container"
        className="bg-[#121a2e] border border-slate-800/90 rounded-2xl p-4.5 shadow-xl relative overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left Side: Live Increasing Amount */}
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Earnings</span>
              {isMiningActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              )}
            </div>

            {/* Rupee display */}
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1">
              <span className="text-emerald-400">₹</span>
              <span>{unclaimedRupees.toFixed(2)}</span>
            </div>

            {/* Coins breakdown */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                <Coins className="w-3 h-3 text-amber-400" />
                {Math.floor(unclaimedCoins).toLocaleString('en-IN')} Coins
              </span>
              <span className="text-[11px] text-slate-400">
                (50 Paisa / sec)
              </span>
            </div>
          </div>

          {/* Right Side: Claim Button */}
          <div className="flex flex-col items-end gap-1.5">
            <button
              id="claim-earnings-button"
              type="button"
              onClick={handleClaimClick}
              className={`px-5 py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                canClaim
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/30 ring-2 ring-emerald-400/50 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border border-slate-700/80 hover:border-slate-600'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${canClaim ? 'text-amber-200' : 'text-slate-500'}`} />
              <span>Claim</span>
            </button>

            <span className="text-[11px] font-medium text-slate-400 text-right">
              {canClaim ? (
                <span className="text-emerald-400 font-semibold">Ready to Claim</span>
              ) : (
                <span>Min ₹50 (Remaining: ₹{(minClaimAmount - unclaimedRupees).toFixed(2)})</span>
              )}
            </span>
          </div>
        </div>

        {/* Progress Bar towards ₹50 Claim Requirement */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span>Goal: ₹50.00</span>
            <span className="font-semibold text-slate-300">
              {progressPercent.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                canClaim
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-sm shadow-emerald-400'
                  : 'bg-emerald-500/70'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Testing helper */}
        {onAddTestBonus && (
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              Quick Test:
            </span>
            <button
              type="button"
              onClick={() => onAddTestBonus(50)}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-2 cursor-pointer"
            >
              +₹50 (Instant Claim Test)
            </button>
          </div>
        )}
      </div>

      {/* 
        Leaderboard Section:
        - Top 3 users
        - Left: User Name
        - Right: Amount
      */}
      <div id="leaderboard-section" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Leaderboard</h2>
              <p className="text-xs text-slate-400">Top 3 Users</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Live Ranking
          </span>
        </div>

        {/* Scrollable list for Top 3 Users */}
        <div
          id="leaderboard-scroll-list"
          className="space-y-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700"
        >
          {topUsers.map((user) => (
            <div
              key={user.rank}
              id={`leaderboard-user-${user.rank}`}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                user.rank === 1
                  ? 'bg-gradient-to-r from-amber-950/30 via-[#121a2e] to-[#121a2e] border-amber-500/30 shadow-md shadow-amber-500/5'
                  : user.rank === 2
                  ? 'bg-[#121a2e] border-slate-700/80'
                  : 'bg-[#121a2e] border-slate-800'
              }`}
            >
              {/* Left Side: User Name and Avatar */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${user.avatarBg} flex items-center justify-center text-slate-900 font-extrabold text-sm shadow`}
                  >
                    {user.name.slice(0, 1)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-xs">
                    {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white">{user.name}</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    {user.badge}
                  </span>
                </div>
              </div>

              {/* Right Side: Amount */}
              <div className="text-right">
                <div className="text-sm sm:text-base font-extrabold text-emerald-400">
                  ₹{user.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Total Earned
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
