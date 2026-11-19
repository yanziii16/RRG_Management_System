const reportService = {
  buildDailyRevenueSeries(payments, days = 7) {
    const approved = payments.filter((p) => p.status === "Approved");
    const result = [];
    const today = /* @__PURE__ */ new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const dayPayments = approved.filter((p) => p.createdAt.startsWith(iso));
      const revenue = dayPayments.reduce((sum, p) => sum + p.amount, 0);
      result.push({
        date: iso,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: Math.round(revenue * 100) / 100,
        count: dayPayments.length
      });
    }
    return result;
  },
  buildStatusBreakdown(reservations) {
    const counts = {
      Pending: 0,
      Confirmed: 0,
      "Checked-In": 0,
      Completed: 0,
      Cancelled: 0,
      Rejected: 0
    };
    reservations.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  },
  buildCategoryRevenue(reservations) {
    const categories = ["Room", "Cottage", "Umbrella"];
    return categories.map((category) => {
      const items = reservations.filter(
        (r) => r.accommodationCategory === category && !["Cancelled", "Rejected"].includes(r.status)
      );
      return {
        category,
        bookings: items.length,
        totalValue: items.reduce((sum, r) => sum + r.totalAmount, 0),
        collected: items.reduce((sum, r) => sum + r.amountPaid, 0)
      };
    });
  },
  summarizeGuestCounts(records, startDate, endDate) {
    const filtered = records.filter((r) => {
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;
      return true;
    });
    return {
      records: filtered,
      kids: filtered.reduce((s, r) => s + r.kids, 0),
      adults: filtered.reduce((s, r) => s + r.adults, 0),
      seniorPwd: filtered.reduce((s, r) => s + r.seniorPwd, 0),
      total: filtered.reduce((s, r) => s + r.total, 0)
    };
  }
};
export {
  reportService
};
