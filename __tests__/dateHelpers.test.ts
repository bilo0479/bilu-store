import { relativeTime, formatDate, formatTime } from '../src/utils/dateHelpers';

describe('relativeTime', () => {
  it('returns "Just now" for < 60 seconds ago', () => {
    expect(relativeTime(Date.now() - 30_000)).toBe('Just now');
  });

  it('returns "Xm ago" for minutes', () => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    expect(relativeTime(fiveMinAgo)).toBe('5m ago');
  });

  it('returns "Xh ago" for hours', () => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    expect(relativeTime(twoHoursAgo)).toBe('2h ago');
  });

  it('returns "Yesterday" for ~24 hours ago', () => {
    const yesterday = Date.now() - 25 * 60 * 60 * 1000;
    expect(relativeTime(yesterday)).toBe('Yesterday');
  });

  it('returns "Xd ago" for 2-6 days', () => {
    const threeDays = Date.now() - 3 * 24 * 60 * 60 * 1000;
    expect(relativeTime(threeDays)).toBe('3d ago');
  });

  it('returns formatted date for > 7 days', () => {
    const twoWeeks = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const result = relativeTime(twoWeeks);
    // Should be something like "Mar 2" (locale-formatted)
    expect(result).not.toContain('ago');
    expect(result).not.toBe('Just now');
  });
});

describe('formatDate', () => {
  it('formats a timestamp as a full date', () => {
    // Jan 15, 2026 00:00:00 UTC
    const ts = new Date(2026, 0, 15).getTime();
    const result = formatDate(ts);
    expect(result).toContain('January');
    expect(result).toContain('15');
    expect(result).toContain('2026');
  });
});

describe('formatTime', () => {
  it('formats a timestamp as time', () => {
    const result = formatTime(new Date(2026, 0, 15, 14, 30).getTime());
    // Should contain "2:30 PM" or similar locale-based format
    expect(result).toContain('30');
  });
});
