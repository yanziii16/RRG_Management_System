const TZ = 'Asia/Manila';
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// "Today" in Philippine time as YYYY-MM-DD
const todayManila = () => formatter.format(new Date());

const isValidDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const addDays = (value, days) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

// Every night of a stay: [checkIn, checkOut)
const eachNight = (checkIn, checkOut) => {
  const nights = [];
  for (let day = checkIn; day < checkOut; day = addDays(day, 1)) nights.push(day);
  return nights;
};

const isWeekend = (value) => {
  const day = new Date(`${value}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
};

module.exports = { todayManila, isValidDate, addDays, eachNight, isWeekend };