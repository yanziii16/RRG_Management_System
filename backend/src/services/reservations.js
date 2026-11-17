const { pool, withTransaction } = require('../db');
const { badRequest, notFound, conflict } = require('../utils/errors');
const { todayManila } = require('../utils/dates');
const { pickRate, nightsTotal, computeBalance, round2 } = require('../utils/pricing');

const CHECK_IN_TIME = '14:00'; // 2:00 PM (FR-30)
const CHECK_OUT_TIME = '12:00'; // 12:00 NN the next day (FR-30)

const BASE_SELECT = `
  SELECT r.id, r.type, r.status, r.check_in, r.check_out, r.session, r.base_total, r.created_at,
         r.guest_id, g.full_name AS guest_name, g.contact_number,
         r.cottage_id, c.name AS cottage_name, r.room_id, rm.room_number,
         COALESCE((SELECT SUM(amount) FROM rentals  WHERE reservation_id = r.id), 0) AS rentals_total,
         COALESCE((SELECT SUM(amount) FROM payments WHERE reservation_id = r.id), 0) AS paid_total
  FROM reservations r
  JOIN guests g ON g.id = r.guest_id
  LEFT JOIN cottages c ON c.id = r.cottage_id
  LEFT JOIN rooms rm ON rm.id = r.room_id`;

// Adds the computed fields: unit name, total, balance, and check-in/out times for overnight stays
function present(row) {
  const total = round2(row.base_total + row.rentals_total);
  const overnight = row.type !== 'day_cottage';
  return {
    ...row,
    unit_name: row.type === 'room' ? `Room ${row.room_number}` : row.cottage_name,
    total,
    balance: computeBalance(total, row.paid_total),
    check_in_time: overnight ? CHECK_IN_TIME : null,
    check_out_time: overnight ? CHECK_OUT_TIME : null,
  };
}

async function getReservation(id, db = pool) {
  const { rows } = await db.query(`${BASE_SELECT} WHERE r.id = $1`, [id]);
  return rows[0] ? present(rows[0]) : null;
}

async function listReservations({ date, status, type, guest_id }) {
  const where = [];
  const values = [];
  const add = (sql, value) => {
    values.push(value);
    where.push(sql.replaceAll('?', `$${values.length}`));
  };
  if (date) add('(r.check_in <= ?::date AND r.check_out >= ?::date)', date);
  if (status) add('r.status = ?', status);
  if (type) add('r.type = ?', type);
  if (guest_id) add('r.guest_id = ?', guest_id);
  const sql = `${BASE_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY r.check_in DESC, r.id DESC LIMIT 500`;
  const { rows } = await pool.query(sql, values);
  return rows.map(present);
}

// Finds an active reservation that blocks the requested cottage or room (FR-10, FR-28).
// Cancelled and checked-out reservations never block.
async function findConflict(client, input) {
  const active = "status IN ('reserved', 'checked_in')";
  if (input.type === 'day_cottage') {
    const { rows } = await client.query(
      `SELECT id FROM reservations
       WHERE cottage_id = $1 AND ${active}
         AND ((type = 'day_cottage' AND check_in = $2::date AND session = $3)
           OR (type = 'overnight_cottage' AND $2::date >= check_in AND $2::date < check_out))
       LIMIT 1`,
      [input.cottage_id, input.date, input.session]
    );
    return rows[0];
  }
  if (input.type === 'overnight_cottage') {
    const { rows } = await client.query(
      `SELECT id FROM reservations
       WHERE cottage_id = $1 AND ${active}
         AND ((type = 'overnight_cottage' AND check_in < $3::date AND check_out > $2::date)
           OR (type = 'day_cottage' AND check_in >= $2::date AND check_in < $3::date))
       LIMIT 1`,
      [input.cottage_id, input.check_in, input.check_out]
    );
    return rows[0];
  }
  const { rows } = await client.query(
    `SELECT id FROM reservations
     WHERE room_id = $1 AND ${active} AND check_in < $3::date AND check_out > $2::date
     LIMIT 1`,
    [input.room_id, input.check_in, input.check_out]
  );
  return rows[0];
}

const CONFLICT_MESSAGE = {
  day_cottage: 'This cottage is already booked for that date and session',
  overnight_cottage: 'This cottage is already booked for some of those dates',
  room: 'This room is already booked for some of those dates',
};

// Creates a day-use cottage, overnight cottage, or room reservation.
// The cottage/room row is locked first, so 20 simultaneous requests for one slot create exactly 1 reservation (NFR-07).
async function createReservation(input, userId) {
  const today = todayManila();
  const checkIn = input.type === 'day_cottage' ? input.date : input.check_in;
  const checkOut = input.type === 'day_cottage' ? input.date : input.check_out;
  if (checkIn < today) throw badRequest('The date cannot be in the past');

  return withTransaction(async (client) => {
    const guest = await client.query('SELECT id FROM guests WHERE id = $1', [input.guest_id]);
    if (!guest.rows[0]) throw notFound('Guest not found');

    let unit;
    if (input.type === 'room') {
      unit = (await client.query('SELECT * FROM rooms WHERE id = $1 FOR UPDATE', [input.room_id])).rows[0];
      if (!unit) throw notFound('Room not found');
    } else {
      unit = (await client.query('SELECT * FROM cottages WHERE id = $1 FOR UPDATE', [input.cottage_id])).rows[0];
      if (!unit) throw notFound('Cottage not found');
    }
    if (!unit.active) throw conflict('This cottage or room is not in service');

    if (await findConflict(client, input)) throw conflict(CONFLICT_MESSAGE[input.type]);

    let baseTotal;
    if (input.type === 'day_cottage') baseTotal = pickRate(unit.rate, unit.weekend_rate, checkIn);
    else if (input.type === 'overnight_cottage') baseTotal = nightsTotal(unit.rate, unit.weekend_rate, checkIn, checkOut);
    else baseTotal = nightsTotal(unit.rate_per_night, unit.weekend_rate, checkIn, checkOut);

    const { rows } = await client.query(
      `INSERT INTO reservations (guest_id, type, cottage_id, room_id, check_in, check_out, session, base_total, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        input.guest_id,
        input.type,
        input.type === 'room' ? null : input.cottage_id,
        input.type === 'room' ? input.room_id : null,
        checkIn,
        checkOut,
        input.type === 'day_cottage' ? input.session : null,
        baseTotal,
        userId,
      ]
    );
    return getReservation(rows[0].id, client);
  });
}

// Status rules (FR-11, FR-12, FR-31). Each returns the next status or throws.
const RULES = {
  cancel(r) {
    if (r.status === 'checked_in') throw conflict('A checked-in reservation cannot be cancelled');
    if (r.status === 'checked_out') throw conflict('A checked-out reservation cannot be cancelled');
    if (r.status === 'cancelled') throw conflict('Reservation is already cancelled');
    return 'cancelled';
  },
  checkin(r) {
    if (r.status === 'checked_in') throw conflict('Reservation is already checked in');
    if (r.status !== 'reserved') throw conflict(`A ${r.status.replace('_', ' ')} reservation cannot be checked in`);
    if (r.check_in !== todayManila()) throw conflict('Check-in is only allowed on the reservation date');
    return 'checked_in';
  },
  checkout(r) {
    if (r.type === 'day_cottage') throw conflict('Only overnight reservations are checked out');
    if (r.status === 'checked_out') throw conflict('Reservation is already checked out');
    if (r.status !== 'checked_in') throw conflict('Reservation has not been checked in');
    return 'checked_out';
  },
};

async function changeStatus(id, action) {
  return withTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM reservations WHERE id = $1 FOR UPDATE', [id]);
    if (!rows[0]) throw notFound('Reservation not found');
    const next = RULES[action](rows[0]);
    await client.query('UPDATE reservations SET status = $1 WHERE id = $2', [next, id]);
    return getReservation(id, client);
  });
}

module.exports = { getReservation, listReservations, createReservation, changeStatus };