const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const { authenticate, requireRole } = require('./middleware/auth');
const { notFoundHandler, errorHandler } = require('./middleware/error');

const app = express();
app.set('trust proxy', 1); // Render sits behind a proxy
app.use(helmet());
// CORS allows only the real frontend address (CLIENT_URL), never "*"
app.use(cors({ origin: config.clientUrl, exposedHeaders: ['X-Refresh-Token'] }));
app.use(express.json({ limit: '100kb' }));

// Required by Activity 15: exactly {"status":"ok"}, no database
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

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