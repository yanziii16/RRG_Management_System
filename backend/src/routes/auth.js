const router = require('express').Router();
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const config = require('../config');
const { query } = require('../db');
const { signToken, authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { unauthorized } = require('../utils/errors');
const { text } = require('../schemas');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.env === 'test',
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

const loginSchema = z.object({
  username: text(50),
  password: z.string({ required_error: 'required', invalid_type_error: 'must be text' }).min(1, 'required'),
});

const publicUser = ({ id, username, full_name, role, active }) => ({ id, username, full_name, role, active });

// POST /api/auth/login  (FR-01)
router.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { rows } = await query('SELECT * FROM users WHERE username = $1', [req.body.username]);
    const user = rows[0];
    const ok = user && user.active && (await bcrypt.compare(req.body.password, user.password_hash));
    if (!ok) throw unauthorized('Wrong username or password');
    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => res.json({ user: publicUser(req.user) }));

module.exports = router;