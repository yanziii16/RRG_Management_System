-- Luckystar Resort Reservation and Guest Management System
-- PostgreSQL Database Schema (Strictly TWO user roles: ADMIN and GUEST)

CREATE TYPE user_role AS ENUM ('ADMIN', 'GUEST');
CREATE TYPE accommodation_category AS ENUM ('Room', 'Cottage', 'Umbrella');
CREATE TYPE booking_mode AS ENUM ('overnight', 'day_use', 'both');
CREATE TYPE day_use_session AS ENUM ('Morning', 'Afternoon', 'Night');
CREATE TYPE reservation_status AS ENUM ('Pending', 'Confirmed', 'Checked-In', 'Completed', 'Cancelled', 'Rejected');
CREATE TYPE payment_status AS ENUM ('Unpaid', 'Pending Verification', 'Partially Paid', 'Paid');
CREATE TYPE payment_verification_status AS ENUM ('Pending Verification', 'Approved', 'Rejected');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  phone VARCHAR(40) NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'GUEST',
  address TEXT,
  avatar_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  category accommodation_category NOT NULL,
  booking_mode booking_mode NOT NULL DEFAULT 'overnight',
  description TEXT NOT NULL,
  capacity INT NOT NULL CHECK (capacity > 0),
  beds VARCHAR(120),
  rate_per_night NUMERIC(10, 2) NOT NULL DEFAULT 0,
  rate_morning NUMERIC(10, 2) NOT NULL DEFAULT 0,
  rate_afternoon NUMERIC(10, 2) NOT NULL DEFAULT 0,
  rate_night NUMERIC(10, 2) NOT NULL DEFAULT 0,
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(30) NOT NULL DEFAULT 'Available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  category VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  operating_hours VARCHAR(100) NOT NULL,
  capacity INT,
  rate_note VARCHAR(160),
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_available BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(150) NOT NULL,
  category VARCHAR(60) NOT NULL,
  caption TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  available_quantity INT NOT NULL DEFAULT 0,
  unit_label VARCHAR(40) NOT NULL DEFAULT 'per day',
  is_available BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number VARCHAR(30) UNIQUE NOT NULL,
  guest_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE RESTRICT,
  stay_type VARCHAR(20) NOT NULL CHECK (stay_type IN ('overnight', 'day_use')),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  session day_use_session,
  nights INT NOT NULL DEFAULT 0,
  guest_count INT NOT NULL CHECK (guest_count > 0),
  base_amount NUMERIC(10, 2) NOT NULL,
  rentals_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  service_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  balance NUMERIC(10, 2) NOT NULL,
  special_requests TEXT,
  status reservation_status NOT NULL DEFAULT 'Pending',
  payment_status payment_status NOT NULL DEFAULT 'Unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reservation_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number VARCHAR(40) UNIQUE NOT NULL,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  payment_type VARCHAR(40) NOT NULL,
  method VARCHAR(40) NOT NULL,
  reference_code VARCHAR(80),
  proof_image_url TEXT,
  notes TEXT,
  status payment_verification_status NOT NULL DEFAULT 'Pending Verification',
  recorded_by_role user_role NOT NULL,
  verified_by VARCHAR(150),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

CREATE TABLE guest_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_date DATE NOT NULL,
  session day_use_session NOT NULL,
  kids INT NOT NULL DEFAULT 0,
  adults INT NOT NULL DEFAULT 0,
  senior_pwd INT NOT NULL DEFAULT 0,
  total INT GENERATED ALWAYS AS (kids + adults + senior_pwd) STORED,
  notes TEXT,
  recorded_by VARCHAR(150) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE resort_settings (
  id INT PRIMARY KEY DEFAULT 1,
  settings_json JSONB NOT NULL
);
