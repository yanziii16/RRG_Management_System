// Entrance fees and rental items (admin only). FR-19.
// Cottage and room prices live on the cottage/room records (PUT /api/cottages/:id and /api/rooms/:id);
// GET /api/rates shows all four groups together on one screen.
const router = require('express').Router();
const { z } = require('zod');
const { query } = require('../db');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { notFound } = require('../utils/errors');
const { buildUpdate } = require('../utils/sql');
const { text, money, session, category, idParam } = require('../schemas');

const createSchema = z.object({
  kind: z.enum(['entrance', 'rental'], { errorMap: () => ({ message: 'must be entrance or rental' }) }),
  name: text(80),
  session: session.nullable().optional(),
  category: category.nullable().optional(),
  amount: money,
  weekend_amount: money.nullable().optional(),
});
const updateSchema = z
  .object({
    name: text(80).optional(),
    session: session.nullable().optional(),
    category: category.nullable().optional(),
    amount: money.optional(),
    weekend_amount: money.nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, 'nothing to update');

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rates = (await query('SELECT * FROM rates ORDER BY kind, name')).rows;
    const cottages = (await query('SELECT id, name, rate, weekend_rate, active FROM cottages ORDER BY name')).rows;
    const rooms = (await query('SELECT id, room_number, rate_per_night, weekend_rate, active FROM rooms ORDER BY room_number')).rows;
    res.json({
      entrance: rates.filter((r) => r.kind === 'entrance'),
      rentals: rates.filter((r) => r.kind === 'rental'),
      cottages,
      rooms,
    });
  })
);

router.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { kind, name, session: slot = null, category: cat = null, amount, weekend_amount = null } = req.body;
    const isEntrance = kind === 'entrance';
    const { rows } = await query(
      'INSERT INTO rates (kind, name, session, category, amount, weekend_amount) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [kind, name, isEntrance ? slot : null, isEntrance ? cat : null, amount, weekend_amount]
    );
    res.status(201).json(rows[0]);
  })
);

router.put(
  '/:id',
  validate(idParam, 'params'),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const { text: sql, values } = buildUpdate('rates', req.params.id, req.body);
    const { rows } = await query(sql, values);
    if (!rows[0]) throw notFound('Rate not found');
    res.json(rows[0]);
  })
);

module.exports = router;