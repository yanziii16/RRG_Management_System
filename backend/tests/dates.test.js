import { describe, it, expect } from 'vitest';
import { isValidDate } from '../src/utils/dates.js';

describe('isValidDate', () => {
  it('B-T1 accepts a real calendar date like 2026-12-01', () => {
    expect(isValidDate('2026-12-01')).toBe(true);
  });

  it('B-T2 rejects a date that does not exist (February 30) and a wrong format', () => {
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('12/01/2026')).toBe(false);
    expect(isValidDate('')).toBe(false);
  });
});