import type { Ad } from '../types';
import { formatPrice } from './priceFormatter';

const BASE_URL = 'https://bilustore.com';

export function generateAdLink(adId: string): string {
  return `${BASE_URL}/ad/${adId}`;
}

export function generateShareContent(ad: Ad): { title: string; message: string; url: string } {
  const url = generateAdLink(ad.id);
  return {
    title: ad.title,
    message: `${ad.title}\n${formatPrice(ad.price, ad.currency)}\n\nCheck it out on Bilu Store:\n${url}`,
    url,
  };
}

export function generateSellerLink(sellerId: string): string {
  return `${BASE_URL}/seller/${sellerId}`;
}
