function formatCurrency(amount, showDecimals = false) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 2
  }).format(safe);
}
function formatPesoExact(amount) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `₱${safe.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}
export {
  formatCurrency,
  formatPesoExact
};
