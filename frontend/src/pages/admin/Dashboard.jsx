import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { DataTable } from "../../components/common/DataTable";
import { Loading } from "../../components/common/Loading";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useReservations } from "../../hooks/useReservations";
import { guestService } from "../../services/guestService";
import { reportService } from "../../services/reportService";
import { formatCurrency } from "../../utils/currencyUtils";
import { formatDateDisplay, getTodayISO } from "../../utils/dateUtils";
const Dashboard = () => {
  const { accommodations, reservations, payments, loading } = useReservations();
  const [guestCounts, setGuestCounts] = useState([]);
  useEffect(() => {
    guestService.getGuestCounts().then(setGuestCounts).catch(() => {
    });
  }, []);
  const today = getTodayISO();
  const stats = useMemo(() => {
    const walkInToday = guestCounts.filter((g) => g.date === today).reduce((sum, g) => sum + g.total, 0);
    const reservedGuestsToday = reservations.filter(
      (r) => ["Confirmed", "Checked-In"].includes(r.status) && r.checkInDate <= today && r.checkOutDate >= today
    ).reduce((sum, r) => sum + r.guestCount, 0);
    const rooms = accommodations.filter((a) => a.category === "Room");
    const cottages = accommodations.filter(
      (a) => a.category === "Cottage" || a.category === "Umbrella"
    );
    const activeTodayIds = new Set(
      reservations.filter(
        (r) => ["Confirmed", "Checked-In"].includes(r.status) && r.checkInDate <= today && r.checkOutDate >= today
      ).map((r) => r.accommodationId)
    );
    const occupiedRooms = rooms.filter(
      (r) => r.status === "Occupied" || activeTodayIds.has(r.id)
    ).length;
    const availableRooms = Math.max(0, rooms.length - occupiedRooms);
    const occupiedCottages = cottages.filter(
      (c) => c.status === "Occupied" || activeTodayIds.has(c.id)
    ).length;
    const availableCottages = Math.max(0, cottages.length - occupiedCottages);
    const dailyIncome = payments.filter((p) => p.status === "Approved" && p.createdAt.startsWith(today)).reduce((sum, p) => sum + p.amount, 0);
    const pendingPayments = payments.filter((p) => p.status === "Pending Verification").length;
    return {
      totalGuestsToday: walkInToday + reservedGuestsToday,
      walkInToday,
      totalReservations: reservations.length,
      availableCottages,
      occupiedCottages,
      availableRooms,
      occupiedRooms,
      dailyIncome,
      pendingPayments
    };
  }, [accommodations, reservations, payments, guestCounts, today]);
  const salesSeries = useMemo(() => reportService.buildDailyRevenueSeries(payments, 7), [payments]);
  const statusSeries = useMemo(() => reportService.buildStatusBreakdown(reservations), [reservations]);
  const recentCols = [
    {
      key: "ref",
      header: "Reference",
      render: (r) => <span className="font-mono-num text-xs font-medium">{r.referenceNumber}</span>
    },
    {
      key: "guest",
      header: "Guest",
      render: (r) => <div>
          <p className="font-medium text-[#152423] text-xs">{r.guestName}</p>
          <p className="text-[11px] text-[#5A6D6B]">{r.guestEmail}</p>
        </div>
    },
    {
      key: "acc",
      header: "Accommodation",
      render: (r) => <span className="text-xs">{r.accommodationName}</span>
    },
    {
      key: "dates",
      header: "Schedule",
      render: (r) => <span className="text-xs tabular-nums">
          {r.stayType === "overnight" ? `${formatDateDisplay(r.checkInDate)} – ${formatDateDisplay(r.checkOutDate)}` : `${formatDateDisplay(r.checkInDate)} (${r.session})`}
        </span>
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (r) => <span className="text-xs font-semibold">{formatCurrency(r.totalAmount, true)}</span>
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />
    },
    {
      key: "payment",
      header: "Payment",
      render: (r) => <StatusBadge status={r.paymentStatus} />
    }
  ];
  if (loading) return <Loading message="Loading dashboard metrics..." />;
  return <div className="space-y-6">
      <AdminPageHeader
    title="Dashboard"
    subtitle="Live overview of Luckystar Resort reservations, occupancy, guest counts, and revenue."
    action={<Link
      to="/admin/reservations"
      className="px-4 py-2 text-xs font-medium text-white bg-[#143E3B] rounded-lg hover:bg-[#0E2E2B]"
    >
            Manage Reservations
          </Link>}
  />

      {
    /* Primary KPI Grid */
  }
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
    label="Total Guests Today"
    value={stats.totalGuestsToday}
    helper={`${stats.walkInToday} walk-in entrance recorded`}
  />
        <AdminStatCard
    label="Total Reservations"
    value={stats.totalReservations}
    helper={`${reservations.filter((r) => r.status === "Pending").length} pending approval`}
  />
        <AdminStatCard
    label="Daily Income (Approved)"
    value={formatCurrency(stats.dailyIncome, true)}
    helper={`${stats.pendingPayments} payment proof(s) awaiting review`}
  />
        <AdminStatCard
    label="Pending Payment Proofs"
    value={stats.pendingPayments}
    helper="Requires admin verification"
  />
      </div>

      {
    /* Occupancy Row */
  }
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Available Rooms" value={stats.availableRooms} />
        <AdminStatCard label="Occupied Rooms" value={stats.occupiedRooms} />
        <AdminStatCard label="Available Cottages & Umbrellas" value={stats.availableCottages} />
        <AdminStatCard label="Occupied Cottages & Umbrellas" value={stats.occupiedCottages} />
      </div>

      {
    /* Charts */
  }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#DCE5E3] rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[#152423]">Sales Summary (Last 7 Days)</h2>
            <p className="text-xs text-[#5A6D6B]">Approved payments collected per day</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEC" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5A6D6B" }} />
                <YAxis tick={{ fontSize: 11, fill: "#5A6D6B" }} />
                <Tooltip
    formatter={(value) => [formatCurrency(Number(value), true), "Revenue"]}
  />
                <Bar dataKey="revenue" fill="#143E3B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-[#DCE5E3] rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[#152423]">Reservation Overview</h2>
            <p className="text-xs text-[#5A6D6B]">Current booking distribution by status</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEC" />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: "#5A6D6B" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#5A6D6B" }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2A6E67" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {
    /* Recent Reservations */
  }
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#152423]">Recent Reservations</h2>
          <Link to="/admin/reservations" className="text-xs font-medium text-[#143E3B] hover:underline">
            View all reservations
          </Link>
        </div>
        <DataTable
    columns={recentCols}
    data={reservations.slice(0, 6)}
    rowKey={(r) => r.id}
  />
      </div>
    </div>;
};
export {
  Dashboard
};
