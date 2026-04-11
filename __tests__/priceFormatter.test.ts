import { formatPrice } from '../src/utils/priceFormatter';

describe('formatPrice', () => {
  it('formats ETB with comma separators', () => {
    expect(formatPrice(15000, 'ETB')).toBe('ETB 15,000');
  });

  it('formats USD with dollar sign and decimals', () => {
    expect(formatPrice(99.99, 'USD')).toBe('$99.99');
  });

  it('returns "Free" for zero price (ETB)', () => {
    expect(formatPrice(0, 'ETB')).toBe('Free');
  });

  it('returns "Free" for zero price (USD)', () => {
    expect(formatPrice(0, 'USD')).toBe('Free');
  });

  it('handles large ETB numbers with commas', () => {
    expect(formatPrice(1000000, 'ETB')).toBe('ETB 1,000,000');
  });

  it('handles small USD amounts', () => {
    expect(formatPrice(1, 'USD')).toBe('$1.00');
  });

  it('ETB has no decimal places', () => {
    expect(formatPrice(100, 'ETB')).toBe('ETB 100');
  });

  it('USD always shows two decimal places', () => {
    expect(formatPrice(50, 'USD')).toBe('$50.00');
  });
});
