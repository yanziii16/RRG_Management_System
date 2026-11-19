# Luckystar Resort Reservation and Guest Management System

A combined **Admin Interface and Guest Interface** built into a single React + Vite + Express application for **Luckystar Resort**.

## User Roles (Strictly Two Roles)

- **ADMIN**: Full resort management — dashboard metrics, reservations & conflict prevention, walk-in guest counts, rooms, cottages & umbrellas, facilities & gallery, rentals, payment proof verification, printable official receipts, rate management, reports & analytics, user management, and resort settings.
- **GUEST**: Public browsing, guest registration & login, live availability checks, overnight and day-use session booking with rental add-ons, booking confirmation, payment proof submission, personal reservation management, and profile management.

## Demo Login Credentials

- **Admin Portal** (`/admin/login`):
  - Email: `admin@luckystarresort.com`
  - Password: `password123`
- **Guest Portal** (`/login`):
  - Email: `ashly.quiming@gmail.com`
  - Password: `password123`

## Installation & Running

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment variables (optional for local defaults):
   ```bash
   cp .env.example .env
   ```
3. Start the unified Express + Vite server on port 3000:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   npm start
   ```

## Connecting Express API to PostgreSQL

The frontend communicates strictly through the shared Axios service layer (`src/services/*`) to the REST endpoints defined in `server.js`.

To connect `server.js` to PostgreSQL in production:

1. Create a PostgreSQL database (e.g., `luckystar_resort`) and execute `database/schema.sql` to create all tables and enums (`ADMIN`, `GUEST`).
2. Install the PostgreSQL driver (`npm install pg @types/pg`).
3. Configure `DATABASE_URL` in `.env` (refer to `.env.example`).
4. Replace the `loadDb()` / `saveDb()` JSON persistence helpers in `server.js` with `pg.Pool` queries inside the existing route handlers while preserving the exact request/response payloads, role middleware (`requireAuth`, `requireAdmin`), and reservation conflict checks.
