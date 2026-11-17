// Creates the tables. Safe to run again (every statement uses IF NOT EXISTS).
const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '../../db/schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Database schema is up to date.');
  await pool.end();
})().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});