-- Resort Reservation and Guest Management System - database schema (PostgreSQL)
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  role          VARCHAR(10)  NOT NULL CHECK (role IN ('admin', 'cashier')),
  active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guests (
  id             SERIAL PRIMARY KEY,
  full_name      VARCHAR(100) NOT NULL,
  contact_number VARCHAR(30)  NOT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_guests_name ON guests (lower(full_name));

CREATE TABLE IF NOT EXISTS cottages (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(80)   NOT NULL UNIQUE,
  type         VARCHAR(40)   NOT NULL DEFAULT 'cottage',
  rate         NUMERIC(10,2) NOT NULL CHECK (rate >= 0),
  weekend_rate NUMERIC(10,2) CHECK (weekend_rate >= 0),
  capacity     INT           NOT NULL CHECK (capacity > 0),
  active       BOOLEAN       NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS rooms (
  id             SERIAL PRIMARY KEY,
  room_number    VARCHAR(20)   NOT NULL UNIQUE,
  type           VARCHAR(40)   NOT NULL DEFAULT 'family',
  rate_per_night NUMERIC(10,2) NOT NULL CHECK (rate_per_night >= 0),
  weekend_rate   NUMERIC(10,2) CHECK (weekend_rate >= 0),
  capacity       INT           NOT NULL CHECK (capacity > 0),
  active         BOOLEAN       NOT NULL DEFAULT TRUE
);

-- Entrance fees (per guest, optionally per session) and rental items
CREATE TABLE IF NOT EXISTS rates (
  id             SERIAL PRIMARY KEY,
  kind           VARCHAR(10)   NOT NULL CHECK (kind IN ('entrance', 'rental')),
  name           VARCHAR(80)   NOT NULL,
  session        VARCHAR(10)   CHECK (session IN ('morning', 'afternoon', 'night')),
  amount         NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  weekend_amount NUMERIC(10,2) CHECK (weekend_amount >= 0),
  active         BOOLEAN       NOT NULL DEFAULT TRUE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_rates_kind_name ON rates (kind, name, COALESCE(session, ''));

CREATE TABLE IF NOT EXISTS settings (
  key   VARCHAR(50) PRIMARY KEY,
  value TEXT        NOT NULL
);

CREATE TABLE IF NOT EXISTS guest_counts (
  id          SERIAL PRIMARY KEY,
  count_date  DATE          NOT NULL,
  session     VARCHAR(10)   NOT NULL CHECK (session IN ('morning', 'afternoon', 'night')),
  guests      INT           NOT NULL CHECK (guests > 0),
  fee_total   NUMERIC(10,2) NOT NULL DEFAULT 0,
  recorded_by INT REFERENCES users (id),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_guest_counts_date ON guest_counts (count_date, session);

CREATE TABLE IF NOT EXISTS reservations (
  id         SERIAL PRIMARY KEY,
  guest_id   INT         NOT NULL REFERENCES guests (id),
  type       VARCHAR(20) NOT NULL CHECK (type IN ('day_cottage', 'overnight_cottage', 'room')),
  cottage_id INT REFERENCES cottages (id),
  room_id    INT REFERENCES rooms (id),
  check_in   DATE        NOT NULL,
  check_out  DATE        NOT NULL,
  session    VARCHAR(10) CHECK (session IN ('morning', 'afternoon', 'night')),
  status     VARCHAR(12) NOT NULL DEFAULT 'reserved'
             CHECK (status IN ('reserved', 'checked_in', 'checked_out', 'cancelled')),
  base_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_by INT REFERENCES users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_reservation_unit CHECK (
    (type = 'room' AND room_id IS NOT NULL AND cottage_id IS NULL) OR
    (type <> 'room' AND cottage_id IS NOT NULL AND room_id IS NULL)
  ),
  CONSTRAINT chk_reservation_dates CHECK (
    (type = 'day_cottage' AND check_out = check_in AND session IS NOT NULL) OR
    (type <> 'day_cottage' AND check_out > check_in AND session IS NULL)
  )
);
-- Last line of defence against two day-use bookings of the same cottage, date and session
CREATE UNIQUE INDEX IF NOT EXISTS uq_day_cottage_slot
  ON reservations (cottage_id, check_in, session)
  WHERE type = 'day_cottage' AND status IN ('reserved', 'checked_in');
CREATE INDEX IF NOT EXISTS idx_reservations_cottage ON reservations (cottage_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_room ON reservations (room_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_guest ON reservations (guest_id);

CREATE TABLE IF NOT EXISTS rentals (
  id             SERIAL PRIMARY KEY,
  reservation_id INT           NOT NULL REFERENCES reservations (id) ON DELETE CASCADE,
  rate_id        INT REFERENCES rates (id),
  item_name      VARCHAR(80)   NOT NULL,
  quantity       INT           NOT NULL CHECK (quantity > 0),
  unit_price     NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  amount         NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rentals_reservation ON rentals (reservation_id);

CREATE TABLE IF NOT EXISTS payments (
  id              SERIAL PRIMARY KEY,
  reservation_id  INT           NOT NULL REFERENCES reservations (id),
  amount          NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  method          VARCHAR(15)   NOT NULL CHECK (method IN ('cash', 'gcash', 'bank_transfer')),
  reference_no    VARCHAR(60),
  amount_tendered NUMERIC(10,2),
  paid_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  received_by     INT REFERENCES users (id)
);
CREATE INDEX IF NOT EXISTS idx_payments_reservation ON payments (reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments (paid_at);

ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;

-- Guest categories (SRS 1.3: kid, adult, or senior/PWD).
-- Optional: an entrance rate or a guest count with no category applies to every guest.
ALTER TABLE rates ADD COLUMN IF NOT EXISTS category VARCHAR(12) CHECK (category IN ('adult', 'kid', 'senior_pwd'));
ALTER TABLE guest_counts ADD COLUMN IF NOT EXISTS category VARCHAR(12) CHECK (category IN ('adult', 'kid', 'senior_pwd'));
DROP INDEX IF EXISTS uq_rates_kind_name;
CREATE UNIQUE INDEX IF NOT EXISTS uq_rates_kind_name_slot
  ON rates (kind, name, COALESCE(session, ''), COALESCE(category, ''));

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'cashier', 'guest'));