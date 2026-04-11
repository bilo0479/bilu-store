import { Currency } from '../types';

export interface CurrencyDef {
  code: Currency;
  symbol: string;
  name: string;
  decimals: number;
}

export const CURRENCIES: CurrencyDef[] = [
  { code: 'ETB', symbol: 'ETB', name: 'Ethiopian Birr', decimals: 0 },
  { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
];

export const DEFAULT_CURRENCY: Currency = 'ETB';

export function getCurrencyDef(code: Currency): CurrencyDef {
  return CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0];
}
