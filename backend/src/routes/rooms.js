const router = require('express').Router();
const { z } = require('zod');
const { query } = require('../db');
const { requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { notFound } = require('../utils/errors');
const { buildUpdate } = require('../utils/sql');
const { text, money, posInt, date, idParam } = require('../schemas');

const fields = {
  room_number: text(20),
  type: text(40),
  rate_per_night: money,
  weekend_rate: money.nullable(),
  capacity: posInt,
};
const createSchema = z.object({ ...fields, type: fields.type.default('family'), weekend_rate: fields.weekend_rate.optional() });
const updateSchema = z
  .object({
    room_number: fields.room_number.optional(),
    type: fields.type.optional(),
    rate_per_night: fields.rate_per_night.optional(),
    weekend_rate: fields.weekend_rate.optional(),
    capacity: fields.capacity.optional(),
    active: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, 'nothing to update');
const availabilitySchema = z
  .object({ from: date, to: date })
  .refine((d) => d.to > d.from, { message: 'check-out date must be after the check-in date', path: ['to'] });

// GET /api/rooms  (active rooms; admin can add ?all=true)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const all = req.query.all === 'true' && req.user.role === 'admin';
    const { rows } = await query(`SELECT * FROM rooms ${all ? '' : 'WHERE active'} ORDER BY room_number`);
    res.json(rows);
  })
);

// GET /api/rooms/availability?from=&to=  (FR-26). "to" is the check-out date.
router.get(
  '/availability',
  validate(availabilitySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const blocking = `r.room_id = rm.id AND r.status IN ('reserved', 'checked_in') AND r.check_in < $2::date AND r.check_out > $1::date`;
    const { rows } = await query(
      `SELECT rm.id, rm.room_number, rm.type, rm.rate_per_night, rm.weekend_rate, rm.capacity,
              CASE WHEN EXISTS (SELECT 1 FROM reservations r WHERE ${blocking} AND r.status = 'checked_in') THEN 'occupied'
                   WHEN EXISTS (SELECT 1 FROM reservations r WHERE ${blocking}) THEN 'reserved'
                   ELSE 'available' END AS status
       FROM rooms rm WHERE rm.active ORDER BY rm.room_number`,
      [from, to]
    );
    res.json({ from, to, rooms: rows });
  })
);

// POST /api/rooms  (FR-25, admin)
router.post(
  '/',
  requireRole('admin'),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { room_number, type, rate_per_night, weekend_rate = null, capacity } = req.body;
    const { rows } = await query(
      'INSERT INTO rooms (room_number, type, rate_per_night, weekend_rate, capacity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [room_number, type, rate_per_night, weekend_rate, capacity]
    );
    res.status(201).json(rows[0]);
  })
);

// PUT /api/rooms/:id  (FR-25, admin)
router.put(
  '/:id',
  requireRole('admin'),
  validate(idParam, 'params'),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const { text: sql, values } = buildUpdate('rooms', req.params.id, req.body);
    const { rows } = await query(sql, values);
    if (!rows[0]) throw notFound('Room not found');
    res.json(rows[0]);
  })
);

module.exports = router;