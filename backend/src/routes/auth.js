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

const loginSchema = z
  .object({
    username: text(50).optional(),
    email: z.string().trim().toLowerCase().email('invalid email').max(50).optional(),
    password: z
      .string({ required_error: 'required', invalid_type_error: 'must be text' })
      .min(1, 'required'),
  })
  .refine((data) => Boolean(data.username || data.email), {
    message: 'required',
    path: ['username'],
  });

const publicUser = ({ id, username, email, full_name, role, active }) => ({
  id,
  username,
  email,
  full_name,
  role,
  active,
});

// POST /api/auth/login  (FR-01)
router.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const identifier = (req.body.email || req.body.username || '').trim().toLowerCase();
    const { rows } = await query(
      'SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $1',
      [identifier]
    );
    const user = rows[0];
    const ok = user && user.active && (await bcrypt.compare(req.body.password, user.password_hash));
    if (!ok) throw unauthorized('Wrong username or password');
    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => res.json({ user: publicUser(req.user) }));

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.env === 'test',
  message: { error: 'Too many sign-ups. Try again later.' },
});

const registerSchema = z.object({
  full_name: z.string().trim().min(1, 'required').max(100),
  email: z.string().trim().toLowerCase().email('invalid email').max(50),
  contact_number: z.string().trim().min(7, 'invalid number').max(20),
  address: z.string().trim().max(200).optional().default(''),
  password: z.string().min(8, 'must be at least 8 characters').max(100),
});

// POST /api/auth/register  (guest self-signup)
router.post(
  '/register',
  registerLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { full_name, email, contact_number, address, password } = req.body;

    const existing = await query(
      'SELECT 1 FROM users WHERE email = $1 OR username = $1',
      [email]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (username, full_name, email, contact_number, address, role, active, password_hash)
       VALUES ($1, $2, $1, $3, $4, 'guest', true, $5)
       RETURNING *`,
      [email, full_name, contact_number, address, password_hash]
    );
    const user = rows[0];
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  })
);

module.exports = router;