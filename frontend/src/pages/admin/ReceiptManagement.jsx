import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { Button } from "../../components/common/Button";
import { EmptyState, Loading } from "../../components/common/Loading";
import { SearchBar } from "../../components/common/SearchBar";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useReservations } from "../../hooks/useReservations";
import { formatPesoExact } from "../../utils/currencyUtils";
import { formatDateDisplay, formatDateTimeDisplay } from "../../utils/dateUtils";
const ReceiptManagement = () => {
  const { reservations, payments, settings, loading } = useReservations();
  const [search, setSearch] = useState("");
  const [selectedResId, setSelectedResId] = useState(null);
  const filteredReservations = useMemo(() => {
    if (!search.trim()) return reservations;
    const q = search.toLowerCase();
    return reservations.filter(
      (r) => r.referenceNumber.toLowerCase().includes(q) || r.guestName.toLowerCase().includes(q) || r.accommodationName.toLowerCase().includes(q)
    );
  }, [reservations, search]);
  const activeReservation = useMemo(() => {
    if (selectedResId) {
      const found = filteredReservations.find((r) => r.id === selectedResId);
      if (found) return found;
    }
    return filteredReservations[0] || null;
  }, [filteredReservations, selectedResId]);
  const activePayments = useMemo(() => {
    if (!activeReservation) return [];
    return payments.filter((p) => p.reservationId === activeReservation.id);
  }, [payments, activeReservation]);
  if (loading) return <Loading />;
  return <div className="space-y-6">
      <div className="no-print">
        <AdminPageHeader
    title="Receipt Management"
    subtitle="Generate and print official reservation receipts with guest details, itemized charges, and payment history."
    action={activeReservation ? <Button onClick={() => window.print()}>
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </Button> : void 0}
  />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {
    /* Left Reservation Picker */
  }
        <div className="lg:col-span-4 space-y-3 no-print">
          <SearchBar
    value={search}
    onChange={setSearch}
    placeholder="Find reservation or guest..."
  />
          <div className="bg-white border border-[#DCE5E3] rounded-xl divide-y divide-[#EEF2F1] max-h-[600px] overflow-y-auto">
            {filteredReservations.length === 0 ? <p className="p-4 text-xs text-[#5A6D6B]">No matching reservations.</p> : filteredReservations.map((r) => <button
    key={r.id}
    type="button"
    onClick={() => setSelectedResId(r.id)}
    className={`w-full text-left p-3.5 transition-colors cursor-pointer ${activeReservation?.id === r.id ? "bg-[#EDF3F1]" : "hover:bg-[#F7FAF9]"}`}
  >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono-num font-semibold text-[#143E3B]">
                      {r.referenceNumber}
                    </span>
                    <StatusBadge status={r.paymentStatus} />
                  </div>
                  <p className="mt-1 text-xs font-medium text-[#152423]">{r.guestName}</p>
                  <p className="text-[11px] text-[#5A6D6B]">
                    {r.accommodationName} · {formatPesoExact(r.totalAmount)}
                  </p>
                </button>)}
          </div>
        </div>

        {
    /* Right Printable Official Receipt */
  }
        <div className="lg:col-span-8">
          {!activeReservation ? <EmptyState title="Select a reservation to view its receipt" /> : <div className="bg-white border border-[#DCE5E3] rounded-xl p-6 sm:p-8 print-container space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#DCE5E3] pb-5">
                <div>
                  <h2 className="text-xl font-bold text-[#143E3B] uppercase tracking-tight">
                    {settings.resortName}
                  </h2>
                  <p className="text-xs text-[#5A6D6B] mt-0.5">{settings.address}</p>
                  <p className="text-xs text-[#5A6D6B] tabular-nums">
                    {settings.phone} · {settings.email}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs font-medium text-[#5A6D6B]">OFFICIAL RESERVATION RECEIPT</p>
                  <p className="text-lg font-bold font-mono-num text-[#152423]">
                    {activeReservation.referenceNumber}
                  </p>
                  <p className="text-xs text-[#5A6D6B] tabular-nums">
                    Issued: {formatDateDisplay((/* @__PURE__ */ new Date()).toISOString().split("T")[0])}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-[#F7FAF9] border border-[#E8EEEC] space-y-1">
                  <p className="font-semibold text-[#152423]">Billed Guest</p>
                  <p className="text-sm font-medium text-[#152423]">{activeReservation.guestName}</p>
                  <p className="text-[#5A6D6B]">{activeReservation.guestEmail}</p>
                  <p className="text-[#5A6D6B] tabular-nums">{activeReservation.guestPhone}</p>
                </div>
                <div className="p-3.5 rounded-lg bg-[#F7FAF9] border border-[#E8EEEC] space-y-1">
                  <p className="font-semibold text-[#152423]">Accommodation & Schedule</p>
                  <p className="text-sm font-medium text-[#152423]">
                    {activeReservation.accommodationName}
                  </p>
                  <p className="text-[#5A6D6B] tabular-nums">
                    {activeReservation.stayType === "overnight" ? `${formatDateDisplay(activeReservation.checkInDate)} → ${formatDateDisplay(activeReservation.checkOutDate)} (${activeReservation.nights} night(s))` : `${formatDateDisplay(activeReservation.checkInDate)} · ${activeReservation.session} Session`}
                  </p>
                  <p className="text-[#5A6D6B]">Guests: {activeReservation.guestCount}</p>
                </div>
              </div>

              {
    /* Charges Table */
  }
              <div>
                <h3 className="text-xs font-semibold text-[#152423] mb-2">Itemized Charges</h3>
                <table className="w-full text-xs border border-[#DCE5E3] rounded-lg overflow-hidden">
                  <thead className="bg-[#F7FAF9] border-b border-[#DCE5E3]">
                    <tr>
                      <th className="px-3.5 py-2.5 text-left font-semibold">Description</th>
                      <th className="px-3.5 py-2.5 text-right font-semibold">Qty</th>
                      <th className="px-3.5 py-2.5 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2F1]">
                    <tr>
                      <td className="px-3.5 py-2.5">
                        {activeReservation.accommodationName} (
                        {activeReservation.stayType === "overnight" ? `${activeReservation.nights} night(s)` : `${activeReservation.session} day-use`}
                        )
                      </td>
                      <td className="px-3.5 py-2.5 text-right tabular-nums">
                        {activeReservation.stayType === "overnight" ? activeReservation.nights : 1}
                      </td>
                      <td className="px-3.5 py-2.5 text-right tabular-nums font-medium">
                        {formatPesoExact(activeReservation.baseAmount)}
                      </td>
                    </tr>
                    {activeReservation.rentals.map((ren) => <tr key={ren.rentalId}>
                        <td className="px-3.5 py-2.5">{ren.name}</td>
                        <td className="px-3.5 py-2.5 text-right tabular-nums">{ren.quantity}</td>
                        <td className="px-3.5 py-2.5 text-right tabular-nums font-medium">
                          {formatPesoExact(ren.subtotal)}
                        </td>
                      </tr>)}
                    <tr>
                      <td className="px-3.5 py-2.5">Resort & Service Fee</td>
                      <td className="px-3.5 py-2.5 text-right">1</td>
                      <td className="px-3.5 py-2.5 text-right tabular-nums font-medium">
                        {formatPesoExact(activeReservation.serviceFee)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {
    /* Payment History */
  }
              <div>
                <h3 className="text-xs font-semibold text-[#152423] mb-2">Payment History</h3>
                {activePayments.length === 0 ? <p className="text-xs text-[#5A6D6B]">No payments recorded for this reservation.</p> : <table className="w-full text-xs border border-[#DCE5E3]">
                    <thead className="bg-[#F7FAF9] border-b border-[#DCE5E3]">
                      <tr>
                        <th className="px-3.5 py-2 text-left font-semibold">Receipt #</th>
                        <th className="px-3.5 py-2 text-left font-semibold">Method</th>
                        <th className="px-3.5 py-2 text-left font-semibold">Date</th>
                        <th className="px-3.5 py-2 text-left font-semibold">Status</th>
                        <th className="px-3.5 py-2 text-right font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF2F1]">
                      {activePayments.map((p) => <tr key={p.id}>
                          <td className="px-3.5 py-2 font-mono-num">{p.receiptNumber}</td>
                          <td className="px-3.5 py-2">
                            {p.method} ({p.paymentType})
                          </td>
                          <td className="px-3.5 py-2 tabular-nums">
                            {formatDateTimeDisplay(p.createdAt)}
                          </td>
                          <td className="px-3.5 py-2">{p.status}</td>
                          <td className="px-3.5 py-2 text-right tabular-nums font-medium">
                            {formatPesoExact(p.amount)}
                          </td>
                        </tr>)}
                    </tbody>
                  </table>}
              </div>

              {
    /* Totals */
  }
              <div className="border-t border-[#DCE5E3] pt-4 flex flex-col items-end space-y-1 text-sm">
                <div className="w-full max-w-xs flex justify-between text-xs">
                  <span className="text-[#5A6D6B]">Total Reservation Amount</span>
                  <span className="font-semibold tabular-nums">
                    {formatPesoExact(activeReservation.totalAmount)}
                  </span>
                </div>
                <div className="w-full max-w-xs flex justify-between text-xs">
                  <span className="text-[#5A6D6B]">Total Approved Paid</span>
                  <span className="font-semibold text-emerald-800 tabular-nums">
                    {formatPesoExact(activeReservation.amountPaid)}
                  </span>
                </div>
                <div className="w-full max-w-xs flex justify-between pt-2 border-t border-[#DCE5E3] text-base font-bold text-[#143E3B]">
                  <span>Remaining Balance</span>
                  <span className="tabular-nums">{formatPesoExact(activeReservation.balance)}</span>
                </div>
              </div>
            </div>}
        </div>
      </div>
    </div>;
};
export {
  ReceiptManagement
};
