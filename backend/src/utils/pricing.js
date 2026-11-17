const { eachNight, isWeekend } = require('./dates');

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// Weekend price (Saturday and Sunday) when one is set, otherwise the normal price
const pickRate = (base, weekend, date) =>
  weekend !== null && weekend !== undefined && isWeekend(date) ? Number(weekend) : Number(base);

// Total for a stay of one or more nights (FR-29, AC-49: 2 nights at 750 = 1,500)
const nightsTotal = (base, weekend, checkIn, checkOut) =>
  round2(eachNight(checkIn, checkOut).reduce((sum, night) => sum + pickRate(base, weekend, night), 0));

// Remaining balance (FR-16, AC-31: a 500 down payment on a 1,500 total leaves 1,000)
const computeBalance = (total, paid) => round2(total - paid);

// Returns a message when a payment is not allowed, or null when it is fine (AC-32)
const paymentProblem = (balance, amount) => {
  if (balance <= 0) return 'This reservation is already fully paid';
  if (round2(amount) > balance) return `The payment is more than the balance (₱${balance.toFixed(2)})`;
  return null;
};

module.exports = { round2, pickRate, nightsTotal, computeBalance, paymentProblem };