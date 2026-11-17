require('dotenv').config();

// The resort runs on Philippine time; this also fixes "today" on a UTC server such as Render.
process.env.TZ = 'Asia/Manila';

const missing = ['DATABASE_URL', 'JWT_SECRET'].filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(
    `Missing environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`
  );
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30m',
  corsOrigins: process.env.CLIENT_URL || 'http://localhost:5173',
  adminSeedPassword: process.env.ADMIN_SEED_PASSWORD,
  timezone: 'Asia/Manila',
    clientUrl: process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
};