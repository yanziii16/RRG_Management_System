import { describe, it, expect } from 'vitest';
import { nightsTotal } from '../src/utils/pricing.js';

describe('nightsTotal', () => {
  it('B-T4 two weeknights at 750 per night total 1500 (Dec 1 to Dec 3, 2026)', () => {
    expect(nightsTotal(750, null, '2026-12-01', '2026-12-03')).toBe(1500);
  });

  it('B-T5 a stay with no nights costs 0, and a weekend night uses the weekend rate', () => {
    expect(nightsTotal(750, null, '2026-12-01', '2026-12-01')).toBe(0);
    // Saturday Dec 5 and Sunday Dec 6 use the weekend rate of 900
    expect(nightsTotal(750, 900, '2026-12-05', '2026-12-07')).toBe(1800);
  });
});