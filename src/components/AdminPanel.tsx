import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  QrCode,
  ArrowDownToLine,
  Search,
  CheckCircle2,
  Clock,
  Upload,
  ArrowLeft,
  ShieldCheck,
  Phone,
  Mail,
  CreditCard,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { UserProfile, Transaction, AdminSettings } from '../types';

interface AdminPanelProps {
  onClose: () => void;
  users: UserProfile[];
  onToggleUserKyc: (mobile: string) => void;
  transactions: Transaction[];
  onToggleWithdrawalStatus: (txId: string) => void;
  adminSettings: AdminSettings;
  onUpdateAdminSettings: (newSettings: AdminSettings) => void;
}

type AdminTab = 'users' | 'qr' | 'withdrawals';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onClose,
  users,
  onToggleUserKyc,
  transactions,
  onToggleWithdrawalStatus,
  adminSettings,
  onUpdateAdminSettings,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // Tab 1: User search state
  const [searchMobile, setSearchMobile] = useState('');

  // Tab 2: QR Code & UPI state
  const [qrImagePreview, setQrImagePreview] = useState<string | null>(
    adminSettings.customQrUrl
  );
  const [upiIdInput, setUpiIdInput] = useState(
    adminSettings.customUpiId || 'taptoearn.kyc@upi'
  );
  const [qrSavedNotice, setQrSavedNotice] = useState(false);
  const [kycToast, setKycToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Tab 3: Withdrawals search state
  const [withdrawSearchMobile, setWithdrawSearchMobile] = useState('');
  const [amountFilter, setAmountFilter] = useState('');

  // Handle QR code image file selection
  const handleQrImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save QR & UPI Settings
  const handleSaveQrSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAdminSettings({
      customQrUrl: qrImagePreview,
      customUpiId: upiIdInput.trim(),
    });
    setQrSavedNotice(true);
    setTimeout(() => setQrSavedNotice(false), 3000);
  };

  // Filter users for Tab 1 (Search by 10-digit mobile, +91 prefix, User ID, email)
  const filteredUsers = users.filter((u) => {
    if (!searchMobile.trim()) return true;
    const query = searchMobile.trim().toLowerCase();
    const queryDigits = query.replace(/\D/g, '');
    const normDigits =
      queryDigits.startsWith('91') && queryDigits.length > 10
        ? queryDigits.slice(2)
        : queryDigits;

    const userDigits = (u.mobile || '').replace(/\D/g, '');
    const userNormDigits =
      userDigits.startsWith('91') && userDigits.length > 10
        ? userDigits.slice(2)
        : userDigits;

    const matchDigits =
      normDigits.length > 0 &&
      (userDigits.includes(normDigits) || userNormDigits.includes(normDigits));
    const matchRaw = (u.mobile || '').toLowerCase().includes(query);
    const matchId = u.id ? u.id.toLowerCase().includes(query) : false;
    const matchGmail = u.gmail ? u.gmail.toLowerCase().includes(query) : false;

    return matchDigits || matchRaw || matchId || matchGmail;
  });

  const handleUserToggle = (mobile: string, currentStatus?: string) => {
    onToggleUserKyc(mobile);
    const willBe = currentStatus === 'completed' ? 'Processing' : 'Completed';
    setKycToast(`User +91 ${mobile} KYC status updated to: ${willBe}`);
    setTimeout(() => setKycToast(null), 3000);
  };

  // Filter withdrawals for Tab 3
  const withdrawalTxs = transactions.filter((tx) => tx.type === 'withdraw');
  const filteredWithdrawals = withdrawalTxs.filter((tx) => {
    const matchesMobile = withdrawSearchMobile.trim()
      ? tx.userMobile?.includes(withdrawSearchMobile.trim()) ||
        tx.method?.includes(withdrawSearchMobile.trim()) ||
        tx.utr?.includes(withdrawSearchMobile.trim())
      : true;

    const matchesAmount = amountFilter.trim()
      ? tx.amount.toString().includes(amountFilter.trim())
      : true;

    return matchesMobile && matchesAmount;
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0f1d] flex flex-col text-slate-100 overflow-hidden">
      {/* Top Header */}
      <div className="bg-[#121a2e] border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img
            src="/logo.jpg"
            alt="Data Earn Logo"
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover border border-emerald-500/40"
          />
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <span>Data Earn Admin</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Firestore Connected
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Manage KYC, QR payment & Withdrawals
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-xs font-semibold text-slate-300 border border-slate-700 transition-all cursor-pointer"
        >
          Exit Admin
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-28 max-w-lg mx-auto w-full">
        {/* ========================================================= */}
        {/* TAB 1: User KYC Verification Management                   */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Realtime Toast notification */}
            <AnimatePresence>
              {kycToast && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">{kycToast}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search input at the top */}
            <div className="bg-[#121a2e] border border-slate-800 rounded-2xl p-3.5 shadow-md">
              <label className="text-xs font-bold text-slate-200 block mb-1.5 flex items-center justify-between">
                <span>Search User by Mobile Number or ID</span>
                <span className="text-[11px] font-normal text-slate-400">
                  {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
                </span>
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchMobile}
                  onChange={(e) => setSearchMobile(e.target.value)}
                  placeholder="Enter 10-digit mobile number or ID..."
                  className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                {searchMobile && (
                  <button
                    type="button"
                    onClick={() => setSearchMobile('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Instruction banner */}
            <p className="text-xs text-slate-400 px-1">
              Click on a user card or button to toggle KYC status between{' '}
              <strong className="text-amber-400">Processing</strong> and{' '}
              <strong className="text-emerald-400">Completed</strong>.
            </p>

            {/* Users List */}
            <div className="space-y-3">
              {filteredUsers.length === 0 ? (
                <div className="bg-[#121a2e] border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
                  <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">
                    {searchMobile.trim()
                      ? `No user found matching "${searchMobile.trim()}"`
                      : 'No users registered yet'}
                  </p>
                  {searchMobile.trim() && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <p className="text-xs text-slate-400 mb-2.5">
                        Want to register and approve KYC for this number immediately?
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const clean = searchMobile.replace(/\D/g, '').slice(-10);
                          if (clean) {
                            handleUserToggle(clean, 'processing');
                          }
                        }}
                        className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Register & Complete KYC for +91 {searchMobile.replace(/\D/g, '').slice(-10) || searchMobile.trim()}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isCompleted = u.kycStatus === 'completed';
                  const displayId = u.id || `UID-${u.mobile}`;

                  return (
                    <motion.div
                      key={u.mobile}
                      whileTap={{ scale: 0.99 }}
                      className={`p-4 rounded-2xl border transition-all shadow-lg select-none ${
                        isCompleted
                          ? 'bg-emerald-950/20 border-emerald-500/50 hover:border-emerald-400'
                          : 'bg-[#121a2e] border-slate-800 hover:border-amber-500/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 ${
                              isCompleted
                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {(u.gmail || 'U').slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            {/* User ID Badge prominently displayed */}
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                {displayId}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Joined: {u.joinedAt || 'Today'}
                              </span>
                            </div>

                            {/* Registered Mobile Number */}
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-sm font-black text-white">
                                +91 {u.mobile}
                              </span>
                            </div>

                            {/* Gmail */}
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span className="truncate max-w-[190px]">{u.gmail}</span>
                            </p>
                          </div>
                        </div>

                        {/* Current KYC Status Badge */}
                        <div className="text-right shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                              isCompleted
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            }`}
                          >
                            {isCompleted ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Completed</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5" />
                                <span>Processing</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Extra details if available (Aadhaar / UTR) */}
                      {(u.aadhaar || u.utr) && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                          {u.aadhaar && <div>Aadhaar: <strong className="text-slate-200">{u.aadhaar}</strong></div>}
                          {u.utr && <div>UTR: <strong className="text-slate-200">{u.utr}</strong></div>}
                        </div>
                      )}

                      {/* Explicit Action Button to Toggle KYC */}
                      <button
                        type="button"
                        onClick={() => handleUserToggle(u.mobile, u.kycStatus)}
                        className={`w-full mt-3 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                          isCompleted
                            ? 'bg-slate-800 hover:bg-amber-500/20 text-emerald-400 hover:text-amber-400 border border-emerald-500/40 hover:border-amber-500/50'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>KYC Completed (Click to Revert to Processing)</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-slate-950" />
                            <span>Click to Mark KYC Completed</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: QR Code Image Upload & UPI ID Settings             */}
        {/* ========================================================= */}
        {activeTab === 'qr' && (
          <form onSubmit={handleSaveQrSettings} className="space-y-5">
            {/* Notification */}
            <AnimatePresence>
              {qrSavedNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>QR Code & UPI ID updated successfully for all users!</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Square-sized box for QR Code Image Upload as explicitly requested */}
            <div className="bg-[#121a2e] border border-slate-800 rounded-3xl p-5 flex flex-col items-center justify-center space-y-3 shadow-xl">
              <label className="text-xs font-bold text-slate-300">
                Upload Custom KYC QR Code
              </label>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleQrImageSelect}
                className="hidden"
              />

              {/* Square Box Container */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-56 h-56 aspect-square rounded-2xl border-2 border-dashed border-emerald-500/50 bg-[#0a0f1d] hover:bg-slate-900/80 transition-all cursor-pointer flex flex-col items-center justify-center p-3 text-center relative overflow-hidden shadow-inner group"
              >
                {qrImagePreview ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-white rounded-xl p-2">
                    <img
                      src={qrImagePreview}
                      alt="Uploaded KYC QR Code"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity rounded-xl gap-1">
                      <Upload className="w-6 h-6 text-emerald-400" />
                      <span className="text-[11px] font-semibold">Change QR Image</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400 group-hover:text-emerald-400">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">
                        Click to Upload QR Code
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Square QR Code image (PNG/JPG)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {qrImagePreview && (
                <button
                  type="button"
                  onClick={() => setQrImagePreview(null)}
                  className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                >
                  Remove custom image (revert to default)
                </button>
              )}
            </div>

            {/* Input field for UPI ID */}
            <div className="bg-[#121a2e] border border-slate-800 rounded-2xl p-4 space-y-2 shadow-md">
              <label className="text-xs font-semibold text-slate-300">
                Enter Receiving UPI ID
              </label>
              <input
                type="text"
                required
                value={upiIdInput}
                onChange={(e) => setUpiIdInput(e.target.value)}
                placeholder="e.g. yourname@okaxis or merchant@upi"
                className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <p className="text-[11px] text-slate-400">
                This UPI ID will receive verification payments in the KYC step.
              </p>
            </div>

            {/* Confirm Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Save QR Settings</span>
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* TAB 3: Withdrawal Approvals Management                     */}
        {/* ========================================================= */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            {/* Search by mobile number & set amount */}
            <div className="bg-[#121a2e] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Search User by Mobile Number
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={withdrawSearchMobile}
                    onChange={(e) => setWithdrawSearchMobile(e.target.value)}
                    placeholder="Search mobile number or UTR..."
                    className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Set Amount Filter (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400">₹</span>
                  <input
                    type="number"
                    value={amountFilter}
                    onChange={(e) => setAmountFilter(e.target.value)}
                    placeholder="Filter by amount..."
                    className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 px-1">
              Click on any withdrawal amount item to toggle its status between{' '}
              <strong className="text-amber-400">Processing / Pending</strong> and{' '}
              <strong className="text-emerald-400">Completed</strong>.
            </p>

            {/* List of Withdrawals */}
            <div className="space-y-2.5">
              {filteredWithdrawals.length === 0 ? (
                <div className="bg-[#121a2e] border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">
                    No matching withdrawals found
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Withdrawal requests will appear here
                  </p>
                </div>
              ) : (
                filteredWithdrawals.map((tx) => {
                  const isCompleted = tx.status === 'completed';

                  return (
                    <motion.div
                      key={tx.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onToggleWithdrawalStatus(tx.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-md select-none ${
                        isCompleted
                          ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400'
                          : 'bg-[#121a2e] border-slate-800 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-extrabold text-white">
                              ₹{tx.amount.toFixed(2)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isCompleted
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              }`}
                            >
                              {isCompleted ? 'Completed' : 'Processing'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 mt-1">
                            {tx.userMobile ? `User: +91 ${tx.userMobile}` : 'Current User'}
                          </p>

                          {tx.utr && (
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              UTR: {tx.utr}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {tx.timestamp}
                          </p>
                        </div>

                        <div className="text-right">
                          <button
                            type="button"
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                              isCompleted
                                ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                            }`}
                          >
                            {isCompleted ? 'Mark Pending' : 'Approve'}
                          </button>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Click to toggle
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Admin Bottom Navigation (3 Buttons) as explicitly requested */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#121a2e] border-t border-slate-800 px-3 py-2 z-50">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-2">
          {/* Button 1: KYC Complete */}
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[11px]">KYC Complete</span>
          </button>

          {/* Button 2: QR & UPI Settings */}
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span className="text-[11px]">QR & UPI</span>
          </button>

          {/* Button 3: Withdrawals */}
          <button
            type="button"
            onClick={() => setActiveTab('withdrawals')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'withdrawals'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span className="text-[11px]">Withdrawals</span>
          </button>
        </div>
      </div>
    </div>
  );
};
