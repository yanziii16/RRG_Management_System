import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/common/Button";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { EmptyState, Loading } from "../../components/common/Loading";
import { SafeImage } from "../../components/common/SafeImage";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useNotification } from "../../context/NotificationContext";
import { useReservations } from "../../hooks/useReservations";
import { extractErrorMessage } from "../../services/api";
import { reservationService } from "../../services/reservationService";
import { formatPesoExact } from "../../utils/currencyUtils";
import { formatDateDisplay, formatDateTimeDisplay } from "../../utils/dateUtils";
const MyReservations = () => {
  const { reservations, payments, accommodations, loading, refreshAll } = useReservations();
  const { notify } = useNotification();
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedId, setSelectedId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const filtered = useMemo(() => {
    if (filterStatus === "All") return reservations;
    if (filterStatus === "Confirmed") {
      return reservations.filter((r) => ["Confirmed", "Checked-In", "Completed"].includes(r.status));
    }
    if (filterStatus === "Cancelled") {
      return reservations.filter((r) => ["Cancelled", "Rejected"].includes(r.status));
    }
    return reservations.filter((r) => r.status === filterStatus);
  }, [reservations, filterStatus]);
  const activeReservation = useMemo(() => {
    if (selectedId) {
      const found = filtered.find((r) => r.id === selectedId);
      if (found) return found;
    }
    return filtered[0] || null;
  }, [filtered, selectedId]);
  const activePayments = useMemo(() => {
    if (!activeReservation) return [];
    return payments.filter((p) => p.reservationId === activeReservation.id);
  }, [payments, activeReservation]);
  const handleCancelReservation = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await reservationService.updateStatus(cancelTarget, "Cancelled");
      await refreshAll();
      notify("Reservation cancelled.", "info");
    } catch (err) {
      notify(extractErrorMessage(err, "Unable to cancel reservation."), "error");
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  };
  if (loading) return <Loading message="Loading your reservations..." />;
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-medium text-[#5A6D6B]">My Account</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-[#152423] tracking-tight">
            My Reservations
          </h1>
          <p className="mt-1 text-sm text-[#5A6D6B]">
            Track your upcoming stays, submit payment proof, and review verification updates.
          </p>
        </div>

        <Link
    to="/accommodations"
    className="px-4 py-2 text-sm font-medium text-white bg-[#143E3B] rounded-lg hover:bg-[#0E2E2B] whitespace-nowrap shrink-0 w-fit"
  >
          New Reservation
        </Link>
      </div>

      {
    /* Filter Tabs */
  }
      <div className="mb-6 flex flex-wrap items-center gap-1.5 p-1 bg-[#E9F0EE] rounded-lg w-fit">
        {["All", "Pending", "Confirmed", "Cancelled"].map((tab) => <button
    key={tab}
    type="button"
    onClick={() => setFilterStatus(tab)}
    className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${filterStatus === tab ? "bg-white text-[#143E3B] shadow-sm" : "text-[#435654] hover:text-[#152423]"}`}
  >
            {tab}
          </button>)}
      </div>

      {filtered.length === 0 ? <EmptyState
    title="No reservations found"
    description="You do not have any reservations matching this filter yet."
    action={<Link
      to="/accommodations"
      className="px-4 py-2 text-xs font-medium text-white bg-[#143E3B] rounded-lg"
    >
              Browse Accommodations
            </Link>}
  /> : <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {
    /* Left list */
  }
          <div className="lg:col-span-7 space-y-4">
            {filtered.map((res) => {
    const acc = accommodations.find((a) => a.id === res.accommodationId);
    const isSelected = activeReservation?.id === res.id;
    return <div
      key={res.id}
      className={`bg-white border rounded-xl p-4 transition-colors ${isSelected ? "border-[#143E3B]" : "border-[#DCE5E3]"}`}
    >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden bg-[#EDF3F1] shrink-0">
                      <SafeImage
      src={acc?.images[0]}
      fallbackTitle={res.accommodationName}
      alt={res.accommodationName}
      className="w-full h-full object-cover"
    />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-mono-num text-[#5A6D6B]">
                          {res.referenceNumber}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={res.status} />
                          <StatusBadge status={res.paymentStatus} />
                        </div>
                      </div>
                      <h3 className="mt-1 text-base font-semibold text-[#152423]">
                        {res.accommodationName}
                      </h3>
                      <p className="text-xs text-[#5A6D6B] mt-0.5 tabular-nums">
                        {res.stayType === "overnight" ? `${formatDateDisplay(res.checkInDate)} → ${formatDateDisplay(res.checkOutDate)} · ${res.nights} night(s)` : `${formatDateDisplay(res.checkInDate)} · ${res.session} session`}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[#152423] tabular-nums">
                          {formatPesoExact(res.totalAmount)}
                          {res.balance > 0 && <span className="ml-2 text-xs font-normal text-amber-800">
                              (Balance: {formatPesoExact(res.balance)})
                            </span>}
                        </p>
                        <Button
      type="button"
      size="sm"
      variant={isSelected ? "primary" : "outline"}
      onClick={() => setSelectedId(res.id)}
    >
                          {isSelected ? "Viewing Details" : "View Details"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>;
  })}
          </div>

          {
    /* Right detail panel */
  }
          {activeReservation && <div className="lg:col-span-5 bg-white border border-[#DCE5E3] rounded-xl p-6 space-y-5 lg:sticky lg:top-24">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-mono-num text-[#5A6D6B]">
                    {activeReservation.referenceNumber}
                  </p>
                  <h2 className="text-lg font-semibold text-[#152423]">
                    {activeReservation.accommodationName}
                  </h2>
                </div>
                <StatusBadge status={activeReservation.status} />
              </div>

              <div className="border-t border-[#EEF2F1] pt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#5A6D6B]">Stay type</span>
                  <span className="font-medium text-[#152423]">
                    {activeReservation.stayType === "overnight" ? "Overnight" : `Day-Use (${activeReservation.session})`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6D6B]">Dates</span>
                  <span className="font-medium text-[#152423] tabular-nums">
                    {activeReservation.stayType === "overnight" ? `${formatDateDisplay(activeReservation.checkInDate)} – ${formatDateDisplay(activeReservation.checkOutDate)}` : formatDateDisplay(activeReservation.checkInDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6D6B]">Guests</span>
                  <span className="font-medium text-[#152423] tabular-nums">
                    {activeReservation.guestCount}
                  </span>
                </div>
                {activeReservation.specialRequests && <div className="pt-1">
                    <span className="text-[#5A6D6B] block">Special requests:</span>
                    <p className="text-[#152423] mt-0.5">{activeReservation.specialRequests}</p>
                  </div>}
              </div>

              <div className="border-t border-[#EEF2F1] pt-4 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#5A6D6B]">Total charges</span>
                  <span className="font-medium tabular-nums">
                    {formatPesoExact(activeReservation.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6D6B]">Verified paid</span>
                  <span className="font-medium text-emerald-800 tabular-nums">
                    {formatPesoExact(activeReservation.amountPaid)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#DCE5E3] text-sm font-bold text-[#143E3B]">
                  <span>Remaining Balance</span>
                  <span className="tabular-nums">
                    {formatPesoExact(activeReservation.balance)}
                  </span>
                </div>
              </div>

              {
    /* Payment submissions for this reservation */
  }
              <div className="border-t border-[#EEF2F1] pt-4 space-y-2.5">
                <h3 className="text-xs font-semibold text-[#152423]">Payment submissions</h3>
                {activePayments.length === 0 ? <p className="text-xs text-[#5A6D6B]">No payments submitted yet.</p> : <div className="space-y-2">
                    {activePayments.map((p) => <div
    key={p.id}
    className="p-2.5 rounded-lg bg-[#F7FAF9] border border-[#E8EEEC] text-xs flex items-center justify-between gap-2"
  >
                        <div>
                          <p className="font-medium text-[#152423] tabular-nums">
                            {formatPesoExact(p.amount)} · {p.method}
                          </p>
                          <p className="text-[11px] text-[#5A6D6B]">
                            {formatDateTimeDisplay(p.createdAt)}
                          </p>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>)}
                  </div>}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {activeReservation.balance > 0 && !["Cancelled", "Rejected"].includes(activeReservation.status) && <Link
    to={`/payment/${activeReservation.id}`}
    className="w-full py-2.5 px-4 text-center text-sm font-medium text-white bg-[#143E3B] rounded-lg hover:bg-[#0E2E2B] transition-colors"
  >
                      Submit Payment Proof
                    </Link>}

                {["Pending", "Confirmed"].includes(activeReservation.status) && <Button
    type="button"
    variant="outline"
    onClick={() => setCancelTarget(activeReservation.id)}
    className="w-full text-red-700 border-red-200 hover:bg-red-50"
  >
                    Cancel Reservation
                  </Button>}
              </div>
            </div>}
        </div>}

      <ConfirmDialog
    open={Boolean(cancelTarget)}
    onClose={() => setCancelTarget(null)}
    onConfirm={handleCancelReservation}
    loading={cancelling}
    title="Cancel reservation?"
    message="Are you sure you want to cancel this reservation? Cancelled dates and sessions will become available to other guests."
    confirmLabel="Yes, Cancel Reservation"
  />
    </div>;
};
export {
  MyReservations
};
