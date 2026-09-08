import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Phone, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  defaultEmail?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  defaultEmail = '',
}) => {
  const [mobile, setMobile] = useState('');
  const [gmail, setGmail] = useState(defaultEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(val);
    if (error) setError(null);
  };

  const handleGmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGmail(e.target.value);
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(gmail)) {
      setError('Please enter a valid Gmail address');
      return;
    }

    setError(null);
    setIsLoading(true);

    // Circular loader spin, then opens app
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        id: `UID-${mobile}`,
        mobile,
        gmail,
        joinedAt: new Date().toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#080d1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121a2e] border border-slate-800 rounded-3xl p-7 shadow-2xl relative">
        {/* Logo & Title */}
        <div className="text-center mb-7 flex flex-col items-center">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-400 shadow-xl shadow-emerald-500/20">
              <img
                src="/logo.jpg"
                alt="Data Earn Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Data Earn</h1>
          <p className="text-xs text-slate-400 mt-1">
            Data Mining, Coins & Rupee Earnings
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Mobile Number (at the very top) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              Mobile Number
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-sm font-medium text-slate-400 select-none">
                +91
              </span>
              <input
                id="mobile-input"
                type="tel"
                value={mobile}
                onChange={handleMobileChange}
                placeholder="Enter Mobile Number"
                disabled={isLoading}
                className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl pl-13 pr-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all text-sm font-medium tracking-wide"
              />
            </div>
          </div>

          {/* 2. Gmail (below mobile number) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              Gmail
            </label>
            <div className="relative flex items-center">
              <input
                id="gmail-input"
                type="email"
                value={gmail}
                onChange={handleGmailChange}
                placeholder="Enter Gmail"
                disabled={isLoading}
                className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all text-sm font-medium"
              />
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-rose-400 font-medium px-1"
            >
              {error}
            </motion.p>
          )}

          {/* 3. Continue Button (below Gmail) */}
          <button
            id="continue-button"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 relative bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-base active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2.5">
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>Loading...</span>
              </div>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
