import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminStatCard } from "../../components/admin/AdminStatCard";
import { Button } from "../../components/common/Button";
import { Loading } from "../../components/common/Loading";
import { useReservations } from "../../hooks/useReservations";
import { guestService } from "../../services/guestService";
import { reportService } from "../../services/reportService";
import { formatCurrency, formatPesoExact } from "../../utils/currencyUtils";
import { addDaysISO, getTodayISO } from "../../utils/dateUtils";
const ReportsAnalytics = () => {
  const { accommodations, reservations, payments, loading } = useReservations();
  const [guestCounts, setGuestCounts] = useState([]);
  const today = getTodayISO();
  const [startDate, setStartDate] = useState(addDaysISO(today, -30));
  const [endDate, setEndDate] = useState(addDaysISO(today, 30));
  useEffect(() => {
    guestService.getGuestCounts().then(setGuestCounts).catch(() => {
    });
  }, []);
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      if (startDate && r.checkInDate < startDate) return false;
      if (endDate && r.checkInDate > endDate) return false;
      return true;
    });
  }, [reservations, startDate, endDate]);
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const d = p.createdAt.split("T")[0];
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [payments, startDate, endDate]);
  const guestSummary = useMemo(
    () => reportService.summarizeGuestCounts(guestCounts, startDate, endDate),
    [guestCounts, startDate, endDate]
  );
  const categoryRevenue = useMemo(
    () => reportService.buildCategoryRevenue(filteredReservations),
    [filteredReservations]
  );
  const salesSeries = useMemo(
    () => reportService.buildDailyRevenueSeries(filteredPayments, 10),
    [filteredPayments]
  );
  const metrics = useMemo(() => {
    const approvedSales = filteredPayments.filter((p) => p.status === "Approved").reduce((s, p) => s + p.amount, 0);
    const pendingSales = filteredPayments.filter((p) => p.status === "Pending Verification").reduce((s, p) => s + p.amount, 0);
    const activeBookings = filteredReservations.filter(
      (r) => !["Cancelled", "Rejected"].includes(r.status)
    );
    const roomsTotal = accommodations.filter((a) => a.category === "Room").length || 1;
    const cottagesTotal = accommodations.filter((a) => a.category === "Cottage" || a.category === "Umbrella").length || 1;
    const bookedRoomIds = new Set(
      activeBookings.filter((r) => r.accommodationCategory === "Room").map((r) => r.accommodationId)
    );
    const bookedCottageIds = new Set(
      activeBookings.filter((r) => r.accommodationCategory === "Cottage" || r.accommodationCategory === "Umbrella").map((r) => r.accommodationId)
    );
    return {
      approvedSales,
      pendingSales,
      bookingCount: activeBookings.length,
      roomOccupancyPct: Math.round(bookedRoomIds.size / roomsTotal * 100),
      cottageOccupancyPct: Math.round(bookedCottageIds.size / cottagesTotal * 100)
    };
  }, [filteredPayments, filteredReservations, accommodations]);
  if (loading) return <Loading />;
  return <div className="space-y-6">
      <div className="no-print">
        <AdminPageHeader
    title="Reports & Analytics"
    subtitle="Generate date-range sales reports, occupancy metrics, walk-in guest counts, and payment breakdowns."
    action={<Button onClick={() => window.print()}>
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </Button>}
  />
      </div>

      {
    /* Date Range Controls */
  }
      <div className="bg-white border border-[#DCE5E3] rounded-xl p-4 flex flex-wrap items-end gap-4 no-print">
        <div>
          <label className="block text-xs font-medium text-[#2A3B39] mb-1">Start Date</label>
          <input
    type="date"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
    className="min-h-[38px] px-3 py-1.5 text-sm border border-[#DCE5E3] rounded-lg tabular-nums"
  />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2A3B39] mb-1">End Date</label>
          <input
    type="date"
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
    className="min-h-[38px] px-3 py-1.5 text-sm border border-[#DCE5E3] rounded-lg tabular-nums"
  />
        </div>
        <Button
    type="button"
    variant="outline"
    onClick={() => {
      setStartDate(addDaysISO(today, -30));
      setEndDate(addDaysISO(today, 30));
    }}
  >
          Reset Range
        </Button>
      </div>

      {
    /* KPI Strip */
  }
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
    label="Approved Sales"
    value={formatPesoExact(metrics.approvedSales)}
    helper={`Pending verification: ${formatPesoExact(metrics.pendingSales)}`}
  />
        <AdminStatCard
    label="Active Bookings in Range"
    value={metrics.bookingCount}
  />
        <AdminStatCard
    label="Room Utilization"
    value={`${metrics.roomOccupancyPct}%`}
    helper={`Cottage utilization: ${metrics.cottageOccupancyPct}%`}
  />
        <AdminStatCard
    label="Walk-In Guests Logged"
    value={guestSummary.total}
    helper={`Kids ${guestSummary.kids} · Adults ${guestSummary.adults} · Senior/PWD ${guestSummary.seniorPwd}`}
  />
      </div>

      {
    /* Charts */
  }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#DCE5E3] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[#152423] mb-4">Daily Collected Revenue</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEC" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5A6D6B" }} />
                <YAxis tick={{ fontSize: 11, fill: "#5A6D6B" }} />
                <Tooltip formatter={(val) => [formatCurrency(Number(val), true), "Revenue"]} />
                <Bar dataKey="revenue" fill="#143E3B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-[#DCE5E3] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[#152423] mb-4">Revenue by Accommodation Category</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEC" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#5A6D6B" }} />
                <YAxis tick={{ fontSize: 11, fill: "#5A6D6B" }} />
                <Tooltip formatter={(val) => [formatCurrency(Number(val), true), "Amount"]} />
                <Bar dataKey="totalValue" name="Booked Value" fill="#2A6E67" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" name="Collected" fill="#143E3B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {
    /* Breakdown Table */
  }
      <div className="bg-white border border-[#DCE5E3] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8EEEC]">
          <h2 className="text-sm font-semibold text-[#152423]">Category Performance Summary</h2>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F7FAF9] border-b border-[#E8EEEC] text-[#435654]">
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold text-right">Bookings</th>
              <th className="px-4 py-3 font-semibold text-right">Booked Value</th>
              <th className="px-4 py-3 font-semibold text-right">Collected Payments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F1]">
            {categoryRevenue.map((row) => <tr key={row.category}>
                <td className="px-4 py-3 font-medium text-[#152423]">{row.category}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.bookings}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatPesoExact(row.totalValue)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-[#143E3B]">
                  {formatPesoExact(row.collected)}
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
};
export {
  ReportsAnalytics
};
