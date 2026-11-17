const router = require('express').Router();
const { z } = require('zod');
const { query } = require('../db');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { notFound } = require('../utils/errors');
const { likeValue } = require('../utils/sql');
const { text, idParam } = require('../schemas');
const { listReservations } = require('../services/reservations');

const createSchema = z.object({ full_name: text(100), contact_number: text(30) });
const searchSchema = z.object({ q: z.string().trim().max(100).optional() });

// GET /api/guests?q=  (FR-14) Search by name or contact number. An empty search returns the guest list.
router.get(
  '/',
  validate(searchSchema, 'query'),
  asyncHandler(async (req, res) => {
    const q = req.query.q;
    const { rows } = q
      ? await query(
          `SELECT * FROM guests WHERE full_name ILIKE $1 OR contact_number ILIKE $1 ORDER BY full_name LIMIT 100`,
          [likeValue(q)]
        )
      : await query('SELECT * FROM guests ORDER BY full_name LIMIT 100');
    res.json(rows);
  })
);

// GET /api/guests/:id  (guest record with booking history)
router.get(
  '/:id',
  validate(idParam, 'params'),
  asyncHandler(async (req, res) => {
    const { rows } = await query('SELECT * FROM guests WHERE id = $1', [req.params.id]);
    if (!rows[0]) throw notFound('Guest not found');
    res.json({ ...rows[0], reservations: await listReservations({ guest_id: req.params.id }) });
  })
);

// POST /api/guests  (FR-13)
router.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'INSERT INTO guests (full_name, contact_number) VALUES ($1, $2) RETURNING *',
      [req.body.full_name, req.body.contact_number]
    );
    res.status(201).json(rows[0]);
  })
);

module.exports = router;