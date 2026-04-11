import type { Currency } from '../types';

export function formatPrice(price: number, currency: Currency): string {
  if (price === 0) return 'Free';

  if (currency === 'USD') {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return `ETB ${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
