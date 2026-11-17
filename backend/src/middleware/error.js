const { HttpError } = require('../utils/errors');

const notFoundHandler = (req, res) => res.status(404).json({ error: 'Route not found' });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON in request body' });
  if (err.code === '23505') return res.status(409).json({ error: 'That record already exists or the slot is already taken' });
  if (err.code === '23503') return res.status(400).json({ error: 'A related record does not exist' });
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
};

module.exports = { notFoundHandler, errorHandler };