const { query } = require('../db');

const DEFAULT_MAX_GUESTS = 100;

// Maximum guests allowed per swim session (FR-05). Admin can change it; default is 100.
async function getMaxGuestsPerSession() {
  const { rows } = await query("SELECT value FROM settings WHERE key = 'max_guests_per_session'");
  const value = rows[0] ? Number(rows[0].value) : DEFAULT_MAX_GUESTS;
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_MAX_GUESTS;
}

module.exports = { getMaxGuestsPerSession, DEFAULT_MAX_GUESTS };