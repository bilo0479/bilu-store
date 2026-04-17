/**
 * PaymentService — P12 Firebase purge
 *
 * Payment is now handled via Convex actions (escrow.initiate, pro.startCheckout).
 * This stub is kept for call-site compatibility in legacy screens.
 */
import type { InitializePaymentResult, PaymentMethod, PremiumTierId } from '../types';

export async function initializePayment(
  _adId: string,
  _tierId: PremiumTierId,
  _method: PaymentMethod
): Promise<InitializePaymentResult> {
  throw new Error('Use api.escrow.initiate or api.pro.startCheckout via Convex');
}
