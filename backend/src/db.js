const { Pool, types } = require('pg');
const config = require('./config');

types.setTypeParser(1082, (value) => value); // DATE    -> 'YYYY-MM-DD' (no timezone shifting)
types.setTypeParser(1700, (value) => parseFloat(value)); // NUMERIC -> number
types.setTypeParser(20, (value) => parseInt(value, 10)); // BIGINT (COUNT, SUM of ints) -> number

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.env === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 10,
  // A sleeping free-tier database (Neon) can take a while to wake up
  connectionTimeoutMillis: 30000,
});

pool.on('error', (err) => console.error('Unexpected database error:', err.message));

const query = (text, params) => pool.query(text, params);

async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };