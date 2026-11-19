import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { EmptyState, Loading } from "../../components/common/Loading";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useReservations } from "../../hooks/useReservations";
import { reservationService } from "../../services/reservationService";
import { formatPesoExact } from "../../utils/currencyUtils";
import { formatDateDisplay } from "../../utils/dateUtils";
const BookingConfirmation = () => {
  const { id } = useParams();
  const { settings } = useReservations();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    reservationService.getById(id).then(setReservation).catch(() => setReservation(null)).finally(() => setLoading(false));
  }, [id]);
  if (loading) return <Loading message="Loading reservation confirmation..." />;
  if (!reservation) {
    return <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
      title="Reservation not found"
      description="We could not locate this reservation record."
      action={<Link to="/my-reservations" className="text-sm font-medium text-[#143E3B] underline">
              Go to My Reservations
            </Link>}
    />
      </div>;
  }
  return <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-white border border-[#DCE5E3] rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EEF2F1] pb-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-[#5A6D6B]">Reservation Reference</p>
              <h1 className="text-xl sm:text-2xl font-bold text-[#152423] font-mono-num">
                {reservation.referenceNumber}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={reservation.status} />
            <StatusBadge status={reservation.paymentStatus} />
          </div>
        </div>

        <p className="text-sm text-[#435654]">
          Thank you, <strong>{reservation.guestName}</strong>. Your reservation has been logged in our system. To verify your booking, please submit your down payment or full payment proof for Admin verification.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-[#F7FAF9] border border-[#E8EEEC] text-sm">
          <div>
            <p className="text-xs text-[#5A6D6B]">Accommodation</p>
            <p className="font-semibold text-[#152423] mt-0.5">{reservation.accommodationName}</p>
            <p className="text-xs text-[#5A6D6B]">
              {reservation.accommodationCategory} · {reservation.guestCount} guests
            </p>
          </div>
          <div>
            <p className="text-xs text-[#5A6D6B]">Schedule</p>
            {reservation.stayType === "overnight" ? <>
                <p className="font-semibold text-[#152423] mt-0.5 tabular-nums">
                  {formatDateDisplay(reservation.checkInDate)} → {formatDateDisplay(reservation.checkOutDate)}
                </p>
                <p className="text-xs text-[#5A6D6B]">
                  {reservation.nights} night(s) · Check-in {settings.checkInTime} / Check-out {settings.checkOutTime}
                </p>
              </> : <>
                <p className="font-semibold text-[#152423] mt-0.5 tabular-nums">
                  {formatDateDisplay(reservation.checkInDate)} ({reservation.session} Session)
                </p>
                <p className="text-xs text-[#5A6D6B]">
                  {reservation.session ? settings.dayUseHours[reservation.session] : "Day Use"}
                </p>
              </>}
          </div>
        </div>

        <div className="space-y-2 text-sm border-t border-[#EEF2F1] pt-4">
          <div className="flex justify-between">
            <span className="text-[#5A6D6B]">Accommodation charge</span>
            <span className="tabular-nums font-medium">{formatPesoExact(reservation.baseAmount)}</span>
          </div>
          {reservation.rentals.map((r) => <div key={r.rentalId} className="flex justify-between">
              <span className="text-[#5A6D6B]">
                {r.name} × {r.quantity}
              </span>
              <span className="tabular-nums font-medium">{formatPesoExact(r.subtotal)}</span>
            </div>)}
          <div className="flex justify-between">
            <span className="text-[#5A6D6B]">Service & resort fee</span>
            <span className="tabular-nums font-medium">{formatPesoExact(reservation.serviceFee)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-[#DCE5E3] text-base font-bold text-[#143E3B]">
            <span>Total Amount</span>
            <span className="tabular-nums">{formatPesoExact(reservation.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-xs text-[#5A6D6B]">
            <span>Remaining Balance</span>
            <span className="tabular-nums font-semibold text-[#152423]">
              {formatPesoExact(reservation.balance)}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {reservation.balance > 0 && <Link
    to={`/payment/${reservation.id}`}
    className="flex-1 py-2.5 px-4 text-center text-sm font-medium text-white bg-[#143E3B] rounded-lg hover:bg-[#0E2E2B] transition-colors"
  >
              Submit Payment Proof
            </Link>}
          <Link
    to="/my-reservations"
    className="flex-1 py-2.5 px-4 text-center text-sm font-medium text-[#152423] bg-white border border-[#DCE5E3] rounded-lg hover:bg-[#F5F8F7] transition-colors"
  >
            View My Reservations
          </Link>
        </div>
      </div>
    </div>;
};
export {
  BookingConfirmation
};
