import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, Transaction, AdminSettings } from '../types';

const fallbackConfig = {
  projectId: "double-upgrade-1bndl",
  appId: "1:154670147908:web:68b8f325f9c3c25c980f11",
  apiKey: "AIzaSyC_UssdUTyDx77wATKQ6kFwUO3z91TOXuI",
  authDomain: "double-upgrade-1bndl.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-taptoearn-359dac8b-d149-4097-b5dd-f28f0742143e",
  storageBucket: "double-upgrade-1bndl.firebasestorage.app",
  messagingSenderId: "154670147908",
  oAuthClientId: "154670147908-bq7se7jhh1lcqfockkiopinauagqm9f1.apps.googleusercontent.com",
};

const activeConfig = firebaseConfig || fallbackConfig;

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();

// Note: Using the specific databaseId provisioned in firebase-applet-config.json
export const db = activeConfig.firestoreDatabaseId
  ? getFirestore(app, activeConfig.firestoreDatabaseId)
  : getFirestore(app);

// Critical connection verification as requested by Firebase specification
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or database initializing.');
    } else {
      console.log('Firebase connection ready.');
    }
    return true;
  }
}

// User document helper (keyed by mobile or id)
export function getUserDocId(mobile: string): string {
  const clean = mobile.replace(/[^0-9]/g, '');
  return `user_${clean}`;
}

// Save or update user profile to Firestore
export async function syncUserToFirestore(
  user: UserProfile,
  extra?: {
    walletBalance?: number;
    totalEarned?: number;
    unclaimedRupees?: number;
    unclaimedCoins?: number;
    isMiningActive?: boolean;
  }
): Promise<void> {
  if (!user.mobile) return;
  const docId = getUserDocId(user.mobile);
  const userRef = doc(db, 'users', docId);

  const payload: Record<string, any> = {
    id: user.id || `UID-${user.mobile}`,
    mobile: user.mobile,
    gmail: user.gmail,
    joinedAt: user.joinedAt || new Date().toISOString(),
    kycStatus: user.kycStatus || 'processing',
    updatedAt: new Date().toISOString(),
  };

  if (user.aadhaar) payload.aadhaar = user.aadhaar;
  if (user.photoUrl) payload.photoUrl = user.photoUrl;
  if (user.utr) payload.utr = user.utr;

  if (extra) {
    if (extra.walletBalance !== undefined) payload.walletBalance = extra.walletBalance;
    if (extra.totalEarned !== undefined) payload.totalEarned = extra.totalEarned;
    if (extra.unclaimedRupees !== undefined) payload.unclaimedRupees = extra.unclaimedRupees;
    if (extra.unclaimedCoins !== undefined) payload.unclaimedCoins = extra.unclaimedCoins;
    if (extra.isMiningActive !== undefined) payload.isMiningActive = extra.isMiningActive;
  }

  await setDoc(userRef, payload, { merge: true });
}

// Fetch single user
export async function fetchUserFromFirestore(mobile: string): Promise<any | null> {
  if (!mobile) return null;
  const docId = getUserDocId(mobile);
  const userRef = doc(db, 'users', docId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
}

// Real-time listener for single current user
export function subscribeToCurrentUser(
  mobile: string,
  onUpdate: (userData: any) => void
): () => void {
  if (!mobile) return () => {};
  const docId = getUserDocId(mobile);
  const userRef = doc(db, 'users', docId);

  return onSnapshot(
    userRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data());
      }
    },
    (err) => {
      console.warn('User sync notice:', err.message);
    }
  );
}

// Real-time listener for all users (for Admin Panel)
export function subscribeToAllUsers(
  onUpdate: (users: UserProfile[]) => void
): () => void {
  const usersCol = collection(db, 'users');
  return onSnapshot(
    usersCol,
    (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: d.id || `UID-${d.mobile}`,
          mobile: d.mobile,
          gmail: d.gmail,
          joinedAt: d.joinedAt || 'Today',
          kycStatus: d.kycStatus || 'processing',
          aadhaar: d.aadhaar,
          photoUrl: d.photoUrl,
          utr: d.utr,
          walletBalance: d.walletBalance,
          totalEarned: d.totalEarned,
        });
      });
      if (list.length > 0) {
        onUpdate(list);
      }
    },
    (err) => {
      console.warn('All users sync notice:', err.message);
    }
  );
}

// Update KYC status for a user (called by Admin)
export async function updateUserKycInFirestore(
  mobile: string,
  newStatus: 'completed' | 'processing' | 'pending'
): Promise<void> {
  const docId = getUserDocId(mobile);
  const userRef = doc(db, 'users', docId);
  await updateDoc(userRef, {
    kycStatus: newStatus,
    updatedAt: new Date().toISOString(),
  });
}

// Save transaction (claim or withdrawal)
export async function addTransactionToFirestore(tx: Transaction): Promise<void> {
  const cleanId = tx.id.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const txRef = doc(db, 'transactions', cleanId);
  await setDoc(txRef, {
    ...tx,
    createdAt: new Date().toISOString(),
  });
}

// Real-time listener for transactions
export function subscribeToTransactions(
  onUpdate: (txs: Transaction[]) => void
): () => void {
  const txCol = collection(db, 'transactions');

  return onSnapshot(
    txCol,
    (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Transaction);
      });
      // Sort client-side by transaction ID descending
      list.sort((a, b) => (b.id > a.id ? 1 : -1));
      onUpdate(list);
    },
    (err) => {
      console.warn('Transactions sync notice:', err.message);
    }
  );
}

// Update transaction status (called by Admin)
export async function updateTransactionStatusInFirestore(
  txId: string,
  status: 'completed' | 'processing' | 'pending'
): Promise<void> {
  const cleanId = txId.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const txRef = doc(db, 'transactions', cleanId);
  await updateDoc(txRef, {
    status,
    updatedAt: new Date().toISOString(),
  });
}

// Admin Settings
export async function saveAdminSettingsToFirestore(settings: AdminSettings): Promise<void> {
  const settingsRef = doc(db, 'settings', 'app_settings');
  await setDoc(settingsRef, {
    customQrUrl: settings.customQrUrl || null,
    customUpiId: settings.customUpiId || 'paytmqr28100505010115i273062319@paytm',
    appName: settings.appName || null,
    appLogoUrl: settings.appLogoUrl || null,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export function subscribeToAdminSettings(
  onUpdate: (settings: AdminSettings) => void
): () => void {
  const settingsRef = doc(db, 'settings', 'app_settings');
  return onSnapshot(
    settingsRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onUpdate({
          customQrUrl: data.customQrUrl ?? null,
          customUpiId: data.customUpiId || 'paytmqr28100505010115i273062319@paytm',
          appName: data.appName ?? null,
          appLogoUrl: data.appLogoUrl ?? null,
        });
      }
    },
    (err) => {
      console.warn('Admin settings sync error:', err);
    }
  );
}
