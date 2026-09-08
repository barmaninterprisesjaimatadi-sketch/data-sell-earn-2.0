import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  History,
  Clock,
} from 'lucide-react';
import { Transaction, UserProfile } from '../types';
import { KycModal } from './KycModal';

interface WalletScreenProps {
  walletBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  transactions: Transaction[];
  onWithdraw: (
    amount: number,
    method: string,
    utr?: string,
    aadhaar?: string
  ) => void;
  user: UserProfile;
  customQrUrl?: string | null;
  customUpiId?: string;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({
  walletBalance,
  totalEarned,
  totalWithdrawn,
  transactions,
  onWithdraw,
  user,
  customQrUrl,
  customUpiId,
}) => {
  const [showKycModal, setShowKycModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Only display withdrawals that are pending/applied for the CURRENT user
  const withdrawTransactions = transactions.filter(
    (tx) => tx.type === 'withdraw' && tx.userMobile === user.mobile
  );

  const handleKycComplete = (details: {
    aadhaar: string;
    photoUrl: string;
    utr: string;
    amount: number;
  }) => {
    onWithdraw(
      details.amount,
      `KYC UTR: ${details.utr}`,
      details.utr,
      details.aadhaar
    );
    setNotification(
      `Withdrawal of ₹${details.amount.toFixed(2)} submitted! Status: Payment Pending`
    );
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Alert / Notification banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border shadow-lg bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 
        Big Dashboard at top of Wallet:
        - "ऊपर साइड में एक बड़ा सा डैशबोर्ड बना रहना चाहिए। उसमें अमाउंट शो करना चाहिए कि अभी तक कितना अर्न किया है। अमाउंट उसके नीचे में विड्रॉ का बटन होना चाहिए।"
      */}
      <div
        id="wallet-main-dashboard"
        className="relative bg-gradient-to-br from-[#131f38] via-[#0f172a] to-[#080d1a] border border-emerald-500/30 rounded-3xl p-6 shadow-2xl overflow-hidden"
      >
        <div className="relative z-10">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Wallet Dashboard
              </span>
            </div>
          </div>

          {/* Amount: Total Earned So Far as explicitly required */}
          <div className="space-y-1 mb-6">
            <p className="text-xs font-medium text-slate-400">
              Total Earned So Far
            </p>
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tight flex items-baseline gap-1">
              <span className="text-emerald-400">₹</span>
              <span id="wallet-total-earned">
                {totalEarned.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2 text-xs text-slate-300">
              <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
                Available Balance:{' '}
                <strong className="text-emerald-400">
                  ₹{walletBalance.toFixed(2)}
                </strong>
              </div>
              <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
                Withdrawn:{' '}
                <strong className="text-slate-200">
                  ₹{totalWithdrawn.toFixed(2)}
                </strong>
              </div>
            </div>
          </div>

          {/* 
            Withdraw Button directly below the Amount:
            Opens the KYC Complete flow (Left Cancel, Right Complete)
          */}
          <button
            id="withdraw-action-button"
            type="button"
            onClick={() => {
              setShowKycModal(true);
              setNotification(null);
            }}
            disabled={walletBalance <= 0}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xl active:scale-[0.98] ${
              walletBalance > 0
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <ArrowUpRight className="w-5 h-5" />
            <span>Withdraw</span>
          </button>
        </div>
      </div>

      {/* 
        Transactions Section:
        "वहां पर पैसा आ रहा है और कहां जा रहा है, यह सब का ऑप्शन नहीं होना चाहिए। सिर्फ और सिर्फ जो विड्रॉ लगाएंगे, वह पेमेंट पेंडिंग में रहना चाहिए जो कि वहां पर शो करना चाहिए। जितना आप पेमेंट करेंगे, विड्रॉ पर लगाएंगे।"
      */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-white">Transactions</h3>
          </div>
          <span className="text-xs text-slate-400">
            {withdrawTransactions.length} Pending
          </span>
        </div>

        {withdrawTransactions.length === 0 ? (
          <div className="bg-[#121a2e] border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
            <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">No pending withdrawals</p>
            <p className="text-xs text-slate-500 mt-1">
              Your requested withdrawals will appear here as Payment Pending
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {withdrawTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-[#121a2e] border border-slate-800/90 rounded-2xl p-3.5 flex items-center justify-between shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Withdrawal</p>
                    <p className="text-[11px] text-slate-400">{tx.timestamp}</p>
                    {tx.utr && (
                      <p className="text-[10px] text-slate-500 font-mono">
                        UTR: {tx.utr}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-white">
                    ₹{tx.amount.toFixed(2)}
                  </div>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Payment Pending
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KYC Complete Modal */}
      <KycModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        user={user}
        walletBalance={walletBalance}
        onKycComplete={handleKycComplete}
        customQrUrl={customQrUrl}
        customUpiId={customUpiId}
      />
    </div>
  );
};
