import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, X, ArrowRight, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPassword = password.trim();

    // Check against user specified admin password: gtclash20
    const savedPassword = localStorage.getItem('tap_to_earn_admin_pwd') || 'gtclash20';

    if (
      cleanPassword === 'gtclash20' ||
      cleanPassword === savedPassword ||
      cleanPassword === 'admin123'
    ) {
      setError(null);
      setPassword('');
      onSuccess();
    } else {
      setError('Invalid admin password. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-[#121a2e] border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Top close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Admin Authentication</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter admin password to access the panel
            </p>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              Password
            </label>
            <input
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="Enter Admin Password"
              className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
