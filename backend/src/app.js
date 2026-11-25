const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const db = require('./db'); 
const { authenticate, requireRole } = require('./middleware/auth');
const { notFoundHandler, errorHandler } = require('./middleware/error');

const app = express();
app.set('trust proxy', 1); // Render sits behind a proxy
app.use(helmet());
// CORS allows only the real frontend address (CLIENT_URL), never "*"
// Allowed frontends: comma-separated list in config.clientUrl, plus this project's Vercel preview URLs
const allowedOrigins = String(config.clientUrl || '')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);
const vercelPreview = /^https:\/\/rrg-management-system-[a-z0-9]+-yanaa1605\.vercel\.app$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // curl, health checks
      if (allowedOrigins.includes(origin) || vercelPreview.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false); // browser blocks it, server doesn't crash
    },
    exposedHeaders: ['X-Refresh-Token'],
  })
);
app.use(express.json({ limit: '100kb' }));

// Required by Activity 15: exactly {"status":"ok"}, no database
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Public read endpoints for the frontend guest/browsing pages
app.get('/api/accommodations', async (req, res, next) => {
  try {
    const items = [];

    if (db && typeof db.query === 'function') {
      try {
        const roomsRes = await db.query('SELECT * FROM rooms');
        for (const r of roomsRes.rows || []) {
          items.push({
            id: r.id ? `room-${r.id}` : undefined,
            type: 'room',
            name: r.name || r.room_name || r.title || 'Room',
            capacity: r.capacity ?? r.max_guests ?? r.guests ?? 2,
            rate: r.rate ?? r.price ?? r.nightly_rate ?? 0,
            status: r.status || 'available',
            ...r
          });
        }
      } catch (_) {
        // Ignore if there's no rooms table or schema is different
      }

      try {
        const cottagesRes = await db.query('SELECT * FROM cottages');
        for (const c of cottagesRes.rows || []) {
          items.push({
            id: c.id ? `cottage-${c.id}` : undefined,
            type: 'cottage',
            name: c.name || c.cottage_name || c.title || 'Cottage',
            capacity: c.capacity ?? c.max_guests ?? c.guests ?? 4,
            rate: c.rate ?? c.price ?? c.hourly_rate ?? 0,
            status: c.status || 'available',
            ...c
          });
        }
      } catch (_) {
        // Ignore if there's no cottages table or schema is different
      }
    }

    return res.json(items);
  } catch (err) {
    return next(err);
  }
});

app.get('/api/facilities', async (req, res, next) => {
  try {
    if (db && typeof db.query === 'function') {
      try {
        const result = await db.query('SELECT * FROM facilities');
        return res.json(result.rows || []);
      } catch (_) {
        // Fallback if there's no facilities table
      }
    }
    return res.json([]);
  } catch (err) {
    return next(err);
  }
});

app.get('/api/gallery', async (req, res, next) => {
  try {
    if (db && typeof db.query === 'function') {
      try {
        const result = await db.query('SELECT * FROM gallery');
        return res.json(result.rows || []);
      } catch (_) {
        // Fallback if there's no gallery table
      }
    }
    return res.json([]);
  } catch (err) {
    return next(err);
  }
});

app.get('/api/rentals', async (req, res, next) => {
  try {
    if (db && typeof db.query === 'function') {
      try {
        const result = await db.query('SELECT * FROM rentals');
        return res.json(result.rows || []);
      } catch (_) {
        // Fallback if there's no rentals table
      }
    }
    return res.json([]);
  } catch (err) {
    return next(err);
  }
});

app.use('/api/auth', require('./routes/auth'));

const staff = [authenticate]; // any logged-in cashier or admin
const admin = [authenticate, requireRole('admin')]; // FR-02: admin only

app.use('/api/users', admin, require('./routes/users'));
app.use('/api/rates', admin, require('./routes/rates'));
app.use('/api/settings', admin, require('./routes/settings'));

app.use('/api/cottages', staff, require('./routes/cottages'));
app.use('/api/rooms', staff, require('./routes/rooms'));
app.use('/api/guest-counts', staff, require('./routes/guestCounts'));
app.use('/api/guests', staff, require('./routes/guests'));
app.use('/api/reservations', staff, require('./routes/reservations'));

// Payments, rentals, dashboard and reports are added in Part 3

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;