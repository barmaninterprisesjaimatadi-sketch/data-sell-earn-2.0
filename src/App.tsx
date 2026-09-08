/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, TabType, Transaction, AdminSettings } from './types';
import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { WalletScreen } from './components/WalletScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { AdminPasswordModal } from './components/AdminPasswordModal';
import { AdminPanel } from './components/AdminPanel';
import {
  testConnection,
  syncUserToFirestore,
  subscribeToCurrentUser,
  subscribeToAllUsers,
  updateUserKycInFirestore,
  addTransactionToFirestore,
  subscribeToTransactions,
  updateTransactionStatusInFirestore,
  saveAdminSettingsToFirestore,
  subscribeToAdminSettings,
} from './lib/firebase';

export default function App() {
  // User Session State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('tap_to_earn_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.mobile) {
          // Check if tap_to_earn_all_users has the latest status from admin
          const allUsersSaved = localStorage.getItem('tap_to_earn_all_users');
          if (allUsersSaved) {
            try {
              const allUsers = JSON.parse(allUsersSaved);
              if (Array.isArray(allUsers)) {
                const found = allUsers.find(
                  (u: UserProfile) => u.mobile === parsed.mobile
                );
                if (found) {
                  return {
                    ...parsed,
                    id: found.id || parsed.id || `UID-${parsed.mobile}`,
                    kycStatus: found.kycStatus || parsed.kycStatus || 'processing',
                    aadhaar: found.aadhaar || parsed.aadhaar,
                    photoUrl: found.photoUrl || parsed.photoUrl,
                    utr: found.utr || parsed.utr,
                  };
                }
              }
            } catch {}
          }
          return {
            ...parsed,
            id: parsed.id || `UID-${parsed.mobile}`,
            kycStatus: parsed.kycStatus || 'processing',
          };
        }
      } catch {
        return null;
      }
    }
    return null;
  });

  // All registered users for Admin panel
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('tap_to_earn_all_users');
    let loadedUsers: UserProfile[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedUsers = parsed;
        }
      } catch {}
    }

    // Default seed users so Admin panel always has searchable users
    const defaultSeed: UserProfile[] = [
      {
        id: 'UID-9876543210',
        mobile: '9876543210',
        gmail: 'purushotamkumar201120@gmail.com',
        joinedAt: 'Today',
        kycStatus: 'processing',
      },
      {
        id: 'UID-9123456789',
        mobile: '9123456789',
        gmail: 'rahul.kumar@gmail.com',
        joinedAt: 'Yesterday',
        kycStatus: 'completed',
      },
    ];

    let combined = loadedUsers.length > 0 ? loadedUsers : defaultSeed;

    // Check if current logged in user exists in localStorage and ensure they are included
    const savedUserStr = localStorage.getItem('tap_to_earn_user');
    if (savedUserStr) {
      try {
        const activeUser: UserProfile = JSON.parse(savedUserStr);
        if (activeUser && activeUser.mobile) {
          const idx = combined.findIndex((u) => u.mobile === activeUser.mobile);
          if (idx === -1) {
            combined = [
              {
                ...activeUser,
                id: activeUser.id || `UID-${activeUser.mobile}`,
                kycStatus: activeUser.kycStatus || 'processing',
              },
              ...combined,
            ];
          } else {
            combined[idx] = {
              ...combined[idx],
              ...activeUser,
              id: combined[idx].id || activeUser.id || `UID-${activeUser.mobile}`,
              kycStatus: combined[idx].kycStatus || activeUser.kycStatus || 'processing',
            };
          }
        }
      } catch {}
    }

    return combined;
  });

  // Admin Settings (Custom QR image and UPI ID)
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => {
    return {
      customQrUrl: localStorage.getItem('tap_to_earn_custom_qr') || null,
      customUpiId:
        localStorage.getItem('tap_to_earn_custom_upi') || 'taptoearn.kyc@upi',
    };
  });

  // Admin View State
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Mining / Tap to Earn State
  const [isMiningActive, setIsMiningActive] = useState<boolean>(() => {
    return localStorage.getItem('tap_to_earn_mining_active') === 'true';
  });

  // Accumulation in progress (live 50 paisa / 50 coins per second)
  const [unclaimedRupees, setUnclaimedRupees] = useState<number>(() => {
    const saved = localStorage.getItem('tap_to_earn_unclaimed_rupees');
    return saved ? parseFloat(saved) : 0;
  });

  const [unclaimedCoins, setUnclaimedCoins] = useState<number>(() => {
    const saved = localStorage.getItem('tap_to_earn_unclaimed_coins');
    return saved ? parseFloat(saved) : 0;
  });

  // Wallet & Earnings State
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    const saved = localStorage.getItem('tap_to_earn_wallet_balance');
    return saved ? parseFloat(saved) : 0;
  });

  const [totalEarned, setTotalEarned] = useState<number>(() => {
    const saved = localStorage.getItem('tap_to_earn_total_earned');
    return saved ? parseFloat(saved) : 0;
  });

  const [totalWithdrawn, setTotalWithdrawn] = useState<number>(() => {
    const saved = localStorage.getItem('tap_to_earn_total_withdrawn');
    return saved ? parseFloat(saved) : 0;
  });

  // Transaction History
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('tap_to_earn_txs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
          ? parsed.filter((t: Transaction) => t.type === 'withdraw')
          : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Synchronize state with LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('tap_to_earn_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('tap_to_earn_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('tap_to_earn_all_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('tap_to_earn_mining_active', String(isMiningActive));
  }, [isMiningActive]);

  useEffect(() => {
    localStorage.setItem('tap_to_earn_unclaimed_rupees', unclaimedRupees.toString());
    localStorage.setItem('tap_to_earn_unclaimed_coins', unclaimedCoins.toString());
  }, [unclaimedRupees, unclaimedCoins]);

  useEffect(() => {
    localStorage.setItem('tap_to_earn_wallet_balance', walletBalance.toString());
    localStorage.setItem('tap_to_earn_total_earned', totalEarned.toString());
    localStorage.setItem('tap_to_earn_total_withdrawn', totalWithdrawn.toString());
  }, [walletBalance, totalEarned, totalWithdrawn]);

  useEffect(() => {
    localStorage.setItem('tap_to_earn_txs', JSON.stringify(transactions));
  }, [transactions]);

  // Test Firebase Firestore connection & subscribe to remote collections
  useEffect(() => {
    testConnection();

    // 1. Subscribe to Admin Settings from Firestore
    const unsubSettings = subscribeToAdminSettings((remoteSettings) => {
      setAdminSettings(remoteSettings);
    });

    // 2. Subscribe to All Users from Firestore
    const unsubUsers = subscribeToAllUsers((remoteUsers) => {
      if (remoteUsers && remoteUsers.length > 0) {
        setUsers(remoteUsers);
      }
    });

    // 3. Subscribe to Transactions from Firestore
    const unsubTxs = subscribeToTransactions((remoteTxs) => {
      if (remoteTxs && remoteTxs.length > 0) {
        setTransactions(remoteTxs);
      }
    });

    return () => {
      unsubSettings();
      unsubUsers();
      unsubTxs();
    };
  }, []);

  // Real-time listener for current logged-in user's profile and KYC status
  useEffect(() => {
    if (!currentUser?.mobile) return;

    const unsubUser = subscribeToCurrentUser(currentUser.mobile, (remoteUser) => {
      if (!remoteUser) return;
      setCurrentUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          id: remoteUser.id || prev.id,
          kycStatus: remoteUser.kycStatus || prev.kycStatus,
          aadhaar: remoteUser.aadhaar || prev.aadhaar,
          photoUrl: remoteUser.photoUrl || prev.photoUrl,
          utr: remoteUser.utr || prev.utr,
        };
      });
    });

    return () => {
      unsubUser();
    };
  }, [currentUser?.mobile]);

  // Per second mining interval
  useEffect(() => {
    if (!isMiningActive) return;

    const timer = setInterval(() => {
      setUnclaimedRupees((prev) => {
        const next = Math.round((prev + 0.5) * 100) / 100;
        return next;
      });
      setUnclaimedCoins((prev) => prev + 50);
    }, 1000);

    return () => clearInterval(timer);
  }, [isMiningActive]);

  // Toggle Tap to Earn
  const handleToggleMining = () => {
    setIsMiningActive((prev) => !prev);
  };

  // Claim Earnings (Min ₹50 required)
  const handleClaim = () => {
    if (unclaimedRupees < 50) return;

    const claimedAmount = unclaimedRupees;
    const nextWallet = Math.round((walletBalance + claimedAmount) * 100) / 100;
    const nextEarned = Math.round((totalEarned + claimedAmount) * 100) / 100;

    setWalletBalance(nextWallet);
    setTotalEarned(nextEarned);
    setUnclaimedRupees(0);
    setUnclaimedCoins(0);

    const claimTx: Transaction = {
      id: `claim-${Date.now()}`,
      userMobile: currentUser?.mobile,
      type: 'claim',
      amount: claimedAmount,
      coins: unclaimedCoins,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'completed',
    };

    setTransactions((prev) => [claimTx, ...prev]);
    addTransactionToFirestore(claimTx).catch(console.error);

    if (currentUser) {
      syncUserToFirestore(currentUser, {
        walletBalance: nextWallet,
        totalEarned: nextEarned,
        unclaimedRupees: 0,
        unclaimedCoins: 0,
      }).catch(console.error);
    }
  };

  // Withdraw Action from Wallet (saved with status 'pending' as explicitly required)
  const handleWithdraw = (
    amount: number,
    method: string,
    utr?: string,
    aadhaar?: string
  ) => {
    if (amount > walletBalance || amount <= 0) return;

    const nextWallet = Math.round((walletBalance - amount) * 100) / 100;
    const nextWithdrawn = Math.round((totalWithdrawn + amount) * 100) / 100;
    setWalletBalance(nextWallet);
    setTotalWithdrawn(nextWithdrawn);

    const newTx: Transaction = {
      id: `wd-${Date.now()}`,
      userMobile: currentUser?.mobile || '9876543210',
      type: 'withdraw',
      amount: amount,
      method: method,
      utr: utr,
      aadhaar: aadhaar,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'pending',
    };

    setTransactions((prev) => [newTx, ...prev]);
    addTransactionToFirestore(newTx).catch(console.error);

    if (currentUser) {
      syncUserToFirestore(currentUser, {
        walletBalance: nextWallet,
      }).catch(console.error);
    }
  };

  // Login handler
  const handleLoginSuccess = (user: UserProfile) => {
    // Read the latest all_users from localStorage or state
    let allUsers = users;
    const saved = localStorage.getItem('tap_to_earn_all_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          allUsers = parsed;
        }
      } catch {}
    }

    const existing = allUsers.find((u) => u.mobile === user.mobile);
    const resolvedKycStatus =
      existing?.kycStatus || user.kycStatus || 'processing';
    const resolvedId = existing?.id || user.id || `UID-${user.mobile}`;

    const fullUser: UserProfile = {
      ...user,
      id: resolvedId,
      kycStatus: resolvedKycStatus,
      aadhaar: existing?.aadhaar || user.aadhaar,
      photoUrl: existing?.photoUrl || user.photoUrl,
      utr: existing?.utr || user.utr,
      joinedAt: existing?.joinedAt || user.joinedAt || 'Today',
    };

    setCurrentUser(fullUser);
    localStorage.setItem('tap_to_earn_user', JSON.stringify(fullUser));

    // Save to Firestore
    syncUserToFirestore(fullUser, {
      walletBalance,
      totalEarned,
      unclaimedRupees,
      unclaimedCoins,
      isMiningActive,
    }).catch(console.error);

    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.mobile === fullUser.mobile);
      let updated: UserProfile[];
      if (idx !== -1) {
        updated = [...prev];
        updated[idx] = fullUser;
      } else {
        updated = [fullUser, ...prev];
      }
      localStorage.setItem('tap_to_earn_all_users', JSON.stringify(updated));
      return updated;
    });
    setActiveTab('home');
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    setIsMiningActive(false);
  };

  // Fast test bonus (+₹50 test helper)
  const handleAddTestBonus = (bonus: number) => {
    setUnclaimedRupees((prev) => prev + bonus);
    setUnclaimedCoins((prev) => prev + bonus * 100);
  };

  // Profile KYC Complete handler
  const handleProfileKycComplete = (details: {
    aadhaar: string;
    photoUrl: string;
    utr: string;
    amount: number;
  }) => {
    if (currentUser) {
      const updatedUser: UserProfile = {
        ...currentUser,
        aadhaar: details.aadhaar,
        photoUrl: details.photoUrl,
        utr: details.utr,
        kycStatus:
          currentUser.kycStatus === 'completed' ? 'completed' : 'processing',
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('tap_to_earn_user', JSON.stringify(updatedUser));
      syncUserToFirestore(updatedUser).catch(console.error);

      setUsers((prev) => {
        const updated = prev.map((u) =>
          u.mobile === updatedUser.mobile ? updatedUser : u
        );
        localStorage.setItem('tap_to_earn_all_users', JSON.stringify(updated));
        return updated;
      });
    }
    if (details.amount > 0 && walletBalance >= details.amount) {
      handleWithdraw(details.amount, 'UPI / QR', details.utr, details.aadhaar);
    }
  };

  // Admin: Toggle user KYC status (Completed <-> Processing)
  const handleToggleUserKyc = (mobile: string) => {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (!cleanMobile) return;

    let targetNewStatus: 'completed' | 'processing' = 'completed';

    setUsers((prev) => {
      const existing = prev.find(
        (u) => u.mobile === cleanMobile || u.mobile === mobile
      );
      let updated: UserProfile[];

      if (existing) {
        targetNewStatus =
          existing.kycStatus === 'completed' ? 'processing' : 'completed';
        updated = prev.map((u) => {
          if (u.mobile === cleanMobile || u.mobile === mobile) {
            return { ...u, kycStatus: targetNewStatus };
          }
          return u;
        });
      } else {
        targetNewStatus = 'completed';
        const newUser: UserProfile = {
          id: `UID-${cleanMobile}`,
          mobile: cleanMobile,
          gmail: `user.${cleanMobile}@gmail.com`,
          joinedAt: 'Today',
          kycStatus: 'completed',
        };
        updated = [newUser, ...prev];
      }

      localStorage.setItem('tap_to_earn_all_users', JSON.stringify(updated));
      return updated;
    });

    // Update in Firestore
    updateUserKycInFirestore(cleanMobile, targetNewStatus).catch(console.error);

    // Update currentUser if currently logged in with this mobile
    setCurrentUser((prev) => {
      if (
        prev &&
        (prev.mobile === cleanMobile || prev.mobile === mobile)
      ) {
        const updated = { ...prev, kycStatus: targetNewStatus };
        localStorage.setItem('tap_to_earn_user', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  };

  // Admin: Toggle withdrawal transaction status (Completed <-> Pending)
  const handleToggleWithdrawalStatus = (txId: string) => {
    let nextStatus: 'completed' | 'processing' | 'pending' = 'completed';
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === txId) {
          nextStatus = tx.status === 'completed' ? 'pending' : 'completed';
          return { ...tx, status: nextStatus };
        }
        return tx;
      })
    );
    updateTransactionStatusInFirestore(txId, nextStatus).catch(console.error);
  };

  // Admin: Update QR & UPI settings
  const handleUpdateAdminSettings = (newSettings: AdminSettings) => {
    setAdminSettings(newSettings);
    saveAdminSettingsToFirestore(newSettings).catch(console.error);
    if (newSettings.customQrUrl) {
      localStorage.setItem('tap_to_earn_custom_qr', newSettings.customQrUrl);
    } else {
      localStorage.removeItem('tap_to_earn_custom_qr');
    }
    if (newSettings.customUpiId) {
      localStorage.setItem('tap_to_earn_custom_upi', newSettings.customUpiId);
    }
  };

  // If user is not logged in, display the Login Screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        defaultEmail=""
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <Header
        user={currentUser}
        walletBalance={walletBalance}
        onWalletClick={() => setActiveTab('wallet')}
        activeTab={activeTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4">
        {activeTab === 'home' && (
          <HomeScreen
            isMiningActive={isMiningActive}
            onToggleMining={handleToggleMining}
            unclaimedRupees={unclaimedRupees}
            unclaimedCoins={unclaimedCoins}
            onClaim={handleClaim}
            onAddTestBonus={handleAddTestBonus}
          />
        )}

        {activeTab === 'wallet' && (
          <WalletScreen
            walletBalance={walletBalance}
            totalEarned={totalEarned}
            totalWithdrawn={totalWithdrawn}
            transactions={transactions}
            onWithdraw={handleWithdraw}
            user={currentUser}
            customQrUrl={adminSettings.customQrUrl}
            customUpiId={adminSettings.customUpiId}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen
            user={currentUser}
            totalEarned={totalEarned}
            walletBalance={walletBalance}
            onLogout={handleLogout}
            onOpenAdmin={() => setShowAdminPasswordModal(true)}
            onKycComplete={handleProfileKycComplete}
            customQrUrl={adminSettings.customQrUrl}
            customUpiId={adminSettings.customUpiId}
          />
        )}
      </main>

      {/* Bottom Navigation with 3 tabs: Home, Wallet, Profile */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        walletBadge={walletBalance}
      />

      {/* Admin Password Prompt Modal */}
      <AdminPasswordModal
        isOpen={showAdminPasswordModal}
        onClose={() => setShowAdminPasswordModal(false)}
        onSuccess={() => {
          setShowAdminPasswordModal(false);
          setIsAdminOpen(true);
        }}
      />

      {/* Admin Control Panel (when authenticated) */}
      {isAdminOpen && (
        <AdminPanel
          onClose={() => setIsAdminOpen(false)}
          users={users}
          onToggleUserKyc={handleToggleUserKyc}
          transactions={transactions}
          onToggleWithdrawalStatus={handleToggleWithdrawalStatus}
          adminSettings={adminSettings}
          onUpdateAdminSettings={handleUpdateAdminSettings}
        />
      )}
    </div>
  );
}

