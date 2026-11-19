import { useMemo, useState } from "react";
import { Eye, Plus, Check, X } from "lucide-react";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminStatCard } from "../../components/admin/AdminStatCard";
import { Button } from "../../components/common/Button";
import { DataTable } from "../../components/common/DataTable";
import { Input } from "../../components/common/Input";
import { Loading } from "../../components/common/Loading";
import { Modal } from "../../components/common/Modal";
import { SearchBar } from "../../components/common/SearchBar";
import { Select } from "../../components/common/Select";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useNotification } from "../../context/NotificationContext";
import { useReservations } from "../../hooks/useReservations";
import { extractErrorMessage } from "../../services/api";
import { reservationService } from "../../services/reservationService";
import { formatPesoExact } from "../../utils/currencyUtils";
import { addDaysISO, formatDateDisplay, getTodayISO } from "../../utils/dateUtils";
const ReservationManagement = () => {
  const { accommodations, reservations, rentals, loading, refreshAll } = useReservations();
  const { notify } = useNotification();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const today = getTodayISO();
  const [newAccId, setNewAccId] = useState("");
  const [newStayType, setNewStayType] = useState("overnight");
  const [newCheckIn, setNewCheckIn] = useState(today);
  const [newCheckOut, setNewCheckOut] = useState(addDaysISO(today, 1));
  const [newSession, setNewSession] = useState("Morning");
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestEmail, setNewGuestEmail] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");
  const [newGuestCount, setNewGuestCount] = useState("2");
  const [creating, setCreating] = useState(false);
  const [addRentalId, setAddRentalId] = useState("");
  const [addRentalQty, setAddRentalQty] = useState("1");
  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      if (statusFilter !== "All" && r.status !== statusFilter) return false;
      if (dateFilter && r.checkInDate !== dateFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return r.referenceNumber.toLowerCase().includes(q) || r.guestName.toLowerCase().includes(q) || r.accommodationName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [reservations, statusFilter, dateFilter, search]);
  const handleStatusChange = async (id, nextStatus) => {
    setUpdatingId(id);
    try {
      const updated = await reservationService.updateStatus(id, nextStatus);
      await refreshAll();
      if (selected?.id === id) setSelected(updated);
      notify(`Reservation updated to ${nextStatus}.`, "success");
    } catch (err) {
      notify(extractErrorMessage(err, "Could not update status."), "error");
    } finally {
      setUpdatingId(null);
    }
  };
  const handleCreateReservation = async (e) => {
    e.preventDefault();
    const accId = newAccId || accommodations[0]?.id;
    if (!accId || !newGuestName.trim() || !newGuestEmail.trim()) {
      notify("Please fill guest details and accommodation.", "error");
      return;
    }
    setCreating(true);
    try {
      const created = await reservationService.create({
        accommodationId: accId,
        stayType: newStayType,
        checkInDate: newCheckIn,
        checkOutDate: newStayType === "day_use" ? newCheckIn : newCheckOut,
        session: newStayType === "day_use" ? newSession : void 0,
        guestName: newGuestName.trim(),
        guestEmail: newGuestEmail.trim(),
        guestPhone: newGuestPhone.trim() || "+63 900 000 0000",
        guestCount: Number(newGuestCount) || 1,
        autoConfirm: true
      });
      await refreshAll();
      setCreateOpen(false);
      setNewGuestName("");
      setNewGuestEmail("");
      setNewGuestPhone("");
      notify(`Reservation ${created.referenceNumber} created.`, "success");
    } catch (err) {
      notify(extractErrorMessage(err, "Conflict or invalid booking parameters."), "error");
    } finally {
      setCreating(false);
    }
  };
  const handleAddRentalToReservation = async () => {
    if (!selected) return;
    const rentalId = addRentalId || rentals[0]?.id;
    const qty = Math.max(1, Number(addRentalQty) || 1);
    if (!rentalId) return;
    const existingRentals = selected.rentals.map((r) => ({
      rentalId: r.rentalId,
      quantity: r.quantity
    }));
    const idx = existingRentals.findIndex((x) => x.rentalId === rentalId);
    if (idx >= 0) {
      existingRentals[idx].quantity += qty;
    } else {
      existingRentals.push({ rentalId, quantity: qty });
    }
    try {
      const updated = await reservationService.updateRentals(selected.id, existingRentals);
      await refreshAll();
      setSelected(updated);
      notify("Rental added to reservation.", "success");
    } catch (err) {
      notify(extractErrorMessage(err, "Failed to add rental."), "error");
    }
  };
  const columns = [
    {
      key: "ref",
      header: "Reference",
      render: (r) => <span className="font-mono-num text-xs font-semibold">{r.referenceNumber}</span>
    },
    {
      key: "guest",
      header: "Guest",
      render: (r) => <div className="text-xs">
          <p className="font-medium text-[#152423]">{r.guestName}</p>
          <p className="text-[#5A6D6B]">{r.guestPhone}</p>
        </div>
    },
    {
      key: "accommodation",
      header: "Accommodation",
      render: (r) => <div className="text-xs">
          <p className="font-medium">{r.accommodationName}</p>
          <p className="text-[#5A6D6B]">
            {r.stayType === "overnight" ? "Overnight" : `Day Use (${r.session})`} · {r.guestCount} guests
          </p>
        </div>
    },
    {
      key: "schedule",
      header: "Dates",
      render: (r) => <span className="text-xs tabular-nums">
          {r.stayType === "overnight" ? `${formatDateDisplay(r.checkInDate)} → ${formatDateDisplay(r.checkOutDate)}` : formatDateDisplay(r.checkInDate)}
        </span>
    },
    {
      key: "balance",
      header: "Total / Balance",
      align: "right",
      render: (r) => <div className="text-xs tabular-nums">
          <p className="font-semibold">{formatPesoExact(r.totalAmount)}</p>
          <p className={r.balance > 0 ? "text-amber-800" : "text-emerald-800"}>
            Bal: {formatPesoExact(r.balance)}
          </p>
        </div>
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (r) => <div className="inline-flex items-center gap-1.5">
          {r.status === "Pending" && <>
              <button
        type="button"
        disabled={updatingId === r.id}
        onClick={() => handleStatusChange(r.id, "Confirmed")}
        title="Approve reservation"
        className="p-1.5 rounded-lg border border-emerald-200 text-emerald-800 hover:bg-emerald-50 cursor-pointer"
      >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
        type="button"
        disabled={updatingId === r.id}
        onClick={() => handleStatusChange(r.id, "Rejected")}
        title="Reject reservation"
        className="p-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 cursor-pointer"
      >
                <X className="w-3.5 h-3.5" />
              </button>
            </>}
          <button
        type="button"
        onClick={() => setSelected(r)}
        title="Inspect reservation"
        className="p-1.5 rounded-lg border border-[#DCE5E3] text-[#152423] hover:bg-[#F5F8F7] cursor-pointer"
      >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
    }
  ];
  return <div className="space-y-6">
      <AdminPageHeader
    title="Reservation Management"
    subtitle="Review guest bookings, approve or reject requests, prevent schedule conflicts, and manage check-ins."
    action={<Button
      onClick={() => {
        setNewAccId(accommodations[0]?.id || "");
        setCreateOpen(true);
      }}
    >
            <Plus className="w-4 h-4" />
            <span>Add Reservation</span>
          </Button>}
  />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="All Reservations" value={reservations.length} />
        <AdminStatCard
    label="Pending Review"
    value={reservations.filter((r) => r.status === "Pending").length}
  />
        <AdminStatCard
    label="Confirmed / Checked-In"
    value={reservations.filter((r) => ["Confirmed", "Checked-In"].includes(r.status)).length}
  />
        <AdminStatCard
    label="Cancelled / Rejected"
    value={reservations.filter((r) => ["Cancelled", "Rejected"].includes(r.status)).length}
  />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
    value={search}
    onChange={setSearch}
    placeholder="Search reference, guest, or accommodation..."
    className="flex-1 max-w-md"
  />
        <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="min-h-[40px] px-3 py-2 text-sm bg-white border border-[#DCE5E3] rounded-lg"
  >
          <option value="All">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Checked-In">Checked-In</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Rejected">Rejected</option>
        </select>
        <input
    type="date"
    value={dateFilter}
    onChange={(e) => setDateFilter(e.target.value)}
    className="min-h-[40px] px-3 py-2 text-sm bg-white border border-[#DCE5E3] rounded-lg tabular-nums"
  />
        {dateFilter && <Button type="button" variant="outline" onClick={() => setDateFilter("")}>
            Clear Date
          </Button>}
      </div>

      {loading ? <Loading /> : <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} />}

      {
    /* Inspect & Update Reservation Modal */
  }
      <Modal
    open={Boolean(selected)}
    onClose={() => setSelected(null)}
    title={`Reservation Details — ${selected?.referenceNumber || ""}`}
    subtitle={selected?.guestName}
    maxWidth="xl"
  >
        {selected && <div className="space-y-6 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-[#F7FAF9] border border-[#E8EEEC] text-xs">
              <div className="space-y-1">
                <p className="text-[#5A6D6B]">Accommodation</p>
                <p className="font-semibold text-[#152423]">{selected.accommodationName}</p>
                <p className="text-[#435654]">
                  {selected.stayType === "overnight" ? `${formatDateDisplay(selected.checkInDate)} → ${formatDateDisplay(selected.checkOutDate)} (${selected.nights} nights)` : `${formatDateDisplay(selected.checkInDate)} · ${selected.session} session`}
                </p>
                <p className="text-[#435654]">Guests: {selected.guestCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[#5A6D6B]">Guest Information</p>
                <p className="font-semibold text-[#152423]">{selected.guestName}</p>
                <p className="text-[#435654]">{selected.guestEmail}</p>
                <p className="text-[#435654] tabular-nums">{selected.guestPhone}</p>
              </div>
            </div>

            {
    /* Update Status */
  }
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF2F1] pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#5A6D6B]">Status:</span>
                <StatusBadge status={selected.status} />
                <StatusBadge status={selected.paymentStatus} />
              </div>
              <div className="flex flex-wrap gap-2">
                {["Pending", "Confirmed", "Checked-In", "Completed", "Cancelled", "Rejected"].map(
    (st) => <Button
      key={st}
      type="button"
      size="sm"
      variant={selected.status === st ? "primary" : "outline"}
      disabled={updatingId === selected.id || selected.status === st}
      onClick={() => handleStatusChange(selected.id, st)}
    >
                      {st}
                    </Button>
  )}
              </div>
            </div>

            {
    /* Rentals Attached */
  }
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-[#152423]">Rentals & Add-ons</h3>
              {selected.rentals.length === 0 ? <p className="text-xs text-[#5A6D6B]">No rentals attached to this reservation.</p> : <div className="space-y-1.5 text-xs">
                  {selected.rentals.map((ren) => <div key={ren.rentalId} className="flex justify-between">
                      <span>
                        {ren.name} × {ren.quantity}
                      </span>
                      <span className="font-medium tabular-nums">
                        {formatPesoExact(ren.subtotal)}
                      </span>
                    </div>)}
                </div>}

              <div className="flex flex-wrap items-end gap-2 pt-2">
                <div className="flex-1 min-w-[180px]">
                  <Select
    label="Add rental item"
    value={addRentalId || rentals[0]?.id || ""}
    onChange={(e) => setAddRentalId(e.target.value)}
    options={rentals.map((r) => ({
      value: r.id,
      label: `${r.name} (${formatPesoExact(r.price)})`
    }))}
  />
                </div>
                <div className="w-24">
                  <Input
    label="Qty"
    type="number"
    min={1}
    value={addRentalQty}
    onChange={(e) => setAddRentalQty(e.target.value)}
  />
                </div>
                <Button type="button" variant="secondary" onClick={handleAddRentalToReservation}>
                  Add Rental
                </Button>
              </div>
            </div>

            {
    /* Financial Summary */
  }
            <div className="border-t border-[#EEF2F1] pt-4 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#5A6D6B]">Accommodation + Rentals + Fee</span>
                <span className="font-semibold tabular-nums">
                  {formatPesoExact(selected.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6D6B]">Approved Payments</span>
                <span className="font-semibold text-emerald-800 tabular-nums">
                  {formatPesoExact(selected.amountPaid)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#143E3B] pt-1">
                <span>Remaining Balance</span>
                <span className="tabular-nums">{formatPesoExact(selected.balance)}</span>
              </div>
            </div>
          </div>}
      </Modal>

      {
    /* Manual Walk-In Reservation Modal */
  }
      <Modal
    open={createOpen}
    onClose={() => setCreateOpen(false)}
    title="Add Reservation (Walk-In / Phone)"
    maxWidth="lg"
  >
        <form onSubmit={handleCreateReservation} className="space-y-4">
          <Select
    label="Accommodation"
    value={newAccId || accommodations[0]?.id || ""}
    onChange={(e) => {
      const id = e.target.value;
      setNewAccId(id);
      const found = accommodations.find((a) => a.id === id);
      if (found?.bookingMode === "day_use") setNewStayType("day_use");
      else if (found?.bookingMode === "overnight") setNewStayType("overnight");
    }}
    options={accommodations.map((a) => ({
      value: a.id,
      label: `${a.name} (${a.category} · Max ${a.capacity})`
    }))}
  />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
    label="Stay type"
    value={newStayType}
    onChange={(e) => setNewStayType(e.target.value)}
    options={[
      { value: "overnight", label: "Overnight" },
      { value: "day_use", label: "Day Use" }
    ]}
  />
            <Input
    label={newStayType === "day_use" ? "Visit date" : "Check-in"}
    type="date"
    required
    value={newCheckIn}
    onChange={(e) => setNewCheckIn(e.target.value)}
  />
            {newStayType === "overnight" ? <Input
    label="Check-out"
    type="date"
    required
    value={newCheckOut}
    onChange={(e) => setNewCheckOut(e.target.value)}
  /> : <Select
    label="Session"
    value={newSession}
    onChange={(e) => setNewSession(e.target.value)}
    options={[
      { value: "Morning", label: "Morning" },
      { value: "Afternoon", label: "Afternoon" },
      { value: "Night", label: "Night" }
    ]}
  />}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
    label="Guest full name"
    required
    value={newGuestName}
    onChange={(e) => setNewGuestName(e.target.value)}
  />
            <Input
    label="Guest email"
    type="email"
    required
    value={newGuestEmail}
    onChange={(e) => setNewGuestEmail(e.target.value)}
  />
            <Input
    label="Phone"
    value={newGuestPhone}
    onChange={(e) => setNewGuestPhone(e.target.value)}
  />
            <Input
    label="Number of guests"
    type="number"
    min={1}
    value={newGuestCount}
    onChange={(e) => setNewGuestCount(e.target.value)}
  />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Create & Confirm
            </Button>
          </div>
        </form>
      </Modal>
    </div>;
};
export {
  ReservationManagement
};
