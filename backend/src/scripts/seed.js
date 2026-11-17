// npm run seed -> first Admin account (username "admin") and settings.
// Safe to run again: existing records are never overwritten.
const bcrypt = require('bcryptjs');
const config = require('../config');
const { pool } = require('../db');

async function createUser(username, plainPassword, fullName, role) {
  const { rows } = await pool.query('SELECT 1 FROM users WHERE username = $1', [username]);
  if (rows[0]) return console.log(`User "${username}" already exists. Skipped.`);
  const hash = await bcrypt.hash(plainPassword, 10);
  await pool.query(
    'INSERT INTO users (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4)',
    [username, hash, fullName, role]
  );
  console.log(`Created ${role} account "${username}".`);
}

(async () => {
  if (!config.adminSeedPassword || config.adminSeedPassword.length < 8) {
    throw new Error('Set ADMIN_SEED_PASSWORD (at least 8 characters) before seeding.');
  }
  await createUser('admin', config.adminSeedPassword, 'Resort Admin', 'admin');
  await pool.query("INSERT INTO settings (key, value) VALUES ('max_guests_per_session', '100') ON CONFLICT DO NOTHING");
  await pool.end();
})().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});