import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { app, db } from '../config/firebase';
import type {
  EscrowTransaction,
  InitiateEscrowResult,
  VerifyDeliveryResult,
  EscrowPaymentMethod,
  PayoutAccount,
} from '../types';

function fns() {
  if (!app) throw new Error('Firebase not configured');
  return getFunctions(app);
}

export async function initiateEscrow(
  adId: string,
  paymentMethod: EscrowPaymentMethod
): Promise<InitiateEscrowResult> {
  const fn = httpsCallable<
    { adId: string; paymentMethod: EscrowPaymentMethod },
    InitiateEscrowResult
  >(fns(), 'onInitiateEscrow');
  const result = await fn({ adId, paymentMethod });
  return result.data;
}

export async function verifyDelivery(
  txId: string,
  otpCode: string
): Promise<VerifyDeliveryResult> {
  const fn = httpsCallable<
    { txId: string; otpCode: string },
    VerifyDeliveryResult
  >(fns(), 'onVerifyDelivery');
  const result = await fn({ txId, otpCode });
  return result.data;
}

export async function requestRefund(
  txId: string,
  reason?: string
): Promise<void> {
  const fn = httpsCallable<{ txId: string; reason?: string }, unknown>(
    fns(),
    'onRequestRefund'
  );
  await fn({ txId, reason });
}

export async function fetchEscrowTransaction(txId: string): Promise<EscrowTransaction | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'escrow_transactions', txId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as EscrowTransaction;
}

/** Fetch the buyer's plain OTP (only works if caller is the buyer) */
export async function fetchBuyerOtp(txId: string): Promise<string | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'escrow_otps', txId));
  if (!snap.exists()) return null;
  return (snap.data().otp as string) ?? null;
}

export function subscribeToEscrow(
  txId: string,
  onData: (tx: EscrowTransaction | null) => void
): () => void {
  if (!db) return () => {};
  return onSnapshot(doc(db, 'escrow_transactions', txId), (snap) => {
    if (!snap.exists()) { onData(null); return; }
    onData({ id: snap.id, ...snap.data() } as EscrowTransaction);
  });
}

/** Save seller's payout account to their user profile */
export async function savePayoutAccount(
  userId: string,
  account: PayoutAccount
): Promise<void> {
  if (!db) throw new Error('Firebase not configured');
  const { updateDoc, doc: firestoreDoc } = await import('firebase/firestore');
  await updateDoc(firestoreDoc(db, 'users', userId), { payoutAccount: account });
}
