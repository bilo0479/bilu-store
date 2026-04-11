import { isValidTransition, VALID_TRANSITIONS, AD_STATUS_LABELS } from '../src/constants/adStatuses';

describe('AD_STATUS_LABELS', () => {
  it('has a label for every status', () => {
    const statuses = ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SOLD', 'EXPIRED', 'REJECTED', 'REMOVED'] as const;
    for (const s of statuses) {
      expect(AD_STATUS_LABELS[s]).toBeDefined();
      expect(typeof AD_STATUS_LABELS[s]).toBe('string');
    }
  });
});

describe('isValidTransition', () => {
  // Valid transitions
  it('DRAFT -> PENDING_REVIEW is valid', () => {
    expect(isValidTransition('DRAFT', 'PENDING_REVIEW')).toBe(true);
  });

  it('DRAFT -> ACTIVE is valid (auto-approve)', () => {
    expect(isValidTransition('DRAFT', 'ACTIVE')).toBe(true);
  });

  it('PENDING_REVIEW -> ACTIVE is valid', () => {
    expect(isValidTransition('PENDING_REVIEW', 'ACTIVE')).toBe(true);
  });

  it('PENDING_REVIEW -> REJECTED is valid', () => {
    expect(isValidTransition('PENDING_REVIEW', 'REJECTED')).toBe(true);
  });

  it('ACTIVE -> SOLD is valid', () => {
    expect(isValidTransition('ACTIVE', 'SOLD')).toBe(true);
  });

  it('ACTIVE -> EXPIRED is valid', () => {
    expect(isValidTransition('ACTIVE', 'EXPIRED')).toBe(true);
  });

  it('ACTIVE -> REMOVED is valid', () => {
    expect(isValidTransition('ACTIVE', 'REMOVED')).toBe(true);
  });

  it('EXPIRED -> PENDING_REVIEW is valid (republish)', () => {
    expect(isValidTransition('EXPIRED', 'PENDING_REVIEW')).toBe(true);
  });

  it('REJECTED -> PENDING_REVIEW is valid (re-submit)', () => {
    expect(isValidTransition('REJECTED', 'PENDING_REVIEW')).toBe(true);
  });

  // Invalid transitions
  it('SOLD is terminal (no transitions out)', () => {
    expect(VALID_TRANSITIONS['SOLD']).toHaveLength(0);
    expect(isValidTransition('SOLD', 'ACTIVE')).toBe(false);
  });

  it('REMOVED is terminal (no transitions out)', () => {
    expect(VALID_TRANSITIONS['REMOVED']).toHaveLength(0);
    expect(isValidTransition('REMOVED', 'ACTIVE')).toBe(false);
  });

  it('DRAFT -> SOLD is invalid (must go through ACTIVE)', () => {
    expect(isValidTransition('DRAFT', 'SOLD')).toBe(false);
  });

  it('ACTIVE -> DRAFT is invalid', () => {
    expect(isValidTransition('ACTIVE', 'DRAFT')).toBe(false);
  });
});
