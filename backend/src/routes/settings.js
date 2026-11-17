// Admin settings. Currently: the maximum guests allowed per swim session (FR-05).
const router = require('express').Router();
const { z } = require('zod');
const { query } = require('../db');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { posInt } = require('../schemas');
const { getMaxGuestsPerSession } = require('../services/settings');

const updateSchema = z.object({ max_guests_per_session: posInt });

router.get(
  '/',
  asyncHandler(async (req, res) => res.json({ max_guests_per_session: await getMaxGuestsPerSession() }))
);

router.put(
  '/',
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    await query(
      `INSERT INTO settings (key, value) VALUES ('max_guests_per_session', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [String(req.body.max_guests_per_session)]
    );
    res.json({ max_guests_per_session: await getMaxGuestsPerSession() });
  })
);

module.exports = router;