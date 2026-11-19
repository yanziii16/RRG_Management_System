function getTodayISO() {
  const now = /* @__PURE__ */ new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 6e4);
  return local.toISOString().split("T")[0];
}
function addDaysISO(dateStr, days) {
  const d = /* @__PURE__ */ new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = (/* @__PURE__ */ new Date(`${checkIn}T12:00:00`)).getTime();
  const end = (/* @__PURE__ */ new Date(`${checkOut}T12:00:00`)).getTime();
  const diff = Math.round((end - start) / (1e3 * 60 * 60 * 24));
  return Math.max(0, diff);
}
function formatDateDisplay(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}
function formatDateTimeDisplay(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function datesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}
export {
  addDaysISO,
  calculateNights,
  datesOverlap,
  formatDateDisplay,
  formatDateTimeDisplay,
  getTodayISO
};
