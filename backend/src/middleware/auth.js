const jwt = require('jsonwebtoken');
const config = require('../config');
const { query } = require('../db');
const { unauthorized, forbidden } = require('../utils/errors');

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

// Checks the login token, loads the user, and sends back a fresh token in the X-Refresh-Token header.
// Because every request renews the token, the session ends only after JWT_EXPIRES_IN of inactivity (NFR-04).
async function authenticate(req, res, next) {
  try {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) throw unauthorized();

    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch {
      throw unauthorized('Session expired. Please log in again.');
    }

    const { rows } = await query(
      'SELECT id, username, full_name, role, active FROM users WHERE id = $1',
      [payload.id]
    );
    const user = rows[0];
    if (!user || !user.active) throw unauthorized('Account is not active');

    req.user = user;
    res.set('X-Refresh-Token', signToken(user));
    next();
  } catch (err) {
    next(err);
  }
}

// Role check (FR-02): requireRole('admin') returns 403 for cashiers
const requireRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user.role) ? next() : next(forbidden());

module.exports = { signToken, authenticate, requireRole };