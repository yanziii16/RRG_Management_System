const router = require('express').Router();
const { z } = require('zod');
const { query } = require('../db');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { notFound } = require('../utils/errors');
const { id, posInt, date, session, idParam } = require('../schemas');
const service = require('../services/reservations');

const dayCottage = z.object({ type: z.literal('day_cottage'), guest_id: posInt, cottage_id: posInt, date, session });
const overnightCottage = z.object({ type: z.literal('overnight_cottage'), guest_id: posInt, cottage_id: posInt, check_in: date, check_out: date });
const room = z.object({ type: z.literal('room'), guest_id: posInt, room_id: posInt, check_in: date, check_out: date });

const createSchema = z
  .discriminatedUnion('type', [dayCottage, overnightCottage, room], {
    errorMap: () => ({ message: 'type must be day_cottage, overnight_cottage or room' }),
  })
  .superRefine((d, ctx) => {
    if (d.type !== 'day_cottage' && d.check_out <= d.check_in) {
      ctx.addIssue({ code: 'custom', path: ['check_out'], message: 'must be after the check-in date' });
    }
  });

const listSchema = z.object({
  date: date.optional(),
  status: z.enum(['reserved', 'checked_in', 'checked_out', 'cancelled']).optional(),
  type: z.enum(['day_cottage', 'overnight_cottage', 'room']).optional(),
  guest_id: id.optional(),
});

// GET /api/reservations?date=&status=&type=&guest_id=
router.get(
  '/',
  validate(listSchema, 'query'),
  asyncHandler(async (req, res) => res.json(await service.listReservations(req.query)))
);

// POST /api/reservations  (FR-09, FR-10, FR-22, FR-27, FR-28, FR-29, FR-30)
router.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => res.status(201).json(await service.createReservation(req.body, req.user.id)))
);

// GET /api/reservations/:id  (details with rentals and payments)
router.get(
  '/:id',
  validate(idParam, 'params'),
  asyncHandler(async (req, res) => {
    const reservation = await service.getReservation(req.params.id);
    if (!reservation) throw notFound('Reservation not found');
    const rentals = (await query('SELECT * FROM rentals WHERE reservation_id = $1 ORDER BY id', [req.params.id])).rows;
    const payments = (await query('SELECT * FROM payments WHERE reservation_id = $1 ORDER BY id', [req.params.id])).rows;
    res.json({ ...reservation, rentals, payments });
  })
);

// GET /api/reservations/:id/balance  (FR-16)
router.get(
  '/:id/balance',
  validate(idParam, 'params'),
  asyncHandler(async (req, res) => {
    const r = await service.getReservation(req.params.id);
    if (!r) throw notFound('Reservation not found');
    res.json({ reservation_id: r.id, base_total: r.base_total, rentals_total: r.rentals_total, total: r.total, paid: r.paid_total, balance: r.balance });
  })
);

// PATCH /api/reservations/:id/cancel | checkin | checkout  (FR-11, FR-12, FR-31)
for (const action of ['cancel', 'checkin', 'checkout']) {
  router.patch(
    `/:id/${action}`,
    validate(idParam, 'params'),
    asyncHandler(async (req, res) => res.json(await service.changeStatus(req.params.id, action)))
  );
}

module.exports = router;