import { describe, it, expect } from 'vitest';
import { computeBalance, paymentProblem } from '../src/utils/pricing.js';

// Money rules from the SRS, tested without a database
describe('computeBalance (FR-16, AC-31)', () => {
  it('B-T6 a 500 down payment on a 1,500 total leaves a balance of 1,000', () => {
    expect(computeBalance(1500, 500)).toBe(1000);
    expect(computeBalance(1500, 1500)).toBe(0);
  });
});

describe('paymentProblem (FR-15, AC-32)', () => {
  it('B-T7 a payment above the balance is refused, and a payment within it is accepted', () => {
    expect(paymentProblem(1000, 2000)).toMatch(/more than the balance/);
    expect(paymentProblem(1000, 500)).toBeNull();
    expect(paymentProblem(0, 100)).toMatch(/fully paid/);
  });
});