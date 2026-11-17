const { z } = require('zod');
const { isValidDate } = require('./utils/dates');

const SESSIONS = ['morning', 'afternoon', 'night'];

// For ids in the URL or query string
const id = z.coerce.number({ invalid_type_error: 'must be a number' }).int().positive();

const text = (max = 100) =>
  z
    .string({ required_error: 'required', invalid_type_error: 'must be text' })
    .trim()
    .min(1, 'required')
    .max(max, `must be at most ${max} characters`);

const money = z.number({ required_error: 'required', invalid_type_error: 'must be a number' }).min(0, 'cannot be negative');

const posInt = z
  .number({ required_error: 'required', invalid_type_error: 'must be a whole number' })
  .int('must be a whole number')
  .positive('must be more than 0');

const date = z
  .string({ required_error: 'required', invalid_type_error: 'must be a date' })
  .refine(isValidDate, 'must be a date like 2026-12-01');

const session = z.enum(SESSIONS, {
  errorMap: () => ({ message: `must be one of: ${SESSIONS.join(', ')}` }),
});

const CATEGORIES = ['adult', 'kid', 'senior_pwd'];
const category = z.enum(CATEGORIES, {
  errorMap: () => ({ message: `must be one of: ${CATEGORIES.join(', ')}` }),
});

const idParam = z.object({ id });

module.exports = { SESSIONS, CATEGORIES, id, text, money, posInt, date, session, category, idParam };