// Staff accounts. Admin only (mounted with requireRole('admin')).
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { query } = require('../db');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { notFound, badRequest } = require('../utils/errors');
const { buildUpdate } = require('../utils/sql');
const { text, idParam } = require('../schemas');

const COLUMNS = 'id, username, full_name, role, active, created_at';
const password = z.string({ required_error: 'required' }).min(8, 'must be at least 8 characters').max(72);
const role = z.enum(['admin', 'cashier'], { errorMap: () => ({ message: 'must be admin or cashier' }) });

const createSchema = z.object({
  username: text(50).regex(/^[a-z0-9._-]{3,50}$/, 'use 3 to 50 lowercase letters, numbers, dot, dash or underscore'),
  password,
  full_name: text(100),
  role,
});

const updateSchema = z
  .object({ full_name: text(100).optional(), role: role.optional(), active: z.boolean().optional(), password: password.optional() })
  .refine((d) => Object.keys(d).length > 0, 'nothing to update');

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await query(`SELECT ${COLUMNS} FROM users ORDER BY username`);
    res.json(rows);
  })
);

router.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { username, password: plain, full_name, role: userRole } = req.body;
    const hash = await bcrypt.hash(plain, 10);
    const { rows } = await query(
      `INSERT INTO users (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
      [username, hash, full_name, userRole]
    );
    res.status(201).json(rows[0]);
  })
);

router.patch(
  '/:id',
  validate(idParam, 'params'),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (req.params.id === req.user.id && (data.active === false || (data.role && data.role !== 'admin'))) {
      throw badRequest('You cannot deactivate or demote your own account');
    }
    if (data.password) {
      data.password_hash = await bcrypt.hash(data.password, 10);
      delete data.password;
    }
    const { text: sql, values } = buildUpdate('users', req.params.id, data);
    const { rows } = await query(sql.replace('RETURNING *', `RETURNING ${COLUMNS}`), values);
    if (!rows[0]) throw notFound('User not found');
    res.json(rows[0]);
  })
);

module.exports = router;