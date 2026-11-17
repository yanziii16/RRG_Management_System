// Counts of walk-in guests entering (the resort gives no tickets, staff only record the count).
// FR-03, FR-04, FR-05. A count can be split by guest category: adult, kid, senior_pwd (SRS 1.3).
const router = require('express').Router();
const { z } = require('zod');
const { query, withTransaction } = require('../db');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { badRequest } = require('../utils/errors');
const { todayManila } = require('../utils/dates');
const { pickRate, round2 } = require('../utils/pricing');
const { getMaxGuestsPerSession } = require('../services/settings');
const { SESSIONS, posInt, date, session, category } = require('../schemas');

const entrySchema = z.object({ guests: posInt, category: category.optional() });

// Send either { session, guests, category? } or { session, entries: [{ guests, category? }, ...] }
const createSchema = z
  .object({
    session,
    count_date: date.optional(),
    guests: posInt.optional(),
    category: category.optional(),
    entries: z.array(entrySchema).min(1).max(10).optional(),
  })
  .refine((d) => d.entries || d.guests !== undefined, { message: 'required', path: ['guests'] });

const summarySchema = z.object({ date: date.optional(), session: session.optional() });

async function sessionTotal(day, slot) {
  const { rows } = await query(
    'SELECT COALESCE(SUM(guests), 0) AS total FROM guest_counts WHERE count_date = $1 AND session = $2',
    [day, slot]
  );
  return rows[0].total;
}

// The most specific entrance rate wins: same category and session, then category only, then session only, then general
const RATE_SQL = `
  SELECT * FROM rates
  WHERE kind = 'entrance' AND active
    AND (session = $1 OR session IS NULL)
    AND (category = $2 OR category IS NULL)
  ORDER BY (category IS NULL), (session IS NULL)
  LIMIT 1`;

// POST /api/guest-counts
router.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const today = todayManila();
    const day = req.body.count_date || today;
    if (day > today) throw badRequest('The date cannot be in the future');
    const slot = req.body.session;
    const entries = req.body.entries || [{ guests: req.body.guests, category: req.body.category }];

    let missingRate = false;
    const saved = await withTransaction(async (client) => {
      const rows = [];
      for (const entry of entries) {
        const cat = entry.category || null;
        const rate = (await client.query(RATE_SQL, [slot, cat])).rows[0];
        if (!rate) missingRate = true;
        const unitFee = rate ? pickRate(rate.amount, rate.weekend_amount, day) : 0;
        const fee = round2(unitFee * entry.guests);
        const inserted = await client.query(
          `INSERT INTO guest_counts (count_date, session, guests, category, fee_total, recorded_by)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, category, guests, fee_total`,
          [day, slot, entry.guests, cat, fee, req.user.id]
        );
        rows.push({ ...inserted.rows[0], unit_fee: unitFee });
      }
      return rows;
    });

    const max = await getMaxGuestsPerSession();
    const total = await sessionTotal(day, slot);
    res.status(201).json({
      count_date: day,
      session: slot,
      entries: saved,
      guests_total: saved.reduce((sum, e) => sum + e.guests, 0),
      fee_total: round2(saved.reduce((sum, e) => sum + e.fee_total, 0)),
      session_total: total,
      max_guests: max,
      capacity_warning: total >= max,
      note: missingRate ? 'No entrance rate is set for this category yet, so its fee was recorded as 0' : undefined,
    });
  })
);

// GET /api/guest-counts/summary?date=&session=
router.get(
  '/summary',
  validate(summarySchema, 'query'),
  asyncHandler(async (req, res) => {
    const day = req.query.date || todayManila();
    const max = await getMaxGuestsPerSession();
    const slots = req.query.session ? [req.query.session] : SESSIONS;
    const sessions = [];
    for (const slot of slots) {
      const total = await sessionTotal(day, slot);
      sessions.push({ session: slot, total, remaining: Math.max(max - total, 0), capacity_warning: total >= max });
    }
    res.json({ date: day, max_guests: max, total: sessions.reduce((sum, s) => sum + s.total, 0), sessions });
  })
);

module.exports = router;