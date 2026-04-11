import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../config/firebase';
import type { InitializePaymentResult, PaymentMethod, PremiumTierId } from '../types';

/**
 * Calls the onPaymentInitialize Cloud Function.
 * Returns a checkoutUrl (for WebView / Telebirr) or ussdPushSent flag (for USSD).
 */
export async function initializePayment(
  adId: string,
  tierId: PremiumTierId,
  method: PaymentMethod
): Promise<InitializePaymentResult> {
  if (!app) throw new Error('Firebase is not configured');
  const functions = getFunctions(app);
  const callable = httpsCallable<
    { adId: string; tierId: string; method: PaymentMethod },
    InitializePaymentResult
  >(functions, 'onPaymentInitialize');

  const result = await callable({ adId, tierId, method });
  return result.data;
}
