const router = require('express').Router();
const { z } = require('zod');
const { query } = require('../db');
const { requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { notFound } = require('../utils/errors');
const { buildUpdate } = require('../utils/sql');
const { text, money, posInt, date, session, idParam } = require('../schemas');

const fields = {
  name: text(80),
  type: text(40),
  rate: money,
  weekend_rate: money.nullable(),
  capacity: posInt,
};
const createSchema = z.object({ ...fields, type: fields.type.default('cottage'), weekend_rate: fields.weekend_rate.optional() });
const updateSchema = z
  .object({ name: fields.name.optional(), type: fields.type.optional(), rate: fields.rate.optional(), weekend_rate: fields.weekend_rate.optional(), capacity: fields.capacity.optional(), active: z.boolean().optional() })
  .refine((d) => Object.keys(d).length > 0, 'nothing to update');
const availabilitySchema = z.object({ date, session });

// GET /api/cottages  (active cottages; admin can add ?all=true to include deactivated ones)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const all = req.query.all === 'true' && req.user.role === 'admin';
    const { rows } = await query(`SELECT * FROM cottages ${all ? '' : 'WHERE active'} ORDER BY name`);
    res.json(rows);
  })
);

// GET /api/cottages/availability?date=&session=  (FR-08)
// A cottage is "reserved" or "occupied" when a day-use booking has that date and session,
// or an overnight stay covers that date.
router.get(
  '/availability',
  validate(availabilitySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { date: day, session: slot } = req.query;
    const blocking = `r.cottage_id = c.id AND r.status IN ('reserved', 'checked_in')
      AND ((r.type = 'day_cottage' AND r.check_in = $1::date AND r.session = $2)
        OR (r.type = 'overnight_cottage' AND $1::date >= r.check_in AND $1::date < r.check_out))`;
    const { rows } = await query(
      `SELECT c.id, c.name, c.type, c.rate, c.weekend_rate, c.capacity,
              CASE WHEN EXISTS (SELECT 1 FROM reservations r WHERE ${blocking} AND r.status = 'checked_in') THEN 'occupied'
                   WHEN EXISTS (SELECT 1 FROM reservations r WHERE ${blocking}) THEN 'reserved'
                   ELSE 'available' END AS status
       FROM cottages c WHERE c.active ORDER BY c.name`,
      [day, slot]
    );
    res.json({ date: day, session: slot, cottages: rows });
  })
);

// POST /api/cottages  (FR-06, admin)
router.post(
  '/',
  requireRole('admin'),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { name, type, rate, weekend_rate = null, capacity } = req.body;
    const { rows } = await query(
      'INSERT INTO cottages (name, type, rate, weekend_rate, capacity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, type, rate, weekend_rate, capacity]
    );
    res.status(201).json(rows[0]);
  })
);

// PUT /api/cottages/:id  (FR-06 edit, FR-07 deactivate with {"active": false}, admin)
router.put(
  '/:id',
  requireRole('admin'),
  validate(idParam, 'params'),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const { text: sql, values } = buildUpdate('cottages', req.params.id, req.body);
    const { rows } = await query(sql, values);
    if (!rows[0]) throw notFound('Cottage not found');
    res.json(rows[0]);
  })
);

module.exports = router;